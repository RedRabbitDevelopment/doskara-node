var Connection, Server, io, Q, _;
Connection = require('./connection');
io = require('socket.io');
Q = require('q');
_ = require('lodash');

Server = module.exports = function(methods) {
  this.methods = methods;
};

Server.prototype = {
  listen: function(port) {
    var deferred = Q.defer();
    this.io = io.listen(port, function() {
      deferred.resolve();
    });
    this.io.sockets.on('connection', this.makeConnection.bind(this));
    return deferred.promise;
  },
  makeConnection: function(socket) {
    var openConnections = _.map(this.methods, function(method, methodName) {
       return new ServerFunction(socket, methodName, method);
    }, this);
    socket.emit('methods', Object.keys(this.methods));
    // TODO: Clean up connections on socket close;
  },
  close: function() {
    var deferred = Q.defer();
    this.io.server.close(function() {
      deferred.resolve();
    });
    return deferred.promise;
  }
};
