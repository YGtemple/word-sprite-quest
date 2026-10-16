# 单词精灵闯关 v2 · Word Sprite Quest

> 一句话简介：Cocos Creator 3.8 微信小游戏——休闲游戏为外壳，分级词汇训练为内核，萌宠养成为长线闭环。

## 一、这是个什么项目

一个面向初中到大学生的英语词汇训练小游戏。核心设计一句话：

> **休闲游戏为外壳，分级词汇训练为内核，萌宠养成为长线闭环；用户自由在"摸鱼休闲"与"主动备考"间切换，学习权重自调。**

它不是把题库套个游戏皮。真正驱动设计的是这个问题：**为什么大部分学习类 App 留不住人**——因为学累了不能玩，玩的时候又觉得自己在浪费时间。

所以这个项目做了五档模式，让用户自己决定此刻要娱乐还是要学习：

| 模式 | 大厅入口 | 娱乐↔学习 | 机制 |
|---|---|---|---|
| `casual` | 轻松摸鱼 | 娱乐为主 | 消消乐 / 字母迷宫 / 弹幕躲避；低时间压、不绑复习 |
| `campaign` | 冒险闯关 | 均衡 | 240 主线，一关多题型序列，萌宠冒险推进，生词自动入簿 |
| `bootcamp` | 专注集训 | 学习为主 | 定向词库 + 遗忘曲线复习 + 易混辨析；高阶去卡通图 |
| `pvp` | 实时PK | 弹性 | Phase3 延后；MVP 用异步排行榜/镜像赛占位 |
| `arcade` | 街机纯玩 | 娱乐 95%+ | 弹球/跑酷/放置，单词仅作皮肤，不考记忆 |

五个模式**共用同一份错词本和同一个资源池**。这是硬约束，不是摆设——意味着你在摸鱼档刮到的资源能养宠物，在集训档遇到的生词会自动进复习队列。休闲和学习不是两个割裂的 App。

## 二、最有意思的部分：契约驱动的多 AI 协同开发

这个项目不是一个人从头写到尾的。它由 **5 个不同 AI 工具分工协作**完成，靠一份 203 行的技术契约对齐：

```
WorkBuddy（架构师 / 校验闸门）── 制定 CONTRACT，冻结锚点
    │
    ├─▶ Codex        ── 玩法逻辑 / 核心管理器 / 单测（276 个 TS 文件）
    ├─▶ Trae         ── 词库转换 / 配置生成 / 校验脚本
    ├─▶ GPT+Banana   ── 角色 / 场景 / UI 生图
    └─▶ 微信开发者工具 ── 小游戏构建与真机验证
```

契约 `docs/CONTRACT.md` 是这个项目真正的技术内核。它规定了三件关键的事：

**① 版本快照与缓存失效（R4）**。契约头部带版本号，每次派发单绑定对应版本。任何人开工前必须先读当前版本；契约变更必须「升版本号 → 广播 → 下游丢弃旧缓存按新版重做」。v1.3 相对 v1.2 是结构性扩展，所以文档里明确写了「旧 v1/v1.1/v1.2 缓存一律作废」。

这解决的是多 Agent 协作最头疼的问题：**上游改了，下游不知道**。

**② 玩法注册表（R5 命名漂移防护）**。18 种玩法与 `LevelType` 枚举、与 `<X>Level.ts` 文件名一一对应：

| 层 | # | 玩法 | 文件 | 限时/通关 |
|---|---|---|---|---|
| 认词 | 1 | 单词释义匹配 | MatchLevel.ts | 15s/题，答对10 |
| 认词 | 2 | 听音识词 | ListenLevel.ts | 20s/题，答对8 |
| 认词 | 3 | 单词分类 | SortLevel.ts | 15s/题，分类10 |
| 认词 | 4 | 记忆翻牌 | MemoryLevel.ts | 60s，12→16→20张 |
| 拼写 | 5 | 字母拖拽拼写 | SpellLevel.ts | 30s/题，拼对8 |
| 拼写 | 6 | 单词拼图 | PuzzleLevel.ts | 25s/题，拼对8 |
| 拼写 | 7 | 听音拼写 | DictationLevel.ts | 30s/题，拼对6 |
| 拼写 | 8 | 单词消消乐 | EliminateLevel.ts | 60s，拼出≥5 |
| 理解 | 9 | 反义词对战 | AntonymLevel.ts | 10s/题，答对10 |
| 理解 | 10 | 近义词连连看 | SynonymLevel.ts | 45s，全部配对 |
| 理解 | 11 | 选词填空 | FillBlankLevel.ts | 20s/题，答对8 |
| 理解 | 12 | 看图猜词 | PictureLevel.ts | 15s/题，答对10（仅低阶） |
| 应用 | 13 | 语法选择 | GrammarLevel.ts | 25s/题，答对8 |
| 应用 | 14 | 翻译闯关 | TranslateLevel.ts | 40s/题，翻译6 |
| 应用 | 15 | 句子排序 | OrderLevel.ts | 45s/题，排序6 |
| 纯游戏 | 16 | 精灵弹球 | BallLevel.ts | 技能/连击驱动 |
| 纯游戏 | 17 | 无尽跑酷 | RunnerLevel.ts | 反应/连击驱动 |
| 纯游戏 | 18 | 放置合成 | IdleLevel.ts | 合成/放置，零学习 |

**③ 红线清单（R4–R10，违反即 P0 退回）**。十条里我认为最有工程价值的三条：

- **R7 双平台差异**：微信和抖音的 API 不准混写，必须走 `PlatformAdapter`。所以 `wx` / `tt` 标识符**契约规定只能出现在一个文件里**——`PlatformAdapter.ts`。翻遍代码库，其他文件一个 `wx.` 都找不到。
- **R9 模式联动**：所有模式必须写入同一个 `WrongWordBook` 和 `ResourcePool`，禁止玩法私自另存。写这条是因为多 AI 协作时，很可能会出现「Codex 写的弹球关自己存了一份金币」这种分叉。
- **R10 体力宽松红线**：体力系统必须"宽松"，不得因体力稀缺劝退用户。具体要求到每 2-3 分钟回 1 点、0 体力时必须提供「看广告免费玩一局」、前 7 日近乎无限体力、**禁止**体力不足就锁死入口。

一个契约里写下「禁止体力不足即锁死核心入口」这种产品红线，是为了防止实现方（AI 或人）为了留存指标偷偷加付费墙。这是把商业伦理写进技术契约。

## 三、技术架构

### 平台抽象层

`PlatformAdapter.ts`（162 行）是整个项目唯一碰平台 API 的地方。五个接口全部抽象：

```ts
export interface IPlatform {
  readonly name: 'wechat' | 'douyin';
  storage: IStorage;   // setStorageSync / getStorageSync / removeStorageSync
  audio:   IAudio;     // playTTS / playBGM / playSFX / stopBGM
  ad:      IAd;        // showRewarded / showInterstitial / canShow
  social:  ISocial;    // submitScore / getRank / challengeFriend / syncSave
  system:  ISystem;    // onMemoryWarning
}
```

三个降级层设计得很干净：

```ts
static get current(): IPlatform {
  if (!this.currentPlatform) {
    if (typeof wx !== 'undefined')      this.currentPlatform = platformFor('wechat', wx);
    else if (typeof tt !== 'undefined') this.currentPlatform = platformFor('douyin', tt);
    else                                this.currentPlatform = editorFallback();
  }
  return this.currentPlatform;
}
```

`editorFallback()` 用内存 `Map` 模拟存储、`canShow: () => false` 关掉广告——这样**在 Cocos 编辑器里没微信环境也能跑**。而 TTS 和社交能力默认实现是 `throw new Error('TTS provider is not configured.')`，注释写明了意图：**避免静默伪成功**。没有配置就明确报错，不是悄悄什么都不做。

### 玩法基类

`BaseLevel.ts`（117 行）抽出所有玩法共享的行为：倒计时、连击统计与里程碑、过关判定、HUD 事件广播、生命周期清理。

```ts
protected abstract onQuestionStart(): void;
protected abstract onAnswer(selected: any): void;
protected abstract onResult(isCorrect: boolean): void;
```

三个抽象方法，18 个子类各自实现。连击里程碑是硬编码在基类里的——5 连击 `COMBO`，10 连击 `SUPER_COMBO`：

```ts
protected checkComboMilestone(): void {
  if (this.combo === 5)  this.playEffect(EffectType.COMBO);
  if (this.combo === 10) this.playEffect(EffectType.SUPER_COMBO);
}
```

`updateHUD()` 不直接操作 UI 节点，而是 emit `hud-update` 事件：

```ts
this.node.emit('hud-update', { combo, maxCombo, correctCount, timeRemaining, timeLimit });
```

玩法层和 UI 层通过事件解耦。这符合契约「所有交互文案经 i18n / 动态文本渲染，禁止把英文单词写死到 UI 节点」的要求——玩法只管发数据，UI 管渲染。

生命周期也处理了：

```ts
onDestroy(): void {
  this.stopTimer();
  this.unscheduleAllCallbacks();
  this.node.targetOff(this);
}
```

计时器回调在销毁时反注册、监听全部摘除。契约代码质量红线第 ② 条就是「计时器清理」——Cocos 里忘了反注册会是内存泄漏和野回调。

### 事件协议

玩法和 UI/数据层不直接互相调用，走一套约定的事件。完整协议列了 8 个：

| 事件 | 方向 | 载荷 |
|---|---|---|
| `request-next-word` | 玩法 → 数据 | 回调 `(word: WordData \| null) => void`，须同步调用 |
| `request-options` | 玩法 → 数据 | `word, count, field, callback(options)` |
| `question-ready` | 玩法 → UI | 动态文本与选项 |
| `request-memory-deck` | 玩法 → 数据 | `cardCount, callback(cards)` |
| `memory-board-ready` | 玩法 → UI | 12/16/20 张卡片 |
| `answer-input-enabled` | 玩法 → UI | 是否接受输入 |
| `wrong-word` | 玩法 → 错词本 | 当前 `WordData` |
| `gameplay-data-error` / `tts-error` | 玩法 → 错误层 | 错误说明；不得用 `console` 代替 |

「不得用 `console` 代替」也是代码红线之一——错误必须走事件层，不能一句 `console.log` 糊过去。

### 数据分层

`WordData` 冻结为 14 个键（`id` 主键 + 13 业务字段）。其中 `examLevel` 是分层词库的核心：

```ts
examLevel: 'middle' | 'high' | 'cet4' | 'cet6' | 'postgrad'
```

驱动两件事：**词库分层**（中考→高考→四级→六级→考研递进），以及**高阶禁卡通图**——`examLevel >= cet4` 的关卡禁用 `Picture` 玩法且不生成卡通配图，改用例句 + 词根解析卡片。让备考用户在关键阶段不被幼稚视觉干扰。

`image_tag` 有个工程细节：必须等于生图文件名 `img_<word>.png` 去扩展名，且经过 `sanitizeImageTag()` 统一小写加下划线。契约把它列为 R5 红线，因为「空格/大写/符号 → 裂图」。这是多 AI 协作必须靠契约兜住的典型坑：生图方和词库转换方如果不约定 sanitize 规则，图全裂。

### 关卡配置

`levels_240.json`（182 KB）是 240 关主线配置。渐进难度 5 档：`teach → basic → advanced → challenge → boss`。单关内还支持 `withinLevelEscalation` 关内递进阶——每 3 连击干扰项更近义、限时 ×0.9、5% 陷阱题，断连击归零。

Boss 关的混合题型约束：

```ts
isBoss === true  →  必须 mixedTypes.length >= 2
```

由 `BossCoordinator` 按波次调度，最终波混合。

## 四、工程结构

```
assets/
├── main.scene                      # 主场景
├── Canvas/
├── scenes/
└── resources/
    └── config/
        ├── levels_240.json         # 240 关主线配置（182 KB）
        ├── words_ch1..8.json       # 8 章词库，按 examLevel 分层
        ├── pet_config.json         # 宠物配置
        └── achievements.json       # 成就

assets/scripts/
├── core/
│   ├── GameManager.ts              # 全局状态
│   ├── LevelManager.ts             # 关卡调度 + BossCoordinator
│   ├── PlatformAdapter.ts          # 双平台抽象层（唯一含 wx/tt 的文件）
│   ├── AudioManager.ts             # TTS / BGM / SFX
│   ├── AdManager.ts                # 激励视频/插屏，含 load 失败重试
│   ├── StorageManager.ts           # 本地存档
│   ├── StaminaManager.ts           # 体力（R10 宽松原则）
│   ├── PropManager.ts              # 道具：提示/洗牌/冻结/锤子/复活
│   ├── DailyTaskManager.ts         # 每日任务 + 7 日登录日历
│   ├── AnalyticsManager.ts         # 数据上报
│   └── AsyncLeaderboard.ts         # 异步排行榜
├── gameplay/
│   ├── BaseLevel.ts                # 玩法基类（计时/连击/HUD/资源钩子）
│   ├── MatchLevel / ListenLevel / SortLevel / MemoryLevel      # 认词 4
│   ├── SpellLevel / PuzzleLevel / DictationLevel / Eliminate   # 拼写 4
│   ├── AntonymLevel / SynonymLevel / FillBlankLevel / Picture  # 理解 4
│   ├── GrammarLevel / TranslateLevel / OrderLevel              # 应用 3
│   └── BallLevel / RunnerLevel / IdleLevel                     # 纯游戏 3
├── data/
│   ├── WordData.ts / LevelData.ts / GameplayData.ts
│   ├── WordDatabase.ts             # 按 bundle ch1..ch8 懒加载
│   └── PlayerData.ts / WrongWordBook.ts / ResourcePool.ts
├── ui/
│   ├── AppBootstrap.ts             # 启动装配 + PlatformAdapter 注入
│   ├── GameHUD.ts                  # 38.9 KB，主 HUD
│   └── PlayTestHUD.ts / TestHUD.ts
└── pet/
    └── PetSystem.ts                # 订阅 level-reward 驱动宠物成长
```

## 五、几个值得说的设计取舍

**玩法不发文字，只发数据**。契约明确「所有交互文案经 i18n / 动态文本渲染，禁止把英文单词写死到 UI 节点」。所以 `BaseLevel` 里看不到任何 `setString("apple")`——全部通过 `question-ready` 事件把 `WordData` 交给 UI 层。好处是后续要加中文界面/多语言，不用改 18 个玩法文件。

**资源统一入账，禁止玩法私藏**。R9 规定所有模式结算必须经 `grantResources` 汇入 `ResourcePool`。这样萌宠系统只要订阅 `level-reward` 一个事件就能驱动成长，不需要知道游戏里有几种玩法。

**体力系统的"宽松"是契约级要求**。R10 把「不得因体力稀缺导致用户流失」写成技术红线，而不是产品文档里的一句口号。落到实现就是 `StaminaManager` 每 2-3 分钟回 1 点、0 体力必须给「看广告免费玩一局」、前 7 日近乎无限。这类约束如果不在契约层固定，实现时几乎必然被 KPI 吃掉。

**广告必须经 AdManager**。`showRewarded` 里有个实用的容错：

```ts
Promise.resolve(ad.show()).catch(() => ad.load().then(() => ad.show())).catch(onError);
```

先试直接 show，失败先 load 再 show，仍失败才 reject。微信小游戏里激励视频经常要先 load 才能 show，这一条能省掉大量「用户点了没反应」的投诉。

## 六、当前状态与验证

已交付部分：

- `scripts/gameplay/` — 4 个玩法（Match / Listen / Sort / Memory）完整实现
- `scripts/core/` — AdManager / StorageManager / ResourceManager / PlatformAdapter
- `scripts/data/` — WordDatabase / PlayerData / WrongWordBook + 冻结 schema 副本
- `tests/` — Cocos 类型替身与纯逻辑单测

验证结果：

```
TypeScript 严格类型检查通过
4 个单测通过
Trae 玩法检查 0 P0 / 0 P1
240 关配置通过
```

契约约定的验证命令：

```powershell
npm install
npm run check
node ..\Trae产物\scripts\check_gameplay.js .\scripts\gameplay
node ..\Trae产物\scripts\validate_levels.js ..\Trae产物\config\levels_240.json
```

**未完成部分**（契约里明确列出的后续派发单）：

- `AudioManager` 的百度/讯飞双通道 TTS、音频实例生命周期、BGM
- `LevelManager` 的累计成绩、玩法切换、复活、Boss 总计时
- 实时 1v1 PvP（Phase3）
- Cocos 场景的可视化节点搭建（当前玩法层已就绪，UI 节点未完成）

## 七、关于这个仓库

上传的是 `assets/`（代码 + 配置）和契约文档。**2199 张图片资源（约 300 MB）未包含**，因为体积超出合理范围。克隆后需要自行放入 `assets/textures/` 与 `assets/resources/` 下的美术资源才能完整运行。

Cocos Creator 3.8.8 工程，`package.json` 声明版本 3.7.3 / creator 3.8.8。

## 许可证

MIT License
