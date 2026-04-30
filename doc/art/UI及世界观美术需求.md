# UI 与世界观美术资源需求

**版本**: v1.0
**范围**: UI图素 + 职业/敌人/魂灵立绘 + 场景背景
**前置文档**: [`技能特效需求.md`](./技能特效需求.md)（spritesheet 战斗特效）
**用途**: 第二阶段美术生产手册，文档内 prompt 可直接复制使用

---

## 〇、决策与基线

### 风格调性

**"暗色仪式 + 魂魄符印 + 霓虹能量"**

在技能特效文档"霓虹秘术+暗色科幻"基础上微调：保留全部色板和霓虹光效，但视觉语言从"赛博面板/电路"换成"祭坛符印/法阵纹路/能量法丝"——更贴"灵魂编织/契约/审判/侵蚀"的世界观词汇。

**关键词清单**（写 prompt 时高频使用）：

```
arcane runes, soul sigils, ritual circles, ethereal energy threads,
glowing magical glyphs, dark ceremonial chamber, neon mystic glow,
floating particles, fractured light, ash and embers, spirit binding,
crystalline shards, ornate metallic frame, occult geometry
```

**风格"避坑"清单**（写 prompt 时加入 negative prompt 或显式排除）：

```
no realistic photography, no anime moe style, no chibi, no Disney,
no bright daylight, no cyberpunk circuit board, no sci-fi mecha,
no text overlay (除非明确要求), no watermark, no logo
```

### 4 职业色板（继承自技能特效文档）

| 职业 | 主色 | 辅色 | 高亮色 | 视觉关键词 |
|------|------|------|--------|-----------|
| 气宗 | `#ff4d4d` 赤红 | `#ff8a65` 橙焰 | `#ffffff` 白芯 | 灼赤魂火、内劲涡流、燃脉裂纹 |
| 剑圣 | `#ffd700` 金 | `#90caf9` 冰蓝 | `#ffffff` 白锋 | 金白锋芒、交叉刃痕、疾风切线 |
| 魔导 | `#64b5f6` 蓝 | `#3399ff` 深蓝 | `#ffd54f` 金弹 | 蓝青结晶、弹舱符印、脉冲炮口 |
| 判官 | `#b388ff` 紫 | `#ffe0b2` 暖白 | `#e040fb` 品红 | 黑白紫金、阴阳法盘、审判印轮 |

### 字体方案（不需生图）

| 用途 | 字体 | 备注 |
|------|------|------|
| 标题/Logo | **Cinzel Decorative** + **Cormorant SC**（中文用 思源宋体 SemiBold） | 西式秘仪石碑感 |
| 正文/UI | **Noto Serif SC** Regular | 与标题协调 |
| 数字/HUD | **Rajdhani** 或 **Orbitron** | 等宽数字，不抢戏 |

接入方式：Google Fonts 直链或本地下载。优先级与 P0 同级。

### 工具分配建议

| 资源类型 | 首选 | 次选 | 理由 |
|----------|------|------|------|
| 风格定调板 | gpt-image-1 | Midjourney | 复合指令服从好 |
| UI 图标/徽章 | gpt-image-1 | Nano Banana | 工整、可带文字 |
| 职业/角色立绘 | gpt-image-1 出首张 → Nano Banana 同系列 | — | 风格一致性靠 Banana |
| 场景背景 | gpt-image-1 | Midjourney | 氛围图 MJ 更强但 GPT 够用 |
| 敌人立绘批量 | Nano Banana（基于第一张） | gpt-image-1 | 一致性优先 |

### 通用规格约定

- **格式**：透明底优先用 PNG；不透明用 WebP（高压缩）
- **分辨率**：所有资源生图时**至少 2x 目标尺寸**，便于后期 retina 显示
- **色彩空间**：sRGB
- **后处理**：生图后过 [TinyPNG](https://tinypng.com) 压缩；透明底有问题用 [remove.bg](https://www.remove.bg) 抠

---

## 一、资源优先级总表

| 优先级 | 资源组 | 数量 | 累计张数 |
|--------|--------|------|----------|
| **P0** | 风格定调板 | 1 | 1 |
| **P1** | 职业徽章 | 4 | 5 |
| **P1** | 资源图标 | 5 | 10 |
| **P1** | 技能类型图标 | 6 | 16 |
| **P1** | 职业战斗立绘（街霸风格） | 4 | 20 |
| **P2** | 战斗背景图 | 4 | 24 |
| **P2** | 职业选择背景 | 1 | 25 |
| **P2** | 魂灵祭坛背景 | 1 | 26 |
| **P3** | 敌人立绘（首批） | 3 | 29 |
| **P3** | 魂灵卡面 | 9 | 38 |
| **P3** | 强化卡稀有度框 | 3 | 41 |

**建议生产节奏**：P0 → P1（一气做完，是观感跨档关键）→ 接入游戏验证 → P2 → P3 按上线节奏补。

---

## 二、P0 风格定调板

> **作用**：所有后续生图的"风格锚"。把它扔给 Banana 当 reference image，或扔给 MJ 当 `--sref`，能极大提升风格一致性。**没有这一张，后面 40 张图就有 40 种风格。**

### 资源条目

- **文件名**：`style_reference_master.png`
- **目录**：`game-v2/assets/art/_reference/`
- **尺寸**：2048 x 2048（正方形）
- **格式**：PNG，无需透明底
- **数量**：1 张

### Prompt（标准英文版，可直接复制给 gpt-image-1 / MJ）

```
A single 2048x2048 master style reference sheet for a dark ritual occult
roguelike card battle game. The sheet is divided into a 2x2 grid showing
4 themed quadrants, each representing one playable class:

Top-left quadrant (Qi Master): crimson red and white-hot ember palette,
swirling internal flame energy, fractured glowing veins on dark stone,
a humanoid silhouette wreathed in red mist.

Top-right quadrant (Sword Sage): brilliant gold and pale blue palette,
crossing blade light streaks, golden runic sword sigils, ethereal wind
slashes, a humanoid silhouette with a vertical golden blade aura.

Bottom-left quadrant (Mana Mage): cool cobalt blue and gold palette,
crystalline ammunition shards, hexagonal arcane glyphs, hovering energy
projectiles with magical containment runes, a humanoid silhouette inside
a floating runic chamber.

Bottom-right quadrant (Judgment Arbiter): deep purple, magenta and warm
white palette, yin-yang ritual scale, intertwined black-white energy,
ornate judgment wheel of glowing sigils, a humanoid silhouette poised
between light and shadow.

Each quadrant features ornate metallic frame edges with engraved soul
runes, ethereal floating particles, dark ceremonial background,
high contrast neon mystic glow against deep black.

Visual style: digital painting blended with arcane symbology,
painterly textures, no realistic photography, no anime, no chibi,
no cyberpunk circuitry. Mood: solemn, ritualistic, dark, sacred,
mysterious. Ultra-detailed, dramatic lighting, cohesive palette.
```

### Prompt（Cursor agent 中文版）

```
请用 gpt-image-1 生成一张 2048x2048 的"风格定调参考板"。这张图将作为
《Spirit Weaver》整个游戏所有后续美术资源的风格锚定，请严格执行：

【画面分区】
2x2 四宫格构图，每个象限对应一个游戏职业：
- 左上"气宗"：赤红+橙焰+白芯，火焰内劲涡流，深色石面上的灼热裂纹，红雾包裹的人形剪影
- 右上"剑圣"：金+冰蓝+白，交叉刃光，金色刀刃符文，疾风切线，金光剑形的人影
- 左下"魔导"：青蓝+金+深蓝，结晶弹片，六边形法阵，悬浮的能量弹+封印符文,法阵中的人影
- 右下"判官"：深紫+品红+暖白,阴阳天平,黑白能量交织,审判印轮,光暗之间的人影

【视觉语言】
- 每象限都有金属雕花边框，刻着魂灵符文
- 漂浮的光粒，深色仪式背景
- 高对比霓虹魔法发光 vs 深黑底色

【风格】
数字绘画+秘术符号，绘画质感。绝对不要：写实摄影、动漫、Q版、赛博电路。
氛围：庄严、仪式感、暗色、神圣、神秘。

输出 PNG，sRGB，最高细节。
```

### 验收标准

- [ ] 4 个职业的色板视觉上**清晰可分辨**（不是模糊的混色）
- [ ] 整体氛围统一，不出现 1 个象限是写实、其它是动漫
- [ ] 没有任何文字（避免后续 reference 时把文字也带进去）
- [ ] 边框/符文风格一致

---

## 三、P1 高频 UI 素材

### 3.1 职业徽章 / 纹章

> **作用**：顶栏角色显示、技能 cut-in 横幅、选择职业按钮、强化卡角标。出现频次最高的图素之一。

#### 资源条目

- **文件名**：`badge_qi.png`、`badge_combo.png`、`badge_mana.png`、`badge_balance.png`
- **目录**：`game-v2/assets/art/badges/`
- **尺寸**：512 x 512（实际显示 64-128px，留 retina 余量）
- **格式**：PNG 透明底
- **数量**：4 张

#### Prompt 模板（按职业替换 `{...}`）

```
A circular emblem badge, 512x512, transparent background, centered composition.
A glowing arcane sigil representing "{职业概念}" inside an ornate metallic
ring engraved with soul runes. The sigil is made of {主色} energy with
{辅色} accents and {高亮色} core. Dark mystic background visible only
inside the ring. Painterly arcane style, occult geometry, neon mystic glow.
No text, no characters, no realistic depiction.
Style: matches master style reference (a dark ritual occult game).
```

#### 4 职业具体填充

| 职业 | `{职业概念}` | `{主色}` | `{辅色}` | `{高亮色}` | 核心符号建议 |
|------|------|------|------|--------|--------|
| 气宗 | "internal flame and burning meridian" | crimson red | ember orange | white-hot core | 涡旋火焰 / 燃烧的拳印 |
| 剑圣 | "crossing blades and gale wind" | gold | pale blue | white | 交叉双刃 / 风之太极 |
| 魔导 | "crystalline ammunition and runic chamber" | cobalt blue | deep blue | gold | 六芒星法阵 / 弹舱印 |
| 判官 | "yin-yang scale and judgment wheel" | deep purple | warm white | magenta | 阴阳轮 / 天平 |

#### Cursor agent 调用版（一次性 4 张）

```
请用 gpt-image-1 生成 4 个职业徽章。每个都是 512x512 透明背景 PNG，
圆形纹章构图，金属雕花外环刻有魂灵符文，中心是发光符印。

风格基线：参照 style_reference_master.png（暗色仪式+魂魄符印+霓虹能量）

1. badge_qi.png    —— 气宗：赤红涡焰拳印，橙焰辅色，白芯
2. badge_combo.png —— 剑圣：金色交叉双刃风轮，冰蓝辅色，白光
3. badge_mana.png  —— 魔导：青蓝六芒法阵+弹舱印，深蓝辅色，金芯
4. badge_balance.png — 判官:阴阳轮+天平,深紫主色,暖白辅色,品红核心

绝对不要文字、不要人物、不要现实物体描绘。透明底纯净。
```

#### 验收

- [ ] 透明底干净（无白边）
- [ ] 4 个徽章**外环金属风格一致**，只有内部符印和颜色不同
- [ ] 缩到 64px 仍可辨识

---

### 3.2 资源图标

> **作用**：资源面板的资源类型标识（替换当前的色块）；技能卡上的消耗图标。

#### 资源条目

- **目录**：`game-v2/assets/art/icons/resources/`
- **尺寸**：256 x 256
- **格式**：PNG 透明底
- **数量**：5 张

| 文件名 | 资源 | 视觉概念 |
|--------|------|----------|
| `res_qi.png` | 气 | 赤红能量小球，内有涡旋火焰 |
| `res_combo.png` | 连击 | 金色锐角刃形碎片 |
| `res_mana.png` | 魔力 | 青蓝晶体多面体 |
| `res_ammo.png` | 弹药 | 金色子弹形能量结晶 |
| `res_balance.png` | 平衡 | 阴阳点（黑白对半小圆） |

#### Prompt 模板

```
A single small game UI resource icon, 256x256, transparent background,
centered. {视觉描述}. Glowing {主色} energy with {辅色} highlights,
soft outer glow halo. Clean silhouette, readable at 32px. No text,
no border frame. Style: arcane mystical icon, painterly with neon edge,
matches dark ritual game master reference.
```

#### Cursor agent 一次性版

```
用 gpt-image-1 生成 5 个游戏资源图标，全部 256x256 透明背景 PNG，单个
图标构图，缩小到 32px 仍清晰可辨。风格参照 style_reference_master.png。

1. res_qi.png      — 赤红能量球内有涡旋火焰，外层橙焰光晕
2. res_combo.png   — 金色锋利刃形能量碎片，几何感强，冰蓝高光
3. res_mana.png    — 青蓝晶体多面体，半透明，内有深蓝符印发光
4. res_ammo.png    — 金色子弹形能量结晶，垂直构图，白芯发光
5. res_balance.png — 阴阳点（标准太极符号），紫色高光，品红描边

无文字、无外框、纯透明底。
```

---

### 3.3 技能类型图标

> **作用**：所有技能卡左上角的类型标识（替换当前的 ⚔ ✨ 💥 emoji）；锤子卡的小角标。

#### 资源条目

- **目录**：`game-v2/assets/art/icons/skill_types/`
- **尺寸**：192 x 192
- **格式**：PNG 透明底
- **数量**：6 张

| 文件名 | 类型 | 视觉概念 |
|--------|------|----------|
| `type_attack.png` | 攻击 | 单刃斩击线 |
| `type_special.png` | 特技 | 双菱形交叠 |
| `type_ultimate.png` | 能量技/终结 | 八芒星 + 中心宝石 |
| `type_passive.png` | 被动 | 古典盾牌纹章 |
| `type_followup.png` | 追加技 | 双箭头追加符 |
| `type_reload.png` | 装填/功能 | 圆弧充能符 |

#### Prompt 模板

```
A single game UI skill type icon, 192x192, transparent background,
centered geometric symbol. {视觉描述}. Made of glowing white-gold energy
with subtle outer halo. Minimal, monochromatic, high contrast.
Readable at 24px. No text, no class color (will be tinted in code).
Style: arcane sigil, occult geometric symbol, dark ritual game.
```

#### Cursor agent 版

```
用 gpt-image-1 生成 6 个技能类型图标，全部 192x192 透明背景 PNG，
单色金白能量构图（颜色后期程序 tint 替换），24px 仍可辨识。

1. type_attack.png    — 单刃斩击线（向右下斜线）
2. type_special.png   — 双菱形交叠（X 形几何）
3. type_ultimate.png  — 八芒星+中心宝石（对称放射）
4. type_passive.png   — 古典盾牌纹章（垂直构图）
5. type_followup.png  — 双箭头追加符（横向连续箭头）
6. type_reload.png    — 圆弧充能符（环绕式弧线+点）

风格：神秘几何符印，简洁高对比，无文字无颜色（统一金白）。
```

---

### 3.4 职业战斗立绘【v3.0 — 露脸+反忍者+具体面部描述】

> **版本迭代**：
> - v1.0 "4 个不同颜色的兜帽法师" → 剪影不区分、不是战斗立绘、无武器 → 推翻
> - v2.0 "街霸风格+遮脸" → GPT 把所有角色都画成蒙面忍者，3 个人撞型 → 推翻
> - **v3.0（当前）**：去掉所有遮脸指令，给每个角色**具体面部描写**（年龄/发型/表情），强化反忍者 negative prompt。判官保留半面具（适合角色气质），但下半脸露出。

#### 资源条目

- **目录**：`game-v2/assets/art/portraits/`
- **尺寸**：1024 x 1536（竖版七分身，头到膝）
- **格式**：PNG 透明底
- **数量**：4 张

| 文件名 | 职业 |
|--------|------|
| `portrait_qi.png` | 气宗 |
| `portrait_combo.png` | 剑圣 |
| `portrait_mana.png` | 魔导 |
| `portrait_balance.png` | 判官 |

#### 画风基线

**"街霸式战斗立绘"**——格斗游戏角色选择画面风格：
- 夸张但清晰的体态剪影，远看就知道是谁
- 战斗起手式 / 攻击动作中间帧定格，每张图都有张力
- 色块感强、线条粗犷有力、高饱和高对比
- **脸部必须露出**（判官可保留仪式半面具但下半脸可见）
- **七分身构图**（头到膝），留出武器和姿势的完整空间
- **绝对不要忍者**——GPT 默认往忍者跑，每段 prompt 需显式阻止

#### 气宗 `portrait_qi.png`

**形象**：近身武者 / 内劲格斗家。蓄力爆发型——随时要炸的人形锅炉。

```
A vertical 1024x1536 character portrait, transparent PNG background,
7/10 body (head to knees). Fighting game character select screen style.
Bold linework, high contrast, vivid colors, dramatic lighting.

FACE MUST BE FULLY VISIBLE. No mask, no face wrap, no hood, no visor.

A powerful muscular martial artist in a combat stance. Male, age 30s,
short black hair with a few grey streaks, thick eyebrows, fierce
determined expression, strong jawline, slight stubble. Tanned skin.
Athletic heavyweight build — wide shoulders, thick arms, visible
muscle definition.

Outfit: open-front dark combat vest showing wrapped chest bandages
and bare muscular arms. Forearm wraps and iron knuckle gauntlets.
Loose martial arts pants with ankle ties. Armored shin guards.
NO hood, NO ninja outfit, NOT an assassin — this is a bare-knuckle
brawler like Ryu or Akuma from Street Fighter.

Pose: deep horse stance, one fist pulled back charging with intense
crimson-red compressed energy, the other fist thrust forward
releasing a shockwave burst. Ground cracking beneath feet.

Effects: red energy veins along arms like magma under skin, heat
distortion around fists, ember particles rising, cracked earth.

Colors: crimson red (#ff4d4d), ember orange, white-hot energy core.

NEGATIVE: Do NOT cover the face. No mask, no bandana, no face wrap,
no head covering, no ninja hood, no helmet. The full face with
expression must be clearly visible. Do NOT make this character
look like a ninja. No text, no watermark.
```

#### 剑圣 `portrait_combo.png`【v3.1 改色 — 银白冷色系，与魔导彻底分家】

**形象**：极速轻装剑客。连击积攒型——暴风雨般的剑幕。
**色调定位**：冷银/白/冰蓝（Vergil 色调）。金色仅出现在剑气弧线上。绝对不要深蓝/海军蓝——那是魔导的颜色。

```
A vertical 1024x1536 character portrait, transparent PNG background,
7/10 body (head to knees). Fighting game character select screen style.
Bold linework, high contrast, vivid colors, dramatic lighting.

FACE MUST BE FULLY VISIBLE. No mask, no face wrap, no hood, no visor.

A lean agile swordsman frozen mid-slash. Male, age early 20s,
swept-back silver-white hair flowing in the wind, sharp ice-blue
eyes, handsome youthful face, slight smirk. Fair pale skin.
Tall and VERY slender build — noticeably thinner and taller than
other characters. Built purely for speed.

Outfit: form-fitting SILVER-WHITE and platinum grey bodysuit with
ice-blue metallic trim. One asymmetric chrome shoulder guard.
Flowing white cloth strips from waist trailing behind from speed.
The overall color impression must be COLD SILVER/WHITE — like
Vergil from Devil May Cry. NOT dark navy, NOT blue, NOT black.
This character's color identity is SILVER and ICE, not blue or gold.

Weapons: dual short swords (kodachi) — real metal blades with a
cold ice-blue edge glow. One blade slashing forward leaving a
brilliant GOLD arc trail (the gold slash trail is this character's
signature effect). The other blade pulled back ready to strike.
NO floating crystals, NO magical projectiles — this is a pure
melee swordsman, not a mage.

Pose: lunging mid-combo, body twisted at extreme angle, weight on
front foot, back foot off the ground. Faint afterimage / motion
ghost trailing behind showing previous positions. Silver-white hair
and cloth strips dramatically blown backward by speed.

Effects: 2-3 golden slash arc trails in the air from combo hits,
ice-blue sparks where blades cut, speed lines, strong motion blur
on trailing elements. NO crystals, NO spell circles, NO magic
projectiles of any kind.

Colors: SILVER-WHITE outfit (#c0c0c0, #e8e8e8), ice-blue accents
(#90caf9), gold (#ffd700) ONLY on slash trails. The overall color
temperature is COLD — silver, white, ice blue. Must look completely
different from the blue Mana mage.

NEGATIVE: No mask, no face covering. No floating crystals or magical
projectiles. No spell circles. No blue/navy outfit — the outfit is
SILVER/WHITE. No text, no watermark. Do NOT make this look like a
mage or spellcaster. This is a MELEE swordsman only.
```

#### 魔导 `portrait_mana.png`【v3.1 改色 — 鲜明宝蓝色系，去掉一切刀光】

**形象**：快速施法战斗法师。弹药闭环型——连射水晶弹的 rapid-fire caster，不是老巫师。
**色调定位**：鲜明宝蓝/皇家蓝+金弹（暖蓝+金）。绝对不要银白/灰——那是剑圣的颜色。绝对不要刀光斩痕——那是剑圣的效果。

```
A vertical 1024x1536 character portrait, transparent PNG background,
7/10 body (head to knees). Fighting game character select screen style.
Bold linework, high contrast, vivid colors, dramatic lighting.

FACE MUST BE FULLY VISIBLE. No mask, no face wrap, no hood, no visor.

A young aggressive battle mage rapid-firing crystal projectiles.
Male, age early 20s, spiky dark blue hair swept back, confident
smirk, sharp glowing blue eyes, angular face. Medium athletic build.
This is a MAGE — a spellcaster who attacks with magical projectiles.

Outfit: hip-length open-front battle mage COAT in vivid ROYAL BLUE
(bright saturated blue, NOT dark navy, NOT grey) with gold trim and
arcane circuit-line patterns glowing along seams. High collar, coat
flaring open dramatically from casting motion. Underneath: dark
fitted combat wear. Crossed brown leather bandoliers across chest
holding rows of glowing GOLD crystal cartridges (magical ammunition).
The COAT is the #1 visual identifier and must be prominent and
clearly blue — brighter and more saturated than any other character.

Weapons: one hand thrust forward palm-open firing a spread volley
of 4-5 BLUE crystal energy bolts in flight. The other hand at waist
level pulling a gold crystal cartridge from bandolier or conjuring
a spinning hexagonal reload glyph circle. A large spinning arcane
spell circle floats behind the character.
NO SWORDS. NO SLASH ARCS. NO BLADE TRAILS. This character uses
ONLY magical projectiles, never melee weapons.

Pose: aggressive forward lean, coat blown back showing bandolier,
one palm thrust forward releasing crystal volley, feet planted wide.
Confident stance like a magical gunslinger.

Effects: 4-5 blue crystal projectiles spreading outward from palm,
spinning gold reload glyph near off-hand, blue mana circuit lines
glowing on coat sleeves, faint spent crystal particles dissolving
behind. A large circular spell array behind the character.
NO sword slash effects. NO golden arc trails. NO melee effects.

Colors: vivid royal blue coat (#1565c0, #1976d2 — bright, saturated),
warm gold (#ffd54f) for crystal ammunition and trim, dark base
underneath. The overall impression is BRIGHT BLUE + GOLD, clearly
warmer and more saturated than the silver-white Combo swordsman.

NEGATIVE: No mask, no face covering, no goggles over eyes. No swords,
no blades, no slash arc trails, no melee weapons of any kind. This
is a MAGE with a COAT shooting PROJECTILES. The coat must be clearly
BLUE (not silver, not grey, not dark navy). No text, no watermark.
```

#### 判官 `portrait_balance.png`

**形象**：中西结合战斗祭司 / 仪式裁决者。DNF 奶爸 + 阴阳师仪式感。判官保留仪式半面具（覆盖额头和眼部），**下半脸露出**。

```
A vertical 1024x1536 character portrait, transparent PNG background,
7/10 body (head to knees). Fighting game character select screen style.
Bold linework, high contrast, vivid colors, dramatic lighting.

FACE VISIBLE — this character wears a ritual half-mask covering only
the upper half of the face (forehead and eyes), leaving the mouth
and jaw exposed. One eye glows purple, the other glows warm gold.
Strong stern jaw, calm authoritative expression.

A tall imposing combat-priest wielding a massive oversized ritual
weapon. Male, age 40s, broad-shouldered and physically powerful.
Inspired by DNF Crusader archetype — a holy warrior who fights with
an enormous ceremonial instrument. Mixed East-West occult aesthetic.

Outfit: structured battle-vestment — Eastern wrapped cross-collar
(交領) combined with Western armored pauldrons and metallic clasps.
Fitted reinforced torso, split lower hem for movement. The left side
of the outfit in darker purple-black tones, the right side in warmer
gold-white tones — duality woven subtly into the fabric, NOT a harsh
50/50 color split. Waist sash with hanging talisman charms.

Weapon: a MASSIVE oversized circular disc-blade mounted on a heavy
staff, resting on one shoulder. The disc has ABSTRACT GEOMETRIC
engravings with dual-colored energy (purple on one half, gold on the
other). IMPORTANT: absolutely NO yin-yang symbol, NO taijitu, NO
tai-chi circle on the disc. Use abstract alchemical fracture patterns,
geometric rune carvings, or concentric ritual circles instead.
The weapon is comically oversized — its size IS the visual identity.

Other hand: raised with palm open, 4-5 floating talisman papers and
spell-slips orbiting around it. Faint geometric spell circles visible.

Pose: commanding stance, artifact on shoulder, other hand raised
casting. Slight forward lean, weight planted, immovable authority.

Colors: deep purple (#b388ff), warm white-gold (#ffe0b2), magenta
(#e040fb) accents, metallic silver-grey structural elements.

NEGATIVE: Do NOT put a yin-yang / taijitu symbol anywhere in the
image. Do NOT put a scales-of-justice / balance scale symbol. Use
abstract geometric patterns only. No text, no watermark. The lower
face (mouth, jaw, chin) MUST be visible below the half-mask.
```

#### Cursor agent 版（一气做 4 张）

```
用 gpt-image-1 生成 4 张职业战斗立绘，全部 1024x1536 透明背景 PNG。

【画风】街霸风格战斗立绘。粗犷有力的线条、高饱和高对比、夸张剪影。
每个角色在战斗动作定格瞬间。暗黑奇幻设定。七分身构图。

【核心要求】
- 4 个职业剪影完全不同——去掉颜色纯黑剪影也能一眼区分
- 脸部必须完整露出（判官可戴半面具但下半脸可见）
- 绝对不要忍者造型！不要蒙面！不要兜帽！

1. portrait_qi.png 气宗 —— 近身武者/内劲格斗家
   30 多岁男性，短黑发，浓眉，坚毅表情，有胡茬。
   赤膊或紧身武服+绑带护臂+铁拳套，壮硕体格。
   深蹲马步蓄力，一拳前推释放赤红内劲冲击。
   红/橙/白芯色系。手臂气劲如岩浆血管，脚下地面龟裂。

2. portrait_combo.png 剑圣 —— 极速双刀剑客【银白冷色系】
   20 出头男性，银白色长发风中飘动，冰蓝眼光，自信微笑。
   银白/铂金灰紧身衣（像鬼泣 Vergil 的冷银色调，
   绝对不要深蓝/海军蓝——那是魔导的颜色）+单侧银肩甲+白飘带。
   修长体型，比其他角色明显更瘦更高。
   双持短刃（真金属刀+冰蓝刃光），斜砍定格，身后残影。
   金色仅出现在剑气弧线上。绝对不要浮游水晶/法阵/弹丸。
   银白/冰蓝/金斩痕色系。

3. portrait_mana.png 魔导 —— 快速施法战斗法师【鲜明宝蓝色系】
   20 出头男性，深蓝尖刺后梳发，自信表情，蓝色眼光。
   到臀短款开襟法师战袍——鲜明宝蓝/皇家蓝（亮蓝，
   绝对不要银白/灰——那是剑圣的颜色）+金色镶边+
   交叉棕色皮弹药带挂满金色水晶弹。中等体格。
   一手前推掌心连射 4-5 发蓝色水晶弹幕，身后旋转法阵。
   绝对不要刀光斩痕弧线——那是剑圣的效果。
   鲜蓝/金弹色系。必须看起来是法师不是剑客。

4. portrait_balance.png 判官 —— 巨型法器战斗祭司
   40 多岁男性，戴仪式半面具（只盖上半脸，下巴和嘴露出），
   一眼紫一眼金。方下巴，威严表情。
   战斗化祭袍（交领束腰+金属肩甲，中西结合），高大壮硕体格。
   一手扛巨型法器圆盘杖（夸张大，绝对不要太极阴阳图案，
   用抽象几何纹路），另一手张开有符咒纸片环绕。
   紫/暖白金/品红色系。法器大小就是辨识度。

绝对不要：Q 版、日系萌、写实摄影、文字水印、
蒙面、忍者造型、统一穿袍子、统一用兜帽、正面站立无动作、
太极/阴阳符号。
```

#### 验收

- [ ] **露脸**：气宗/剑圣/魔导完全露脸可见表情；判官下半脸可见
- [ ] **不是忍者**：没有全脸蒙面、没有忍者头巾/面罩
- [ ] **剪影测试**：4 张去色转纯黑剪影后仍能一眼区分（体态+武器+姿势完全不同）
- [ ] **战斗感**：每张都在动作定格中，有"下一秒要打你"的张力
- [ ] **职业辨识**：武者/剑客/法师/战斗祭司，一眼知道是哪个
- [ ] 透明底无白底残留（Mode=RGBA, 角落 alpha=0）
- [ ] 缩到 240px 高仍能辨认职业（靠剪影差异而非颜色细节）
- [ ] 法器/武器明确可见，不是装饰性小物件
- [ ] 判官法器上**没有太极阴阳符号**

---

## 四、P2 场景背景【v1.2 重写 — 重大原则修订】

> **重大设计原则修订（v1.2）**：原 v1.0 的 prompt 把背景图当"电影海报"出，结果中央高光全部抢戏，UI 和角色叠上去看不清。新原则按"舞台幕布"出图——**把视觉信息硬性约束到画面边缘，中央留给角色**。

### 4.0 通用构图原则（**所有背景图必须遵守**）

**游戏 UI 叠加结构**（背景图作为底图）：

```
┌─────────────────────────────────────────────┐
│  top-bar                                    │
├─────────────────────────────────────────────┤
│                                             │
│   [玩家区]      对峙间隙       [敌人区]      │  ← 角色在这里
│   左 1/4                       右 1/4       │
│                                             │
├─────────────────────────────────────────────┤
│  bottom-panel                               │
└─────────────────────────────────────────────┘
```

**核心硬性约束**：

1. **画面中央 60% 宽 × 50% 高 必须是"暗、低对比、低饱和"的安全区**
   - 横向：画面 20% 到 80% 的整个带状区域
   - 纵向：画面 25% 到 75% 的整个带状区域
2. **所有高光元素、强对比元素、强色彩元素只能出现在 4 条边缘**：
   - 顶部边缘（0-25% 纵向）
   - 底部边缘（75-100% 纵向）
   - 左极边缘（0-20% 横向）
   - 右极边缘（80-100% 横向）
3. **不允许出现在画面中央区域的元素**：
   - ❌ 光柱、光束（无论从天而降还是从地而起）
   - ❌ 高饱和的发光法阵、符文环
   - ❌ 中央有强反射的水面、能量池
   - ❌ 任何"视觉焦点"——角色才是焦点
4. **氛围传达靠这些手段**（不靠中央高光）：
   - ✅ **远景虚化**：远处建筑剪影，景深虚化
   - ✅ **边缘装饰**：顶部拱顶/吊灯/旗帜、底部地砖/法阵纹、两侧柱子/壁画
   - ✅ **整体色调**：用主色调铺底，中央用暗调即可
   - ✅ **粒子和雾气**：稀疏的飘散粒子、薄雾、光斑
5. **构图参考**：剧场舞台 / Slay the Spire / Darkest Dungeon——**舞台中央暗、四周台口装饰多**

### 4.0' 通用 Prompt 前缀（**所有背景图都要带这段**）

```
CRITICAL COMPOSITION RULE — DO NOT VIOLATE:
This is a UI background for a turn-based battle game. Characters/cards
will be placed in the center of the canvas, and that area must be left
as a dark, low-contrast "stage" so they remain visually clear.

STRICT REQUIREMENTS:
- The CENTRAL 60% width × 50% height of the canvas MUST be DARK,
  LOW-CONTRAST, LOW-SATURATION. No bright glows, no light pillars,
  no glowing magic circles, no high-detail elements in this central zone.
- ALL bright/glowing/high-detail elements MUST be restricted to the
  EDGES: top edge (0-25% vertical), bottom edge (75-100% vertical),
  left edge (0-20% horizontal), right edge (80-100% horizontal).
- The composition should feel like a THEATRICAL STAGE: ornate proscenium
  edges with bright architectural details, a dark empty stage in the middle.
- Use depth-of-field to push detailed scenery into the FAR BACKGROUND
  (heavily blurred). The CENTER must remain dark and uncluttered.
- Reference games for composition: Slay the Spire battle backgrounds,
  Darkest Dungeon, Hades — note how the character zone is always dark.

DO NOT:
- ❌ NO central light pillars (vertical or angled)
- ❌ NO glowing magic circles in the center
- ❌ NO bright energy beams/streams crossing the center
- ❌ NO high-saturation effects in the central 60%×50% safe zone
- ❌ NO characters, NO UI elements, NO text, NO logos
```

---

### 4.1 战斗背景图（4 张）【重写】

#### 资源条目

- **目录**：`game-v2/assets/art/backgrounds/battle/`
- **尺寸**：1920 x 1080
- **格式**：PNG / WebP / JPG
- **数量**：4 张

| 文件名 | 阶段 | 氛围 |
|--------|------|------|
| `bg_stage_1.png` | 阶段一 · 入门 | 古旧仪式厅堂，遗弃感 |
| `bg_stage_2.png` | 阶段二 · 进阶 | 地底岩浆洞窟，灼热感 |
| `bg_stage_3.png` | 阶段三 · 深域 | 漂浮虚空，超脱感 |
| `bg_stage_4.png` | 阶段四 · 终焉 | 神圣审判殿堂，终局感 |

#### Prompt 模板（重写）

```
[在此处粘贴 §4.0' 通用 Prompt 前缀]

A horizontal 1920x1080 game battle background — STAGE BACKDROP STYLE.

EDGE DECORATIONS (where details/highlights ARE allowed):
{边缘装饰描述}

CENTRAL SAFE ZONE (must be dark, calm, uncluttered):
{中央安全区描述}

FAR BACKGROUND (heavily blurred, behind the safe zone):
{远景描述}

OVERALL COLOR PALETTE: {主色调}
MOOD: {氛围词}

Style: painterly digital art, matches style_reference_master_v3.png,
dark ritual occult game. NO characters, NO UI, NO text.
```

#### 4 阶段填充（重写）

**bg_stage_1.png · 入门**

```
{边缘装饰描述} =
- TOP EDGE: a partially collapsed stone ceiling with a small slit of pale
  moonlight visible only in the upper-LEFT CORNER (NOT center), some
  hanging vines and broken vault ribs
- BOTTOM EDGE: cracked stone tiles with faded barely-visible soul sigil
  patterns (very low contrast, mostly dark)
- LEFT EDGE: a tall broken stone pillar with carved runes (dim glow)
- RIGHT EDGE: another broken pillar mirroring the left, with rubble piles

{中央安全区描述} =
A dark empty stone floor and dark recessed wall at the back. Almost no
detail. Low ambient blue moonlight bleeding in from the upper-LEFT EDGE,
NOT directly overhead. The center should look like an empty stage.

{远景描述} =
Heavily blurred suggestion of more pillars and arches receding into deep
shadow. Hint of faint distant light from one side only. Almost
indistinguishable shapes.

{主色调} = cool dark blue, faded stone gray, deep shadow black, very subtle
   pale moon white only at the upper-left corner

{氛围词} = solemn, abandoned, the calm of an empty temple before ritual
```

**bg_stage_2.png · 进阶**

```
{边缘装饰描述} =
- TOP EDGE: a dark cavern ceiling with cracks of glowing crimson lava
  visible only along the very top edge (like a frame)
- BOTTOM EDGE: dark volcanic rock floor with subtle thin lava cracks at
  the very bottom edge ONLY — most of the visible floor is dark obsidian
- LEFT EDGE: a vertical lava waterfall flowing down at the far left edge,
  with glowing rune carvings on the rock wall around it
- RIGHT EDGE: mirroring lava waterfall at the far right edge

{中央安全区描述} =
Dark obsidian/volcanic rock floor and back wall. Almost NO lava in this
area. Maybe a few VERY faint dim ember sparks floating, but no glowing
veins, no bright cracks. The center is a dark stone arena.

{远景描述} =
Heavily blurred suggestion of cavern depth and faint orange glow far behind,
softly diffused. No defined shapes.

{主色调} = deep obsidian black, dark crimson edges, ember orange ONLY at
   edges, center is mostly dark warm gray

{氛围词} = dangerous, primal, the heat is at the walls, the arena is dark
```

**bg_stage_3.png · 深域**

```
{边缘装饰描述} =
- TOP EDGE: a wide horizontal band of deep purple nebula and a few small
  arcane runic circles glowing faintly across the top of the image only
- BOTTOM EDGE: a dark stone platform edge with subtle violet rune carvings
  at the very bottom edge ONLY — most of the floor is dark
- LEFT EDGE: floating crystalline shards drifting along the left edge,
  silhouetted against the nebula
- RIGHT EDGE: more floating crystals on the right edge

{中央安全区描述} =
A flat, mostly dark, weather-worn stone platform surface. The platform
should look like an empty arena. The space above the platform (where
characters will stand) should be DARK COSMIC VOID with only very faint
distant pinpoint stars — NO bright nebulae, NO glowing magic circles,
NO crystal clusters in the central area.

{远景描述} =
Heavily blurred deep purple cosmic void with sparse pinpoint stars.
No defined celestial structures.

{主色调} = deep violet, cosmic indigo, dark purple, with distant magenta
   accents only at top edge

{氛围词} = otherworldly, weightless, an empty stage suspended in the void
```

**bg_stage_4.png · 终焉**

```
{边缘装饰描述} =
- TOP EDGE: ornate carved hall ceiling with two distant pillars of light
  (gold on left, violet on right) RECEDING into the FAR BACKGROUND, NOT
  in the foreground or middle distance. Hanging ceremonial banners along
  the top corners.
- BOTTOM EDGE: dark polished stone floor with subtle ornate gold inlay
  pattern at the very bottom edge ONLY
- LEFT EDGE: tall ornate gothic columns with hanging crimson banners,
  dim wall sconces with low warm flame
- RIGHT EDGE: mirroring columns and banners on the right

{中央安全区描述} =
A dark empty hall floor leading to a distant throne in the FAR BACKGROUND.
The throne is small (heavily distant), backlit by very soft golden glow.
NO light pillars in the central area. The center is a solemn empty hall.

{远景描述} =
Heavily blurred grand hall depth, distant throne barely visible as a
silhouette with soft backlight. Light pillars (if shown) only as DISTANT
receding shafts behind the throne, not in foreground or middle distance.

{主色调} = deep gold-tinted brown, dark crimson, dark violet, with bright
   gold and violet accents ONLY at the top edges and the distant throne

{氛围词} = majestic, final, an empty grand hall awaiting its champion
```

#### Cursor agent 版（重写）

```
用 gpt-image-1 生成 4 张战斗场景背景，全部 1920x1080。

【最重要的硬性约束 - 必须严格遵守】
画面中央 60% 宽 × 50% 高的区域必须是深色、低对比、低饱和的"安全区",
游戏角色会站在画面左 1/4 和右 1/4，需要看清角色。
所有高光、发光元素、强色彩、复杂细节必须放在画面 4 条边缘
（顶 0-25%、底 75-100%、左 0-20%、右 80-100%）。
绝对不能出现在中央：光柱、发光法阵、能量束、高饱和元素。
构图参考：Slay the Spire 战斗背景、Darkest Dungeon、Hades —
舞台中央深色、四周装饰华丽。

【4 张场景描述】

1. bg_stage_1.png 入门
   顶部边缘有一小道月光从破洞透入（仅左上角，不要中央），
   两侧是断裂石柱，底部是暗色地砖隐约可见的法阵纹（仅最底缘），
   远景虚化为更多石柱消失在深处。
   中央：空荡的暗色石地面，几乎无细节。
   色调：深蓝灰+暗石灰+深黑，月光白只在左上角。

2. bg_stage_2.png 进阶
   顶部边缘有岩浆裂纹形成"画框"，左右两侧是垂直岩浆瀑布+岩壁符文,
   底部是暗黑石地面（裂纹仅在最底边缘）。
   中央：深色黑曜石/火山岩地面+背景墙，无岩浆纹路，
   可有极少量飘散余烬。
   色调：深黑曜石+暗赤红边缘+橙焰只在边缘，中央是暗的暖灰。

3. bg_stage_3.png 深域
   顶部是深紫星云+几个小法阵环（只在最上方），左右边缘是漂浮水晶剪影,
   底部是深色平台边缘+紫色符文（仅最底）。
   中央：平坦暗色石平台+空旷的深紫宇宙虚空（只有极远处的星点），
   无大型法阵，无水晶簇。
   色调：深紫+宇宙靛蓝+暗紫，洋红仅在顶边缘。

4. bg_stage_4.png 终焉
   顶部是宏伟廊顶+远处的两根光柱（金/紫，向远景退后，不在画面中央）,
   两侧是高大哥特立柱+悬挂的赤红仪式幡+昏暗壁灯,
   底部是暗色石地+金色镶嵌纹（仅最底）。
   中央：空荡的大厅地面+远景宝座剪影（小、远、暗）。无近景光柱。
   色调：深金棕+暗赤红+暗紫，金色和紫色高光只在顶边缘和远景宝座。

【重要】请在生成前再读一遍上面的"硬性约束"。如果看到 prompt 里有
任何描述疑似要在中央放高光元素，按"边缘"理解，不要放在中央。
风格参照 style_reference_master_v3.png。
```

---

### 4.2 职业选择背景【重写】

- **文件名**：`bg_class_select.png`
- **目录**：`game-v2/assets/art/backgrounds/`
- **尺寸**：1920 x 1080
- **数量**：1 张
- **UI 叠加情况**：**4 张大型职业卡片**会铺在画面中央（约横向 15%-85%、纵向 30%-70%）

#### Prompt（重写）

```
[在此处粘贴 §4.0' 通用 Prompt 前缀]

A horizontal 1920x1080 main menu background — STAGE BACKDROP for
displaying 4 large character class selection cards in the center area.

CRITICAL: The central 70% width × 50% height of the canvas MUST be very
dark and low-contrast — 4 large cards will be placed here and must remain
fully readable.

EDGE DECORATIONS (where details ARE allowed):
- TOP EDGE: a wide arched ornate cathedral-like ceiling with carved
  ceremonial banners hanging from the top corners. Faint star-filled
  deep purple void barely visible above the arch.
- BOTTOM EDGE: an ornate ceremonial floor pattern visible only along
  the very bottom edge — gold inlay on dark stone, large symbolic
  ritual circle barely visible at the very bottom (mostly cropped off).
- LEFT EDGE: a tall ornate gothic column with hanging banner, dim warm
  torch sconce.
- RIGHT EDGE: mirroring column and banner on the right.

CENTER SAFE ZONE:
A vast, dark, empty ceremonial chamber interior. Just deep ambient
shadow. NO pedestals, NO light pillars, NO altars, NO glowing elements
in the center. The 4 cards will fill this space — the background just
needs to provide ambient darkness and atmosphere.

FAR BACKGROUND (visible only above and below the card area):
Heavily blurred suggestion of more architecture receding into shadow.
Maybe a hint of distant warm light from a far-back archway, very dim.

OVERALL COLOR PALETTE: deep stone browns, dark gold accents at edges,
deep purple void above, very subtle warm torchlight only at edges.

MOOD: a sacred chamber awaiting your choice — solemn, anticipating,
the room is dark to make the choice cards stand out.

Style: painterly digital art, matches style_reference_master_v3.png.
NO characters, NO pedestals, NO cards (cards added in code), NO UI,
NO text.
```

#### Cursor agent 版

```
用 gpt-image-1 生成 bg_class_select.png（1920x1080）。

【关键】画面中央 70% × 50% 必须很暗、低对比 ——
4 张大型职业选择卡会覆盖在中央，背景只需要给"环境暗+氛围"，
不要任何居中元素。

【构图】
- 顶部：宏伟拱形廊顶+悬挂的仪式旗帜（仅顶部边缘）+
  顶部上方隐约的紫色星空
- 左右：高大哥特立柱+悬挂幡+昏暗壁炬（仅左右极边缘）
- 底部：仅最底边缘有一截华丽的金色镶嵌石地+大型仪式法阵的极小一弧
- 中央：完全空荡的暗色大厅内部，没有基座、没有光柱、没有发光元素
- 远景：朦胧虚化，仅顶底缝隙处可见远处建筑剪影和极暗的暖光

色调：深石棕+边缘暗金+上方深紫+边缘极暗暖光。
氛围：圣堂等待选择，中央暗以衬托卡片。

绝对不要：中央的基座/祭台/光柱/发光元素；任何角色/卡片/UI/文字。
风格参照 style_reference_master_v3.png。
```

---

### 4.3 魂灵祭坛背景【重写】

- **文件名**：`bg_spirit_altar.png`
- **目录**：`game-v2/assets/art/backgrounds/`
- **尺寸**：1920 x 1080
- **数量**：1 张
- **UI 叠加情况**：**3 张魂灵卡**会铺在画面中央偏下（约横向 15%-85%、纵向 35%-75%）；上方留给标题

#### Prompt（重写）

```
[在此处粘贴 §4.0' 通用 Prompt 前缀]

A horizontal 1920x1080 background for a spirit summoning chamber —
STAGE BACKDROP for 3 spirit selection cards placed in the center.

CRITICAL: The central 70% width × 50% height of the canvas MUST be very
dark and low-contrast — 3 large cards will be placed here.

EDGE DECORATIONS (where details ARE allowed):
- TOP EDGE: ornate gothic chamber ceiling with hanging ritual chains
  and a faint misty veil suggestion at the top. A title text area
  should be clear and dark.
- BOTTOM EDGE: an ornate stone altar visible only at the very bottom
  edge, with a glowing soul-binding circle carved into it (only the top
  arc of the circle is visible, most of the altar is cropped off below).
  A few ethereal candles flickering on the altar's edge.
- LEFT EDGE: a tall gothic pillar with carved soul runes, dim warm
  candles along the wall.
- RIGHT EDGE: mirroring pillar and candles.

CENTER SAFE ZONE:
A dark, mysterious chamber interior — mostly empty space with a hint
of faint mist or smoke drifting upward. NO bright spirit ribbons, NO
glowing energy streams in the center, NO bright magic circles. Just
dark atmospheric depth where the 3 cards will be placed.

FAR BACKGROUND:
Heavily blurred suggestion of more pillars and arches in deep shadow,
maybe a very subtle hint of distant candlelight glow.

OVERALL COLOR PALETTE: deep stone brown, dark warm shadow, candlelight
amber at edges only, very subtle ethereal mist hint in the center
(barely visible, no color saturation).

MOOD: a sacred summoning chamber, dark, mysterious, awaiting the
spirits to be revealed in the cards.

Style: painterly digital art, matches style_reference_master_v3.png.
NO characters, NO spirits, NO cards (added in code), NO UI, NO text.
```

#### Cursor agent 版

```
用 gpt-image-1 生成 bg_spirit_altar.png（1920x1080）。

【关键】画面中央 70% × 50% 必须很暗 ——
3 张魂灵卡会覆盖在中央，背景只需要"环境暗+氛围"，
绝对不能有居中的发光能量丝、光柱、法阵。

【构图】
- 顶部：哥特廊顶+悬挂的仪式锁链+若有若无的紫雾（仅顶部边缘），
  上方需有干净的暗区给标题文字
- 左右：高大立柱（刻有魂灵符文）+暖色烛光（仅左右极边缘）
- 底部：仅最底边缘可见一截华丽石祭坛+祭坛上发光符印的小弧
  （大部分祭坛被裁出画外）+边缘几支烛光
- 中央：暗色大厅内部，可有极少量上升的薄雾/烟气，
  但绝对无能量丝/无光柱/无明显发光元素
- 远景：朦胧虚化，深处可有极微弱的远方烛光暗示

色调：深石棕+暗暖阴影+边缘烛光琥珀+中央仅极淡的紫雾暗示
（几乎无饱和度）。
氛围：神圣召唤厅，等待魂灵被揭示在卡牌中。

绝对不要：中央能量丝/光柱/法阵/发光元素；任何角色/魂灵实体/卡片/UI/文字。
风格参照 style_reference_master_v3.png。
```

---

### 4.4 当前 6 张图（v1）的处理建议

基于 §4.0 新原则，**现有 6 张全部不达标**——中央高光抢戏，UI/角色叠不上去。

**处理策略：全部按新 prompt 重新生成。**

理由：
1. 用 Banana 局部"压暗中央"治标不治本——画面构图本身就错了
2. CSS 加大型径向 vignette 暗化中央——能稍微缓解但损失质感大
3. 重做成本可控（GPT-image-1 单张几秒）

**旧图归档**：建议把现有 6 张移到 `game-v2/assets/art/backgrounds/_v1_unusable/` 保留作风格参考，但不接入游戏。

---

## 五、P3 内容扩展

### 5.1 敌人立绘（首批 3 个）

> **策略**：先做第一阶段最常见的 3 个敌人（粘液、毒蛇、骷髅 —— 按你 enemies.js 实际筛选）。后续敌人用 Banana 基于这 3 张的风格批量出。

#### 资源条目

- **目录**：`game-v2/assets/art/enemies/`
- **尺寸**：1024 x 1024（正方形，居中构图便于战斗位置叠加）
- **格式**：PNG 透明底
- **数量**：首批 3 张，后续按上线节奏

#### Prompt 模板

```
A square 1024x1024 enemy creature portrait for a dark ritual occult
roguelike, transparent background. {生物描述}. Centered composition,
full body visible. {配色}. Heavy mystical corruption aura around the
creature in subtle particles. Painterly digital art, occult dark fantasy
style, dramatic lighting, no background scenery, no UI, no text.
Style: matches style_reference_master.png.
```

#### 首批 3 个建议（按 enemies.js 第一阶段挑选）

**enemy_slime.png · 腐蚀粘液**

```
{生物描述} = a translucent gelatinous blob creature with glowing
crystalline shards floating inside its body, shifting amorphous shape,
gooey tendrils dripping downward
{配色} = sickly emerald green and toxic yellow, with dark inner core
```

**enemy_serpent.png · 噬毒蛇**

```
{生物描述} = a coiled serpent rearing up, scales glowing with toxic
patterns, mouth open with dripping venom, runic markings along its body
{配色} = dark forest green and acid green, purple toxin glow
```

**enemy_skeleton.png · 骨魇战士**

```
{生物描述} = an undead skeletal warrior wreathed in tattered ceremonial
robes, holding a curved bone blade, hollow glowing eye sockets,
soul mist seeping from bone joints
{配色} = bone white and deep crimson eye glow, faded cloth
```

#### Cursor agent 版（请按你实际敌人列表替换）

```
用 gpt-image-1 生成 3 个敌人立绘，全部 1024x1024 透明背景 PNG，
居中全身构图。风格参照 style_reference_master.png（暗色仪式+魔法腐化）。

1. enemy_slime.png    — 半透明胶状粘液生物，体内漂浮发光晶片，
                       病态翠绿+毒黄，深色内核
2. enemy_serpent.png  — 盘踞昂首的蛇，毒性鳞纹发光，张口滴毒，
                       身上有符文标记，暗绿+酸绿+紫毒光
3. enemy_skeleton.png — 不死骨甲战士，破烂仪式袍，弯骨刀，眼窝赤红光，
                       骨缝渗魂雾，骨白+深红+褪色布料

无背景、无 UI、无文字。每个生物都带有暗色神秘腐化粒子光晕。
```

#### 后续敌人扩展（用 Nano Banana）

完成首批 3 个后，剩余敌人推荐流程：
1. 选 1 张你最满意的当 reference image 喂给 Banana
2. Prompt 改为："Generate a new enemy in the same art style and color
   treatment as the reference image: {新敌人描述}"
3. Banana 会自动保持风格一致

---

### 5.2 魂灵卡面（9 张）

> **作用**：魂灵祭坛选择界面的卡面图。3 大类（自律/协力/助理）×3 张。

#### 资源条目

- **目录**：`game-v2/assets/art/spirits/`
- **尺寸**：768 x 1024（竖版卡面 3:4）
- **格式**：PNG 透明底（卡框保留，卡内容不透明）
- **数量**：9 张

#### 9 个魂灵填充表

| 文件名 | 类型 | 视觉概念 |
|--------|------|----------|
| `spirit_guard.png` | 自律·守卫 | 巨型符文盾牌悬浮，蓝白光环 |
| `spirit_oath.png` | 自律·誓盟 | 双交叉契约长剑，金光符链 |
| `spirit_lord.png` | 自律·领主 | 王冠+权杖剪影，金紫华彩 |
| `spirit_companion.png` | 协力·伴侣 | 双心相连，柔粉金光丝 |
| `spirit_attendant.png` | 协力·侍从 | 弯刀+灯笼，暖橙剪影 |
| `spirit_concerto.png` | 协力·协奏 | 漂浮乐符法阵，金粉双色 |
| `spirit_scribe.png` | 助理·书记 | 漂浮古卷+羽毛笔，蓝金 |
| `spirit_messenger.png` | 助理·信使 | 飞翔的卷轴+符文鸟，金红 |
| `spirit_merchant.png` | 助理·商人 | 天平+金币堆，橙金 |

#### Prompt 模板

```
A vertical 768x1024 spirit card artwork for a dark ritual occult game.
Transparent background. A symbolic icon representation of "{魂灵概念}"
floating in the center, made of {主色} glowing energy with ornate runic
details. Surrounding the icon: drifting magical particles, subtle
energy threads, no character figure (this is a symbolic spirit card,
not a creature portrait). Composition: centered, vertical balance,
ornate but readable. Painterly arcane style, no text, no card frame
(will be added in CSS). Style: matches style_reference_master.png.
Color theme based on spirit type:
- 自律 (Autonomous): cool blue + silver tones
- 协力 (Cooperative): warm gold + amber
- 助理 (Assistant): soft pink + magenta
```

#### Cursor agent 版

```
用 gpt-image-1 生成 9 张魂灵卡面，全部 768x1024 透明背景 PNG，
居中符号化构图（不画具体生物，画概念符号）。风格参照
style_reference_master.png。

【自律型 - 冷蓝银调】
1. spirit_guard.png      — 守卫：巨型符文盾牌悬浮，蓝白光环+反射符印
2. spirit_oath.png       — 誓盟：双交叉契约长剑，金光符链束缚，
                           誓约符文环绕
3. spirit_lord.png       — 领主：王冠+权杖悬浮剪影，金紫双色华彩，
                           王权符印放射

【协力型 - 暖金琥珀调】
4. spirit_companion.png  — 伴侣：双心相连发光，柔粉金光丝交织
5. spirit_attendant.png  — 侍从:弯刀+灯笼悬浮,暖橙剪影,跟随符印
6. spirit_concerto.png   — 协奏:漂浮乐符法阵,金粉双色音波纹

【助理型 - 柔粉品红调】
7. spirit_scribe.png     — 书记：漂浮古卷+羽毛笔，蓝金，记录符印环绕
8. spirit_messenger.png  — 信使：飞翔卷轴+符文鸟，金红，传送光痕
9. spirit_merchant.png   — 商人：天平+金币堆悬浮，橙金华彩

无角色实体、无文字、无卡框（卡框将由 CSS 添加）。
```

---

### 5.3 强化卡稀有度框（3 套）

> **作用**：强化选择界面的卡片外框，区分 R/SR/SSR。

#### 资源条目

- **目录**：`game-v2/assets/art/frames/`
- **尺寸**：512 x 768（竖版卡框）
- **格式**：PNG 透明底（中心透明，仅边框）
- **数量**：3 张

| 文件名 | 稀有度 | 风格 |
|--------|--------|------|
| `frame_r.png` | R 普通 | 简约银灰金属边框，淡光描边 |
| `frame_sr.png` | SR 稀有 | 蓝色发光符文边框，棱角金属雕花 |
| `frame_ssr.png` | SSR 史诗 | 金色繁复雕花边框，宝石点缀，强发光 |

#### Prompt 模板

```
A vertical 512x768 ornamental card frame, transparent background and
transparent center (only the border edge is drawn). {风格描述}.
The frame is a complete closed border with decorative corners.
No card content inside, no text. Game UI asset. Style: matches
style_reference_master.png.
```

#### Cursor agent 版

```
用 gpt-image-1 生成 3 个稀有度卡框，全部 512x768 透明背景 PNG，
中心也透明（只画边框）。无文字、无内部内容。风格参照
style_reference_master.png。

1. frame_r.png   — R 普通：简约银灰金属边框，淡光描边，四角小装饰
2. frame_sr.png  — SR 稀有：蓝色发光符文边框，棱角金属雕花，
                   边角符印更复杂，蓝色辉光
3. frame_ssr.png — SSR 史诗：金色繁复雕花边框，紫宝石点缀四角，
                   强发光，最华丽
```

---

## 六、生图工作流建议

### 推荐流程（基于你在 Cursor 内调用 GPT-image / Banana）

```
1. 先做 P0 风格定调板 ——————→  必须最先，等定调通过再继续
       │
       ↓
2. 把 style_reference_master.png 上传到项目作为永久参考
       │
       ↓
3. 进 P1 第一组（职业徽章 4 张）
   - Cursor 内一次性出 4 张
   - 不满意单张，单独 regenerate
       │
       ↓
4. P1 第二组（资源图标 5 张 + 类型图标 6 张）
       │
       ↓
5. P1 第三组（职业立绘 4 张）—— 这步最关键，慢一点
   - 4 张必须风格统一
   - 不行就用 Banana 拿满意的第 1 张当 reference 重做
       │
       ↓
6. 接入游戏验证观感（不要全做完才接入！）
       │
       ↓
7. P2/P3 按需迭代
```

### 风格一致性技巧

- **永远在 prompt 里加一句**：`Style: matches style_reference_master.png`（即使没真的传图，让模型参考已建立的风格描述也有效）
- **同一组资源一次性出**：4 张职业徽章、5 张资源图标、6 张类型图标分别在**单次 prompt** 内一次性请求，模型会自动拉齐风格
- **Banana 是你的"风格收口器"**：任何一组中如果有 1-2 张风格跑偏，把组内最对的那张当 reference image，让 Banana 重画跑偏的

### 拒图/重生标准

- **必须重生**：透明底有白边、出现非要求的文字、风格与定调板明显不符、关键元素缺失
- **可以接受**：细节略有差异但整体风格对、需要后期 PS 微调
- **后期工具**：[remove.bg](https://www.remove.bg) 抠透明底；[TinyPNG](https://tinypng.com) 压缩；Photopea (浏览器版 PS) 微调

### 接入路径

资源就绪后由前端按以下规则接入：
- **静态图**：HTML `<img>` 或 CSS `background-image`，路径指向 `game-v2/assets/art/...`
- **职业立绘**：进入 `.character-box` / `.player-area`，绝对定位居中
- **背景图**：`.battle-bg-layer` 加 `background-image`，z-index 0
- **图标替换 emoji**：先在 `index.html` 把 emoji 替换为 `<img class="icon icon-xxx" src="...">`，再统一在 CSS 里控制尺寸

---

## 七、目录结构

```
game-v2/assets/art/
├── _reference/
│   └── style_reference_master.png      # P0 风格锚
├── badges/
│   ├── badge_qi.png
│   ├── badge_combo.png
│   ├── badge_mana.png
│   └── badge_balance.png
├── icons/
│   ├── resources/
│   │   ├── res_qi.png
│   │   ├── res_combo.png
│   │   ├── res_mana.png
│   │   ├── res_ammo.png
│   │   └── res_balance.png
│   └── skill_types/
│       ├── type_attack.png
│       ├── type_special.png
│       ├── type_ultimate.png
│       ├── type_passive.png
│       ├── type_followup.png
│       └── type_reload.png
├── portraits/
│   ├── portrait_qi.png
│   ├── portrait_combo.png
│   ├── portrait_mana.png
│   └── portrait_balance.png
├── backgrounds/
│   ├── battle/
│   │   ├── bg_stage_1.webp
│   │   ├── bg_stage_2.webp
│   │   ├── bg_stage_3.webp
│   │   └── bg_stage_4.webp
│   ├── bg_class_select.webp
│   └── bg_spirit_altar.webp
├── enemies/
│   ├── enemy_slime.png
│   ├── enemy_serpent.png
│   └── enemy_skeleton.png
├── spirits/
│   ├── spirit_guard.png
│   ├── spirit_oath.png
│   ├── spirit_lord.png
│   ├── spirit_companion.png
│   ├── spirit_attendant.png
│   ├── spirit_concerto.png
│   ├── spirit_scribe.png
│   ├── spirit_messenger.png
│   └── spirit_merchant.png
└── frames/
    ├── frame_r.png
    ├── frame_sr.png
    └── frame_ssr.png
```

---

---

## 九、追加需求（v1.1）

### 9.1 资源图标的"状态变体"原则

**实施总则**：能用 CSS filter 解决的，绝不补图。能补 1 张靠程序拟出多种状态的，绝不补 4 张。

#### 已用 CSS 实现的状态（无需补图）

| 状态 | CSS 处理 | 触发条件 |
|------|----------|----------|
| 枯竭 (val=0) | `saturate(0.15) brightness(0.45)` + opacity 0.45 | 任何资源数为 0 |
| 满状态脉动 | 各职业色 `drop-shadow` 动画 | 任何资源 = max |
| 阳极脉动 | 暖金 drop-shadow + brightness↑ | 判官 balance ≥ +5 |
| 阴极脉动 | 冷紫 drop-shadow + brightness↓ | 判官 balance ≤ -5 |

#### 必须补图的状态变体

**只有当 CSS filter 无法表达"语义"时才补图。** 当前需要补图的有：

##### A. 弹药"装填中"动效（魔导专用，P3）

- **文件名**：`res_ammo_charging.png`
- **目录**：`game-v2/assets/art/icons/resources/`
- **尺寸**：1024 x 1024（与 res_ammo_v2 一致，保证替换平滑）
- **格式**：PNG 透明底
- **数量**：1 张
- **用途**：玩家点击"装填"技能后到下回合开始前，弹药图标短暂显示"装填中"形态

**Prompt（标准英文）**：

```
A vertical golden crystalline ammunition bullet, 1024x1024, transparent
background. Same overall design as the existing res_ammo_v2.png reference,
but in a "charging up" state: the bullet base is partially formed/dim,
energy particles spiral upward INTO the bullet from below, and the upper
half of the crystal is brighter and more saturated than the dim base —
visually suggesting "energy filling up". Painterly arcane style, glowing
gold core, NO TEXT, NO BACKGROUND, transparent PNG. Style: matches
style_reference_master_v3.png and the existing dark ritual game art.
```

**Cursor agent 中文版**：

```
用 gpt-image-1 生成 res_ammo_charging.png（1024x1024 透明底）。
基于现有的 res_ammo_v2.png（金色子弹结晶）做"装填中"状态变体：

- 整体造型与 res_ammo_v2 一致
- 但底部能量未充盈完全（暗淡半成形）
- 能量粒子从下方螺旋上升注入弹体
- 上半部明亮饱和，下半部黯淡
- 视觉传达"能量正在灌注"

风格参照 style_reference_master_v3.png，无文字无背景。
```

##### B. 平衡资源的"中性归零"特殊态（判官专用，可选 P3）

- **文件名**：`res_balance_neutral.png`
- **尺寸**：1024 x 1024
- **格式**：PNG 透明底
- **用途**：玩家释放"宣判"技能后平衡归零的瞬间，图标短暂显示"中性归零"态

**Prompt**：

```
A circular yin-yang symbol, 1024x1024, transparent background. Based on
the existing res_balance_v2.png design but in a "perfectly neutral / reset"
state: the yin-yang split is razor-sharp and equal, the surrounding glow
is calm white-silver (NOT purple/magenta), no extreme energy bleeding out.
The mood is "after judgment, balance restored". Painterly arcane style,
NO TEXT, transparent PNG. Style: matches style_reference_master_v3.png.
```

##### C. 不需要补图的状态（用 CSS 程序实现）

| 状态 | 方案 |
|------|------|
| 资源接近满（80%+） | CSS `drop-shadow` 强度按比例插值 |
| 资源刚消耗（数值减少瞬间） | CSS keyframe 一次性 shake/dim 动画 |
| 资源刚获得（数值增加瞬间） | CSS keyframe 一次性 pulse/glow 动画 |
| 弹药从空到 1+ 的"上膛瞬间" | JS 触发一次性"光闪 + scale up"动画 |

**总结**：第二阶段补图清单只有 A（必做）+ B（可选），共 1-2 张，不要为了"做齐状态"补一堆图。

---

### 9.2 核心技能专属图标（P1.5，等技能设计定稿后启动）

> **状态**：需求暂挂——气宗设计正在重做（见 `doc/新架构-气宗与气息魂设计.md`），等 4 职业新技能定稿后再启动。

#### 设计原则

- **每个核心主动技能 1 张专属图标**，体现技能视觉特征（不是技能"类型"）
- 类型信息通过卡片**边框颜色**或**右上角小角标**承载，不再占据主图标位
- **锤子变体不出专属图**——本体技能图标 + 角标 ⚒ 即可
- **追加技能不出专属图**——继承本体的小图（如疾风→疾风的小版）+ 标签"追"

#### 规格

- **目录**：`game-v2/assets/art/icons/skills/`
- **尺寸**：512 x 512
- **格式**：PNG 透明底
- **数量预估**：4 职业 × ~3-4 主动技能 ≈ **12-16 张**

#### 命名规范

```
skill_qi_lightstrike.png      气宗·轻击
skill_qi_rapidstrike.png      气宗·迅击
skill_qi_devastate.png        气宗·崩山
skill_combo_quickstrike.png   剑圣·疾风
skill_combo_combostrike.png   剑圣·连斩
skill_combo_finisher.png      剑圣·终结技
skill_mana_shoot.png          魔导·射击
skill_mana_burst.png          魔导·爆射
skill_mana_reload.png         魔导·装填
skill_balance_yangstrike.png  判官·阳击
skill_balance_yinstrike.png   判官·阴击
skill_balance_verdict.png     判官·宣判
（具体清单按新技能设计调整）
```

#### Prompt 模板（待技能定稿后填充）

```
A square 512x512 game skill icon, transparent background, centered
composition, readable at 64px. {技能视觉描述}. Made of {主色} glowing
energy with {辅色} accents. Painterly arcane style, neon mystic glow,
arcane symbology. NO TEXT, NO frame border (frame added in CSS).
Style: matches style_reference_master_v3.png.
```

#### 启动条件

- [ ] 4 职业新技能列表确定
- [ ] 每个技能 1 句"视觉特征描述"（用于填 prompt）
- [ ] 满足上述两条后，按本节模板批量出图

---

### 9.3 战斗背景图的动效叠加资源（P2.5，等 GPT 出图后启动）

> **状态**：背景图正在 GPT 生成中。本节列出"前端动效层"需要的额外美术资源。

#### 已确认能纯 CSS/JS 实现（不需补图）

- Ken Burns 缓慢推拉
- vignette 暗角脉动
- 多层视差滚动
- 战斗事件反馈（饱和度/亮度脉冲、震屏、闪屏）
- 简单粒子（CSS 伪元素 + animation）

#### 可能需要补图的动效资源（按场景判断）

##### A. 场景前景遮罩层（高 ROI）

- **文件名**：`bg_overlay_smoke.png`、`bg_overlay_embers.png`、`bg_overlay_starfield.png`、`bg_overlay_runes.png`
- **目录**：`game-v2/assets/art/backgrounds/overlays/`
- **尺寸**：1920 x 1080
- **格式**：PNG **透明底**（关键！）
- **数量**：4 张通用 overlay
- **用途**：叠在战斗背景图上方，用 CSS 慢速 translate/rotate/opacity 动画产生"飘动"感

**4 张 overlay 设计**：

| 文件 | 内容 | 动效搭配 |
|------|------|----------|
| `bg_overlay_smoke.png` | 一层稀疏的灰白半透明烟雾/雾气 | translate 缓慢横向飘动 |
| `bg_overlay_embers.png` | 一片漂浮的橙红余烬粒子 | translate 向上飘 + opacity 闪烁 |
| `bg_overlay_starfield.png` | 一片星云星点 | rotate 缓慢旋转 + opacity 呼吸 |
| `bg_overlay_runes.png` | 一圈半透明发光的浮空符文环 | rotate 缓慢旋转 |

**Prompt 模板（按 4 张分别填）**：

```
A horizontal 1920x1080 game background overlay layer, FULLY TRANSPARENT
BACKGROUND. Only depicts: {内容描述}, distributed loosely across the
canvas, semi-transparent and feathered at edges so it can blend
seamlessly when layered over a darker background image. NO solid colored
background, NO frame, NO text, NO scenery elements other than the
specified content. Output PNG with proper alpha channel.
Style: matches style_reference_master_v3.png.
```

**4 张具体填充**：

```
bg_overlay_smoke.png:
{内容描述} = thin wispy grey-white smoke/fog wisps drifting horizontally,
about 30-40% canvas coverage, soft and translucent

bg_overlay_embers.png:
{内容描述} = scattered glowing orange-red ember particles of varying sizes,
some bright and crisp, some faded, distributed across the lower 2/3 of canvas

bg_overlay_starfield.png:
{内容描述} = a faint cosmic starfield with scattered tiny bright stars and
soft purple-blue nebula wisps, about 40% canvas coverage

bg_overlay_runes.png:
{内容描述} = a sparse ring of glowing arcane runic glyphs floating in
mid-air, semi-transparent, distributed in a wide horizontal band across the
middle of the canvas, gold-white glow
```

**接入方式**：

- 在 `.battle-bg-layer` 内新增 `.bg-overlay-smoke`、`.bg-overlay-embers` 等子层
- 每个子层 `position: absolute; inset: 0; background-image: url(...)`
- 加 CSS animation 控制飘动/旋转

##### B. 场景"光柱/光斑"特效层（中 ROI，可选）

- **文件名**：`bg_lightshaft.png`
- **尺寸**：1920 x 1080
- **格式**：PNG 透明底
- **数量**：1 张通用 + 各场景按需重生
- **用途**：模拟从天而降的体积光（god rays），叠在背景上做"圣光感"

**Prompt**：

```
A horizontal 1920x1080 god rays / volumetric light shafts overlay layer,
fully transparent background. 3-5 wide diagonal beams of soft golden-white
light streaming from the upper portion of the canvas downward, gradually
fading to transparent at the bottom. Heavy feathered edges. NO scenery,
NO solid background. Style: matches style_reference_master_v3.png.
```

##### C. 场景特殊事件触发图（按场景定制，可选 P3）

如果某个阶段背景需要"重击时背景裂纹闪现"或"大招时背景符文亮起"等定制反馈，需要单独出图。**等 4 张战斗背景定稿后再列具体需求。**

---

## 十、变更记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-04-19 | 初版，覆盖 P0-P3 全部资源 |
| v1.1 | 2026-04-19 | 追加 §九：资源状态变体（A/B 两张）+ 核心技能专属图标（暂挂）+ 战斗背景动效叠加层（4 张 overlay + 可选光柱） |
| v1.2 | 2026-04-19 | **重大原则修订** §四：所有背景图必须遵守"舞台幕布"构图——中央 60%×50% 安全区暗+低对比，高光仅放 4 边缘。原 v1 的 6 张背景（4 战斗+1 选职业+1 祭坛）全部不达标，需按新 prompt 重做 |

*文档结束。所有 prompt 可直接复制使用。*
