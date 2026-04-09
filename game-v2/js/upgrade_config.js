// ==================== 强化配置表（带 tier / keywords 系统）====================

const UpgradeConfig = [
    // ==================== 通用强化 ====================
    // --- Base ---
    {
        id: 'a_multiplier', name: 'A倍率提升', icon: '⚔', desc: '攻击技能伤害 +{value}%',
        tier: 'base', keywords: ['攻击'], weight: 100, stackable: true,
        effect: { kind: 'skill_tag_mult', tags: ['Attack'], baseValue: 0.25 }
    },
    {
        id: 's_multiplier', name: 'S倍率提升', icon: '✨', desc: '特技伤害 +{value}%',
        tier: 'base', keywords: ['特技'], weight: 100, stackable: true,
        effect: { kind: 'skill_tag_mult', tags: ['Special'], baseValue: 0.25 }
    },
    {
        id: 'u_multiplier', name: 'U倍率提升', icon: '💥', desc: '能量技伤害 +{value}%',
        tier: 'base', keywords: ['能量'], weight: 90, stackable: true,
        effect: { kind: 'skill_tag_mult', tags: ['Ultimate'], baseValue: 0.25 }
    },
    {
        id: 'atk_growth', name: '攻击成长', icon: '🗡', desc: '攻击力 +{value}',
        tier: 'base', keywords: ['属性'], weight: 90, stackable: false,
        effect: { kind: 'stat_growth', stat: 'atk', baseValue: 2 }
    },
    {
        id: 'def_growth', name: '防御成长', icon: '🛡', desc: '防御力 +{value}',
        tier: 'base', keywords: ['属性'], weight: 90, stackable: false,
        effect: { kind: 'stat_growth', stat: 'def', baseValue: 2 }
    },
    {
        id: 'speed_growth', name: '速度成长', icon: '💨', desc: '速度 +{value}',
        tier: 'base', keywords: ['速度'], weight: 80, stackable: false,
        effect: { kind: 'stat_growth', stat: 'speed', baseValue: 30 }
    },
    {
        id: 'hp_growth', name: '生命成长', icon: '❤', desc: '生命上限 +{value}',
        tier: 'base', keywords: ['属性'], weight: 80, stackable: false,
        effect: { kind: 'stat_growth', stat: 'hp', baseValue: 15 }
    },
    // --- Synergy (通用) ---
    {
        id: 'first_strike', name: '先手优势', icon: '⚡', desc: '战斗开始时获得1回合加速buff（速度+30%）',
        tier: 'synergy', keywords: ['速度'], weight: 50, stackable: false,
        effect: { kind: 'first_strike' }
    },
    {
        id: 'desperation', name: '绝境反击', icon: '🔥', desc: 'HP < 30% 时所有伤害 +{value}%',
        tier: 'synergy', keywords: ['生存'], weight: 45, stackable: false,
        effect: { kind: 'desperation', baseValue: 0.4 }
    },
    {
        id: 'combo_reward', name: '连击奖励', icon: '💚', desc: '同一回合内造成3次以上伤害时，回复5%最大生命',
        tier: 'synergy', keywords: ['多段', '生存'], weight: 45, stackable: false,
        effect: { kind: 'combo_reward' }
    },
    {
        id: 'armor_expert', name: '破甲专精', icon: '🔨', desc: '对 DEF > 3 的敌人，额外 +{value}% 伤害',
        tier: 'synergy', keywords: ['破防'], weight: 50, stackable: false,
        effect: { kind: 'armor_expert', baseValue: 0.3 }
    },
    {
        id: 'insight', name: '战场洞察', icon: '🎯', desc: '每5回合获得一次"洞察"buff（下一击暴击x1.5）',
        tier: 'synergy', keywords: ['暴击'], weight: 45, stackable: false,
        effect: { kind: 'insight' }
    },

    // ==================== 气宗 ====================
    // --- Base ---
    {
        id: 'qi_internal_injury_boost', name: '内伤加深', icon: '💀',
        desc: '内伤引爆伤害 +{value}%',
        classes: ['qi'], tier: 'base', keywords: ['内伤'], weight: 60, stackable: false,
        effect: { kind: 'qi_internal_injury_mult', fixedValue: 1.5 }
    },
    {
        id: 'qi_rapid_speed', name: '迅击加速', icon: '⚡',
        desc: '迅击后速度 +{value}%',
        classes: ['qi'], tier: 'base', keywords: ['速度'], weight: 60, stackable: false,
        effect: { kind: 'qi_rapid_speed_boost', baseValue: 0.2 }
    },
    {
        id: 'qi_surge', name: '气涌', icon: '🌊',
        desc: '回合开始气回复 +1（从2变3）',
        classes: ['qi'], tier: 'base', keywords: ['资源'], weight: 55, stackable: false,
        effect: { kind: 'qi_surge' }
    },
    // --- Synergy ---
    {
        id: 'qi_internal_break', name: '崩山破防', icon: '💔',
        desc: '内伤引爆时附带破防（DEF-2, 2回合）',
        classes: ['qi'], tier: 'synergy', keywords: ['内伤', '破防'], weight: 50, stackable: false,
        effect: { kind: 'qi_armor_break_on_injury' }
    },
    {
        id: 'qi_internal_crit', name: '内伤暴击', icon: '🎯',
        desc: '攻击内伤目标时有 {value}% 暴击率，造成 200% 伤害',
        classes: ['qi'], tier: 'synergy', keywords: ['内伤', '暴击'], weight: 50, stackable: false,
        effect: { kind: 'qi_internal_crit', baseValue: 0.35, critMult: 2.0 }
    },
    {
        id: 'qi_blade', name: '气刃', icon: '🗡️',
        desc: '气≥8时普攻额外叠1层内伤',
        classes: ['qi'], tier: 'synergy', keywords: ['内伤', '资源'], weight: 50, stackable: false,
        effect: { kind: 'qi_blade' }
    },
    {
        id: 'qi_injury_detonate_bonus', name: '引爆强化', icon: '💣',
        desc: '内伤引爆时额外造成累计增伤量80%的爆发伤害',
        classes: ['qi'], tier: 'synergy', keywords: ['内伤'], weight: 45, stackable: false,
        effect: { kind: 'qi_injury_detonate_bonus' }
    },
    {
        id: 'qi_chain_strike', name: '轻击连环', icon: '👊',
        desc: '轻击每次命中叠+5%速度buff（1回合）',
        classes: ['qi'], tier: 'synergy', keywords: ['多段', '速度'], weight: 50, stackable: false,
        effect: { kind: 'qi_chain_strike' }
    },
    {
        id: 'qi_mountain_crush', name: '破山势', icon: '⛰️',
        desc: '崩山命中后，目标DEF永久-1（上限3）',
        classes: ['qi'], tier: 'synergy', keywords: ['重击', '破防'], weight: 45, stackable: false,
        effect: { kind: 'qi_mountain_crush' }
    },
    {
        id: 'qi_inner_flow', name: '内息循环', icon: '🔄',
        desc: '迅击命中内伤目标时，额外+1气',
        classes: ['qi'], tier: 'synergy', keywords: ['内伤', '资源'], weight: 50, stackable: false,
        effect: { kind: 'qi_inner_flow' }
    },

    // ==================== 剑圣 ====================
    // --- Base ---
    {
        id: 'combo_multihit_bonus', name: '多段精进', icon: '🔥',
        desc: '多段攻击每段伤害 +{value}%',
        classes: ['combo'], tier: 'base', keywords: ['多段'], weight: 70, stackable: true,
        effect: { kind: 'combo_multihit_bonus', baseValue: 0.1 }
    },
    {
        id: 'combo_gale_speed', name: '疾风强化', icon: '🌪',
        desc: '疾风每层速度额外 +{value}',
        classes: ['combo'], tier: 'base', keywords: ['速度', '疾风'], weight: 60, stackable: false,
        effect: { kind: 'combo_gale_speed_bonus', baseValue: 5 }
    },
    {
        id: 'combo_chain_chance', name: '连斩增幅', icon: '⛓',
        desc: '连斩追加概率 +{value}%',
        classes: ['combo'], tier: 'base', keywords: ['多段'], weight: 60, stackable: false,
        effect: { kind: 'combo_chain_chance', baseValue: 0.1 }
    },
    // --- Synergy ---
    {
        id: 'combo_finisher_allin', name: '终结全开', icon: '💫',
        desc: '终结技消耗所有连击点（至少6），缩放伤害',
        classes: ['combo'], tier: 'synergy', keywords: ['终结'], weight: 40, stackable: false,
        effect: { kind: 'combo_finisher_consume_all' }
    },
    {
        id: 'combo_blade_wind', name: '刃风', icon: '🌬️',
        desc: '疾风满10层时，每次攻击额外造成30%攻击力伤害',
        classes: ['combo'], tier: 'synergy', keywords: ['疾风', '多段'], weight: 45, stackable: false,
        effect: { kind: 'combo_blade_wind' }
    },
    {
        id: 'combo_gale_guard', name: '疾风护体', icon: '🛡️',
        desc: '每层疾风提供+1防御',
        classes: ['combo'], tier: 'synergy', keywords: ['疾风', '生存'], weight: 45, stackable: false,
        effect: { kind: 'combo_gale_guard' }
    },
    {
        id: 'combo_afterimage', name: '残影', icon: '👤',
        desc: '速度>250时，每次行动后25%概率获得额外行动（一回合限1次）',
        classes: ['combo'], tier: 'synergy', keywords: ['速度'], weight: 40, stackable: false,
        effect: { kind: 'combo_afterimage' }
    },

    // ==================== 魔导 ====================
    // --- Base ---
    {
        id: 'mana_overflow_atk', name: '盈能增幅', icon: '⚡',
        desc: '盈能每层攻击加成 +{value}%',
        classes: ['mana'], tier: 'base', keywords: ['盈能'], weight: 70, stackable: true,
        effect: { kind: 'mana_overflow_atk_bonus', baseValue: 0.02 }
    },
    {
        id: 'mana_overflow_speed', name: '盈能提速', icon: '🚀',
        desc: '盈能每层速度提升 +{value}%',
        classes: ['mana'], tier: 'base', keywords: ['盈能', '速度'], weight: 60, stackable: false,
        effect: { kind: 'mana_overflow_speed_bonus', baseValue: 0.02 }
    },
    {
        id: 'mana_reload_reduction', name: '装填节能', icon: '🔋',
        desc: '装填消耗魔力 -1',
        classes: ['mana'], tier: 'base', keywords: ['装填', '资源'], weight: 50, stackable: false,
        effect: { kind: 'mana_reload_cost_reduction', baseValue: 1 }
    },
    // --- Synergy ---
    {
        id: 'mana_full_overflow_burst', name: '盈能爆射', icon: '💣',
        desc: '盈能满5层时强化爆射伤害 +{value}%',
        classes: ['mana'], tier: 'synergy', keywords: ['盈能', '重击'], weight: 50, stackable: true,
        effect: { kind: 'mana_full_overflow_burst_bonus', baseValue: 0.2 }
    },
    {
        id: 'mana_ammo_recycle', name: '弹药回收', icon: '♻️',
        desc: '强化射击击杀敌人时，返还1弹药',
        classes: ['mana'], tier: 'synergy', keywords: ['弹药'], weight: 45, stackable: false,
        effect: { kind: 'mana_ammo_recycle' }
    },
    {
        id: 'mana_flow', name: '魔力涌动', icon: '🌊',
        desc: '每次消耗盈能层回魔时，额外回1魔力（3→4）',
        classes: ['mana'], tier: 'synergy', keywords: ['盈能', '资源'], weight: 50, stackable: false,
        effect: { kind: 'mana_flow' }
    },
    {
        id: 'mana_piercing', name: '穿甲弹', icon: '🔫',
        desc: '强化射击无视目标50%防御',
        classes: ['mana'], tier: 'synergy', keywords: ['弹药', '破防'], weight: 45, stackable: false,
        effect: { kind: 'mana_piercing' }
    },

    // ==================== 判官 ====================
    // --- Base ---
    {
        id: 'balance_contrast_bonus', name: '逆流之力', icon: '⚖',
        desc: '反差系数提升 +{value}%（逆方向额外倍率增加）',
        classes: ['balance'], tier: 'base', keywords: ['反差'], weight: 70, stackable: true,
        effect: { kind: 'balance_contrast_bonus', baseValue: 0.05 }
    },
    {
        id: 'balance_erosion_bonus', name: '深蚀', icon: '☯',
        desc: '侵蚀伤害倍率提升 +{value}%',
        classes: ['balance'], tier: 'base', keywords: ['侵蚀'], weight: 60, stackable: true,
        effect: { kind: 'balance_erosion_bonus', baseValue: 0.1 }
    },
    {
        id: 'balance_per_point_bonus', name: '阴阳增幅', icon: '🔮',
        desc: '阴阳每层被动效果提升 +{value}%',
        classes: ['balance'], tier: 'base', keywords: ['被动'], weight: 60, stackable: true,
        effect: { kind: 'balance_per_point_bonus', baseValue: 0.02 }
    },
    // --- Synergy ---
    {
        id: 'balance_extreme_cd', name: '极意贯通', icon: '✴',
        desc: '极值状态CD缩短1次行动',
        classes: ['balance'], tier: 'synergy', keywords: ['极值'], weight: 50, stackable: false,
        effect: { kind: 'balance_extreme_cd' }
    },
    {
        id: 'balance_alternation', name: '阴阳交替', icon: '🔄',
        desc: '连续使用不同方向技能时，第二击+50%倍率',
        classes: ['balance'], tier: 'synergy', keywords: ['反差'], weight: 50, stackable: false,
        effect: { kind: 'balance_alternation' }
    },
    {
        id: 'balance_erosion_spread', name: '侵蚀蔓延', icon: '☠️',
        desc: '侵蚀DOT触发时，30%概率持续时间+1回合',
        classes: ['balance'], tier: 'synergy', keywords: ['侵蚀'], weight: 45, stackable: false,
        effect: { kind: 'balance_erosion_spread' }
    },
    {
        id: 'balance_yang_shield', name: '阳极护盾', icon: '☀️',
        desc: '阳击命中时，根据阳面点数获得护盾（每点=10%最大生命）',
        classes: ['balance'], tier: 'synergy', keywords: ['阳', '生存'], weight: 45, stackable: false,
        effect: { kind: 'balance_yang_shield' }
    },
    {
        id: 'balance_unity', name: '天人合一', icon: '🧘',
        desc: '平衡=0时获得"天人合一"（所有属性+15%），持续到平衡偏移',
        classes: ['balance'], tier: 'synergy', keywords: ['被动'], weight: 40, stackable: false,
        effect: { kind: 'balance_unity' }
    }
];
