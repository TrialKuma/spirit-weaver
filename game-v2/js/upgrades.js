// ==================== 肉鸽强化系统（带 tier / keywords）====================

const UpgradeRarityTable = [
    { id: 'R', weight: 70, mult: 1, color: '#4fc3f7' },
    { id: 'SR', weight: 25, mult: 2, color: '#b388ff' },
    { id: 'SSR', weight: 5, mult: 4, color: '#ffd54f' }
];

function rollRarity() {
    const total = UpgradeRarityTable.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of UpgradeRarityTable) {
        roll -= item.weight;
        if (roll <= 0) return item;
    }
    return UpgradeRarityTable[0];
}

function getUpgradeLevel(id) {
    return (GameState.upgradeLevels && GameState.upgradeLevels[id]) || 0;
}

function setUpgradeLevel(id, level) {
    if (!GameState.upgradeLevels) GameState.upgradeLevels = {};
    GameState.upgradeLevels[id] = level;
}

function getUpgradePool() {
    const classId = GameState.player ? GameState.player.classId : null;
    const spiritId = GameState.spirit ? GameState.spirit.id : null;
    return (Array.isArray(UpgradeConfig) ? UpgradeConfig : []).filter(item => {
        if (item.classes && classId && !item.classes.includes(classId)) return false;
        // 魂灵专属升级：仅当对应魂灵已契约时出现
        if (item.spirits && item.spirits.length > 0) {
            if (!spiritId || !item.spirits.includes(spiritId)) return false;
        }
        if (item.stackable === false && getUpgradeLevel(item.id) > 0) return false;
        return true;
    });
}

function pickWeightedUpgrade(pool) {
    const totalWeight = pool.reduce((sum, item) => sum + (item.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    for (const item of pool) {
        roll -= (item.weight || 1);
        if (roll <= 0) return item;
    }
    return pool[pool.length - 1];
}

function getLevelScale(level) {
    if (level <= 1) return 1;
    return 1 + 0.2 * (level - 1);
}

function buildUpgradeOption(template) {
    const rarity = rollRarity();
    const currentLevel = getUpgradeLevel(template.id);
    const nextLevel = (template.stackable === false) ? 1 : currentLevel + 1;
    const levelScale = getLevelScale(nextLevel);
    const prevScale = getLevelScale(currentLevel);
    const effect = { ...template.effect };

    let displayValue = null;
    let deltaMultiplier = null;

    if (effect && effect.baseValue !== undefined) {
        const totalValue = effect.baseValue * rarity.mult * levelScale;
        const prevValue = effect.baseValue * rarity.mult * prevScale;
        displayValue = totalValue;
        if (effect.kind === 'skill_tag_mult') {
            const prevMult = 1 + prevValue;
            const newMult = 1 + totalValue;
            deltaMultiplier = newMult / prevMult;
        }
        effect.totalValue = totalValue;
        effect.prevValue = prevValue;
        effect.deltaMultiplier = deltaMultiplier;
    }

    if (effect && effect.fixedValue !== undefined) {
        displayValue = effect.fixedValue;
    }

    const valueText = displayValue !== null
        ? (template.desc.includes('%') ? Math.round(displayValue * 100) : Math.round(displayValue))
        : '';

    const coloredValue = displayValue !== null
        ? `<span class="upgrade-number" style="color: ${rarity.color};">${valueText}</span>`
        : '';

    const displayDesc = template.desc.replace('{value}', coloredValue);
    const displayName = `${template.name} Lv.${nextLevel}`;

    return {
        ...template,
        rarity: rarity.id,
        rarityColor: rarity.color,
        level: nextLevel,
        displayName,
        displayDesc,
        effect
    };
}

function getRandomUpgrades(count = 3) {
    const pool = [...getUpgradePool()];
    const picks = [];
    while (pool.length > 0 && picks.length < count) {
        const pick = pickWeightedUpgrade(pool);
        const idx = pool.findIndex(item => item.id === pick.id);
        if (idx >= 0) {
            const option = buildUpgradeOption(pool.splice(idx, 1)[0]);
            picks.push(option);
        }
    }
    return picks;
}

function applyUpgrade(upgrade) {
    if (!upgrade || !GameState.player) return;
    const effect = upgrade.effect || {};
    const player = GameState.player;

    switch (effect.kind) {
        case 'skill_tag_mult':
            if (effect.deltaMultiplier) {
                player.addModifier(new SkillModifier({
                    type: 'mult', value: effect.deltaMultiplier, tags: effect.tags
                }));
            }
            break;
        case 'stat_growth':
            if (effect.stat === 'atk') {
                player.baseAtk += effect.totalValue;
            } else if (effect.stat === 'def') {
                player.def += effect.totalValue;
            } else if (effect.stat === 'speed') {
                player.baseSpeed += effect.totalValue;
                player.speed += effect.totalValue;
            } else if (effect.stat === 'hp') {
                player.maxHp += effect.totalValue;
                player.hp += effect.totalValue;
            }
            break;

        // === 通用 synergy ===
        case 'first_strike':
            player.upgradeFirstStrike = true;
            break;
        case 'desperation':
            player.upgradeDesperationMult = effect.totalValue || 0.4;
            break;
        case 'combo_reward':
            player.upgradeComboReward = true;
            break;
        case 'armor_expert':
            player.upgradeArmorExpert = effect.totalValue || 0.3;
            break;
        case 'insight':
            player.upgradeInsight = true;
            player.insightCounter = 0;
            break;

        // === 气宗 - 锤子升级 ===
        case 'apply_hammer': {
            const hammerId = effect.hammerId;
            // 在 HammerConfig 中查找对应锤子
            const allHammers = typeof HammerConfig !== 'undefined' ? HammerConfig : {};
            let found = null;
            for (const classHammers of Object.values(allHammers)) {
                for (const hammers of Object.values(classHammers)) {
                    const h = hammers.find(x => x.id === hammerId);
                    if (h) { found = h; break; }
                }
                if (found) break;
            }
            if (found && typeof applyHammerToPlayer === 'function') {
                applyHammerToPlayer(found);
            }
            break;
        }
        case 'unlock_followup':
            if (effect.followUpId && player._unlockedFollowUps) {
                player._unlockedFollowUps.add(effect.followUpId);
                Logger.log(`解锁追加技能：${effect.followUpId}`, true);
            }
            break;
        // === 气息魂升级 ===
        case 'qis_branch': {
            const spirit = GameState.spirit;
            if (spirit && spirit.id === 'qi_spirit') {
                if (effect.branchMode) {
                    // 内爆/重伤互斥
                    spirit.state.branchMode = effect.branchMode;
                    Logger.log(`气息魂分支：${effect.branchMode === 'explosion' ? '内爆' : '重伤'}`, true);
                }
                if (effect.branchReflux) {
                    spirit.state.branchReflux = true;
                    Logger.log('气息魂分支：回流', true);
                }
            }
            break;
        }
        case 'qis_whirlwind_upgrade': {
            const spirit = GameState.spirit;
            if (spirit && spirit.id === 'qi_spirit') {
                if (effect.upgradeId === 1) spirit.state.whirlwindSegments = (spirit.state.whirlwindSegments || 3) + 1;
                if (effect.upgradeId === 3) spirit.state.whirlwindThreshold = 8;
            }
            break;
        }
        case 'qis_continuation_upgrade': {
            const spirit = GameState.spirit;
            if (spirit && spirit.id === 'qi_spirit') {
                if (effect.upgradeId === 1) spirit.state.xujiianMult = 1.2;
                if (effect.upgradeId === 2) spirit.state.xujiianUpgrade2 = true;
                if (effect.upgradeId === 3) spirit.state.xujiianUpgrade3 = true;
            }
            break;
        }
        // === 连击魂升级 ===
        case 'cs_branch': {
            const spirit = GameState.spirit;
            if (spirit && spirit.id === 'combo_spirit') {
                if (effect.branchRiding) spirit.state.branchRiding = true;
                if (effect.branchStorm) spirit.state.branchStorm = true;
            }
            break;
        }
        case 'cs_cross_upgrade': {
            const spirit = GameState.spirit;
            if (spirit && spirit.id === 'combo_spirit') {
                if (effect.upgradeId === 1) spirit.state.crossUpgrade1 = true;
            }
            break;
        }

        // === 剑圣（旧升级 kinds 已移除，现在走 apply_hammer / unlock_followup） ===
        // 保留空注释以供参考，不再有剑圣专属升级 kind

        // === 魔导 ===
        case 'mana_overflow_atk_bonus':
            player.manaOverflowAtkBonus = (player.manaOverflowAtkBonus || 0) + effect.totalValue;
            break;
        case 'mana_overflow_speed_bonus':
            player.manaOverflowSpeedBonus = effect.totalValue;
            break;
        case 'mana_reload_cost_reduction':
            player.manaReloadCostReduction = effect.totalValue;
            break;
        case 'mana_full_overflow_burst_bonus':
            player.manaFullOverflowBurstBonus = (player.manaFullOverflowBurstBonus || 0) + effect.totalValue;
            break;
        case 'mana_ammo_recycle':
            player.manaAmmoRecycle = true;
            break;
        case 'mana_flow':
            player.manaFlow = true;
            break;
        case 'mana_piercing':
            player.manaPiercing = true;
            break;

        // === 判官 ===
        case 'balance_contrast_bonus':
            player.balanceContrastBonus = (player.balanceContrastBonus || 0) + effect.totalValue;
            break;
        case 'balance_extreme_cd':
            player.extremeCD = Math.max(0, (player.extremeCD || 0) - 1);
            player.balanceExtremeCDReduction = 1;
            break;
        case 'balance_erosion_bonus':
            player.balanceErosionBonus = (player.balanceErosionBonus || 0) + effect.totalValue;
            break;
        case 'balance_per_point_bonus':
            player.balancePerPointBonus = (player.balancePerPointBonus || 0) + effect.totalValue;
            break;
        case 'balance_alternation':
            player.balanceAlternation = true;
            break;
        case 'balance_erosion_spread':
            player.balanceErosionSpread = true;
            break;
        case 'balance_yang_shield':
            player.balanceYangShield = true;
            break;
        case 'balance_unity':
            player.balanceUnity = true;
            break;
        default:
            break;
    }

    if (upgrade.stackable !== false) {
        setUpgradeLevel(upgrade.id, upgrade.level);
    } else if (getUpgradeLevel(upgrade.id) === 0) {
        setUpgradeLevel(upgrade.id, 1);
    }

    GameState.upgradesChosen += 1;
    Logger.log(`获得强化：${upgrade.displayName || upgrade.name} (${upgrade.rarity || 'R'})`, true);
    updateUI();
}
