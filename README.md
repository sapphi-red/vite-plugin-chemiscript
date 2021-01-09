# vite-plugin-chemiscript
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENSE)  

A plugin that auto-reactifies your script.

> **Vite v2 is only supported, Vite v1 will never be supported**

Powered and inspired by [`vue-chemistry`](https://github.com/antfu/vue-chemistry).

**This project is seeking for a solution to the curious syntax and will not be developed untill it is solved.**  
See the example for more details.

**Also it is in an early development stage, so it won't work with many codes.**

## Install
```shell
npm i -D sapphi-red/vite-plugin-chemiscript # yarn add -D sapphi-red/vite-plugin-chemiscript
npm i vue-chemistry # yarn add vue-chemistry
```

Add plugin in `vite.config.js`.
```js
import { chemiscript } from 'vite-plugin-chemiscript'

export default {
  plugins: [
    chemiscript()
  ]
}
```

## Example
```vue
<template>
  <div @click="increment">
    {{ a }}
    {{ b }}
  </div>
</template>

<script chemi>
export default {
  setup() {
    let a = 0
    const increment = () => {
      a = a + 1
    }
    const b = a + 5
    return { a, b, increment }
  }
}
</script>
```
Set the `chemi` attribute to `<script>`.

### Output
```vue
<template>
  <div @click="increment">
    {{ a }}
    {{ b }}
  </div>
</template>

<script chemi>
import { sum } from 'vue-chemistry/math'
import { reactify, set as _set } from '@vueuse/shared'
import { ref, unref } from 'vue'

const set = (a, b) => {
  _set(a, unref(b))
}

export default {
  setup() {
    let a = ref(0)
    const increment = () => {
      set(a, sum(a, 1))
    }
    const b = sum(a, 5)
    return { a, b, increment }
  }
}
</script>
```

### What is curious?
```ts
a = a + 1
```
here this assigns the result of `a.value + 1`

```ts
const b = a + 5
```
here this assigns the computed value

It has different behaviors with the same syntax.
