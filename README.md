<div align="right">

**[English](README.md)** · [简体中文](README.zh-CN.md)

</div>

# word-sprite-quest

A WeChat mini-game built in Cocos Creator 3.8 — casual shell, graded vocabulary trainer inside, pet progression on top.

18 play modes · 5 difficulty tiers · 240 levels

<sub>TypeScript · Cocos Creator 3.8.8</sub>

---

## What it is

A casual game on the surface, a vocabulary trainer underneath.

```
casual shell (18 modes)  +  training core (5 tiers / 240 levels)  +  long-term loop (pet + meta retention)
```

### Five modes

| Mode | Purpose | Stamina cost |
|---|---|---|
| `study` | structured learning | yes |
| `hybrid` | learn and play mixed | yes |
| `casual` | casual play | **0** |
| `arcade` | arcade-only, 15 levels | **0** |
| `challenge` | challenge run | yes |

Casual modes cost nothing on purpose — a mode you play for fun should not be gated by stamina.

### Eighteen play modes

Ball, Runner and Idle as base mechanics, plus fifteen question-shaped variants. Every mode implements the same three hooks: `onQuestionStart`, `onAnswer`, `onResult`.

## How the multi-AI collaboration worked

Three AI agents worked on separate parts of this project. Contracts are what kept them from colliding.

### Contract first

`docs/CONTRACT.md` freezes every cross-module interface:

- `BaseLevel` abstract and shared methods
- The twelve fields of `WordData`
- Naming rules (lowercase with underscores, file names excepted)
- Dual-platform isolation (WeChat / Douyin)
- **Version freezing** — changing the contract requires a version bump, never a silent edit

No agent's output may cross a contract boundary. The config generator, for example, must emit field structures that `schema_v1_3.js` defines.

### Turning product intent into assertions

`build.js` contains this check:

```js
addCheck('wordCount=0（词仅作皮肤）',
  levels.every(l => l.wordCount === 0), '合规');
```

This asserts **product design**, not a technical constraint — arcade levels use words purely as visual skin, never as a memory test. Once it is an assertion, that design cannot be quietly dropped in a later iteration.

The same applies to the R9 check: it verifies that `pet_config` lists `arcade` in `coin.sources`, i.e. that arcade output really does flow into the shared resource pool.

### Business ethics written into config

The contract states that gating play behind stamina and demanding payment is forbidden. `tooling/config/stamina_config.json` carries that through:

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

That `redLine` string looks ceremonial until you notice `validate_meta.js` checks that it exists. It is the only automated way to verify the constraint is still remembered.

## Layout

```
word-sprite-quest/
├── docs/CONTRACT.md             interfaces, frozen
├── tooling/                     merged from two former repos
│   ├── schema_v1_3.js           single source of truth, shared by four scripts
│   ├── build.js                 release gate, 14 check modules
│   ├── validate_meta.js         meta-retention checks, 43 assertions
│   ├── validate_levels.js
│   ├── check_gameplay.js
│   └── config/
│       ├── stamina_config.json
│       ├── props_config.json
│       ├── daily_tasks.json
│       ├── arcade_levels.json
│       └── pet_config_v1_3.json
├── assets/scripts/              gameplay and core logic
└── assets/resources/
```

## Build checks

`build.js` runs 14 check modules against the contract's red lines:

| Check | Covers |
|---|---|
| R5 | `image_tag` naming |
| R6 | bundle size and cross-bundle references |
| R7 | dual-platform isolation |
| R8 | valid `mode` values |
| R9 | ResourcePool linkage |
| R10 | stamina floor (red line) |

```bash
npm run check
```

## Note on assets

Art is not included. The project holds 2,200+ PNG textures (about 300 MB), beyond what belongs in a repository. Source and configuration are complete; art paths follow the structure under `assets/resources/`.

Build output is excluded: `build/`, `library/`, `temp/`, `local/`, `profiles/`.

## Related

- [Profile](https://github.com/YGtemple) — all projects

## License

MIT
