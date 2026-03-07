// ==================== 强化配置表（可直接编辑）====================

const UpgradeConfig = [
    // ==================== 通用强化 ====================
    {
        id: 'a_multiplier',
        name: 'A倍率提升',
        icon: '⚔',
        desc: '攻击技能伤害 +{value}%',
        weight: 100,
        stackable: true,
        effect: { kind: 'skill_tag_mult', tags: ['Attack'], baseValue: 0.25 }
    },
    {
        id: 's_multiplier',
        name: 'S倍率提升',
        icon: '✨',
        desc: '特技伤害 +{value}%',
        weight: 100,
        stackable: true,
        effect: { kind: 'skill_tag_mult', tags: ['Special'], baseValue: 0.25 }
    },
    {
        id: 'u_multiplier',
        name: 'U倍率提升',
        icon: '💥',
        desc: '能量技伤害 +{value}%',
        weight: 90,
        stackable: true,
        effect: { kind: 'skill_tag_mult', tags: ['Ultimate'], baseValue: 0.25 }
    },
    {
        id: 'atk_growth',
        name: '攻击成长',
        icon: '🗡',
        desc: '攻击力 +{value}',
        weight: 90,
        stackable: false,
        effect: { kind: 'stat_growth', stat: 'atk', baseValue: 2 }
    },
    {
        id: 'def_growth',
        name: '防御成长',
        icon: '🛡',
        desc: '防御力 +{value}',
        weight: 90,
        stackable: false,
        effect: { kind: 'stat_growth', stat: 'def', baseValue: 2 }
    },
    {
        id: 'speed_growth',
        name: '速度成长',
        icon: '💨',
        desc: '速度 +{value}',
        weight: 80,
        stackable: false,
        effect: { kind: 'stat_growth', stat: 'speed', baseValue: 30 }
    },
    {
        id: 'hp_growth',
        name: '生命成长',
        icon: '❤',
        desc: '生命上限 +{value}',
        weight: 80,
        stackable: false,
        effect: { kind: 'stat_growth', stat: 'hp', baseValue: 15 }
    },

    // ==================== 气宗 ====================
    {
        id: 'qi_internal_injury_boost',
        name: '内伤加深',
        icon: '💀',
        desc: '内伤伤害倍率提升至 {value}',
        classes: ['qi'],
        weight: 60,
        stackable: false,
        effect: { kind: 'qi_internal_injury_mult', fixedValue: 1.5 }
    },
    {
        id: 'qi_internal_break',
        name: '崩山破防',
        icon: '💔',
        desc: '内伤触发时附带破防',
        classes: ['qi'],
        weight: 50,
        stackable: false,
        effect: { kind: 'qi_armor_break_on_injury' }
    },
    {
        id: 'qi_rapid_speed',
        name: '迅击加速',
        icon: '⚡',
        desc: '迅击后速度 +{value}%',
        classes: ['qi'],
        weight: 60,
        stackable: false,
        effect: { kind: 'qi_rapid_speed_boost', baseValue: 0.2 }
    },
    {
        id: 'qi_internal_crit',
        name: '内伤暴击',
        icon: '🎯',
        desc: '内伤状态下受击有 {value}% 暴击，造成 200% 伤害',
        classes: ['qi'],
        weight: 50,
        stackable: false,
        effect: { kind: 'qi_internal_crit', baseValue: 0.35, critMult: 2.0 }
    },

    // ==================== 剑圣 ====================
    {
        id: 'combo_multihit_bonus',
        name: '多段精进',
        icon: '🔥',
        desc: '多段攻击每段伤害 +{value}%',
        classes: ['combo'],
        weight: 70,
        stackable: true,
        effect: { kind: 'combo_multihit_bonus', baseValue: 0.1 }
    },
    {
        id: 'combo_gale_speed',
        name: '疾风强化',
        icon: '🌪',
        desc: '疾风每层速度 +{value}',
        classes: ['combo'],
        weight: 60,
        stackable: false,
        effect: { kind: 'combo_gale_speed_bonus', baseValue: 5 }
    },
    {
        id: 'combo_chain_chance',
        name: '连斩增幅',
        icon: '⛓',
        desc: '连斩追加概率 +{value}%',
        classes: ['combo'],
        weight: 60,
        stackable: false,
        effect: { kind: 'combo_chain_chance', baseValue: 0.1 }
    },
    {
        id: 'combo_finisher_allin',
        name: '终结全开',
        icon: '💫',
        desc: '终结技消耗所有连击点（至少6）',
        classes: ['combo'],
        weight: 40,
        stackable: false,
        effect: { kind: 'combo_finisher_consume_all' }
    },

    // ==================== 魔导 ====================
    {
        id: 'mana_overflow_atk',
        name: '盈能增幅',
        icon: '⚡',
        desc: '盈能每层攻击加成 +{value}%',
        classes: ['mana'],
        weight: 70,
        stackable: true,
        effect: { kind: 'mana_overflow_atk_bonus', baseValue: 0.02 }
    },
    {
        id: 'mana_overflow_speed',
        name: '盈能提速',
        icon: '🚀',
        desc: '盈能每层速度提升 +{value}%',
        classes: ['mana'],
        weight: 60,
        stackable: false,
        effect: { kind: 'mana_overflow_speed_bonus', baseValue: 0.02 }
    },
    {
        id: 'mana_reload_reduction',
        name: '装填节能',
        icon: '🔋',
        desc: '装填消耗魔力 -1',
        classes: ['mana'],
        weight: 50,
        stackable: false,
        effect: { kind: 'mana_reload_cost_reduction', baseValue: 1 }
    },
    {
        id: 'mana_full_overflow_burst',
        name: '盈能爆射',
        icon: '💣',
        desc: '盈能满层时强化爆射伤害 +{value}%',
        classes: ['mana'],
        weight: 50,
        stackable: true,
        effect: { kind: 'mana_full_overflow_burst_bonus', baseValue: 0.2 }
    },

    // ==================== 判官 ====================
    {
        id: 'balance_contrast_bonus',
        name: '逆流之力',
        icon: '⚖',
        desc: '反差系数提升 +{value}%（逆方向额外倍率增加）',
        classes: ['balance'],
        weight: 70,
        stackable: true,
        effect: { kind: 'balance_contrast_bonus', baseValue: 0.05 }
    },
    {
        id: 'balance_extreme_cd',
        name: '极意贯通',
        icon: '✴',
        desc: '极值状态 CD 缩短 1 次行动',
        classes: ['balance'],
        weight: 50,
        stackable: false,
        effect: { kind: 'balance_extreme_cd' }
    },
    {
        id: 'balance_erosion_bonus',
        name: '深蚀',
        icon: '☯',
        desc: '侵蚀伤害倍率提升 +{value}%',
        classes: ['balance'],
        weight: 60,
        stackable: true,
        effect: { kind: 'balance_erosion_bonus', baseValue: 0.1 }
    },
    {
        id: 'balance_per_point_bonus',
        name: '阴阳增幅',
        icon: '🔮',
        desc: '阴阳每层被动效果提升 +{value}%',
        classes: ['balance'],
        weight: 60,
        stackable: true,
        effect: { kind: 'balance_per_point_bonus', baseValue: 0.02 }
    }
];
