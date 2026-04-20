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
    hammers: {},          // { skillId: hammerConfig } — 已装备的锤子（每技能至多1个）
    hammersPending: null,  // { options: [], callback: fn } — 锤子选择待决
    hammersChosen: 0,      // 本局已获得锤子数
    isBattleEnded: false,
    /** 本场战斗对敌伤害统计 { entries: { [key]: { label, total } }, order: string[] } */
    skillDamageStats: null,
    debug: {
        enabled: false,
        infiniteResources: true
    },
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

function resetSkillDamageStats() {
    GameState.skillDamageStats = { entries: {}, order: [] };
    if (typeof updateSkillDamageStatsPanel === 'function') {
        updateSkillDamageStatsPanel();
    }
}

/** 累计本场对敌方造成的伤害（按技能/追加/魂灵分桶） */
function recordSkillDamageStat(statKey, displayLabel, amount) {
    if (!statKey || !displayLabel) return;
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    if (!GameState.skillDamageStats || !GameState.skillDamageStats.entries) {
        GameState.skillDamageStats = { entries: {}, order: [] };
    }
    const { entries, order } = GameState.skillDamageStats;
    if (!entries[statKey]) {
        entries[statKey] = { label: displayLabel, total: 0 };
        order.push(statKey);
    }
    entries[statKey].total += n;
    if (typeof updateSkillDamageStatsPanel === 'function') {
        updateSkillDamageStatsPanel();
    }
}

function initDebugConfigFromUrl() {
    try {
        if (typeof window === 'undefined' || !window.location) return;
        const params = new URLSearchParams(window.location.search || '');
        const debugFlag = params.get('debug');
        if (debugFlag === '1' || debugFlag === 'true' || debugFlag === 'on') {
            GameState.debug.enabled = true;
        }
    } catch (err) {
        console.warn('initDebugConfigFromUrl failed:', err);
    }
}

function isDebugModeEnabled() {
    return !!(GameState.debug && GameState.debug.enabled);
}

function hasInfiniteResources() {
    return !!(isDebugModeEnabled() && GameState.debug && GameState.debug.infiniteResources);
}

function setDebugModeEnabled(enabled) {
    if (!GameState.debug) GameState.debug = {};
    GameState.debug.enabled = !!enabled;
}

initDebugConfigFromUrl();
