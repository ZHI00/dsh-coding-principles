import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { apply, inject, name } from './index.js';

process.env.DSH_HOME = mkdtempSync(join(tmpdir(), 'dsh-coding-principles-'));

test('registers the complete coding principles, counts injections and serves stats', async () => {
  let section;
  let assemble;
  const commands = [];
  const routes = [];
  apply({
    systemPrompt: { section(value) { section = value; } },
    on(event, callback, options) {
      assert.equal(event, 'system-prompt/assemble');
      assert.deepEqual(options, { global: true });
      assemble = callback;
    },
    inject(services, callback) {
      if (services.includes('webServer')) {
        callback({
          webServer: { register(route) { routes.push(route); return () => {}; } },
          effect(fn) { fn(); }
        });
        return;
      }
      callback({ commands: { register(command) { commands.push(command); } } });
    }
  });

  const principles = readFileSync(new URL('./principles.md', import.meta.url), 'utf8').trim();
  assert.equal(name, 'dsh-coding-principles');
  assert.deepEqual(inject, ['systemPrompt']);
  assert.equal(section.name, 'coding-principles:avoid-overdefense');
  assert.equal(section.order, 100);

  const run = async (model, initialModel) => {
    const input = { sections: [{ name: section.name, text: section.text }], variables: model === undefined ? {} : { model } };
    return assemble(input, { agent: { options: { model: initialModel } } }, async () => input);
  };
  const first = (await run('gpt-6.1-terra')).sections[0].text;
  const second = (await run('openai/GPT-5', 'claude-sonnet')).sections[0].text;
  assert.match(first, /仅适用于软件开发任务/);
  assert.ok(first.endsWith(principles));
  assert.equal(second, first);
  for (const model of ['deepseek-v4', 'claude-sonnet', 'not-gpt-5', 'openai/gptish', 'gpt-5/other', '']) {
    assert.equal((await run(model, 'gpt-5')).sections[0].text, '');
  }
  assert.equal((await run(undefined, 'gpt-5')).sections[0].text, first);
  assert.equal((await run(undefined, undefined)).sections[0].text, '');
  assert.equal(commands.length, 1);
  assert.equal(commands[0].name, 'coding-principles');
  const report = commands[0].handler().text;
  assert.match(report, /累计注入：3 次/);

  assert.equal(routes.length, 1);
  assert.equal(routes[0].kind, 'exact');
  assert.equal(routes[0].path, '/dsh-coding-principles/stats');
  let body;
  routes[0].handler({ method: 'GET' }, { writeHead() {}, end(text) { body = text; } });
  const stats = JSON.parse(body);
  assert.equal(stats.injections, 3);
  assert.equal(typeof stats.lastInjectedAt, 'string');
});

test('client bundle registers the plugin detail stats section', () => {
  const client = readFileSync(new URL('./client.js', import.meta.url), 'utf8');
  const manifest = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

  assert.match(client, /id: 'dsh-coding-principles'/);
  assert.match(client, /plugins\.detail\.section/);
  assert.match(client, /dsh-coding-principles\/stats/);
  assert.equal(manifest.exports['./client'], './client.js');
  assert.equal(manifest.dsh.client.platform, 'web');
});

test('client bundle registers only on its own bundle detail page', () => {
  const source = readFileSync(new URL('./client.js', import.meta.url), 'utf8');
  let loaded;
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load(value) {
          loaded = value;
        }
      }
    },
    document: undefined,
    URL,
    AbortController
  };
  sandbox.globalThis = sandbox;
  runInNewContext(source, sandbox);

  const React = {
    createElement: (type, props) => ({ type, props }),
    useState: (value) => [value, () => {}],
    useEffect: () => {}
  };
  const plugin = loaded.factory((name) => (name === 'react' ? React : undefined));
  assert.equal(loaded.id, 'dsh-coding-principles');
  assert.equal(String(plugin.inject), 'slots,locale');

  let registration;
  plugin.apply({
    effect(fn) {
      fn();
    },
    locale: {
      register() {},
      bind: (namespace) => (key) => `${namespace}:${key}`
    },
    slots: {
      inject(name, register) {
        assert.equal(name, 'plugins.detail.section');
        registration = register();
      },
      register(options, render) {
        return { options, render };
      }
    }
  });

  const render = registration.render;
  assert.equal(render({ subject: { kind: 'bundle', pkg: { name: 'other-plugin' } } }), null);
  assert.equal(render({ subject: { kind: 'item', id: 'dsh-coding-principles' } }), null);
  assert.ok(render({ subject: { kind: 'bundle', pkg: { name: 'dsh-coding-principles' } }, t: (key) => key }));
});

test('standalone skill contains the same principles and valid metadata', () => {
  const principles = readFileSync(new URL('./principles.md', import.meta.url), 'utf8').trim();
  const skill = readFileSync(new URL('./skills/coding-principles/SKILL.md', import.meta.url), 'utf8').trim();

  assert.match(skill, /^---\nname: coding-principles\ndescription: .+\nlicense: MIT\n---\n/);
  assert.ok(skill.endsWith(principles));
});
