import Vue from 'vue'
import debug from './debug'
//
// PATH PARSER
//
const pathExprProperty = /^\.([_a-zA-Z$][\w$]*)(.*)$/
const pathExprRefNumber = /^\[(\d+)\](.*)/
const pathExprRefString = /^(\['.*?'\]|\[".*?"\])(.*)$/
const pathExprStripRef = /(^\[)|(\]$)/g
const pathExprStripQuote = /(^['"]|['"]$)/g
function pathParser (path) {
  // TODO check integer?
  if ((!path) && (path !== 0)) {
    throw Error(`path is empty : ${path}`)
  }
  if (Array.isArray(path)) {
    return path.reduce((p, c) => p.concat(pathParser(c)), [])
  }
  if (typeof path === 'object') {
    return Object.values(path).slice(0, 1) // TODO TEST this!
  }
  if (typeof path !== 'string' && typeof path !== 'number') {
    throw Error(`path should be a number/string/array/object. : ${path}`)
  }
  if (typeof path === 'number') return [path]
  if (/^\d+$/.test(path)) return [parseInt(path)]
  const paths = []
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
// Setter
//
function stashSet (_stash, _path, _value) {
  if (!Array.isArray(_path)) _path = [_path]
  const _paths = pathParser(_path)
  const _parentPaths = _paths.slice(0, -1)
  const _last = _paths[_paths.length - 1]
  Vue.set(referenceReducer(_stash, _parentPaths), _last, _value)
}
//
// Mixin
//
// $stash/store
//
const linkerNames = ['stashStore']
const mountPoint = '$plugins/vue-ya-stash'
const dataPoint = '$stash/store'
const stashMixin = {
  beforeCreate () {
    // == Only for ROOT
    if (this === this.$root) {
      let stash
      for (const i in linkerNames) {
        if (linkerNames[i] in this.$options) {
          stash = this.$options[linkerNames[i]]
          break
        }
      }
      // return without error if root doesn't have stash option at all
      // or warning? => No because may other vuex or router use vue instance
      if (stash === undefined) {
        return
      }
      // Check the assurance
      const cname = stash.constructor.name
      // if it's store container instance
      if (cname === 'Vue$3') {
        this[mountPoint] = { container: stash, vm: stash }
        stash = stash.stash
      }
      if (
        typeof stash === 'object' &&
        stash.__ob__ &&
        stash.__ob__.constructor.name === 'Observer'
      ) {
        if (!this.$options.data) this.$options.data = {}
        this.$options.data[dataPoint] = stash
      } else {
        throw Error('Stash object should be Vue instance or obsereved object')
      }
    }

    // == From here, for all component instances

    // If no stash in root
    const stash = this.$root.$options.data[dataPoint]
    if (stash === undefined) return

    // If no stash options
    const stashOptions = this.$options.stash
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
            const paths = pathParser(path)
            const last = paths.pop()
            const obj = referenceReducer(stash[key], paths)
            this.$set(obj, last, value)
          }
        )
      })
      // == If stash option is object
    } else if (typeof stashOptions === 'object') {
      for (var key in stashOptions) {
        const option = stashOptions[key]
        if (typeof option === 'function') {
          this.$options.computed[key] = () => option(stash)
        } else {
          const path = typeof option === 'object' ? (option.stash || key) : (option || key)
          const paths = pathParser(path)
          // === computed
          this.$options.computed[key] = () => referenceReducer(stash, paths)
          // === 'update' handler
          this.$on(
            `update:${key}`,
            value => stashSet(stash, path, value)
          )
          // === 'patch' handler
          this.$on(
            `patch:${key}`,
            (_path, _value) => {
              const _paths = pathParser(_path)
              const _fullPath = [...paths, ..._paths.slice(0, -1)]
              const _last = _paths[_paths.length - 1]
              const _obj = referenceReducer(stash, _fullPath)
              this.$set(_obj, _last, _value)
            }
          )
        }
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
