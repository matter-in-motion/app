const path = require('path');
const tryRequire = require('try-require');

class Settings {
  constructor(settings = {}) {
    this.initRequired = true;
    this.instance = {
      extensionPrefix: '@matter-in-motion/',
      ...settings,
      require: name => this.require(name)
    };
  }

  init({ app }) {
    this.path = app.path;
    const settings = tryRequire(path.join(this.path.root, 'settings'));
    // to prevent applying it to itself
    if (settings && settings !== Settings) {
      this.apply(settings);
    }

    const envSettings = tryRequire(path.join(this.path.root, 'settings', app.environment));
    if (envSettings) {
      this.apply(envSettings);
    }
  }

  apply(settings) {
    if (!settings) {
      return;
    }

    settings({
      settings: this.instance,
      path: this.path,
      env: process.env
    });
  }

  require(name) {
    const section = this.instance[name];
    if (!section) {
      throw new Error(`Settings '${name}' not found`);
    }

    return section;
  }
}

module.exports = Settings;
