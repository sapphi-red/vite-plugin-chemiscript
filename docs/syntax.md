# Syntax
Still in consideration.

## variable declarations
### `ref`
```js
let a = 0
```
`ref`s must be declared with `let`.
This is to distinguish ref values with computed values.

### `computed`
```js
const b = a + 5
```
`computed` values must be declared with `const`.

> Todo: how about writable computeds?
> declaring with `let` is more natural I think

## assignments
```js
a = a + 1
```
Assignments will be treated as if `a.value = ` with ref value and `a = ` with normal values.

## functions with side effects
```js
const increment = () => {
  a++
}
```

> Todo: Should functions be wrapped with `reactify`?
> functions with side effects will not work if it is wrapped.
> Maybe it should wrap with `reactify` unless the function name ends with "$".
