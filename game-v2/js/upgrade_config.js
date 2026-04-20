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

    // ==================== 气宗 - 角色锤子升级 ====================
    // 轻拳组（替换二选一，+追加连拳）
    {
        id: 'qi_hammer_heavy_fist', name: '重拳', icon: '👊',
        desc: '替换轻拳：倍率升至150%',
        classes: ['qi'], tier: 'base', keywords: ['攻击', '锤子'], weight: 60, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'qi_hammer_heavy_fist' }
    },
    {
        id: 'qi_hammer_qi_palm', name: '集气掌', icon: '🌀',
        desc: '替换轻拳：命中后回复1气',
        classes: ['qi'], tier: 'base', keywords: ['攻击', '锤子', '资源'], weight: 55, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'qi_hammer_qi_palm' }
    },
    {
        id: 'qi_followup_lianquan', name: '连拳', icon: '🥊',
        desc: '解锁追加：轻拳命中后必定触发连拳（80%，不消耗气）',
        classes: ['qi'], tier: 'synergy', keywords: ['追加', '攻击'], weight: 55, stackable: false,
        effect: { kind: 'unlock_followup', followUpId: 'qi_follow_lianquan' }
    },
    // 迅击组（替换三选一，无追加）
    {
        id: 'qi_hammer_tieshan', name: '铁山靠', icon: '⛰️',
        desc: '替换迅击：消耗4气，280%重击',
        classes: ['qi'], tier: 'base', keywords: ['特技', '锤子'], weight: 55, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'qi_hammer_tieshan' }
    },
    {
        id: 'qi_hammer_flash', name: '闪击', icon: '⚡',
        desc: '替换迅击：2气，200%，命中后可衔接所有已有追加技能',
        classes: ['qi'], tier: 'synergy', keywords: ['特技', '锤子', '追加'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'qi_hammer_flash' }
    },
    {
        id: 'qi_hammer_rapid3', name: '迅连击', icon: '🌀',
        desc: '替换迅击：消耗4气，150%×3段各自扣防',
        classes: ['qi'], tier: 'synergy', keywords: ['特技', '锤子', '多段'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'qi_hammer_rapid3' }
    },
    // 崩山组（替换二选一，+追加震破）
    {
        id: 'qi_hammer_devastate_ex', name: '崩山·极', icon: '🔥',
        desc: '替换崩山：消耗8气起，倾泻所有气，满10气=750%',
        classes: ['qi'], tier: 'synergy', keywords: ['能量', '锤子'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'qi_hammer_devastate_ex' }
    },
    {
        id: 'qi_hammer_fist_dance', name: '拳舞', icon: '🌪️',
        desc: '替换崩山：消耗6气，150%×4段各自扣防',
        classes: ['qi'], tier: 'synergy', keywords: ['能量', '锤子', '多段'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'qi_hammer_fist_dance' }
    },
    {
        id: 'qi_followup_zhenpuo', name: '震破', icon: '💫',
        desc: '解锁追加：崩山后可用震破（150%+推条20%，消耗2气）',
        classes: ['qi'], tier: 'synergy', keywords: ['追加', '能量'], weight: 50, stackable: false,
        effect: { kind: 'unlock_followup', followUpId: 'qi_follow_zhenpuo' }
    },
    // 架势组（替换二选一，+追加回击）
    {
        id: 'qi_hammer_qi_fist', name: '气合拳', icon: '🛡️',
        desc: '替换架势：消耗2气，150%伤害，等量转化为自身护盾',
        classes: ['qi'], tier: 'synergy', keywords: ['防御', '锤子'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'qi_hammer_qi_fist' }
    },
    {
        id: 'qi_hammer_dragon', name: '龙腾', icon: '🐉',
        desc: '替换架势：消耗4气，200%伤害，附加晕眩1回合',
        classes: ['qi'], tier: 'synergy', keywords: ['防御', '锤子', '控制'], weight: 45, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'qi_hammer_dragon' }
    },
    {
        id: 'qi_followup_huiji', name: '回击', icon: '🛡️',
        desc: '解锁追加：架势受击后可用回击（120%+回2气，不消耗气）',
        classes: ['qi'], tier: 'synergy', keywords: ['追加', '防御'], weight: 50, stackable: false,
        effect: { kind: 'unlock_followup', followUpId: 'qi_follow_huiji' }
    },

    // ==================== 气息魂升级 ====================
    {
        id: 'qis_branch_explosion', name: '内爆', icon: '💥',
        desc: '【气息魂】内伤改为叠层（至3层），叠满触发300%爆发（与重伤互斥）',
        classes: ['qi'], spirits: ['qi_spirit'], tier: 'synergy', keywords: ['内伤', '爆发'], weight: 50, stackable: false,
        effect: { kind: 'qis_branch', branchMode: 'explosion' }
    },
    {
        id: 'qis_branch_heavy', name: '重伤', icon: '💀',
        desc: '【气息魂】内伤易伤幅度提升至60%（与内爆互斥）',
        classes: ['qi'], spirits: ['qi_spirit'], tier: 'synergy', keywords: ['内伤'], weight: 50, stackable: false,
        effect: { kind: 'qis_branch', branchMode: 'heavy' }
    },
    {
        id: 'qis_branch_reflux', name: '回流', icon: '🔄',
        desc: '【气息魂】内伤被消耗时，玩家ATK永久+1',
        classes: ['qi'], spirits: ['qi_spirit'], tier: 'synergy', keywords: ['成长'], weight: 50, stackable: false,
        effect: { kind: 'qis_branch', branchReflux: true }
    },
    {
        id: 'qis_whirlwind_1', name: '旋风斩·强化1', icon: '🌪️',
        desc: '【气息魂】旋风斩攻击段数+1（变4段）',
        classes: ['qi'], spirits: ['qi_spirit'], tier: 'base', keywords: ['旋风斩'], weight: 55, stackable: false,
        effect: { kind: 'qis_whirlwind_upgrade', upgradeId: 1 }
    },
    {
        id: 'qis_whirlwind_3', name: '旋风斩·强化3', icon: '🌪️',
        desc: '【气息魂】旋风斩触发所需累计量-4（12→8）',
        classes: ['qi'], spirits: ['qi_spirit'], tier: 'synergy', keywords: ['旋风斩'], weight: 45, stackable: false,
        effect: { kind: 'qis_whirlwind_upgrade', upgradeId: 3 }
    },
    {
        id: 'qis_continuation_1', name: '续剑·强化1', icon: '⚔️',
        desc: '【气息魂】续剑倍率提升至120%',
        classes: ['qi'], spirits: ['qi_spirit'], tier: 'base', keywords: ['续剑'], weight: 55, stackable: false,
        effect: { kind: 'qis_continuation_upgrade', upgradeId: 1 }
    },
    {
        id: 'qis_continuation_2', name: '续剑·强化2', icon: '⚔️',
        desc: '【气息魂】续剑触发时为玩家回复1气',
        classes: ['qi'], spirits: ['qi_spirit'], tier: 'synergy', keywords: ['续剑', '资源'], weight: 50, stackable: false,
        effect: { kind: 'qis_continuation_upgrade', upgradeId: 2 }
    },
    {
        id: 'qis_continuation_3', name: '续剑·强化3', icon: '⚔️',
        desc: '【气息魂】连续释放特技第3次时升格为续剑·终（160%）',
        classes: ['qi'], spirits: ['qi_spirit'], tier: 'synergy', keywords: ['续剑'], weight: 45, stackable: false,
        effect: { kind: 'qis_continuation_upgrade', upgradeId: 3 }
    },

    // ==================== 连击魂升级 ====================
    {
        id: 'cs_branch_riding', name: '乘风', icon: '🌬️',
        desc: '【连击魂】魂灵也受疾风加速（每层+5速度）',
        classes: ['qi'], spirits: ['combo_spirit'], tier: 'synergy', keywords: ['疾风', '速度'], weight: 50, stackable: false,
        effect: { kind: 'cs_branch', branchRiding: true }
    },
    {
        id: 'cs_branch_storm', name: '狂风', icon: '🌪️',
        desc: '【连击魂】每累计获得5层疾风时，魂灵自动追加全体150%攻击',
        classes: ['qi'], spirits: ['combo_spirit'], tier: 'synergy', keywords: ['疾风', '自动'], weight: 45, stackable: false,
        effect: { kind: 'cs_branch', branchStorm: true }
    },
    {
        id: 'cs_cross_upgrade1', name: '交错之斩·强化1', icon: '⚡',
        desc: '【连击魂】交错之斩命中后目标陷入【易伤】（20%，1回合）',
        classes: ['qi'], spirits: ['combo_spirit'], tier: 'synergy', keywords: ['交错'], weight: 50, stackable: false,
        effect: { kind: 'cs_cross_upgrade', upgradeId: 1 }
    },

    // ==================== 剑圣 - 角色锤子升级 ====================
    // 快斩组（替换二选一，+追加乱舞链）
    {
        id: 'combo_hammer_triple_slash', name: '双刃斩', icon: '⚔️',
        desc: '替换快斩：3段×70%，每段+1连击（共+3）',
        classes: ['combo'], tier: 'base', keywords: ['攻击', '锤子'], weight: 60, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'combo_hammer_triple_slash' }
    },
    {
        id: 'combo_hammer_armor_break', name: '破防斩', icon: '🔨',
        desc: '替换快斩：120%单段，降目标DEF 2点（2回合）',
        classes: ['combo'], tier: 'synergy', keywords: ['攻击', '锤子', '破防'], weight: 55, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'combo_hammer_armor_break' }
    },
    {
        id: 'combo_followup_ranwu', name: '乱舞', icon: '⚔️',
        desc: '解锁追加：快斩后必定触发乱舞（60%，+1连击），50%触发乱舞·破（需进一步解锁）',
        classes: ['combo'], tier: 'synergy', keywords: ['追加', '攻击'], weight: 55, stackable: false,
        effect: { kind: 'unlock_followup', followUpId: 'combo_follow_ranwu' }
    },
    {
        id: 'combo_followup_ranwu_po', name: '乱舞·破', icon: '⚔️',
        desc: '解锁追加链：乱舞后50%触发乱舞·破（80%，+1连击）',
        classes: ['combo'], tier: 'synergy', keywords: ['追加'], weight: 50, stackable: false,
        effect: { kind: 'unlock_followup', followUpId: 'combo_follow_ranwu_po' }
    },
    {
        id: 'combo_followup_ranwu_ji', name: '乱舞·急', icon: '⚔️',
        desc: '解锁追加链：乱舞·破后50%触发乱舞·急（120%，+1连击）',
        classes: ['combo'], tier: 'synergy', keywords: ['追加'], weight: 45, stackable: false,
        effect: { kind: 'unlock_followup', followUpId: 'combo_follow_ranwu_ji' }
    },
    // 连斩组（替换三选一，无追加）
    {
        id: 'combo_hammer_dash_slash', name: '疾步斩', icon: '💨',
        desc: '替换连斩：消耗2连击，100%×2段，推进行动条20%',
        classes: ['combo'], tier: 'synergy', keywords: ['特技', '锤子', '速度'], weight: 55, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'combo_hammer_dash_slash' }
    },
    {
        id: 'combo_hammer_whirl_blade', name: '旋刃', icon: '🌀',
        desc: '替换连斩：消耗4连击，80%×2段（覆盖全敌），净-2连击',
        classes: ['combo'], tier: 'synergy', keywords: ['特技', '锤子', '全体'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'combo_hammer_whirl_blade' }
    },
    {
        id: 'combo_hammer_frenzy', name: '乱击', icon: '⚡',
        desc: '替换连斩：消耗3连击，70%×5段，净+2连击',
        classes: ['combo'], tier: 'synergy', keywords: ['特技', '锤子', '多段'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'combo_hammer_frenzy' }
    },
    // 终结技组（替换二选一，+追加残心）
    {
        id: 'combo_hammer_hundred_slash', name: '百裂终结', icon: '🔥',
        desc: '替换终结技：消耗8连击，100%×4段，各自扣防，每段+1连击（净-4）',
        classes: ['combo'], tier: 'synergy', keywords: ['能量', '锤子', '多段'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'combo_hammer_hundred_slash' }
    },
    {
        id: 'combo_hammer_issan', name: '一闪', icon: '⚡',
        desc: '替换终结技：消耗10连击，700%单发全梭哈',
        classes: ['combo'], tier: 'synergy', keywords: ['能量', '锤子'], weight: 45, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'combo_hammer_issan' }
    },
    {
        id: 'combo_followup_zanxin', name: '残心', icon: '🌀',
        desc: '解锁追加：终结技后可触发残心（100%，回复3连击）',
        classes: ['combo'], tier: 'synergy', keywords: ['追加', '资源'], weight: 55, stackable: false,
        effect: { kind: 'unlock_followup', followUpId: 'combo_follow_zanxin' }
    },
    // 见切组（替换二选一，+追加追击）
    {
        id: 'combo_hammer_flow_water', name: '流水', icon: '💧',
        desc: '替换见切：消耗2连击，80%攻击+攻击力80%护盾，+1连击',
        classes: ['combo'], tier: 'synergy', keywords: ['防御', '锤子'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'combo_hammer_flow_water' }
    },
    {
        id: 'combo_hammer_afterimage', name: '残像', icon: '👤',
        desc: '替换见切：0连击，不反击，获得ATK+30% buff（2回合）',
        classes: ['combo'], tier: 'synergy', keywords: ['防御', '锤子', '增益'], weight: 50, stackable: false,
        effect: { kind: 'apply_hammer', hammerId: 'combo_hammer_afterimage' }
    },
    {
        id: 'combo_followup_kiri_chase', name: '追击', icon: '💨',
        desc: '解锁追加：见切反击后自动追加追击（80%，+1连击）',
        classes: ['combo'], tier: 'synergy', keywords: ['追加', '防御'], weight: 50, stackable: false,
        effect: { kind: 'unlock_followup', followUpId: 'combo_follow_kiri_chase' }
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
