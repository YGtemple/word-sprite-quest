# CONTRACT v1.3 — 单词精灵闯关 v2 技术契约（冻结版）

> **版本号：v1.3**　|　生效日期：2026-07-29　|　制定方：WorkBuddy（架构师 / 校验闸门）
> **上一版本：v1.2（2026-07-29）**　|　本次变更（留存增强）：① 新增第 5 模式档 **`arcade`（纯游戏档，娱乐 95%+，词仅作皮肤）**；② 新增**元留存层**（体力【宽松原则】/ 道具 / 看广告复活 / 每日任务+登录日历 / 异步排行榜）；③ 新增 **R10 体力宽松红线**（不得因体力稀缺劝退用户）；④ `mode` 取值扩为 5 档。
> **约束等级说明**：【冻结】= 任何改动须广播并重发派发单；【红线】= 违反即退回（P0）。

本文件是跨平台协同开发的唯一事实来源。Codex / GPT+Banana / Trae / 微信开发者工具
的所有产出**必须**与本契约对齐。契约变更须：① 升版本号 → ② 广播 → ③ 下游缓存失效重做。

> **v1.3 升级须知（R4 广播）**：v1.3 相对 v1.2 为**结构性扩展**。`mode` 新增 `arcade` 取值；
> 新增 §11 元留存层（管理器级，Codex 实现 `StaminaManager`/`PropManager`，接入既有 `AdManager`/`AnalyticsManager`）。
> Codex 重拉 `BaseLevel.ts` v1.3；Trae 按 §4/§11 重生成配置与工具链；Nano Banana / Trae design 按 §8 出图与界面。
> 旧 v1/v1.1/v1.2 缓存一律作废。

---

## 1. 版本快照与协作边界（R4）

- 本契约头部带版本号 `v1.3`；每次派发单绑定对应版本。
- 任一平台开工前须先读取本契约当前版本；下游产物须标注 CONTRACT 版本。
- 变更流程：WorkBuddy 升版 → 广播至所有平台 → 下游丢弃旧缓存、按新版重做。

## 2. 产品定位（一句话，指导非契约字段）

> **休闲游戏为外壳，分级词汇训练为内核，萌宠养成为长线闭环；面向初中→大学，用户自由在"摸鱼休闲"与"主动备考"间切换，学习权重自调。**

大厅入口：`轻松摸鱼` / `冒险闯关` / `专注集训` / `实时PK(弹性)` / **`街机纯玩`(arcade，可选独立卡或并入摸鱼次级页)**。

## 3. WordData 数据模型（【冻结】，14 个键：id 主键 + 13 业务字段）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | number | 单词唯一 ID |
| `word` | string | 单词 |
| `phonetic` | string | 音标 |
| `meaning` | string | 中文释义 |
| `pos` | string | 词性 n./v./adj./adv. |
| `category` | string | 主题分类（分类玩法用） |
| `synonyms` | string[] | 近义词 |
| `antonyms` | string[] | 反义词 |
| `example` | string | 例句 |
| `example_trans` | string | 例句翻译 |
| `image_tag` | string | 配图文件名（须 = `img_<word>.png` 去扩展名且已 sanitize，仅低阶 tier 用） |
| `grammar_tags` | string[] | 语法标注（语法选择用） |
| `frequency_rank` | number | 词频排名（难度控制用） |
| **`examLevel`** | `'middle'\|'high'\|'cet4'\|'cet6'\|'postgrad'` | 分级词库标签（中考/高考/四级/六级/考研），驱动词库分层与高阶禁卡通图 |

> **字段计数勘误（2026-07-29）**：本节曾误写"12 字段"。实际含 `id` 共 14 个键（13 业务 + `id`）。仅文档笔误，接口以本表为准。
> 所有交互文案经 i18n / 动态文本渲染，**禁止**把英文单词写死到 UI 节点。

## 4. LevelData 关卡配置（【冻结】）

**v1 既有字段**：`chapter`(1-8) · `index`(1-30) · `gameplayType`(LevelType 枚举) · `optionCount`(量化 3→6)
· `timeLimit`(量化 25→12s) · `wordFreqBand`('high'|'mid'|'low') · `isBoss`(bool)
· `comboReq`(小Boss≥3 / 大Boss≥5) · `winTarget`(通关所需答对题数) · `difficulty`(难度档)。

**v1.1 新增字段**：`actionIntensity`(0-3) · `wordCount` · `withinLevelEscalation`(bool) · `starThresholds` · `scoreRule`。

**v1.2 变更字段**：
- `mode: GameMode` — 由 `study/arcade/hybrid` 改为 4 档（v1.3 扩为 5 档，见 §4.1）。
- `mixedTypes: LevelType[]` — 泛化为"本关题型序列"：campaign 非 Boss 关也可用；Boss 关须 ≥2 种混合。

**v1.3 新增字段（元留存层，见 §11）**：
- `staminaCost: number` — 进入本关消耗的体力（**0 表示不消耗**；arcade 档建议设 0 或极低）。
- `propRewards: PropType[]` — 结算可能掉落的道具类型。
- `allowAdRevive: boolean` — 是否允许"看广告复活"。

### 4.1 模式族（GameMode，5 档，v1.3 扩展）

| 模式 | 大厅入口 | 娱乐↔学习 | 机制 | 目标人群 |
|---|---|---|---|---|
| `casual` | 轻松摸鱼 | 娱乐为主 | 消消乐/字母迷宫/弹幕躲避；低时间压、不绑复习 | 碎片摸鱼、防压力退出 |
| `campaign` | 冒险闯关 | 均衡 | 240 主线，一关多题型序列，萌宠冒险推进，生词自动入簿 | 日常主力 |
| `bootcamp` | 专注集训 | 学习为主 | 定向词库+遗忘曲线复习+易混辨析；高阶去卡通图 | 备考刚需 |
| `pvp` | 实时PK | 弹性 | **Phase3 延后**；MVP 先用异步排行榜/镜像赛占位 | 社交攀比 |
| **`arcade`** | **街机纯玩** | **娱乐 95%+** | **纯游戏机制（弹球/跑酷/放置），单词仅作皮肤/主题，不考记忆**；技能/反应/连击驱动 | **纯休闲、强留存、防流失** |

> `casual` 复用 15 玩法类型（不新增类型，避免注册表 R5 漂移）；`arcade` 的弹球/跑酷/放置为**独立玩法类型**，建议在注册表新增 `#16 精灵弹球`、`#17 无尽跑酷`、`#18 放置合成`（见 §10），仍继承 `BaseLevel` 走计时/连击/HUD/资源钩子。
> `arcade` 产出资源**同样**经 `grantResources` 汇入 `ResourcePool`，不另立存储（R9）。

### 4.2 渐进难度（5 档，全模式通用）

`teach → basic → advanced → challenge → boss`，对应 `difficulty` 0-3。单关内 `withinLevelEscalation` 实现**关内递进阶**：每 3 连击干扰项更近义、限时×0.9、5% 陷阱题；断连击归零。

### 4.3 Boss 混合 / 多题型序列（v1.2 泛化）

- 任意关（含非 Boss）可在 `mixedTypes` 给**有序题型序列**，由关卡运行时顺序播放（campaign 一关多题型即此）。
- `isBoss===true` **必须** `mixedTypes.length>=2`，由 `BossCoordinator` 按波次调度，最终波混合。
- `arcade` 关不强制 `mixedTypes`（其核心是单一游戏机制，不考词）。

## 5. 萌宠养成元系统（【v1.2 新增，核心护城河】）

- **跨模式资源闭环**：所有模式结算时经 `BaseLevel.grantResources(amount)`  emit `level-reward` → `ResourceManager` 入账统一 `ResourcePool`（货币+材料）。
- `ResourcePool` 仅供**宠物成长 / 皮肤 / 家园装饰**消费，形成"随便玩也能养宠物；认真学养成更快"的长线留存闭环。
- `PetSystem`（属 `core/`，由 Codex 实现）订阅 `level-reward`，驱动宠物经验/外观/家装；与玩法解耦。
- **模式联动硬约束**：所有模式写入**同一** `WrongWordBook` 与**同一** `ResourcePool`；bootcamp 复习读取 `WrongWordBook`，不另立存储。

## 6. 目录结构（【冻结】）

```
assets/
  scenes/        Launch / Home(模式大厅) / Game / Result / Infinite / Arcade
  scripts/
    core/        GameManager · AudioManager · AdManager · StorageManager ·
                 LevelManager(含 BossCoordinator) · ResourceManager · AnalyticsManager ·
                 PetSystem · StaminaManager · PropManager · PlatformAdapter
    gameplay/    BaseLevel.ts + 15 个 <X>Level.ts（每个需支持 4 模式族双/多形态）
                 + 3 个 arcade 玩法（BallLevel / RunnerLevel / IdleLevel）
    ui/  pet/  social/  data/  (WordDatabase · LevelConfig · PlayerData · WrongWordBook · ResourcePool)
  textures/      main/（UI图集+宠物骨骼, <1.5MB） · subpackages/（ch1..ch8）
  config/        words_ch1..8.json(按 examLevel 分层) · levels_240.json · pet_config.json · achievements.json
```

## 7. 命名规范（【冻结】）

- **玩法注册表**：`scripts/gameplay/<X>Level.ts` 与 `LevelType` 一一对应（v1.3 共 18 个，见 §10）。
- **image_tag sanitize（R5）**：统一小写+下划线；生图与词库转换前必须 sanitize，否则裂图（`sanitizeImageTag()`）。
- `image_tag` 必须等于 Nano Banana 出图文件名 `img_<word>.png`（去扩展名）。
- **v1.3**：`mode` 取值严格 `casual|campaign|bootcamp|pvp|arcade`；`examLevel` 取值严格 5 档。

## 8. 风格 Token 与视觉规范（【v1.2 年轻化改造】）

- 主色紫 `#7C3AED`、青 `#06B6D4`、点缀橙 `#F59E0B`；Cocos UI 硬编码这三色。
- **v1.2 美术基调**：年轻化 **Q 版马卡龙卡通**，**严禁低幼幼儿向元素**（禁止蜡笔粗描边、奶瓶/积木等婴幼符号）；适配初高中、大学生审美。每章在三大主色派生**马卡龙系章节强调色**+专属场景，**禁止 8 章共用纯色底**。
- **答题反馈**：绿对/红错粒子、暴击满屏、震屏、慢动作、星级迸发；宠物 Spine 实时反应。
- **高阶去卡通图**：`examLevel>=cet4` 的关卡**禁用 `Picture` 玩法**且**不生成卡通配图**，改用例句+词根解析卡片。
- **`arcade` 档视觉**：沿用主色与马卡龙基调；单词以"皮肤/主题"形式出现（如弹球砖块印单词色块、跑酷障碍带单词轮廓），**不要求玩家识读**。

## 9. 红线清单（违反即 P0 退回）

- **R4 版本快照**：契约/素材/代码版本错乱 → CONTRACT vX + 派发绑定 + 广播/缓存失效。
- **R5 命名漂移**：空格/大写/符号 → 裂图 → `sanitizeImageTag()`。
- **R6 跨分包引用**：主包引用分包纹理 → 构建失败 → 主包零跨包引用。
- **R7 双平台差异**：API 混写 → `PlatformAdapter` + 双平台字段 + 两端联调。
- **禁英文答题文字**：图片禁止含任何英文单词/文字，文字区留空由 Cocos 渲染。
- **代码质量红线**：① 仅 Cocos 3.8 白名单 API；② 计时器清理；③ 空 `wordData` 边界；④ 经 `PlatformAdapter`；⑤ 无 `console`。
- **R8 模式族红线**：每玩法子类须支持 `campaign` 与 `bootcamp` 形态（由 `mode` 切换）；`hybrid`→现 `campaign/bootcamp` 含 `mixedTypes>=2`；禁止任何关卡"仅题数/限时调高而无机制变化"。
- **R9 模式联动红线（v1.2）**：所有模式**必须**写入同一 `WrongWordBook` 与 `ResourcePool`；结算**必须**经 `grantResources` 入账，禁止玩法私自另存资源/生词。
- **R10 体力宽松红线（v1.3 新增）**：**体力系统必须"宽松"，不得因体力稀缺导致用户流失**。具体要求：① 自然恢复速率远高于行业（≈每 2-3 分钟回 1 点）；② 多免费获取渠道（每日登录/看广告/升级/宠物互动/连续闯关/好友赠送），无付费墙；③ **0 体力兜底**：体力=0 时须提供"看广告免费玩一局"通道，永不硬阻塞核心入口；④ 新手前 7 日近乎无限体力；⑤ 禁止"体力不足即锁死入口、必须付费才能继续"。

## 10. 玩法注册表 ↔ 文件映射

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
| 理解 | 12 | 看图猜词 | PictureLevel.ts | 15s/题，答对10（**仅低阶 tier**） |
| 应用 | 13 | 语法选择 | GrammarLevel.ts | 25s/题，答对8 |
| 应用 | 14 | 翻译闯关 | TranslateLevel.ts | 40s/题，翻译6 |
| 应用 | 15 | 句子排序 | OrderLevel.ts | 45s/题，排序6 |
| **纯游戏** | **16** | **精灵弹球**（物理打砖块） | **BallLevel.ts** | 技能/连击驱动，不考词 |
| **纯游戏** | **17** | **无尽跑酷**（反应收集） | **RunnerLevel.ts** | 反应/连击驱动，不考词 |
| **纯游戏** | **18** | **放置合成**（离线成长） | **IdleLevel.ts** | 合成/放置，零学习 |

> **v1.3 说明**：`arcade` 档玩法为 #16-#18，独立机制、继承 `BaseLevel`、经 `grantResources` 汇入 `ResourcePool`。`casual` 复用 Eliminate/Spell/Listen 实时变体；`Picture` 仅限 `examLevel<high` 关卡。

---

## 11. 元留存层（【v1.3 新增，P0】）

> 目的：在"玩法"之外建立**短周期留存与变现钩子**，把单局游玩拧成每日回归闭环（见《留存引擎》图）。本层全部为**管理器级**，不侵入玩法逻辑。

### 11.1 体力系统（StaminaManager）—【宽松原则，R10】
- **恢复**：自然恢复 ≈ 每 2-3 分钟 +1 点（上限宽松，建议 30-50），远高于常见 5-10 分钟。
- **免费获取（无付费墙）**：每日登录 +N · 看广告 +N · 等级提升 +N · 宠物互动/抚摸 +N · 连续闯关奖励 · 好友赠送。
- **0 体力兜底**：体力=0 时提供"**看广告免费玩一局**"入口（不消耗体力、不付费），**永不硬阻塞**。
- **新手保护**：前 7 日近乎无限体力，先建立习惯。
- **禁止**：体力不足即锁死核心入口、强制付费才能继续（R10）。
- 配置字段：`staminaCost`（arcade 建议 0 或极低；campaign/bootcamp 可设小值）。

### 11.2 道具系统（PropManager）
- **类型**：提示(hint) / 洗牌(shuffle) / 冻结(freeze) / 锤子(hammer) / 复活(revive)。
- **产出**：关卡结算掉落 · 每日任务 · 活动 · 宠物互动；**非付费墙**，付费仅加速获取。
- **使用**：局内触发，给玩家翻盘 agency（如复活=免于失败重来）。

### 11.3 看广告复活 / 翻倍（接 AdManager + PlatformAdapter，R7）
- **复活**：失败时可"看广告满血复活"继续本局。
- **翻倍**：结算时可"看广告资源翻倍"（`grantResources` 倍率×2）。
- 须经 `AdManager`（双平台广告 API 统一封装），禁止玩法直接调平台广告。

### 11.4 每日任务 + 7 日登录日历
- 每日 3 条任务（如"玩 1 局街机""闯关 3 关"），奖励资源/道具/体力。
- 7 日连续登录日历，第 7 日给稀有皮肤/宠物材料（强化 §5 闭环）。

### 11.5 异步排行榜（接 AnalyticsManager / social）
- 分模式榜单（街机/闯关/集训），异步刷新；社交攀比驱动回流。
- 实时 1v1 PvP 仍属 Phase3（见 §4.1）。

---

**配套锚点代码（由 WorkBuddy 提供，Codex 依此实现子类）**：
- `scripts/gameplay/BaseLevel.ts`（v1.3：含计分/递进/星级 + `grantResources` 奖励钩子；体力由 `StaminaManager` 在开局前扣除，不在此类内）
- `scripts/core/PlatformAdapter.ts`（双平台抽象层，含广告接口）
- `scripts/data/WordData.ts`（含 `examLevel` 与 `sanitizeImageTag`）、`scripts/data/LevelData.ts`
