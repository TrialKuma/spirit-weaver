// ==================== 休息节点系统（简化版：固定 3 选 1） ====================

function showRestOverlay(onDone) {
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

    const player = GameState.player;
    const maxHp = player ? player.maxHp : 100;
    const healAmount = Math.floor(maxHp * 0.3);

    // 修炼随机属性
    const trainOptions = [
        { stat: 'ATK', desc: '攻击力 +2', apply() { if (player) { player.baseAtk += 2; } } },
        { stat: 'DEF', desc: '防御 +1', apply() { if (player) { player.def += 1; } } },
        { stat: 'SPD', desc: '速度 +15', apply() { if (player) { player.baseSpeed += 15; player.speed += 15; } } }
    ];
    const trainChoice = trainOptions[Math.floor(Math.random() * trainOptions.length)];

    const options = [
        {
            id: 'rest',
            name: '休息',
            icon: '🔥',
            desc: `恢复 ${healAmount} 点生命（30%最大生命）`,
            apply() {
                if (!player) return;
                const healed = Math.min(player.maxHp - player.hp, healAmount);
                player.hp = Math.min(player.maxHp, player.hp + healAmount);
                Logger.log(`休息：恢复 ${healed} 点生命`, true);
                updateUI();
            }
        },
        {
            id: 'train',
            name: '修炼',
            icon: '⚔️',
            desc: `永久提升：${trainChoice.desc}`,
            apply() {
                if (!player) return;
                trainChoice.apply();
                Logger.log(`修炼：${trainChoice.desc}`, true);
                updateUI();
            }
        },
        {
            id: 'meditate',
            name: '冥想',
            icon: '🧘',
            desc: '最大生命上限 +8（本次不回血）',
            apply() {
                if (!player) return;
                player.maxHp += 8;
                Logger.log('冥想：最大生命上限 +8', true);
                updateUI();
            }
        }
    ];

    overlay.innerHTML = '';
    const panel = document.createElement('div');
    panel.className = 'rest-panel';

    const title = document.createElement('div');
    title.className = 'rest-title';
    title.textContent = '休息点';
    panel.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.className = 'rest-subtitle';
    subtitle.textContent = '在前进的路途中，你发现了一处可以歇脚的地方';
    panel.appendChild(subtitle);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'rest-options';

    options.forEach(option => {
        const card = document.createElement('div');
        card.className = 'rest-option-card';

        if (typeof AudioManager !== 'undefined') {
            AudioManager.bindUiSound(card, { hover: 'hover', click: 'confirm' });
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

        card.addEventListener('click', () => {
            option.apply();
            closeRestOverlay();
            if (onDone) onDone();
        });

        optionsContainer.appendChild(card);
    });

    panel.appendChild(optionsContainer);
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
