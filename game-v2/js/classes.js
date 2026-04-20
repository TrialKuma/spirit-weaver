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
// 资源：气息（0-10），初始满值，每回合回复2。
// 被动效果由魂灵提供；角色本身无被动。
class QiMaster extends Character {
    constructor(name, stats) {
        super('qi', name, stats);
        this.resources = {
            qi: { val: 10, max: 10, name: '气' }
        };
        // 已解锁的追加技能集合（通过升级解锁）
        this._unlockedFollowUps = new Set();
        // 架势状态追踪
        this._usedStanceThisTurn = false;
        this._tookHitAfterStance = false;
        this._huijiAvailable = false;
        // 无角色被动；被动效果由魂灵提供
        this.passive = null;
        this.initSkills();
    }

    initSkills() {
        this.skills = [
            createSkill({
                id: 'light_punch',
                name: '轻拳',
                type: 'attack',
                cost: { qi: 0 },
                baseMultiplier: 1.0,
                tags: ['Light', 'Melee'],
                desc: '造成100%攻击力伤害',
                onHit: (user, target) => {
                    // 集气掌锤子：命中回1气（qiOnHit 由 applyHammer extra spread 设置）
                    const sk = user.skills.find(s => s.id === 'light_punch');
                    if (sk && sk.qiOnHit) {
                        user.resources.qi.val = Math.min(10, user.resources.qi.val + sk.qiOnHit);
                        Logger.log(`集气掌：气+${sk.qiOnHit}`);
                        if (typeof updateResourceUI === 'function') updateResourceUI();
                    }
                }
            }),
            createSkill({
                id: 'rapid_strike',
                name: '迅击',
                type: 'special',
                cost: { qi: 2 },
                baseMultiplier: 2.0,
                tags: ['Special', 'Melee'],
                desc: '造成200%攻击力伤害'
            }),
            createSkill({
                id: 'devastate',
                name: '崩山',
                type: 'Ultimate',
                cost: { qi: 6 },
                baseMultiplier: 3.5,
                tags: ['Heavy', 'Ultimate', 'Melee'],
                desc: '造成350%攻击力伤害'
            }),
            createSkill({
                id: 'stance',
                name: '架势',
                type: 'defense',
                cost: { qi: 0 },
                baseMultiplier: 0,
                effect: 'stance',
                tags: ['Defense'],
                desc: '获得攻击力100%的护盾。本回合未受击额外回复2气'
            })
        ];
    }

    canUseSkill(skill) {
        if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) return true;
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

        // 崩山·极：消耗所有气（consumeAllQi 由 applyHammer extra spread 设置）
        if (skill.consumeAllQi) {
            qiCost = Math.max(8, this.resources.qi.val);
            const extraQi = qiCost - 8;
            const extraMult = extraQi * (skill.extraQiMultPerPoint || 1.0);
            skill.calculatedDamage = this.getBuffedAtk() * (5.5 + extraMult);
            Logger.log(`崩山·极！消耗 ${qiCost} 气，倍率 ${((5.5 + extraMult) * 100).toFixed(0)}%`);
        }

        // 架势系技能：effect === 'stance'（base架势；气合拳/龙腾通过 hammer extra 把 effect 清空）
        if (skill.effect === 'stance') {
            const shieldVal = Math.floor(this.getBuffedAtk() * 1.0);
            this.shield += shieldVal;
            this._usedStanceThisTurn = true;
            this._tookHitAfterStance = false;
            this._huijiAvailable = false;
            Logger.log(`架势！护盾 +${shieldVal}`, true);
            skill.calculatedDamage = 0;
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                this.resources.qi.val -= qiCost;
            }
            if (typeof updateResourceUI === 'function') updateResourceUI();
            if (typeof updateBuffBars === 'function') updateBuffBars();
            return skill;
        }

        if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
            this.resources.qi.val -= qiCost;
            Logger.log(`使用 ${skill.name}，消耗 ${qiCost} 气`);
        } else {
            Logger.log(`使用 ${skill.name}（DEBUG：资源不消耗）`);
        }

        if (typeof updateResourceUI === 'function') updateResourceUI();
        return skill;
    }

    onTurnStart() {
        this.resources.qi.val = Math.min(this.resources.qi.max, this.resources.qi.val + 2);
        Logger.log(`气宗：气+2 (当前 ${this.resources.qi.val}/${this.resources.qi.max})`);
        this._usedStanceThisTurn = false;
        this._tookHitAfterStance = false;
        this._huijiAvailable = false;
        if (typeof updateResourceUI === 'function') updateResourceUI();
    }

    onTurnEnd() {
        // 架势回气：本回合使用架势且未受击
        if (this._usedStanceThisTurn && !this._tookHitAfterStance) {
            this.resources.qi.val = Math.min(this.resources.qi.max, this.resources.qi.val + 2);
            Logger.log('架势：本回合未受击，气+2', true);
            if (typeof updateResourceUI === 'function') updateResourceUI();
        }
        this._usedStanceThisTurn = false;
        this._tookHitAfterStance = false;
        this._huijiAvailable = false;
    }

    takeDamage(damage) {
        const died = super.takeDamage(damage);
        if (damage > 0) {
            this._tookHitAfterStance = true;
            // 架势受击后：若已解锁回击，标记可用
            if (this._usedStanceThisTurn && this._unlockedFollowUps.has('qi_follow_huiji')) {
                this._huijiAvailable = true;
            }
        }
        return died;
    }

    onAction(action) {
        // 预留：后续可添加行动级回调
    }
}

// B. 剑圣 (Combo) - 行动积攒型
// 资源：连击（0-10），初始0，每段命中+1连击。
// 被动效果由魂灵提供；角色本身无被动。
class ComboMaster extends Character {
    constructor(name, stats) {
        super('combo', name, stats);
        this.resources = {
            combo: { val: 0, max: 10, name: '连击' }
        };
        // 已解锁的追加技能集合（通过升级解锁）
        this._unlockedFollowUps = new Set();
        // 见切状态追踪
        this._seeingStance = false;
        this._perfectParryReady = false;
        // 无角色被动；被动效果由魂灵提供
        this.passive = null;
        this.initSkills();
    }

    initSkills() {
        this.skills = [
            createSkill({
                id: 'quick_slash',
                name: '快斩',
                type: 'attack',
                cost: { combo: 0 },
                baseMultiplier: 0.8,
                hits: 2,
                tags: ['Light', 'Melee', 'MultiHit'],
                desc: '2段×80%，每段命中+1连击（共+2）'
            }),
            createSkill({
                id: 'chain_slash',
                name: '连斩',
                type: 'special',
                cost: { combo: 3 },
                baseMultiplier: 0.8,
                hits: 3,
                tags: ['Special', 'Melee', 'MultiHit'],
                desc: '3段×80%，每段+1连击（净±0）'
            }),
            createSkill({
                id: 'finisher',
                name: '终结技',
                type: 'Ultimate',
                cost: { combo: 6 },
                baseMultiplier: 3.0,
                noComboGain: true,
                tags: ['Heavy', 'Ultimate', 'Melee'],
                desc: '300%+额外连击×50%（10连击=500%）'
            }),
            createSkill({
                id: 'kiri',
                name: '见切',
                type: 'defense',
                cost: { combo: 0 },
                baseMultiplier: 0,
                noComboGain: true,
                effect: 'kiri',
                tags: ['Defense'],
                desc: '获得攻击力50%护盾。受击自动反击80%+1连击。\n敌AV≤20时使用 → 完美格挡200%+2连击'
            })
        ];
    }

    addCombo(n) {
        this.resources.combo.val = Math.min(10, this.resources.combo.val + n);
        if (typeof updateResourceUI === 'function') updateResourceUI();
    }

    canUseSkill(skill) {
        if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) return true;
        return this.resources.combo.val >= (skill.cost.combo || 0);
    }

    useSkill(skillId) {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return false;
        if (!this.canUseSkill(skill)) {
            Logger.log('连击不足！', true);
            return false;
        }

        let comboCost = skill.cost.combo || 0;

        // 见切（或流水/残像）
        if (skill.effect === 'kiri') {
            const shieldVal = Math.floor(this.getBuffedAtk() * 0.5);
            this.shield += shieldVal;
            this._seeingStance = true;
            // 完美格挡：使用见切时敌方行动值 ≤ 20（即将行动的窗口期）
            const enemyAV = (typeof GameState !== 'undefined' && GameState.enemy) ? (GameState.enemy.av || Infinity) : Infinity;
            if (enemyAV <= 20) {
                this._perfectParryReady = true;
                Logger.log(`见切！完美格挡！（敌方AV=${enemyAV.toFixed(1)}）`, true);
            } else {
                this._perfectParryReady = false;
                Logger.log(`见切！护盾 +${shieldVal}（敌方AV=${enemyAV.toFixed(1)}）`, true);
            }
            skill.calculatedDamage = 0;
            if (typeof updateResourceUI === 'function') updateResourceUI();
            if (typeof updateBuffBars === 'function') updateBuffBars();
            return skill;
        }

        // 残像（kiri hammer extra.afterimageEffect → no damage, ATK+30% buff）
        if (skill.afterimageEffect) {
            this.addBuff({ name: '残像', type: 'buff', stat: 'atk', value: 0.3, duration: 2, desc: 'ATK+30%（2回合）' });
            Logger.log('残像！ATK+30%（2回合）', true);
            skill.calculatedDamage = 0;
            if (typeof updateResourceUI === 'function') updateResourceUI();
            return skill;
        }

        // 终结技：消耗所有连击（6+额外）
        if (skillId === 'finisher' && !skill.pureHitsFinisher && !skill.issanEffect) {
            const totalCombo = this.resources.combo.val;
            const extra = Math.max(0, totalCombo - 6);
            const mult = 3.0 + extra * 0.5;
            skill.calculatedDamage = this.getBuffedAtk() * mult;
            Logger.log(`终结技！消耗 ${totalCombo} 连击，倍率 ${(mult * 100).toFixed(0)}%`);
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                this.resources.combo.val = 0;
            }
            if (typeof updateResourceUI === 'function') updateResourceUI();
            return skill;
        }

        // 一闪（finisher hammer: 10连击 700%）
        if (skill.issanEffect) {
            comboCost = 10;
            skill.calculatedDamage = this.getBuffedAtk() * 7.0;
            Logger.log(`一闪！消耗 ${comboCost} 连击`);
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                this.resources.combo.val -= comboCost;
            }
            if (typeof updateResourceUI === 'function') updateResourceUI();
            return skill;
        }

        // 普通技能（快斩/连斩及其变体）
        if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
            this.resources.combo.val -= comboCost;
            Logger.log(`使用 ${skill.name}，消耗 ${comboCost} 连击`);
        } else {
            Logger.log(`使用 ${skill.name}（DEBUG：资源不消耗）`);
        }
        if (typeof updateResourceUI === 'function') updateResourceUI();
        return skill;
    }

    onTurnStart() {
        this._seeingStance = false;
        this._perfectParryReady = false;
        if (typeof updateResourceUI === 'function') updateResourceUI();
    }

    onTurnEnd() {
        this._seeingStance = false;
        this._perfectParryReady = false;
    }

    takeDamage(damage) {
        const died = super.takeDamage(damage);
        if (damage > 0 && this._seeingStance) {
            const mult = this._perfectParryReady ? 2.0 : 0.8;
            const comboGain = this._perfectParryReady ? 2 : 1;
            this._seeingStance = false;
            this._perfectParryReady = false;
            Logger.log(mult >= 2.0 ? '完美格挡！' : '见切！', true);
            // 延迟反击（等受击动画结束）
            setTimeout(() => {
                if (!GameState.isBattleEnded && GameState.enemy) {
                    const rawDmg = this.getBuffedAtk() * mult;
                    const def = GameState.enemy.def || 0;
                    const finalDmg = Math.max(1, rawDmg - def);
                    GameState.enemy.takeDamage(finalDmg);
                    this.addCombo(comboGain);
                    if (typeof SFX !== 'undefined') SFX.hit();
                    if (typeof recordSkillDamageStat === 'function') {
                        recordSkillDamageStat('skill:kiri', mult >= 2.0 ? '完美格挡' : '见切反击', finalDmg);
                    }
                    Logger.log(`${mult >= 2.0 ? '完美格挡反击' : '见切反击'}！造成 ${finalDmg.toFixed(1)} 点伤害，连击+${comboGain}`, true);
                    const enemyPos = typeof getUnitCenter === 'function' ? getUnitCenter('enemy-box') : null;
                    if (enemyPos && typeof ParticleSystem !== 'undefined') {
                        ParticleSystem.showDamageNumber(enemyPos.x, enemyPos.y - 20, finalDmg, '#ffd54f',
                            mult >= 2.0 ? '完美格挡!' : '反击!', { holdMs: 500, fadeMs: 900, floatDistance: 30 });
                        ParticleSystem.createImpact(enemyPos.x, enemyPos.y, mult >= 2.0 ? 'heavy' : 'light', '#ffd54f');
                    }
                    // 追击追加（若已解锁）
                    if (this._unlockedFollowUps.has('combo_follow_kiri_chase')) {
                        const fu = typeof FollowUpSkillDefs !== 'undefined' ? FollowUpSkillDefs['combo_follow_kiri_chase'] : null;
                        if (fu && fu.canUse(this)) {
                            const r = fu.execute(this, GameState.enemy);
                            if (r && r.damage > 0 && GameState.enemy && !GameState.isBattleEnded) {
                                const chaseDmg = Math.max(1, r.damage - def);
                                GameState.enemy.takeDamage(chaseDmg);
                                this.addCombo(r.comboGain || 1);
                                Logger.log(`追击！造成 ${chaseDmg.toFixed(1)} 点伤害`, true);
                            }
                        }
                    }
                    if (GameState.enemy && GameState.enemy.hp <= 0 && !GameState.isBattleEnded && typeof winBattle === 'function') {
                        GameState.isBattleEnded = true;
                        winBattle();
                    }
                    if (typeof updateUI === 'function') updateUI();
                    if (typeof updateBuffBars === 'function') updateBuffBars();
                }
            }, 350);
        }
        return died;
    }

    onAction(action) {
        // 连击积攒通过 main.js 的 per-hit 逻辑处理（每段命中+1连击）
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
                desc: '平衡-3，造成100%伤害，施加侵蚀（攻击力20%/回合）'
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
    // 新内伤系统：spiritInjury（由气息魂管理）
    if ((GameState.enemy.spiritInjury || 0) > 0) {
        const vuln = GameState.enemy.spiritInjuryVuln || 1.2;
        finalDamage *= vuln;
        GameState.enemy.spiritInjury = Math.max(0, GameState.enemy.spiritInjury - 1);
        // 回流分支：内伤被消耗时玩家ATK+1
        const spirit = GameState.spirit;
        if (spirit && spirit.state && spirit.state.branchReflux && GameState.player) {
            GameState.player.baseAtk = (GameState.player.baseAtk || 10) + 1;
            Logger.log(`【回流】触发！玩家ATK +1（当前 ${GameState.player.baseAtk}）`);
        }
        if (typeof updateBuffBars === 'function') updateBuffBars();
    }
    GameState.enemy.hp = Math.max(0, GameState.enemy.hp - finalDamage);
    if (typeof recordSkillDamageStat === 'function') {
        const sid = (GameState.spirit && GameState.spirit.id) ? GameState.spirit.id : label;
        const sname = (GameState.spirit && GameState.spirit.name)
            ? `魂灵·${GameState.spirit.name}`
            : `魂灵·${label}`;
        recordSkillDamageStat(`spirit:${sid}`, sname, finalDamage);
    }
    Logger.log(`${label} 造成 ${finalDamage.toFixed(1)} 点伤害`);
    if (typeof SFX !== 'undefined') SFX.hit();
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
        // UI 展示用：被动技能列表 + 魂灵主动/自动技能列表
        this.passives = config.passives || [];
        this.spiritSkills = config.spiritSkills || [];
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

// ==================== 新魂灵目录（当前版本：气息魂 + 连击魂）====================
// 旧魂灵（守卫/誓盟/领主/伴侣/侍从/协奏/书记/信使/商人）暂时屏蔽
const SpiritCatalog = {
    spiritual: [
        {
            id: 'qi_spirit',
            name: '气息魂',
            icon: '🌊',
            spiritType: 'spiritual_passive',
            timeline: false,
            desc: '被动型魂灵。单次消耗≥6气时自动触发攻击并附加【内伤】；累计消耗12气触发旋风斩；释放特技时触发续剑。',
            visual: { color: '#ff6644' },
            // 被动技能列表（用于UI展示）
            passives: [
                {
                    id: 'qis_inner_wound',
                    name: '内伤',
                    icon: 'assets/art/icons/skill_types/type_passive_v2.png',
                    desc: '单次消耗≥6气时：魂灵攻击100%，对目标附加【内伤】（下次受击伤害+20%）'
                }
            ],
            // 魂灵技能列表（旋风斩/续剑自动触发，显示在魂灵区）
            spiritSkills: [
                {
                    id: 'qis_whirlwind',
                    name: '旋风斩',
                    icon: 'assets/art/icons/skill_types/type_followup_v2.png',
                    desc: '3段×100%攻击力（累计消耗12气触发）',
                    autoTrigger: true
                },
                {
                    id: 'qis_continuation',
                    name: '续剑',
                    icon: 'assets/art/icons/skill_types/type_followup_v2.png',
                    desc: '80%攻击力追加（释放特技时触发）',
                    autoTrigger: true
                }
            ]
        },
        {
            id: 'combo_spirit',
            name: '连击魂',
            icon: '⚡',
            spiritType: 'spiritual_active',
            timeline: true,
            speed: 150,
            desc: '手操型魂灵。玩家每次行动+1层【疾风】（每层+10速度，上限10层）。魂灵行动到达时，选择释放斩风或飞驰步。',
            visual: { color: '#ffcc44' },
            passives: [
                {
                    id: 'cs_gale',
                    name: '疾风',
                    icon: 'assets/art/icons/skill_types/type_passive_v2.png',
                    desc: '玩家每次行动+1层疾风（每层+10速度），上限10层。仅通过魂灵技能消耗，不自然衰减'
                }
            ],
            spiritSkills: [
                {
                    id: 'cs_slash_wind',
                    name: '斩风',
                    icon: 'assets/art/icons/skill_types/type_special_v2.png',
                    cost: 2,
                    costUnit: '疾风',
                    desc: '2段×90%攻击力伤害',
                    autoTrigger: false
                },
                {
                    id: 'cs_dash_step',
                    name: '飞驰步',
                    icon: 'assets/art/icons/skill_types/type_ultimate_v2.png',
                    cost: 5,
                    costUnit: '疾风',
                    desc: '100%伤害，玩家立即再行动一次',
                    autoTrigger: false
                }
            ]
        }
    ]
};

/** 获取全部可用魂灵配置 */
function getAllSpiritCatalogEntries() {
    return Object.values(SpiritCatalog).flat();
}

/** 魂灵选择：当前版本只展示气息魂和连击魂 */
function getRandomSpiritChoices() {
    const spirits = SpiritCatalog.spiritual || [];
    return { category: 'spiritual', choices: [...spirits] };
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

    // ── 新魂灵 hooks ──
    const newSpiritHooks = {
        qi_spirit: {
            onPlayerAction: (self, action) => {
                // 记录本次气消耗，供 onAfterSkill 使用
                self.state.lastQiCost = action.qiCost || (action.cost ? (action.cost.qi || 0) : 0);
            },
            onAfterSkill: (self, context) => {
                if (!context || !GameState.player || !GameState.enemy) return;
                if (GameState.isBattleEnded) return;
                const player = GameState.player;
                const enemy = GameState.enemy;
                const skill = context.skill;
                const qiCost = context.qiCost || self.state.lastQiCost || 0;
                const atk = getEffectivePlayerAtk(player);

                // ── Step 1: 续剑（特技类技能触发）──
                const isSpecial = skill && (skill.type === 'special' || (skill.tags && skill.tags.includes('Special')));
                if (isSpecial) {
                    self.state.xujiianCount = (self.state.xujiianCount || 0) + 1;
                    const cnt = self.state.xujiianCount;
                    let mult = self.state.xujiianMult || 0.8;
                    // 续剑·终（强化3）：连续第3次升格为160%
                    if (self.state.xujiianUpgrade3 && cnt >= 3) {
                        mult = 1.6;
                        self.state.xujiianCount = 0;
                        Logger.log('续剑·终！', true);
                    } else {
                        Logger.log('续剑触发！', true);
                    }
                    // 续剑强化2：回复1气
                    if (self.state.xujiianUpgrade2) {
                        player.resources.qi.val = Math.min(10, player.resources.qi.val + 1);
                        if (typeof updateResourceUI === 'function') updateResourceUI();
                    }
                    setTimeout(() => applySpiritDamage(atk * mult, '续剑'), 50);
                } else {
                    self.state.xujiianCount = 0;
                }

                // ── Step 2: 旋风斩累计（+本次消耗量）──
                self.state.qiCostAccum = (self.state.qiCostAccum || 0) + qiCost;
                const threshold = self.state.whirlwindThreshold || 12;
                if (self.state.qiCostAccum >= threshold) {
                    self.state.qiCostAccum -= threshold;
                    const segments = self.state.whirlwindSegments || 3;
                    Logger.log(`旋风斩触发！${segments}段攻击`, true);
                    for (let i = 0; i < segments; i++) {
                        setTimeout(() => applySpiritDamage(atk * 1.0, '旋风斩'), 100 + i * 150);
                    }
                    if (typeof updateBuffBars === 'function') setTimeout(updateBuffBars, 100 + segments * 150);
                }

                // ── Step 3: 内伤被动（单次消耗≥6气）──
                if (qiCost >= 6) {
                    setTimeout(() => {
                        if (GameState.isBattleEnded) return;
                        applySpiritDamage(atk * 1.0, '气息魂');
                        // 附加内伤
                        if (!enemy.spiritInjury) enemy.spiritInjury = 0;
                        if (self.state.branchMode === 'explosion') {
                            // 内爆分支：叠层，满3层爆发
                            enemy.spiritInjury = Math.min(3, enemy.spiritInjury + 1);
                            enemy.spiritInjuryVuln = 1.2;
                            Logger.log(`【内伤】+1层（${enemy.spiritInjury}/3）`, true);
                            if (enemy.spiritInjury >= 3) {
                                enemy.spiritInjury = 0;
                                setTimeout(() => {
                                    const burstDmg = getEffectivePlayerAtk(player) * 3.0;
                                    applySpiritDamage(burstDmg, '内爆！');
                                    Logger.log('【内爆】！爆发300%！', true);
                                    if (typeof updateBuffBars === 'function') updateBuffBars();
                                }, 200);
                            }
                        } else {
                            // 基础/重伤：1层
                            enemy.spiritInjury = 1;
                            enemy.spiritInjuryVuln = self.state.branchMode === 'heavy' ? 1.6 : 1.2;
                            Logger.log(`【内伤】附加！（易伤+${Math.round((enemy.spiritInjuryVuln - 1) * 100)}%）`, true);
                        }
                        if (typeof updateBuffBars === 'function') updateBuffBars();
                    }, 80);
                }
            },
            getStatusText: (self) => {
                const accum = self.state.qiCostAccum || 0;
                const threshold = self.state.whirlwindThreshold || 12;
                return `气积 ${accum}/${threshold}`;
            }
        },

        combo_spirit: {
            onPlayerAction: (self, action) => {
                if (!GameState.player) return;
                const player = GameState.player;

                // +1层疾风
                self.state.galeStacks = Math.min(10, (self.state.galeStacks || 0) + 1);

                // 乘风分支：魂灵速度也受疾风加速
                if (self.state.branchRiding) {
                    self.speed = 150 + self.state.galeStacks * 5;
                }

                // 狂风分支：每累计5层自动全体150%
                if (self.state.branchStorm) {
                    self.state.galeAccumForStorm = (self.state.galeAccumForStorm || 0) + 1;
                    if (self.state.galeAccumForStorm >= 5) {
                        self.state.galeAccumForStorm = 0;
                        setTimeout(() => {
                            if (!GameState.isBattleEnded) {
                                applySpiritDamage(getEffectivePlayerAtk(player) * 1.5, '狂风');
                                Logger.log('【狂风】触发！', true);
                            }
                        }, 50);
                    }
                }

                // 更新玩家速度（疾风每层+10速度）
                player.speed = player.baseSpeed + self.state.galeStacks * 10;
                if (typeof updateUI === 'function') updateUI();

                // 交错计数：上次是魂灵行动，这次是玩家行动 → +1
                if (self.state.lastActor === 'spirit') {
                    self.state.crossCount = (self.state.crossCount || 0) + 1;
                }
                self.state.lastActor = 'player';

                // 交错之斩：≥3次交错
                if ((self.state.crossCount || 0) >= 3) {
                    self.state.crossCount = 0;
                    const crossAtk = getEffectivePlayerAtk(player);
                    setTimeout(() => {
                        if (GameState.isBattleEnded) return;
                        applySpiritDamage(crossAtk * 1.5, '交错之斩·魂');
                        applySpiritDamage(crossAtk * 1.5, '交错之斩·人');
                        Logger.log('【交错之斩】触发！', true);
                        // 交错强化1：易伤debuff
                        if (self.state.crossUpgrade1 && GameState.enemy) {
                            GameState.enemy.addBuff({
                                name: '交错·易伤', type: 'debuff', stat: 'vulnerability',
                                value: 0.2, duration: 1, desc: '受伤+20%（1回合）'
                            });
                        }
                        if (typeof updateBuffBars === 'function') updateBuffBars();
                    }, 100);
                }
            },
            onSpiritTurn: (self) => {
                // 连击魂轮到行动时，展示技能选择UI
                GameState.spiritTurnPending = {
                    spirit: self,
                    callback: null
                };
                return { delayMs: 0, interactive: true };
            },
            getStatusText: (self) => {
                return `疾风 ${self.state.galeStacks || 0}/10`;
            }
        }
    };

    const hookSet = hooks[spirit.id] || newSpiritHooks[spirit.id];
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
    // ── 气宗追加技能（通过锤子升级解锁，由 _unlockedFollowUps 控制可见性）──
    qi_follow_lianquan: {
        id: 'qi_follow_lianquan',
        name: '连拳',
        desc: '轻拳命中后必定触发。追加80%攻击力打击，不消耗气',
        icon: '👊',
        tags: ['Light', 'Melee', 'FollowUp'],
        cost: { qi: 0 },
        costDesc: '无',
        isUnlocked(player) {
            return player && player._unlockedFollowUps && player._unlockedFollowUps.has('qi_follow_lianquan');
        },
        canUse(player) {
            return this.isUnlocked(player);
        },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            const dmg = player.getBuffedAtk() * 0.8;
            return { damage: dmg, hits: 1, isRanged: false };
        }
    },
    qi_follow_zhenpuo: {
        id: 'qi_follow_zhenpuo',
        name: '震破',
        desc: '崩山后可用。造成150%攻击力伤害，推迟目标行动条20%，消耗2气',
        icon: '💫',
        tags: ['Melee', 'FollowUp'],
        cost: { qi: 2 },
        costDesc: '2 气',
        isUnlocked(player) {
            return player && player._unlockedFollowUps && player._unlockedFollowUps.has('qi_follow_zhenpuo');
        },
        canUse(player) {
            if (!this.isUnlocked(player)) return false;
            if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) return true;
            return player && player.resources.qi.val >= 2;
        },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            if (!(typeof hasInfiniteResources === 'function' && hasInfiniteResources())) {
                player.resources.qi.val -= 2;
            }
            const dmg = player.getBuffedAtk() * 1.5;
            if (typeof delayUnitAV === 'function') {
                delayUnitAV(enemy, 0.2);
                Logger.log('震破推迟敌人行动条20%', true);
            }
            if (typeof updateResourceUI === 'function') updateResourceUI();
            return { damage: dmg, hits: 1, isRanged: false };
        }
    },
    qi_follow_huiji: {
        id: 'qi_follow_huiji',
        name: '回击',
        desc: '架势受击后可用。造成120%攻击力伤害，回复2气，不消耗气',
        icon: '🛡️',
        tags: ['Melee', 'FollowUp'],
        cost: { qi: 0 },
        costDesc: '无',
        isUnlocked(player) {
            return player && player._unlockedFollowUps && player._unlockedFollowUps.has('qi_follow_huiji');
        },
        canUse(player) {
            return this.isUnlocked(player) && !!(player && player._huijiAvailable);
        },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            player._huijiAvailable = false;
            const dmg = player.getBuffedAtk() * 1.2;
            player.resources.qi.val = Math.min(10, player.resources.qi.val + 2);
            Logger.log('回击！气+2', true);
            if (typeof updateResourceUI === 'function') updateResourceUI();
            return { damage: dmg, hits: 1, isRanged: false };
        }
    },
    // ── 剑圣追加技能（通过锤子升级解锁，由 _unlockedFollowUps 控制可见性）──
    combo_follow_ranwu: {
        id: 'combo_follow_ranwu',
        name: '乱舞',
        desc: '快斩后必定追加。60%攻击力，+1连击；50%概率继续触发乱舞·破（需解锁）',
        icon: '⚔️',
        tags: ['Light', 'Melee', 'FollowUp'],
        cost: { combo: 0 },
        costDesc: '无',
        isUnlocked(player) {
            return player && player._unlockedFollowUps && player._unlockedFollowUps.has('combo_follow_ranwu');
        },
        canUse(player) { return this.isUnlocked(player); },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            const dmg = player.getBuffedAtk() * 0.6;
            const canChain = player._unlockedFollowUps && player._unlockedFollowUps.has('combo_follow_ranwu_po') && Math.random() < 0.5;
            return { damage: dmg, hits: 1, isRanged: false, comboGain: 1,
                chainId: canChain ? 'combo_follow_ranwu_po' : null };
        }
    },
    combo_follow_ranwu_po: {
        id: 'combo_follow_ranwu_po',
        name: '乱舞·破',
        desc: '乱舞后50%概率追加。80%攻击力，+1连击；50%概率继续触发乱舞·急（需解锁）',
        icon: '⚔️',
        tags: ['Light', 'Melee', 'FollowUp'],
        cost: { combo: 0 },
        costDesc: '无',
        isUnlocked(player) {
            return player && player._unlockedFollowUps && player._unlockedFollowUps.has('combo_follow_ranwu_po');
        },
        canUse(player) { return this.isUnlocked(player); },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            const dmg = player.getBuffedAtk() * 0.8;
            const canChain = player._unlockedFollowUps && player._unlockedFollowUps.has('combo_follow_ranwu_ji') && Math.random() < 0.5;
            return { damage: dmg, hits: 1, isRanged: false, comboGain: 1,
                chainId: canChain ? 'combo_follow_ranwu_ji' : null };
        }
    },
    combo_follow_ranwu_ji: {
        id: 'combo_follow_ranwu_ji',
        name: '乱舞·急',
        desc: '乱舞·破后50%概率追加。120%攻击力，+1连击',
        icon: '⚔️',
        tags: ['Special', 'Melee', 'FollowUp'],
        cost: { combo: 0 },
        costDesc: '无',
        isUnlocked(player) {
            return player && player._unlockedFollowUps && player._unlockedFollowUps.has('combo_follow_ranwu_ji');
        },
        canUse(player) { return this.isUnlocked(player); },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            const dmg = player.getBuffedAtk() * 1.2;
            return { damage: dmg, hits: 1, isRanged: false, comboGain: 1 };
        }
    },
    combo_follow_zanxin: {
        id: 'combo_follow_zanxin',
        name: '残心',
        desc: '终结技后可追加。100%攻击力，回复3连击（为下轮循环起手）',
        icon: '🌀',
        tags: ['Melee', 'FollowUp'],
        cost: { combo: 0 },
        costDesc: '无',
        isUnlocked(player) {
            return player && player._unlockedFollowUps && player._unlockedFollowUps.has('combo_follow_zanxin');
        },
        canUse(player) { return this.isUnlocked(player); },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            const dmg = player.getBuffedAtk() * 1.0;
            if (typeof player.addCombo === 'function') player.addCombo(3);
            Logger.log('残心：回复3连击', true);
            return { damage: dmg, hits: 1, isRanged: false, comboGain: 0 }; // comboGain=0, 已通过addCombo处理
        }
    },
    combo_follow_kiri_chase: {
        id: 'combo_follow_kiri_chase',
        name: '追击',
        desc: '见切反击后自动追加。80%攻击力，+1连击',
        icon: '💨',
        tags: ['Melee', 'FollowUp'],
        cost: { combo: 0 },
        costDesc: '无',
        isUnlocked(player) {
            return player && player._unlockedFollowUps && player._unlockedFollowUps.has('combo_follow_kiri_chase');
        },
        canUse(player) { return this.isUnlocked(player); },
        execute(player, enemy) {
            if (!player || !enemy) return { damage: 0 };
            const dmg = player.getBuffedAtk() * 0.8;
            return { damage: dmg, hits: 1, isRanged: false, comboGain: 1 };
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
// 气宗追加：rate:1.0（解锁后必触发），通过各技能 canUse() 中的 isUnlocked 过滤可见性
const FollowUpTriggers = {
    qi: {
        // 轻拳：触发连拳 + 回击（若可用）
        light_punch: {
            rate: 1.0,
            skills: ['qi_follow_lianquan', 'qi_follow_huiji']
        },
        // 迅击（及其锤子变体）：正常迅击无追加；闪击锤子时触发全部已解锁追加
        rapid_strike: {
            rate: 1.0,
            skills: ['qi_follow_lianquan', 'qi_follow_zhenpuo', 'qi_follow_huiji'],
            condition: (player) => {
                const rs = player.skills && player.skills.find(s => s.id === 'rapid_strike');
                return !!(rs && rs.isFlash);
            }
        },
        // 崩山：触发震破 + 回击（若可用）
        devastate: {
            rate: 1.0,
            skills: ['qi_follow_zhenpuo', 'qi_follow_huiji']
        },
        // 架势：不触发追加（回击由 takeDamage 标记，在 light_punch/devastate 触发时检测）
    },
    // 剑圣追加：rate:1.0，通过 canUse().isUnlocked() 过滤
    combo: {
        // 快斩：触发乱舞（已解锁时）
        quick_slash: {
            rate: 1.0,
            skills: ['combo_follow_ranwu']
        },
        // 连斩及变体：无追加（或后续扩展）
        // 终结技：触发残心
        finisher: {
            rate: 1.0,
            skills: ['combo_follow_zanxin']
        },
        // 见切：追击通过 takeDamage 内联处理，不走 FollowUpTriggers
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

