# word-sprite-quest · 单词精灵闯关

> 一句话简介：Cocos Creator 3.8 微信小游戏——休闲外壳 + 分级词汇训练内核 + 萌宠养成长线闭环。18 种玩法、5 档模式、240 关，多 AI 协同契约化开发。

## 一、这是一个什么样的游戏

表面上是休闲闯关小游戏，内核是分级词汇训练。

```
休闲外壳（18 种玩法）  +  训练内核（5 档模式 / 240 关）  +  长线闭环（萌宠养成 + 元留存层）
```

### 5 档模式

| 模式 | 定位 | 体力消耗 |
|---|---|---|
| `study` | 系统学习 | 有 |
| `hybrid` | 学练混合 | 有 |
| `casual` | 娱乐向 | **0** |
| `arcade` | 街机纯玩（15 关） | **0** |
| `challenge` | 挑战 | 有 |

娱乐向玩法不该被体力卡住——这是刻意的设计取舍。

### 18 种玩法

Ball / Runner / Idle 等基础玩法 + 15 种题型化变体，全部实现 `onQuestionStart` / `onAnswer` / `onResult` 三个抽象方法。

## 二、多 AI 协同是怎么做的

这是这个项目最有意思的部分——三个 AI 各管一块，靠**契约驱动**保证不打架。

### 契约先行

`docs/CONTRACT.md` 冻结了所有跨模块接口：

- `BaseLevel` 抽象方法与通用方法
- `WordData` 的 12 个字段
- 命名规范（全小写 + 下划线，文件除外）
- 双平台隔离（微信 / 抖音）
- **版本号冻结**：改契约必须升版本号，不能悄悄改

各个 AI 的产物不能越过契约边界。比如 Trae 负责的配置生成器，输出必须符合 `schema_v1_3.js` 定义的字段结构。

### 把「产品意图」写成可自动验证的断言

`build.js` 里有这么一条检查：

```js
addCheck('wordCount=0（词仅作皮肤）',
  levels.every(l => l.wordCount === 0), '合规');
```

这验的**不是技术约束**，是产品设计意图——街机关卡里的单词只作视觉皮肤，不考记忆。写成断言之后，这条设计就不会在迭代中被悄悄改掉。

同理还有 R9 检查：验证 `pet_config` 里 `coin.sources` 是否包含 `arcade`，即「街机产出的资源确实汇入了统一资源池」。

### 商业伦理写进配置

契约里写着「**禁止**体力不足即锁死入口、必须付费才能继续」，`config/stamina_config.json` 把它完整落地：

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

最后那个 `redLine` 文本字段看着像形式主义，但 `validate_meta.js` 专门检查它是否存在——**这是唯一能自动验证「这条约束还被记得」的手段**。

## 三、文件结构

```
word-sprite-quest/
├── README.md
├── docs/
│   └── CONTRACT.md              # 契约（接口冻结）
├── tooling/                     # 工具链（原独立仓库，已合并）
│   ├── schema_v1_3.js           # 唯一事实来源（被四个脚本共用）
│   ├── build.js                 # 发布构建门禁（14 个检查模块）
│   ├── validate_meta.js         # 元留存层校验（43 项检查）
│   ├── validate_levels.js       # 关卡校验
│   ├── check_gameplay.js        # 玩法实现检查
│   └── config/                  # v1.3 配置
│       ├── stamina_config.json
│       ├── props_config.json
│       ├── daily_tasks.json
│       ├── arcade_levels.json
│       └── pet_config_v1_3.json
├── assets/
│   ├── scripts/                 # 玩法与核心逻辑
│   └── resources/
└── （美术资源未上传，见下方说明）
```

## 四、构建检查覆盖

`build.js` 的 14 个检查模块，对应契约里的红线：

| 检查 | 内容 |
|---|---|
| R5 | `image_tag` 命名规则 |
| R6 | 包体大小 + 跨分包引用 |
| R7 | 双平台隔离 |
| R8 | mode 合法性 |
| R9 | ResourcePool 资源联动 |
| R10 | 体力兜底（红线） |

`npm run check` 一次跑完。

## 五、说明

**美术资源未上传。** 工程包含 2200+ 张 PNG 纹理（约 300 MB），超出仓库合理范围。源码与配置完整，美术资源需自行补齐，路径见 `assets/resources/` 结构。

**构建产物已排除**：`build/`、`library/`、`temp/`、`local/`、`profiles/`。

## 六、相关

- [个人主页](https://github.com/YGtemple) —— 全部项目导航

## 许可证

MIT License
