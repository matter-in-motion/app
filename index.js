'use strict';

require('dotenv').config();

const path = require('path');
const assert = require('assert');
const EventEmitter = require('events');
const Units = require('units');
const hooks = require('async-hooks');

const Tree = require('./tree');
const Settings = require('./settings');

class App {
  constructor(settings, env = process.env.NODE_ENV || 'development') {
    this.startTimestamp = Date.now();

    hooks(this, 'init', 'start', 'stop', 'call');

    this.root = new Tree();
    this.handlers = new EventEmitter();

    this.inited = false;
    this.units = new Units({
      app: this,
      settings: new Settings(settings)
    });

    this.path = {
      root: process.cwd(),
      modules: path.join(process.cwd(), 'node_modules')
    };

    this.setEnvironment(env);
    const { extensions, extensionPrefix } = this.require('settings');
    this.loadExtensions(extensions, extensionPrefix);
  }

  emit(path, ...args) {
    const { id, params } = this.root.get(path);
    if (id) {
      this.handlers.emit(id, ...args, params);
    }
  }

  on(prefixes, path, handler) {
    if (typeof prefixes === 'string') {
      handler = path;
      path = prefixes;
    } else {
      prefixes.forEach(prefix => this.on(`${prefix}${path}`, handler));
      return;
    }

    assert(
      typeof handler === 'function',
      `Handler should be a function but got ${handler}`
    );

    const { id } = this.root.add(path);
    this.handlers.on(id, handler);
    return this;
  }

  off(prefixes, path, handler) {
    if (typeof prefixes === 'string') {
      handler = path;
      path = prefixes;
    } else {
      prefixes.forEach(prefix => this.off(`${prefix}${path}`, handler));
      return;
    }

    assert(
      typeof handler === 'function',
      `Handler should be a function but got ${handler}`
    );

    const id = this.root.id(path);
    this.handlers.off(id, handler);

    if (!this.handlers.listenerCount(id)) {
      this.root.remove(path);
    }

    return this;
  }

  init() {} // for subclasses to implement

  async start() {
    await this.ensureInited();
    this.emit('app/started');
  }

  stop() {
    this.emit('app/stopped');
  }

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

  add(name, units) {
    this.units.add(name, units);
    return this;
  }

  require(name) {
    return this.units.require(name);
  }

  get(name) {
    return this.units.get(name);
  }

  call(command, ...args) {
    const parts = command.split('.');
    const cmdName = parts.pop();
    const unitName = parts.join('.');
    const unit = this.require(unitName);
    return unit[cmdName](...args);
  }

  loadExtensions(extensions = [], prefix = '') {
    extensions.forEach(extension => {
      if (typeof extension === 'string') {
        extension = this.loadModule(prefix + extension);
      }

      const units =
        typeof extension === 'function' ? extension(this) : extension;

      units && this.units.add(units);
    });
    return this;
  }

  loadModule(name) {
    return require(path.join(this.path.modules, name));
  }

  setDefaults() {
    const defaults = this.require('settings').defaults;
    if (!defaults) {
      return;
    }

    const units = this.units;
    for (const name in defaults) {
      units.alias(name, defaults[name]);
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
      const r = repl.start().on('exit', resolve);

      Object.defineProperty(r.context, 'app', {
        configurable: false,
        enumerable: true,
        value: this
      });
    });
  }

  exitWithCode(code, message) {
    console.log(message);
    process.exit(code);
  }
}

module.exports = App;
