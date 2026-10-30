import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { apply, inject, name } from './index.js';

process.env.DSH_HOME = mkdtempSync(join(tmpdir(), 'dsh-coding-principles-'));

test('registers the complete coding principles and counts injections', () => {
  let section;
  const commands = [];
  apply({
    systemPrompt: { section(value) { section = value; } },
    inject(_services, callback) {
      callback({ commands: { register(command) { commands.push(command); } } });
    }
  });

  const principles = readFileSync(new URL('./principles.md', import.meta.url), 'utf8').trim();
  assert.equal(name, 'dsh-coding-principles');
  assert.deepEqual(inject, ['systemPrompt']);
  assert.equal(section.name, 'coding-principles:avoid-overdefense');
  assert.equal(section.order, 100);

  const first = section.text();
  const second = section.text();
  assert.match(first, /仅适用于软件开发任务/);
  assert.ok(first.endsWith(principles));
  assert.equal(second, first);
  assert.equal(commands.length, 1);
  assert.equal(commands[0].name, 'coding-principles');
  const report = commands[0].handler().text;
  assert.match(report, /累计注入：2 次/);
});

test('standalone skill contains the same principles and valid metadata', () => {
  const principles = readFileSync(new URL('./principles.md', import.meta.url), 'utf8').trim();
  const skill = readFileSync(new URL('./skills/coding-principles/SKILL.md', import.meta.url), 'utf8').trim();

  assert.match(skill, /^---\nname: coding-principles\ndescription: .+\nlicense: MIT\n---\n/);
  assert.ok(skill.endsWith(principles));
});
