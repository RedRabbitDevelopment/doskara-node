
Doskara = require('../');
request = require('request');
assert = require('assert');
Q = require('q');

describe('Doskara connection', function() {
  describe('Triggering and catching', function() {
    var data, error;
    beforeEach(function(done) {
      Doskara.listen(8999, done);
    });
    function registerTest(returnVal, callback) {
      Doskara.on('test', function(d) {
        callback(d);
        return returnVal;
      });
    }
    function sendTest(data, callback) {
      request({
        url: 'http://localhost:8999/test',
        body: JSON.stringify({data: data}),
        method: 'POST'
      }, function(error, response, body) {
        try {
          callback(null, JSON.parse(body).result);
        } catch(e) {
          callback(e);
        }
      });
    }
    afterEach(function(done) {
      Doskara.stop(done);
    });
    it('should have receieved data', function(done) {
      registerTest('h', function(data) {
        try {
          assert.equal(data, 'g');
          done();
        } catch(e) {
          done(e);
        }
      });
      sendTest('g', function(returnVal) {});
    });
    it('should have a result', function(done) {
      registerTest('h', function(data) {});
      sendTest('g', function(error, returnVal) {
        if(error) {
          return done(error);
        }
        try {
          assert.equal(returnVal, 'h');
          done();
        } catch(e) {
          done(e);
        }
      });
    });
    it('should know how to deal with promises', function(done) {
      var deferred = Q.defer(), isDone = false;
      registerTest(deferred.promise, function() {});
      sendTest('g', function(error, returnVal) {
        if(error) return done(error);
        try {
          assert.ok(isDone);
          assert.equal(returnVal, 'bb');
          done();
        } catch(e) {
          done(e);
        }
      });
      setTimeout(function() {
        isDone = true;
        deferred.resolve('bb');
      }, 50);
    });
  });
});
