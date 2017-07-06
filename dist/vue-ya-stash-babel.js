'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function stashReducer(obj, keys) {
  return keys.reduce(function (pv, cv) {
    return pv[cv];
  }, obj);
}

var stashMixin = {
  beforeCreate: function beforeCreate() {
    var _this = this;

    // == If current instance is a  root instance
    if (this === this.$root) {
      console.log('this is root');
      console.log(this);
      if (!this.$options.data) this.$options.data = {};
      this.$options.data['$stash/store'] = this.$options.stashStore;
    }

    var stash = this.$root.$options.data['$stash/store'];
    // let stash = this.$root.$stash
    var options = this.$options.stash;

    if (options) {
      console.log(options);
      console.log(stash);
      console.log(this.$root);
    }

    if (stash === undefined) return;

    // == If there is no computed property, make object
    if (typeof this.$options.computed === 'undefined') {
      this.$options.computed = {};
    }

    // == If stash option is array, just use property:'property'
    if (Array.isArray(options)) {
      options.forEach(function (property) {
        // TODO if (stash[property]===undefined)
        // === computed
        _this.$options.computed[property] = function () {
          return stash[property];
        };
        // === update handler
        _this.$on('update:' + property, function (value) {
          return _this.$set(stash, property, value);
        });
        // === patch handler
        _this.$on('patch:' + property, function (obj, key, value) {
          _this.$set(obj, key, value); // === args = [obj, key, value]
        });
      });
      // == If stash option is object
    } else if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
      var _loop = function _loop() {
        var conf = options[key];
        var pathStr = '';

        if ((typeof conf === 'undefined' ? 'undefined' : _typeof(conf)) === 'object') {
          pathStr = conf['stash'] || key;
        } else {
          pathStr = conf;
        }

        // === CHECK format
        // FIXME: add more rules
        if (pathStr.endsWith(']')) {
          throw new Error('vue-ya-stash doesn\'t support array element as an end point');
        }
        // === Build path and reduce to stash store
        var path = pathStr.split(/[.[\]]+/);
        var reduced = stashReducer(stash, path.slice(0, -1));
        var last = path[path.length - 1];

        // === computed
        _this.$options.computed[key] = function () {
          return reduced[last];
        };
        // === 'update' handler
        _this.$on('update:' + key, function (value) {
          return _this.$set(reduced, last, value);
        });
        // === 'patch' handler
        _this.$on('patch:' + key, function (obj, key, value) {
          return _this.$set(obj, key, value);
        });
      };

      for (var key in options) {
        _loop();
      }
    }
  }
};

function plugin(Vue) {
  if (plugin.installed) {
    return;
  }
  // Register a helper prototype property for store access.
  // Object.defineProperty(Vue.prototype, '$stash/store', {
  //   get () {
  //     return this.$root.stashStore
  //   }
  // })
  Vue.mixin(stashMixin);
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin);
}

exports.default = plugin;