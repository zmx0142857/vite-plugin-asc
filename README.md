# vite-plugin-asc

Vite plugin for AssemblyScript Compiler (asc)

## quick start

    $ pnpm i -D vite assemblyscript vite-plugin-asc

```text
.
|-- src
|   |-- as
|   |   |-- index.ts
|   |   `-- tsconfig.json
|   `-- index.js
|-- index.html
|-- package.json
`-- vite.config.js
```

`src/as/index.ts`
```ts
export function fibonacci(n: i32): i32 {
  if (n <= 1) return n
  return fibonacci(n-1) + fibonacci(n-2)
}
```

`src/as/tsconfig.json`
```json
{
  "extends": "../../node_modules/assemblyscript/std/assembly.json",
  "include": [
    "./**/*.ts"
  ]
}
```

`src/index.js`
```js
import init from './as/index.ts?init'

const fib = (n) => {
  if (n <= 1) return n
  return fib(n-1) + fib(n-2)
}

init().then(module => {
  const { fibonacci } = module.exports
  console.time('wasm')
  console.log(fibonacci(40))
  console.timeEnd('wasm')
  console.time('js')
  console.log(fib(40))
  console.timeEnd('js')
})
```

`index.html`
```html
have a look at console!
<script type="module" src="src/index.js"></script>
```

`package.json`
```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "devDependencies": {
    "...": "..."
  }
}
```

`vite.config.js`
```js
import { defineConfig } from 'vite'
import Asc from 'vite-plugin-asc'

export default defineConfig({
  plugins: [
    Asc(),
  ]
})
```

    $ pnpm dev
