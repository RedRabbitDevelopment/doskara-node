var _, config, utils;
_ = require('lodash');

utils = module.exports = {
  init: function(config) {
    config = config || {};
    this.ports = config.ports || {};
    if(Object.keys(this.ports).length === 0)
      this.ports.main = 80;
    this.links = this.getLinks();
  },
  getLinks: function() {
    var regex = /^(.+?)_PORT_(.+?)_TCP_ADDR$/;
    return _.transform(process.env, function(links, value, key) {
      var matches;
      if(matches = key.match(regex)) {
        links[matches[1]] = value;
      }
    });
  },
  createAlias: function(project_name) {
    return project_name.toUpperCase().replace(/-/g, '_');
  },
  getAddress: function(project_name) {
    return this.links[this.createAlias(project_name)];
  }
};
utils.init();
