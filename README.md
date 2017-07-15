# vue-ya-stash [![CircleCI](https://circleci.com/gh/qgp9/vue-ya-stash.svg?style=shield)](https://circleci.com/gh/qgp9/vue-ya-stash)
Yet Another simple stash storage for Vue

## TL;DR
```bash
npm install vue-ya-stash
```
```js
export default {
  stash: ['user', 'ui'],
  mounted () {
    console.log('this.user.name')
    this.$emit('update:user', {...this.user, name: 'Bob'})
    this.$emit('patch:ui', 'sidebar.visible', true )
  }
}  
```
![BOOYAH](http://i.imgur.com/JoeKDOC.png)


## Design Goals

1. Not too complicated
2. Not too simple
3. Try to keep the standard pattern (`props`-`emit`)

#3 is being specially concerned.
As you see from example, one can effortlessly switch between `props-emit` and `stash` model.
Furthermore ways of universal components for two models will be supported. I wish :)   


## Usage
### Install
```sh
npm install --save vue-ya-stash
```
### Setup
```js
import Vue from 'vue'
import stashStore from './stash'

new Vue({
  el: '#app',
  router,
  stashStore,
  template: '<App/>',
  components: { App }
})
```

`./stash/index.js`
```js
import Vue from 'vue'
import VueYaStash from 'vue-ya-stash'

Vue.use(VueYaStash)

var stash = {
  user: {
    name: 'Ted',
    email: 'ted@example.com'
  },
  ui: {
    sidebar: {
      visible: true
    }
  }
}

var stashContainer = new Vue({
  data: {
    stash: stash
  }
})

export default stashContainer.stash
```

### Component
```js
Vue.component('user-card', {
    stash: ['user', 'ui'],
    created () {
      // Access
      console.log(this.user.name)
      // Update
      this.$emit('update:user', {...this.user, name: 'Bob'})
      // Patch
      this.$emit('patch:user', 'name', 'Bob')
    }
});
```

```js
Vue.component('user-card', {
    stash: {
      name: 'user.name',
      sidebar: 'ui.sidebar'
    }
    created () {
      // Access
      console.log(this.name)
      console.log(this.sidebar.visible)
      // Update
      this.$emit('update:name', 'Bob')
      this.$emit('update:sidebar', {...this.sidebar, visible: true})
      // Patch
      this.$emit('patch:sidebar', 'visible', true)
    }
});
```

### Patch
To update parts of stash, one can use `patch` instead of `update`
```js
this.$emit('patch:key', path_string, update_value)
```

For example after you mounted `stash.ui` from above, you can change `stash.ui.sidebar.visible` with `patch`
```js
Vue.component('nav-bar', {
  stash: ['ui']
  methods: {
    toggleSidebar () {
      this.$emit('patch:ui', 'sidebar.visible', !ui.sidebar.visible)
    }
  }
}
```

A path string can cover dot(`.`) references and also square brackets('[]').
```js
this.$emit('patch:ui', 'sidebar.menu[4].content', 'new value')
```
Path strings should be same as what one does with real javascript syntex.

You can't do
```js
this.$emit('patch:menu', 1, 'new value')
```
But you should do
```js
this.$eimt(`patch:menu', '[1]', 'new value')
```

The path parser will throw errors in advance.

### computed stash

Stash properties can be a computed function which is **Read Only**. 
With function forms, `update:foo` or `patch:foo` won't be generated in automatic manner, however I wish we will see `set` option soon.
```js
stash: {
  name: stash => stash.user.name.toUpperCase()
}
```
