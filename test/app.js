'use strict';
const test = require('ava');
const App = require('../index');

test('creates an app, checks the default units', t => {
  const app = new App();
  t.is(app.require('app'), app);
  t.is(app.environment, 'test');
  t.is(app.path.root, process.cwd());

  const settings = app.require('settings');
  t.is(typeof settings.require, 'function');
});

test('creates an app with initial settings', t => {
  const app = new App({
    test: 'test1'
  });

  const settings = app.require('settings');
  t.is(settings.test, 'test1');
});

test('starts the app and checks if units are inited', async t => {
  const app = new App();
  t.is(app.units.inited, false);
  await app.start();
  t.is(app.units.inited, true);
});

test('checks the defaults aliasing', async t => {
  const app = new App({
    defaults: {
      alias: 'test'
    }
  });
  app.add({
    test: 'test value'
  });

  await app.start();
  const test = app.require('test');
  const alias = app.require('alias');
  t.is(test, alias);
});

test('print units', async t => {
  const app = new App();
  await app.printUnits();
  t.pass();
});

test('checks all the lifecycle events', async t => {
  const app = new App();
  t.plan(3);
  app.on('start', () => t.pass());
  app.on('stop', () => t.pass());
  await app.start();
  await app.stop();
  t.pass();
});

test('checks that init happens only once', async t => {
  let num = 0;
  const app = new App();
  app.init = () => num++;
  t.is(app.inited, false);
  await app.ensureInited();
  t.is(app.inited, true);
  await app.ensureInited();
  t.is(app.inited, true);
  t.is(num, 1);
});

test('loads and inits extension from object', async t => {
  class Extension {
    init({ app, extension }) {
      t.truthy(app);
      t.is(extension, this);
    }
  }

  const app = new App({
    extensions: [ { extension: new Extension() } ]
  });
  await app.start();
});

test('loads and inits extension from the function', async t => {
  class Extension {
    init({ app, extension }) {
      t.truthy(app);
      t.is(extension, this);
    }
  }

  const app = new App({
    extensions: [
      (app => ({
        extension: ({ app: unitsApp }) => {
          t.is(app.inited, false);
          t.is(app, unitsApp);
          return new Extension();
        }
      }))
    ]
  });
  await app.start();
});

test('extends the app class the checks the run order', async t => {
  let stage = null;
  class MyApp extends App {
    willStart() {
      t.is(stage, null);
      stage = 'will start';
    }

    willInit() {
      t.is(stage, 'will start');
      stage = 'will init';
      this.add({ test: 'test' });
    }

    init({ test }) {
      t.is(stage, 'will init');
      stage = 'init';
      t.is(test, 'test');
    }

    didInit() {
      t.is(stage, 'init');
      stage = 'did init';
      t.is(this.inited, true);
    }

    didStart() {
      t.is(stage, 'did init');
      stage = 'did start';
    }

    willStop() {
      t.is(stage, 'did start');
      stage = 'will stop';
    }

    didStop() {
      t.is(stage, 'will stop');
      stage = 'did stop';
    }
  }

  const app = new MyApp();
  app
    .on('start', () => t.is(stage, 'did init'))
    .on('stop', () => t.is(stage, 'will stop'))

  await app.start();
  await app.stop();
})

// test('checks the console mode', async t => {
//   const app = new App({ test: 'test' });
//   await app.console();
//   t.pass();
// });
