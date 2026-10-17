# tooling · 工具链

> 原本是两个独立仓库（`-tooling` v1.2 与 `-v13-toolchain` v1.3），已合并回主仓库。
> 理由：它们本质上是同一个项目的工具链部分，拆成三个仓库反而让契约、配置、校验器对不上号。

## 目录

```
tooling/
├── README.md                # 本文件
├── config/                  # v1.3 配置（唯一事实来源）
│   ├── schema_v1_3.js       # 被四个脚本共用的字段定义
│   ├── stamina_config.json  # 体力系统（R10 红线落地）
│   ├── props_config.json    # 5 类道具与掉落率
│   ├── daily_tasks.json     # 每日任务 + 7 日登录日历
│   ├── arcade_levels.json   # 15 个街机关卡
│   └── pet_config_v1_3.json # 5 阶段进化 + 元留存层挂钩
└── scripts/
    ├── build.js             # 发布构建门禁（14 个检查模块）
    └── validate_meta.js     # 元留存层校验（43 项检查）
```

## 为什么配置文件本身值得看

四份配置不是「填参数的 JSON」，每一份都在**用数据结构表达设计意图**。

### `stamina_config.json` —— 把商业伦理写进配置

契约规定「禁止体力不足即锁死入口」，落地成五层保障：

| 层 | 做法 |
|---|---|
| 恢复速度 | 每 2 分钟恢复 1 点（行业常规 5–10 分钟） |
| 免费渠道 | 六个：登录 / 广告 / 升级 / 宠物 / 连闯 / 好友 |
| 零体力兜底 | `zeroStaminaFallback` —— 看广告免费玩一局 |
| 新手保护 | 前 7 日近乎无限体力，先建立习惯 |
| 模式差异 | `casual` 和 `arcade` 消耗都是 **0** |

最后一行 `redLine` 是纯文本字段，看着像形式主义——但 `validate_meta.js` 专门检查它是否存在。**这是唯一能自动验证「这条约束还被记得」的手段。**

### `props_config.json` —— 付费策略写成显式声明

```json
"paidOnly": false,
"description_paidPolicy": "付费仅加速获取，非付费墙。所有道具均可免费获得。"
```

而不是把变现逻辑埋在代码里让人猜。

掉落率按场景分组也值得看：`hint` 在 `normal` 是 0.15、`boss` 0.30、`arcade` 只有 0.10——街机关卡单词仅作皮肤、难度 0–3，不该给太好资源。

### `daily_tasks.json` —— 三条任务覆盖三种玩家

- 「玩 1 局街机」→ 只想随便玩玩的
- 「闯关 3 关」→ 在学英语的
- 「答对 30 题」→ 任意模式累计（`type: "global"`，不绑定模式）

轻度玩家也能完成日常，任务设计没有强制必须学英语。

`pvpNote` 也写明范围边界：「实时 1v1 PvP 属 Phase3，MVP 用异步排行榜占位」——配置里写清「这个功能不在本期」，校验器就不用去查它有没有实现。

### `pet_config_v1_3.json` —— 元留存层的资源联动

`metaRetention` 把养成系统和另外四个系统显式连起来：

```
coinSources: campaign / arcade / daily_task / login_calendar / leaderboard
coinSinks:   petUpgrade / skinUnlock / propPurchase
crossLinks:
  arcade       → coin    街机产出金币汇入统一资源池（R9）
  pet_interact → stamina 养成行为反哺玩法
  daily_task   → prop    每日任务奖励道具
```

第二条「撸猫换体力」是关键——让玩家不进关也有收益，降低流失。

## 构建检查

`build.js` 的 14 个检查模块对应契约红线：

| 检查 | 内容 |
|---|---|
| R5 | `image_tag` 命名规则 |
| R6 | 包体大小 + 跨分包引用 |
| R7 | 双平台隔离 |
| R8 | mode 合法性 |
| R9 | ResourcePool 资源联动 |
| R10 | 体力兜底（红线） |

```bash
npm run check
```

## 一处值得单独说的检查

`build.js` 里有这么一条：

```js
addCheck('wordCount=0（词仅作皮肤）',
  levels.every(l => l.wordCount === 0), '合规');
```

这验的**不是技术约束**，是产品设计意图——街机关卡里的单词只作视觉皮肤，不考记忆。写成断言之后，这条设计就不会在迭代中被悄悄改掉。

## 说明

`arcade_levels.json`（15 个街机关卡数据）与 `schema_v1_3.js`（字段定义，14 KB）体积较大，注释也少，留在原仓库归档版中查阅。本目录保留的是**四份能体现设计意图的配置**与校验脚本说明。
