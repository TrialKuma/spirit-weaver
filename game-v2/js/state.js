// 游戏状态
const GameState = {
    player: null,
    enemy: null,
    spirit: null,
    timeline: [],
    turnCount: 0,
    isPlayerTurn: false,
    selectedClass: null,
    selectedSpirit: null,
    isPaused: false, // 行动条暂停标志
    isProcessingSkill: false, // 技能处理中标志
    isRunning: false, // 游戏运行标志
    isUpgradeOpen: false,
    upgradeOptions: [],
    upgradesChosen: 0,
    upgradeLevels: {},
    currentLevel: 1,
    maxLevels: 4,
    spiritChoiceGranted: false,
    followUpPending: null, // { followUps: [], callback: fn } — 追加技能等待选择
    audio: {
        unlocked: false,
        bgmEnabled: true,
        uiEnabled: true,
        currentTrack: null
    }
};

// 事件总线：用于技能/遗物/魂灵等效果挂接
const GameEvents = {
    listeners: {},
    on(eventName, handler) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(handler);
    },
    off(eventName, handler) {
        const handlers = this.listeners[eventName];
        if (!handlers) return;
        const idx = handlers.indexOf(handler);
        if (idx >= 0) handlers.splice(idx, 1);
    },
    emit(eventName, payload) {
        const handlers = this.listeners[eventName];
        if (!handlers || handlers.length === 0) return;
        handlers.forEach(handler => {
            try {
                handler(payload);
            } catch (err) {
                console.error(`GameEvents handler error (${eventName}):`, err);
            }
        });
    }
};
