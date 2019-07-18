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

### Life cycle

All the hooks can be asyncronious. Just return a `Promise`.

#### `await app.start();`

1. willStart method (good place to add your units)
2. will start hooks
3. willInit method
4. will init hooks
5. init             (get your dependencies here)
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
