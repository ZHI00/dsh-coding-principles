import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { apply, inject, name } from './index.js';

test('registers the complete coding principles as a system prompt section', () => {
  let section;
  apply({ systemPrompt: { section(value) { section = value; } } });

  const principles = readFileSync(new URL('./principles.md', import.meta.url), 'utf8').trim();
  assert.equal(name, 'dsh-coding-principles');
  assert.deepEqual(inject, ['systemPrompt']);
  assert.equal(section.name, 'coding-principles:avoid-overdefense');
  assert.equal(section.order, 100);
  assert.match(section.text, /仅适用于软件开发任务/);
  assert.ok(section.text.endsWith(principles));
});

test('standalone skill contains the same principles and valid metadata', () => {
  const principles = readFileSync(new URL('./principles.md', import.meta.url), 'utf8').trim();
  const skill = readFileSync(new URL('./skills/coding-principles/SKILL.md', import.meta.url), 'utf8').trim();

  assert.match(skill, /^---\nname: coding-principles\ndescription: .+\nlicense: MIT\n---\n/);
  assert.ok(skill.endsWith(principles));
});
