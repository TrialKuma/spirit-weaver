// UI 更新
function updateUI() {
    // Helper function to render stat with diff
    const renderStat = (elId, current, base) => {
        const el = document.getElementById(elId);
        if (!el) return;
        const diff = current - base;
        // 精度处理
        const curStr = current.toFixed(1).replace(/\.0$/, '');
        
        if (Math.abs(diff) < 0.1) {
            el.textContent = curStr;
        } else {
            const diffStr = Math.abs(diff).toFixed(1).replace(/\.0$/, '');
            const sign = diff > 0 ? '+' : '-';
            const color = diff > 0 ? '#4caf50' : '#f44336'; // 绿涨红跌
            el.innerHTML = `${base.toFixed(1).replace(/\.0$/, '')} <span style="color: ${color}">(${sign}${diffStr})</span>`;
        }
    };

    if (GameState.player) {
        // 计算当前属性
        let curAtk = GameState.player.baseAtk;
        let curDef = GameState.player.def;
        let curSpeed = GameState.player.speed;
        let baseAtk = GameState.player.baseAtk;
        let baseDef = GameState.player.def;
        let baseSpeed = GameState.player.speed;

        // 还原剑圣的基础速度 (假设300)
        if (GameState.player.classId === 'combo') {
            baseSpeed = 300;
            // curSpeed 已经在 onAction 中被修改了，所以这里 curSpeed 就是实际值
            // 疾风满层加攻
            if (GameState.player.speedStacks >= 10) {
                curAtk *= 1.2;
            }
        }

        // 计算魔导的实际攻击力
        if (GameState.player.classId === 'mana') {
            curAtk = GameState.player.baseAtk * (1.0 + (GameState.player.stacks || 0) * 0.05);
        }
        
        // 计算判官的实际属性
        if (GameState.player.classId === 'balance') {
             const mult = GameState.player.getStatsMultiplier ? GameState.player.getStatsMultiplier() : 1.0;
             if (mult > 1.0) {
                 curAtk *= mult;
                 curDef *= mult;
                 curSpeed *= mult;
             }
        }

        const hpEl = document.getElementById('player-hp');
        if (hpEl) hpEl.textContent = GameState.player.hp.toFixed(0); // 血量通常取整
        
        const maxHpEl = document.getElementById('player-max-hp');
        if (maxHpEl) maxHpEl.textContent = GameState.player.maxHp.toFixed(0);

        // HP 血条
        const playerHpBar = document.getElementById('player-hp-bar');
        if (playerHpBar) {
            const hpPct = (GameState.player.hp / GameState.player.maxHp) * 100;
            const oldWidth = parseFloat(playerHpBar.style.width) || 100;
            playerHpBar.style.width = hpPct + '%';
            playerHpBar.className = 'hp-bar-fill';
            if (hpPct <= 25) playerHpBar.classList.add('critical');
            else if (hpPct <= 50) playerHpBar.classList.add('low');
            // 延迟条：只在扣血时触发
            const dmgBar = document.getElementById('player-hp-damage');
            if (dmgBar && hpPct < oldWidth - 0.5) {
                dmgBar.style.transition = 'none';
                dmgBar.style.width = oldWidth + '%';
                void dmgBar.offsetWidth;
                dmgBar.style.transition = 'width 0.6s ease-out 0.4s';
                dmgBar.style.width = hpPct + '%';
                // 闪白
                const container = document.getElementById('player-hp-container');
                if (container) {
                    container.classList.remove('damage-flash');
                    void container.offsetWidth;
                    container.classList.add('damage-flash');
                    setTimeout(() => container.classList.remove('damage-flash'), 200);
                }
            } else if (dmgBar) {
                dmgBar.style.width = hpPct + '%';
            }
        }
        const playerShieldBar = document.getElementById('player-shield-bar');
        if (playerShieldBar) {
            const hpPct = (GameState.player.hp / GameState.player.maxHp) * 100;
            const shieldPct = ((GameState.player.shield || 0) / GameState.player.maxHp) * 100;
            if (shieldPct > 0) {
                playerShieldBar.style.left = hpPct + '%';
                playerShieldBar.style.width = Math.min(shieldPct, 100 - hpPct) + '%';
                playerShieldBar.style.display = 'block';
            } else {
                playerShieldBar.style.display = 'none';
            }
        }

        renderStat('player-atk', curAtk, baseAtk);
        renderStat('player-def', curDef, baseDef);
        renderStat('player-speed', curSpeed, baseSpeed);
    }
    
    if (GameState.enemy) {
        // 更新敌人名字和图标
        const enemyIconEl = document.getElementById('enemy-icon');
        const enemyNameEl = document.getElementById('enemy-name-label');
        if (enemyIconEl) enemyIconEl.textContent = GameState.enemy.icon || '👾';
        if (enemyNameEl) enemyNameEl.textContent = GameState.enemy.name || '敌人';

        let curAtk = GameState.enemy.baseAtk || 8;
        let curDef = GameState.enemy.def || 3;
        let curSpeed = GameState.enemy.speed || 80;
        let baseAtk = GameState.enemy.baseAtk || 8;
        let baseDef = GameState.enemy.def || 3;
        
        // 修复逻辑：不要修改 GameState.enemy 的属性，只在显示时计算。
        // 假设 GameState.enemy 存储的是基础值。
        
        if (GameState.player && GameState.player.classId === 'balance') {
            const debuffMult = GameState.player.getEnemyDebuffMultiplier ? GameState.player.getEnemyDebuffMultiplier() : 1.0;
            if (debuffMult < 1.0) {
                curAtk *= debuffMult;
                curDef *= debuffMult;
            }
        }

        const eHpEl = document.getElementById('enemy-hp');
        if (eHpEl) eHpEl.textContent = Math.floor(GameState.enemy.hp);
        
        const eMaxHpEl = document.getElementById('enemy-max-hp');
        if (eMaxHpEl) eMaxHpEl.textContent = (GameState.enemy.maxHp || 1000).toFixed(0);

        // 敌人 HP 血条
        const enemyHpBar = document.getElementById('enemy-hp-bar');
        if (enemyHpBar) {
            const hpPct = (GameState.enemy.hp / (GameState.enemy.maxHp || 1)) * 100;
            const oldWidth = parseFloat(enemyHpBar.style.width) || 100;
            enemyHpBar.style.width = hpPct + '%';
            enemyHpBar.className = 'hp-bar-fill enemy';
            if (hpPct <= 25) enemyHpBar.classList.add('critical');
            else if (hpPct <= 50) enemyHpBar.classList.add('low');
            // 延迟条
            const dmgBar = document.getElementById('enemy-hp-damage');
            if (dmgBar && hpPct < oldWidth - 0.5) {
                dmgBar.style.transition = 'none';
                dmgBar.style.width = oldWidth + '%';
                void dmgBar.offsetWidth;
                dmgBar.style.transition = 'width 0.6s ease-out 0.4s';
                dmgBar.style.width = hpPct + '%';
                const container = document.getElementById('enemy-hp-container');
                if (container) {
                    container.classList.remove('damage-flash');
                    void container.offsetWidth;
                    container.classList.add('damage-flash');
                    setTimeout(() => container.classList.remove('damage-flash'), 200);
                }
            } else if (dmgBar) {
                dmgBar.style.width = hpPct + '%';
            }
        }
        const enemyShieldBar = document.getElementById('enemy-shield-bar');
        if (enemyShieldBar) {
            const hpPct = (GameState.enemy.hp / (GameState.enemy.maxHp || 1)) * 100;
            const shieldPct = ((GameState.enemy.shield || 0) / (GameState.enemy.maxHp || 1)) * 100;
            if (shieldPct > 0) {
                enemyShieldBar.style.left = hpPct + '%';
                enemyShieldBar.style.width = Math.min(shieldPct, 100 - hpPct) + '%';
                enemyShieldBar.style.display = 'block';
            } else {
                enemyShieldBar.style.display = 'none';
            }
        }

        renderStat('enemy-atk', curAtk, baseAtk);
        renderStat('enemy-def', curDef, baseDef);
        renderStat('enemy-speed', curSpeed, GameState.enemy.baseSpeed || 80);
    }
    updateResourceUI();
    updateSkillsUI();
    updateBuffBars();
    updateEnemyIntent();
    if (typeof updateSpiritFrame === 'function') {
        updateSpiritFrame();
    }
    
    // 更新关卡显示（使用 RunManager）
    const levelEl = document.getElementById('level-count');
    if (levelEl) {
        if (typeof RunManager !== 'undefined' && RunManager.nodes.length > 0) {
            const node = RunManager.getCurrentNode();
            const label = node ? node.label : '';
            levelEl.textContent = `${RunManager.getProgressText()} ${label}`;
        } else {
            levelEl.textContent = `${GameState.currentLevel}/${GameState.maxLevels || 4}`;
        }
    }
}

function updateSpiritFrame() {
    const frame = document.getElementById('spirit-frame');
    const titleEl = document.getElementById('spirit-frame-title');
    const typeEl = document.getElementById('spirit-frame-type');
    const statusEl = document.getElementById('spirit-frame-status');
    if (!frame || !titleEl || !typeEl || !statusEl) return;

    if (!GameState.spirit) {
        frame.className = 'spirit-frame none';
        frame.style.display = 'none';
        titleEl.textContent = '';
        typeEl.textContent = '';
        statusEl.textContent = '';
        return;
    }
    frame.style.display = '';

    const typeNameMap = {
        autonomous: '自律型',
        cooperative: '协力型',
        assistant: '助理型'
    };

    frame.className = `spirit-frame ${GameState.spirit.spiritType || 'none'}`;
    titleEl.textContent = GameState.spirit.name;
    typeEl.textContent = typeNameMap[GameState.spirit.spiritType] || '魂灵';
    statusEl.textContent = GameState.spirit.getStatusText ? GameState.spirit.getStatusText() : '';
}

// 渲染敌人意图（框体样式，与BUFF栏风格统一）
function updateEnemyIntent() {
    const enemyBox = document.getElementById('enemy-box');
    if (!enemyBox) return;

    // 无意图时移除
    if (!GameState.enemy || !GameState.enemy.nextAction) {
        const existing = enemyBox.querySelector('.enemy-intent-frame');
        if (existing) existing.remove();
        // 也清理旧版意图
        const oldIntent = enemyBox.querySelector('.enemy-intent');
        if (oldIntent) oldIntent.remove();
        return;
    }

    // 清理旧版意图（如果存在）
    const oldIntent = enemyBox.querySelector('.enemy-intent');
    if (oldIntent) oldIntent.remove();

    let frame = enemyBox.querySelector('.enemy-intent-frame');
    if (!frame) {
        frame = document.createElement('div');
        frame.className = 'enemy-intent-frame';

        const iconEl = document.createElement('span');
        iconEl.className = 'intent-frame-icon';
        frame.appendChild(iconEl);

        const valueEl = document.createElement('span');
        valueEl.className = 'intent-frame-value';
        frame.appendChild(valueEl);

        const tooltip = document.createElement('div');
        tooltip.className = 'intent-frame-tooltip';
        frame.appendChild(tooltip);

        enemyBox.appendChild(frame);
    }

    const action = GameState.enemy.nextAction;

    // 更新框体类型 class（控制边框颜色）
    frame.className = `enemy-intent-frame ${action.type || 'attack'}`;

    // 图标
    frame.querySelector('.intent-frame-icon').textContent = action.icon;

    // 数值
    const valueEl = frame.querySelector('.intent-frame-value');
    if (action.type === 'attack') {
        let dmg = action.value;
        let valueClass = 'intent-frame-value attack';

        // 判官削弱
        if (GameState.player && GameState.player.classId === 'balance') {
            const debuffMult = GameState.player.getEnemyDebuffMultiplier ? GameState.player.getEnemyDebuffMultiplier() : 1.0;
            if (debuffMult < 1.0) {
                dmg = Math.floor(dmg * debuffMult);
                valueClass = 'intent-frame-value muted';
            }
        }
        valueEl.textContent = dmg;
        valueEl.className = valueClass;
    } else if (action.value > 0) {
        valueEl.textContent = action.value;
        valueEl.className = 'intent-frame-value heal';
    } else {
        valueEl.textContent = '';
        valueEl.className = 'intent-frame-value';
    }

    // Tooltip
    frame.querySelector('.intent-frame-tooltip').textContent = action.desc;
}

// BUFF栏更新
function updateBuffBars() {
    updatePlayerBuffs();
    updateEnemyBuffs();
}

function updatePlayerBuffs() {
    const buffBar = document.getElementById('player-buff-bar');
    if (!buffBar || !GameState.player) return;
    
    buffBar.innerHTML = '';
    const buffs = [];

    // 剑圣：疾风
    if (GameState.player.classId === 'combo' && GameState.player.speedStacks > 0) {
        const stacks = GameState.player.speedStacks;
        const atkBonus = stacks >= 10 ? '，满层+20%攻击' : '';
        buffs.push({
            id: 'gale',
            name: '疾风',
            type: 'buff',
            icon: '💨',
            desc: `每层+10速度${atkBonus}（当前${stacks}层）`,
            stack: stacks
        });
    }

    // 魔导：盈能
    if (GameState.player.classId === 'mana' && GameState.player.stacks > 0) {
        const stacks = GameState.player.stacks;
        buffs.push({
            id: 'overflow',
            name: '盈能',
            type: 'buff',
            icon: '⚡',
            desc: `每层+5%攻击力（当前${stacks}层，上限5层）`,
            stack: stacks
        });
    }

    // 判官：极值状态
    if (GameState.player.classId === 'balance' && GameState.player.extremeState) {
        const isYang = GameState.player.extremeState === 'yang';
        buffs.push({
            id: 'extreme_state',
            name: isYang ? '阳极' : '阴极',
            type: 'buff',
            icon: isYang ? '☀' : '🌑',
            desc: isYang ? '阳极激活！技能获得极值增强，宣判可用' : '阴极激活！技能获得极值增强，宣判可用',
            stack: null
        });
    }

    // 判官：极值CD
    if (GameState.player.classId === 'balance' && GameState.player.extremeCD > 0) {
        buffs.push({
            id: 'extreme_cd',
            name: '极值冷却',
            type: 'debuff',
            icon: '⏳',
            desc: `极值状态冷却中（剩余${GameState.player.extremeCD}次行动）`,
            stack: GameState.player.extremeCD
        });
    }

    // 判官：平衡增益(阳面)
    if (GameState.player.classId === 'balance') {
        const bal = GameState.player.resources.balance.val;
        if (bal > 0) {
            buffs.push({
                id: 'balance_buff',
                name: '阳面',
                type: 'buff',
                icon: '☯',
                desc: `全属性提升 ${bal * 10}%`,
                stack: bal
            });
        }
    }

    // 渲染BUFF图标
    buffs.forEach(buff => {
        const icon = document.createElement('div');
        icon.className = `buff-icon ${buff.type}`;
        icon.textContent = buff.icon;
        
        if (buff.stack !== null && buff.stack > 0) {
            const stackBadge = document.createElement('div');
            stackBadge.className = 'buff-stack';
            stackBadge.textContent = buff.stack;
            icon.appendChild(stackBadge);
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'buff-tooltip';
        const name = document.createElement('div');
        name.className = 'buff-tooltip-name';
        name.textContent = buff.name;
        tooltip.appendChild(name);
        const desc = document.createElement('div');
        desc.className = 'buff-tooltip-desc';
        desc.textContent = buff.desc;
        tooltip.appendChild(desc);
        icon.appendChild(tooltip);

        buffBar.appendChild(icon);
    });
}

function updateEnemyBuffs() {
    const buffBar = document.getElementById('enemy-buff-bar');
    if (!buffBar || !GameState.enemy) return;
    
    buffBar.innerHTML = '';
    const effects = [];

    // 内伤
    if (GameState.enemy.internalInjury > 0) {
        effects.push({
            id: 'internalInjury',
            name: '内伤',
            type: 'debuff',
            icon: '💀',
            desc: `受到的攻击伤害提升30%（剩余${GameState.enemy.internalInjury}回合）`,
            stack: GameState.enemy.internalInjury
        });
    }

    // 判官：阴面减益（显示在敌方）
    if (GameState.player && GameState.player.classId === 'balance') {
        const bal = GameState.player.resources.balance.val;
        if (bal < 0) {
            const penalty = (Math.abs(bal) * 10).toFixed(0);
            effects.push({
                id: 'balance_debuff',
                name: '阴面',
                type: 'debuff',
                icon: '🌙',
                desc: `攻防降低 ${penalty}%`,
                stack: Math.abs(bal)
            });
        }
    }

    // 护盾显示
    if (GameState.enemy.shield && GameState.enemy.shield > 0) {
        effects.push({
            id: 'shield',
            name: '护盾',
            type: 'buff',
            icon: '🛡',
            desc: `护盾值 ${Math.floor(GameState.enemy.shield)}`,
            stack: Math.floor(GameState.enemy.shield)
        });
    }

    // 通用 Buff/Debuff/DOT 显示
    if (GameState.enemy.buffs && GameState.enemy.buffs.length > 0) {
        GameState.enemy.buffs.forEach((buff, index) => {
            const typeClass = (buff.type === 'debuff' || buff.type === 'dot') ? 'debuff' : 'buff';
            let icon = '✨';
            if (buff.type === 'dot') icon = '☠';
            if (buff.stat === 'atk') icon = '🗡';
            if (buff.stat === 'def') icon = '🛡';
            if (buff.stat === 'speed') icon = '💨';

            let desc = buff.desc || '';
            if (!desc && buff.stat) {
                const percent = Math.abs(buff.value) <= 1 ? Math.round(Math.abs(buff.value) * 100) : Math.round(Math.abs(buff.value));
                const sign = buff.value >= 0 ? '+' : '-';
                desc = `${buff.stat.toUpperCase()} ${sign}${percent}%`;
            }
            if (buff.duration !== undefined && buff.duration >= 0) {
                desc += desc ? `（剩余${buff.duration}回合）` : `剩余${buff.duration}回合`;
            }

            effects.push({
                id: `buff_${index}`,
                name: buff.name || '状态',
                type: typeClass,
                icon,
                desc,
                stack: buff.stacks || null
            });
        });
    }

    // 渲染图标
    effects.forEach(effect => {
        const icon = document.createElement('div');
        icon.className = `buff-icon ${effect.type}`;
        icon.textContent = effect.icon;
        
        if (effect.stack !== null && effect.stack > 0) {
            const stackBadge = document.createElement('div');
            stackBadge.className = 'buff-stack';
            stackBadge.textContent = effect.stack;
            icon.appendChild(stackBadge);
        }

        const tooltip = document.createElement('div');
        tooltip.className = 'buff-tooltip';
        const name = document.createElement('div');
        name.className = 'buff-tooltip-name';
        name.textContent = effect.name;
        tooltip.appendChild(name);
        const desc = document.createElement('div');
        desc.className = 'buff-tooltip-desc';
        desc.textContent = effect.desc;
        tooltip.appendChild(desc);
        icon.appendChild(tooltip);

        buffBar.appendChild(icon);
    });
}

// 资源 UI 渲染
function updateResourceUI() {
    const panel = document.getElementById('resource-panel');
    if (!panel) return;
    panel.innerHTML = '<div class="resource-panel-title">资源</div>';
    
    if (!GameState.player) return;

    const resources = GameState.player.resources;
    const classId = GameState.player.classId;
    
    // 职业颜色映射
    const classColors = {
        'qi': 'qi',
        'combo': 'combo',
        'mana': 'mana',
        'balance': 'balance'
    };
    const colorClass = classColors[classId] || 'qi';
    
    // 根据角色类型渲染不同的资源显示
    if (GameState.player.classId === 'balance') {
        // 判官：10格 + 中线，左5阴（紫），右5阳（白/暖）
        const balance = resources.balance;
        const display = document.createElement('div');
        display.className = 'resource-display';
        display.style.flexDirection = 'column';
        display.style.gap = '5px';

        const label = document.createElement('div');
        label.textContent = `${balance.name}: ${balance.val}`;
        label.style.cssText = 'font-size:11px;color:var(--text-secondary);letter-spacing:1px;';

        const grid = document.createElement('div');
        grid.className = 'resource-grid balance';

        // 左5格：阴 (对应 -5 到 -1)
        for (let i = 0; i < 5; i++) {
            const cell = document.createElement('div');
            cell.className = 'resource-cell';
            const threshold = -(5 - i); // -5, -4, -3, -2, -1
            if (balance.val <= threshold) {
                cell.classList.add('active', 'balance-yin');
            } else {
                cell.classList.add('inactive');
            }
            grid.appendChild(cell);
        }

        // 中线分隔
        const centerLine = document.createElement('div');
        centerLine.className = 'balance-center-line';
        grid.appendChild(centerLine);

        // 右5格：阳 (对应 +1 到 +5)
        for (let i = 0; i < 5; i++) {
            const cell = document.createElement('div');
            cell.className = 'resource-cell';
            const threshold = i + 1; // 1, 2, 3, 4, 5
            if (balance.val >= threshold) {
                cell.classList.add('active', 'balance-yang');
            } else {
                cell.classList.add('inactive');
            }
            grid.appendChild(cell);
        }

        display.appendChild(label);
        display.appendChild(grid);
        panel.appendChild(display);
    } else {
        // 其他角色：显示资源格子
        Object.keys(resources).forEach(key => {
            // 跳过弹药，弹药会单独处理
            if (key === 'ammo') return;
            
            const res = resources[key];
            const display = document.createElement('div');
            display.className = 'resource-display';
            display.style.flexDirection = 'column';
            display.style.gap = '5px';
            
            const label = document.createElement('div');
            label.textContent = res.name;
            label.style.cssText = 'font-size:11px;color:var(--text-secondary);letter-spacing:1px;';
            
            // 创建10个格子
            const grid = document.createElement('div');
            grid.className = `resource-grid ${colorClass}`;
            
            const maxCells = res.max || 10;
            for (let i = 0; i < maxCells; i++) {
                const cell = document.createElement('div');
                cell.className = `resource-cell ${colorClass}`;
                if (i < res.val) {
                    cell.classList.add('active');
                } else {
                    cell.classList.add('inactive');
                }
                grid.appendChild(cell);
            }
            
            display.appendChild(label);
            display.appendChild(grid);
            panel.appendChild(display);
        });
        
        // 如果有弹药资源，单独显示一行（只显示已有弹药，不显示空位）
        if (resources.ammo) {
            const ammoRes = resources.ammo;
            const ammoDisplay = document.createElement('div');
            ammoDisplay.className = 'resource-display';
            ammoDisplay.style.flexDirection = 'column';
            ammoDisplay.style.gap = '5px';
            
            const ammoLabel = document.createElement('div');
            ammoLabel.textContent = ammoRes.name;
            ammoLabel.style.cssText = 'font-size:11px;color:var(--text-secondary);letter-spacing:1px;';
            
            const ammoGrid = document.createElement('div');
            ammoGrid.className = `resource-grid ${colorClass}`;
            
            // 只显示已有弹药，不显示空位
            for (let i = 0; i < ammoRes.val; i++) {
                const cell = document.createElement('div');
                cell.className = `resource-cell ${colorClass} active`;
                ammoGrid.appendChild(cell);
            }
            
            ammoDisplay.appendChild(ammoLabel);
            ammoDisplay.appendChild(ammoGrid);
            panel.appendChild(ammoDisplay);
        }
    }
    
}

// 收集当前职业的所有追加技能（去重）
function getClassFollowUpSkills(classId) {
    if (typeof FollowUpTriggers === 'undefined' || typeof FollowUpSkillDefs === 'undefined') return [];
    const triggers = FollowUpTriggers[classId];
    if (!triggers) return [];
    const seen = new Set();
    const result = [];
    Object.values(triggers).forEach(config => {
        config.skills.forEach(id => {
            if (!seen.has(id) && FollowUpSkillDefs[id]) {
                seen.add(id);
                result.push(FollowUpSkillDefs[id]);
            }
        });
    });
    return result;
}

// 资源 key → 颜色（用于 cost cell 上色）
const _resourceColorMap = {
    'qi': '#ff4d4d',
    'combo': '#ffcc00',
    'mana': '#3399ff',
    'ammo': '#3399ff',
    'balance': '#9933ff'
};

// 渲染消耗格子到容器，返回是否有消耗
function _renderCostCells(costObj, fallbackColor, container) {
    let hasCost = false;
    Object.keys(costObj).forEach(key => {
        const val = costObj[key];
        const color = _resourceColorMap[key] || fallbackColor;
        if (val === 'all') {
            const allCost = GameState.player.resources[key]?.val || 0;
            for (let i = 0; i < Math.min(allCost, 10); i++) {
                hasCost = true;
                const c = document.createElement('div');
                c.className = 'skill-cost-cell';
                c.style.background = color;
                c.style.borderColor = color;
                c.style.boxShadow = `0 0 4px ${color}55`;
                container.appendChild(c);
            }
        } else if (val > 0) {
            hasCost = true;
            for (let i = 0; i < Math.min(val, 10); i++) {
                const c = document.createElement('div');
                c.className = 'skill-cost-cell';
                c.style.background = color;
                c.style.borderColor = color;
                c.style.boxShadow = `0 0 4px ${color}55`;
                container.appendChild(c);
            }
        }
    });
    return hasCost;
}

// 技能 UI 渲染
function updateSkillsUI() {
    const panel = document.getElementById('skills-panel');
    if (!panel) return;

    // 追加选择中时保留现有 DOM 不重建
    if (panel.dataset.followUpLock === '1') return;

    panel.innerHTML = '';
    if (!GameState.player) return;

    const isFollowUpPending = !!GameState.followUpPending;
    const pendingIds = isFollowUpPending
        ? GameState.followUpPending.followUps.map(f => f.id)
        : [];
    const canAct = GameState.isPlayerTurn && !GameState.isProcessingSkill && !isFollowUpPending;

    // ─── 被动区 ───
    if (GameState.player.passive) {
        const passiveCard = document.createElement('div');
        passiveCard.className = 'skill-card skill-card-passive';

        const passiveIcon = document.createElement('div');
        passiveIcon.className = 'skill-icon passive-icon';
        passiveIcon.textContent = '🛡';
        passiveCard.appendChild(passiveIcon);

        const passiveName = document.createElement('div');
        passiveName.className = 'skill-name-display';
        passiveName.textContent = '被动';
        passiveCard.appendChild(passiveName);

        const noCost = document.createElement('div');
        noCost.className = 'skill-cost-label';
        noCost.textContent = '被动';
        passiveCard.appendChild(noCost);

        const passiveTooltip = document.createElement('div');
        passiveTooltip.className = 'skill-tooltip';
        passiveTooltip.innerHTML = `<div class="tooltip-name">被动技能</div><div class="tooltip-desc">${GameState.player.passive.desc}</div>`;
        passiveCard.appendChild(passiveTooltip);

        panel.appendChild(passiveCard);

        // 被动与主动之间的分隔线
        const div0 = document.createElement('div');
        div0.className = 'skill-section-divider';
        panel.appendChild(div0);
    }

    // ─── 主动技能区 ───
    const skillIcons = { attack: '⚔', special: '✨', Ultimate: '💥' };
    const skillTypeNames = { attack: '攻击', special: '特技', Ultimate: '能量技' };
    const classId = GameState.player.classId;
    const colorClass = classId || 'qi';

    GameState.player.skills.forEach((skill, skillIndex) => {
        const card = document.createElement('div');
        card.className = 'skill-card';

        if (!GameState.player.canUseSkill(skill)) {
            card.classList.add('disabled');
            if (skill.currentCooldown > 0) {
                const cdOverlay = document.createElement('div');
                cdOverlay.className = 'skill-cd-overlay';
                cdOverlay.textContent = skill.currentCooldown;
                card.appendChild(cdOverlay);
            }
        }

        if (!canAct) {
            card.classList.add('disabled');
            card.style.opacity = '0.5';
            card.style.pointerEvents = 'none';
        }

        card.onclick = () => {
            if (canAct && GameState.player.canUseSkill(skill)) {
                if (typeof AudioManager !== 'undefined') AudioManager.playUi('confirm');
                usePlayerSkill(skill.id);
            }
        };
        if (typeof AudioManager !== 'undefined') AudioManager.bindUiSound(card, { hover: 'hover' });

        const icon = document.createElement('div');
        icon.className = 'skill-icon';
        if (skill.name && skill.name.includes('强化')) icon.classList.add('enhanced');
        icon.textContent = skillIcons[skill.type] || '⚔';
        card.appendChild(icon);

        const nameDisplay = document.createElement('div');
        nameDisplay.className = 'skill-name-display';
        nameDisplay.textContent = skill.name;
        card.appendChild(nameDisplay);

        // 消耗格子
        const costGrid = document.createElement('div');
        costGrid.className = 'skill-cost-grid';

        let hasCost = false;
        if (skill.balanceShift) {
            hasCost = true;
            const shiftValue = Math.abs(skill.balanceShift);
            for (let i = 0; i < shiftValue; i++) {
                const cell = document.createElement('div');
                cell.className = 'skill-cost-cell balance';
                cell.style.background = skill.balanceShift > 0 ? '#ffffff' : '#9933ff';
                cell.style.borderColor = skill.balanceShift > 0 ? '#ffffff' : '#9933ff';
                costGrid.appendChild(cell);
            }
        }
        const rendered = _renderCostCells(skill.cost, _resourceColorMap[colorClass] || '#00d4ff', costGrid);
        hasCost = hasCost || rendered;

        if (!hasCost) {
            const noCost = document.createElement('div');
            noCost.className = 'skill-cost-label';
            noCost.textContent = '无';
            costGrid.appendChild(noCost);
        }
        card.appendChild(costGrid);

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'skill-tooltip';
        const tooltipName = document.createElement('div');
        tooltipName.className = 'tooltip-name';
        tooltipName.textContent = skill.name;
        tooltip.appendChild(tooltipName);
        const tooltipType = document.createElement('div');
        tooltipType.className = 'tooltip-type';
        tooltipType.textContent = skillTypeNames[skill.type] || skill.type || '技能';
        tooltip.appendChild(tooltipType);
        const tooltipDesc = document.createElement('div');
        tooltipDesc.className = 'tooltip-desc';
        if (skill.desc) {
            tooltipDesc.textContent = skill.desc;
        } else {
            let pct = 0;
            if (skill.baseMultiplier) pct = skill.baseMultiplier * 100;
            else if (skill.damage && GameState.player && skill.id !== 'finisher') pct = skill.damage / GameState.player.baseAtk * 100;
            if (pct > 0 && skill.id !== 'finisher') {
                tooltipDesc.textContent = (skill.hits && skill.hits > 1)
                    ? `${skill.hits} x ${pct.toFixed(0)}% 攻击力伤害`
                    : `造成 ${pct.toFixed(0)}% 攻击力伤害`;
            } else if (skill.effect) {
                tooltipDesc.textContent = `效果: ${skill.effect}`;
            }
        }
        tooltip.appendChild(tooltipDesc);
        card.appendChild(tooltip);

        const keyHint = document.createElement('div');
        keyHint.className = 'skill-key-hint';
        keyHint.textContent = skillIndex + 1;
        card.appendChild(keyHint);

        panel.appendChild(card);
    });

    // ─── 追加技能区 ───
    const followUps = getClassFollowUpSkills(classId);
    if (followUps.length === 0) return;

    const divider = document.createElement('div');
    divider.className = 'skill-section-divider';
    panel.appendChild(divider);

    followUps.forEach(fu => {
        const isLit = pendingIds.includes(fu.id);
        const canAfford = fu.canUse(GameState.player);

        const card = document.createElement('div');
        card.className = 'skill-card followup-skill';

        if (isLit && canAfford) {
            card.classList.add('followup-active');
        } else {
            card.classList.add('disabled');
        }

        // 图标
        const icon = document.createElement('div');
        icon.className = 'skill-icon followup-icon-style';
        icon.textContent = fu.icon || '⚡';
        card.appendChild(icon);

        // 名称
        const nameEl = document.createElement('div');
        nameEl.className = 'skill-name-display';
        nameEl.textContent = fu.name;
        card.appendChild(nameEl);

        // 消耗格子
        const costGrid = document.createElement('div');
        costGrid.className = 'skill-cost-grid';
        if (fu.cost) {
            const rendered = _renderCostCells(fu.cost, _resourceColorMap[colorClass] || '#00d4ff', costGrid);
            if (!rendered) {
                const l = document.createElement('div');
                l.className = 'skill-cost-label';
                l.textContent = '无';
                costGrid.appendChild(l);
            }
        }
        card.appendChild(costGrid);

        // Tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'skill-tooltip';
        tooltip.innerHTML = `<div class="tooltip-name">${fu.name}</div><div class="tooltip-type">追加技能</div><div class="tooltip-desc">${fu.desc || ''}</div>`;
        card.appendChild(tooltip);

        // 点击
        if (isLit && canAfford) {
            card.addEventListener('click', () => {
                if (!GameState.followUpPending) return;
                const cb = GameState.followUpPending.callback;
                GameState.followUpPending = null;
                panel.dataset.followUpLock = '0';
                if (typeof AudioManager !== 'undefined') AudioManager.playUi('confirm');
                cb(fu);
            });
            if (typeof AudioManager !== 'undefined') AudioManager.bindUiSound(card, { hover: 'hover' });
        }

        panel.appendChild(card);
    });

    // 追加触发时：跳过按钮
    if (isFollowUpPending) {
        panel.dataset.followUpLock = '1';
        const skipBtn = document.createElement('button');
        skipBtn.className = 'followup-skip-btn';
        skipBtn.textContent = '✕';
        skipBtn.title = '跳过追加技能';
        if (typeof AudioManager !== 'undefined') AudioManager.bindUiSound(skipBtn, { hover: 'hover', click: 'skip' });
        skipBtn.addEventListener('click', () => {
            if (!GameState.followUpPending) return;
            const cb = GameState.followUpPending.callback;
            GameState.followUpPending = null;
            panel.dataset.followUpLock = '0';
            cb(null);
        });
        panel.appendChild(skipBtn);
    }
}

// 升级选择 UI
function openUpgradeOverlay(options, onSelectCallback) {
    const overlay = document.getElementById('upgrade-overlay');
    const container = document.getElementById('upgrade-options');
    if (!overlay || !container) return;

    if (typeof AudioManager !== 'undefined') {
        AudioManager.playUi('open');
    }

    GameState.isUpgradeOpen = true;
    GameState.isPaused = true;
    GameState.upgradeOptions = options || [];
    overlay.style.pointerEvents = 'auto';

    container.innerHTML = '';
    
    // 如果没有选项，显示"继续"按钮
    if (GameState.upgradeOptions.length === 0) {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.style.textAlign = 'center';
        card.innerHTML = '<div class="upgrade-name">继续前进</div><div class="upgrade-desc">无可用强化</div>';
        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(card, { hover: 'hover', click: 'confirm' });
        }
        card.onclick = () => {
             if (onSelectCallback) onSelectCallback(null);
             else closeUpgradeOverlay();
        };
        container.appendChild(card);
    }

    GameState.upgradeOptions.forEach(option => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        // 添加稀有度 class（驱动边框流光效果）
        if (option.rarity) {
            card.classList.add(`rarity-${option.rarity}`);
        }
        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(card, { hover: 'hover', click: 'confirm' });
        }
        card.onclick = () => {
            if (onSelectCallback) {
                onSelectCallback(option);
            } else {
                applyUpgrade(option);
                closeUpgradeOverlay();
            }
        };

        // 图标（样式由 CSS 稀有度 class 控制）
        if (option.icon) {
            const iconEl = document.createElement('div');
            iconEl.className = 'upgrade-icon';
            iconEl.textContent = option.icon;
            card.appendChild(iconEl);
        }

        const name = document.createElement('div');
        name.className = 'upgrade-name';
        const nameText = option.displayName || option.name;
        const rarityBadge = option.rarity ? ` <span class="upgrade-rarity-badge ${option.rarity}">${option.rarity}</span>` : '';
        name.innerHTML = `${nameText}${rarityBadge}`;
        card.appendChild(name);

        const desc = document.createElement('div');
        desc.className = 'upgrade-desc';
        desc.innerHTML = option.displayDesc || option.desc;
        card.appendChild(desc);

        // 职业标签
        if (option.classes && option.classes.length > 0) {
            const tag = document.createElement('div');
            tag.className = 'upgrade-class-tag';
            const classNames = { qi: '气宗', combo: '剑圣', mana: '魔导', balance: '判官' };
            tag.textContent = classNames[option.classes[0]] || '';
            card.appendChild(tag);
        }

        container.appendChild(card);
    });

    // 处理"跳过"按钮
    const skipBtn = document.getElementById('upgrade-skip');
    if (skipBtn) {
        // 移除旧的监听器（如果存在）
        const newSkipBtn = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);

        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(newSkipBtn, { hover: 'hover', click: 'skip' });
        }
        
        // 添加新的监听器
        newSkipBtn.addEventListener('click', () => {
            if (onSelectCallback) {
                onSelectCallback(null); // 传递 null 表示跳过
            } else {
                closeUpgradeOverlay();
            }
        });
    }

    overlay.classList.remove('hidden');
}

function closeUpgradeOverlay() {
    const overlay = document.getElementById('upgrade-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.pointerEvents = 'none';
    }
    if (typeof AudioManager !== 'undefined') {
        AudioManager.playUi('close');
    }
    GameState.isUpgradeOpen = false;
    GameState.isPaused = false;
    GameState.upgradeOptions = [];
}
