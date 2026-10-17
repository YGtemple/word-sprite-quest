<div align="right">

[English](README.md) · **[简体中文](README.zh-CN.md)**

</div>

# word-sprite-quest

Cocos Creator 3.8 做的微信小游戏——休闲外壳，里面是分级词汇训练，外面套一层萌宠养成。

18 种玩法 · 5 档模式 · 240 关

<sub>TypeScript · Cocos Creator 3.8.8</sub>

---

## 这是什么

表面是休闲闯关游戏，内核是词汇训练。

```
休闲外壳（18 种玩法）  +  训练内核（5 档 / 240 关）  +  长线闭环（萌宠 + 元留存）
```

### 五档模式

| 模式 | 定位 | 体力消耗 |
|---|---|---|
| `study` | 系统学习 | 有 |
| `hybrid` | 学练混合 | 有 |
| `casual` | 娱乐向 | **0** |
| `arcade` | 街机纯玩，15 关 | **0** |
| `challenge` | 挑战 | 有 |

娱乐向不消耗体力是刻意的——玩来开心的模式不该被体力卡住。

### 十八种玩法

Ball / Runner / Idle 作为基础机制，加上十五种题型化变体。所有玩法实现同一组钩子：`onQuestionStart`、`onAnswer`、`onResult`。

## 多 AI 协同是怎么做的

三个 AI 各负责一块，靠契约保证不冲突。

### 契约先行

`docs/CONTRACT.md` 冻结了所有跨模块接口：

- `BaseLevel` 抽象方法与通用方法
- `WordData` 的十二个字段
- 命名规范（全小写 + 下划线，文件名除外）
- 双平台隔离（微信 / 抖音）
- **版本冻结**——改契约必须升版本号，不能悄悄改

各方的产物不能越过契约边界。比如配置生成器输出的字段结构，必须符合 `schema_v1_3.js` 的定义。

### 把产品意图写成可校验的断言

`build.js` 里有这么一条：

```js
addCheck('wordCount=0（词仅作皮肤）',
  levels.every(l => l.wordCount === 0), '合规');
```

它校验的是**产品设计**，不是技术约束——街机关卡里的单词只作视觉皮肤，不考记忆。一旦写成断言，这条设计就不会在后续迭代中被悄悄丢掉。

R9 检查同理：验证 `pet_config` 的 `coin.sources` 里包含 `arcade`，也就是街机产出的资源确实汇入了统一资源池。

### 商业伦理写进配置

契约规定「禁止体力不足即锁死入口、必须付费才能继续」，`tooling/config/stamina_config.json` 把它落了地：

```json
{
  "zeroStaminaFallback": {
    "enabled": true,
    "method": "ad_revive_free_play",
    "description": "体力=0 时提供看广告免费玩一局入口，永不硬阻塞（R10）"
  },
  "redLine": "R10: 禁止体力不足即锁死入口、强制付费才能继续。"
}
```

那个 `redLine` 字符串看着像形式主义——直到你发现 `validate_meta.js` 会检查它是否存在。这是唯一能自动验证「这条约束还被记得」的手段。

## 目录

```
word-sprite-quest/
├── docs/CONTRACT.md             接口定义，已冻结
├── tooling/                     由两个原仓库合并而来
│   ├── schema_v1_3.js           唯一事实来源，被四个脚本共用
│   ├── build.js                 发布门禁，14 个检查模块
│   ├── validate_meta.js         元留存层检查，43 项断言
│   ├── validate_levels.js
│   ├── check_gameplay.js
│   └── config/
│       ├── stamina_config.json
│       ├── props_config.json
│       ├── daily_tasks.json
│       ├── arcade_levels.json
│       └── pet_config_v1_3.json
├── assets/scripts/              玩法与核心逻辑
└── assets/resources/
```

## 构建检查

`build.js` 用 14 个检查模块对应契约里的红线：

| 检查 | 覆盖 |
|---|---|
| R5 | `image_tag` 命名 |
| R6 | 包体大小与跨分包引用 |
| R7 | 双平台隔离 |
| R8 | `mode` 取值合法 |
| R9 | ResourcePool 资源联动 |
| R10 | 体力兜底（红线） |

```bash
npm run check
```

## 美术资源说明

美术资源未包含。工程内有 2,200+ 张 PNG 纹理（约 300 MB），超出仓库该有的体量。源码与配置是完整的；美术路径按 `assets/resources/` 下的结构放置。

构建产物已排除：`build/`、`library/`、`temp/`、`local/`、`profiles/`。

## 相关

- [个人主页](https://github.com/YGtemple) —— 全部项目

## 许可证

MIT
