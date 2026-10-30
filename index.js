import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const name = 'dsh-coding-principles';
export const inject = ['systemPrompt'];

function getStateFile() {
  return join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'storages', 'coding-principles.json');
}

function readStats() {
  try {
    return JSON.parse(readFileSync(getStateFile(), 'utf8'));
  } catch {
    return { injections: 0, lastInjectedAt: null };
  }
}

export function apply(ctx) {
  const principles = readFileSync(new URL('./principles.md', import.meta.url), 'utf8').trim();
  const stats = readStats();

  ctx.systemPrompt.section({
    name: 'coding-principles:avoid-overdefense',
    order: 100,
    text() {
      stats.injections += 1;
      stats.lastInjectedAt = new Date().toISOString();
      mkdirSync(dirname(getStateFile()), { recursive: true });
      writeFileSync(getStateFile(), JSON.stringify(stats));
      return `以下原则仅适用于软件开发任务，应结合具体项目和用户的要求执行；不得忽略必要的安全、数据一致性保障或更高优先级指令。\n\n${principles}`;
    }
  });

  ctx.inject?.(['commands'], (scope) => {
    scope.commands.register({
      name: 'coding-principles',
      description: '查看编码原则插件状态与注入统计',
      input: { hint: '' },
      handler() {
        return {
          kind: 'success',
          text: [
            `- 状态：已加载（规则 ${principles.length} 字）`,
            `- 累计注入：${stats.injections} 次`,
            `- 最近注入：${stats.lastInjectedAt ?? '无'}`
          ].join('\n')
        };
      }
    });
  });
}
