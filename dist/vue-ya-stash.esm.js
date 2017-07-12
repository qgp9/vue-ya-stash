/**
  * vue-ya-stash v0.0.2
  * (c) 2017 Evan You
  * @license MIT
  */
//
// PATH PARSER
//
var pathExprProperty = /^\.([_a-zA-Z$][\w$]*)(.*)$/;
var pathExprRefNumber = /^\[(\d+)\](.*)/;
var pathExprRefString = /^(\['.*?'\]|\[".*?"\])(.*)$/;
var pathExprStripRef = /(^\[)|(\]$)/g;
var pathExprStripQuote = /(^['"]|['"]$)/g;
function pathParser (path) {
  var paths = [];
  var remain = (path.startsWith('[') ? '' : '.') + path;
  while (remain) { // Assume '' is false also
    var wip = (void 0);
    if ((wip = pathExprProperty.exec(remain))) {
    } else if ((wip = pathExprRefNumber.exec(remain))) {
      wip[1] = parseInt(wip[1]);
    } else if ((wip = pathExprRefString.exec(remain))) {
      wip[1] = wip[1].replace(pathExprStripRef, '');
      wip[1] = wip[1].replace(pathExprStripQuote, '');
    }
    if (wip && (wip[1] === 0 || wip[1])) {
      paths.push(wip[1]);
      remain = wip[2];
    } else {
      throw Error(("Bad path '" + remain + "' in '" + path + "'"))
    }
  }
  return paths
}

//
// refferenceReducer
//
function referenceReducer (obj, keys, i, a) {
  return keys.reduce(function (pv, cv) {
    if (!pv) { throw Error((cv + "'s mother is undfined among " + keys + ". Possibly \"" + (a[i - 1]) + "\" is typo?")) }
    return pv[cv]
  }, obj)
}

//
// Mixin
//
// $stash/store
//
var stashMixin = {
  beforeCreate: function beforeCreate () {
    var this$1 = this;

    // == Only for ROOT
    if (this === this.$root) {
      if (!this.$options.data) { this.$options.data = {}; }
      this.$options.data['$stash/store'] = this.$options.stashStore;
    }

    // == From here, for all component instances

    // If no stash in root
    var stash = this.$root.$options.data['$stash/store'];
    if (stash === undefined) { return }

    // If no stash options
    var stashOptions = this.$options.stash;
    if (stashOptions === undefined) { return }

    // == If there is no computed property, make object
    if (typeof this.$options.computed === 'undefined') {
      this.$options.computed = {};
    }

    // == If stash option is array, just use property:'property'
    if (Array.isArray(stashOptions)) {
      stashOptions.forEach(function (key) {
        // TODO if (stash[property]===undefined)
        // === computed
        this$1.$options.computed[key] = function () { return stash[key]; };
        // === update handler
        this$1.$on(
          ("update:" + key),
          function (value) { return this$1.$set(stash, key, value); }
        );
        // === patch handler
        this$1.$on(
          ("patch:" + key),
          function (path, value) {
            var paths = pathParser(path);
            var last = paths.pop();
            var obj = referenceReducer(stash[key], paths);
            this$1.$set(obj, last, value);
          }
        );
      });
      // == If stash option is object
    } else if (typeof stashOptions === 'object') {
      var loop = function ( key ) {
        var option = stashOptions[key];
        var path = typeof option === 'object' ? (option.stash || key) : (option || key);
        var paths = pathParser(path);
        // === computed
        this$1.$options.computed[key] = function () { return referenceReducer(stash, paths); };
        // === 'update' handler
        var parentPaths = paths.slice(0, -1);
        var last = paths[paths.length - 1];
        this$1.$on(
          ("update:" + key),
          function (value) { return this$1.$set(referenceReducer(stash, parentPaths), last, value); }
        );
        // === 'patch' handler
        this$1.$on(
          ("patch:" + key),
          function (_path, _value) {
            var _paths = pathParser(_path);
            var _fullPath = paths.concat( [_paths.slice(0, -1)]);
            var _last = _path[_path.length - 1];
            var _obj = referenceReducer(stash, _fullPath);
            this$1.$set(_obj, _last, _value);
          }
        );
      };

      for (var key in stashOptions) loop( key );
    }
  }
};

function plugin (Vue) {
}
plugin.install = function (Vue) {
  if (this.installed) {
    return
  }
  Vue.mixin(stashMixin);
};


if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin);
}

/**
 * vue-ya-stash
 *
 * Copyright qgp9 pauljang9@gmail.com
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

export default plugin;
