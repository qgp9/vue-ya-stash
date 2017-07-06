function stashReducer (obj, keys) {
  return keys.reduce((pv, cv) => pv[cv], obj)
}

const stashMixin = {
  beforeCreate () {
    // == If current instance is a  root instance
    if (this === this.$root) {
      console.log('this is root')
      console.log(this)
      if (!this.$options.data) this.$options.data = {}
      this.$options.data['$stash/store'] = this.$options.stashStore
    }

    let stash = this.$root.$options.data['$stash/store']
    // let stash = this.$root.$stash
    let options = this.$options.stash

    if (options) {
      console.log(options)
      console.log(stash)
      console.log(this.$root)
    }

    if (stash === undefined) return

    // == If there is no computed property, make object
    if (typeof this.$options.computed === 'undefined') {
      this.$options.computed = {}
    }

    // == If stash option is array, just use property:'property'
    if (Array.isArray(options)) {
      options.forEach(property => {
        // TODO if (stash[property]===undefined)
        // === computed
        this.$options.computed[property] = () => stash[property]
        // === update handler
        this.$on(
          `update:${property}`,
          value => this.$set(stash, property, value)
        )
        // === patch handler
        this.$on(
          `patch:${property}`,
          (obj, key, value) => {
            this.$set(obj, key, value) // === args = [obj, key, value]
          }
        )
      })
      // == If stash option is object
    } else if (typeof options === 'object') {
      for (var key in options) {
        let conf = options[key]
        let pathStr = ''

        if (typeof conf === 'object') {
          pathStr = conf['stash'] || key
        } else {
          pathStr = conf
        }

        // === CHECK format
        // FIXME: add more rules
        if (pathStr.endsWith(']')) {
          throw new Error('vue-ya-stash doesn\'t support array element as an end point')
        }
        // === Build path and reduce to stash store
        let path = pathStr.split(/[.[\]]+/)
        let reduced = stashReducer(stash, path.slice(0, -1))
        let last = path[path.length - 1]

        // === computed
        this.$options.computed[key] = () => reduced[last]
        // === 'update' handler
        this.$on(
          `update:${key}`,
          value => this.$set(reduced, last, value)
        )
        // === 'patch' handler
        this.$on(
          `patch:${key}`,
          (obj, key, value) => this.$set(obj, key, value)
        )
      }
    }
  }
}

function plugin (Vue) {
  if (plugin.installed) {
    return
  }
  // Register a helper prototype property for store access.
  // Object.defineProperty(Vue.prototype, '$stash/store', {
  //   get () {
  //     return this.$root.stashStore
  //   }
  // })
  Vue.mixin(stashMixin)
}

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin)
}

export default plugin
