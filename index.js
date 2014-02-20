
var http = require('http');
var Q = require('q');
var request = require('request');
var url = require('url');
var qs = require('querystring');
var Doskara = module.exports = {
  getUrl: function(e) {
    switch(e.module) {
      case 'project':
        return 'localhost:8090';
      case 'data-store':
        return 'localhost:8095';
      case 'transformer':
        return 'localhost:8099';
    }
  },
  getPath: function(e) {
    return e.path;
  },
  triggerEvent: function(event_name, data) {
    return this.trigger(this.getEvent(event_name), data);
  },
  getEvent: function(event_name) {
    switch(event_name) {
      case '404':
        return {
          type: 'html',
          path: '/404',
          module: 'project'
        };
      case 'GET:/':
        return {
          type: 'html',
          path: '/',
          module: 'project'
        };
      case 'GET:/getAll':
        return {
          type: 'json',
          name: 'getAll',
          module: 'data-store'
        };
      case 'POST:/':
        return {
          type: 'json',
          name: 'save',
          module: 'data-store'
        };
      case 'beforeSave':
        return {
          type: 'json',
          name: 'transform',
          module: 'transformer'
        }
     default:
       return null;
    }
  },
  ports: {},
  init: function() {
    this.ports.webfront = 8000;
    this.ports.proxy = 8090;
    this.ports.dataStore = 8095;
    this.ports.transformer = 8099;
  },
  trigger: function(e, data) {
    var deferred = Q.defer();
    var r = request({
      url: 'http://' + this.getUrl(e) + '/' + e.name,
      body: JSON.stringify({data: data}),
      method: 'post'
    },
      function(error, response, body) {
        deferred.resolve(JSON.parse(body).result);
      }    
    );
    return deferred.promise;
  },
  listen: function(port) {
    var _this = this;
    http.createServer(function(request, response) {
      var url_parts = url.parse(request.url, true);
      var path_name = url_parts.pathname.substring(1).replace('/', ':');
      if(request.method === 'POST' && _this.events[path_name]) {
        getBody(request).then(function(body) {
          Q.when(_this.events[path_name](body.data)).then(function(result) {
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.write(JSON.stringify({result: result}));
            response.end();
          });
        }).done();
      } else {
        response.writeHead(404)
        response.end();
      }
    }).listen(port);
  },
  events: {},
  on: function(event_name, callback) {
    this.events[event_name] = callback;
  }
};
function getBody(request) {
  return Q.fcall(function() {
    if(request.method === 'POST') {
      var deferred = Q.defer();
      var body = '';
      request.on('data', function(body_part) {
        body += body_part;
        if(body.length > 1e6) {
          body = '';
          response.writeHead(413, {'Content-Type': 'text/plain'}).end();
          request.connection.destroy();
        }
      });
      request.on('end', function() {
        deferred.resolve(JSON.parse(body));
      });
      return deferred.promise;
    }
    return;
  })
}
Doskara.init();
