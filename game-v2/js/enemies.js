// ==================== 敌人系统 ====================

class Enemy extends Character {
    constructor(id, name, stats) {
        super(id, name, stats);
        this.type = 'enemy';
        this.nextAction = null; // 意图对象 { type, value, desc, icon }
        this.actionHistory = [];
    }

    // 规划下一次行动 (意图)
    planNextAction() {
        // 子类覆盖此方法
        this.nextAction = {
            type: 'attack',
            value: this.baseAtk,
            desc: `将造成 ${this.baseAtk} 点伤害`,
            icon: '⚔'
        };
    }

    // 执行行动
    executeAction(target) {
        if (!this.nextAction) this.planNextAction();
        
        const action = this.nextAction;
        Logger.log(`${this.name} 执行：${action.desc}`);

        let result = { damage: 0, effects: [] };

        switch (action.type) {
            case 'attack':
                // 攻击逻辑（支持多段）
                const hits = action.hits || 1;
                let damage = action.value;
                // 判官Debuff检查
                if (target.classId === 'balance') {
                     const debuffMult = target.getEnemyDebuffMultiplier ? target.getEnemyDebuffMultiplier() : 1.0;
                     if (debuffMult < 1.0) damage *= debuffMult;
                }
                // 自身虚弱检查 (如果有)
                // ...

                let totalDamage = 0;
                for (let i = 0; i < hits; i++) {
                    target.takeDamage(damage);
                    totalDamage += damage;
                }
                result.damage = totalDamage;

                // 附带 Debuff
                if (action.debuff) {
                    target.addBuff(action.debuff);
                }
                break;
                
            case 'defend':
                // 防御逻辑 - 增加临时护盾或防御buff
                this.addBuff({
                    name: '防御姿态',
                    type: 'buff',
                    stat: 'def',
                    value: action.value,
                    duration: 1,
                    desc: `防御力提升 ${action.value}`
                });
                break;

            case 'buff':
                // 给自己上Buff
                if (action.buff) {
                    if (action.buff.type === 'shield') {
                        this.shield = (this.shield || 0) + action.buff.value;
                        Logger.log(`${this.name} 获得 ${action.buff.value} 点护盾`);
                    } else {
                        this.addBuff(action.buff);
                    }
                }
                break;

            case 'debuff':
                // 给玩家上Debuff
                if (action.debuff) {
                    target.addBuff(action.debuff); // Character.addBuff 可以处理 debuff
                }
                break;
        }

        this.actionHistory.push(action.type);
        return result;
    }
}

// 1. 史莱姆 - 基础怪，偶尔回复
class Slime extends Enemy {
    constructor() {
        super('slime', '史莱姆', { hp: 100, speed: 70, baseAtk: 15, def: 0 });
        this.icon = '🟢';
    }

    planNextAction() {
        const rand = Math.random();
        if (this.hp < this.maxHp * 0.5 && rand < 0.3) {
            // 回血
            const heal = Math.floor(this.maxHp * 0.15); // 增加回复比例
            this.nextAction = {
                type: 'buff',
                value: heal,
                buff: {
                    name: '粘液再生',
                    type: 'buff',
                    stat: 'hp_regen', // 特殊处理
                    value: heal,
                    duration: 0, // 即时
                    desc: '回复生命'
                },
                desc: `回复 ${heal} 点生命`,
                icon: '💚'
            };
        } else if (rand < 0.7) {
            // 普通攻击
            this.nextAction = {
                type: 'attack',
                value: this.baseAtk,
                desc: `撞击！造成 ${this.baseAtk} 点伤害`,
                icon: '⚔',
                vfx: 'melee'
            };
        } else {
            // 重击
            const dmg = Math.floor(this.baseAtk * 1.5);
            this.nextAction = {
                type: 'attack',
                value: dmg,
                desc: `蓄力撞击！造成 ${dmg} 点伤害`,
                icon: '🔨',
                vfx: 'melee'
            };
        }
    }
    
    executeAction(target) {
        // 覆盖执行以处理特殊的回血逻辑
        if (this.nextAction.type === 'buff' && this.nextAction.buff.stat === 'hp_regen') {
            this.hp = Math.min(this.maxHp, this.hp + this.nextAction.value);
            Logger.log(`${this.name} 回复了 ${this.nextAction.value} 点生命`);
            return { damage: 0 };
        }
        return super.executeAction(target);
    }
}

// 2. 地精萨满 - 施加Debuff
class GoblinShaman extends Enemy {
    constructor() {
        super('goblin_shaman', '地精萨满', { hp: 200, speed: 90, baseAtk: 12, def: 2 });
        this.icon = '👺';
    }

    planNextAction() {
        // 循环：攻击 -> 攻击 -> 虚弱诅咒
        const turnInCycle = this.actionHistory.length % 3;
        
        if (turnInCycle === 2) {
            this.nextAction = {
                type: 'debuff',
                value: 0,
                debuff: {
                    name: '虚弱诅咒',
                    type: 'debuff',
                    stat: 'speed', // 降低速度
                    value: -0.2, // -20%
                    duration: 2,
                    desc: '速度降低20%'
                },
                desc: '施加虚弱诅咒（速度降低20%）',
                icon: '💀'
            };
        } else {
            this.nextAction = {
                type: 'attack',
                value: this.baseAtk,
                desc: `火球术！造成 ${this.baseAtk} 点伤害`,
                icon: '🔥',
                vfx: 'ranged',
                vfxColor: '#ff6d00'
            };
        }
    }
}

// 3. 重甲甲虫 - 高防御，会强化防御
class ArmoredBeetle extends Enemy {
    constructor() {
        super('armored_beetle', '重甲甲虫', { hp: 200, speed: 60, baseAtk: 18, def: 5 });
        this.icon = '🪲';
        this.isCharging = false;
    }

    planNextAction() {
        // 蓄力 -> 重击 的两段式行动
        if (!this.isCharging) {
            this.isCharging = true;
            this.nextAction = {
                type: 'charge',
                value: 0,
                desc: '正在蓄力！可被能量技打断',
                icon: '⚠'
            };
        } else {
            const dmg = Math.floor(this.baseAtk * 2.2);
            this.nextAction = {
                type: 'attack',
                value: dmg,
                hits: 1,
                desc: `蓄力重击！造成 ${dmg} 点伤害`,
                icon: '🔨',
                vfx: 'melee'
            };
        }
    }

    interrupt() {
        this.isCharging = false;
        this.nextAction = {
            type: 'stun',
            value: 0,
            desc: '蓄力被打断，陷入眩晕！',
            icon: '💫'
        };
    }

    executeAction(target) {
        if (this.nextAction.type === 'charge') {
            Logger.log(`${this.name} 正在蓄力...`);
            return { damage: 0 };
        }
        if (this.nextAction.type === 'stun') {
            Logger.log(`${this.name} 眩晕中，无法行动！`);
            return { damage: 0 };
        }
        if (this.nextAction.type === 'attack') {
            this.isCharging = false;
        }
        return super.executeAction(target);
    }
}

// 4. 晶石守护者 - 自我护盾
class CrystalGuardian extends Enemy {
    constructor() {
        super('crystal_guardian', '晶石守护者', { hp: 300, speed: 55, baseAtk: 14, def: 5 });
        this.icon = '💎';
    }

    planNextAction() {
        if (Math.random() < 0.4) {
            this.nextAction = {
                type: 'buff',
                value: 40,
                buff: { name: '晶石护盾', type: 'shield', value: 40, duration: 2 },
                desc: '生成40点护盾',
                icon: '🛡'
            };
        } else {
            this.nextAction = {
                type: 'attack',
                value: this.baseAtk,
                desc: `晶刃斩击！造成 ${this.baseAtk} 点伤害`,
                icon: '⚔',
                vfx: 'melee'
            };
        }
    }
}

// 5. 剧毒蛇 - 叠加 DOT
class VenomSnake extends Enemy {
    constructor() {
        super('venom_snake', '剧毒蛇', { hp: 160, speed: 95, baseAtk: 12, def: 2 });
        this.icon = '🐍';
    }

    planNextAction() {
        const dmg = Math.floor(this.baseAtk * 0.7);
        this.nextAction = {
            type: 'attack',
            value: dmg,
            debuff: {
                name: '剧毒',
                type: 'dot',
                value: 4,
                duration: 3,
                stackable: true
            },
            desc: `毒牙撕咬！造成 ${dmg} 点伤害并叠加剧毒`,
            icon: '🐍',
            vfx: 'melee'
        };
    }
}

// 6. 诅咒祭司 - 降低攻击
class CursePriest extends Enemy {
    constructor() {
        super('curse_priest', '诅咒祭司', { hp: 220, speed: 80, baseAtk: 10, def: 3 });
        this.icon = '🧙';
    }

    planNextAction() {
        const turnInCycle = this.actionHistory.length % 3;
        if (turnInCycle === 2) {
            this.nextAction = {
                type: 'debuff',
                value: 0,
                debuff: {
                    name: '衰弱诅咒',
                    type: 'debuff',
                    stat: 'atk',
                    value: -0.2,
                    duration: 2,
                    desc: '攻击降低20%'
                },
                desc: '施加衰弱诅咒（攻击降低20%）',
                icon: '🧿'
            };
        } else {
            this.nextAction = {
                type: 'attack',
                value: this.baseAtk,
                desc: `暗影弹！造成 ${this.baseAtk} 点伤害`,
                icon: '🕳',
                vfx: 'ranged',
                vfxColor: '#7c4dff'
            };
        }
    }
}

// 7. 狂暴战兽 - 永久叠加 Buff + 多段攻击
class RageBeast extends Enemy {
    constructor() {
        super('rage_beast', '狂暴战兽', { hp: 260, speed: 85, baseAtk: 11, def: 3 });
        this.icon = '🐗';
        this.rageStacks = 0;
    }

    planNextAction() {
        const hits = 2 + Math.min(3, Math.floor(this.rageStacks / 2));
        this.nextAction = {
            type: 'attack',
            value: this.baseAtk,
            hits,
            desc: `狂怒连击 (${hits}连击)`,
            icon: '🐺',
            vfx: 'melee'
        };
    }

    executeAction(target) {
        this.addBuff({
            name: '狂怒',
            type: 'buff',
            stat: 'atk',
            value: 0.08,
            duration: -1,
            stackable: true
        });
        this.rageStacks++;
        return super.executeAction(target);
    }
}

// 8. 疾行斥候 - 自我加速
class SwiftScout extends Enemy {
    constructor() {
        super('swift_scout', '疾行斥候', { hp: 180, speed: 110, baseAtk: 9, def: 2 });
        this.icon = '🏹';
    }

    planNextAction() {
        if (Math.random() < 0.4) {
            this.nextAction = {
                type: 'buff',
                value: 0.3,
                buff: {
                    name: '疾行',
                    type: 'buff',
                    stat: 'speed',
                    value: 0.3,
                    duration: 2
                },
                desc: '速度提升30%（持续2回合）',
                icon: '💨'
            };
        } else {
            this.nextAction = {
                type: 'attack',
                value: this.baseAtk,
                desc: `穿刺攻击！造成 ${this.baseAtk} 点伤害`,
                icon: '🏹',
                vfx: 'ranged',
                vfxColor: '#80cbc4'
            };
        }
    }
}

// ==================== 精英敌人 ====================

// 9. 影刃刺客 - 精英：可隐身后重击
class ShadowBlade extends Enemy {
    constructor() {
        super('shadow_blade', '影刃刺客', { hp: 280, speed: 120, baseAtk: 16, def: 3 });
        this.icon = '🗡️';
        this.isVanished = false;
        this.turnsSinceVanish = 0;
    }

    planNextAction() {
        const turn = this.actionHistory.length;

        // 每 3 回合隐身一次
        if (turn > 0 && turn % 3 === 2 && !this.isVanished) {
            this.nextAction = {
                type: 'buff',
                value: 0,
                buff: { name: '隐身', type: 'buff', stat: 'speed', value: 0.5, duration: 1 },
                desc: '消失在暗影中...下次攻击伤害翻倍！',
                icon: '🌑'
            };
            this.isVanished = true;
            return;
        }

        if (this.isVanished) {
            // 隐身后重击
            const dmg = Math.floor(this.baseAtk * 2.5);
            this.nextAction = {
                type: 'attack',
                value: dmg,
                desc: `暗影突袭！造成 ${dmg} 点伤害`,
                icon: '⚔',
                vfx: 'melee'
            };
            this.isVanished = false;
            return;
        }

        // 普通攻击（双刀）
        const dmg = Math.floor(this.baseAtk * 0.7);
        this.nextAction = {
            type: 'attack',
            value: dmg,
            hits: 2,
            desc: `双刃斩击（${dmg}×2）`,
            icon: '🗡️',
            vfx: 'melee'
        };
    }
}

// 10. 元素魔导师 - 精英：循环元素攻击
class ElementalMage extends Enemy {
    constructor() {
        super('elemental_mage', '元素魔导师', { hp: 300, speed: 85, baseAtk: 14, def: 4 });
        this.icon = '🔮';
        this.elementCycle = ['fire', 'ice', 'lightning'];
        this.currentElement = 0;
    }

    planNextAction() {
        const element = this.elementCycle[this.currentElement % 3];
        this.currentElement++;

        switch (element) {
            case 'fire': {
                const dmg = Math.floor(this.baseAtk * 1.2);
                this.nextAction = {
                    type: 'attack',
                    value: dmg,
                    debuff: {
                        name: '燃烧',
                        type: 'dot',
                        value: 5,
                        duration: 2,
                        stackable: true
                    },
                    desc: `烈焰弹！造成 ${dmg} 伤害并附加燃烧`,
                    icon: '🔥',
                    vfx: 'ranged',
                    vfxColor: '#ff6d00'
                };
                break;
            }
            case 'ice': {
                const dmg = Math.floor(this.baseAtk * 1.0);
                this.nextAction = {
                    type: 'attack',
                    value: dmg,
                    debuff: {
                        name: '冰霜减速',
                        type: 'debuff',
                        stat: 'speed',
                        value: -0.25,
                        duration: 2,
                        desc: '速度降低25%'
                    },
                    desc: `冰锥术！造成 ${dmg} 伤害并减速`,
                    icon: '❄️',
                    vfx: 'ranged',
                    vfxColor: '#64b5f6'
                };
                break;
            }
            case 'lightning': {
                const dmg = Math.floor(this.baseAtk * 0.6);
                this.nextAction = {
                    type: 'attack',
                    value: dmg,
                    hits: 3,
                    desc: `连锁闪电（${dmg}×3）`,
                    icon: '⚡',
                    vfx: 'ranged',
                    vfxColor: '#ffd54f'
                };
                break;
            }
        }
    }
}

// 11. 噬魂祭司 - 精英：攻击吸取玩家资源 + 可打断的蓄力吸取
class SoulDevourer extends Enemy {
    constructor() {
        super('soul_devourer', '噬魂祭司', { hp: 260, speed: 95, baseAtk: 13, def: 2 });
        this.icon = '👁️';
    }

    planNextAction() {
        const turn = this.actionHistory.length;
        const cycle = turn % 4;

        if (cycle <= 1) {
            const dmg = Math.floor(this.baseAtk * 0.9);
            this.nextAction = {
                type: 'attack',
                value: dmg,
                desc: `噬魂弹！造成 ${dmg} 伤害并吸取1点资源`,
                icon: '👁️',
                vfx: 'ranged',
                vfxColor: '#ce93d8',
                drainResource: 1
            };
        } else if (cycle === 2) {
            this.nextAction = {
                type: 'attack',
                value: this.baseAtk,
                desc: `暗影抓取！造成 ${this.baseAtk} 伤害`,
                icon: '🖐️',
                vfx: 'melee'
            };
        } else {
            this.isCharging = true;
            this.nextAction = {
                type: 'charge',
                value: 0,
                desc: '聚集噬魂之力...将吸取大量资源！（可被能量技打断）',
                icon: '⚠'
            };
        }
    }

    interrupt() {
        this.isCharging = false;
        this.nextAction = {
            type: 'stun',
            value: 0,
            desc: '噬魂被打断，陷入虚弱！',
            icon: '💫'
        };
    }

    _drainPlayerResource(target, amount) {
        if (!target || !target.resources) return;
        if (
            typeof hasInfiniteResources === 'function' &&
            hasInfiniteResources() &&
            typeof GameState !== 'undefined' &&
            target === GameState.player
        ) {
            return;
        }
        const key = typeof getPrimaryResourceKey === 'function' ? getPrimaryResourceKey(target) : null;
        if (!key) return;
        const res = target.resources[key];
        if (!res) return;
        const min = res.min !== undefined ? res.min : 0;
        const before = res.val;
        if (key === 'balance') {
            if (res.val > 0) res.val = Math.max(min, res.val - amount);
            else if (res.val < 0) res.val = Math.min(res.max || 5, res.val + amount);
        } else {
            res.val = Math.max(min, res.val - amount);
        }
        const drained = Math.abs(before - res.val);
        if (drained > 0) {
            Logger.log(`噬魂祭司吸取了 ${drained} 点${res.name}！`, true);
            if (typeof updateResourceUI === 'function') updateResourceUI();
        }
    }

    executeAction(target) {
        if (this.nextAction.type === 'charge') {
            Logger.log(`${this.name} 正在聚集噬魂之力...`);
            return { damage: 0 };
        }
        if (this.nextAction.type === 'stun') {
            Logger.log(`${this.name} 虚弱中，无法行动！`);
            this.isCharging = false;
            return { damage: 0 };
        }

        if (this.isCharging) {
            this.isCharging = false;
            const dmg = Math.floor(this.baseAtk * 2.0);
            this._drainPlayerResource(target, 3);
            target.takeDamage(dmg);
            Logger.log(`噬魂爆发！造成 ${dmg} 伤害并吸取3点资源！`);
            this.actionHistory.push('attack');
            return { damage: dmg };
        }

        if (this.nextAction.drainResource) {
            this._drainPlayerResource(target, this.nextAction.drainResource);
        }
        return super.executeAction(target);
    }
}

// 12. 铁壁守卫 - 精英：超高防御 + 周期性弱点暴露
class IronBulwark extends Enemy {
    constructor() {
        super('iron_bulwark', '铁壁守卫', { hp: 380, speed: 55, baseAtk: 12, def: 8 });
        this.icon = '🏰';
        this.isExposed = false;
        this.savedDef = 8;
    }

    planNextAction() {
        const turn = this.actionHistory.length;
        const cycle = turn % 5;

        if (cycle === 0) {
            this.nextAction = {
                type: 'attack',
                value: this.baseAtk,
                desc: `铁锤猛击！造成 ${this.baseAtk} 伤害`,
                icon: '🔨',
                vfx: 'melee'
            };
        } else if (cycle === 1) {
            this.nextAction = {
                type: 'buff',
                value: 4,
                buff: {
                    name: '铁壁强化',
                    type: 'buff',
                    stat: 'def',
                    value: 4,
                    duration: 2,
                    desc: '防御力+4'
                },
                desc: '铁壁强化！防御大幅提升',
                icon: '🛡'
            };
        } else if (cycle === 2) {
            const dmg = Math.floor(this.baseAtk * 1.5);
            this.nextAction = {
                type: 'attack',
                value: dmg,
                desc: `重锤砸击！造成 ${dmg} 伤害`,
                icon: '💥',
                vfx: 'melee'
            };
        } else if (cycle === 3) {
            this.isExposed = true;
            this.savedDef = this.def;
            this.nextAction = {
                type: 'buff',
                value: 0,
                buff: {
                    name: '弱点暴露',
                    type: 'debuff',
                    stat: 'def',
                    value: -this.def,
                    duration: 1,
                    desc: '防御归零'
                },
                desc: '装甲出现裂缝...弱点暴露！',
                icon: '💔'
            };
        } else {
            this.nextAction = {
                type: 'attack',
                value: this.baseAtk,
                desc: `铁锤猛击！造成 ${this.baseAtk} 伤害`,
                icon: '🔨',
                vfx: 'melee'
            };
        }
    }

    executeAction(target) {
        const result = super.executeAction(target);
        if (this.isExposed) {
            this.isExposed = false;
        }
        return result;
    }
}

// ==================== BOSS ====================

// 11. 远古守护者 - Boss：多阶段
class AncientGuardian extends Enemy {
    constructor() {
        super('ancient_guardian', '远古守护者', { hp: 500, speed: 75, baseAtk: 18, def: 6 });
        this.icon = '🗿';
        this.phase = 1; // 1 = 普通, 2 = 狂暴
        this.turnCounter = 0;
        this.enraged = false;
    }

    planNextAction() {
        this.turnCounter++;

        // 阶段切换：HP ≤ 50% → 阶段2
        if (this.hp <= this.maxHp * 0.5 && !this.enraged) {
            this.enraged = true;
            this.phase = 2;
            this.baseAtk = Math.floor(this.baseAtk * 1.4);
            Logger.log(`${this.name} 进入狂暴状态！攻击力大幅提升！`, true);
        }

        // 每 4 回合蓄力重击
        if (this.turnCounter % 4 === 0) {
            if (!this.isCharging) {
                this.isCharging = true;
                this.nextAction = {
                    type: 'charge',
                    value: 0,
                    desc: '聚集远古之力...下次释放毁灭打击！（可被能量技打断）',
                    icon: '⚠'
                };
                return;
            }
        }

        if (this.isCharging) {
            const dmg = Math.floor(this.baseAtk * 3.0);
            this.isCharging = false;
            this.nextAction = {
                type: 'attack',
                value: dmg,
                desc: `远古毁灭！造成 ${dmg} 点伤害`,
                icon: '💥',
                vfx: 'melee'
            };
            return;
        }

        if (this.phase === 2) {
            // 阶段2：多段攻击 + 偶尔护盾
            const rand = Math.random();
            if (rand < 0.3) {
                const shieldVal = Math.floor(this.maxHp * 0.1);
                this.nextAction = {
                    type: 'buff',
                    value: shieldVal,
                    buff: { name: '石甲', type: 'shield', value: shieldVal },
                    desc: `生成 ${shieldVal} 点石甲护盾`,
                    icon: '🛡'
                };
            } else {
                const dmg = Math.floor(this.baseAtk * 0.8);
                this.nextAction = {
                    type: 'attack',
                    value: dmg,
                    hits: 2,
                    desc: `双拳重击（${dmg}×2）`,
                    icon: '👊',
                    vfx: 'melee'
                };
            }
        } else {
            // 阶段1：普通攻击/防御
            const rand = Math.random();
            if (rand < 0.3) {
                const shieldVal = Math.floor(this.maxHp * 0.08);
                this.nextAction = {
                    type: 'buff',
                    value: shieldVal,
                    buff: { name: '石甲', type: 'shield', value: shieldVal },
                    desc: `生成 ${shieldVal} 点石甲护盾`,
                    icon: '🛡'
                };
            } else {
                this.nextAction = {
                    type: 'attack',
                    value: this.baseAtk,
                    desc: `巨拳猛击！造成 ${this.baseAtk} 点伤害`,
                    icon: '👊',
                    vfx: 'melee'
                };
            }
        }
    }

    interrupt() {
        this.isCharging = false;
        this.nextAction = {
            type: 'stun',
            value: 0,
            desc: '蓄力被打断，陷入眩晕！',
            icon: '💫'
        };
    }

    executeAction(target) {
        if (this.nextAction && this.nextAction.type === 'charge') {
            Logger.log(`${this.name} 正在聚集远古之力...`);
            return { damage: 0 };
        }
        if (this.nextAction && this.nextAction.type === 'stun') {
            Logger.log(`${this.name} 眩晕中，无法行动！`);
            return { damage: 0 };
        }
        return super.executeAction(target);
    }
}

// 13. 虚空织者 - Boss：速度操控 + 双阶段
class VoidWeaver extends Enemy {
    constructor() {
        super('void_weaver', '虚空织者', { hp: 600, speed: 90, baseAtk: 16, def: 4 });
        this.icon = '🕸️';
        this.phase = 1;
        this.enraged = false;
        this.turnCounter = 0;
    }

    planNextAction() {
        this.turnCounter++;

        if (this.hp <= this.maxHp * 0.5 && !this.enraged) {
            this.enraged = true;
            this.phase = 2;
            this.baseSpeed += 30;
            this.speed += 30;
            this.baseAtk = Math.floor(this.baseAtk * 1.3);
            Logger.log(`${this.name} 的虚空之力觉醒！速度和攻击大幅提升！`, true);
        }

        if (this.phase === 1) {
            this._planPhase1();
        } else {
            this._planPhase2();
        }
    }

    _planPhase1() {
        const cycle = (this.turnCounter - 1) % 3;

        if (cycle === 0) {
            const dmg = Math.floor(this.baseAtk * 1.0);
            this.nextAction = {
                type: 'attack',
                value: dmg,
                debuff: {
                    name: '虚空侵蚀',
                    type: 'dot',
                    value: 3,
                    duration: 2,
                    stackable: true
                },
                desc: `虚空弹！造成 ${dmg} 伤害并附加虚空侵蚀`,
                icon: '🌀',
                vfx: 'ranged',
                vfxColor: '#b388ff'
            };
        } else if (cycle === 1) {
            const dmg = Math.floor(this.baseAtk * 0.8);
            this.nextAction = {
                type: 'attack',
                value: dmg,
                debuff: {
                    name: '时间扭曲',
                    type: 'debuff',
                    stat: 'speed',
                    value: -0.15,
                    duration: 2,
                    desc: '速度降低15%'
                },
                desc: `时间裂隙！造成 ${dmg} 伤害并扭曲时间`,
                icon: '⏳',
                vfx: 'ranged',
                vfxColor: '#7c4dff'
            };
        } else {
            this.nextAction = {
                type: 'buff',
                value: 0,
                buff: {
                    name: '虚空加速',
                    type: 'buff',
                    stat: 'speed',
                    value: 0.3,
                    duration: 2,
                    desc: '速度提升30%'
                },
                desc: '扭曲时空...速度大幅提升！',
                icon: '⚡'
            };
        }
    }

    _planPhase2() {
        const cycle = (this.turnCounter - 1) % 4;

        if (cycle === 0) {
            const dmg = Math.floor(this.baseAtk * 0.7);
            this.nextAction = {
                type: 'attack',
                value: dmg,
                hits: 2,
                desc: `虚空风暴（${dmg}×2）`,
                icon: '🌪️',
                vfx: 'ranged',
                vfxColor: '#b388ff'
            };
        } else if (cycle === 1) {
            const shieldVal = Math.floor(this.maxHp * 0.1);
            this.nextAction = {
                type: 'buff',
                value: shieldVal,
                buff: { name: '虚空护盾', type: 'shield', value: shieldVal },
                desc: `编织虚空护盾（${shieldVal}点）`,
                icon: '🛡'
            };
        } else if (cycle === 2) {
            this.isCharging = true;
            this.nextAction = {
                type: 'charge',
                value: 0,
                desc: '凝聚虚空之力...准备释放湮灭！（可被能量技打断）',
                icon: '⚠'
            };
        } else {
            if (this.isCharging) {
                const dmg = Math.floor(this.baseAtk * 2.8);
                this.isCharging = false;
                this.nextAction = {
                    type: 'attack',
                    value: dmg,
                    debuff: {
                        name: '虚空侵蚀',
                        type: 'dot',
                        value: 5,
                        duration: 2,
                        stackable: true
                    },
                    desc: `虚空湮灭！造成 ${dmg} 伤害并附加强力侵蚀`,
                    icon: '💥',
                    vfx: 'ranged',
                    vfxColor: '#6200ea'
                };
            } else {
                const dmg = Math.floor(this.baseAtk * 1.2);
                this.nextAction = {
                    type: 'attack',
                    value: dmg,
                    desc: `虚空冲击！造成 ${dmg} 伤害`,
                    icon: '🌀',
                    vfx: 'ranged',
                    vfxColor: '#b388ff'
                };
            }
        }
    }

    interrupt() {
        this.isCharging = false;
        this.nextAction = {
            type: 'stun',
            value: 0,
            desc: '虚空之力被打断，陷入失衡！',
            icon: '💫'
        };
    }

    executeAction(target) {
        if (this.nextAction && this.nextAction.type === 'charge') {
            Logger.log(`${this.name} 正在凝聚虚空之力...`);
            return { damage: 0 };
        }
        if (this.nextAction && this.nextAction.type === 'stun') {
            Logger.log(`${this.name} 失衡中，无法行动！`);
            this.isCharging = false;
            return { damage: 0 };
        }
        return super.executeAction(target);
    }
}

// ==================== 敌人创建工厂 ====================

// 普通敌人池
const NormalEnemyPool = ['slime', 'goblin', 'beetle', 'crystal', 'snake', 'curse', 'rage', 'scout'];
// 精英敌人池
const EliteEnemyPool = ['shadow_blade', 'elemental_mage', 'soul_devourer', 'iron_bulwark'];
// Boss 池
const BossPool = ['ancient_guardian', 'void_weaver'];

function createTestEnemy(type = 'random') {
    // 根据 RunManager 节点类型选择敌人池
    let pool = NormalEnemyPool;
    if (typeof RunManager !== 'undefined' && RunManager.getCurrentNode()) {
        const node = RunManager.getCurrentNode();
        if (node.type === 'elite') pool = EliteEnemyPool;
        else if (node.type === 'boss') pool = BossPool;
    }

    if (type === 'random') {
        type = pool[Math.floor(Math.random() * pool.length)];
    }

    let enemy;
    switch(type) {
        case 'slime': enemy = new Slime(); break;
        case 'goblin': enemy = new GoblinShaman(); break;
        case 'beetle': enemy = new ArmoredBeetle(); break;
        case 'crystal': enemy = new CrystalGuardian(); break;
        case 'snake': enemy = new VenomSnake(); break;
        case 'curse': enemy = new CursePriest(); break;
        case 'rage': enemy = new RageBeast(); break;
        case 'scout': enemy = new SwiftScout(); break;
        case 'shadow_blade': enemy = new ShadowBlade(); break;
        case 'elemental_mage': enemy = new ElementalMage(); break;
        case 'ancient_guardian': enemy = new AncientGuardian(); break;
        case 'soul_devourer': enemy = new SoulDevourer(); break;
        case 'iron_bulwark': enemy = new IronBulwark(); break;
        case 'void_weaver': enemy = new VoidWeaver(); break;
        default: enemy = new Slime();
    }
    
    // 初始规划意图
    enemy.planNextAction();
    return enemy;
}
