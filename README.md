# vue-ya-stash
Yet Another simple stash storage for Vue


## Usage

### Setup
```
import Vue from 'vue'
import App from './App'
import stashStore from './stash'

Vue.use(yaStash)

new Vue({
  el: '#app',
  router,
  stashStore,
  template: '<App/>',
  components: { App }
})
```

### Component
```
Vue.component('user-card', {
    stash: ['user', 'ui'],
    created () {
      // Access
      console.log(this.user.name)
      // Update
      this.$emit('update:user', {...this.user, name: 'Bob'})
      // Patch
      this.$emit('patch:user', this.user, 'name', 'Bob')
    }
});
```

```
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
      this.$emit('patch:sidebar', this.sidebar, 'visible', true)
    }
});
