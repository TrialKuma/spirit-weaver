// ==================== 技能与强化基础模块 ====================

class SkillModifier {
    constructor({ type, value, source = null, tags = null, skillId = null, condition = null } = {}) {
        this.type = type; // 'mult' | 'add'
        this.value = value;
        this.source = source;
        this.tags = tags;
        this.skillId = skillId;
        this.condition = condition; // (ctx) => bool — 可选条件函数
    }

    appliesTo(skill, context) {
        if (this.skillId && this.skillId !== skill.id) return false;
        if (this.tags && skill.tags) {
            if (!this.tags.some(tag => skill.tags.includes(tag))) return false;
        }
        if (this.condition && context) {
            try { if (!this.condition(context)) return false; } catch(e) { return false; }
        }
        return true;
    }
}

function applyDamageModifiers(baseDamage, modifiers = [], context = {}) {
    let damage = baseDamage;
    modifiers.forEach(mod => {
        if (mod.condition && context) {
            try { if (!mod.condition(context)) return; } catch(e) { return; }
        }
        if (mod.type === 'mult') {
            damage *= mod.value;
        } else if (mod.type === 'add') {
            damage += mod.value;
        }
    });
    return damage;
}

function createSkill(config = {}) {
    const skill = {
        modifiers: [],
        calculatedDamage: undefined,
        _morphs: {},
        ...config
    };

    if (!Array.isArray(skill.tags)) {
        skill.tags = [];
    }
    const typeTagMap = {
        attack: 'Attack',
        special: 'Special',
        Ultimate: 'Ultimate'
    };
    if (skill.type && typeTagMap[skill.type] && !skill.tags.includes(typeTagMap[skill.type])) {
        skill.tags.push(typeTagMap[skill.type]);
    }

    skill.addModifier = (modifier) => {
        if (modifier) skill.modifiers.push(modifier);
    };

    skill.clearCalculatedDamage = () => {
        skill.calculatedDamage = undefined;
    };

    skill.getBaseDamage = (owner) => {
        if (skill.calculatedDamage !== undefined) return skill.calculatedDamage;
        if (skill.useRawDamage || skill.baseMultiplier === undefined) {
            return skill.damage || 0;
        }
        if (owner && skill.baseMultiplier !== undefined) {
            const atk = owner.getBuffedAtk ? owner.getBuffedAtk() : owner.baseAtk;
            return atk * skill.baseMultiplier;
        }
        return skill.damage || 0;
    };

    skill.getDamage = (owner, context = {}) => {
        const baseDamage = skill.getBaseDamage(owner);
        const ownerMods = owner && owner.getDamageModifiers ? owner.getDamageModifiers(skill, context) : [];
        const skillMods = skill.modifiers.filter(mod => mod.appliesTo(skill, context));
        return applyDamageModifiers(baseDamage, [...ownerMods, ...skillMods], context);
    };

    // 锤子变体：覆写技能属性
    skill.applyHammer = (hammerConfig) => {
        if (!hammerConfig || !hammerConfig.morph) return;
        skill._activeHammer = hammerConfig;
        const morph = hammerConfig.morph;
        if (morph.name) skill.name = morph.name;
        if (morph.desc) skill.desc = morph.desc;
        if (morph.baseMultiplier !== undefined) skill.baseMultiplier = morph.baseMultiplier;
        if (morph.hits !== undefined) skill.hits = morph.hits;
        if (morph.cost !== undefined) skill.cost = { ...skill.cost, ...morph.cost };
        if (morph.tags) skill.tags = [...new Set([...skill.tags, ...morph.tags])];
        if (morph.onHit) skill.onHit = morph.onHit;
        if (morph.extra) Object.assign(skill, morph.extra);
    };

    return skill;
}

// 锤子配置表（按职业 → 技能 → 锤子列表）
const HammerConfig = {
    qi: {
        light_strike: [
            {
                id: 'qi_hammer_chain_fist',
                name: '连环拳',
                icon: '👊',
                desc: '轻击变3段（每段40%），每段叠1层内伤',
                targetSkill: 'light_strike',
                morph: {
                    name: '连环拳',
                    desc: '3段攻击（每段40%攻击力），每段命中叠1层内伤',
                    baseMultiplier: 0.4,
                    hits: 3,
                    extra: { stacksInjuryPerHit: 1 }
                }
            },
            {
                id: 'qi_hammer_qi_palm',
                name: '回气掌',
                icon: '🌀',
                desc: '轻击命中后回复1气',
                targetSkill: 'light_strike',
                morph: {
                    name: '回气掌',
                    desc: '造成100%攻击力伤害，命中后回复1气',
                    extra: { qiRecoveryOnHit: 1 }
                }
            }
        ],
        rapid_strike: [
            {
                id: 'qi_hammer_wound_strike',
                name: '裂伤击',
                icon: '🩸',
                desc: '迅击额外叠2层内伤，内伤目标额外+50%伤害',
                targetSkill: 'rapid_strike',
                morph: {
                    name: '裂伤击',
                    desc: '消耗2气，造成200%攻击力伤害。额外叠2层内伤，内伤目标+50%伤害',
                    extra: { stacksInjury: 2, injuryBonusMult: 1.5 }
                }
            },
            {
                id: 'qi_hammer_twin_rapid',
                name: '双迅',
                icon: '⚡',
                desc: '迅击变为打2次（每次150%），消耗3气',
                targetSkill: 'rapid_strike',
                morph: {
                    name: '双迅',
                    desc: '消耗3气，打2次（每次150%攻击力伤害）',
                    baseMultiplier: 1.5,
                    hits: 2,
                    cost: { qi: 3 }
                }
            },
            {
                id: 'qi_hammer_swift_shadow',
                name: '迅影',
                icon: '💨',
                desc: '迅击消耗改为0气，倍率降到100%，推进自身行动条20%',
                targetSkill: 'rapid_strike',
                morph: {
                    name: '迅影',
                    desc: '不消耗气，造成100%攻击力伤害，推进自身行动条20%',
                    baseMultiplier: 1.0,
                    cost: { qi: 0 },
                    extra: { avAdvance: 0.2 }
                }
            }
        ],
        devastate: [
            {
                id: 'qi_hammer_injury_detonate',
                name: '内伤引爆',
                icon: '💥',
                desc: '崩山引爆目标所有内伤层，每层+60%基础攻击力额外伤害',
                targetSkill: 'devastate',
                morph: {
                    name: '引爆·崩山',
                    desc: '消耗6气，造成350%攻击力伤害。引爆目标所有内伤层，每层+60%攻额外伤害',
                    baseMultiplier: 3.5,
                    cost: { qi: 6 },
                    extra: { detonateInjury: true, detonateMultPerStack: 0.6 }
                }
            },
            {
                id: 'qi_hammer_charged_devastate',
                name: '蓄力崩山',
                icon: '🔥',
                desc: '崩山可消耗所有气（≥6），每多1气+50%倍率，满气=850%',
                targetSkill: 'devastate',
                morph: {
                    name: '蓄力·崩山',
                    desc: '消耗所有气（至少6），基础350%，每多1气+50%倍率。满气=850%',
                    baseMultiplier: 3.5,
                    cost: { qi: 6 },
                    extra: { consumeAllQi: true, extraQiMultPerPoint: 0.5 }
                }
            },
            {
                id: 'qi_hammer_mountain_chain',
                name: '碎山连',
                icon: '⛰️',
                desc: '崩山消耗降到4气，倍率降到200%，可连续使用',
                targetSkill: 'devastate',
                morph: {
                    name: '碎山连',
                    desc: '消耗4气，造成200%攻击力伤害。低消耗快速循环',
                    baseMultiplier: 2.0,
                    cost: { qi: 4 }
                }
            }
        ]
    },
    combo: {
        quick_strike: [
            {
                id: 'combo_hammer_tempest',
                name: '风暴斩',
                icon: '🌪️',
                desc: '疾风变3段（每段30%），每段叠1层疾风',
                targetSkill: 'quick_strike',
                morph: {
                    name: '风暴斩',
                    desc: '3段攻击（每段30%），每段叠1层疾风',
                    baseMultiplier: 0.3,
                    hits: 3,
                    extra: { galePerHit: 1 }
                }
            },
            {
                id: 'combo_hammer_gale_burst',
                name: '疾风爆',
                icon: '💫',
                desc: '疾风变单段（120%），消耗全部疾风层，每层+15%伤害',
                targetSkill: 'quick_strike',
                morph: {
                    name: '疾风爆',
                    desc: '单段120%伤害，消耗全部疾风层，每层+15%伤害',
                    baseMultiplier: 1.2,
                    hits: 1,
                    extra: { consumeGale: true, galeMultPerStack: 0.15 }
                }
            }
        ],
        combo_strike: [
            {
                id: 'combo_hammer_blood_chain',
                name: '嗜血连斩',
                icon: '🩸',
                desc: '连斩每多打一段，下一段倍率+20%（递增）',
                targetSkill: 'combo_strike',
                morph: {
                    name: '嗜血连斩',
                    desc: '50%×N，每多一段+20%倍率递增（50→70→90...）',
                    extra: { escalatingDamage: true, escalateBonus: 0.2 }
                }
            },
            {
                id: 'combo_hammer_endless',
                name: '无尽连斩',
                icon: '♾️',
                desc: '连斩取消5次上限，追加概率改为50%但每次递减5%',
                targetSkill: 'combo_strike',
                morph: {
                    name: '无尽连斩',
                    desc: '无上限追加！初始50%概率，每次递减5%（50→45→40...）',
                    extra: { endlessChain: true, baseChance: 0.5, decayPerHit: 0.05 }
                }
            }
        ],
        finisher: [
            {
                id: 'combo_hammer_flash',
                name: '一闪',
                icon: '⚔️',
                desc: '消耗10连击时变为"一闪"：无视防御+50%暴击(x2.5)',
                targetSkill: 'finisher',
                morph: {
                    name: '一闪',
                    desc: '消耗10连击，无视防御+50%暴击(x2.5倍)。攒满才能一击必杀',
                    extra: { flashStrike: true, flashCritChance: 0.5, flashCritMult: 2.5 }
                }
            },
            {
                id: 'combo_hammer_aftermath',
                name: '终结余波',
                icon: '💫',
                desc: '终结技击杀后保留50%连击点（向下取整）',
                targetSkill: 'finisher',
                morph: {
                    name: '余波·终结技',
                    desc: '消耗6连击造成缩放伤害。击杀后保留50%连击点',
                    extra: { retainComboOnKill: true, retainRatio: 0.5 }
                }
            }
        ]
    },
    mana: {
        shoot: [
            {
                id: 'mana_hammer_scatter',
                name: '散射',
                icon: '🔫',
                desc: '强化射击变3段（每段130%），消耗2弹药',
                targetSkill: 'shoot',
                morph: {
                    name: '散射',
                    desc: '消耗2弹药，3段攻击（每段130%攻击力）',
                    extra: { scatterShot: true, scatterHits: 3, scatterMult: 1.3, scatterAmmoCost: 2 }
                }
            },
            {
                id: 'mana_hammer_charge_shot',
                name: '蓄力射击',
                icon: '🎯',
                desc: '强化射击倍率提升到500%，消耗2弹药',
                targetSkill: 'shoot',
                morph: {
                    name: '蓄力射击',
                    desc: '消耗2弹药，造成500%攻击力伤害（单发高伤）',
                    extra: { chargeShot: true, chargeMult: 5.0, chargeAmmoCost: 2 }
                }
            },
            {
                id: 'mana_hammer_rapid_fire',
                name: '连射',
                icon: '🔥',
                desc: '强化射击后30%概率不消耗弹药再射一次（最多连射2次）',
                targetSkill: 'shoot',
                morph: {
                    name: '连射',
                    desc: '消耗1弹药，360%伤害。30%概率免费再射（最多连射2次）',
                    extra: { rapidFire: true, rapidChance: 0.3, rapidMaxExtra: 2 }
                }
            }
        ],
        burst: [
            {
                id: 'mana_hammer_overload_adapt',
                name: '过载适应',
                icon: '⚡',
                desc: '过载爆射的减速debuff改为+20%暴击buff（1回合）',
                targetSkill: 'burst',
                morph: {
                    name: '过载·爆射',
                    desc: '无弹药时160%伤害，过载变为+20%暴击(1回合)',
                    extra: { overloadAdapt: true, overloadCritBuff: 0.2 }
                }
            },
            {
                id: 'mana_hammer_overflow_detonate',
                name: '满溢引爆',
                icon: '💣',
                desc: '盈能5层时爆射额外造成400%攻击力伤害并清零盈能',
                targetSkill: 'burst',
                morph: {
                    name: '满溢·爆射',
                    desc: '盈能满5层时，爆射额外造成400%攻击力伤害并清零盈能',
                    extra: { overflowDetonate: true, detonateMult: 4.0 }
                }
            }
        ],
        reload: [
            {
                id: 'mana_hammer_supercharge',
                name: '超载装填',
                icon: '🔋',
                desc: '装填时若魔力≥8，额外+2弹药（3→5）',
                targetSkill: 'reload',
                morph: {
                    name: '超载装填',
                    desc: '消耗6魔力装填。魔力≥8时额外+2弹药（共5发）',
                    extra: { superchargeReload: true, superchargeThreshold: 8, superchargeExtraAmmo: 2 }
                }
            },
            {
                id: 'mana_hammer_quick_reload',
                name: '快速装填',
                icon: '💨',
                desc: '装填消耗降到3魔力，弹药获取降到2发，推进行动条20%',
                targetSkill: 'reload',
                morph: {
                    name: '快速装填',
                    desc: '消耗3魔力，装填2发弹药，推进行动条20%',
                    extra: { quickReload: true, quickManaCost: 3, quickAmmoGain: 2, quickAvAdvance: 0.2 }
                }
            }
        ]
    },
    balance: {
        yang_strike: [
            {
                id: 'balance_hammer_solar_wave',
                name: '烈阳波',
                icon: '☀️',
                desc: '阳击变远程（130%），命中后获得每阳面点数10%最大HP的护盾',
                targetSkill: 'yang_strike',
                morph: {
                    name: '烈阳波',
                    desc: '远程130%伤害，平衡+3。命中后获得每阳面点数10%最大HP护盾',
                    tags: ['Ranged'],
                    extra: { solarShield: true, shieldPerPoint: 0.1 }
                }
            },
            {
                id: 'balance_hammer_double_yang',
                name: '双阳击',
                icon: '🌟',
                desc: '阳击变2段（每段70%），平衡变+2×2',
                targetSkill: 'yang_strike',
                morph: {
                    name: '双阳击',
                    desc: '2段攻击（每段70%），每段平衡+2',
                    baseMultiplier: 0.7,
                    hits: 2,
                    extra: { balancePerHit: 2 }
                }
            }
        ],
        yin_strike: [
            {
                id: 'balance_hammer_deep_erosion',
                name: '深蚀击',
                icon: '🌑',
                desc: '阴击侵蚀倍率翻倍（40%），持续2回合',
                targetSkill: 'yin_strike',
                morph: {
                    name: '深蚀击',
                    desc: '100%伤害，平衡-3。施加深度侵蚀（ATK×40%/回合，2回合）',
                    extra: { deepErosion: true, erosionMult: 0.4, erosionDuration: 2 }
                }
            },
            {
                id: 'balance_hammer_yin_slow',
                name: '阴极减速',
                icon: '❄️',
                desc: '阴击额外减缓目标行动条（10%×阴面绝对点数）',
                targetSkill: 'yin_strike',
                morph: {
                    name: '凝滞·阴击',
                    desc: '100%伤害，平衡-3。减缓目标行动条（10%×阴面点数）',
                    extra: { yinSlow: true, slowPerPoint: 0.1 }
                }
            }
        ],
        verdict: [
            {
                id: 'balance_hammer_samsara',
                name: '轮回',
                icon: '♻️',
                desc: '宣判后不进入CD，平衡立即推到反方向极值',
                targetSkill: 'verdict',
                morph: {
                    name: '轮回·宣判',
                    desc: '宣判后不CD，平衡推到反方向极值。可连续宣判但方向交替',
                    extra: { samsara: true }
                }
            },
            {
                id: 'balance_hammer_karma',
                name: '业力宣判',
                icon: '⚖️',
                desc: '所有侵蚀DOT计入"业力池"，宣判时额外造成业力池50%伤害',
                targetSkill: 'verdict',
                morph: {
                    name: '业力·宣判',
                    desc: '侵蚀DOT累计入业力池，宣判额外造成业力50%伤害并清空',
                    extra: { karmaVerdict: true, karmaRatio: 0.5 }
                }
            }
        ]
    }
};

// 获取某职业的可用锤子（排除已装备的技能）
function getAvailableHammers(classId) {
    const classHammers = HammerConfig[classId];
    if (!classHammers) return [];
    const equipped = GameState.hammers || {};
    const available = [];
    Object.keys(classHammers).forEach(skillId => {
        if (equipped[skillId]) return;
        classHammers[skillId].forEach(h => available.push(h));
    });
    return available;
}

// 随机抽取锤子选项（3选1）
function getRandomHammers(classId, count = 3) {
    const pool = getAvailableHammers(classId);
    if (pool.length === 0) return [];
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

// 应用锤子到玩家技能
function applyHammerToPlayer(hammerConfig) {
    if (!hammerConfig || !GameState.player) return;
    const skill = GameState.player.skills.find(s => s.id === hammerConfig.targetSkill);
    if (!skill) return;
    skill.applyHammer(hammerConfig);
    if (!GameState.hammers) GameState.hammers = {};
    GameState.hammers[hammerConfig.targetSkill] = hammerConfig;
    GameState.hammersChosen = (GameState.hammersChosen || 0) + 1;
    Logger.log(`获得锤子：${hammerConfig.name}（${skill.name}）`, true);

    if (typeof GameState.player.updateSkills === 'function') {
        GameState.player.updateSkills();
    }
    updateUI();
}
