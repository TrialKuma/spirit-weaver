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

function removeSpiritShrineGmStrip(overlay) {
    if (!overlay) return;
    const strip = overlay.querySelector('.spirit-gm-strip');
    if (strip) strip.remove();
}

function finishSpiritShrineSelection(overlay, optionsEl, shrineParticles, spirit, onChosen) {
    setTimeout(() => {
        overlay.classList.add('shrine-exit');
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('shrine-mode', 'shrine-exit');
            if (shrineParticles) shrineParticles.innerHTML = '';
            optionsEl.querySelectorAll('.spirit-choice-card').forEach(c => {
                c.classList.remove('spirit-chosen', 'spirit-dismissed');
            });
            removeSpiritShrineGmStrip(overlay);
            selectSpirit(spirit.id);
            if (typeof onChosen === 'function') {
                onChosen(spirit);
            }
        }, 500);
    }, 800);
}

function showSpiritShrine(onChosen) {
    const overlay = document.getElementById('spirit-select-overlay');
    const optionsEl = document.getElementById('spirit-choice-options');
    const titleEl = document.getElementById('spirit-select-title');
    if (!overlay || !optionsEl) return;

    removeSpiritShrineGmStrip(overlay);

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
            const allCards = optionsEl.querySelectorAll('.spirit-choice-card');
            allCards.forEach(c => {
                if (c === card) {
                    c.classList.add('spirit-chosen');
                } else {
                    c.classList.add('spirit-dismissed');
                }
            });
            finishSpiritShrineSelection(overlay, optionsEl, shrineParticles, spirit, onChosen);
        });
        optionsEl.appendChild(card);
    });

    const hintEl = panelEl ? panelEl.querySelector('.spirit-select-hint') : null;
    if (
        panelEl &&
        hintEl &&
        typeof isDebugModeEnabled === 'function' &&
        isDebugModeEnabled() &&
        typeof getAllSpiritCatalogEntries === 'function'
    ) {
        const typeNameMapGm = {
            autonomous: '自律',
            cooperative: '协力',
            assistant: '助理'
        };
        const strip = document.createElement('div');
        strip.className = 'spirit-gm-strip';

        const toggleRow = document.createElement('div');
        toggleRow.className = 'spirit-gm-toggle-row';

        const hintLabel = document.createElement('div');
        hintLabel.className = 'spirit-gm-toggle';
        hintLabel.textContent = 'GM · 全魂灵图鉴（9） · 下方区域可滚轮浏览';

        const body = document.createElement('div');
        body.className = 'spirit-gm-body';

        const catOrder = ['autonomous', 'cooperative', 'assistant'];
        const allEntries = getAllSpiritCatalogEntries();
        catOrder.forEach(cat => {
            const group = allEntries.filter(s => s.spiritType === cat);
            if (group.length === 0) return;

            const sec = document.createElement('div');
            sec.className = 'spirit-gm-section';

            const secTitle = document.createElement('div');
            secTitle.className = 'spirit-gm-section-title';
            secTitle.textContent = typeNameMapGm[cat] || cat;
            sec.appendChild(secTitle);

            const grid = document.createElement('div');
            grid.className = 'spirit-gm-grid';

            group.forEach(spiritDef => {
                const tile = document.createElement('button');
                tile.type = 'button';
                tile.className = `spirit-gm-tile ${spiritDef.spiritType || ''}`;

                const iconSpan = document.createElement('span');
                iconSpan.className = 'spirit-gm-tile-icon';
                iconSpan.textContent = spiritDef.icon || '✦';
                tile.appendChild(iconSpan);

                const nameSpan = document.createElement('span');
                nameSpan.className = 'spirit-gm-tile-name';
                nameSpan.textContent = spiritDef.name;
                tile.appendChild(nameSpan);

                const descSpan = document.createElement('span');
                descSpan.className = 'spirit-gm-tile-desc';
                descSpan.textContent = spiritDef.desc || '（无描述）';
                tile.appendChild(descSpan);

                if (typeof AudioManager !== 'undefined') {
                    AudioManager.bindUiSound(tile, { hover: 'hover', click: 'confirm' });
                }
                tile.addEventListener('click', () => {
                    optionsEl.querySelectorAll('.spirit-choice-card').forEach(c => c.classList.add('spirit-dismissed'));
                    strip.querySelectorAll('.spirit-gm-tile').forEach(t => t.classList.remove('spirit-gm-tile-chosen'));
                    tile.classList.add('spirit-gm-tile-chosen');
                    finishSpiritShrineSelection(overlay, optionsEl, shrineParticles, spiritDef, onChosen);
                });
                grid.appendChild(tile);
            });

            sec.appendChild(grid);
            body.appendChild(sec);
        });

        toggleRow.appendChild(hintLabel);
        strip.appendChild(toggleRow);
        strip.appendChild(body);
        panelEl.insertBefore(strip, hintEl.nextSibling);
    }

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
    GameState.hammers = {};
    GameState.hammersChosen = 0;
    GameState.hammersPending = null;
    if (typeof resetSkillDamageStats === 'function') {
        resetSkillDamageStats();
    }

    // 使用 RunManager 生成分支地图
    RunManager.generateRun();
    GameState.currentLevel = 1;
    GameState.maxLevels = RunManager.acts.reduce((s, a) => s + a.layers.length, 0);
    
    document.getElementById('turn-count').textContent = 0;
    document.getElementById('log-panel').innerHTML = '<div class="log-entry">战斗开始...</div>';

    // 使用默认角色
    ctbSystem.units = [];
    if (ctbSystem._elMap) { ctbSystem._elMap.clear(); }
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
    if (GameState.spirit) {
        Logger.log(`契约魂灵: ${GameState.spirit.name}`);
    }

    if (!loopStarted) {
        loopStarted = true;
        gameLoop();
    }

    // 进入第 1 幕：先启动入口节点，再显示地图让玩家选路
    RunManager.startAct();
    enterCurrentNode();
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
    GameState.hammers = {};
    GameState.hammersChosen = 0;
    GameState.hammersPending = null;
    if (typeof resetSkillDamageStats === 'function') {
        resetSkillDamageStats();
    }

    // 重置 CTB 速度
    lastActingSide = null;
    ctbSystem.tickSpeed = CTB_NORMAL_SPEED;
    
    // 清理 UI
    setActiveTurn(null);
    const gameoverOverlay = document.getElementById('gameover-overlay');
    if (gameoverOverlay) gameoverOverlay.remove();
    const victoryOverlay = document.getElementById('victory-overlay');
    if (victoryOverlay) victoryOverlay.remove();
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
    // 隐藏地图
    if (typeof hideMapOverlay === 'function') hideMapOverlay();

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
    const actText = (typeof RunManager !== 'undefined') ? RunManager.getActText() : '';
    const nodeLabel = (typeof RunManager !== 'undefined') ? RunManager.getNodeLabel() : '';
    overlay.innerHTML = `
        <div class="gameover-panel">
            <div class="gameover-title">战斗失败</div>
            <div class="gameover-stats">
                <div>倒在了 ${actText} ${nodeLabel}</div>
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
    updateUI();
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

// ===== 敌人序列帧动画系统 =====
const EnemySpriteAnim = {
    basePath: 'assets/art/enemies/demon_frames/',
    idleFrame: 0,
    // 动作帧映射：第一行0-3=待机/移动，第二行4-7=攻击序列，第三行8-11=其他
    sequences: {
        idle:   [0],
        windup: [2, 3],       // 前摇：待机姿态渐进（04已去掉，用02/03的攻击准备姿态）
        strike: [5, 6],       // 攻击：弧形挥砍→砸地爆发（04举刀、07前刺已去掉）
        hit:    [8],          // 受击（09已去掉）
        recover:[10, 11, 0],  // 恢复→待机
    },
    _timer: null,

    setFrame(frameIdx) {
        const sprite = document.getElementById('enemy-sprite');
        if (sprite) sprite.src = this.basePath + `frame_${String(frameIdx).padStart(2,'0')}.png`;
    },

    playSequence(name, opts = {}) {
        const seq = this.sequences[name];
        if (!seq) return Promise.resolve();
        const frameDuration = opts.frameDuration || 150;
        const loops = opts.loops || 1;
        const enemyBox = document.getElementById('enemy-box');

        return new Promise(resolve => {
            let i = 0;
            const totalFrames = seq.length * loops;
            if (this._timer) clearInterval(this._timer);

            if (opts.cssClass && enemyBox) enemyBox.classList.add(opts.cssClass);

            this._timer = setInterval(() => {
                if (i >= totalFrames) {
                    clearInterval(this._timer);
                    this._timer = null;
                    if (opts.cssClass && enemyBox) enemyBox.classList.remove(opts.cssClass);
                    resolve();
                    return;
                }
                this.setFrame(seq[i % seq.length]);
                i++;
            }, frameDuration);
        });
    },

    async playAttack() {
        // 前摇：蓄力帧循环3次（约900ms）
        await this.playSequence('windup', { frameDuration: 150, loops: 3, cssClass: 'enemy-windup' });
        // 出招：攻击帧
        await this.playSequence('strike', { frameDuration: 120, loops: 1, cssClass: 'enemy-strike' });
        // 回待机
        this.setFrame(this.idleFrame);
    },

    async playHit() {
        await this.playSequence('hit', { frameDuration: 120, loops: 1 });
        await this.playSequence('recover', { frameDuration: 150, loops: 1 });
    },

    reset() {
        if (this._timer) clearInterval(this._timer);
        this.setFrame(this.idleFrame);
    }
};

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

    // 判断是否为攻击类行动
    let actionType = 'attack';
    if (enemy.nextAction) actionType = enemy.nextAction.type;
    const isAttack = (actionType === 'attack' || actionType === 'charge');

    if (isAttack) {
        // ===== 攻击类：前摇喊话 → 出招帧+冲刺同时出伤 → 回来 =====
        const actionDesc = (enemy.nextAction && enemy.nextAction.desc) || '';
        let cutinSkillName = actionDesc.split('！')[0] || actionDesc.split('，')[0] || actionType;
        if (cutinSkillName.length > 6) cutinSkillName = cutinSkillName.substring(0, 6);
        const cutinIcon = (enemy.icon) || '👾';
        const cutinColor = getEnemyActionColor(actionType);

        // 1. 前摇开始时立刻喊话
        ParticleSystem.showSkillCutIn({
            side: 'right',
            icon: cutinIcon,
            skillName: cutinSkillName,
            color: cutinColor,
            duration: 800
        });

        // 2. 同时播前摇帧动画
        EnemySpriteAnim.playSequence('windup', { frameDuration: 150, loops: 3, cssClass: 'enemy-windup' }).then(() => {
            // 3. 前摇结束 → 执行伤害（数据层）
            let result = { damage: 0 };
            const playerShieldBefore = (GameState.player && GameState.player.shield) || 0;
            if (enemy.executeAction) {
                result = enemy.executeAction(GameState.player);
            } else {
                if (GameState.player) {
                    const damage = enemy.baseAtk;
                    GameState.player.takeDamage(damage);
                    result.damage = damage;
                }
            }

            // 4. 出招帧 + 冲刺 + 命中特效同时播放
            EnemySpriteAnim.playSequence('strike', { frameDuration: 120, loops: 1, cssClass: 'enemy-strike' });

            const enemyBoxEl = document.getElementById('enemy-box');
            const playerBox = document.getElementById('player-box');
            if (enemyBoxEl) {
                enemyBoxEl.style.transition = 'transform 0.15s ease-in';
                enemyBoxEl.style.transform = 'translateX(-45vw)';
                setTimeout(() => {
                    enemyBoxEl.style.transition = 'transform 0.35s ease-out';
                    enemyBoxEl.style.transform = '';
                    setTimeout(() => { enemyBoxEl.style.transition = ''; }, 400);
                }, 300);
            }

            // 5. 冲到位时播命中特效
            setTimeout(() => {
                const pPos = getUnitCenter('player-box');
                if (result.damage > 0 && GameState.player) {
                    if (typeof SFX !== 'undefined') SFX.hit();
                    if (pPos) {
                        ParticleSystem.showDamageNumber(pPos.x, pPos.y - 20, result.damage, '#ff6b9d');
                        const impactType = actionType === 'charge' ? 'charge' : 'enemy';
                        ParticleSystem.createImpact(pPos.x, pPos.y, impactType);
                        const slashType = actionType === 'charge' ? 'heavy' : 'light';
                        ParticleSystem.createSlash(pPos.x, pPos.y, slashType);
                    }
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
                    if (playerBox) {
                        playerBox.classList.remove('hit-flash', 'knockback-left', 'knockback-left-heavy');
                        void playerBox.offsetWidth;
                        playerBox.classList.add('hit-flash');
                        playerBox.classList.add(actionType === 'charge' ? 'knockback-left-heavy' : 'knockback-left');
                        setTimeout(() => playerBox.classList.remove('hit-flash', 'knockback-left', 'knockback-left-heavy'), 400);
                    }
                    shakeHpBar('player-hp-container', result.damage, GameState.player.maxHp);
                    const playerShieldAfter = (GameState.player && GameState.player.shield) || 0;
                    if (playerShieldBefore > 0 && playerShieldAfter <= 0 && pPos) {
                        ParticleSystem.createImpact(pPos.x, pPos.y, 'light', '#64b5f6');
                        ParticleSystem.flashScreen('rgba(100, 181, 246, 0.25)', 100);
                        ParticleSystem.showDamageNumber(pPos.x, pPos.y - 50, '护盾破碎!', '#64b5f6', null, { holdMs: 500, fadeMs: 1000, floatDistance: 25 });
                    }
                }
                updateUI();

                // 6. 回待机 + 结束回合
                setTimeout(() => {
                    EnemySpriteAnim.setFrame(EnemySpriteAnim.idleFrame);
                    _finishEnemyTurn(enemy);
                }, 400);
            }, 130); // 冲刺动画25%时命中（500ms * 0.25 ≈ 130ms）
        });
    } else {
        _executeEnemyAction(enemy);
    }
}

function _finishEnemyTurn(enemy) {
    if (GameState.player && GameState.player.hp <= 0) {
        setTimeout(() => { gameOver(); }, 800);
        return;
    }
    setTimeout(() => {
        setActiveTurn(null);
        if (enemy.updateBuffs) {
            enemy.updateBuffs();
            updateBuffBars();
        }
        updateBuffBars();
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
    }, 600);
}

function _executeEnemyAction(enemy) {    
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
            }
            updateBuffBars();

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

    // ===== 非攻击行为：即时表现已在上面播放完毕，直接结束 =====
    updateUI();
    _finishEnemyTurn(enemy);
}

// 魂灵回合（自律型 或 手操型）
function spiritTurn(spirit) {
    if (!spirit) return;
    GameState.isPaused = true;
    const result = spirit.onSpiritTurn ? spirit.onSpiritTurn() : null;
    updateUI();
    if (typeof updateSkillsUI === 'function') updateSkillsUI();

    if (result && result.interactive) {
        // 连击魂等手操型：等待玩家在魂灵区选技能，回调由 UI 触发
        if (GameState.spiritTurnPending) {
            GameState.spiritTurnPending.callback = () => {
                if (spirit && typeof ctbSystem.resetAV === 'function') {
                    ctbSystem.resetAV(spirit);
                    // 交错计数：记录上次行动者为魂灵
                    if (spirit.state) spirit.state.lastActor = 'spirit';
                }
                GameState.spiritTurnPending = null;
                GameState.isPaused = false;
                updateUI();
                if (typeof updateSkillsUI === 'function') updateSkillsUI();
            };
        }
    } else {
        setTimeout(() => {
            if (spirit && typeof ctbSystem.resetAV === 'function') {
                ctbSystem.resetAV(spirit);
            }
            GameState.isPaused = false;
            updateUI();
        }, result && result.delayMs ? result.delayMs : 600);
    }
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
    GameState.hammers = {}; // 重置锤子记录
    
    const classNameEl = document.getElementById('player-class');
    if (classNameEl) classNameEl.textContent = classNames[classId] || classId;
    Logger.log(`选择角色: ${classNames[classId]}`, true);
    
    // 触发回合开始回调
    GameState.player.onTurnStart();

    // 填充 GM 锤子面板
    if (typeof updateGmHammerPanel === 'function') updateGmHammerPanel();
    
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
    
    // 通用升级：绝境反击
    if (GameState.player.upgradeDesperationMult && GameState.player.hp < GameState.player.maxHp * 0.3) {
        baseDamage *= (1 + GameState.player.upgradeDesperationMult);
    }

    // 通用升级：破甲专精
    if (GameState.player.upgradeArmorExpert && GameState.enemy && (GameState.enemy.def || 0) > 3) {
        baseDamage *= (1 + GameState.player.upgradeArmorExpert);
    }

    // 实际命中段数（直接从技能属性读，多段已通过锤子修改）
    let actualHits = skill.hits || 1;

    // 计算总伤害
    let totalDamage = baseDamage;
    if (skill.calculatedDamage === undefined && skill.hits && skill.hits > 1) {
        totalDamage = baseDamage * actualHits;
    } else if (skill.calculatedDamage !== undefined) {
        if (skill.id === 'burst') {
            const singleHitDmg = baseDamage / (skill.hits || 1);
            totalDamage = singleHitDmg * actualHits;
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

    // 构建行动对象（qiCost 供气息魂/连击魂 hooks 使用）
    const qiCost = (skill.cost && skill.cost.qi) ? skill.cost.qi : 0;
    const playerAction = {
        type: 'skill',
        skill: skill,
        damage: totalDamage,
        cost: skill.cost,
        hits: actualHits,
        qiCost   // 本次消耗的气息量
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
        
        // 气宗架势回气等角色回合结束效果
        if (typeof GameState.player.onTurnEnd === 'function') {
            GameState.player.onTurnEnd();
        }

        // 更新所有 Buff 持续时间 (回合结束时)
        GameState.player.updateBuffs();

        // 战场洞察：每5回合获得暴击buff
        if (GameState.player && GameState.player.upgradeInsight) {
            GameState.player.insightCounter = (GameState.player.insightCounter || 0) + 1;
            if (GameState.player.insightCounter >= 5) {
                GameState.player.insightCounter = 0;
                GameState.player.critChance = (GameState.player.critChance || 0) + 0.5;
                GameState.player.critMult = 1.5;
                Logger.log('【洞察】激活！下一击必定暴击(x1.5)', true);
            }
        }

        // 连击奖励：3hit以上回复5%生命
        if (GameState.player && GameState.player.upgradeComboReward && actualHits >= 3) {
            const heal = Math.floor(GameState.player.maxHp * 0.05);
            GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + heal);
            Logger.log(`连击奖励：回复 ${heal} 点生命`);
        }

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

            // 新内伤系统（spiritInjury，由气息魂管理）
            if ((GameState.enemy.spiritInjury || 0) > 0 && GameState.player) {
                const vuln = GameState.enemy.spiritInjuryVuln || 1.2;
                finalHitDmg *= vuln;
                GameState.enemy.spiritInjury = Math.max(0, GameState.enemy.spiritInjury - 1);
                // 回流分支：内伤被玩家消耗时 ATK +1
                const sp = GameState.spirit;
                if (sp && sp.state && sp.state.branchReflux) {
                    GameState.player.baseAtk = (GameState.player.baseAtk || 10) + 1;
                    Logger.log(`【回流】玩家ATK +1（当前 ${GameState.player.baseAtk}）`);
                }
                if (typeof updateBuffBars === 'function') updateBuffBars();
            }

            // 暴击判定
            let critChance = (GameState.player && GameState.player.critChance) ? GameState.player.critChance : 0;
            let critMult = (GameState.player && GameState.player.critMult) ? GameState.player.critMult : 2.0;
            let isCrit = false;

            // （旧内伤暴击逻辑已移除，暴击仅通过通用升级获得）
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
            if (typeof recordSkillDamageStat === 'function' && skill && skill.id) {
                const statName = skill._tempName || skill.name || skill.id;
                recordSkillDamageStat(`skill:${skill.id}`, statName, finalHitDmg);
            }

            if (i === 0 && skill.onHit && GameState.player && GameState.enemy) {
                skill.onHit(GameState.player, GameState.enemy);
            }

            // 剑圣：每段命中+1连击（noComboGain = false 或未设置时才积攒）
            if (GameState.player && GameState.player.classId === 'combo' && !skill.noComboGain) {
                if (typeof GameState.player.addCombo === 'function') {
                    GameState.player.addCombo(1);
                }
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
                    if ((GameState.enemy.spiritInjury || 0) > 0) color = '#ff4400';
                    
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
                
                // 敌人框体受击闪红 + 击退 + 受击帧
                enemyBox.classList.remove('hit-flash', 'knockback-right', 'knockback-right-heavy');
                void enemyBox.offsetWidth;
                enemyBox.classList.add('hit-flash');
                const isHeavyKnockback = tags.includes('Heavy') || tags.includes('Ultimate') || isCrit;
                enemyBox.classList.add(isHeavyKnockback ? 'knockback-right-heavy' : 'knockback-right');
                setTimeout(() => enemyBox.classList.remove('hit-flash', 'knockback-right', 'knockback-right-heavy'), 400);
                if (typeof EnemySpriteAnim !== 'undefined') EnemySpriteAnim.playHit();
                
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
                    const afterSkillContext = { player: GameState.player, enemy: GameState.enemy, skill, totalDamage: totalDamageApplied, hits, qiCost };
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

                    // 气合拳：伤害转护盾
                    if (skill.damageToShield && GameState.player) {
                        GameState.player.shield += totalDamageApplied;
                        Logger.log(`气合拳：获得护盾 +${totalDamageApplied.toFixed(1)}`, true);
                    }
                    // 龙腾：晕眩（延迟目标行动条1整轮）
                    if (skill.applyStun && GameState.enemy) {
                        const stunRounds = skill.applyStun || 1;
                        if (typeof delayUnitAV === 'function') {
                            delayUnitAV(GameState.enemy, stunRounds);
                            Logger.log(`龙腾晕眩！目标行动推迟${stunRounds}轮`, true);
                        }
                    }

                    const afterSkillContext = { player: GameState.player, enemy: GameState.enemy, skill, totalDamage: totalDamageApplied, hits, qiCost };
                    GameEvents.emit('afterSkill', afterSkillContext);
                    if (GameState.spirit && GameState.spirit.onAfterSkill) GameState.spirit.onAfterSkill(afterSkillContext);
                    checkFollowUp(endTurn, skill.id);
                }
            }, hits * hitInterval + 500);
        }
    } else {
        // 无伤害技能（架势等）：显示防御特效
        if (skill.effect === 'stance') {
            const playerBox = document.getElementById('player-box');
            if (playerBox) {
                playerBox.classList.add('stance-flash');
                setTimeout(() => playerBox.classList.remove('stance-flash'), 400);
            }
            const pos = getUnitCenter('player-box');
            if (pos && typeof ParticleSystem !== 'undefined') {
                ParticleSystem.showDamageNumber(pos.x, pos.y - 30, '架势！', '#66ccff', null,
                    { holdMs: 500, fadeMs: 900, floatDistance: 20 });
                ParticleSystem.createParticles(pos.x, pos.y, 16, '#66ccff');
            }
        }
        const afterSkillContext = {
            player: GameState.player,
            enemy: GameState.enemy,
            skill,
            totalDamage: 0,
            hits: 0,
            qiCost
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
        // 追加技能也触发内伤易伤（spiritInjury）
        if ((enemy.spiritInjury || 0) > 0) {
            finalDmg *= (enemy.spiritInjuryVuln || 1.2);
            enemy.spiritInjury = Math.max(0, enemy.spiritInjury - 1);
            if (typeof updateBuffBars === 'function') updateBuffBars();
        }

        totalApplied += finalDmg;
        enemy.takeDamage(finalDmg);
        if (typeof recordSkillDamageStat === 'function' && followUp && followUp.id) {
            const fuLabel = followUp.name ? `追加·${followUp.name}` : followUp.id;
            recordSkillDamageStat(`fu:${followUp.id}`, fuLabel, finalDmg);
        }
        // 剑圣追加技能也按 comboGain 积攒连击（仅第一hit处理，避免多段重复计算）
        if (i === 0 && player.classId === 'combo' && result.comboGain && result.comboGain > 0) {
            if (typeof player.addCombo === 'function') player.addCombo(result.comboGain);
        }

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
                if (typeof SFX !== 'undefined') SFX.hit();

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
            // 乱舞链：如果本次追加有 chainId，触发链式追加
            if (result.chainId && !GameState.isBattleEnded) {
                const chainDef = (typeof FollowUpSkillDefs !== 'undefined') ? FollowUpSkillDefs[result.chainId] : null;
                if (chainDef && chainDef.canUse && chainDef.canUse(GameState.player)) {
                    executeFollowUp(chainDef, callback);
                    return;
                }
            }
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
    const node = RunManager.getCurrentNode();
    const upgradeCount = (node && (node.type === 'elite' || node.type === 'boss')) ? 4 : 3;
    const options = getRandomUpgrades(upgradeCount);
    
    if (options.length > 0) {
        openUpgradeOverlay(options, (chosenUpgrade) => {
            if (chosenUpgrade) {
                applyUpgrade(chosenUpgrade);
            }
            closeUpgradeOverlay();
            afterNodeCompleted();
        });
    } else {
        afterNodeCompleted();
    }
}

// 节点完成后的流程分流
function afterNodeCompleted() {
    const node = RunManager.getCurrentNode();
    if (!node) return;

    // Boss 节点完成后：进入下一幕或通关
    if (node.type === 'boss') {
        if (RunManager.isLastAct()) {
            victoryGame();
        } else {
            RunManager.advanceAct();
            RunManager.startAct();
            Logger.log(`进入 ${RunManager.getActText()}`, true);
            // 入口节点自动完成，显示地图选下一步
            openMap();
        }
        return;
    }

    // 其他节点完成后：显示地图让玩家选下一个节点
    openMap();
}

// 打开地图界面
function openMap() {
    // 隐藏战斗界面
    const container = document.querySelector('.container');
    if (container) container.classList.remove('visible');

    showMapOverlay((nodeId) => {
        RunManager.chooseNode(nodeId);
        GameState.currentLevel = RunManager.getTotalVisited();
        hideMapOverlay();
        enterCurrentNode();
    });
}

// 根据当前节点类型进入对应流程
function enterCurrentNode() {
    const node = RunManager.getCurrentNode();
    if (!node) return;

    Logger.log(`进入 ${RunManager.getActText()} ${RunManager.getProgressText()} - ${node.label}`, true);
    updateUI();

    if (node.type === 'rest') {
        handleRestNode();
    } else if (node.type === 'hammer') {
        handleHammerNode();
    } else {
        // battle / elite / boss -> 进入战斗
        const container = document.querySelector('.container');
        if (container) container.classList.add('visible');
        startNextBattle();
    }
}

// 兼容旧函数名
function advanceToNextNode() {
    afterNodeCompleted();
}

// 锤子节点
function handleHammerNode() {
    if (typeof AudioManager !== 'undefined') {
        AudioManager.stopBgm();
    }

    const classId = GameState.player ? GameState.player.classId : 'qi';
    const options = (typeof getRandomHammers === 'function') ? getRandomHammers(classId, 3) : [];

    if (options.length === 0) {
        Logger.log('没有可用的魂印，继续前进', true);
        afterNodeCompleted();
        return;
    }

    showHammerChoice(options, (chosen) => {
        if (chosen && typeof applyHammerToPlayer === 'function') {
            applyHammerToPlayer(chosen);
        }
        afterNodeCompleted();
    });
}

// 锤子选择UI
function showHammerChoice(options, onChosen) {
    const overlay = document.getElementById('upgrade-overlay');
    const container = document.getElementById('upgrade-options');
    if (!overlay || !container) {
        if (onChosen) onChosen(null);
        return;
    }

    if (typeof AudioManager !== 'undefined') AudioManager.playUi('open');

    GameState.isPaused = true;
    GameState.isUpgradeOpen = true;
    overlay.style.pointerEvents = 'auto';

    const titleEl = overlay.querySelector('.upgrade-title');
    if (titleEl) titleEl.textContent = '魂铸 — 选择魂印';

    container.innerHTML = '';

    options.forEach(hammer => {
        const card = document.createElement('div');
        card.className = 'upgrade-card rarity-SSR hammer-card';

        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(card, { hover: 'hover', click: 'confirm' });
        }

        card.onclick = () => {
            closeUpgradeOverlay();
            if (titleEl) titleEl.textContent = '强化选择';
            if (onChosen) onChosen(hammer);
        };

        const iconEl = document.createElement('div');
        iconEl.className = 'upgrade-icon hammer-icon';
        iconEl.textContent = hammer.icon || '🔨';
        card.appendChild(iconEl);

        const name = document.createElement('div');
        name.className = 'upgrade-name';
        name.innerHTML = `${hammer.name} <span class="upgrade-rarity-badge SSR">魂印</span>`;
        card.appendChild(name);

        const desc = document.createElement('div');
        desc.className = 'upgrade-desc';
        desc.textContent = hammer.desc;
        card.appendChild(desc);

        const targetTag = document.createElement('div');
        targetTag.className = 'upgrade-class-tag';
        const skillNames = { light_punch: '轻拳', rapid_strike: '迅击', devastate: '崩山', stance: '架势',
            quick_slash: '快斩', chain_slash: '连斩', finisher: '终结技', kiri: '见切',
            shoot: '射击', burst: '爆射', reload: '装填',
            yang_strike: '阳击', yin_strike: '阴击', verdict: '宣判' };
        targetTag.textContent = `改造：${skillNames[hammer.targetSkill] || hammer.targetSkill}`;
        card.appendChild(targetTag);

        container.appendChild(card);
    });

    const skipBtn = document.getElementById('upgrade-skip');
    if (skipBtn) {
        const newSkipBtn = skipBtn.cloneNode(true);
        skipBtn.parentNode.replaceChild(newSkipBtn, skipBtn);
        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(newSkipBtn, { hover: 'hover', click: 'skip' });
        }
        newSkipBtn.addEventListener('click', () => {
            closeUpgradeOverlay();
            if (titleEl) titleEl.textContent = '强化选择';
            if (onChosen) onChosen(null);
        });
    }

    overlay.classList.remove('hidden');
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
            player._usedStanceThisTurn = false;
            player._tookHitAfterStance = false;
            player._huijiAvailable = false;
            break;
        case 'combo':
            if (player.resources.combo) {
                player.resources.combo.val = 0;
            }
            player._seeingStance = false;
            player._perfectParryReady = false;
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
            player.karmaPool = 0;
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

    // 重置战斗结束标记
    GameState.isBattleEnded = false;
    if (typeof resetSkillDamageStats === 'function') {
        resetSkillDamageStats();
    }

    // 根据 RunManager 创建敌人并缩放
    GameState.enemy = createTestEnemy('random');
    const scaling = RunManager.getEnemyScaling();
    GameState.enemy.maxHp = Math.floor(GameState.enemy.maxHp * scaling.hpMult);
    GameState.enemy.hp = GameState.enemy.maxHp;
    GameState.enemy.baseAtk = Math.floor(GameState.enemy.baseAtk * scaling.atkMult);
    
    // 更新 CTB 单位列表
    ctbSystem.units = ctbSystem.units.filter(u => u.type === 'player' || u.type === 'spirit');
    ctbSystem.addUnit(GameState.enemy);
    
    // 重置玩家 & 魂灵 AV
    if (GameState.player) {
        resetPlayerForNewBattle(GameState.player);
        ctbSystem.resetAV(GameState.player);
    }
    if (GameState.spirit && ctbSystem.units.includes(GameState.spirit)) {
        ctbSystem.resetAV(GameState.spirit);
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
    
    // 先手优势升级：战斗开始获得加速buff
    if (GameState.player && GameState.player.upgradeFirstStrike) {
        GameState.player.addBuff({
            name: '先手优势', type: 'buff', stat: 'speed',
            value: 0.3, duration: 1, desc: '速度+30%（1回合）'
        });
    }

    // 重置洞察计数
    if (GameState.player && GameState.player.upgradeInsight) {
        GameState.player.insightCounter = 0;
    }

    GameState.isPaused = false;
    if (typeof AudioManager !== 'undefined' && GameState.player) {
        AudioManager.playBattleBgm(GameState.player.classId, node ? node.type : 'battle');
    }
    updateUI();
}

// 处理休息节点（完整实现在 showRestOverlay 中）
function handleRestNode() {
    if (typeof AudioManager !== 'undefined') {
        AudioManager.stopBgm();
    }
    if (typeof showRestOverlay === 'function') {
        showRestOverlay(() => {
            afterNodeCompleted();
        });
    } else {
        afterNodeCompleted();
    }
}

// 兼容旧调用（如果有的话）
function startNextLevel() {
    advanceToNextNode();
}

// 通关胜利
function victoryGame() {
    GameState.isRunning = false;
    GameState.isPaused = true;
    if (typeof AudioManager !== 'undefined') {
        AudioManager.stopBgm();
        AudioManager.playUi('success');
    }

    // 构建已装备锤子列表
    let hammerSummary = '';
    const equippedHammers = GameState.hammers || {};
    const hammerNames = Object.values(equippedHammers).map(h => h.name);
    if (hammerNames.length > 0) {
        hammerSummary = `<div style="margin-top:12px;padding:8px;border:1px solid rgba(255,213,79,0.3);border-radius:6px;background:rgba(255,213,79,0.05);">
            <div style="color:#ffd54f;font-size:13px;margin-bottom:4px;">魂铸记录</div>
            <div style="color:#e0e0e0;font-size:12px;">${hammerNames.join(' · ')}</div>
        </div>`;
    }

    let overlay = document.getElementById('victory-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'victory-overlay';
        overlay.className = 'gameover-overlay';
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div class="gameover-panel" style="border-color: #ffd54f;">
            <div class="gameover-title" style="color: #ffd54f;">通关成功</div>
            <div class="gameover-stats">
                <div>通过了全部 3 幕（${RunManager.getTotalVisited()} 个节点）</div>
                <div>战斗回合: ${GameState.turnCount}</div>
                <div>获得强化: ${GameState.upgradesChosen} 个</div>
                <div>魂印铭刻: ${GameState.hammersChosen || 0} 个</div>
                <div>积累金币: ${RunManager.gold}</div>
                ${hammerSummary}
            </div>
            <button class="gameover-button" style="border-color:#ffd54f;color:#ffd54f;" onclick="document.getElementById('victory-overlay').remove(); restartGame();">返回主菜单</button>
        </div>
    `;

    const returnBtn = overlay.querySelector('.gameover-button');
    if (returnBtn && typeof AudioManager !== 'undefined') {
        AudioManager.bindUiSound(returnBtn, { hover: 'hover', click: 'confirm' });
    }
    updateUI();
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

    // 日志折叠 toggle
    const logToggle = document.getElementById('log-toggle');
    if (logToggle) {
        logToggle.addEventListener('click', () => {
            const wrapper = document.getElementById('log-wrapper');
            if (wrapper) wrapper.classList.toggle('collapsed');
        });
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
