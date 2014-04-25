
var http = require('http');
var Q = require('q');
var _ = require('lodash');
var config = require(process.cwd() + '/Doskara.json');
var sockets = require('socket.io');


var Doskara = module.exports = {
  init: function() {
    this.ports = config.ports || {};
    if(Object.keys(ports).length === 0)
      this.ports.main = 80;
    this.connections = this.getConnections();
  },
  getConnections: function() {
    var regex = /^(.*?)_PORT_(.*?)_TCP_ADDR$/;
    return _.filter(process.env, function(connections, value, key) {
      return key.match(value);
    });
  },
  createAlias: function(project_name) {
    return project_name.toUpperCase().replace(/-/g, '_');
  },
  createServer: function(config, port) {
    var _this = this;
    port = port || this.ports.main;
    this.io = sockets.listen(port);
    this.io.on('connection', function(socket) {
      socket.emit('methods', Object.keys(config));
      _.forEach(config, function(method, name) {
        socket.on(name, function(data) {
          var deferred, result, callback, args;
          args = _this.buildArgs(socket, data.args);
          deferred = Q.defer();
          result = method.apply(config, args);
          deferred.promise.then(function(response) {
            socket.emit(data.id, response);
          }).done();
        });
      });
    });
  },
  buildArgs: function(socket, args) {
    return args.map(function(value) {
      if(value && value._isCallable) {
        return function() {
          var deferred = Q.defer();

        };
      } else {
        return value;
      }
    });
  }
};
Doskara.init();
