
var Q = require('q');
var Doskara = module.exports = {
  getUrl: function(e) {
    return 'localhost:8090' +  e.path;
  },
  trigger: function(e, data) {
    var deferred = Q.defer();
    deferred.resolve({
      name: e.name,
      query: data.query,
      body: data.body
    });
    return deferred.promise;
  },
  getEvent: function(event_name) {
    switch(event_name) {
      case '404':
        return {
          type: 'html',
          path: '/404'
        };
      case 'GET:/':
        return {
          type: 'html',
          path: '/'
        };
      case 'GET:/getAll':
        return {
          type: 'json',
          name: 'getAll'
       };
      case 'POST:/':
        return {
          type: 'json',
          name: 'save'
       };
     default:
       return null;
    }
  },
  ports: {},
  init: function() {
    this.ports.webfront = 8000;
    this.ports.proxy = 8090;
  }
};
Doskara.init();
