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
    updateDebugIndicator();
    updateSkillDamageStatsPanel();

    // 更新关卡显示（使用 RunManager 分支地图）
    const levelEl = document.getElementById('level-count');
    if (levelEl) {
        if (typeof RunManager !== 'undefined' && RunManager.acts.length > 0) {
            const node = RunManager.getCurrentNode();
            const label = node ? node.label : '';
            const actText = (typeof RunManager.getActText === 'function') ? RunManager.getActText() : '';
            levelEl.textContent = `${actText} · ${label}`;
        } else {
            levelEl.textContent = `${GameState.currentLevel}/${GameState.maxLevels || 4}`;
        }
    }

    // 同步战斗背景：按 currentLevel(1..4) 切换 main-stage 的背景图
    updateBattleBackground();
    // 同步玩家立绘：按 player.classId 切换
    updatePlayerPortrait();
}

// 战斗背景按关卡切换；超出 1..4 则循环回 1
function updateBattleBackground() {
    const stageEl = document.querySelector('.main-stage');
    if (!stageEl) return;
    const lvl = Math.max(1, Number(GameState.currentLevel) || 1);
    const stageIdx = ((lvl - 1) % 4) + 1;
    if (stageEl.dataset.stage !== String(stageIdx)) {
        stageEl.dataset.stage = String(stageIdx);
    }
}

// 玩家立绘按职业切换
const PLAYER_PORTRAIT_MAP = {
    qi:      'assets/art/portraits/portrait_qi.png',
    combo:   'assets/art/portraits/portrait_combo.png',
    mana:    'assets/art/portraits/portrait_mana.png',
    balance: 'assets/art/portraits/portrait_balance.png',
};
function updatePlayerPortrait() {
    const img = document.getElementById('player-portrait');
    const box = document.getElementById('player-box');
    if (!img || !box) return;
    const classId = GameState.player && GameState.player.classId;
    const src = PLAYER_PORTRAIT_MAP[classId];
    if (!src) {
        img.removeAttribute('src');
        img.classList.remove('loaded');
        box.classList.remove('has-portrait');
        img.removeAttribute('data-class');
        return;
    }
    // 仅当 src 真正变化时更新（避免每帧 reload 闪烁）
    if (img.dataset.class !== classId) {
        img.dataset.class = classId;
        img.classList.remove('loaded');
        img.onload = () => img.classList.add('loaded');
        img.src = src;
        box.classList.add('has-portrait');
    }
}

function updateSkillDamageStatsPanel() {
    const host = document.getElementById('damage-stats-panel');
    const list = document.getElementById('damage-stats-list');
    if (!host || !list) return;

    const show =
        GameState.isRunning &&
        GameState.player &&
        GameState.enemy &&
        GameState.skillDamageStats &&
        GameState.skillDamageStats.entries;

    if (!show) {
        host.style.display = 'none';
        list.innerHTML = '';
        return;
    }

    host.style.display = 'flex';
    const { entries, order } = GameState.skillDamageStats;
    const rows = order
        .map(key => ({ key, label: entries[key].label, total: entries[key].total }))
        .filter(r => r.total > 0)
        .sort((a, b) => b.total - a.total);

    list.innerHTML = '';
    if (rows.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'damage-stats-empty';
        empty.textContent = '尚无伤害记录';
        list.appendChild(empty);
        return;
    }

    rows.forEach(r => {
        const row = document.createElement('div');
        row.className = 'damage-stats-row';
        const nameEl = document.createElement('span');
        nameEl.className = 'damage-stats-name';
        nameEl.textContent = r.label;
        nameEl.title = r.label;
        const numEl = document.createElement('span');
        numEl.className = 'damage-stats-num';
        numEl.textContent = Math.round(r.total).toString();
        row.appendChild(nameEl);
        row.appendChild(numEl);
        list.appendChild(row);
    });
}

function updateDebugIndicator() {
    if (typeof document === 'undefined') return;
    let el = document.getElementById('debug-indicator');
    if (!el) {
        el = document.createElement('div');
        el.id = 'debug-indicator';
        el.style.cssText = [
            'position: fixed',
            'top: 12px',
            'right: 12px',
            'z-index: 9999',
            'padding: 6px 10px',
            'border: 1px solid #ffcc00',
            'border-radius: 6px',
            'background: rgba(0, 0, 0, 0.75)',
            'color: #ffcc00',
            'font-size: 12px',
            'font-weight: 700',
            'letter-spacing: 0.6px',
            'box-shadow: 0 0 8px rgba(255, 204, 0, 0.35)',
            'pointer-events: none',
            'display: none'
        ].join(';');
        document.body.appendChild(el);
    }

    const enabled = (typeof isDebugModeEnabled === 'function') && isDebugModeEnabled();
    if (!enabled) {
        el.style.display = 'none';
        return;
    }

    el.textContent = 'DEBUG ON · 资源无限';
    el.style.display = 'block';
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
        const hits = action.hits || 1;
        valueEl.textContent = hits > 1 ? `${dmg}×${hits}` : dmg;
        valueEl.className = valueClass;
    } else if (action.value > 0) {
        // 小数值（0~1）视为百分比显示
        if (action.value > 0 && action.value < 1) {
            valueEl.textContent = Math.round(action.value * 100) + '%';
        } else {
            valueEl.textContent = action.value;
        }
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

    // 剑圣（旧）：疾风
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

    // 连击魂：疾风（由魂灵管理）
    const cSpirit = GameState.spirit;
    if (cSpirit && cSpirit.id === 'combo_spirit' && (cSpirit.state.galeStacks || 0) > 0) {
        const stacks = cSpirit.state.galeStacks;
        buffs.push({
            id: 'combo_spirit_gale',
            name: '疾风',
            type: 'buff',
            icon: '⚡',
            desc: `连击魂疾风：每层+10速度（当前${stacks}/10层）`,
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

    // 内伤（新系统：气息魂管理，spiritInjury字段）
    if ((GameState.enemy.spiritInjury || 0) > 0) {
        const vuln = GameState.enemy.spiritInjuryVuln || 1.2;
        const spirit = GameState.spirit;
        const isExplosion = spirit && spirit.state && spirit.state.branchMode === 'explosion';
        effects.push({
            id: 'spiritInjury',
            name: '内伤',
            type: 'debuff',
            icon: '💢',
            desc: isExplosion
                ? `内伤${GameState.enemy.spiritInjury}/3层。叠满时触发内爆（300%）`
                : `下次受击伤害+${Math.round((vuln - 1) * 100)}%（${GameState.enemy.spiritInjury}层）`,
            stack: GameState.enemy.spiritInjury
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

// 资源 key → 图标路径映射
const _resourceIconMap = {
    'qi': 'assets/art/icons/resources/res_qi_v2.png',
    'combo': 'assets/art/icons/resources/res_combo_v2.png',
    'mana': 'assets/art/icons/resources/res_mana_v2.png',
    'ammo': 'assets/art/icons/resources/res_ammo_v2.png',
    'balance': 'assets/art/icons/resources/res_balance_v2.png'
};

// 创建一个完整资源 block（图标 + 名称 + 格子条），统一容器
// resourceKey: 用于图标查找 + class 标记
// displayName: 显示在图标下方的名称
// gridEl: 已构建好的格子 DOM
// stateClass: 'empty' | 'full' | 'normal'，控制状态反馈样式
function _createResourceBlock(resourceKey, displayName, gridEl, stateClass = 'normal') {
    const block = document.createElement('div');
    block.className = `resource-block resource-block-${resourceKey} ${stateClass}`;

    const iconSrc = _resourceIconMap[resourceKey];
    if (iconSrc) {
        const icon = document.createElement('img');
        icon.src = iconSrc;
        icon.alt = resourceKey;
        icon.className = 'resource-block-icon';
        icon.draggable = false;
        block.appendChild(icon);
    }

    const name = document.createElement('div');
    name.className = 'resource-block-name';
    name.textContent = displayName;
    block.appendChild(name);

    if (gridEl) {
        const valueWrap = document.createElement('div');
        valueWrap.className = 'resource-block-value';
        valueWrap.appendChild(gridEl);
        block.appendChild(valueWrap);
    }

    return block;
}

// 根据值/上限判定状态
function _resourceState(val, max) {
    if (val <= 0) return 'empty';
    if (max && val >= max) return 'full';
    return 'normal';
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
    
    // 多资源横排容器
    const blocksRow = document.createElement('div');
    blocksRow.className = 'resource-blocks-row';

    if (GameState.player.classId === 'balance') {
        // 判官：阴阳双向，5阴+5阳，中线分隔。状态由 |val| 是否极值决定
        const balance = resources.balance;
        const grid = document.createElement('div');
        grid.className = 'resource-grid balance';

        for (let i = 0; i < 5; i++) {
            const cell = document.createElement('div');
            cell.className = 'resource-cell';
            const threshold = -(5 - i);
            if (balance.val <= threshold) {
                cell.classList.add('active', 'balance-yin');
            } else {
                cell.classList.add('inactive');
            }
            grid.appendChild(cell);
        }

        const centerLine = document.createElement('div');
        centerLine.className = 'balance-center-line';
        grid.appendChild(centerLine);

        for (let i = 0; i < 5; i++) {
            const cell = document.createElement('div');
            cell.className = 'resource-cell';
            const threshold = i + 1;
            if (balance.val >= threshold) {
                cell.classList.add('active', 'balance-yang');
            } else {
                cell.classList.add('inactive');
            }
            grid.appendChild(cell);
        }

        // 极值状态特殊反馈
        let stateClass = 'normal';
        if (balance.val >= 5) stateClass = 'full balance-yang-extreme';
        else if (balance.val <= -5) stateClass = 'full balance-yin-extreme';

        const block = _createResourceBlock('balance', balance.name, grid, stateClass);
        blocksRow.appendChild(block);
    } else {
        // 其他角色：每个资源一个 block
        Object.keys(resources).forEach(key => {
            if (key === 'ammo') return; // 弹药单独处理

            const res = resources[key];
            const grid = document.createElement('div');
            grid.className = `resource-grid ${colorClass}`;
            const maxCells = res.max || 10;
            for (let i = 0; i < maxCells; i++) {
                const cell = document.createElement('div');
                cell.className = `resource-cell ${colorClass}`;
                if (i < res.val) cell.classList.add('active');
                else cell.classList.add('inactive');
                grid.appendChild(cell);
            }
            const stateClass = _resourceState(res.val, res.max);
            const block = _createResourceBlock(key, res.name, grid, stateClass);
            blocksRow.appendChild(block);
        });

        // 弹药 block：金黄圆形，独立颜色与魔力区分
        if (resources.ammo) {
            const ammoRes = resources.ammo;
            const ammoGrid = document.createElement('div');
            ammoGrid.className = 'resource-grid ammo-grid';
            for (let i = 0; i < ammoRes.val; i++) {
                const cell = document.createElement('div');
                cell.className = 'resource-cell ammo active';
                ammoGrid.appendChild(cell);
            }
            const stateClass = ammoRes.val === 0 ? 'empty' : 'normal';
            const block = _createResourceBlock('ammo', ammoRes.name, ammoGrid, stateClass);
            blocksRow.appendChild(block);
        }
    }

    panel.appendChild(blocksRow);
}

// GM 锤子面板：填充当前职业可用的锤子和追加解锁升级
function updateGmHammerPanel() {
    const container = document.getElementById('gm-hammer-options');
    if (!container || !GameState.player) return;
    container.innerHTML = '';

    const classId = GameState.player.classId;
    // 收集气宗锤子升级
    const qiUpgrades = (typeof UpgradeConfig !== 'undefined' ? UpgradeConfig : []).filter(u =>
        u.classes && u.classes.includes(classId) &&
        (u.effect.kind === 'apply_hammer' || u.effect.kind === 'unlock_followup')
    );
    qiUpgrades.forEach(upg => {
        const btn = document.createElement('button');
        btn.style.cssText = 'background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-color);padding:2px 6px;cursor:pointer;font-size:11px;text-align:left;width:100%;border-radius:3px;';
        const isApplied = upg.effect.kind === 'apply_hammer'
            ? (GameState.hammers && GameState.hammers[_getHammerTargetSkill(upg.effect.hammerId)])
            : (GameState.player._unlockedFollowUps && GameState.player._unlockedFollowUps.has(upg.effect.followUpId));
        btn.textContent = (isApplied ? '✓ ' : '') + upg.name;
        btn.style.opacity = isApplied ? '0.5' : '1';
        if (!isApplied) {
            btn.onclick = () => {
                if (typeof applyUpgrade === 'function') {
                    applyUpgrade({ ...upg, displayName: upg.name, rarity: 'GM', effect: { ...upg.effect, totalValue: upg.effect.baseValue } });
                }
                updateGmHammerPanel();
                if (typeof updateSkillsUI === 'function') updateSkillsUI();
            };
        }
        container.appendChild(btn);
    });
}

function _getHammerTargetSkill(hammerId) {
    if (!hammerId || typeof HammerConfig === 'undefined') return '';
    for (const classHammers of Object.values(HammerConfig)) {
        for (const [skillId, hammers] of Object.entries(classHammers)) {
            if (hammers.find(h => h.id === hammerId)) return skillId;
        }
    }
    return '';
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
    'qi':      '#ff4d4d',   // 气 → 红
    'combo':   '#ffcc00',   // 连击 → 黄
    'mana':    '#3399ff',   // 魔力 → 蓝
    'ammo':    '#ffc107',   // 弹药 → 金黄（子弹色，与魔力区分）
    'balance': '#9933ff',   // 平衡 → 紫
    'gale':    '#00e5ff'    // 疾风 → 青
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
                c.className = `skill-cost-cell${key === 'ammo' ? ' ammo' : ''}`;
                c.style.background = color;
                c.style.borderColor = color;
                c.style.boxShadow = `0 0 4px ${color}55`;
                container.appendChild(c);
            }
        }
    });
    return hasCost;
}

// ─── 技能卡片构建工具 ───
function _buildSkillCard(skill, opts = {}) {
    const { canClick = false, onClick, colorClass = 'qi', index = -1, extraClass = '' } = opts;
    const skillIconImages = {
        attack: 'assets/art/icons/skill_types/type_attack_v2.png',
        special: 'assets/art/icons/skill_types/type_special_v2.png',
        Ultimate: 'assets/art/icons/skill_types/type_ultimate_v2.png',
        defense: 'assets/art/icons/skill_types/type_reload_v2.png',
        passive: 'assets/art/icons/skill_types/type_passive_v2.png',
        'spirit-auto': 'assets/art/icons/skill_types/type_followup_v2.png',
        'spirit-active': 'assets/art/icons/skill_types/type_special_v2.png'
    };
    const skillTypeNames = { attack: '攻击', special: '特技', Ultimate: '能量技', defense: '防御', passive: '被动', 'spirit-auto': '自动', 'spirit-active': '魂灵技' };

    const card = document.createElement('div');
    card.className = `skill-card${extraClass ? ' ' + extraClass : ''}`;
    if (!canClick) {
        card.classList.add('disabled');
        card.style.cursor = 'default';
        // 不在这里设 pointer-events:none，保留 hover 使 tooltip 可见
    }
    if (onClick && canClick) {
        card.onclick = () => { if (typeof AudioManager !== 'undefined') AudioManager.playUi('confirm'); onClick(); };
        if (typeof AudioManager !== 'undefined') AudioManager.bindUiSound(card, { hover: 'hover' });
    }

    const iconSrc = skill.icon && skill.icon.includes('/') ? skill.icon : (skillIconImages[skill.type] || skillIconImages.attack);
    const iconEl = document.createElement('div');
    iconEl.className = 'skill-icon';
    iconEl.innerHTML = `<img src="${iconSrc}" alt="" draggable="false">`;
    card.appendChild(iconEl);

    const nameEl = document.createElement('div');
    nameEl.className = 'skill-name-display';
    nameEl.textContent = skill.name;
    card.appendChild(nameEl);

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
            costGrid.appendChild(cell);
        }
    }
    if (skill.cost) hasCost = _renderCostCells(skill.cost, _resourceColorMap[colorClass] || '#00d4ff', costGrid) || hasCost;
    if (skill.cost && skill.costUnit) {
        const cl = document.createElement('div');
        cl.className = 'skill-cost-label';
        cl.textContent = `${skill.cost}${skill.costUnit}`;
        costGrid.appendChild(cl);
        hasCost = true;
    }
    if (!hasCost) {
        const nc = document.createElement('div');
        nc.className = 'skill-cost-label';
        nc.textContent = '无';
        costGrid.appendChild(nc);
    }
    card.appendChild(costGrid);

    const typeLabel = skillTypeNames[skill.type] || skill.type || '技能';
    const tooltip = document.createElement('div');
    tooltip.className = 'skill-tooltip';

    // 技能名
    const tName = document.createElement('div');
    tName.className = 'tooltip-name';
    tName.textContent = skill.name;
    tooltip.appendChild(tName);

    // 技能类型
    const tType = document.createElement('div');
    tType.className = 'tooltip-type';
    tType.textContent = typeLabel;
    tooltip.appendChild(tType);

    // 消耗（格子可视化）
    if (skill.cost && typeof skill.cost === 'object' && Object.keys(skill.cost).length > 0) {
        const tCostRow = document.createElement('div');
        tCostRow.className = 'tooltip-cost-row';
        const label = document.createElement('span');
        label.className = 'tooltip-cost-label';
        label.textContent = '消耗 ';
        tCostRow.appendChild(label);
        _renderCostCells(skill.cost, _resourceColorMap[colorClass] || '#00d4ff', tCostRow);
        tooltip.appendChild(tCostRow);
    } else if (skill.cost !== null && skill.cost !== undefined && skill.costUnit) {
        const tCostRow = document.createElement('div');
        tCostRow.className = 'tooltip-cost-row';
        tCostRow.innerHTML = `<span class="tooltip-cost-label">消耗 </span><span style="color:#ffcc44">${skill.cost}${skill.costUnit}</span>`;
        tooltip.appendChild(tCostRow);
    } else if (!skill.cost || (typeof skill.cost === 'object' && Object.keys(skill.cost).every(k => !(skill.cost[k])))) {
        const tCostRow = document.createElement('div');
        tCostRow.className = 'tooltip-cost-row';
        tCostRow.innerHTML = `<span class="tooltip-cost-label">消耗 </span><span style="color:rgba(255,255,255,0.3)">无</span>`;
        tooltip.appendChild(tCostRow);
    }

    // 技能效果
    if (skill.desc) {
        const tDesc = document.createElement('div');
        tDesc.className = 'tooltip-desc';
        tDesc.textContent = skill.desc;
        tooltip.appendChild(tDesc);
    }

    card.appendChild(tooltip);

    if (index >= 0) {
        const hint = document.createElement('div');
        hint.className = 'skill-key-hint';
        hint.textContent = index + 1;
        card.appendChild(hint);
    }
    return card;
}

// 技能 UI 渲染（4区块布局）
function updateSkillsUI() {
    const panel = document.getElementById('skills-panel');
    if (!panel) return;
    if (panel.dataset.followUpLock === '1') return;

    panel.innerHTML = '';
    if (!GameState.player) return;

    const isFollowUpPending = !!GameState.followUpPending;
    const pendingIds = isFollowUpPending ? GameState.followUpPending.followUps.map(f => f.id) : [];
    const isSpiritTurn = !!GameState.spiritTurnPending;
    const canAct = GameState.isPlayerTurn && !GameState.isProcessingSkill && !isFollowUpPending && !isSpiritTurn;

    const classId = GameState.player.classId;
    const colorClass = classId || 'qi';
    const spirit = GameState.spirit;

    // ══════════════════════════════════════════════════
    // 区块1：主动技能区
    // ══════════════════════════════════════════════════
    const activeBlock = document.createElement('div');
    activeBlock.className = 'skill-block active-block';

    const activeLabel = document.createElement('div');
    activeLabel.className = 'skill-block-label';
    activeLabel.textContent = '主动';
    activeBlock.appendChild(activeLabel);

    const activeGrid = document.createElement('div');
    activeGrid.className = 'active-skill-grid';

    GameState.player.skills.forEach((skill, skillIndex) => {
        const canUse = GameState.player.canUseSkill(skill);
        const card = _buildSkillCard(skill, {
            canClick: canAct && canUse,
            onClick: () => usePlayerSkill(skill.id),
            colorClass,
            index: skillIndex
        });
        if (!canUse) card.classList.add('disabled');
        if (!canAct) { card.classList.add('disabled'); card.style.opacity = '0.6'; card.style.pointerEvents = 'none'; }
        activeGrid.appendChild(card);
    });
    activeBlock.appendChild(activeGrid);

    // 追加选择时在主动区下方显示提示
    if (isFollowUpPending) {
        const hint = document.createElement('div');
        hint.className = 'followup-hint-bar';
        hint.textContent = '▼ 选择追加技能';
        activeBlock.appendChild(hint);
    }

    // ══════════════════════════════════════════════════
    // 区块3：追加技能区（中下）— 已解锁的追加技能
    // ══════════════════════════════════════════════════
    const followupBlock = document.createElement('div');
    followupBlock.className = 'skill-block followup-block';

    const followupLabel = document.createElement('div');
    followupLabel.className = 'skill-block-label';
    followupLabel.textContent = '追加';
    followupBlock.appendChild(followupLabel);

    const followupRow = document.createElement('div');
    followupRow.className = 'followup-row';

    // 收集已解锁的追加技能
    const allFollowUpDefs = typeof FollowUpSkillDefs !== 'undefined' ? FollowUpSkillDefs : {};
    const triggers = (typeof FollowUpTriggers !== 'undefined' && FollowUpTriggers[classId]) ? FollowUpTriggers[classId] : {};
    const seenFu = new Set();
    const unlockedFus = [];
    Object.values(triggers).forEach(cfg => {
        (cfg.skills || []).forEach(id => {
            if (!seenFu.has(id) && allFollowUpDefs[id]) {
                seenFu.add(id);
                const fu = allFollowUpDefs[id];
                // 仅显示已解锁的追加技能
                const isUnlocked = typeof fu.isUnlocked === 'function' ? fu.isUnlocked(GameState.player) : true;
                if (isUnlocked) unlockedFus.push(fu);
            }
        });
    });

    if (unlockedFus.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'skill-block-empty';
        empty.textContent = '暂无';
        followupRow.appendChild(empty);
    } else {
        unlockedFus.forEach(fu => {
            const isLit = isFollowUpPending && pendingIds.includes(fu.id);
            const canAfford = fu.canUse(GameState.player);
            const card = _buildSkillCard(
                { name: fu.name, type: 'followup', icon: fu.icon, desc: fu.desc, cost: fu.cost },
                {
                    canClick: isLit && canAfford,
                    onClick: () => {
                        if (!GameState.followUpPending) return;
                        const cb = GameState.followUpPending.callback;
                        GameState.followUpPending = null;
                        panel.dataset.followUpLock = '0';
                        cb(fu);
                    },
                    colorClass,
                    extraClass: 'followup-skill' + (isLit && canAfford ? ' followup-active' : '')
                }
            );
            followupRow.appendChild(card);
        });
    }

    // 追加触发时的跳过按钮
    if (isFollowUpPending) {
        panel.dataset.followUpLock = '1';
        const skipBtn = document.createElement('button');
        skipBtn.className = 'followup-skip-btn';
        skipBtn.textContent = '✕';
        skipBtn.title = '跳过追加';
        if (typeof AudioManager !== 'undefined') AudioManager.bindUiSound(skipBtn, { hover: 'hover', click: 'skip' });
        skipBtn.addEventListener('click', () => {
            if (!GameState.followUpPending) return;
            const cb = GameState.followUpPending.callback;
            GameState.followUpPending = null;
            panel.dataset.followUpLock = '0';
            cb(null);
        });
        followupRow.appendChild(skipBtn);
    }

    followupBlock.appendChild(followupRow);

    // ══════════════════════════════════════════════════
    // 魂灵区（右列，跨2行）：上=主动技能，下=被动效果
    // ══════════════════════════════════════════════════
    const spiritBlock = document.createElement('div');
    spiritBlock.className = 'skill-block spirit-block';
    if (isSpiritTurn) spiritBlock.classList.add('spirit-turn-active');

    // ── 魂灵主动子块（紫色框）──
    const spiritActiveSub = document.createElement('div');
    spiritActiveSub.className = 'spirit-active-sub';

    const spiritActiveLabel = document.createElement('div');
    spiritActiveLabel.className = 'skill-block-label';
    spiritActiveLabel.textContent = spirit ? spirit.name : '魂灵';
    spiritActiveSub.appendChild(spiritActiveLabel);

    const spiritSkills = (spirit && spirit.spiritSkills) ? spirit.spiritSkills : [];
    if (spiritSkills.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'skill-block-empty';
        empty.textContent = spirit ? '无主动技能' : '未契约';
        spiritActiveSub.appendChild(empty);
    } else {
        const spiritSkillRow = document.createElement('div');
        spiritSkillRow.className = 'spirit-skill-row';
        spiritSkills.forEach(sk => {
            const galeStacks = (spirit.state && spirit.state.galeStacks) || 0;
            const canUseSpiritSkill = isSpiritTurn && !sk.autoTrigger &&
                (sk.id === 'cs_slash_wind' ? galeStacks >= 2 : galeStacks >= 5);

            const card = _buildSkillCard(
                {
                    name: sk.name,
                    type: sk.autoTrigger ? 'spirit-auto' : 'spirit-active',
                    icon: sk.icon,
                    desc: sk.desc,
                    cost: null
                },
                {
                    canClick: canUseSpiritSkill,
                    onClick: () => _executeSpiritSkill(sk.id, spirit),
                    colorClass,
                    extraClass: sk.autoTrigger ? 'spirit-auto-skill' : (isSpiritTurn && canUseSpiritSkill ? 'spirit-skill-lit' : '')
                }
            );
            // 疾风消耗显示（连击魂）
            if (sk.cost !== undefined && sk.costUnit) {
                const costInfo = card.querySelector('.skill-cost-grid');
                if (costInfo) {
                    costInfo.innerHTML = '';
                    const cl = document.createElement('div');
                    cl.className = 'skill-cost-label';
                    cl.style.color = '#ffcc44';
                    cl.textContent = `${sk.cost}${sk.costUnit}`;
                    costInfo.appendChild(cl);
                }
            }
            spiritSkillRow.appendChild(card);
        });
        spiritActiveSub.appendChild(spiritSkillRow);
        // 连击魂：跳过按钮
        if (isSpiritTurn) {
            const skipBtn = document.createElement('button');
            skipBtn.className = 'followup-skip-btn spirit-skip-btn';
            skipBtn.textContent = '跳过';
            skipBtn.title = '不行动（保留疾风）';
            skipBtn.addEventListener('click', () => {
                if (GameState.spiritTurnPending && GameState.spiritTurnPending.callback) {
                    GameState.spiritTurnPending.callback();
                }
            });
            spiritActiveSub.appendChild(skipBtn);
        }
    }

    // ── 魂灵被动子块（蓝绿色框）──
    const spiritPassiveSub = document.createElement('div');
    spiritPassiveSub.className = 'spirit-passive-sub';

    const spiritPassiveLabel = document.createElement('div');
    spiritPassiveLabel.className = 'skill-block-label';
    spiritPassiveLabel.textContent = '被动';
    spiritPassiveSub.appendChild(spiritPassiveLabel);

    const passivesFromSpirit = (spirit && spirit.passives) ? spirit.passives : [];
    if (passivesFromSpirit.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'skill-block-empty';
        empty.textContent = spirit ? '无被动' : '—';
        spiritPassiveSub.appendChild(empty);
    } else {
        const passiveRow = document.createElement('div');
        passiveRow.style.cssText = 'display:flex;flex-direction:row;gap:5px;flex-wrap:wrap;align-items:stretch;';
        passivesFromSpirit.forEach(p => {
            const card = _buildSkillCard(
                { name: p.name, type: 'passive', icon: p.icon, desc: p.desc, cost: null },
                { canClick: false, colorClass }
            );
            card.classList.add('skill-card-passive');
            passiveRow.appendChild(card);
        });
        spiritPassiveSub.appendChild(passiveRow);
    }

    spiritBlock.appendChild(spiritActiveSub);
    spiritBlock.appendChild(spiritPassiveSub);

    // 组合3区块到面板（被动已合并进 spiritBlock，不再单独 append passiveBlock）
    panel.appendChild(activeBlock);
    panel.appendChild(followupBlock);
    panel.appendChild(spiritBlock);
}

// 执行连击魂的主动技能
function _executeSpiritSkill(skillId, spirit) {
    if (!spirit || !GameState.player || !GameState.enemy) return;
    const player = GameState.player;
    const galeStacks = spirit.state.galeStacks || 0;

    if (skillId === 'cs_slash_wind') {
        if (galeStacks < 2) return;
        spirit.state.galeStacks -= 2;
        // 更新玩家速度
        player.speed = player.baseSpeed + spirit.state.galeStacks * 10;
        const segments = spirit.state.slashUpgrade1 ? 3 : 2;
        const atk = getEffectivePlayerAtk(player);
        // 裂刃分支附加伤害
        const bladeBonus = spirit.state.branchBlade ? Math.floor(spirit.state.galeStacks / 3) * 0.6 : 0;
        Logger.log(`斩风！${segments}段×90%`, true);
        for (let i = 0; i < segments; i++) {
            setTimeout(() => applySpiritDamage(atk * (0.9 + bladeBonus), '斩风'), 80 + i * 150);
        }
        // 强化2：返还1层疾风
        if (spirit.state.slashUpgrade2) {
            spirit.state.galeStacks = Math.min(10, spirit.state.galeStacks + 1);
        }

    } else if (skillId === 'cs_dash_step') {
        if (galeStacks < 5) return;
        spirit.state.galeStacks -= 5;
        player.speed = player.baseSpeed + spirit.state.galeStacks * 10;
        const atk = getEffectivePlayerAtk(player);
        Logger.log('飞驰步！玩家立即再行动', true);
        setTimeout(() => {
            applySpiritDamage(atk * 1.0, '飞驰步');
            // 推进玩家行动条（立即再行动）
            if (typeof advanceUnitAV === 'function') advanceUnitAV(player, 1.0);
            // 强化2：攻击力+20%（1次行动）
            if (spirit.state.dashUpgrade2 && player) {
                player.addBuff({ name: '飞驰-攻击', type: 'buff', stat: 'atk', value: 0.2, duration: 1, desc: '攻击+20%（1次行动）' });
            }
            if (typeof updateUI === 'function') updateUI();
        }, 80);
    }

    if (typeof updateUI === 'function') updateUI();
    if (typeof updateBuffBars === 'function') setTimeout(updateBuffBars, 300);

    // 通知 spiritTurn 的 callback（继续 CTB 循环）
    setTimeout(() => {
        if (GameState.spiritTurnPending && GameState.spiritTurnPending.callback) {
            const cb = GameState.spiritTurnPending.callback;
            GameState.spiritTurnPending = null;
            cb();
        }
        if (typeof updateSkillsUI === 'function') updateSkillsUI();
    }, 500);
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

        // 关键词标签
        if (option.keywords && option.keywords.length > 0) {
            const kwContainer = document.createElement('div');
            kwContainer.className = 'upgrade-keywords';
            option.keywords.forEach(kw => {
                const kwTag = document.createElement('span');
                kwTag.className = 'upgrade-keyword-tag';
                kwTag.textContent = kw;
                kwContainer.appendChild(kwTag);
            });
            card.appendChild(kwContainer);
        }

        // 职业标签
        if (option.classes && option.classes.length > 0) {
            const tag = document.createElement('div');
            tag.className = 'upgrade-class-tag';
            const classNames = { qi: '气宗', combo: '剑圣', mana: '魔导', balance: '判官' };
            tag.textContent = classNames[option.classes[0]] || '';
            card.appendChild(tag);
        }

        // Tier标签
        if (option.tier && option.tier !== 'base') {
            const tierTag = document.createElement('div');
            tierTag.className = `upgrade-tier-tag tier-${option.tier}`;
            const tierNames = { synergy: '协同', keystone: '关键石', hammer: '魂印' };
            tierTag.textContent = tierNames[option.tier] || option.tier;
            card.appendChild(tierTag);
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
