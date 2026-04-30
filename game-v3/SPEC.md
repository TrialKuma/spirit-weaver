# game-v3 即时制战斗系统 — 实施规格

> 本文档是 Codex / AI Agent 的完整实施指南。按 Phase 顺序执行即可。

## 1. 项目概况

Spirit Weaver game-v3 是对 game-v2 回合制战斗的即时制重做。本次只做**最小可玩原型**：气宗职业 + 1个测试敌人，跑通一场完整战斗。

### 技术栈

- **纯前端**：HTML + CSS + 原生 JS（ES6 class），无框架无构建工具
- 所有 JS 通过 `<script>` 标签按顺序加载，共享全局作用域（与 v2 一致）
- 部署为静态站点
- 美术/音频资源引用 `../game-v2/assets/`（不复制）

### 与 v2 的核心区别

| 方面 | v2（回合制 CTB） | v3（即时制） |
|------|-----------------|-------------|
| 时间 | 离散回合，AV 归零轮流行动 | 连续 deltaTime，所有实体并行 |
| 玩家操作 | 等轮到自己才能操作 | 随时可操作（只要不在施法中且有资源） |
| 敌人行为 | 意图始终可见 | 喊招1-2秒后出手，无提前预告 |
| 技能节奏 | 选了就立即结算 | 有 castTime + recoveryTime，期间锁定 |
| 持续时间 | 以"回合"计 | 以"秒"计 |
| 速度属性 | 决定 AV = 10000/speed | 影响技能动画缩放 / 资源回复速度 |

## 2. 目录结构

```
game-v3/
├── index.html                # 入口 HTML
├── css/
│   └── style.css             # 全部样式
├── js/
│   ├── core/
│   │   ├── game-loop.js      # deltaTime 游戏主循环
│   │   ├── time.js           # Timer / Cooldown 工具类
│   │   └── events.js         # 事件总线
│   ├── battle/
│   │   ├── battle-manager.js # 战斗状态机 + 每帧更新链
│   │   ├── skill-system.js   # 技能状态机（idle→casting→recovering→idle）
│   │   ├── damage.js         # 伤害公式 + 格挡 / 内伤 / 暴击
│   │   └── buff-system.js    # 时间制 buff/debuff
│   ├── entities/
│   │   ├── character.js      # Character 基类
│   │   ├── qi-master.js      # 气宗职业
│   │   └── enemy.js          # 敌人基类 + 喊招 AI
│   ├── ui/
│   │   ├── battle-ui.js      # 主 UI 协调（每帧调用）
│   │   ├── skill-bar.js      # 底部技能栏
│   │   ├── enemy-hud.js      # 敌人 HUD + 喊招指示器
│   │   └── vfx.js            # 粒子 / 伤害数字 / 震屏（从 v2 移植）
│   └── data/
│       ├── qi-skills.js      # 气宗技能数据
│       └── enemy-data.js     # 测试敌人数据
├── assets -> ../game-v2/assets  # 符号链接或直接引用
└── SPEC.md                   # 本文档
```

### JS 加载顺序（index.html 中）

```
core/events.js → core/time.js → core/game-loop.js →
battle/buff-system.js → battle/damage.js → battle/skill-system.js →
entities/character.js → data/qi-skills.js → entities/qi-master.js →
data/enemy-data.js → entities/enemy.js →
battle/battle-manager.js →
ui/vfx.js → ui/skill-bar.js → ui/enemy-hud.js → ui/battle-ui.js
```

## 3. 设计规格

### 3.1 战斗节奏（已确定）

| 技能类型 | 总占用时间 | castTime | recoveryTime |
|---------|-----------|----------|-------------|
| 轻击/普攻 | ~0.8s | 0.4s | 0.4s |
| 中型技能 | ~1.2s | 0.7s | 0.5s |
| 大招 | ~2.5s | 1.5s | 1.0s |
| 防御/格挡 | ~0.4s | 0.15s | 0.25s |

### 3.2 战斗时长

| 敌人类型 | 战斗时长 | 敌人出手间隔 | 敌人前摇窗口 |
|---------|---------|------------|------------|
| 小怪 | 15-25秒 | 6-8秒 | 1-1.5秒 |
| 精英 | 35-50秒 | 5-7秒 | 1-2秒 |
| Boss | 60-90秒 | 4-6秒 | 1.5-2.5秒 |

### 3.3 气宗（QiMaster）数值

**资源**：qi，max = 10，初始 = 10（满气），regenPerSec = 1.0

**核心循环**（约8秒一周期）：
1. 崩山（花8气，施加内伤4秒）→ 锁定2.5秒
2. 内伤窗口内迅击×2-3次（花2气，内伤时返还2气 = 净消耗0）
3. 内伤结束后轻击填充，等气自然回复
4. 回到8气，下一轮崩山

**技能表**：

```javascript
// qi-skills.js
const QI_SKILLS = [
    {
        id: 'light_strike',
        name: '轻击',
        type: 'attack',
        castTime: 0.4,        // 秒
        recoveryTime: 0.4,
        cost: { qi: 0 },
        baseMultiplier: 1.0,  // ATK × 1.0
        hits: 1,
        tags: ['Light', 'Attack', 'Melee'],
        desc: '快速出拳，无消耗'
    },
    {
        id: 'rapid_strike',
        name: '迅击',
        type: 'special',
        castTime: 0.7,
        recoveryTime: 0.5,
        cost: { qi: 2 },
        baseMultiplier: 2.0,  // ATK × 2.0
        hits: 1,
        tags: ['Special', 'Melee'],
        desc: '消耗2气，造成200%伤害。目标有内伤时返还2气',
        onHit: 'refundQiOnInjury'   // 特殊逻辑标记
    },
    {
        id: 'devastate',
        name: '崩山',
        type: 'ultimate',
        castTime: 1.5,
        recoveryTime: 1.0,
        cost: { qi: 8 },
        baseMultiplier: 5.0,  // ATK × 5.0
        hits: 1,
        tags: ['Heavy', 'Ultimate', 'Melee'],
        desc: '消耗8气，造成500%伤害。触发被动内伤'
    },
    {
        id: 'stance',
        name: '架势',
        type: 'defense',
        castTime: 0.15,
        recoveryTime: 0.25,
        cost: { qi: 0 },
        baseMultiplier: 0,    // 无伤害
        hits: 0,
        tags: ['Defense'],
        desc: '快速格挡，减伤50%，持续0.8秒',
        effect: {
            type: 'guard',
            duration: 0.8,      // 格挡持续0.8秒
            damageReduction: 0.5
        }
    }
];
```

**被动机制**：消耗 ≥6 气的技能命中后，给目标施加【内伤】debuff：
- 持续 4 秒
- 受到伤害 +30%
- 迅击命中有内伤目标时返还 2 气

**角色基础属性**：
- HP: 100, maxHp: 100
- baseAtk: 10, def: 5
- speed: 100（影响技能动画缩放系数：animScale = 100 / speed）

### 3.4 测试敌人数据

第一个测试敌人（从 v2 的"恶鬼"调整）：

```javascript
// enemy-data.js
const TEST_ENEMY = {
    id: 'demon',
    name: '恶鬼',
    hp: 200,
    maxHp: 200,
    baseAtk: 12,
    def: 3,
    speed: 80,
    actionInterval: 6.0,    // 每6秒出手一次
    skills: [
        {
            id: 'slash',
            name: '斩击',
            telegraphTime: 1.2,     // 前摇/喊招时间
            damage: { multiplier: 1.5 },
            type: 'melee',
            callout: '斩击！',       // 喊招文字
            weight: 3               // AI 选择权重
        },
        {
            id: 'heavy_slam',
            name: '重砸',
            telegraphTime: 2.0,     // 长前摇 = 更多反应时间
            damage: { multiplier: 3.0 },
            type: 'melee',
            callout: '重砸！！',
            weight: 1
        },
        {
            id: 'guard',
            name: '防御姿态',
            telegraphTime: 0.8,
            damage: null,           // 无伤害
            type: 'buff',
            effect: { stat: 'def', value: 5, duration: 4.0 },
            callout: '防御！',
            weight: 1
        }
    ]
};
```

### 3.5 伤害公式

```
最终伤害 = max(1, buffedAtk × baseMultiplier × modifiers - targetDef)

buffedAtk = baseAtk × (1 + sum(atk_buff_percentages))
modifiers = 内伤加成(1.3 if 有内伤) × 暴击(critMult if 暴击)
```

格挡减伤：如果目标处于 guard 状态，最终伤害 × (1 - damageReduction)

## 4. 核心模块规格

### 4.1 core/game-loop.js

全局游戏循环，驱动所有子系统。

```javascript
// 关键接口
const GameLoop = {
    running: false,
    paused: false,
    timeScale: 1.0,
    lastTimestamp: 0,
    updateCallbacks: [],  // Array<(dt: number) => void>

    start(),              // 启动循环
    stop(),               // 停止循环
    pause(),
    resume(),
    addUpdate(fn),        // 注册每帧回调
    removeUpdate(fn),

    // 内部：requestAnimationFrame 回调
    _tick(timestamp) {
        const rawDt = (timestamp - this.lastTimestamp) / 1000; // 秒
        const dt = Math.min(rawDt, 0.1) * this.timeScale;     // 防跳帧，最大100ms
        this.lastTimestamp = timestamp;
        if (!this.paused) {
            this.updateCallbacks.forEach(fn => fn(dt));
        }
        if (this.running) requestAnimationFrame(this._tick.bindthis));
    }
};
```

关键点：
- `dt` 单位是**秒**（不是毫秒）
- 有 `timeScale` 支持慢动作/加速
- 上限 0.1s 防止切标签页后回来的巨大 dt

### 4.2 core/time.js

```javascript
class Timer {
    constructor(duration, onComplete) // duration 秒
    update(dt)     // 推进计时
    get progress() // 0~1
    get finished()
    reset()
}

class Cooldown {
    constructor(duration)
    start()
    update(dt)
    get ready()     // 冷却完毕？
    get remaining() // 剩余秒数
    get progress()  // 0~1
}
```

### 4.3 core/events.js

与 v2 的 GameEvents 一致：

```javascript
const GameEvents = {
    listeners: {},
    on(event, handler),
    off(event, handler),
    emit(event, payload)
};
```

### 4.4 battle/skill-system.js

管理玩家技能释放的状态机。

```javascript
const SkillSystem = {
    state: 'idle',          // 'idle' | 'casting' | 'recovering'
    currentSkill: null,
    timer: null,            // Timer 实例

    // 尝试释放技能
    tryUseSkill(skillIndex, owner, target) {
        // 1. 检查 state === 'idle'
        // 2. 检查 owner 资源够不够（canAfford）
        // 3. 扣资源
        // 4. state → 'casting', 创建 Timer(skill.castTime)
        // 5. 触发 onCast 效果（如架势：给自己加 guard buff）
    },

    update(dt) {
        // casting 阶段：Timer 推进，到期后 → 执行命中（dealDamage）→ state = 'recovering'
        // recovering 阶段：Timer 推进，到期后 → state = 'idle'
    },

    // 获取当前状态用于 UI
    getState() // { state, skill, progress }
};
```

关键设计：
- **casting 阶段结束时**才结算伤害（不是开始时）
- 整个 casting + recovering 期间玩家**不能操作**
- UI 在 casting 时显示进度条
- 如果技能有 `effect.type === 'guard'`，在 casting 开始时就给 owner 加 guard buff

### 4.5 battle/buff-system.js

```javascript
class Buff {
    constructor({ id, name, type, stat, value, duration, onApply, onExpire, onTick, tickInterval })
    // type: 'buff' | 'debuff'
    // stat: 'atk' | 'def' | 'speed' | 'guard' | 'injury' | ...
    // duration: 秒
    // tickInterval + onTick: 用于 DoT/HoT
}

class BuffManager {
    buffs: []

    addBuff(target, buffConfig)
    removeBuff(target, buffId)
    update(dt)              // 推进所有 buff 计时，过期移除，DoT tick
    getModifier(stat)       // 聚合某属性的加成值
    hasBuff(id)             // 是否有某 buff
}
```

### 4.6 entities/character.js

```javascript
class Character {
    constructor({ name, hp, maxHp, baseAtk, def, speed, classId })

    // 资源系统（子类填充）
    resources = {}   // e.g. { qi: { val: 10, max: 10, regenPerSec: 1.0 } }

    // 方法
    update(dt)           // 每帧：资源回复，buff 更新
    takeDamage(amount)   // 扣 HP（先扣 shield）
    heal(amount)
    getBuffedAtk()       // baseAtk × (1 + atk buff%)
    canAfford(cost)      // 检查资源是否够
    spendResource(cost)  // 扣资源
    addBuff(config)
    isGuarding()         // 是否在格挡状态

    // 子类覆写
    onSkillHit(skill, target)  // 技能命中后触发（被动处理）
}
```

### 4.7 entities/qi-master.js

```javascript
class QiMaster extends Character {
    constructor() {
        super({
            name: '气宗',
            hp: 100, maxHp: 100,
            baseAtk: 10, def: 5, speed: 100,
            classId: 'qi'
        });
        this.resources = {
            qi: { val: 10, max: 10, regenPerSec: 1.0 }
        };
        this.skills = QI_SKILLS; // 引用 qi-skills.js
    }

    onSkillHit(skill, target) {
        // 被动：消耗 ≥6 气的技能 → 给 target 加内伤 debuff
        const qiCost = skill.cost?.qi || 0;
        if (qiCost >= 6) {
            target.addBuff({
                id: 'internal_injury',
                name: '内伤',
                type: 'debuff',
                stat: 'injury',
                value: 0.3,        // 受伤 +30%
                duration: 4.0
            });
        }

        // 迅击命中有内伤目标 → 返还2气
        if (skill.id === 'rapid_strike' && target.hasBuff('internal_injury')) {
            this.resources.qi.val = Math.min(this.resources.qi.max, this.resources.qi.val + 2);
        }
    }
}
```

### 4.8 entities/enemy.js

```javascript
class Enemy extends Character {
    constructor(data) {
        super(data);
        this.actionInterval = data.actionInterval; // 秒
        this.actionTimer = data.actionInterval;     // 倒计时
        this.enemySkills = data.skills;             // 技能池
        this.state = 'idle';       // 'idle' | 'telegraphing' | 'executing'
        this.currentAction = null;
        this.telegraphTimer = null;
    }

    update(dt) {
        super.update(dt);

        switch (this.state) {
            case 'idle':
                this.actionTimer -= dt;
                if (this.actionTimer <= 0) {
                    this.selectAndTelegraph();
                }
                break;

            case 'telegraphing':
                // 前摇倒计时
                this.telegraphTimer.update(dt);
                if (this.telegraphTimer.finished) {
                    this.executeAction();
                }
                break;

            case 'executing':
                // 执行完毕后重置
                this.state = 'idle';
                this.actionTimer = this.actionInterval;
                break;
        }
    }

    selectAndTelegraph() {
        // 按权重随机选技能
        this.currentAction = weightedRandom(this.enemySkills);
        this.state = 'telegraphing';
        this.telegraphTimer = new Timer(this.currentAction.telegraphTime);
        // 触发 UI 显示喊招
        GameEvents.emit('enemyTelegraph', {
            enemy: this,
            action: this.currentAction
        });
    }

    executeAction() {
        this.state = 'executing';
        // 触发伤害结算 / buff施加
        GameEvents.emit('enemyExecute', {
            enemy: this,
            action: this.currentAction
        });
    }
}
```

### 4.9 battle/battle-manager.js

协调所有系统的中央控制器。

```javascript
const BattleManager = {
    state: 'idle',  // 'idle' | 'fighting' | 'win' | 'lose'
    player: null,
    enemy: null,

    startBattle(playerClass, enemyData) {
        this.player = new QiMaster();
        this.enemy = new Enemy(enemyData);
        this.state = 'fighting';

        // 注册到游戏循环
        GameLoop.addUpdate(this.update.bindthis));

        // 监听事件
        GameEvents.on('enemyExecute', this.onEnemyExecute.bindthis));

        GameLoop.start();
    },

    update(dt) {
        if (this.state !== 'fighting') return;

        // 更新所有实体
        this.player.update(dt);
        this.enemy.update(dt);
        SkillSystem.update(dt);

        // 胜负判定
        if (this.enemy.hp <= 0) this.win();
        if (this.player.hp <= 0) this.lose();

        // UI 更新
        BattleUI.update(dt);
    },

    onEnemyExecute({ enemy, action }) {
        if (!action.damage) return;

        const rawDmg = calculateDamage(enemy, action, this.player);
        this.player.takeDamage(rawDmg);

        // 触发 VFX
        GameEvents.emit('playerHit', { damage: rawDmg, action });
    },

    win() { this.state = 'win'; GameEvents.emit('battleEnd', { result: 'win' }); },
    lose() { this.state = 'lose'; GameEvents.emit('battleEnd', { result: 'lose' }); }
};
```

### 4.10 battle/damage.js

```javascript
function calculateDamage(attacker, skillOrAction, target) {
    const atk = attacker.getBuffedAtk();
    const multiplier = skillOrAction.baseMultiplier
        || skillOrAction.damage?.multiplier
        || 1.0;
    let raw = atk * multiplier;

    // 内伤加成
    if (target.hasBuff && target.hasBuff('internal_injury')) {
        raw *= 1.3;
    }

    // 减防
    const def = target.def + (target.getBuffModifier?.('def') || 0);
    let final = Math.max(1, raw - def);

    // 格挡减伤
    if (target.isGuarding && target.isGuarding()) {
        const guardBuff = target.getGuardReduction?.() || 0.5;
        final *= (1 - guardBuff);
    }

    return Math.floor(final);
}
```

## 5. UI 规格

### 5.1 HTML 结构

```html
<div id="battle-stage">
    <!-- 背景层 -->
    <div id="battle-bg"></div>

    <!-- VFX 层（粒子/伤害数字等，position:absolute） -->
    <div id="vfx-layer"></div>

    <!-- 主战斗区 -->
    <div class="battle-field">
        <!-- 玩家区（左） -->
        <div id="player-area">
            <div id="player-sprite"><!-- 角色立绘 --></div>
            <div id="player-hud">
                <div class="hp-bar-container" id="player-hp-container">
                    <div class="hp-bar" id="player-hp-bar"></div>
                    <span class="hp-text" id="player-hp-text"></span>
                </div>
                <div class="resource-bar" id="player-resource">
                    <!-- 10个气格子，动态填充 -->
                </div>
            </div>
        </div>

        <!-- 敌人区（右） -->
        <div id="enemy-area">
            <div id="enemy-sprite"><!-- 敌人立绘 --></div>
            <div id="enemy-hud">
                <div class="hp-bar-container" id="enemy-hp-container">
                    <div class="hp-bar" id="enemy-hp-bar"></div>
                    <span class="hp-text" id="enemy-hp-text"></span>
                </div>
                <!-- 喊招指示器 -->
                <div id="enemy-telegraph" class="hidden">
                    <div class="telegraph-text"></div>
                    <div class="telegraph-bar"><div class="telegraph-fill"></div></div>
                </div>
            </div>
        </div>
    </div>

    <!-- 底部技能栏 -->
    <div id="skill-bar">
        <!-- 4个技能按钮，JS 动态生成 -->
    </div>

    <!-- 战斗日志（可折叠） -->
    <div id="log-panel"></div>
</div>
```

### 5.2 技能按钮状态

每个技能按钮需要实时反映：

| 状态 | 视觉表现 |
|------|---------|
| 可用 | 正常亮起，边框发光 |
| 施法中（当前技能） | 进度条覆盖（从0到100%），发光更强 |
| 恢复中 | 进度条反向消退，略暗 |
| 资源不足 | 灰暗，图标变灰 |
| 其他技能施法中 | 略暗（不可用但不是资源问题） |

### 5.3 敌人喊招指示器

敌人进入 telegraphing 状态时：
1. `#enemy-telegraph` 显示
2. `.telegraph-text` 显示招式名（如 "斩击！"）
3. `.telegraph-fill` 进度条从 0% 推到 100%（对应 telegraphTime）
4. 进度条满 = 攻击命中
5. 颜色根据威胁度变化：普通攻击用橙色，重击用红色，buff 用绿色

### 5.4 CSS 主题变量（从 v2 继承）

```css
:root {
    --bg-primary: #0a0a0a;
    --bg-secondary: #1a1a2e;
    --bg-tertiary: #16213e;
    --text-primary: #e0e0e0;
    --text-secondary: #a0a0a0;
    --accent-primary: #00d4ff;
    --accent-secondary: #ff0055;
    --accent-tertiary: #00ff88;
    --border-color: #333;
}
```

### 5.5 VFX 移植

从 `../game-v2/js/utils.js` 中移植以下功能到 `ui/vfx.js`：
- `ParticleSystem.showDamageNumber()` — 飘字伤害数字
- `ParticleSystem.createParticles()` — 粒子爆散
- `ParticleSystem.createImpact()` — 冲击特效
- `ParticleSystem.createSlash()` — 近战斩击特效
- `ParticleSystem.shakeScreen()` — 震屏
- `ParticleSystem.flashScreen()` — 闪屏
- `ParticleSystem.showSkillCutIn()` — 技能喊话横幅

这些函数操作 `#vfx-layer` DOM，可以几乎原样移植。

## 6. 分阶段实施顺序

### Phase 1：骨架 & 核心循环

**创建的文件**：
- `index.html` — 基础 HTML 结构（上面 5.1 的内容）
- `css/style.css` — 主题变量 + 战斗布局 + 技能栏样式
- `js/core/events.js` — 事件总线
- `js/core/time.js` — Timer / Cooldown
- `js/core/game-loop.js` — deltaTime 循环

**验证**：打开 index.html，控制台能看到每帧的 dt 输出。

### Phase 2：技能系统 + 输入

**创建的文件**：
- `js/battle/skill-system.js` — 技能状态机
- `js/ui/skill-bar.js` — 技能按钮渲染 + 键盘绑定

**验证**：按 1/2/3/4 能触发对应技能，状态机正确流转（casting→recovering→idle），期间不能再按。

### Phase 3：角色 & 资源

**创建的文件**：
- `js/battle/buff-system.js` — Buff 管理
- `js/entities/character.js` — Character 基类
- `js/data/qi-skills.js` — 气宗技能数据
- `js/entities/qi-master.js` — 气宗实现

**验证**：气宗角色存在，气资源按时间回复，技能消耗资源后资源减少，资源不够时技能变灰。

### Phase 4：敌人系统

**创建的文件**：
- `js/data/enemy-data.js` — 测试敌人数据
- `js/entities/enemy.js` — 敌人 + 喊招 AI

**验证**：敌人每隔6秒喊招，前摇指示器出现，前摇结束后执行攻击。

### Phase 5：战斗管理 & 伤害结算

**创建的文件**：
- `js/battle/damage.js` — 伤害计算
- `js/battle/battle-manager.js` — 战斗状态机

**验证**：玩家技能能对敌人造成伤害，敌人攻击能打玩家，任一方 HP 归零时战斗结束。

### Phase 6：完整战斗 UI

**创建/扩展的文件**：
- `js/ui/vfx.js` — 从 v2 移植 ParticleSystem
- `js/ui/enemy-hud.js` — 敌人 HUD + 喊招条
- `js/ui/battle-ui.js` — 主 UI 协调

**验证**：HP 条实时更新，资源条实时填充，喊招指示器正确显示，伤害数字飘出。

### Phase 7：打磨

- 胜利/失败界面 + 重新开始按钮
- 简单的开始界面（"点击开始战斗"）
- 基础音效（如果时间允许，从 v2 移植 SFX）
- 数值微调，确保一场小怪战20秒内打完

## 7. 注意事项

1. **所有持续时间用秒**，不要用毫秒或回合数
2. **dt 单位是秒**，由 GameLoop 提供，上限 0.1s
3. 技能的 `castTime` 结束时才结算伤害，不是开始时
4. 敌人攻击不会暂停任何东西——玩家的技能状态机和敌人的 AV 同时运行
5. CSS 用 v2 的暗色主题变量，视觉风格保持一致
6. 资源引用 `../game-v2/assets/` 路径，不要复制文件
7. 中文注释、英文变量名/类名（与 v2 一致）
8. 无模块系统，全局作用域，`<script>` 顺序加载
