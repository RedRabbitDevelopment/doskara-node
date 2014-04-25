var Connection, uuid, Q, _;
uuid = require('node-uuid');
Callback = require('./callback');
_ = require('lodash');
Q = require('q');

Connection = module.exports = function(socket, methods) {
  this.socket = socket;
  this.methods = methods || {};
  this.callbacks = [];
  this.socket.listenToAll(this.onReceive.bind(this));
};

Connection.prototype = {
  buildMethod: function(name, fn) {
    this.methods[name] = fn;
  },
  callbackFunctionToObject: function(fn) {
    var callbackId = uuid.v4();
    this.buildMethod(callbackId, fn);
    return {
      _isCallback: true,
      id: callbackId
    };
  },
  callbackObjectToFunction: function(object) {
    return this.transmitCall.bind(this, object.id);
  },
  transmitCall: function(method, args) {
    var deferred, callbackId;
    deferred = Q.defer();
    callbackId = uuid.v4();
    this.callbacks[callbackId] = deferred;
    this.socket.emit(method, {
      uuid: callbackId,
      args: this.getPreSendArgs(args)
    });
    return deferred.promise;
  },
  getPreSendArgs: function(args) {
    args = args || [];
    return args.map(function(arg) {
      if(_.isFunction(arg)) {
        return this.callbackFunctionToObject(arg);
      } else {
        return arg;
      }
    }, this);
  },
  onReceive: function(method, data) {
    if(this.callbacks[method]) {
      this.interpretResponse(method, data);
    } else if(this.methods[method]) {
      this.receiveCall(method, data);
    } else {
      this.unknownMethodReceived(method, data);
    }
  },
  interpretResponse: function(uuid, data) {
    var method;
    if(data.success) {
      method = 'resolve';
    } else {
      method = 'reject';
    }
    this.callbacks[uuid][method](data.response);
  },
  getPostReceiveArgs: function(args) {
    args = args || [];
    return args.map(function(arg) {
      if(arg._isCallback) {
        return this.callbackObjectToFunction(arg);
      } else {
        return arg;
      }
    }, this);
  },
  receiveCall: function(method, data) {
    var _this = this;
    Q.fcall(function() {
      var args = _this.getPostReceiveArgs(data.args);
      return _this.methods[method].apply(_this, args);
    }).then(function(result) {
      return {
        success: true,
        response: result
      };
    }, function(err) {
      return {
        success: false,
        response: err
      };
    }).then(function(message) {
      _this.socket.emit(data.uuid, message);
    }).done();
  }
};
