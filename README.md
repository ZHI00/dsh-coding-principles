# AI 编码原则

为 AI 编程助手提供反过度防御和过度设计的编码原则，在满足业务正确性、安全和数据一致性要求的前提下控制复杂度。提供两种使用方式：DeepSeek Harness 插件和通用 Agent Skill。完整规则见 [principles.md](./principles.md)。

## 安装 DSH 插件

克隆仓库并在插件目录中安装到需要使用的 DSH profile：

```bash
git clone https://github.com/ZHI00/dsh-coding-principles.git
cd dsh-coding-principles
dsh plugin --profile desktop add "$(pwd)"
```

将 `desktop` 替换为实际使用的 profile。安装采用本地目录链接，不要删除或移动克隆目录。DeepSeek Harness 桌面版请使用其自带的 `dsh` 命令。

## 安装通用 Skill

需要 Node.js 22.20 或更新版本。运行以下命令并选择支持 Agent Skills 的客户端：

```bash
npx skills add ZHI00/dsh-coding-principles --skill coding-principles
```

默认安装到当前项目；加 `-g` 可以安装到用户范围。也可以直接将 [skills/coding-principles](./skills/coding-principles) 目录复制到客户端的 Skill 目录，无需安装 DSH。Skill 何时加载由客户端决定，如需确保当前任务使用，可以明确要求使用 `coding-principles` Skill。

## 使用和配置

- 启用或停用由安装插件的 profile 管理；其他 profile 需要单独安装。
- 修改 `principles.md` 可调整插件规则，重新加载插件或重启 Harness 后生效；Skill 有独立副本，修改规则时也需同步更新 `skills/coding-principles/SKILL.md` 并运行测试。
- 插件在 `systemPrompt` 中注册一个独立段落，不替换原有系统提示词。项目约定、用户要求以及必要的安全和数据一致性要求仍然适用。
- 自然语言规则不能保证模型每次都遵循，代码仍需审查和测试。

## 测试

使用 Node.js 运行：

```bash
node --test test.js
```

## 许可证

[MIT](./LICENSE)
