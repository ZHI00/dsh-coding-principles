import { readFileSync } from 'node:fs';

export const name = 'dsh-coding-principles';
export const inject = ['systemPrompt'];

export function apply(ctx) {
  const principles = readFileSync(new URL('./principles.md', import.meta.url), 'utf8').trim();
  ctx.systemPrompt.section({
    name: 'coding-principles:avoid-overdefense',
    order: 100,
    text: `以下原则仅适用于软件开发任务，应结合具体项目和用户的要求执行；不得忽略必要的安全、数据一致性保障或更高优先级指令。\n\n${principles}`
  });
}
