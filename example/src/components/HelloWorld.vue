<template>
  <div>
    <button @click="onClick">count is: {{ count }}</button>
    <p>doubleCount is: {{ doubleCount }}</p>
  </div>
</template>

<script chemi>
export default {
  setup() {
    let count = 0
    const onClick = () => {
      count = count + 1
    }
    const doubleCount = count + count

    return { count, onClick, doubleCount }
  }
}
</script>

<style scoped>
a {
  color: #42b983;
}
</style>
