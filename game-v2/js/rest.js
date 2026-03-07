// ==================== 休息节点系统 ====================

function showRestOverlay(onDone) {
    // 创建或获取覆盖层
    let overlay = document.getElementById('rest-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'rest-overlay';
        overlay.id = 'rest-overlay';
        document.body.appendChild(overlay);
    }

    GameState.isPaused = true;

    if (typeof AudioManager !== 'undefined') {
        AudioManager.playUi('open');
    }

    // 随机选择可用选项（每次休息点提供 2-3 个选项）
    const options = generateRestOptions();

    overlay.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'rest-panel';

    // 标题
    const title = document.createElement('div');
    title.className = 'rest-title';
    title.textContent = '休息点';
    panel.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.className = 'rest-subtitle';
    subtitle.textContent = '在前进的路途中，你发现了一处可以歇脚的地方';
    panel.appendChild(subtitle);

    // 金币显示
    const goldEl = document.createElement('div');
    goldEl.className = 'rest-gold';
    goldEl.textContent = `金币: ${RunManager.gold}`;
    panel.appendChild(goldEl);

    // 选项卡片
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'rest-options';

    options.forEach(option => {
        const card = document.createElement('div');
        card.className = 'rest-option-card';

        // 检查是否能使用（金币不足等）
        if (option.goldCost && RunManager.gold < option.goldCost) {
            card.classList.add('disabled');
        }

        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(card, {
                hover: 'hover',
                click: (option.goldCost && RunManager.gold < option.goldCost) ? 'skip' : 'confirm'
            });
        }

        const icon = document.createElement('div');
        icon.className = 'rest-option-icon';
        icon.textContent = option.icon;
        card.appendChild(icon);

        const name = document.createElement('div');
        name.className = 'rest-option-name';
        name.textContent = option.name;
        card.appendChild(name);

        const desc = document.createElement('div');
        desc.className = 'rest-option-desc';
        desc.textContent = option.desc;
        card.appendChild(desc);

        // 金币消耗标签
        if (option.goldCost) {
            const costTag = document.createElement('div');
            costTag.style.cssText = 'margin-top: 8px; font-size: 12px; color: #ffd54f;';
            costTag.textContent = `消耗 ${option.goldCost} 金币`;
            card.appendChild(costTag);
        }

        card.addEventListener('click', () => {
            if (option.goldCost && !RunManager.spendGold(option.goldCost)) {
                return; // 金币不足
            }
            option.apply();
            closeRestOverlay();
            if (onDone) onDone();
        });

        optionsContainer.appendChild(card);
    });

    panel.appendChild(optionsContainer);

    // 跳过按钮
    const skipBtn = document.createElement('button');
    skipBtn.className = 'rest-skip-btn';
    skipBtn.textContent = '继续前进';
    if (typeof AudioManager !== 'undefined') {
        AudioManager.bindUiSound(skipBtn, { hover: 'hover', click: 'skip' });
    }
    skipBtn.addEventListener('click', () => {
        closeRestOverlay();
        if (onDone) onDone();
    });
    panel.appendChild(skipBtn);

    overlay.appendChild(panel);
    overlay.classList.remove('hidden');
}

function closeRestOverlay() {
    const overlay = document.getElementById('rest-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.remove();
    }
    if (typeof AudioManager !== 'undefined') {
        AudioManager.playUi('close');
    }
    GameState.isPaused = false;
}

// 生成休息选项（随机 2-3 个）
function generateRestOptions() {
    const pool = [];

    // 1. 治疗选项（总是可用）
    pool.push({
        id: 'heal',
        name: '篝火休憩',
        icon: '🔥',
        desc: `恢复 ${Math.floor((GameState.player ? GameState.player.maxHp : 100) * 0.3)} 点生命（30%最大生命）`,
        apply() {
            if (!GameState.player) return;
            const heal = Math.floor(GameState.player.maxHp * 0.3);
            GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + heal);
            Logger.log(`篝火休憩，恢复 ${heal} 点生命`, true);
            updateUI();
        }
    });

    // 2. 商店选项 - 购买随机强化
    pool.push({
        id: 'shop_upgrade',
        name: '旅商强化',
        icon: '🛒',
        desc: '花费金币获得一个随机强化',
        goldCost: 3,
        apply() {
            const options = getRandomUpgrades(3);
            if (options.length > 0) {
                openUpgradeOverlay(options, (chosen) => {
                    if (chosen) applyUpgrade(chosen);
                    closeUpgradeOverlay();
                });
            }
        }
    });

    // 3. 事件选项 - 随机风险收益
    const events = getRandomEvents();
    pool.push(events[Math.floor(Math.random() * events.length)]);

    // 随机打乱顺序，取 2-3 个
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(3, shuffled.length));
}

// 随机事件库
function getRandomEvents() {
    const player = GameState.player;
    const maxHp = player ? player.maxHp : 100;

    return [
        {
            id: 'event_sacrifice',
            name: '血之祭坛',
            icon: '🩸',
            desc: `牺牲 ${Math.floor(maxHp * 0.2)} 点生命（20%），获得 +3 攻击力`,
            apply() {
                if (!player) return;
                const cost = Math.floor(player.maxHp * 0.2);
                player.hp = Math.max(1, player.hp - cost);
                player.baseAtk += 3;
                Logger.log(`血之祭坛：失去 ${cost} 生命，攻击力 +3`, true);
                updateUI();
            }
        },
        {
            id: 'event_gamble',
            name: '命运轮盘',
            icon: '🎰',
            desc: '50% 概率获得 SSR 强化，50% 概率失去 20% 当前生命',
            apply() {
                if (!player) return;
                if (Math.random() < 0.5) {
                    // 好运！强制 SSR 强化
                    const pool = getUpgradePool();
                    if (pool.length > 0) {
                        const template = pool[Math.floor(Math.random() * pool.length)];
                        const option = buildUpgradeOption(template);
                        option.rarity = 'SSR';
                        option.rarityColor = '#ffd54f';
                        applyUpgrade(option);
                        Logger.log('命运轮盘：好运！获得 SSR 强化！', true);
                    }
                } else {
                    // 不幸
                    const cost = Math.floor(player.hp * 0.2);
                    player.hp = Math.max(1, player.hp - cost);
                    Logger.log(`命运轮盘：不幸...失去 ${cost} 生命`, true);
                }
                updateUI();
            }
        },
        {
            id: 'event_meditation',
            name: '冥想修行',
            icon: '🧘',
            desc: '速度 +20，防御 +1',
            apply() {
                if (!player) return;
                player.baseSpeed += 20;
                player.speed += 20;
                player.def += 1;
                Logger.log('冥想修行：速度 +20，防御 +1', true);
                updateUI();
            }
        },
        {
            id: 'event_blacksmith',
            name: '铁匠铺',
            icon: '⚒️',
            desc: '攻击力 +2，生命上限 +10',
            goldCost: 2,
            apply() {
                if (!player) return;
                player.baseAtk += 2;
                player.maxHp += 10;
                player.hp += 10;
                Logger.log('铁匠铺：攻击力 +2，生命上限 +10', true);
                updateUI();
            }
        },
        {
            id: 'event_mysterious',
            name: '神秘祠堂',
            icon: '🏛️',
            desc: '获得 2 金币，恢复少量生命',
            apply() {
                if (!player) return;
                RunManager.addGold(2);
                const heal = Math.floor(player.maxHp * 0.1);
                player.hp = Math.min(player.maxHp, player.hp + heal);
                Logger.log(`神秘祠堂：获得 2 金币，恢复 ${heal} 生命`, true);
                updateUI();
            }
        }
    ];
}
