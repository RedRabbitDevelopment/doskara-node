var Connection, assert;
assert = require('assert');
Connection = require('./connection');

describe('Socket Connection', function() {
  var socket1, socket2, MockSocket;
  MockSocket = function() {
    this.listeners = {};
  }
  MockSocket.prototype = {
    once: function(name, fn) {
      var _this = this;
      this.on(name, function() {
        delete _this.listeners[name];
        fn.apply(undefined, arguments);
      });
    },
    on: function(name, fn) {
      this.listeners[name] = fn;
    },
    emit: function(method, data) { 
      if(this.conn.listeners[method]) {
        this.conn.listeners[method](data);
      }
    },
    setConnection: function(otherSocket) {
      this.conn = otherSocket;
    }
  }
  beforeEach(function() {
    socket1 = new MockSocket();
    socket2 = new MockSocket();
    socket1.setConnection(socket2);
    socket2.setConnection(socket1);
  });
  describe('Send and Response', function() {
    it('should send and receive a response', function() {
      var connection1;
      connection1 = new Connection(socket1, {
        getValue: function() {
          return 5;
        }
      });
      connection2 = new Connection(socket2);
      return connection2.transmitCall('getValue').then(function(result) {
        assert.equal(result, 5);
      });
    });
    it('should send and receive a response with arguments', function() {
      var connection1;
      connection1 = new Connection(socket1, {
        getValue: function(a) {
          return a + 5;
        }
      });
      connection2 = new Connection(socket2);
      return connection2.transmitCall('getValue', [10]).then(function(result) {
        assert.equal(result, 15);
      });
    });
    it('should send and receive a response with a callback argument', function() {
      var connection1, connection2;
      connection1 = new Connection(socket1, {
        getValue: function(a) {
          return a().then(function(result) {
            return result + 5;
          });
        }
      });
      connection2 = new Connection(socket2);
      return connection2.transmitCall('getValue', [function() {
        return 5; 
      }]).then(function(result) {
        assert.equal(result, 10);
      });
    });
  });
});
