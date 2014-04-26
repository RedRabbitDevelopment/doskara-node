var Server, assert, io, Client, utils;
Server = require('./server');
utils = require('./utils');
Client = require('./client');
assert = require('assert');
io = require('socket.io');

describe('Doskara Server', function() {
  var server, port, client;
  before(function() {
    port = 8000;
    process.env.TEST_SERVER_PORT_8000_TCP_ADDR = 'tcp://localhost:' + port;
    utils.init();
    server = new Server({
      getValue: function() {
        return this.a;
      },
      setValue: function(a) {
        this.a = a;
      }
    });
    this.timeout(5999);
    return server.listen(port).then(function() {
      client = new Client('test-server');
      client.init();
      return client.ready;
    });
  });
  after(function() {
    return server.close();
  });
  it('should have the methods set', function() {
    assert(client.getValue);
    assert(client.setValue);
  });
  it.only('should be able to set and get a value', function() {
    var value = 15;
    return client.setValue(value).then(function() {
      return client.getValue();
    }).then(function(setValue) {
      assert(value, setValue);
    });
  });
});

