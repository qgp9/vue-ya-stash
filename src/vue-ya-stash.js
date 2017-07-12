//
// PATH PARSER
//
let pathExprProperty = /^\.([_a-zA-Z$][\w$]*)(.*)$/
let pathExprRefNumber = /^\[(\d+)\](.*)/
let pathExprRefString = /^(\['.*?'\]|\[".*?"\])(.*)$/
let pathExprStripRef = /(^\[)|(\]$)/g
let pathExprStripQuote = /(^['"]|['"]$)/g
function pathParser (path) {
  let paths = []
  let remain = (path.startsWith('[') ? '' : '.') + path
  while (remain) { // Assume '' is false also
    let wip
    if ((wip = pathExprProperty.exec(remain))) {
    } else if ((wip = pathExprRefNumber.exec(remain))) {
      wip[1] = parseInt(wip[1])
    } else if ((wip = pathExprRefString.exec(remain))) {
      wip[1] = wip[1].replace(pathExprStripRef, '')
      wip[1] = wip[1].replace(pathExprStripQuote, '')
    }
    if (wip && (wip[1] === 0 || wip[1])) {
      paths.push(wip[1])
      remain = wip[2]
    } else {
      throw Error(`Bad path '${remain}' in '${path}'`)
    }
  }
  return paths
}

//
// refferenceReducer
//
function referenceReducer (obj, keys, i, a) {
  return keys.reduce((pv, cv) => {
    if (!pv) throw Error(`${cv}'s mother is undfined among ${keys}. Possibly "${a[i - 1]}" is typo?`)
    return pv[cv]
  }, obj)
}

//
// Mixin
//
// $stash/store
//
const stashMixin = {
  beforeCreate () {
    // == Only for ROOT
    if (this === this.$root) {
      if (!this.$options.data) this.$options.data = {}
      this.$options.data['$stash/store'] = this.$options.stashStore
    }

    // == From here, for all component instances

    // If no stash in root
    let stash = this.$root.$options.data['$stash/store']
    if (stash === undefined) return

    // If no stash options
    let stashOptions = this.$options.stash
    if (stashOptions === undefined) return

    // == If there is no computed property, make object
    if (typeof this.$options.computed === 'undefined') {
      this.$options.computed = {}
    }

    // == If stash option is array, just use property:'property'
    if (Array.isArray(stashOptions)) {
      stashOptions.forEach(key => {
        // TODO if (stash[property]===undefined)
        // === computed
        this.$options.computed[key] = () => stash[key]
        // === update handler
        this.$on(
          `update:${key}`,
          value => this.$set(stash, key, value)
        )
        // === patch handler
        this.$on(
          `patch:${key}`,
          (path, value) => {
            let paths = pathParser(path)
            let last = paths.pop()
            let obj = referenceReducer(stash[key], paths)
            this.$set(obj, last, value)
          }
        )
      })
      // == If stash option is object
    } else if (typeof stashOptions === 'object') {
      for (var key in stashOptions) {
        const option = stashOptions[key]
        const path = typeof option === 'object' ? (option.stash || key) : (option || key)
        const paths = pathParser(path)
        // === computed
        this.$options.computed[key] = () => referenceReducer(stash, paths)
        // === 'update' handler
        const parentPaths = paths.slice(0, -1)
        const last = paths[paths.length - 1]
        this.$on(
          `update:${key}`,
          value => this.$set(referenceReducer(stash, parentPaths), last, value)
        )
        // === 'patch' handler
        this.$on(
          `patch:${key}`,
          (_path, _value) => {
            const _paths = pathParser(_path)
            const _fullPath = [...paths, _paths.slice(0, -1)]
            const _last = _path[_path.length - 1]
            const _obj = referenceReducer(stash, _fullPath)
            this.$set(_obj, _last, _value)
          }
        )
      }
    }
  }
}

function plugin (Vue) {
}
plugin.install = function (Vue) {
  if (this.installed) {
    return
  }
  Vue.mixin(stashMixin)
}


if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin)
}

export default plugin
