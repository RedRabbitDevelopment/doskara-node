var Connection, uuid, Q, _;
uuid = require('node-uuid');
_ = require('lodash');
Q = require('q');

Connection = module.exports = function(socket, methods) {
  this.socket = socket;
  methods = methods || {};
  this.methods = _.transform(methods, function(methods, fn, methodName) {
    methods[methodName] = new ServerFunction(socket, methodName, fn);
  });
};

Connection.prototype = {
  transmitCall: function(method, args) {
    var clientFn = new ClientFunction(this.socket, method);
    return clientFn.call.apply(args);
  }
};

ClientFunction = function(socket, name) {
  this.socket = socket;
  this.name = name || uuid.v4();
};
ClientFunction.prototype = {
  call: function() {
    var deferred, serverFunction, _this, args;
    _this = this;
    args = [].slice.call(arguments, 0);
    deferred = Q.defer();
    callbackId = uuid.v4();
    this.socket.once(callbackId, 
      _this.interpretResponse.bind(this, deferred));
    this.socket.emit(this.name, {
      uuid: callbackId,
      args: this.getPreSendArgs(args)
    });
    return deferred.promise;
  },
  interpretResponse: function(deferred, data) {
    var method;
    if(data.success) {
      method = 'resolve';
    } else {
      method = 'reject';
    }
    deferred[method](data.response);
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
  callbackFunctionToObject: function(fn) {
    var serverFunction = new ServerFunction(this.socket, undefined, fn);
    return {
      _isCallback: true,
      id: serverFunction.name
    };
  }
};
ServerFunction = function(socket, name, fn) {
  this.socket = socket;
  this.name = name || uuid.v4();
  this.fn = fn;
  this.socket.on(this.name, this.receiveCall.bind(this));
};
ServerFunction.prototype = {
  callbackObjectToFunction: function(object) {
    var clientFunction = new ClientFunction(this.socket, object.id);
    return clientFunction.call.bind(clientFunction);
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
  receiveCall: function(data) {
    var _this = this;
    Q.fcall(function() {
      var args = _this.getPostReceiveArgs(data.args);
      return _this.fn.apply(_this, args);
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
