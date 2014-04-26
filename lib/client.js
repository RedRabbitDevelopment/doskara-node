var Connection, Client, io, Q, utils;
Q = require('q');
io = require('socket.io-client');
Connection = require('./connection');
utils = require('../utils');

Client = module.exports = function(name) {
  this.name = name;
};
Client.prototype = {
  init: function() {
    var _this, readyDeferred;
    _this = this;
    readyDeferred = Q.defer();
    this.socket = io.connect(utils.getAddress(this.name));
    ['connect', 'connecting', 'disconnect', 'connect_failed', 'error', 'reconnect_failed'].forEach(function(method) {
      this.socket.on(method, console.log.bind(console, method));
    }, this);
    this.socket.on('methods', function(methods) {
      methods.forEach(function(method) {
        var clientFn = new ClientFunction(_this.socket, method);
        _this[method] = clientFn.call.bind(clientFn);
      });
      readyDeferred.resolve();
    });
    return this.ready = readyDeferred.promise;
  }
};
