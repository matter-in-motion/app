const path = require('path');
const EventEmitter = require('events');
const Units = require('units');
const hooks = require('async-hooks');

const Settings = require('./settings');

class App extends EventEmitter {
  constructor(settings, env = process.env.NODE_ENV || 'development') {
    super();

    this.inited = false;
    this.units = new Units({
      app: this,
      settings: new Settings(settings)
    });

    this.path = {
      root: process.cwd(),
      modules: path.join(process.cwd(), 'node_modules')
    }

    this.setEnvironment(env);
    const { extensions, extensionPrefix } = this.require('settings');
    this.loadExtensions(extensions, extensionPrefix);

    hooks(this, 'init', 'start', 'stop', 'call');
  }

  init() {} // for subclasses to implement

  setEnvironment(env) {
    this.environment = env;
    return this;
  }

  async ensureInited() {
    if (this.inited) {
      return;
    }

    this.inited = true;
    this.setDefaults();
    await this.units.init();
  }

  async start() {
    await this.ensureInited();
    this.emit('start');
  }

  stop() {
    this.emit('stop');
    return this;
  }

  add(name, units) {
    this.units.add(name, units);
    return this;
  }

  require(name) {
    return this.units.require(name);
  }

  call(command, ...args) {
    const parts = command.split('.');
    const cmdName = parts.pop();
    const unitName = parts.join('.');
    const unit = this.require(unitName);
    return unit[cmdName](...args);
  }

  loadExtensions(extensions = [], prefix = '') {
    const modulesPath = this.path.modules;
    extensions.forEach(extension => {
      if (typeof extension === 'string') {
        extension = require(path.join(modulesPath, prefix + extension));
      }

      const units = typeof extension === 'function' ?
        extension(this) : extension;

      units && this.units.add(units);
    });
    return this;
  }

  setDefaults() {
    const defaults = this.require('settings').defaults;
    if (!defaults) {
      return;
    }

    const units = this.units;
    for (const name in defaults) {
      units.alias(name, defaults[name])
    }
  }

  async printUnits() {
    await this.ensureInited();
    //TODO: show aliases
    this.units.forEach((unit, name) => console.log(name));
  }

  async console() {
    const repl = require('repl');
    await this.ensureInited();

    return new Promise(resolve => {
      const r = repl
        .start()
        .on('exit', resolve);

      Object.defineProperty(r.context, 'app', {
        configurable: false,
        enumerable: true,
        value: this
      });
    })
  }
}

module.exports = App;
