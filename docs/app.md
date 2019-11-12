# Matter In Motion

## App

### Methods

#### constructor(settings, env = process.env.NODE_ENV)

Creates and app instance with optional `settings` and sets the `env`

#### setEnvironment(env)

Sets the environment

#### async start()

Start the app

#### async stop()

Stops the app

#### require(name)

Return the units with the 'name'. If unit doesn't exists throw an error.

#### add(units)

Adds units to your app.

#### call(command, ...args)

Calls the method of the unit with `args`. Example:

`app.call('unit.method', 'arg1', 'arg2');`

### Events

The App uses Radix Tree for events look up so it is very fast. You can use `*` and `:placeholder` patterns. The last parameter in the handler will be all `placeholders` found in the path.

#### on([prefixes], path, handler)

Subscribe for the path. Prefixes can be omited.

#### off([prefixes], path, handler)

Unsubscribe from the path. Prefixes can be omited.

#### emit(path, ...args)

Emit the event with `...args`

### Life cycle

All the hooks can be asyncronious. Just return a `Promise`.

#### `await app.start();`

1. willStart method (good place to add your units)
2. will start hooks
3. willInit method
4. will init hooks
5. init (get your dependencies here)
6. did init hooks
7. didInit method
8. `start` event
9. did start hooks
10. didStart method (good place to run your code)

#### `await app.stop();`

1. willStop method
2. will stop hooks
3. `stop` event
4. did stop hooks
5. didStop method

The simple way to launch your app is:

1. Create `bin/app`
2. Put

```js
#!/usr/bin/env node
'use strict';
const App = require('<path to your app or "@matter-in-motion/app">');

(async () => {
  const app = new App();
  await app.start();
})();
```

3. `chmod +x bin/app`



