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
        if (morph.type !== undefined) skill.type = morph.type;
        if (morph.baseMultiplier !== undefined) skill.baseMultiplier = morph.baseMultiplier;
        if (morph.hits !== undefined) skill.hits = morph.hits;
        if (morph.cost !== undefined) skill.cost = { ...skill.cost, ...morph.cost };
        if (morph.replaceTags) skill.tags = [...morph.replaceTags];
        else if (morph.tags) skill.tags = [...new Set([...skill.tags, ...morph.tags])];
        if (morph.onHit) skill.onHit = morph.onHit;
        if (morph.extra) Object.assign(skill, morph.extra);
    };

    return skill;
}

// 锤子配置表（按职业 → 技能 → 锤子列表）
const HammerConfig = {
    qi: {
        // 轻拳变体（替换型二选一，另有追加连拳通过升级解锁）
        light_punch: [
            {
                id: 'qi_hammer_heavy_fist',
                name: '重拳',
                icon: '👊',
                desc: '轻拳升级为重拳，倍率提升至150%',
                targetSkill: 'light_punch',
                morph: {
                    name: '重拳',
                    desc: '造成150%攻击力伤害',
                    baseMultiplier: 1.5
                }
            },
            {
                id: 'qi_hammer_qi_palm',
                name: '集气掌',
                icon: '🌀',
                desc: '轻拳命中后额外回复1气',
                targetSkill: 'light_punch',
                morph: {
                    name: '集气掌',
                    desc: '造成100%攻击力伤害，命中后回复1气',
                    extra: { qiOnHit: 1 }
                }
            }
        ],
        // 迅击变体（替换型三选一，无追加）
        rapid_strike: [
            {
                id: 'qi_hammer_tieshan',
                name: '铁山靠',
                icon: '⛰️',
                desc: '替换迅击：消耗4气，280%单发重击',
                targetSkill: 'rapid_strike',
                morph: {
                    name: '铁山靠',
                    desc: '造成280%攻击力伤害（重型单发）',
                    baseMultiplier: 2.8,
                    cost: { qi: 4 },
                    replaceTags: ['Heavy', 'Melee', 'Special']
                }
            },
            {
                id: 'qi_hammer_flash',
                name: '闪击',
                icon: '⚡',
                desc: '替换迅击：2气，200%，命中后可衔接所有已有追加技能',
                targetSkill: 'rapid_strike',
                morph: {
                    name: '闪击',
                    desc: '造成200%攻击力伤害。命中后可衔接所有已解锁的追加技能',
                    extra: { isFlash: true }
                }
            },
            {
                id: 'qi_hammer_rapid3',
                name: '迅连击',
                icon: '🌀',
                desc: '替换迅击：消耗4气，150%×3段，各自扣防',
                targetSkill: 'rapid_strike',
                morph: {
                    name: '迅连击',
                    desc: '3段×150%，各段独立扣防',
                    baseMultiplier: 1.5,
                    hits: 3,
                    cost: { qi: 4 }
                }
            }
        ],
        // 崩山变体（替换型二选一，另有追加震破通过升级解锁）
        devastate: [
            {
                id: 'qi_hammer_devastate_ex',
                name: '崩山·极',
                icon: '🔥',
                desc: '替换崩山：消耗8气起，倾泻所有剩余气息（每气+100%），满10气=750%',
                targetSkill: 'devastate',
                morph: {
                    name: '崩山·极',
                    desc: '550%基础+每多1气追加100%（满10气=750%）',
                    baseMultiplier: 5.5,
                    cost: { qi: 8 },
                    extra: { consumeAllQi: true, extraQiMultPerPoint: 1.0 }
                }
            },
            {
                id: 'qi_hammer_fist_dance',
                name: '拳舞',
                icon: '🌪️',
                desc: '替换崩山：消耗6气，150%×4段，各自扣防，总600%',
                targetSkill: 'devastate',
                morph: {
                    name: '拳舞',
                    desc: '4段×150%，各段独立扣防，总600%',
                    baseMultiplier: 1.5,
                    hits: 4,
                    cost: { qi: 6 }
                }
            }
        ],
        // 架势变体（替换型二选一，另有追加回击通过升级解锁）
        stance: [
            {
                id: 'qi_hammer_qi_fist',
                name: '气合拳',
                icon: '🛡️',
                desc: '替换架势：消耗2气，150%伤害，等量转化为自身护盾',
                targetSkill: 'stance',
                morph: {
                    name: '气合拳',
                    desc: '造成150%攻击力伤害，同时获得等量护盾',
                    type: 'special',
                    baseMultiplier: 1.5,
                    cost: { qi: 2 },
                    replaceTags: ['Special', 'Melee'],
                    extra: { effect: null, damageToShield: true }
                }
            },
            {
                id: 'qi_hammer_dragon',
                name: '龙腾',
                icon: '🐉',
                desc: '替换架势：消耗4气，200%伤害，附加晕眩1回合',
                targetSkill: 'stance',
                morph: {
                    name: '龙腾',
                    desc: '造成200%攻击力伤害，目标晕眩1回合',
                    type: 'special',
                    baseMultiplier: 2.0,
                    cost: { qi: 4 },
                    replaceTags: ['Special', 'Melee', 'Heavy'],
                    extra: { effect: null, applyStun: 1 }
                }
            }
        ]
    },
    combo: {
        // 快斩变体（替换二选一，+追加乱舞链通过升级解锁）
        quick_slash: [
            {
                id: 'combo_hammer_triple_slash',
                name: '双刃斩',
                icon: '⚔️',
                desc: '替换快斩：3段×70%，每段+1连击，共+3连击，攒连击神器',
                targetSkill: 'quick_slash',
                morph: {
                    name: '双刃斩',
                    desc: '3段攻击（每段70%），每段命中+1连击（共+3）',
                    baseMultiplier: 0.7,
                    hits: 3
                }
            },
            {
                id: 'combo_hammer_armor_break',
                name: '破防斩',
                icon: '🔨',
                desc: '替换快斩：120%单段，降目标DEF 2点（2回合），+1连击',
                targetSkill: 'quick_slash',
                morph: {
                    name: '破防斩',
                    desc: '造成120%攻击力伤害，降低目标防御2点（2回合），+1连击',
                    baseMultiplier: 1.2,
                    hits: 1,
                    onHit: (user, target) => {
                        if (target) {
                            target.addBuff({ name: '破防', type: 'debuff', stat: 'def', value: -2, duration: 2, desc: 'DEF-2（2回合）' });
                            Logger.log('破防斩！目标DEF-2（2回合）', true);
                        }
                    }
                }
            }
        ],
        // 连斩变体（替换三选一，无追加）
        chain_slash: [
            {
                id: 'combo_hammer_dash_slash',
                name: '疾步斩',
                icon: '💨',
                desc: '替换连斩：消耗2连击，100%×2段，命中后推进自身行动条20%，每段+1连击',
                targetSkill: 'chain_slash',
                morph: {
                    name: '疾步斩',
                    desc: '2段×100%，每段+1连击，命中后推进行动条20%',
                    baseMultiplier: 1.0,
                    hits: 2,
                    cost: { combo: 2 },
                    onHit: (user, target) => {
                        if (typeof advanceUnitAV === 'function' && typeof GameState !== 'undefined' && GameState.player) {
                            advanceUnitAV(GameState.player, 0.2);
                            Logger.log('疾步斩：推进行动条20%', true);
                        }
                    }
                }
            },
            {
                id: 'combo_hammer_whirl_blade',
                name: '旋刃',
                icon: '🌀',
                desc: '替换连斩：消耗4连击，80%×2段（全体），每段+1连击，净-2',
                targetSkill: 'chain_slash',
                morph: {
                    name: '旋刃',
                    desc: '2段×80%覆盖全体，每段+1连击',
                    baseMultiplier: 0.8,
                    hits: 2,
                    cost: { combo: 4 }
                }
            },
            {
                id: 'combo_hammer_frenzy',
                name: '乱击',
                icon: '⚡',
                desc: '替换连斩：消耗3连击，70%×5段，每段+1连击，净+2',
                targetSkill: 'chain_slash',
                morph: {
                    name: '乱击',
                    desc: '5段×70%，每段+1连击（净+2）',
                    baseMultiplier: 0.7,
                    hits: 5,
                    cost: { combo: 3 }
                }
            }
        ],
        // 终结技变体（替换二选一，+追加残心通过升级解锁）
        finisher: [
            {
                id: 'combo_hammer_hundred_slash',
                name: '百裂终结',
                icon: '🔥',
                desc: '替换终结技：消耗8连击，100%×4段，各自扣防，每段+1连击（净-4）',
                targetSkill: 'finisher',
                morph: {
                    name: '百裂终结',
                    desc: '4段×100%，各段独立扣防，每段+1连击（净-4）',
                    baseMultiplier: 1.0,
                    hits: 4,
                    cost: { combo: 8 },
                    extra: { pureHitsFinisher: true, noComboGain: false }
                }
            },
            {
                id: 'combo_hammer_issan',
                name: '一闪',
                icon: '⚡',
                desc: '替换终结技：消耗10连击，700%单发，全梭哈换最高单发',
                targetSkill: 'finisher',
                morph: {
                    name: '一闪',
                    desc: '700%单发伤害，满连击才能释放',
                    baseMultiplier: 7.0,
                    hits: 1,
                    cost: { combo: 10 },
                    extra: { issanEffect: true, noComboGain: true }
                }
            }
        ],
        // 见切变体（替换二选一，+追加追击通过升级解锁）
        kiri: [
            {
                id: 'combo_hammer_flow_water',
                name: '流水',
                icon: '💧',
                desc: '替换见切：消耗2连击，80%攻击+攻击力80%护盾，+1连击',
                targetSkill: 'kiri',
                morph: {
                    name: '流水',
                    desc: '闪避+80%反击，命中后获得攻击力80%的护盾，+1连击',
                    type: 'special',
                    baseMultiplier: 0.8,
                    hits: 1,
                    cost: { combo: 2 },
                    replaceTags: ['Special', 'Melee'],
                    onHit: (user, target) => {
                        const shieldVal = Math.floor(user.getBuffedAtk() * 0.8);
                        user.shield += shieldVal;
                        Logger.log(`流水：获得护盾 +${shieldVal}`, true);
                        if (typeof updateBuffBars === 'function') updateBuffBars();
                    },
                    extra: { effect: null, noComboGain: false }
                }
            },
            {
                id: 'combo_hammer_afterimage',
                name: '残像',
                icon: '👤',
                desc: '替换见切：0连击，不反击。获得【残像】ATK+30%（2回合）',
                targetSkill: 'kiri',
                morph: {
                    name: '残像',
                    desc: '不反击。闪避后获得【残像】ATK+30%（2回合）',
                    type: 'defense',
                    baseMultiplier: 0,
                    hits: 0,
                    cost: { combo: 0 },
                    extra: { effect: 'kiri', afterimageEffect: true, noComboGain: true }
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
                    desc: '3段×130%（消耗2弹药）',
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
                    desc: '造成500%攻击力伤害（消耗2弹药）',
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
                    desc: '360%伤害。30%概率免费再射（最多连射2次）',
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
                    desc: '魔力≥8时额外+2弹药（共5发）',
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
                    desc: '装填2发弹药，推进行动条20%',
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
                    desc: '100%伤害，平衡-3。施加深度侵蚀（攻击力40%/回合，2回合）',
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
    Logger.log(`魂印铭刻：${hammerConfig.name}（${skill.name}）`, true);

    if (typeof GameState.player.updateSkills === 'function') {
        GameState.player.updateSkills();
    }
    updateUI();
}
