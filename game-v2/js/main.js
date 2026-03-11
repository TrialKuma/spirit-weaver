// ==================== 初始化基础系统 ====================

const ctbSystem = new CTBSystem();
let loopStarted = false;

function setActiveTurn(type) {
    const playerBox = document.getElementById('player-box');
    const enemyBox = document.getElementById('enemy-box');
    if (playerBox) playerBox.classList.toggle('active-turn', type === 'player');
    if (enemyBox) enemyBox.classList.toggle('active-turn', type === 'enemy');
}

function removeUnitFromTimeline(unit) {
    if (!unit) return;
    const index = ctbSystem.units.findIndex(u => u === unit);
    if (index >= 0) ctbSystem.units.splice(index, 1);
}

function selectSpirit(spiritId) {
    if (GameState.spirit) {
        removeUnitFromTimeline(GameState.spirit);
    }
    GameState.spirit = createSpirit(spiritId);
    if (GameState.spirit) {
        const nameEl = document.getElementById('spirit-name');
        if (nameEl) nameEl.textContent = GameState.spirit.name;
        Logger.log(`契约魂灵: ${GameState.spirit.name}`, true);
        if (GameState.spirit.spiritType === 'autonomous' || GameState.spirit.timeline) {
            ctbSystem.addUnit(GameState.spirit);
        }
        if (typeof updateSpiritFrame === 'function') {
            updateSpiritFrame();
        }
        GameState.spirit.updateVisualState();
        updateUI();
    }
}

// ==================== 魂灵祭坛（战前选择场景） ====================

function showSpiritShrine(onChosen) {
    const overlay = document.getElementById('spirit-select-overlay');
    const optionsEl = document.getElementById('spirit-choice-options');
    const titleEl = document.getElementById('spirit-select-title');
    if (!overlay || !optionsEl) return;

    if (typeof AudioManager !== 'undefined') {
        AudioManager.playUi('open');
    }

    const { category, choices } = getRandomSpiritChoices();
    GameState.pendingSpiritChoices = choices;
    GameState.pendingSpiritCategory = category;

    const typeNameMap = {
        autonomous: '自律型',
        cooperative: '协力型',
        assistant: '助理型'
    };
    const typeColors = {
        autonomous: '#00d4ff',
        cooperative: '#ffd54f',
        assistant: '#ff6b9d'
    };
    const typeGlow = {
        autonomous: 'rgba(0, 212, 255, 0.15)',
        cooperative: 'rgba(255, 213, 79, 0.15)',
        assistant: 'rgba(255, 107, 157, 0.15)'
    };

    // 标记为祭坛模式（全屏独立场景）
    overlay.classList.add('shrine-mode');

    // 面板颜色跟随魂灵类型
    const panelEl = overlay.querySelector('.spirit-select-panel');
    if (panelEl) {
        panelEl.className = `spirit-select-panel ${category}`;
    }

    if (titleEl) {
        titleEl.textContent = '魂灵祭坛';
        titleEl.style.color = typeColors[category] || '#fff';
    }

    // 副标题
    let subtitleEl = overlay.querySelector('.spirit-select-subtitle');
    if (!subtitleEl) {
        subtitleEl = document.createElement('div');
        subtitleEl.className = 'spirit-select-subtitle';
        titleEl.parentNode.insertBefore(subtitleEl, optionsEl);
    }
    subtitleEl.textContent = `${typeNameMap[category]}魂灵响应了你的召唤，请选择一位缔结契约`;

    // 创建祭坛背景粒子容器
    let shrineParticles = overlay.querySelector('.shrine-particles');
    if (!shrineParticles) {
        shrineParticles = document.createElement('div');
        shrineParticles.className = 'shrine-particles';
        overlay.insertBefore(shrineParticles, overlay.firstChild);
    }
    // 生成浮动符文粒子
    shrineParticles.innerHTML = '';
    const runeSymbols = ['✦', '◈', '✧', '◇', '⟡', '⊹', '✵', '⋆'];
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'shrine-rune';
        p.textContent = runeSymbols[i % runeSymbols.length];
        p.style.left = Math.random() * 100 + '%';
        p.style.top = Math.random() * 100 + '%';
        p.style.animationDelay = (Math.random() * 6) + 's';
        p.style.animationDuration = (Math.random() * 4 + 4) + 's';
        p.style.color = typeColors[category] || '#00d4ff';
        p.style.opacity = '0';
        shrineParticles.appendChild(p);
    }

    // 构建魂灵卡片
    optionsEl.innerHTML = '';
    choices.forEach((spirit, index) => {
        const card = document.createElement('div');
        card.className = `spirit-choice-card ${spirit.spiritType}`;
        card.dataset.spiritId = spirit.id;
        // 入场延迟动画
        card.style.animationDelay = `${0.3 + index * 0.15}s`;

        // 图标
        const iconEl = document.createElement('div');
        iconEl.className = 'spirit-choice-icon';
        iconEl.textContent = spirit.icon || '✦';
        card.appendChild(iconEl);

        // 名称
        const nameEl = document.createElement('div');
        nameEl.className = 'spirit-choice-name';
        nameEl.textContent = spirit.name;
        card.appendChild(nameEl);

        // 类型标签
        const typeEl = document.createElement('div');
        typeEl.className = 'spirit-choice-type';
        typeEl.textContent = typeNameMap[spirit.spiritType];
        card.appendChild(typeEl);

        // 描述
        const descEl = document.createElement('div');
        descEl.className = 'spirit-choice-desc';
        descEl.textContent = spirit.desc;
        card.appendChild(descEl);

        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(card, { hover: 'hover', click: 'confirm' });
        }

        card.addEventListener('click', () => {
            // 契约动画：选中的卡片高亮脉冲，其他消散
            const allCards = optionsEl.querySelectorAll('.spirit-choice-card');
            allCards.forEach(c => {
                if (c === card) {
                    c.classList.add('spirit-chosen');
                } else {
                    c.classList.add('spirit-dismissed');
                }
            });

            // 选中后延迟关闭，播放契约效果
            setTimeout(() => {
                overlay.classList.add('shrine-exit');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('shrine-mode', 'shrine-exit');
                    // 清理粒子
                    if (shrineParticles) shrineParticles.innerHTML = '';
                    // 移除卡片动画class
                    allCards.forEach(c => c.classList.remove('spirit-chosen', 'spirit-dismissed'));

                    selectSpirit(spirit.id);
                    if (typeof onChosen === 'function') {
                        onChosen(spirit);
                    }
                }, 500);
            }, 800);
        });
        optionsEl.appendChild(card);
    });

    overlay.classList.remove('hidden');
}

// 兼容旧接口（战斗中的魂灵选择，目前已不使用）
function showSpiritChoice(onChosen) {
    showSpiritShrine(onChosen);
}

// 初始化选择界面（仅职业）
function initSelectionScreen() {
    const characterCards = document.querySelectorAll('.character-card');
    const startButton = document.getElementById('start-button');
    const statusDiv = document.getElementById('selection-status');

    const classNames = {
        'qi': '气宗',
        'combo': '剑圣',
        'mana': '魔导',
        'balance': '判官'
    };

    const footer = document.querySelector('.sel-footer');

    characterCards.forEach(card => {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(card, { hover: 'hover', click: 'select' });
        }
        card.addEventListener('click', () => {
            characterCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            GameState.selectedClass = card.dataset.class;
            updateSelectionStatus();
            checkSelection();
        });
    });

    if (startButton) {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(startButton, { hover: 'hover', click: 'confirm' });
        }
        startButton.addEventListener('click', () => {
            if (GameState.selectedClass) {
                startGame();
            }
        });
    }

    function updateSelectionStatus() {
        // 更新 footer 的职业 class（驱动按钮/文字变色）
        if (footer) {
            footer.classList.remove('class-qi', 'class-combo', 'class-mana', 'class-balance');
            if (GameState.selectedClass) {
                footer.classList.add('class-' + GameState.selectedClass);
            }
        }
        if (GameState.selectedClass) {
            statusDiv.innerHTML = `职业: <span class="selected-item">${classNames[GameState.selectedClass]}</span>`;
        } else {
            statusDiv.textContent = '请选择职业';
        }
    }

    function checkSelection() {
        if (startButton) {
            startButton.disabled = !GameState.selectedClass;
        }
    }

    updateSelectionStatus();
}

function startGame() {
    const selectionScreen = document.getElementById('selection-screen');
    if (selectionScreen) selectionScreen.classList.add('hidden');

    // 进入魂灵祭坛场景（战前选择）
    showSpiritShrine(() => {
        // 魂灵选定后，进入战斗
        const container = document.querySelector('.container');
        if (container) container.classList.add('visible');
        initGame();
    });
}

// 初始化游戏
function initGame() {
    GameState.isRunning = true;
    GameState.turnCount = 0;
    lastActingSide = null;
    ctbSystem.tickSpeed = CTB_NORMAL_SPEED;
    GameState.upgradesChosen = 0;
    GameState.upgradeLevels = {};
    GameState.isBattleEnded = false;

    // 使用 RunManager 生成流程
    RunManager.generateRun();
    GameState.currentLevel = 1;
    GameState.maxLevels = RunManager.nodes.length;
    
    document.getElementById('turn-count').textContent = 0;
    document.getElementById('log-panel').innerHTML = '<div class="log-entry">战斗开始...</div>';

    // 根据 RunManager 创建敌人
    const scaling = RunManager.getEnemyScaling();
    GameState.enemy = createTestEnemy();
    GameState.enemy.maxHp = Math.floor(GameState.enemy.maxHp * scaling.hpMult);
    GameState.enemy.hp = GameState.enemy.maxHp;
    GameState.enemy.baseAtk = Math.floor(GameState.enemy.baseAtk * scaling.atkMult);

    ctbSystem.units = []; // 清空之前的单位
    if (ctbSystem._elMap) { ctbSystem._elMap.clear(); }
    ctbSystem.addUnit(GameState.enemy);
    
    // 使用默认角色进入战斗
    selectClass(GameState.selectedClass || 'qi');

    // 魂灵已在战前选择，将自律型魂灵加入时间轴
    if (GameState.spirit) {
        if (GameState.spirit.spiritType === 'autonomous' || GameState.spirit.timeline) {
            ctbSystem.addUnit(GameState.spirit);
        }
    }
    
    initBattleBgOrbs();

    Logger.log('游戏初始化完成');
    if (typeof isDebugModeEnabled === 'function' && isDebugModeEnabled()) {
        Logger.log('DEBUG 模式已开启（资源无限）', true);
    }
    Logger.log(`关卡 ${GameState.currentLevel}/${GameState.maxLevels}`);
    if (GameState.spirit) {
        Logger.log(`契约魂灵: ${GameState.spirit.name}`);
    }
    if (!loopStarted) {
        loopStarted = true;
        gameLoop();
    }

    if (typeof AudioManager !== 'undefined') {
        const currentNode = (typeof RunManager !== 'undefined') ? RunManager.getCurrentNode() : null;
        AudioManager.playBattleBgm(GameState.selectedClass || 'qi', currentNode ? currentNode.type : 'battle');
    }
    updateUI();
}


// 结束战斗并重置
function restartGame() {
    GameState.isRunning = false;
    loopStarted = false;

    if (typeof AudioManager !== 'undefined') {
        AudioManager.stopBgm();
    }
    
    // 重置状态
    GameState.player = null;
    GameState.enemy = null;
    GameState.spirit = null;
    GameState.isPaused = false;
    GameState.isUpgradeOpen = false;
    GameState.upgradeOptions = [];
    GameState.upgradesChosen = 0;
    GameState.isBattleEnded = false;
    GameState.upgradeLevels = {};
    
    // 重置 CTB 速度
    lastActingSide = null;
    ctbSystem.tickSpeed = CTB_NORMAL_SPEED;
    
    // 清理 UI
    setActiveTurn(null);
    const gameoverOverlay = document.getElementById('gameover-overlay');
    if (gameoverOverlay) gameoverOverlay.remove();
    document.getElementById('timeline').innerHTML = '';
    document.getElementById('vfx-layer').innerHTML = '';
    if (ctbSystem._elMap) { ctbSystem._elMap.clear(); }
    closeUpgradeOverlay();
    GameState.followUpPending = null;
    const panel = document.getElementById('skills-panel');
    if (panel) panel.dataset.followUpLock = '0';
    const overlay = document.getElementById('spirit-select-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('shrine-mode', 'shrine-exit');
    }
    const selectionScreen = document.getElementById('selection-screen');
    const container = document.querySelector('.container');
    if (selectionScreen) selectionScreen.classList.remove('hidden');
    if (container) container.classList.remove('visible');
}

// 战斗失败
function gameOver() {
    GameState.isRunning = false;
    GameState.isPaused = true;
    setActiveTurn(null);

    if (typeof AudioManager !== 'undefined') {
        AudioManager.stopBgm();
        AudioManager.playUi('open');
    }

    const overlay = document.createElement('div');
    overlay.className = 'gameover-overlay';
    overlay.id = 'gameover-overlay';
    const nodeProgress = (typeof RunManager !== 'undefined') ? RunManager.getProgressText() : `${GameState.currentLevel}`;
    overlay.innerHTML = `
        <div class="gameover-panel">
            <div class="gameover-title">战斗失败</div>
            <div class="gameover-stats">
                <div>推进到节点 ${nodeProgress}</div>
                <div>坚持了 ${GameState.turnCount} 个回合</div>
                <div>获得了 ${GameState.upgradesChosen} 个强化</div>
            </div>
            <button class="gameover-button" onclick="document.getElementById('gameover-overlay').remove(); restartGame();">重新开始</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const restartBtn = overlay.querySelector('.gameover-button');
    if (restartBtn && typeof AudioManager !== 'undefined') {
        AudioManager.bindUiSound(restartBtn, { hover: 'hover', click: 'confirm' });
    }
}

// ==================== 职业图标/颜色映射 ====================
function getClassIcon(classId) {
    const map = { qi: '👊', combo: '⚔', mana: '🔫', balance: '☯' };
    return map[classId] || '⚡';
}

function getClassColor(classId) {
    const map = { qi: '#e65100', combo: '#1565c0', mana: '#6a1b9a', balance: '#00695c' };
    return map[classId] || '#00d4ff';
}

function getEnemyActionColor(actionType) {
    const map = { attack: '#c62828', charge: '#e65100', buff: '#2e7d32', debuff: '#6a1b9a', defend: '#37474f' };
    return map[actionType] || '#c62828';
}

function toggleDebugMode() {
    const nextEnabled = !(typeof isDebugModeEnabled === 'function' && isDebugModeEnabled());
    if (typeof setDebugModeEnabled === 'function') {
        setDebugModeEnabled(nextEnabled);
    } else if (GameState && GameState.debug) {
        GameState.debug.enabled = nextEnabled;
    }
    const stateText = nextEnabled ? '开启' : '关闭';
    Logger.log(`DEBUG 模式${stateText}${nextEnabled ? '（资源无限）' : ''}`, true);
    updateUI();
}

// ==================== CTB 动态加速 ====================
// 同一方连续行动时加速时间轴推进
let lastActingSide = null; // 'player' | 'enemy' | null
const CTB_NORMAL_SPEED = 0.5;
const CTB_FAST_SPEED = 2.5; // 5x 加速

function updateCTBSpeed(currentSide) {
    if (currentSide === lastActingSide && currentSide !== null) {
        // 同一方连续行动 → 加速
        ctbSystem.tickSpeed = CTB_FAST_SPEED;
    } else {
        // 切换方 → 正常速度
        ctbSystem.tickSpeed = CTB_NORMAL_SPEED;
    }
    lastActingSide = currentSide;
}

// 游戏主循环
let lastReadyUnit = null;

function getUnitCenter(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return null;
    const rect = box.getBoundingClientRect();
    const stage = document.querySelector('.main-stage');
    if (!stage) return null;
    const stageRect = stage.getBoundingClientRect();
    return {
        x: rect.left + rect.width / 2 - stageRect.left,
        y: rect.top - stageRect.top + rect.height / 2
    };
}

// HP 条受击抖动（基于伤害量）
function shakeHpBar(containerId, damage, maxHp) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const ratio = Math.min(damage / maxHp, 1);
    // 轻击 2px，中击 5px，重击 10px
    const px = Math.max(2, Math.round(ratio * 30));
    const duration = 0.2 + ratio * 0.25; // 0.2s ~ 0.45s
    container.style.setProperty('--shake-px', px + 'px');
    container.style.setProperty('--shake-duration', duration + 's');
    container.classList.remove('hp-shake');
    void container.offsetWidth;
    container.classList.add('hp-shake');
    setTimeout(() => container.classList.remove('hp-shake'), duration * 1000 + 50);
}

function gameLoop() {
    if (!GameState.isRunning) return;

    const ready = ctbSystem.tick();
    
    if (ready && ready !== lastReadyUnit) {
        lastReadyUnit = ready;
        
        if (ready.type === 'player') {
            updateCTBSpeed('player');
            GameState.isPlayerTurn = true;
            setActiveTurn('player');
            Logger.log(`${ready.name} 的回合`, true);
            // 触发回合开始回调
            if (GameState.player) {
                // Buff 结算
                if (GameState.player.applyStartTurnBuffs) {
                    const pos = getUnitCenter('player-box');
                    GameState.player.applyStartTurnBuffs(pos);
                    // 玩家死亡检测（DOT致死）
                    if (GameState.player.hp <= 0) {
                         updateUI();
                         gameOver();
                         return;
                    }
                }
                
                GameState.player.onTurnStart();
                // 触发被动技能的回合开始效果
                if (GameState.player.passive && GameState.player.passive.onTurnStart) {
                    GameState.player.passive.onTurnStart();
                }
                if (GameState.spirit && GameState.spirit.onTurnStart) {
                    GameState.spirit.onTurnStart({ unit: GameState.player });
                }
                GameEvents.emit('turnStart', { unit: GameState.player });
                updateUI();
            }
        } else if (ready.type === 'enemy') {
            updateCTBSpeed('enemy');
            GameState.isPlayerTurn = false;
            setActiveTurn('enemy');
            enemyTurn(ready);
        } else if (ready.type === 'spirit') {
            updateCTBSpeed('player'); // 魂灵算玩家方
            GameState.isPlayerTurn = false;
            setActiveTurn(null);
            spiritTurn(ready);
        }
    }
    
    // 重置标记，避免重复触发
    if (!ready) {
        lastReadyUnit = null;
    }
    
    ctbSystem.render();
    requestAnimationFrame(gameLoop);
}

// 敌人回合
function enemyTurn(enemy) {
    // 暂停行动条
    GameState.isPaused = true;
    
    // 回合开始 Buff 结算 (DOT/HOT)
    if (enemy.applyStartTurnBuffs) {
        const pos = getUnitCenter('enemy-box');
        enemy.applyStartTurnBuffs(pos);
        updateUI();
        if (enemy.hp <= 0) {
            winBattle();
            return;
        }
    }
    
    // 执行意图（伤害结算）
    let result = { damage: 0 };
    let actionType = 'attack';
    const playerShieldBefore = (GameState.player && GameState.player.shield) || 0;
    
    if (enemy.executeAction) {
        result = enemy.executeAction(GameState.player);
        if (enemy.nextAction) actionType = enemy.nextAction.type;
    } else {
        Logger.log(`${enemy.name} 攻击！`);
        if (GameState.player) {
            const damage = enemy.baseAtk;
            GameState.player.takeDamage(damage);
            result.damage = damage;
        }
    }

    // ===== 获取行动描述用于 cut-in =====
    const actionDesc = (enemy.nextAction && enemy.nextAction.desc) || '';
    // 从 desc 中提取简短技能名（如"撞击！造成 15 伤害" → "撞击"，"火球术！造成 12 伤害" → "火球术"）
    let cutinSkillName = actionDesc.split('！')[0] || actionDesc.split('，')[0] || actionType;
    if (cutinSkillName.length > 6) cutinSkillName = cutinSkillName.substring(0, 6);
    const cutinIcon = (enemy.icon) || '👾';
    const cutinColor = getEnemyActionColor(actionType);
    const needsCutIn = (actionType === 'attack' || actionType === 'charge');
    const cutinDuration = 1000;

    // ===== 非攻击行为的即时表现（buff/debuff/stun 等，无需 cut-in） =====
    const enemyPos = getUnitCenter('enemy-box');
    const playerPos = getUnitCenter('player-box');

    if (actionType === 'stun' && enemyPos) {
        ParticleSystem.showDamageNumber(enemyPos.x, enemyPos.y - 40, '眩晕', '#b0bec5', null, { holdMs: 500, fadeMs: 1100, floatDistance: 20 });
    }
    if ((actionType === 'buff' || actionType === 'defend') && enemyPos) {
        let text = '强化';
        let color = '#81c784';
        if (enemy.nextAction && enemy.nextAction.buff) {
            if (enemy.nextAction.buff.type === 'shield') {
                text = '护盾'; color = '#64b5f6';
            } else if (enemy.nextAction.buff.stat === 'speed') {
                text = '加速'; color = '#7CFC00';
            } else if (enemy.nextAction.buff.stat === 'def') {
                text = '防御'; color = '#90caf9';
            } else if (enemy.nextAction.buff.stat === 'atk') {
                text = '强化'; color = '#ffb74d';
            }
        } else if (actionType === 'defend') {
            text = '防御'; color = '#90caf9';
        }
        ParticleSystem.showDamageNumber(enemyPos.x, enemyPos.y - 40, text, color, null, { holdMs: 450, fadeMs: 1000, floatDistance: 18 });
        ParticleSystem.createParticles(enemyPos.x, enemyPos.y, 10, color);
    }
    if (actionType === 'debuff' && playerPos) {
        let text = '减益';
        let color = '#ba68c8';
        if (enemy.nextAction && enemy.nextAction.debuff) {
            if (enemy.nextAction.debuff.type === 'dot') {
                text = '中毒'; color = '#8e24aa';
            } else if (enemy.nextAction.debuff.stat === 'atk') {
                text = '减攻'; color = '#ef5350';
            } else if (enemy.nextAction.debuff.stat === 'speed') {
                text = '减速'; color = '#4fc3f7';
            }
        }
        ParticleSystem.showDamageNumber(playerPos.x, playerPos.y - 40, text, color, null, { holdMs: 450, fadeMs: 1000, floatDistance: 18 });
        ParticleSystem.createParticles(playerPos.x, playerPos.y, 12, color);
        ParticleSystem.createImpact(playerPos.x, playerPos.y, 'debuff');
    }

    // ===== 敌人弹体命中后的受击表现 =====
    function _enemyHitVFX(playerBox, result, actionType, playerShieldBefore) {
        if (typeof SFX !== 'undefined') SFX.hit();
        if (!playerBox) return;
        const rect = playerBox.getBoundingClientRect();
        const stage = document.querySelector('.main-stage');
        if (!stage) return;
        const stageRect = stage.getBoundingClientRect();
        
        const x = rect.left + rect.width / 2 - stageRect.left;
        const y = rect.top - stageRect.top;
        
        ParticleSystem.showDamageNumber(x, y - 20, result.damage, '#ff6b9d');
        
        const impactType = actionType === 'charge' ? 'charge' : 'enemy';
        ParticleSystem.createImpact(x, y, impactType);
        
        const hpRatio = result.damage / GameState.player.maxHp;
        if (hpRatio >= 0.25 || actionType === 'charge') {
            ParticleSystem.shakeScreen(10, 350);
            ParticleSystem.flashScreen('rgba(255, 50, 50, 0.3)', 100);
        } else if (hpRatio >= 0.1) {
            ParticleSystem.shakeScreen(5, 200);
            ParticleSystem.flashScreen('rgba(255, 80, 80, 0.15)', 80);
        } else {
            ParticleSystem.shakeScreen(3, 120);
        }
        
        playerBox.classList.remove('hit-flash', 'knockback-left', 'knockback-left-heavy');
        void playerBox.offsetWidth;
        playerBox.classList.add('hit-flash');
        playerBox.classList.add(actionType === 'charge' ? 'knockback-left-heavy' : 'knockback-left');
        setTimeout(() => playerBox.classList.remove('hit-flash', 'knockback-left', 'knockback-left-heavy'), 400);
        
        shakeHpBar('player-hp-container', result.damage, GameState.player.maxHp);
        
        const playerShieldAfter = (GameState.player && GameState.player.shield) || 0;
        if (playerShieldBefore > 0 && playerShieldAfter <= 0) {
            ParticleSystem.createImpact(x, y, 'light', '#64b5f6');
            ParticleSystem.flashScreen('rgba(100, 181, 246, 0.25)', 100);
            ParticleSystem.showDamageNumber(x, y - 50, '护盾破碎!', '#64b5f6', null, { holdMs: 500, fadeMs: 1000, floatDistance: 25 });
        }

        updateUI();
    }

    // ===== 攻击类 VFX（在 cut-in 完成后播放） =====
    const enemyVfxType = (enemy.nextAction && enemy.nextAction.vfx) || 'melee';
    const enemyVfxColor = (enemy.nextAction && enemy.nextAction.vfxColor) || '#ff6b9d';

    function playEnemyAttackVFX() {
        const ePos = getUnitCenter('enemy-box');
        const pPos = getUnitCenter('player-box');

        if (result.damage > 0 && GameState.player) {
            const playerBox = document.getElementById('player-box');
            const enemyBoxEl = document.getElementById('enemy-box');

            if (enemyVfxType === 'ranged') {
                // ===== 远程/魔法：弹体飞行 =====
                // 无前冲，轻微后座
                if (enemyBoxEl) {
                    enemyBoxEl.style.transition = 'transform 0.1s';
                    enemyBoxEl.style.transform = 'translateX(6px)';
                    setTimeout(() => {
                        enemyBoxEl.style.transform = '';
                        setTimeout(() => { enemyBoxEl.style.transition = ''; }, 150);
                    }, 100);
                }
                if (ePos && pPos) {
                    const projSize = actionType === 'charge' ? 14 : 11;
                    const projGlow = actionType === 'charge' ? 22 : 16;
                    ParticleSystem.createProjectile(
                        ePos.x, ePos.y, pPos.x, pPos.y,
                        { color: enemyVfxColor, size: projSize, speed: 300, glow: projGlow, trailCount: 4 },
                        () => { _enemyHitVFX(playerBox, result, actionType, playerShieldBefore); }
                    );
                } else {
                    _enemyHitVFX(playerBox, result, actionType, playerShieldBefore);
                }
            } else {
                // ===== 近战：前冲 + 斩击 =====
                if (enemyBoxEl && (actionType === 'attack' || actionType === 'charge')) {
                    enemyBoxEl.classList.remove('lunge-left');
                    void enemyBoxEl.offsetWidth;
                    enemyBoxEl.classList.add('lunge-left');
                    setTimeout(() => enemyBoxEl.classList.remove('lunge-left'), 300);
                }
                // 在玩家位置播放斩击特效
                if (pPos) {
                    const slashType = actionType === 'charge' ? 'heavy' : 'light';
                    ParticleSystem.createSlash(pPos.x, pPos.y, slashType);
                }
                // 近战即时命中
                _enemyHitVFX(playerBox, result, actionType, playerShieldBefore);
            }
        }
        
        // 蓄力状态文字
        if (actionType === 'charge') {
            const ePos2 = getUnitCenter('enemy-box');
            if (ePos2) {
                ParticleSystem.showDamageNumber(ePos2.x, ePos2.y - 40, '蓄力', '#f8d64e', null, { holdMs: 500, fadeMs: 1100, floatDistance: 20 });
                ParticleSystem.createParticles(ePos2.x, ePos2.y, 14, '#f8d64e');
            }
        }
        
        // 多段攻击表现（近战多段用斩击，远程多段弹体已在 onHit 中处理）
        if (result.hits && result.hits > 1) {
            const pPos2 = getUnitCenter('player-box');
            if (pPos2) {
                for (let i = 1; i < result.hits; i++) {
                    setTimeout(() => {
                        if (enemyVfxType === 'melee') {
                            ParticleSystem.createSlash(pPos2.x, pPos2.y, 'multihit');
                        }
                        ParticleSystem.createImpact(pPos2.x, pPos2.y, 'multihit');
                        const playerBox = document.getElementById('player-box');
                        if (playerBox) {
                            playerBox.classList.remove('hit-flash');
                            void playerBox.offsetWidth;
                            playerBox.classList.add('hit-flash');
                            setTimeout(() => playerBox.classList.remove('hit-flash'), 400);
                        }
                    }, i * 200);
                }
            }
        }
        
        updateUI();
    }

    // ===== 回合结束处理 =====
    function finishEnemyTurn() {
        // 玩家死亡检测
        if (GameState.player && GameState.player.hp <= 0) {
            setTimeout(() => { gameOver(); }, 1200);
            return;
        }
        
        setTimeout(() => {
            setActiveTurn(null);
            if (enemy.updateBuffs) {
                enemy.updateBuffs();
                updateBuffBars();
            } else {
                if (enemy.internalInjury && enemy.internalInjury > 0) {
                    enemy.internalInjury--;
                    updateBuffBars();
                }
            }

            if (enemy.planNextAction) {
                enemy.planNextAction();
                Logger.log(`${enemy.name} 意图：${enemy.nextAction.desc}`);
                updateUI();
            }

            ctbSystem.resetAV(enemy);
            GameState.isPaused = false;
            GameState.turnCount++;
            const turnCountEl = document.getElementById('turn-count');
            if (turnCountEl) turnCountEl.textContent = GameState.turnCount;
            GameEvents.emit('turnEnd', { unit: enemy });
            if (GameState.spirit && GameState.spirit.onTurnEnd) {
                GameState.spirit.onTurnEnd({ unit: enemy });
            }
            maybeOfferUpgrades();
        }, 1300);
    }

    // ===== 主时序：攻击类行为先播 cut-in → 再播 VFX → 结束；非攻击类直接播表现 → 结束 =====
    if (needsCutIn) {
        ParticleSystem.showSkillCutIn({
            side: 'right',
            icon: cutinIcon,
            skillName: cutinSkillName,
            color: cutinColor,
            duration: cutinDuration
        }, () => {
            // cut-in 结束后播放攻击 VFX
            playEnemyAttackVFX();
            finishEnemyTurn();
        });
    } else {
        // 非攻击行为：即时表现已在上面播放完毕
        updateUI();
        finishEnemyTurn();
    }
}

// 魂灵回合（自律型）
function spiritTurn(spirit) {
    if (!spirit) return;
    GameState.isPaused = true;
    const result = spirit.onSpiritTurn ? spirit.onSpiritTurn() : null;
    updateUI();

    setTimeout(() => {
        if (spirit && typeof ctbSystem.resetAV === 'function') {
            ctbSystem.resetAV(spirit);
        }
        GameState.isPaused = false;
        updateUI();
    }, result && result.delayMs ? result.delayMs : 600);
}

// 角色选择
function selectClass(classId) {
    const classNames = {
        'qi': '气宗',
        'combo': '剑圣',
        'mana': '魔导',
        'balance': '判官'
    };
    
    GameState.player = createCharacter(classId);
    ctbSystem.addUnit(GameState.player);
    GameState.selectedClass = classId;
    
    const classNameEl = document.getElementById('player-class');
    if (classNameEl) classNameEl.textContent = classNames[classId] || classId;
    Logger.log(`选择角色: ${classNames[classId]}`, true);
    
    // 触发回合开始回调
    GameState.player.onTurnStart();
    
    updateUI();
}

// 玩家使用技能
function usePlayerSkill(skillId) {
    if (!GameState.isPlayerTurn || !GameState.player) return;
    
    // 防止重复点击导致的卡顿
    if (GameState.isProcessingSkill) return;
    GameState.isProcessingSkill = true;
    GameState.isPaused = true;
    
    const skill = GameState.player.useSkill(skillId);
    if (!skill) {
        GameState.isProcessingSkill = false;
        GameState.isPaused = false;
        return;
    }
    
    // 蓄力打断检测
    if (GameState.enemy && GameState.enemy.isCharging && 
        ((skill.tags && skill.tags.includes('Ultimate')) || skill.type === 'Ultimate')) {
        
        if (GameState.enemy.interrupt) {
            GameState.enemy.interrupt();
            Logger.log(`成功打断 ${GameState.enemy.name} 的蓄力！`, true);
            ParticleSystem.createParticles(0, 0, 30, '#ffff00'); // 打断特效
            updateUI();
        }
    }
    
    // 获取基础伤害
    let baseDamage;
    if (skill.getDamage) {
        baseDamage = skill.getDamage(GameState.player, { enemy: GameState.enemy });
    } else {
        baseDamage = skill.calculatedDamage !== undefined ? skill.calculatedDamage : (skill.damage || 0);
    }

    const preSkillContext = {
        player: GameState.player,
        enemy: GameState.enemy,
        skill,
        baseDamage
    };
    if (GameState.spirit && GameState.spirit.onBeforeSkill) {
        GameState.spirit.onBeforeSkill(preSkillContext);
    }
    GameEvents.emit('beforeSkill', preSkillContext);
    if (preSkillContext.baseDamage !== undefined) {
        baseDamage = preSkillContext.baseDamage;
    }
    
    // 剑圣疾风满层加成 (不修改skill对象，在此处应用)
    if (GameState.player.classId === 'combo' && GameState.player.speedStacks >= 10) {
        baseDamage *= 1.2;
    }

    // 剑圣连斩的概率连击逻辑
    let actualHits = skill.hits || 1;
    if (skill.id === 'combo_strike') {
        actualHits = 1; // 第一击必定命中
        // 最多追加 4 次 (总共 5 次)
        for (let i = 0; i < 4; i++) {
            const chance = 0.6 + (GameState.player.comboChainChanceBonus || 0);
            if (Math.random() < chance) {
                actualHits++;
            } else {
                break;
            }
        }
        Logger.log(`连斩触发 ${actualHits} 次攻击`);
    }

    // 魔导爆射不再需要特殊逻辑，改为单发高伤（已在 classes.js 配置）

    
    // 计算总伤害
    let totalDamage = baseDamage;
    if (skill.calculatedDamage === undefined && skill.hits && skill.hits > 1) {
        // damage是单发伤害
        totalDamage = baseDamage * actualHits;
    } else if (skill.calculatedDamage !== undefined) {
        // calculatedDamage是总伤害
        if (skill.id === 'burst') {
            const singleHitDmg = baseDamage / (skill.hits || 1);
            totalDamage = singleHitDmg * actualHits;
        }
    }

    if (GameState.player.classId === 'combo' && skill.tags && skill.tags.includes('MultiHit')) {
        const bonus = GameState.player.comboMultiHitBonus || 0;
        if (bonus > 0) {
            totalDamage *= (1 + bonus);
        }
    }

    // 玩家技能表现（基于标签；无伤害技能不播放受击相关表现）
    const playerPos = getUnitCenter('player-box');
    const enemyPos = getUnitCenter('enemy-box');
    const hasDamage = totalDamage > 0;
    const tags = skill.tags || [];
    const isRanged = tags.includes('Ranged');

    // 技能喊话 cut-in（仅有伤害的攻击技能，与后续 VFX 并行）
    if (hasDamage) {
        ParticleSystem.showSkillCutIn({
            side: 'left',
            icon: getClassIcon(GameState.player.classId),
            skillName: skill.name,
            color: getClassColor(GameState.player.classId)
        });
    }
    
    if (hasDamage) {
        const playerBoxEl = document.getElementById('player-box');
        
        if (isRanged) {
            // 远程：轻微后座动画（不前冲）
            if (playerBoxEl) {
                playerBoxEl.style.transition = 'transform 0.1s';
                playerBoxEl.style.transform = 'translateX(-6px)';
                setTimeout(() => {
                    playerBoxEl.style.transform = '';
                    setTimeout(() => { playerBoxEl.style.transition = ''; }, 150);
                }, 100);
            }
            // 远程不在此处创建弹体，弹体在每hit循环中发射
        } else {
            // 近战：保留前冲动画
            if (playerBoxEl) {
                playerBoxEl.classList.remove('lunge-right');
                void playerBoxEl.offsetWidth;
                playerBoxEl.classList.add('lunge-right');
                setTimeout(() => playerBoxEl.classList.remove('lunge-right'), 300);
            }
            // 近战不在此处创建斩击，斩击在每hit命中时播放
        }
        
        // 全局表现（Ultimate/Heavy）- 近战远程都适用
        if (tags.includes('Ultimate')) {
            ParticleSystem.shakeScreen(8, 300);
            ParticleSystem.flashScreen('rgba(255,120,120,0.25)', 80);
        }
    }
    
    let tempCritBonus = 0;

    // 构建行动对象
    const playerAction = {
        type: 'skill',
        skill: skill,
        damage: totalDamage,
        cost: skill.cost,
        hits: actualHits // 传递实际命中数
    };
    
    // 触发角色行动回调
    GameState.player.onAction(playerAction);
    
    // 触发被动技能效果
    if (GameState.player.passive && GameState.player.passive.onSkillUse) {
        GameState.player.passive.onSkillUse(skill);
    }
    if (GameState.player.passive && GameState.player.passive.onAction) {
        GameState.player.passive.onAction(playerAction);
    }
    if (GameState.spirit && GameState.spirit.onPlayerAction) {
        GameState.spirit.onPlayerAction(playerAction);
    }
    
    // 定义回合结束逻辑
    const endTurn = () => {
        setActiveTurn(null);
        ctbSystem.resetAV(GameState.player);
        
        // 处理技能的行动推迟 (机制保留，供后续控制技能使用)
        if (skill.avDelayMod) {
            const baseAV = 10000 / GameState.player.speed;
            const delay = baseAV * skill.avDelayMod;
            GameState.player.av += delay;
            Logger.log(`行动推迟！AV +${Math.floor(delay)}`);
        }

        // 处理自身 Debuff (如过载)
        if (skill.selfDebuff) {
            if (skill.selfDebuff.type === 'speed_down') {
                GameState.player.addBuff({
                    name: skill.selfDebuff.name,
                    type: 'debuff',
                    stat: 'speed',
                    value: -skill.selfDebuff.value, // -20%
                    duration: skill.selfDebuff.duration
                });
                Logger.log(`进入【${skill.selfDebuff.name}】状态！速度降低 ${(skill.selfDebuff.value * 100).toFixed(0)}%`);
                const pos = getUnitCenter('player-box');
                if (pos) {
                    ParticleSystem.showDamageNumber(pos.x, pos.y - 40, '减速', '#4fc3f7', null, { holdMs: 450, fadeMs: 1000, floatDistance: 18 });
                    ParticleSystem.createParticles(pos.x, pos.y, 10, '#4fc3f7');
                }
                updateBuffBars(); // UI update
            }
        }
        
        // 更新所有 Buff 持续时间 (回合结束时)
        GameState.player.updateBuffs();

        GameState.isPlayerTurn = false;
        GameState.isProcessingSkill = false;
        GameState.turnCount++;
        const turnCountEl = document.getElementById('turn-count');
        if (turnCountEl) turnCountEl.textContent = GameState.turnCount;
        GameEvents.emit('turnEnd', { unit: GameState.player });
        if (GameState.spirit && GameState.spirit.onTurnEnd) {
            GameState.spirit.onTurnEnd({ unit: GameState.player });
        }
        maybeOfferUpgrades();
        updateUI();
    };

    // ==================== 应用伤害（支持多hit，区分近战/远程） ====================
    if (totalDamage > 0 && GameState.enemy) {
        const hits = actualHits;
        let damagePerHit;
        
        if (skill.calculatedDamage !== undefined) {
            if (skill.id === 'burst') {
                damagePerHit = baseDamage / (skill.hits || 1);
            } else {
                damagePerHit = baseDamage / hits;
            }
        } else {
            damagePerHit = baseDamage;
        }
        
        // 获取敌方防御
        let enemyDef = GameState.enemy.def || 0;
        let enemyAtk = GameState.enemy.baseAtk || 0;
        if (GameState.player.classId === 'balance') {
            const debuffMult = GameState.player.getEnemyDebuffMultiplier();
            if (debuffMult < 1.0) {
                enemyDef *= debuffMult;
                enemyAtk *= debuffMult;
                updateUI();
            }
            // 烈阳击：无视全部防御
            if (skill._ignoreDef) {
                enemyDef = 0;
            }
        }

        // ---------- 多hit伤害计数 ----------
        let totalDamageApplied = 0;

        // ---------- 命中表现函数（近战/远程共用） ----------
        function applyHitEffects(i, hits) {
            if (GameState.isBattleEnded) return;

            // 多段攻击防御优化：多hit时每hit只承受50%防御，避免多段被平减过度削弱
            const effectiveDef = (hits > 1) ? enemyDef * 0.5 : enemyDef;
            let finalHitDmg = Math.max(1, damagePerHit - effectiveDef);

            if (GameState.enemy.internalInjury > 0 && GameState.player) {
                const mult = GameState.player.qiInternalInjuryMult || 1.3;
                finalHitDmg *= mult;
            }

            // 暴击判定
            let critChance = (GameState.player && GameState.player.critChance) ? GameState.player.critChance : 0;
            let critMult = (GameState.player && GameState.player.critMult) ? GameState.player.critMult : 2.0;
            let isCrit = false;

            if (GameState.enemy.internalInjury > 0 && GameState.player && GameState.player.qiInternalCritChance) {
                critChance = Math.max(critChance, GameState.player.qiInternalCritChance);
                critMult = GameState.player.qiInternalCritMult || 2.0;
            }
            if (tempCritBonus > 0) {
                critChance += tempCritBonus;
            }

            if (critChance > 0 && Math.random() < critChance) {
                finalHitDmg *= critMult;
                isCrit = true;
            }

            const shieldBefore = GameState.enemy.shield || 0;
            totalDamageApplied += finalHitDmg;
            GameState.enemy.takeDamage(finalHitDmg);
            
            if (i === 0 && skill.onHit && GameState.player && GameState.enemy) {
                skill.onHit(GameState.player, GameState.enemy);
            }
            
            const enemyBox = document.getElementById('enemy-box');
            if (enemyBox) {
                const rect = enemyBox.getBoundingClientRect();
                const stage = document.querySelector('.main-stage');
                const stageRect = stage.getBoundingClientRect();
                
                const x = rect.left + rect.width / 2 - stageRect.left + (Math.random() - 0.5) * 60;
                const y = rect.top - stageRect.top + (Math.random() - 0.5) * 40;
                
                // --- 近战：在命中时播放斩击特效 ---
                if (!isRanged) {
                    let slashType = 'light';
                    let slashColor = null; // null = 使用默认颜色
                    
                    if (tags.includes('Judgment')) {
                        slashType = 'flip'; // 判官宣判：阴阳旋转X斩
                    } else if (tags.includes('Finisher')) {
                        slashType = 'heavy'; slashColor = '#ffd700'; // 剑圣终结技：大型金色
                    } else if (tags.includes('Heavy') || (tags.includes('Ultimate') && !tags.includes('Finisher'))) {
                        slashType = 'heavy'; // 崩山等重击：大型红色
                    } else if (tags.includes('Yang')) {
                        slashType = 'yang'; // 判官阳击：白色
                    } else if (tags.includes('Yin')) {
                        slashType = 'yin'; // 判官阴击：紫色
                    } else if (tags.includes('Special')) {
                        slashType = 'special'; // 迅击：橙色
                    }
                    // 多段攻击非首hit用小型斩痕
                    if (i > 0 && hits > 1) slashType = 'multihit';
                    
                    ParticleSystem.createSlash(x, y, slashType, slashColor);
                }
                // 远程的冲击粒子已在弹体 onHit 中由 createProjectile 自带
                
                // 伤害重量分级：根据实际伤害占比和技能类型差异化视觉表现
                const dmgRatio = finalHitDmg / (GameState.enemy.maxHp || 1);
                
                if (isCrit) {
                    if (typeof SFX !== 'undefined') SFX.crit();
                    const critShake = Math.min(12, 6 + dmgRatio * 30);
                    ParticleSystem.showDamageNumber(x, y - 20, finalHitDmg, '#ffd700', '暴击!', { fontSize: '30px', holdMs: 700, fadeMs: 1400, floatDistance: 45 });
                    ParticleSystem.createImpact(x, y, 'ultimate', '#ffd700');
                    ParticleSystem.shakeScreen(critShake, 250);
                    if (dmgRatio >= 0.15) ParticleSystem.flashScreen('rgba(255,215,0,0.2)', 100);
                } else {
                    let color = '#ff6b9d';
                    if (GameState.enemy.internalInjury > 0) color = '#ff0000';
                    
                    const skillName = (i === 0 && skill.name) ? skill.name : null;
                    const isUltimate = tags.includes('Ultimate');
                    const isHeavy = tags.includes('Heavy');
                    const isLight = tags.includes('Light') && !isHeavy && !isUltimate;
                    
                    if (isUltimate || isHeavy) {
                        // 重击/必杀：大数字 + 动态震屏
                        const shakeIntensity = Math.min(10, 4 + dmgRatio * 25);
                        ParticleSystem.showDamageNumber(
                            x, y - 20, finalHitDmg, color, skillName,
                            { fontSize: '26px', holdMs: 550, fadeMs: 1200, floatDistance: 38 }
                        );
                        if (i === 0) ParticleSystem.shakeScreen(shakeIntensity, 200);
                    } else if (isLight || (hits > 1 && i > 0)) {
                        // 轻击/多段后续hit：小数字，极简表现
                        ParticleSystem.showDamageNumber(
                            x, y - 20, finalHitDmg, color, skillName,
                            { fontSize: '16px', holdMs: 280, fadeMs: 700, floatDistance: 20 }
                        );
                    } else {
                        // 普通技能：标准表现
                        ParticleSystem.showDamageNumber(x, y - 20, finalHitDmg, color, skillName);
                    }
                }
                
                // 冲击粒子（近战用，远程已在弹体到达时自带）
                if (!isRanged) {
                    let impactType = 'normal';
                    if (tags.includes('Ultimate')) impactType = 'ultimate';
                    else if (tags.includes('Heavy')) impactType = 'heavy';
                    else if (tags.includes('Light')) impactType = 'light';
                    if (i > 0 && hits > 1) impactType = 'multihit';
                    ParticleSystem.createImpact(x, y, impactType);
                }
                
                // 敌人受击音效（非暴击时，暴击已有 crit 音效）
                if (!isCrit && typeof SFX !== 'undefined') SFX.hit();
                
                // 敌人框体受击闪红 + 击退
                enemyBox.classList.remove('hit-flash', 'knockback-right', 'knockback-right-heavy');
                void enemyBox.offsetWidth;
                enemyBox.classList.add('hit-flash');
                const isHeavyKnockback = tags.includes('Heavy') || tags.includes('Ultimate') || isCrit;
                enemyBox.classList.add(isHeavyKnockback ? 'knockback-right-heavy' : 'knockback-right');
                setTimeout(() => enemyBox.classList.remove('hit-flash', 'knockback-right', 'knockback-right-heavy'), 400);
                
                shakeHpBar('enemy-hp-container', finalHitDmg, GameState.enemy.maxHp || 1);
                
                // 护盾破碎效果
                const shieldAfter = GameState.enemy.shield || 0;
                if (shieldBefore > 0 && shieldAfter <= 0) {
                    ParticleSystem.createImpact(x, y, 'light', '#64b5f6');
                    ParticleSystem.flashScreen('rgba(100, 181, 246, 0.25)', 100);
                    ParticleSystem.showDamageNumber(x, y - 50, '护盾破碎!', '#64b5f6', null, { holdMs: 500, fadeMs: 1000, floatDistance: 25 });
                }
            }
            updateUI();

            if (GameState.enemy.hp <= 0 && !GameState.isBattleEnded) {
                GameState.isBattleEnded = true;
                winBattle();
            }
        }

        // ---------- 多hit伤害执行 ----------
        if (isRanged) {
            // ===== 远程模式：发射弹体 -> 飞行 -> 到达后命中 =====
            const hitInterval = 400; // 每hit发射间隔
            const projSpeed = tags.includes('Heavy') ? 350 : 280; // 飞行时间 ms

            // 弹体配置：根据技能类型选择颜色/大小
            let projColor = '#64b5f6';
            let projSize = 10;
            let projGlow = 15;
            if (tags.includes('Ultimate') && tags.includes('Heavy')) {
                projColor = '#ffd54f'; projSize = 16; projGlow = 25; // 强化爆射：大型金色
            } else if (tags.includes('Ultimate')) {
                projColor = '#ffd54f'; projSize = 14; projGlow = 20; // 强化射击：金色
            } else if (tags.includes('Heavy')) {
                projColor = '#ff4444'; projSize = 14; projGlow = 20; // 过载爆射：红色
            }

            for (let i = 0; i < hits; i++) {
                setTimeout(() => {
                    if (GameState.isBattleEnded) return;
                    // 发射时获取最新位置
                    const pPos = getUnitCenter('player-box');
                    const ePos = getUnitCenter('enemy-box');
                    if (!pPos || !ePos) return;

                    ParticleSystem.createProjectile(
                        pPos.x, pPos.y, ePos.x, ePos.y,
                        { color: projColor, size: projSize, speed: projSpeed, glow: projGlow, trailCount: 4 },
                        () => { applyHitEffects(i, hits); } // 弹体到达后触发命中
                    );
                }, i * hitInterval);
            }
            
            // 回合结束延迟 = 所有弹体发射完 + 最后弹体飞行时间 + 缓冲
            setTimeout(() => {
                if (!GameState.isBattleEnded) {
                    Logger.log(`对敌人造成 ${hits} 次伤害，总计 ${totalDamageApplied.toFixed(1)} 点！`, true);
                    const afterSkillContext = { player: GameState.player, enemy: GameState.enemy, skill, totalDamage: totalDamageApplied, hits };
                    GameEvents.emit('afterSkill', afterSkillContext);
                    if (GameState.spirit && GameState.spirit.onAfterSkill) GameState.spirit.onAfterSkill(afterSkillContext);
                    checkFollowUp(endTurn, skill.id);
                }
            }, hits * hitInterval + projSpeed + 400);

        } else {
            // ===== 近战模式：即时命中 + 斩击特效 =====
            const hitInterval = 250;

            for (let i = 0; i < hits; i++) {
                setTimeout(() => {
                    applyHitEffects(i, hits);
                }, i * hitInterval);
            }
            
            setTimeout(() => {
                if (!GameState.isBattleEnded) {
                    Logger.log(`对敌人造成 ${hits} 次伤害，总计 ${totalDamageApplied.toFixed(1)} 点！`, true);
                    const afterSkillContext = { player: GameState.player, enemy: GameState.enemy, skill, totalDamage: totalDamageApplied, hits };
                    GameEvents.emit('afterSkill', afterSkillContext);
                    if (GameState.spirit && GameState.spirit.onAfterSkill) GameState.spirit.onAfterSkill(afterSkillContext);
                    checkFollowUp(endTurn, skill.id);
                }
            }, hits * hitInterval + 500);
        }
    } else {
        const afterSkillContext = {
            player: GameState.player,
            enemy: GameState.enemy,
            skill,
            totalDamage: 0,
            hits: 0
        };
        GameEvents.emit('afterSkill', afterSkillContext);
        if (GameState.spirit && GameState.spirit.onAfterSkill) {
            GameState.spirit.onAfterSkill(afterSkillContext);
        }
        setTimeout(() => {
            if (!GameState.isBattleEnded) checkFollowUp(endTurn, skill.id);
        }, 500);
    }
    
    if (GameState.spirit && GameState.spirit.onAfterAction) {
        GameState.spirit.onAfterAction(playerAction);
    }
    updateUI();
}

// ==================== 追加技能系统 ====================

function checkFollowUp(endTurnCallback, sourceSkillId) {
    if (!GameState.player || GameState.isBattleEnded) {
        endTurnCallback();
        return;
    }

    const classId = GameState.player.classId;
    const triggers = (typeof FollowUpTriggers !== 'undefined') ? FollowUpTriggers[classId] : null;
    if (!triggers || !sourceSkillId) {
        endTurnCallback();
        return;
    }

    const triggerConfig = triggers[sourceSkillId];
    if (!triggerConfig) {
        endTurnCallback();
        return;
    }

    // 来源技能条件检查（如魔导射击类追加需要有弹药状态）
    if (triggerConfig.condition && !triggerConfig.condition(GameState.player)) {
        endTurnCallback();
        return;
    }

    // 一次概率判定
    if (Math.random() >= triggerConfig.rate) {
        endTurnCallback();
        return;
    }

    // 收集所有符合条件的追加技能
    const availableFollowUps = triggerConfig.skills
        .map(id => FollowUpSkillDefs[id])
        .filter(fu => fu && fu.canUse(GameState.player));

    if (availableFollowUps.length === 0) {
        endTurnCallback();
        return;
    }

    // 展示追加选择UI
    showFollowUpChoice(availableFollowUps, (chosen) => {
        if (chosen) {
            executeFollowUp(chosen, endTurnCallback);
        } else {
            endTurnCallback();
        }
    });
}

function showFollowUpChoice(followUps, callback) {
    if (typeof AudioManager !== 'undefined') AudioManager.playUi('open');

    GameState.followUpPending = { followUps, callback };

    const panel = document.getElementById('skills-panel');
    if (panel) panel.dataset.followUpLock = '0';
    updateSkillsUI();
}

function executeFollowUp(followUp, callback) {
    const player = GameState.player;
    const enemy = GameState.enemy;
    if (!player || !enemy || GameState.isBattleEnded) { callback(); return; }

    Logger.log(`追加技能：${followUp.name}！`, true);

    const result = followUp.execute(player, enemy);
    const rawDmg = result.damage || 0;
    const hits = result.hits || 0;
    const isRanged = result.isRanged || false;

    // 无伤害的追加（如过载充能）：播特效后直接结束
    if (rawDmg <= 0 || hits <= 0) {
        const playerPos = getUnitCenter('player-box');
        if (playerPos) {
            ParticleSystem.showDamageNumber(
                playerPos.x, playerPos.y - 40, followUp.name, '#ffd54f', null,
                { fontSize: '18px', holdMs: 500, fadeMs: 900, floatDistance: 20 }
            );
        }
        updateUI();
        setTimeout(callback, 600);
        return;
    }

    const enemyDef = getEnemyDef();

    // cut-in
    ParticleSystem.showSkillCutIn({
        side: 'left',
        icon: followUp.icon || '⚡',
        skillName: followUp.name,
        color: '#ffd54f',
        duration: 900
    });

    const playerPos = getUnitCenter('player-box');
    const enemyPos = getUnitCenter('enemy-box');
    let totalApplied = 0;

    function applyFollowUpHit(i) {
        if (GameState.isBattleEnded) return;
        const effectiveDef = (hits > 1) ? enemyDef * 0.5 : enemyDef;
        let finalDmg = Math.max(1, rawDmg - effectiveDef);
        if (enemy.internalInjury > 0 && player.classId !== 'qi') {
            finalDmg *= (player.qiInternalInjuryMult || 1.3);
        }

        totalApplied += finalDmg;
        enemy.takeDamage(finalDmg);

        const eBox = document.getElementById('enemy-box');
        if (eBox) {
            const rect = eBox.getBoundingClientRect();
            const stage = document.querySelector('.main-stage');
            if (stage) {
                const stageRect = stage.getBoundingClientRect();
                const x = rect.left + rect.width / 2 - stageRect.left + (Math.random() - 0.5) * 40;
                const y = rect.top - stageRect.top + (Math.random() - 0.5) * 30;

                ParticleSystem.showDamageNumber(x, y - 20, finalDmg, '#ffd54f', i === 0 ? followUp.name : null,
                    { fontSize: '18px', holdMs: 350, fadeMs: 800, floatDistance: 22 });

                if (!isRanged) {
                    ParticleSystem.createSlash(x, y, 'light', '#ffd54f');
                }
                ParticleSystem.createImpact(x, y, 'light', '#ffd54f');

                eBox.classList.remove('hit-flash');
                void eBox.offsetWidth;
                eBox.classList.add('hit-flash');
                setTimeout(() => eBox.classList.remove('hit-flash'), 300);

                shakeHpBar('enemy-hp-container', finalDmg, enemy.maxHp || 1);
            }
        }
        updateUI();

        if (enemy.hp <= 0 && !GameState.isBattleEnded) {
            GameState.isBattleEnded = true;
            winBattle();
        }
    }

    if (isRanged && playerPos && enemyPos) {
        ParticleSystem.createProjectile(
            playerPos.x, playerPos.y, enemyPos.x, enemyPos.y,
            { color: '#ffd54f', size: 10, speed: 280, glow: 14, trailCount: 3 },
            () => {
                for (let i = 0; i < hits; i++) {
                    setTimeout(() => applyFollowUpHit(i), i * 200);
                }
            }
        );
        setTimeout(() => {
            if (!GameState.isBattleEnded) {
                Logger.log(`追加技能造成 ${totalApplied.toFixed(1)} 点伤害`, true);
            }
            callback();
        }, hits * 200 + 600);
    } else {
        const pBox = document.getElementById('player-box');
        if (pBox) {
            pBox.classList.remove('lunge-right');
            void pBox.offsetWidth;
            pBox.classList.add('lunge-right');
            setTimeout(() => pBox.classList.remove('lunge-right'), 300);
        }
        for (let i = 0; i < hits; i++) {
            setTimeout(() => applyFollowUpHit(i), i * 200 + 100);
        }
        setTimeout(() => {
            if (!GameState.isBattleEnded) {
                Logger.log(`追加技能造成 ${totalApplied.toFixed(1)} 点伤害`, true);
            }
            updateResourceUI();
            callback();
        }, hits * 200 + 500);
    }
}

function maybeOfferUpgrades() {
    // 已禁用：不再在回合结束时提供强化，改为关卡结束时提供
}

// 胜利处理
function winBattle() {
    GameState.isPaused = true;
    GameState.isProcessingSkill = false;
    Logger.log(`击败了 ${GameState.enemy.name}！`, true);

    if (typeof AudioManager !== 'undefined') {
        AudioManager.stopBgm();
        AudioManager.playUi('success');
    }

    // 金币奖励
    const goldReward = RunManager.getBattleGoldReward();
    RunManager.addGold(goldReward);
    Logger.log(`获得 ${goldReward} 金币（当前: ${RunManager.gold}）`);
    
    // 播放死亡动画
    const enemyBox = document.getElementById('enemy-box');
    if (enemyBox) {
        enemyBox.style.opacity = '0.5';
        enemyBox.style.filter = 'grayscale(100%)';
    }

    setTimeout(() => {
        offerLevelUpgrades();
    }, 1000);
}

// 关卡强化选择
function offerLevelUpgrades() {
    // 精英战/Boss给更好的强化池（更多选项）
    const node = RunManager.getCurrentNode();
    const upgradeCount = (node && (node.type === 'elite' || node.type === 'boss')) ? 4 : 3;
    const options = getRandomUpgrades(upgradeCount);
    
    if (options.length > 0) {
        openUpgradeOverlay(options, (chosenUpgrade) => {
            if (chosenUpgrade) {
                applyUpgrade(chosenUpgrade);
            }
            closeUpgradeOverlay();
            advanceToNextNode();
        });
    } else {
        advanceToNextNode();
    }
}

// 推进到下一个节点
function advanceToNextNode() {
    const hasNext = RunManager.advance();
    if (!hasNext) {
        victoryGame();
        return;
    }

    const node = RunManager.getCurrentNode();
    GameState.currentLevel = RunManager.currentNodeIndex + 1;

    if (node.type === 'rest') {
        handleRestNode();
    } else {
        // battle / elite / boss
        startNextBattle();
    }
}

function resetPlayerForNewBattle(player) {
    if (!player || !player.resources) return;

    // 清理战斗中的临时状态，避免跨战斗残留
    player.shield = 0;
    player.spiritShieldReflect = false;
    player.buffs = [];
    if (typeof player.recalculateStats === 'function') {
        player.recalculateStats();
    }

    switch (player.classId) {
        case 'qi':
            if (player.resources.qi) {
                player.resources.qi.val = player.resources.qi.max;
            }
            break;
        case 'combo':
            if (player.resources.combo) {
                player.resources.combo.val = 0;
            }
            player.speedStacks = 0;
            player.speed = player.baseSpeed;
            break;
        case 'mana':
            if (player.resources.mana) {
                player.resources.mana.val = player.resources.mana.max;
            }
            if (player.resources.ammo) {
                player.resources.ammo.val = 0;
            }
            player.stacks = 0;
            player.speed = player.baseSpeed;
            player._lastSkillWasEnhanced = false;
            if (typeof player.updateSkills === 'function') {
                player.updateSkills();
            }
            break;
        case 'balance':
            if (player.resources.balance) {
                player.resources.balance.val = 0;
            }
            player.extremeState = null;
            player.extremePending = null;
            player.extremeCD = 0;
            player._lastBalanceShift = 0;
            if (typeof player._updateVerdictSkill === 'function') {
                player._updateVerdictSkill();
            }
            break;
        default:
            break;
    }
}

// 进入下一场战斗（使用 RunManager 获取缩放参数）
function startNextBattle() {
    const node = RunManager.getCurrentNode();
    const nodeLabel = RunManager.getNodeLabel();
    Logger.log(`进入节点 ${RunManager.getProgressText()} - ${nodeLabel}`, true);
    
    // 重置战斗结束标记
    GameState.isBattleEnded = false;
    
    // 根据 RunManager 创建敌人并缩放
    GameState.enemy = createTestEnemy('random');
    const scaling = RunManager.getEnemyScaling();
    GameState.enemy.maxHp = Math.floor(GameState.enemy.maxHp * scaling.hpMult);
    GameState.enemy.hp = GameState.enemy.maxHp;
    GameState.enemy.baseAtk = Math.floor(GameState.enemy.baseAtk * scaling.atkMult);
    
    // 更新 CTB 单位列表
    ctbSystem.units = ctbSystem.units.filter(u => u.type === 'player' || u.type === 'spirit');
    ctbSystem.addUnit(GameState.enemy);
    
    // 重置玩家 AV
    if (GameState.player) {
        resetPlayerForNewBattle(GameState.player);
        ctbSystem.resetAV(GameState.player);
    }
    
    // 恢复战斗状态
    GameState.isProcessingSkill = false;
    GameState.isPlayerTurn = false;
    lastActingSide = null;
    ctbSystem.tickSpeed = CTB_NORMAL_SPEED;
    
    // 恢复UI状态
    const enemyBox = document.getElementById('enemy-box');
    if (enemyBox) {
        enemyBox.style.opacity = '1';
        enemyBox.style.filter = 'none';
        const oldIntent = enemyBox.querySelector('.enemy-intent');
        if (oldIntent) oldIntent.remove();
        const oldFrame = enemyBox.querySelector('.enemy-intent-frame');
        if (oldFrame) oldFrame.remove();
    }
    
    // 新敌人规划第一次意图
    if (GameState.enemy && GameState.enemy.planNextAction) {
        GameState.enemy.planNextAction();
    }
    
    GameState.isPaused = false;
    if (typeof AudioManager !== 'undefined' && GameState.player) {
        AudioManager.playBattleBgm(GameState.player.classId, node ? node.type : 'battle');
    }
    updateUI();
}

// 处理休息节点（完整实现在 showRestOverlay 中）
function handleRestNode() {
    Logger.log(`到达休息点（节点 ${RunManager.getProgressText()}）`, true);
    if (typeof AudioManager !== 'undefined') {
        AudioManager.stopBgm();
    }
    if (typeof showRestOverlay === 'function') {
        showRestOverlay(() => {
            advanceToNextNode();
        });
    } else {
        // 降级处理：如果休息系统未加载，直接跳过
        advanceToNextNode();
    }
}

// 兼容旧调用（如果有的话）
function startNextLevel() {
    advanceToNextNode();
}

// 通关胜利
function victoryGame() {
    GameState.isRunning = false;
    if (typeof AudioManager !== 'undefined') {
        AudioManager.stopBgm();
        AudioManager.playUi('success');
    }
    const overlay = document.getElementById('upgrade-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div style="text-align: center; color: white; padding: 40px;">
                <h1 style="color: #ffd54f; font-size: 32px; margin-bottom: 20px;">通关成功</h1>
                <div style="font-size: 16px; line-height: 2; color: #e0e0e0;">
                    <div>通过了全部 ${RunManager.nodes.length} 个节点</div>
                    <div>战斗回合: ${GameState.turnCount}</div>
                    <div>获得强化: ${GameState.upgradesChosen} 个</div>
                    <div>积累金币: ${RunManager.gold}</div>
                </div>
                <button onclick="location.reload()" style="margin-top: 30px; padding: 12px 30px; font-size: 18px; cursor: pointer; background: #1a1a2e; color: #ffd54f; border: 1px solid #ffd54f; border-radius: 8px;">返回主菜单</button>
            </div>
        `;
    }

    const returnBtn = overlay ? overlay.querySelector('button') : null;
    if (returnBtn && typeof AudioManager !== 'undefined') {
        AudioManager.bindUiSound(returnBtn, { hover: 'hover', click: 'confirm' });
    }
}

// 绑定选择器事件
window.addEventListener('DOMContentLoaded', () => {
    // 角色选择器（战斗中的切换，可选功能）
    const classSelector = document.getElementById('class-selector');
    if (classSelector) {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(classSelector, { click: 'select' });
        }
        classSelector.addEventListener('change', (e) => {
            if (GameState.player) {
                removeUnitFromTimeline(GameState.player);
            }
            GameState.selectedClass = e.target.value;
            selectClass(e.target.value);
        });
    }

    // 结束战斗按钮
    const restartBtn = document.getElementById('restart-button');
    if (restartBtn) {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(restartBtn, { hover: 'hover', click: 'confirm' });
        }
        restartBtn.addEventListener('click', restartGame);
    }

    const upgradeSkip = document.getElementById('upgrade-skip');
    if (upgradeSkip) {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(upgradeSkip, { hover: 'hover', click: 'skip' });
        }
        upgradeSkip.addEventListener('click', closeUpgradeOverlay);
    }

    // 键盘快捷键（1/2/3 对应三个技能）
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F8') {
            e.preventDefault();
            toggleDebugMode();
            return;
        }
        if (!GameState.isPlayerTurn || GameState.isProcessingSkill || !GameState.player) return;
        if (GameState.isUpgradeOpen) return;
        const spiritOverlay = document.getElementById('spirit-select-overlay');
        if (spiritOverlay && !spiritOverlay.classList.contains('hidden')) return;

        const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
        const idx = keyMap[e.key];
        if (idx === undefined) return;

        const skills = GameState.player.skills;
        if (idx < skills.length && GameState.player.canUseSkill(skills[idx])) {
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playUi('confirm');
            }
            usePlayerSkill(skills[idx].id);
        }
    });

    initSelectionScreen();
    initSelectionParticles();
});

// 战斗背景漂浮光球
function initBattleBgOrbs() {
    const container = document.getElementById('battle-bg-orbs');
    if (!container) return;
    container.innerHTML = ''; // 防止重复创建
    const colors = ['rgba(0,212,255,0.2)', 'rgba(255,107,157,0.18)', 'rgba(255,217,61,0.15)', 'rgba(0,255,136,0.15)'];
    for (let i = 0; i < 8; i++) {
        const orb = document.createElement('div');
        orb.className = 'battle-orb';
        const size = Math.random() * 160 + 80;
        orb.style.width = size + 'px';
        orb.style.height = size + 'px';
        orb.style.background = colors[i % colors.length];
        orb.style.left = (Math.random() * 80 + 10) + '%';
        orb.style.top = (Math.random() * 70 + 15) + '%';
        orb.style.setProperty('--orb-dx', (Math.random() * 150 - 75) + 'px');
        orb.style.setProperty('--orb-dy', (Math.random() * 120 - 60) + 'px');
        orb.style.animationDuration = (Math.random() * 8 + 6) + 's';
        orb.style.animationDelay = (Math.random() * 5) + 's';
        container.appendChild(orb);
    }
}

// 选择界面背景粒子
function initSelectionParticles() {
    const container = document.getElementById('sel-bg-particles');
    if (!container) return;
    const count = 30;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'sel-particle';
        const size = Math.random() * 2 + 1;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.bottom = -(Math.random() * 20) + '%';
        p.style.animationDuration = (Math.random() * 8 + 6) + 's';
        p.style.animationDelay = (Math.random() * 10) + 's';
        p.style.opacity = '0';
        container.appendChild(p);
    }
}
