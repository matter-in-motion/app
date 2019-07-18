'use strict';
const test = require('ava');
const Settings = require('../settings');

test('creates a settings instance with initial settings', t => {
  const settings = new Settings({
    test: 'test1'
  });

  t.is(settings.instance.test, 'test1');
});

test('checks the settings require method', t => {
  const settings = new Settings({
    test: 'test1'
  });

  t.is(settings.require('test'), 'test1');
  t.throws(() => settings.require('error'), {
    message: 'Settings \'error\' not found'
  });
});

test('applies more settings', t => {
  const settings = new Settings({
    test1: 'test1'
  });

  settings.apply();

  settings.apply(({ settings }) => {
    const test1 = settings.require('test1');
    settings.test2 = `${test1}2`
  })

  t.is(settings.instance.test1, 'test1');
  t.is(settings.instance.test2, 'test12');
});
