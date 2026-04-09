// ==================== 角色基础类 ====================

class Character {
    constructor(classId, name, stats) {
        this.classId = classId;
        this.name = name;
        this.hp = stats.hp;
        this.maxHp = stats.hp;
        this.shield = 0; // 护盾值
        this.spiritShieldReflect = false;
        this.speed = stats.speed; 
        this.baseSpeed = stats.speed; // 保存基础速度 
        this.baseAtk = stats.baseAtk || 10;
        this.def = stats.def || 5;
        this.type = 'player';
        this.resources = {};
        this.skills = [];
        this.buffs = []; // { name, type, stat, value, duration, onTurnStart, onTurnEnd, icon }
        this.modifiers = [];
        this.passive = null; // 被动技能
    }

    addModifier(modifier) {
        if (modifier) this.modifiers.push(modifier);
    }

    getDamageModifiers(skill, context) {
        return this.modifiers.filter(mod => mod.appliesTo(skill));
    }

    takeDamage(damage) {
        let actualDamage = damage;
        let absorbed = 0;
        
        // 护盾抵消
        if (this.shield > 0) {
            if (this.shield >= actualDamage) {
                absorbed = actualDamage;
                this.shield -= actualDamage;
                Logger.log(`${this.name} 的护盾抵消了 ${actualDamage} 点伤害`);
                actualDamage = 0;
            } else {
                absorbed = this.shield;
                actualDamage -= this.shield;
                Logger.log(`${this.name} 的护盾抵消了 ${this.shield} 点伤害`);
                this.shield = 0;
            }
        }

        if (absorbed > 0 && this.spiritShieldReflect && typeof GameState !== 'undefined' && GameState.enemy) {
            GameState.enemy.hp = Math.max(0, GameState.enemy.hp - absorbed);
            Logger.log(`护盾反射造成 ${absorbed} 点伤害`);
            if (GameState.enemy.hp <= 0 && typeof winBattle === 'function') {
                GameState.isBattleEnded = true;
                winBattle();
            }
        }

        if (this.shield <= 0) {
            this.spiritShieldReflect = false;
        }

        if (actualDamage > 0) {
            this.hp = Math.max(0, this.hp - actualDamage);
            Logger.log(`${this.name} 受到 ${actualDamage.toFixed(1)} 点伤害`, true);
        }
        
        return this.hp <= 0;
    }

    addBuff(buff) {
        // 检查是否已有同名Buff (对于不可叠加的)
        const existing = this.buffs.find(b => b.name === buff.name);
        if (existing) {
            // 刷新持续时间
            existing.duration = buff.duration;
            // 如果是叠加型的，叠加数值 (logic varies, here simplified)
            if (buff.stackable) {
                existing.value += buff.value;
                existing.stacks = (existing.stacks || 1) + 1;
            }
            Logger.log(`${this.name} 的【${buff.name}】持续时间已刷新`);
        } else {
            this.buffs.push({ ...buff }); // Clone
            Logger.log(`${this.name} 获得了【${buff.name}】`);
        }
        this.recalculateStats();
        if (typeof this.updateSkills === 'function') {
            this.updateSkills();
            if (typeof updateSkillsUI === 'function') {
                updateSkillsUI();
            }
        }
    }
    
    // 更新Buff状态（回合结束时调用）
    updateBuffs() {
        // 处理回合结束效果 (如DOT伤害，也可以在回合开始处理，看设计)
        // 这里主要处理持续时间递减
        for (let i = this.buffs.length - 1; i >= 0; i--) {
            const buff = this.buffs[i];
            
            // 永久Buff (duration -1) 不会消失
            if (buff.duration !== -1) {
                buff.duration--;
                if (buff.duration <= 0) {
                    Logger.log(`${this.name} 的【${buff.name}】效果结束`);
                    this.buffs.splice(i, 1);
                }
            }
        }
        this.recalculateStats();
        if (typeof this.updateSkills === 'function') {
            this.updateSkills();
            if (typeof updateSkillsUI === 'function') {
                updateSkillsUI();
            }
        }
    }
    
    // 回合开始时的 Buff 效果 (DOT, HOT 等)
    applyStartTurnBuffs(position = null) {
        let dotDamage = 0;
        this.buffs.forEach(buff => {
            const stacks = buff.stacks || 1;
            if (buff.type === 'dot') {
                const dmg = buff.value * stacks;
                this.hp = Math.max(0, this.hp - dmg);
                dotDamage += dmg;
                Logger.log(`${this.name} 受到【${buff.name}】伤害 ${dmg} 点`);
                if (position && typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.showDamageNumber(
                        position.x,
                        position.y - 20,
                        dmg,
                        '#8800cc',
                        'DOT',
                        { holdMs: 450, fadeMs: 1000, floatDistance: 25 }
                    );
                    ParticleSystem.createParticles(position.x, position.y, 12, '#8800cc');
                }
            }
            // HOT
            if (buff.type === 'hot') {
                const heal = buff.value * stacks;
                this.hp = Math.min(this.maxHp, this.hp + heal);
                Logger.log(`${this.name} 恢复了 ${heal} 点生命`);
                if (position && typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.showDamageNumber(
                        position.x,
                        position.y - 20,
                        `+${heal}`,
                        '#7CFC00',
                        '恢复',
                        { holdMs: 400, fadeMs: 900, floatDistance: 20 }
                    );
                }
            }
        });
        return dotDamage;
    }

    recalculateStats() {
        // 重置为基础值
        let speedMult = 1.0;
        let atkMult = 1.0;
        let defAdd = 0;
        
        this.buffs.forEach(buff => {
            if (buff.stat === 'speed') speedMult += buff.value;
            if (buff.stat === 'atk') atkMult += buff.value;
            if (buff.stat === 'def') defAdd += buff.value;
        });
        
        // 应用
        this.speed = Math.max(1, this.baseSpeed * speedMult);
        // Atk 通常是计算伤害时用的，这里不直接改 baseAtk，而是提供 getter
        this.currentAtkMult = atkMult;
        this.currentDefAdd = defAdd;
        
        // 还要考虑特殊状态
        // if (this.classId === 'combo' && this.speedStacks) ... 已经在 onAction 处理了，这里最好统一
    }

    getBuffedAtk() {
        return this.baseAtk * (this.currentAtkMult || 1.0);
    }
    
    getBuffedDef() {
        return this.def + (this.currentDefAdd || 0);
    }

    onTurnStart() {
        // 子类实现
    }

    onAction(action) {
        // 子类实现
    }
}

// A. 气宗 (Qi) - 蓄力爆发型
// 内伤系统：可叠层（0-10），叠满后可引爆。高消耗技能叠内伤层数。
class QiMaster extends Character {
    constructor(name, stats) {
        super('qi', name, stats);
        this.resources = {
            qi: { val: 10, max: 10, name: '气' }
        };
        this.qiInternalInjuryMult = 1.3;
        this.qiSurge = false;
        this.qiBlade = false;
        this.qiChainStrike = false;
        this.qiMountainCrush = false;
        this.qiMountainCrushStacks = 0;
        this.qiInnerFlow = false;
        this.qiInjuryDetonateBonus = false;
        this.passive = {
            desc: '消耗≥6点气的技能为目标叠加3层【内伤】。内伤可叠加（上限10层），被引爆或达到上限时造成爆发伤害。'
        };
        this.initSkills();
    }

    initSkills() {
        this.skills = [
            createSkill({
                id: 'light_strike',
                name: '轻击',
                type: 'attack',
                cost: { qi: 0 },
                baseMultiplier: 1.0,
                damage: this.baseAtk * 1.0,
                tags: ['Light', 'Melee'],
                desc: '基础拳法，不消耗气，造成100%攻击力伤害',
                onHit: (user, target) => {
                    // 气刃升级：气≥8时轻击叠1层内伤
                    if (user.qiBlade && user.resources.qi.val >= 8 && target) {
                        this._addInjuryStacks(target, 1);
                    }
                    // 连环拳锤子：每hit叠内伤
                    const hammer = user.skills.find(s => s.id === 'light_strike');
                    if (hammer && hammer._activeHammer && hammer._activeHammer.morph.extra && hammer._activeHammer.morph.extra.stacksInjuryPerHit) {
                        this._addInjuryStacks(target, hammer._activeHammer.morph.extra.stacksInjuryPerHit);
                    }
                    // 回气掌锤子
                    if (hammer && hammer._activeHammer && hammer._activeHammer.morph.extra && hammer._activeHammer.morph.extra.qiRecoveryOnHit) {
                        user.resources.qi.val = Math.min(10, user.resources.qi.val + hammer._activeHammer.morph.extra.qiRecoveryOnHit);
                        Logger.log(`回气掌：气+${hammer._activeHammer.morph.extra.qiRecoveryOnHit}`);
                        updateResourceUI();
                    }
                    // 轻击连环升级
                    if (user.qiChainStrike) {
                        user.addBuff({
                            name: '连击加速', type: 'buff', stat: 'speed',
                            value: 0.05, duration: 1, desc: '速度+5%'
                        });
                    }
                }
            }),
            createSkill({
                id: 'rapid_strike',
                name: '迅击',
                type: 'special',
                cost: { qi: 2 },
                baseMultiplier: 2.0,
                damage: this.baseAtk * 2.0,
                tags: ['Special', 'Melee'],
                desc: '消耗2气，造成200%攻击力伤害。目标有内伤时返还2气。',
                onHit: (user, target) => {
                    if (target && target.injuryStacks > 0) {
                        user.resources.qi.val = Math.min(10, user.resources.qi.val + 2);
                        Logger.log('命中内伤目标！返还2气', true);
                        if (user.qiInnerFlow) {
                            user.resources.qi.val = Math.min(10, user.resources.qi.val + 1);
                            Logger.log('内息循环：额外+1气');
                        }
                        updateResourceUI();
                    }
                    if (user.qiRapidSpeedBoost) {
                        user.addBuff({
                            name: '迅击-加速', type: 'buff', stat: 'speed',
                            value: user.qiRapidSpeedBoost, duration: 1,
                            desc: `速度提升 ${(user.qiRapidSpeedBoost * 100).toFixed(0)}%`
                        });
                    }
                    // 裂伤击锤子
                    const rapidSkill = user.skills.find(s => s.id === 'rapid_strike');
                    if (rapidSkill && rapidSkill._activeHammer && rapidSkill._activeHammer.morph.extra) {
                        const ext = rapidSkill._activeHammer.morph.extra;
                        if (ext.stacksInjury && target) {
                            this._addInjuryStacks(target, ext.stacksInjury);
                        }
                    }
                }
            }),
            createSkill({
                id: 'devastate',
                name: '崩山',
                type: 'Ultimate',
                cost: { qi: 6 },
                baseMultiplier: 3.5,
                damage: this.baseAtk * 3.5,
                tags: ['Heavy', 'Ultimate', 'Melee'],
                desc: '消耗6气，造成350%攻击力伤害。叠加3层内伤'
            })
        ];
    }

    _addInjuryStacks(target, count) {
        if (!target) return;
        if (!target.injuryStacks) target.injuryStacks = 0;
        const before = target.injuryStacks;
        target.injuryStacks = Math.min(10, target.injuryStacks + count);
        const added = target.injuryStacks - before;
        if (added > 0) {
            Logger.log(`内伤 +${added}层（当前${target.injuryStacks}/10）`, true);
        }
        // 叠满自动引爆
        if (target.injuryStacks >= 10) {
            this._detonateInjury(target);
        }
        // 兼容旧系统：保持 internalInjury > 0 供其他系统判断
        target.internalInjury = target.injuryStacks > 0 ? 2 : 0;
        updateBuffBars();
    }

    _detonateInjury(target) {
        if (!target || !target.injuryStacks || target.injuryStacks <= 0) return 0;
        const stacks = target.injuryStacks;
        const detonateDmg = this.baseAtk * 0.6 * stacks * this.qiInternalInjuryMult;
        target.injuryStacks = 0;
        target.internalInjury = 0;

        target.takeDamage(detonateDmg);
        Logger.log(`内伤引爆（${stacks}层）！造成 ${detonateDmg.toFixed(1)} 点爆发伤害`, true);

        if (this.qiArmorBreakOnInjury) {
            target.addBuff({
                name: '内伤-破防', type: 'debuff', stat: 'def',
                value: -2, duration: 2, desc: '防御降低2'
            });
        }

        const enemyPos = typeof getUnitCenter === 'function' ? getUnitCenter('enemy-box') : null;
        if (enemyPos && typeof ParticleSystem !== 'undefined') {
            ParticleSystem.showDamageNumber(enemyPos.x, enemyPos.y - 30, detonateDmg, '#ff0000', '引爆!',
                { fontSize: '28px', holdMs: 600, fadeMs: 1200, floatDistance: 40 });
            ParticleSystem.createImpact(enemyPos.x, enemyPos.y, 'ultimate', '#ff4400');
            ParticleSystem.shakeScreen(8, 300);
        }

        if (target.hp <= 0 && !GameState.isBattleEnded && typeof winBattle === 'function') {
            GameState.isBattleEnded = true;
            winBattle();
        }

        updateBuffBars();
        return detonateDmg;
    }

    onTurnStart() {
        const qiGain = this.qiSurge ? 3 : 2;
        this.resources.qi.val = Math.min(this.resources.qi.max, this.resources.qi.val + qiGain);
        Logger.log(`气宗：气+${qiGain} (当前 ${this.resources.qi.val}/${this.resources.qi.max})`);
        updateResourceUI();
    }

    canUseSkill(skill) {
        if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) {
            return true;
        }
        return this.resources.qi.val >= (skill.cost.qi || 0);
    }

    useSkill(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return false;
        if (!this.canUseSkill(skill)) {
            Logger.log('气不足！', true);
            return false;
        }

        let qiCost = skill.cost.qi || 0;

        // 蓄力崩山锤子：消耗所有气
        if (skill.id === 'devastate' && skill._activeHammer && skill._activeHammer.morph.extra && skill._activeHammer.morph.extra.consumeAllQi) {
            qiCost = Math.max(skill.cost.qi || 6, this.resources.qi.val);
            const extraQi = qiCost - (skill.cost.qi || 6);
            const extraMult = extraQi * (skill._activeHammer.morph.extra.extraQiMultPerPoint || 0.5);
            skill.calculatedDamage = this.getBuffedAtk() * (skill.baseMultiplier + extraMult);
            Logger.log(`蓄力崩山！消耗 ${qiCost} 气，倍率 ${((skill.baseMultiplier + extraMult) * 100).toFixed(0)}%`);
        }

        if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
            this.resources.qi.val -= qiCost;
            Logger.log(`使用 ${skill.name}，消耗 ${qiCost} 气`);
        } else {
            Logger.log(`使用 ${skill.name}（DEBUG：资源不消耗）`);
        }

        // 迅影锤子：推进行动条
        if (skill._activeHammer && skill._activeHammer.morph.extra && skill._activeHammer.morph.extra.avAdvance) {
            if (typeof CTBSystem !== 'undefined') {
                CTBSystem.advanceUnitAV(this, skill._activeHammer.morph.extra.avAdvance);
                Logger.log(`迅影推进行动条 ${(skill._activeHammer.morph.extra.avAdvance * 100).toFixed(0)}%`);
            }
        }

        updateResourceUI();
        return skill;
    }

    onAction(action) {
        if (action.type === 'skill' && action.skill && action.skill.cost && (action.skill.cost.qi || 0) >= 6) {
            if (GameState.enemy) {
                this._addInjuryStacks(GameState.enemy, 3);

                // 引爆锤子
                const devSkill = this.skills.find(s => s.id === 'devastate');
                if (devSkill && devSkill._activeHammer && devSkill._activeHammer.morph.extra && devSkill._activeHammer.morph.extra.detonateInjury) {
                    if (action.skill.id === 'devastate') {
                        this._detonateInjury(GameState.enemy);
                    }
                }

                // 破山势升级
                if (this.qiMountainCrush && action.skill.id === 'devastate' && this.qiMountainCrushStacks < 3) {
                    this.qiMountainCrushStacks++;
                    GameState.enemy.def = Math.max(0, GameState.enemy.def - 1);
                    Logger.log(`破山势！目标DEF永久-1（已减${this.qiMountainCrushStacks}次）`, true);
                }
            }
        }
    }
}

// B. 剑圣 (Combo) - 行动积攒型
// 疾风衰减：不攻击时每回合掉1层，被打掉2层
class ComboMaster extends Character {
    constructor(name, stats) {
        super('combo', name, stats);
        this.resources = {
            combo: { val: 0, max: 10, name: '连击' }
        };
        this.speedStacks = 0;
        this.comboGaleSpeedBonus = 0;
        this.comboBladeWind = false;
        this.comboGaleGuard = false;
        this.comboAfterimage = false;
        this._didActThisTurn = false;
        this._extraActionUsed = false;
        this.passive = {
            desc: '每次攻击+1层【疾风】(每层+10速度,满10层+20%攻)。不攻击时每回合掉1层,被打掉2层。'
        };
        this.initSkills();
    }

    initSkills() {
        this.skills = [
            createSkill({
                id: 'quick_strike',
                name: '疾风',
                type: 'attack',
                cost: { combo: 0 },
                baseMultiplier: 0.4,
                damage: this.baseAtk * 0.4, // 单发40%
                tags: ['Light', 'MultiHit', 'Melee'],
                hits: 2,
                desc: '2次打击，每次40%，总计80%，叠加1层【疾风】'
            }),
            createSkill({
                id: 'combo_strike',
                name: '连斩',
                type: 'special',
                cost: { combo: 0 },
                baseMultiplier: 0.5,
                damage: this.baseAtk * 0.5,
                tags: ['Light', 'MultiHit', 'Melee'],
                hits: 1, // Base hits, dynamic in execution
                desc: '造成50%攻击力伤害，60%概率追加一次打击（最多5连斩），每次打击获得1连击点'
            }),
            createSkill({
                id: 'finisher',
                name: '终结技',
                type: 'Ultimate',
                cost: { combo: 6 }, // 固定消耗6
                damage: 0, // 动态计算
                tags: ['Heavy', 'Ultimate', 'Finisher', 'Melee'],
                desc: '消耗6连击，造成450%攻击力'
            })
        ];
    }

    onTurnStart() {
        // 疾风衰减：本回合没攻击则掉1层
        if (!this._didActThisTurn && this.speedStacks > 0) {
            this.speedStacks = Math.max(0, this.speedStacks - 1);
            const perStack = 10 + (this.comboGaleSpeedBonus || 0);
            this.speed = this.baseSpeed + this.speedStacks * perStack;
            Logger.log(`【疾风】衰减！-1层（当前 ${this.speedStacks}层）`);
        }
        this._didActThisTurn = false;
        this._extraActionUsed = false;

        // 疾风护体：每层+1防御
        if (this.comboGaleGuard && this.speedStacks > 0) {
            this.def = 5 + this.speedStacks;
        }
        updateUI();
    }

    // 被打时掉疾风层数
    takeDamage(damage) {
        const died = super.takeDamage(damage);
        if (this.speedStacks > 0 && damage > 0) {
            const loss = Math.min(2, this.speedStacks);
            this.speedStacks -= loss;
            const perStack = 10 + (this.comboGaleSpeedBonus || 0);
            this.speed = this.baseSpeed + this.speedStacks * perStack;
            Logger.log(`【疾风】受击衰减-${loss}层（当前 ${this.speedStacks}层）`);
            updateUI();
        }
        return died;
    }

    onAction(action) {
        this._didActThisTurn = true;

        if (action.type === 'skill' || action.type === 'attack') {
            if (this.speedStacks < 10) {
                this.speedStacks++;
                const perStack = 10 + (this.comboGaleSpeedBonus || 0);
                this.speed = this.baseSpeed + this.speedStacks * perStack;
                Logger.log(`【疾风】叠层！当前 ${this.speedStacks} 层，速度 ${this.speed}`);
                updateUI();
            }
        }
        
        if (action.skill && action.skill.id === 'quick_strike') {
            if (this.speedStacks < 10) {
                this.speedStacks++;
                const perStack = 10 + (this.comboGaleSpeedBonus || 0);
                this.speed = this.baseSpeed + this.speedStacks * perStack;
                Logger.log(`【疾风】技能额外叠层！当前 ${this.speedStacks} 层，速度 ${this.speed}`);
                updateUI();
            }
        }

        // 刃风升级：满层时额外伤害（在main.js伤害计算中处理）
        
        // 连击积攒
        if (action.skill && action.skill.id !== 'finisher') {
             const gain = action.hits || action.skill.hits || 1;
             this.resources.combo.val = Math.min(10, this.resources.combo.val + gain);
             Logger.log(`连击 +${gain} (当前: ${this.resources.combo.val})`);
             updateResourceUI();
        }
    }

    canUseSkill(skill) {
        if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) {
            return true;
        }
        return this.resources.combo.val >= (skill.cost.combo || 0);
    }

    useSkill(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return false;
        if (!this.canUseSkill(skill)) {
            Logger.log('连击不足！', true);
            return false;
        }

        if (skill.id === 'finisher') {
            const cost = this.comboFinisherConsumeAll
                ? Math.max(6, this.resources.combo.val)
                : 6;
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                this.resources.combo.val -= cost;
            }
            const buffedAtk = this.getBuffedAtk ? this.getBuffedAtk() : this.baseAtk;
            skill.damage = buffedAtk * (1.5 + 0.5 * cost); 
            Logger.log(
                (typeof hasInfiniteResources === 'function' && hasInfiniteResources())
                    ? `使用 ${skill.name}（DEBUG：连击不消耗）`
                    : `使用 ${skill.name}，消耗 ${cost} 连击`
            );
        }
        
        updateResourceUI();
        return skill;
    }
}

// C. 魔导 (Mana) - 弹药闭环型
class ManaMaster extends Character {
    constructor(name, stats) {
        super('mana', name, stats);
        this.resources = {
            mana: { val: 10, max: 10, name: '魔力' },
            ammo: { val: 0, max: 999, name: '弹药' }
        };
        this.stacks = 0; // 盈能层数
        this.manaOverflowAtkBonus = 0;
        this.manaOverflowSpeedBonus = 0;
        this.manaReloadCostReduction = 0;
        this.manaFullOverflowBurstBonus = 0;
        this.manaAmmoRecycle = false;
        this.manaFlow = false;
        this.manaPiercing = false;
        this.passive = {
            desc: '每消耗2魔力获1层【盈能】(上限5，每层+5%攻)。攻击移除1层并回3魔力。',
            onAction: (action) => {
                 if (action.type === 'skill' && 
                    action.skill.type !== 'Ultimate' &&
                     !action.skill.noManaRegen) { 
                     
                     if (this.stacks > 0) {
                         this.stacks--;
                         const manaReturn = this.manaFlow ? 4 : 3;
                         this.resources.mana.val = Math.min(10, this.resources.mana.val + manaReturn);
                         Logger.log(`【盈能】消耗1层，魔力+${manaReturn}`);
                         updateResourceUI();
                         updateBuffBars();
                     }
                 }
            }
        };
        this.initSkills();
    }

    initSkills() {
        this.updateSkills();
    }
    
    updateSkills() {
        const hasAmmo = (typeof hasInfiniteResources === 'function' && hasInfiniteResources())
            ? true
            : this.resources.ammo.val > 0;
        // 计算当前攻击力加成
        const atkMult = 1.0 + (this.stacks * (0.05 + (this.manaOverflowAtkBonus || 0)));
        const baseAtk = this.getBuffedAtk ? this.getBuffedAtk() : this.baseAtk;
        const currentAtk = baseAtk * atkMult;
        const fullOverflowBonus = (this.stacks >= 5) ? (1 + (this.manaFullOverflowBurstBonus || 0)) : 1;
        
        this.skills = [
            createSkill({
                id: 'shoot',
                name: hasAmmo ? '强化射击' : '射击',
                type: 'attack',
                cost: { ammo: hasAmmo ? 1 : 0 },
                damage: hasAmmo ? currentAtk * 3.6 : currentAtk * 0.8,
                baseMultiplier: hasAmmo ? 3.6 : 0.8,
                useRawDamage: true,
                tags: hasAmmo ? ['Ranged', 'Ultimate'] : ['Ranged'],
                desc: hasAmmo ? '消耗1弹药，360%伤害' : '80%伤害'
            }),
            createSkill({
                id: 'burst',
                name: hasAmmo ? '强化爆射' : '过载爆射',
                type: 'special',
                cost: { ammo: hasAmmo ? 3 : 0 },
                damage: hasAmmo ? currentAtk * 6.25 * fullOverflowBonus : currentAtk * 1.6, // 625% vs 160%
                baseMultiplier: hasAmmo ? 6.25 * fullOverflowBonus : 1.6,
                useRawDamage: true,
                tags: hasAmmo ? ['Ranged', 'Heavy', 'Ultimate'] : ['Ranged', 'Heavy'],
                hits: 1,
                // 无弹药时：100% 概率给自己上减速 Debuff
                selfDebuff: !hasAmmo ? { type: 'speed_down', value: 0.2, duration: 1, name: '过载' } : null,
                desc: hasAmmo ? '消耗3弹药，造成625%攻击力伤害' : '造成160%伤害，自身进入【过载】状态（速度降低20%，持续1回合）'
            }),
            createSkill({
                id: 'reload',
                name: '装填',
                type: 'Ultimate',
                cost: { mana: Math.max(1, 6 - (this.manaReloadCostReduction || 0)) },
                effect: 'reload',
                ammoGain: 3,
                tags: ['Reload', 'Ultimate'],
                desc: '消耗6魔力，装填3发弹药'
            })
        ];

        this.recalculateStats();
    }

    recalculateStats() {
        super.recalculateStats();
        if (this.manaOverflowSpeedBonus && this.stacks > 0) {
            this.speed = Math.max(1, this.speed * (1 + this.stacks * this.manaOverflowSpeedBonus));
        }
    }

    onTurnStart() {
        updateResourceUI();
    }

    canUseSkill(skill) {
        if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) {
            return true;
        }
        if (skill.cost.mana !== undefined) {
            return this.resources.mana.val >= skill.cost.mana;
        }
        if (skill.cost.ammo !== undefined && skill.cost.ammo > 0) {
            return this.resources.ammo.val >= skill.cost.ammo;
        }
        return true;
    }

    useSkill(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return false;
        if (!this.canUseSkill(skill)) {
            Logger.log('资源不足！', true);
            return false;
        }

        this._lastSkillWasEnhanced = (skill.cost.ammo > 0);

        if (skill.effect === 'reload') {
            // 装填：消耗魔力，获得盈能，但不触发被动（不消耗盈能，不回复魔力）
            if (skill.cost.mana > 0 && !(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                this.resources.mana.val -= skill.cost.mana;
                const stacksGained = Math.floor(skill.cost.mana / 2);
                this.stacks = Math.min(5, this.stacks + stacksGained);
                Logger.log(`获得 ${stacksGained} 层【盈能】(当前 ${this.stacks})`);
                updateBuffBars();
            }
            if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) {
                this.resources.ammo.val = Math.max(this.resources.ammo.val, skill.ammoGain);
            } else {
                this.resources.ammo.val += skill.ammoGain;
            }
            Logger.log(`装填完成！获得 ${skill.ammoGain} 发弹药`);
        } else if (skill.cost.mana > 0) {
            // 其他消耗魔力的技能（如果有的话）
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                this.resources.mana.val -= skill.cost.mana;
            }
            const stacksGained = Math.floor(skill.cost.mana / 2);
            this.stacks = Math.min(5, this.stacks + stacksGained);
            Logger.log(`获得 ${stacksGained} 层【盈能】(当前 ${this.stacks})`);
            updateBuffBars();
        }
        
        if (skill.cost.ammo > 0 && !(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
            this.resources.ammo.val -= skill.cost.ammo;
        }
        
        this.updateSkills();
        updateResourceUI();
        updateSkillsUI();
        return skill;
    }
}

// D. 判官 (Balance) - 极值决策型
class BalanceMaster extends Character {
    constructor(name, stats) {
        super('balance', name, stats);
        this.resources = {
            balance: { val: 0, min: -5, max: 5, name: '平衡' }
        };
        this.extremeState = null; // null | 'yang' | 'yin'
        this.extremePending = null; // 技能结算后标记，下回合激活
        this.extremeCD = 0;
        this.balanceAlternation = false;
        this.balanceErosionSpread = false;
        this.balanceYangShield = false;
        this.balanceUnity = false;
        this.karmaPool = 0;
        this.passive = {
            desc: '阳面(>0):全属性+10%/点 | 阴面(<0):敌方攻防-10%/点',
            onTurnStart: () => {}
        };
        this.initSkills();
    }

    initSkills() {
        this.skills = [
            createSkill({
                id: 'yang_strike',
                name: '阳击',
                type: 'attack',
                cost: {},
                damage: this.baseAtk * 1.3,
                baseMultiplier: 1.3,
                balanceShift: +3,
                tags: ['Yang', 'Melee'],
                desc: '平衡+3，造成130%伤害，行动值推进15%'
            }),
            createSkill({
                id: 'yin_strike',
                name: '阴击',
                type: 'special',
                cost: {},
                damage: this.baseAtk * 1.0,
                baseMultiplier: 1.0,
                balanceShift: -3,
                tags: ['Yin', 'Melee'],
                desc: '平衡-3，造成100%伤害，施加侵蚀(ATK×20%回合伤)'
            }),
            createSkill({
                id: 'verdict',
                name: '宣判',
                type: 'Ultimate',
                cost: {},
                damage: 0,
                baseMultiplier: 0,
                effect: 'verdict',
                tags: ['Judgment', 'Ultimate', 'Melee'],
                desc: '极值状态下可用：平衡归零，造成基于落差的爆发伤害'
            })
        ];
    }

    onTurnStart() {
        // 激活上回合标记的极值状态
        if (this.extremePending) {
            this.extremeState = this.extremePending;
            this.extremePending = null;
            Logger.log(`【${this.extremeState === 'yang' ? '阳极' : '阴极'}】激活！`, true);
            updateBuffBars();
        }

        // 极值状态期间暂停归中
        if (!this.extremeState) {
            const current = this.resources.balance.val;
            if (current > 0) this.resources.balance.val--;
            else if (current < 0) this.resources.balance.val++;
            if (current !== 0) {
                Logger.log(`判官：平衡归中 (当前: ${this.resources.balance.val})`);
            }
        }

        // 更新宣判技能的可用状态和描述
        this._updateVerdictSkill();

        updateResourceUI();
    }

    _updateVerdictSkill() {
        const verdict = this.skills.find(s => s.id === 'verdict');
        if (!verdict) return;
        if (this.extremeState === 'yang') {
            verdict.name = '阳极·宣判';
            verdict.desc = `平衡归零，造成${this._getVerdictMultiplier()}%伤害（归零后结算）`;
        } else if (this.extremeState === 'yin') {
            verdict.name = '阴极·宣判';
            verdict.desc = `平衡归零，造成${this._getVerdictMultiplier()}%伤害+审判(受伤+40%,2回合)`;
        } else {
            verdict.name = '宣判';
            verdict.desc = '极值状态下可用：平衡归零，造成基于落差的爆发伤害';
        }
    }

    _getVerdictMultiplier() {
        const drop = Math.abs(this.resources.balance.val);
        if (this.extremeState === 'yang') {
            return 100 + 80 * drop;
        } else {
            return 60 + 50 * drop;
        }
    }

    canUseSkill(skill) {
        if (skill.id === 'verdict') return !!this.extremeState;
        return true;
    }

    getStatsMultiplier() {
        const bal = this.resources.balance.val;
        const perPoint = 0.1 + (this.balancePerPointBonus || 0);
        let mult = 1.0;
        if (bal > 0) mult += (bal * perPoint);
        return mult;
    }

    getEnemyDebuffMultiplier() {
        const bal = this.resources.balance.val;
        const perPoint = 0.1 + (this.balancePerPointBonus || 0);
        let mult = 1.0;
        if (bal < 0) mult -= (Math.abs(bal) * perPoint);
        return mult;
    }

    _getContrastBonus(skill) {
        const bal = this.resources.balance.val;
        const contrastCoeff = 0.15 + (this.balanceContrastBonus || 0);
        const isReverse = (bal > 0 && skill.balanceShift < 0) || (bal < 0 && skill.balanceShift > 0);
        if (isReverse) return Math.abs(bal) * contrastCoeff;
        return 0;
    }

    useSkill(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return false;
        if (!this.canUseSkill(skill)) return false;

        const selfMult = this.getStatsMultiplier();
        const isExtreme = !!this.extremeState;
        let dmg = 0;

        if (skill.effect === 'verdict') {
            // 宣判：伤害在归零后结算（不享受被动加成）
            const verdictMult = this._getVerdictMultiplier() / 100;
            const wasYang = this.extremeState === 'yang';

            // 阴极宣判：施加审判debuff
            if (!wasYang && GameState.enemy) {
                GameState.enemy.addBuff({
                    name: '审判',
                    type: 'debuff',
                    stat: 'vulnerability',
                    value: 0.4,
                    duration: 2,
                    desc: '受到伤害+40%'
                });
                Logger.log('施加【审判】！敌方受伤+40%(2回合)', true);
            }

            this.resources.balance.val = 0;
            dmg = this.baseAtk * verdictMult;
            Logger.log(`${wasYang ? '阳极' : '阴极'}·宣判！落差爆发 ${(verdictMult * 100).toFixed(0)}%`, true);

            this._consumeExtreme();
            skill.calculatedDamage = dmg;
            updateResourceUI();
            updateBuffBars();
            return skill;
        }

        // 阳击/阴击
        const baseMult = skill.baseMultiplier;
        const contrastBonus = this._getContrastBonus(skill);
        const totalMult = baseMult + contrastBonus;

        if (isExtreme) {
            // 极值增强：不偏移平衡值
            const isReverse = (this.extremeState === 'yang' && skill.balanceShift < 0) ||
                              (this.extremeState === 'yin' && skill.balanceShift > 0);

            if (!isReverse) {
                // 同方向极值增强
                if (skill.id === 'yang_strike') {
                    dmg = this.baseAtk * selfMult * 2.5;
                    skill._tempName = '烈阳击';
                    skill._ignoreDef = true;
                    Logger.log('【烈阳击】！无视全部防御！', true);
                } else {
                    dmg = this.baseAtk * 1.8;
                    skill._tempName = '深渊击';
                    skill._deepErosion = true;
                    Logger.log('【深渊击】！深渊侵蚀！', true);
                }
            } else {
                // 逆方向：反差加成
                dmg = this.baseAtk * selfMult * totalMult;
                if (contrastBonus > 0) {
                    Logger.log(`反差！逆向加成 +${(contrastBonus * 100).toFixed(0)}%`, true);
                }
            }

            this._consumeExtreme();
        } else {
            // 普通状态：正常偏移平衡值
            dmg = this.baseAtk * selfMult * totalMult;
            const oldVal = this.resources.balance.val;
            this.resources.balance.val = Math.max(-5, Math.min(5, oldVal + skill.balanceShift));

            if (contrastBonus > 0) {
                Logger.log(`反差！逆向加成 +${(contrastBonus * 100).toFixed(0)}%`, true);
            }

            // 检查是否触发极值
            if (Math.abs(this.resources.balance.val) === 5 && this.extremeCD <= 0) {
                this.extremePending = this.resources.balance.val > 0 ? 'yang' : 'yin';
                Logger.log(`平衡达到极值！下回合进入【${this.extremePending === 'yang' ? '阳极' : '阴极'}】`, true);
            }
        }

        // 行动值推进（阳击附加效果）
        if (skill.id === 'yang_strike' && typeof CTBSystem !== 'undefined') {
            CTBSystem.advanceUnitAV(this, 0.15);
        }

        // 阳极护盾升级
        if (skill.id === 'yang_strike' && this.balanceYangShield && this.resources.balance.val > 0) {
            const shieldVal = Math.floor(this.maxHp * 0.1 * this.resources.balance.val);
            this.shield += shieldVal;
            Logger.log(`阳极护盾 +${shieldVal}`);
        }

        // 阴阳交替升级：不同方向连续使用+50%
        if (this.balanceAlternation && this._lastBalanceShift) {
            const wasReverse = (this._lastBalanceShift > 0 && skill.balanceShift < 0) ||
                               (this._lastBalanceShift < 0 && skill.balanceShift > 0);
            if (wasReverse) {
                dmg *= 1.5;
                Logger.log('【阴阳交替】反方向加成 +50%！', true);
            }
        }

        // 侵蚀效果（阴击附加效果）
        if (skill.id === 'yin_strike' && GameState.enemy) {
            // 锤子覆写侵蚀参数
            const yinHammer = skill._activeHammer && skill._activeHammer.morph ? skill._activeHammer.morph.extra : null;
            const baseErosionMult = (yinHammer && yinHammer.deepErosion) ? (yinHammer.erosionMult || 0.4) :
                                    skill._deepErosion ? 0.4 : 0.2;
            const erosionMult = baseErosionMult + (this.balanceErosionBonus || 0);
            const erosionDuration = (yinHammer && yinHammer.deepErosion) ? (yinHammer.erosionDuration || 2) :
                                    skill._deepErosion ? 2 : 1;
            const erosionDmg = Math.floor(this.baseAtk * erosionMult);

            GameState.enemy.addBuff({
                name: skill._deepErosion ? '深渊侵蚀' : '侵蚀',
                type: 'debuff',
                stat: 'dot',
                value: erosionDmg,
                duration: erosionDuration,
                desc: `每回合受到${erosionDmg}点伤害`
            });
            Logger.log(`施加${skill._deepErosion ? '【深渊侵蚀】' : '【侵蚀】'}(${erosionDmg}/回合,${erosionDuration}回合)`, true);

            // 阴极减速锤子
            if (yinHammer && yinHammer.yinSlow && this.resources.balance.val < 0) {
                const slowRatio = Math.abs(this.resources.balance.val) * (yinHammer.slowPerPoint || 0.1);
                if (typeof delayUnitAV === 'function') {
                    delayUnitAV(GameState.enemy, slowRatio);
                    Logger.log(`阴极减速：推迟敌人行动 ${(slowRatio * 100).toFixed(0)}%`, true);
                }
            }
        }

        // 业力池：累计侵蚀伤害（在DOT结算时由 applyStartTurnBuffs 触发）
        // 这里只标记判官有业力锤子
        const verdictSkill = this.skills.find(s => s.id === 'verdict');
        if (verdictSkill && verdictSkill._activeHammer &&
            verdictSkill._activeHammer.morph.extra && verdictSkill._activeHammer.morph.extra.karmaVerdict) {
            this._hasKarma = true;
        }

        skill.calculatedDamage = dmg;
        this._lastBalanceShift = skill.balanceShift || 0;
        updateResourceUI();
        updateBuffBars();
        return skill;
    }

    _consumeExtreme() {
        const verdictSkill = this.skills.find(s => s.id === 'verdict');
        const hasSamsara = verdictSkill && verdictSkill._activeHammer &&
            verdictSkill._activeHammer.morph.extra && verdictSkill._activeHammer.morph.extra.samsara;

        if (hasSamsara) {
            // 轮回锤子：不进入CD，平衡推到反方向极值
            const wasYang = this.extremeState === 'yang';
            this.extremeState = null;
            this.resources.balance.val = wasYang ? -5 : 5;
            this.extremePending = wasYang ? 'yin' : 'yang';
            this.extremeCD = 0;
            Logger.log(`【轮回】平衡推到${wasYang ? '阴' : '阳'}极！`, true);
        } else {
            this.extremeState = null;
            this.extremePending = null;
            this.extremeCD = 3 - (this.balanceExtremeCDReduction || 0);
        }
        this._updateVerdictSkill();
    }

    onAction(action) {
        // 极值CD每次行动减1
        if (this.extremeCD > 0) this.extremeCD--;
    }
}

// ==================== 魂灵系统 ====================

function getEffectivePlayerAtk(player) {
    if (!player) return 0;
    let atk = player.baseAtk || 0;
    if (player.classId === 'combo' && player.speedStacks >= 10) {
        atk *= 1.2;
    }
    if (player.classId === 'mana') {
        atk *= 1.0 + ((player.stacks || 0) * 0.05);
    }
    if (player.classId === 'balance' && player.getStatsMultiplier) {
        atk *= player.getStatsMultiplier();
    }
    return atk;
}

function getPrimaryResourceKey(player) {
    if (!player || !player.resources) return null;
    if (player.resources.mana) return 'mana';
    if (player.resources.qi) return 'qi';
    if (player.resources.combo) return 'combo';
    if (player.resources.balance) return 'balance';
    const keys = Object.keys(player.resources);
    return keys.length > 0 ? keys[0] : null;
}

function adjustResource(player, key, amount) {
    if (!player || !player.resources || !player.resources[key]) return 0;
    if (
        amount < 0 &&
        typeof hasInfiniteResources === 'function' &&
        hasInfiniteResources() &&
        typeof GameState !== 'undefined' &&
        player === GameState.player
    ) {
        return 0;
    }
    const res = player.resources[key];
    const min = res.min !== undefined ? res.min : 0;
    const max = res.max !== undefined ? res.max : 999;
    const before = res.val;
    res.val = Math.max(min, Math.min(max, res.val + amount));
    return res.val - before;
}

function adjustResourceForAssistant(player, key, amount) {
    if (!player || !player.resources || !player.resources[key]) return 0;
    if (key !== 'balance') {
        return adjustResource(player, key, amount);
    }
    const res = player.resources[key];
    const min = res.min !== undefined ? res.min : -5;
    const max = res.max !== undefined ? res.max : 5;
    const before = res.val;
    if (res.val === 0) return 0;
    const direction = res.val > 0 ? 1 : -1;
    const delta = amount >= 0 ? direction * amount : amount;
    res.val = Math.max(min, Math.min(max, res.val + delta));
    return res.val - before;
}

function getResourceTotalCost(cost) {
    if (!cost) return 0;
    return Object.values(cost).reduce((sum, val) => sum + (val || 0), 0);
}

function getEnemyDef() {
    if (!GameState.enemy) return 0;
    let enemyDef = GameState.enemy.def || 0;
    if (GameState.player && GameState.player.classId === 'balance') {
        const debuffMult = GameState.player.getEnemyDebuffMultiplier ? GameState.player.getEnemyDebuffMultiplier() : 1.0;
        if (debuffMult < 1.0) {
            enemyDef *= debuffMult;
        }
    }
    return enemyDef;
}

function applySpiritDamage(rawDamage, label = '魂灵') {
    if (!GameState.enemy) return 0;
    let finalDamage = Math.max(1, rawDamage - getEnemyDef());
    if (GameState.enemy.internalInjury > 0) {
        finalDamage *= 1.3;
    }
    GameState.enemy.hp = Math.max(0, GameState.enemy.hp - finalDamage);
    Logger.log(`${label} 造成 ${finalDamage.toFixed(1)} 点伤害`);
    const enemyPos = typeof getUnitCenter === 'function' ? getUnitCenter('enemy-box') : null;
    if (enemyPos && typeof ParticleSystem !== 'undefined') {
        ParticleSystem.showDamageNumber(enemyPos.x, enemyPos.y - 20, finalDamage, '#ffd54f', label, { holdMs: 450, fadeMs: 900, floatDistance: 25 });
        ParticleSystem.createParticles(enemyPos.x, enemyPos.y, 12, '#ffd54f');
    }
    if (GameState.enemy.hp <= 0 && !GameState.isBattleEnded && typeof winBattle === 'function') {
        GameState.isBattleEnded = true;
        winBattle();
    }
    return finalDamage;
}

function advanceUnitAV(unit, ratio) {
    if (!unit || !unit.speed) return;
    const baseAV = 10000 / unit.speed;
    unit.av = Math.max(0, unit.av - baseAV * ratio);
}

function delayUnitAV(unit, ratio) {
    if (!unit || !unit.speed) return;
    const baseAV = 10000 / unit.speed;
    unit.av += baseAV * ratio;
}

class Spirit {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.spiritType = config.spiritType; // autonomous | cooperative | assistant
        this.type = 'spirit'; // 时间轴类型
        this.speed = config.speed || 0;
        this.timeline = config.timeline || false;
        this.desc = config.desc || '';
        this.state = config.state || {};
        this.tunables = config.tunables || {};
        this.visual = config.visual || {};
        this.hooks = config.hooks || {};
    }

    updateVisualState() {
        const orb = document.getElementById('spirit-orb');
        if (orb) {
            const color = this.visual.color || 'var(--accent-tertiary)';
            orb.style.background = color;
            orb.style.boxShadow = `0 0 12px ${color}`;
        }
        const line = document.getElementById('resonance-line');
        if (line) {
            line.classList.remove('active');
        }
    }

    getStatusText() {
        if (typeof this.hooks.getStatusText === 'function') {
            return this.hooks.getStatusText(this);
        }
        return '';
    }

    onBeforeSkill(context) {
        if (this.hooks.onBeforeSkill) {
            this.hooks.onBeforeSkill(this, context);
        }
    }

    onPlayerAction(action) {
        if (this.hooks.onPlayerAction) {
            this.hooks.onPlayerAction(this, action);
        }
    }

    onAfterSkill(context) {
        if (this.hooks.onAfterSkill) {
            this.hooks.onAfterSkill(this, context);
        }
    }

    onTurnStart(context) {
        if (this.hooks.onTurnStart) {
            this.hooks.onTurnStart(this, context);
        }
    }

    onTurnEnd(context) {
        if (this.hooks.onTurnEnd) {
            this.hooks.onTurnEnd(this, context);
        }
    }

    onSpiritTurn() {
        if (this.hooks.onSpiritTurn) {
            return this.hooks.onSpiritTurn(this);
        }
        return null;
    }
}

const SpiritCatalog = {
    autonomous: [
        {
            id: 'guardian',
            name: '守卫',
            icon: '🛡️',
            spiritType: 'autonomous',
            speed: 140,
            desc: '行动后提供100%攻击力护盾；若上一次技能消耗≥6资源，护盾反射等量伤害',
            visual: { color: '#66ccff' },
            tunables: { shieldMult: 1.0, reflectThreshold: 6 }
        },
        {
            id: 'oath',
            name: '誓盟',
            icon: '⚔️',
            spiritType: 'autonomous',
            speed: 140,
            desc: '行动时造成100%攻击力伤害；玩家每次命中使其行动提前20%',
            visual: { color: '#ffd54f' },
            tunables: { damageMult: 1.0, advanceRatio: 0.2 }
        },
        {
            id: 'lord',
            name: '领主',
            icon: '👑',
            spiritType: 'autonomous',
            speed: 120,
            desc: '行动时造成150%攻击力伤害；每消耗1点资源本次伤害+10%',
            visual: { color: '#ff8a65' },
            tunables: { baseMult: 1.5, spendBonus: 0.1 }
        }
    ],
    cooperative: [
        {
            id: 'partner',
            name: '伴侣',
            icon: '💕',
            spiritType: 'cooperative',
            desc: '玩家每次攻击后追加80%攻击力伤害',
            visual: { color: '#ffeb3b' },
            tunables: { followMult: 0.8 }
        },
        {
            id: 'attendant',
            name: '侍从',
            icon: '🗡️',
            spiritType: 'cooperative',
            desc: '攻击/特技追加60%伤害；能量技追加120%伤害',
            visual: { color: '#ffca28' },
            tunables: { lightMult: 0.6, heavyMult: 1.2 }
        },
        {
            id: 'concerto',
            name: '协奏',
            icon: '🎶',
            spiritType: 'cooperative',
            desc: '攻击/特技叠加【蓄势】；能量技追加120%*(1+25%层数)并清空',
            visual: { color: '#ffe082' },
            tunables: { baseMult: 1.2, stackBonus: 0.25, maxStacks: 5 }
        }
    ],
    assistant: [
        {
            id: 'scribe',
            name: '书记',
            icon: '📖',
            spiritType: 'assistant',
            desc: '攻击/特技叠【记录】；能量技前每层+10%伤害并回10%资源',
            visual: { color: '#f48fb1' },
            tunables: { damageBonusPerStack: 0.1, resourceReturnRatio: 0.1, maxStacks: 5 }
        },
        {
            id: 'messenger',
            name: '信使',
            icon: '📜',
            spiritType: 'assistant',
            desc: '发布行动任务，完成后获得随机奖励并刷新任务',
            visual: { color: '#f06292' }
        },
        {
            id: 'merchant',
            name: '商人',
            icon: '💰',
            spiritType: 'assistant',
            timeline: true,
            speed: 200,
            desc: '行动时获得1金币；资源满溢额外得币；能量技消耗金币回资源(每枚10%)',
            visual: { color: '#ff7043' },
            tunables: { coinGain: 1, returnPerCoin: 0.1 }
        }
    ]
};

function getRandomSpiritChoices() {
    const categories = Object.keys(SpiritCatalog);
    const category = categories[Math.floor(Math.random() * categories.length)];
    const list = SpiritCatalog[category].slice();
    const choices = [];
    while (choices.length < 3 && list.length > 0) {
        const idx = Math.floor(Math.random() * list.length);
        choices.push(list.splice(idx, 1)[0]);
    }
    return { category, choices };
}

function createSpirit(spiritId) {
    const allSpirits = Object.values(SpiritCatalog).flat();
    const config = allSpirits.find(spirit => spirit.id === spiritId);
    if (!config) return null;

    const spirit = new Spirit(config);

    const hooks = {
        guardian: {
            onPlayerAction: (self, action) => {
                self.state.lastSpend = getResourceTotalCost(action.cost);
            },
            onSpiritTurn: (self) => {
                if (!GameState.player) return null;
                const shieldValue = getEffectivePlayerAtk(GameState.player) * (self.tunables.shieldMult || 1.0);
                GameState.player.shield += shieldValue;
                GameState.player.spiritShieldReflect = (self.state.lastSpend || 0) >= (self.tunables.reflectThreshold || 6);
                self.state.reflectArmed = GameState.player.spiritShieldReflect;
                Logger.log(`守卫护盾 +${Math.floor(shieldValue)}${self.state.reflectArmed ? '（反射激活）' : ''}`);
                const pos = typeof getUnitCenter === 'function' ? getUnitCenter('player-box') : null;
                if (pos && typeof ParticleSystem !== 'undefined') {
                    ParticleSystem.showDamageNumber(pos.x, pos.y - 20, '护盾', '#66ccff', '守卫', { holdMs: 450, fadeMs: 900 });
                }
                return { delayMs: 500 };
            },
            getStatusText: (self) => {
                return self.state.reflectArmed ? '反射已激活' : '护盾待命';
            }
        },
        oath: {
            onPlayerAction: (self, action) => {
                if (action.damage > 0) {
                    advanceUnitAV(self, self.tunables.advanceRatio || 0.2);
                }
            },
            onSpiritTurn: (self) => {
                const dmg = getEffectivePlayerAtk(GameState.player) * (self.tunables.damageMult || 1.0);
                applySpiritDamage(dmg, '誓盟');
                return { delayMs: 500 };
            },
            getStatusText: () => '随战同誓'
        },
        lord: {
            onPlayerAction: (self, action) => {
                self.state.lastSpend = getResourceTotalCost(action.cost);
            },
            onSpiritTurn: (self) => {
                const spend = self.state.lastSpend || 0;
                const dmg = getEffectivePlayerAtk(GameState.player) * (self.tunables.baseMult || 1.5) * (1 + spend * (self.tunables.spendBonus || 0.1));
                applySpiritDamage(dmg, '领主');
                return { delayMs: 550 };
            },
            getStatusText: (self) => `战意+${self.state.lastSpend || 0}`
        },
        partner: {
            onPlayerAction: (self, action) => {
                if (!action || !action.skill || action.damage <= 0) return;
                const dmg = getEffectivePlayerAtk(GameState.player) * (self.tunables.followMult || 0.8);
                applySpiritDamage(dmg, '伴侣');
            },
            getStatusText: () => '追击待命'
        },
        attendant: {
            onPlayerAction: (self, action) => {
                if (!action || !action.skill || action.damage <= 0) return;
                const skillType = action.skill.type;
                const isEnergy = skillType === 'Ultimate' || (action.skill.tags || []).includes('Ultimate');
                const mult = isEnergy ? (self.tunables.heavyMult || 1.2) : (self.tunables.lightMult || 0.6);
                const dmg = getEffectivePlayerAtk(GameState.player) * mult;
                applySpiritDamage(dmg, '侍从');
            },
            getStatusText: () => '应令而动'
        },
        concerto: {
            onPlayerAction: (self, action) => {
                if (!action || !action.skill) return;
                const skillType = action.skill.type;
                const isEnergy = skillType === '能量技' || (action.skill.tags || []).includes('Ultimate');
                if (isEnergy) {
                    const stacks = self.state.stacks || 0;
                    const mult = (self.tunables.baseMult || 1.2) * (1 + (self.tunables.stackBonus || 0.25) * stacks);
                    const dmg = getEffectivePlayerAtk(GameState.player) * mult;
                    applySpiritDamage(dmg, '协奏');
                    self.state.stacks = 0;
                } else if (skillType === 'attack' || skillType === 'special') {
                    const maxStacks = self.tunables.maxStacks || 5;
                    self.state.stacks = Math.min(maxStacks, (self.state.stacks || 0) + 1);
                }
            },
            getStatusText: (self) => `蓄势 ${self.state.stacks || 0}`
        },
        scribe: {
            onPlayerAction: (self, action) => {
                if (!action || !action.skill) return;
                const skillType = action.skill.type;
                if (skillType === 'attack' || skillType === 'special') {
                    const maxStacks = self.tunables.maxStacks || 5;
                    self.state.records = Math.min(maxStacks, (self.state.records || 0) + 1);
                }
            },
            onBeforeSkill: (self, context) => {
                if (!context || !context.skill || !GameState.player) return;
                const isEnergy = context.skill.type === 'Ultimate' || (context.skill.tags || []).includes('Ultimate');
                if (!isEnergy) return;
                const stacks = self.state.records || 0;
                if (stacks <= 0) return;
                context.baseDamage *= 1 + (self.tunables.damageBonusPerStack || 0.1) * stacks;
                const resKey = getPrimaryResourceKey(GameState.player);
                if (resKey) {
                    const res = GameState.player.resources[resKey];
                    const amount = Math.ceil((res.max || 0) * (self.tunables.resourceReturnRatio || 0.1) * stacks);
                    adjustResourceForAssistant(GameState.player, resKey, amount);
                    updateResourceUI();
                }
                self.state.records = 0;
            },
            getStatusText: (self) => `记录 ${self.state.records || 0}`
        },
        messenger: {
            onTurnStart: (self, context) => {
                if (!context || !context.unit || context.unit.type !== 'player') return;
                if (self.state.cooldownTurns && self.state.cooldownTurns > 0) return;
                if (!self.state.task) {
                    self.state.task = pickMessengerTask();
                    self.state.reward = pickMessengerReward();
                    self.state.taskDone = false;
                }
            },
            onPlayerAction: (self, action) => {
                if (!self.state.task || self.state.taskDone) return;
                if (self.state.task.check(action)) {
                    self.state.taskDone = true;
                }
            },
            onAfterSkill: (self) => {
                if (!self.state.task || !self.state.taskDone) return;
                if (self.state.reward) {
                    self.state.reward.apply();
                }
                self.state.rewardActiveTurns = 2;
                self.state.rewardApplied = true;
                self.state.cooldownTurns = 2;
                self.state.task = null;
                self.state.reward = null;
                self.state.taskDone = false;
            },
            onTurnEnd: (self, context) => {
                if (!context || !context.unit || context.unit.type !== 'player') return;
                if (self.state.rewardActiveTurns && self.state.rewardActiveTurns > 0) {
                    self.state.rewardActiveTurns -= 1;
                    self.state.rewardApplied = self.state.rewardActiveTurns > 0;
                }
                if (self.state.cooldownTurns && self.state.cooldownTurns > 0) {
                    self.state.cooldownTurns -= 1;
                }
            },
            getStatusText: (self) => {
                if (self.state.rewardApplied) return '奖励生效';
                if (self.state.task) return `任务：${self.state.task.name}`;
                if (self.state.cooldownTurns && self.state.cooldownTurns > 0) return '等待任务';
                return '等待指令';
            }
        },
        merchant: {
            onSpiritTurn: (self) => {
                self.state.coins = (self.state.coins || 0) + (self.tunables.coinGain || 1);
                Logger.log(`商人获得金币 +${self.tunables.coinGain || 1}`);
                return { delayMs: 450 };
            },
            onPlayerAction: (self) => {
                const player = GameState.player;
                const resKey = getPrimaryResourceKey(player);
                if (!player || !resKey) return;
                const res = player.resources[resKey];
                if (res && res.val >= res.max) {
                    self.state.coins = (self.state.coins || 0) + 1;
                }
            },
            onBeforeSkill: (self, context) => {
                if (!context || !context.skill || !GameState.player) return;
                const isEnergy = context.skill.type === 'Ultimate' || (context.skill.tags || []).includes('Ultimate');
                if (!isEnergy) return;
                const coins = self.state.coins || 0;
                if (coins <= 0) return;
                const resKey = getPrimaryResourceKey(GameState.player);
                if (resKey) {
                    const res = GameState.player.resources[resKey];
                    const amount = Math.ceil((res.max || 0) * (self.tunables.returnPerCoin || 0.1) * coins);
                    adjustResourceForAssistant(GameState.player, resKey, amount);
                    updateResourceUI();
                }
                self.state.coins = 0;
            },
            getStatusText: (self) => `金币 ${self.state.coins || 0}`
        }
    };

    const hookSet = hooks[spirit.id];
    if (hookSet) {
        spirit.hooks = hookSet;
    }

    return spirit;
}

function pickMessengerTask() {
    const tasks = [
        {
            id: 'task_attack',
            name: '使用攻击',
            check: (action) => action && action.skill && action.skill.type === 'attack'
        },
        {
            id: 'task_special',
            name: '使用特技',
            check: (action) => action && action.skill && action.skill.type === 'special'
        },
        {
            id: 'task_energy',
            name: '使用能量技',
            check: (action) => action && action.skill && (action.skill.type === 'Ultimate' || (action.skill.tags || []).includes('Ultimate'))
        }
    ];
    return tasks[Math.floor(Math.random() * tasks.length)];
}

function pickMessengerReward() {
    const rewards = [
        {
            name: '回收资源',
            apply: () => {
                const player = GameState.player;
                const resKey = getPrimaryResourceKey(player);
                if (!player || !resKey) return;
                const res = player.resources[resKey];
                const amount = Math.ceil((res.max || 0) * 0.1);
                adjustResourceForAssistant(player, resKey, amount);
                updateResourceUI();
            }
        },
        {
            name: '攻势强化',
            apply: () => {
                if (!GameState.player) return;
                GameState.player.addBuff({
                    name: '信使-攻势',
                    type: 'buff',
                    stat: 'atk',
                    value: 0.1,
                    duration: 2,
                    desc: '攻击提升10%'
                });
            }
        },
        {
            name: '先手推进',
            apply: () => {
                advanceUnitAV(GameState.player, 0.2);
            }
        },
        {
            name: '压制目标',
            apply: () => {
                delayUnitAV(GameState.enemy, 0.2);
            }
        },
        {
            name: '破防令',
            apply: () => {
                if (!GameState.enemy) return;
                GameState.enemy.addBuff({
                    name: '信使-破防',
                    type: 'debuff',
                    stat: 'def',
                    value: -2,
                    duration: 1,
                    desc: '防御降低2'
                });
            }
        },
        {
            name: '衰弱令',
            apply: () => {
                if (!GameState.enemy) return;
                GameState.enemy.addBuff({
                    name: '信使-衰弱',
                    type: 'debuff',
                    stat: 'atk',
                    value: -0.2,
                    duration: 2,
                    desc: '攻击降低20%'
                });
            }
        }
    ];
    return rewards[Math.floor(Math.random() * rewards.length)];
}

// ==================== 追加技能系统 ====================

const FollowUpSkillDefs = {
    qi_follow_strike: {
        id: 'qi_follow_strike',
        name: '追击',
        desc: '追加100%攻击力打击，消耗1气。内伤目标伤害+50%',
        icon: '👊',
        tags: ['Light', 'Melee', 'FollowUp'],
        cost: { qi: 1 },
        costDesc: '1 气',
        canUse(player) {
            if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) return true;
            return player && player.resources.qi.val >= 1;
        },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                player.resources.qi.val -= 1;
            }
            let dmg = player.getBuffedAtk() * 1.0;
            if (enemy.internalInjury > 0) dmg *= 1.5;
            updateResourceUI();
            return { damage: dmg, hits: 1, isRanged: false };
        }
    },
    qi_follow_force: {
        id: 'qi_follow_force',
        name: '劲气',
        desc: '造成60%攻击力伤害，推迟敌人行动条20%。消耗1气',
        icon: '💫',
        tags: ['Utility', 'Melee', 'FollowUp'],
        cost: { qi: 1 },
        costDesc: '1 气',
        canUse(player) {
            if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) return true;
            return player && player.resources.qi.val >= 1;
        },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                player.resources.qi.val -= 1;
            }
            const dmg = player.getBuffedAtk() * 0.6;
            if (typeof delayUnitAV === 'function') {
                delayUnitAV(enemy, 0.2);
            }
            Logger.log('劲气推迟敌人行动条20%', true);
            updateResourceUI();
            return { damage: dmg, hits: 1, isRanged: false };
        }
    },
    combo_follow_spin: {
        id: 'combo_follow_spin',
        name: '回旋斩',
        desc: '追加80%攻击力单段攻击，叠加1层疾风。消耗1连击',
        icon: '⚔',
        tags: ['Light', 'Melee', 'FollowUp'],
        cost: { combo: 1 },
        costDesc: '1 连击',
        canUse(player) {
            if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) return true;
            return player && player.resources.combo.val >= 1;
        },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                player.resources.combo.val -= 1;
            }
            let dmg = player.getBuffedAtk() * 0.8;
            if (player.speedStacks >= 10) dmg *= 1.2;
            // 叠1层疾风（追加不触发被动的"叠层"，但回旋斩自带叠层效果）
            if (player.speedStacks < 10) {
                player.speedStacks++;
                const perStack = 10 + (player.comboGaleSpeedBonus || 0);
                player.speed = player.baseSpeed + player.speedStacks * perStack;
                Logger.log(`【疾风】+1层（当前${player.speedStacks}层）`);
            }
            updateResourceUI();
            return { damage: dmg, hits: 1, isRanged: false };
        }
    },
    combo_follow_expose: {
        id: 'combo_follow_expose',
        name: '破绽',
        desc: '造成50%攻击力伤害，敌人防御-2（2回合）。消耗1连击',
        icon: '🎯',
        tags: ['Melee', 'Utility', 'FollowUp'],
        cost: { combo: 1 },
        costDesc: '1 连击',
        canUse(player) {
            if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) return true;
            return player && player.resources.combo.val >= 1;
        },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                player.resources.combo.val -= 1;
            }
            let dmg = player.getBuffedAtk() * 0.5;
            if (player.speedStacks >= 10) dmg *= 1.2;
            enemy.addBuff({
                name: '破绽',
                type: 'debuff',
                stat: 'def',
                value: -2,
                duration: 2,
                desc: '防御降低2'
            });
            Logger.log('施加【破绽】！敌方DEF-2(2回合)', true);
            updateResourceUI();
            return { damage: dmg, hits: 1, isRanged: false };
        }
    },
    mana_follow_aftershock: {
        id: 'mana_follow_aftershock',
        name: '余波',
        desc: '消耗1弹药追加远程射击，触发盈能被动',
        icon: '🔫',
        tags: ['Ranged', 'FollowUp'],
        cost: { ammo: 1 },
        costDesc: '1 弹药',
        canUse(player) {
            if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) return true;
            return player && player.resources.ammo.val >= 1;
        },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                player.resources.ammo.val -= 1;
            }
            const atkMult = 1.0 + ((player.stacks || 0) * (0.05 + (player.manaOverflowAtkBonus || 0)));
            const dmg = player.getBuffedAtk() * atkMult * 1.2;
            // 触发盈能被动：消耗1层盈能，回3魔力
            if (player.stacks > 0) {
                player.stacks--;
                player.resources.mana.val = Math.min(10, player.resources.mana.val + 3);
                Logger.log('【盈能】消耗1层，魔力+3');
            }
            if (typeof player.updateSkills === 'function') player.updateSkills();
            updateResourceUI();
            updateBuffBars();
            return { damage: dmg, hits: 1, isRanged: true };
        }
    },
    mana_follow_overcharge: {
        id: 'mana_follow_overcharge',
        name: '过载充能',
        desc: '消耗4魔力，额外装填1发弹药+2层盈能。All-in！',
        icon: '⚡',
        tags: ['Reload', 'Utility', 'FollowUp'],
        cost: { mana: 4 },
        costDesc: '4 魔力',
        canUse(player) {
            if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) return true;
            return player && player.resources.mana.val >= 4;
        },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                player.resources.mana.val -= 4;
            }
            if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) {
                player.resources.ammo.val = Math.max(player.resources.ammo.val, 1);
            } else {
                player.resources.ammo.val += 1;
            }
            const stacksGained = 2; // 4魔力 / 2 = 2层盈能
            player.stacks = Math.min(5, player.stacks + stacksGained);
            Logger.log(`过载充能！+1弹药，+${stacksGained}层盈能（当前${player.stacks}层）`, true);
            if (typeof player.updateSkills === 'function') player.updateSkills();
            updateResourceUI();
            updateBuffBars();
            return { damage: 0, hits: 0, isRanged: false };
        }
    }
};

// 来源技能 → 触发率 + 展示的追加列表
const FollowUpTriggers = {
    qi: {
        light_strike:  { rate: 0.33, skills: ['qi_follow_strike', 'qi_follow_force'] },
        rapid_strike:  { rate: 0.33, skills: ['qi_follow_strike', 'qi_follow_force'] },
        devastate:     { rate: 0.33, skills: ['qi_follow_force'] }
    },
    combo: {
        quick_strike:  { rate: 0.35, skills: ['combo_follow_spin', 'combo_follow_expose'] },
        combo_strike:  { rate: 0.35, skills: ['combo_follow_spin', 'combo_follow_expose'] },
        finisher:      { rate: 0.35, skills: ['combo_follow_expose'] }
    },
    mana: {
        shoot:         { rate: 0.35, skills: ['mana_follow_aftershock'], condition: (player) => player._lastSkillWasEnhanced },
        burst:         { rate: 0.35, skills: ['mana_follow_aftershock'], condition: (player) => player._lastSkillWasEnhanced },
        reload:        { rate: 0.40, skills: ['mana_follow_overcharge'] }
    }
    // 判官不设追加
};

// ==================== 角色工厂 ====================

function createCharacter(classId, name = '玩家') {
    const baseStats = { hp: 100, speed: 300, baseAtk: 10, def: 5 };
    
    switch(classId) {
        case 'qi':
            return new QiMaster(name, baseStats);
        case 'combo':
            return new ComboMaster(name, baseStats);
        case 'mana':
            return new ManaMaster(name, baseStats);
        case 'balance':
            return new BalanceMaster(name, baseStats);
        default:
            return new QiMaster(name, baseStats);
    }
}

