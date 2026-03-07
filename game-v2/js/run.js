// ==================== 单局流程管理器 ====================
// 节点结构: (3战+1休) × 3 + 1Boss = 13 节点

const RunManager = {
    nodes: [],
    currentNodeIndex: 0,
    gold: 0, // 金币（用于休息节点商店）

    // 生成一局流程
    generateRun() {
        this.nodes = [];
        this.currentNodeIndex = 0;
        this.gold = 0;

        // 阶段 1: 3 普通战 + 1 休息
        this.nodes.push({ type: 'battle', phase: 1, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 1, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 1, label: '遭遇战' });
        this.nodes.push({ type: 'rest', phase: 1, label: '休息点' });

        // 阶段 2: 2 普通战 + 1 精英战 + 1 休息
        this.nodes.push({ type: 'battle', phase: 2, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 2, label: '遭遇战' });
        this.nodes.push({ type: 'elite', phase: 2, label: '精英战' });
        this.nodes.push({ type: 'rest', phase: 2, label: '休息点' });

        // 阶段 3: 2 普通战 + 1 精英战 + 1 休息
        this.nodes.push({ type: 'battle', phase: 3, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 3, label: '遭遇战' });
        this.nodes.push({ type: 'elite', phase: 3, label: '精英战' });
        this.nodes.push({ type: 'rest', phase: 3, label: '休息点' });

        // 最终 Boss
        this.nodes.push({ type: 'boss', phase: 4, label: 'BOSS' });
    },

    getCurrentNode() {
        return this.nodes[this.currentNodeIndex] || null;
    },

    advance() {
        this.currentNodeIndex++;
        return this.currentNodeIndex < this.nodes.length;
    },

    isFinished() {
        return this.currentNodeIndex >= this.nodes.length;
    },

    // 显示进度: "节点 3/13 · 阶段1"
    getProgressText() {
        const node = this.getCurrentNode();
        if (!node) return '完成';
        return `${this.currentNodeIndex + 1}/${this.nodes.length}`;
    },

    getNodeLabel() {
        const node = this.getCurrentNode();
        if (!node) return '';
        return node.label || '';
    },

    // 当前节点是否为战斗类（battle/elite/boss）
    isBattleNode() {
        const node = this.getCurrentNode();
        return node && (node.type === 'battle' || node.type === 'elite' || node.type === 'boss');
    },

    isRestNode() {
        const node = this.getCurrentNode();
        return node && node.type === 'rest';
    },

    // 获取当前阶段的敌人难度缩放
    getEnemyScaling() {
        const node = this.getCurrentNode();
        if (!node) return { hpMult: 1, atkMult: 1 };
        const phase = node.phase;

        // 基础阶段缩放
        let hpMult = 1 + (phase - 1) * 0.2; // +20% HP per phase
        let atkMult = 1 + (phase - 1) * 0.1; // +10% ATK per phase

        // 精英额外加成
        if (node.type === 'elite') {
            hpMult *= 1.5;
            atkMult *= 1.3;
        }

        // Boss 额外加成
        if (node.type === 'boss') {
            hpMult *= 2.0;
            atkMult *= 1.5;
        }

        return { hpMult, atkMult };
    },

    // 战斗胜利后获得金币
    addGold(amount) {
        this.gold += amount;
    },

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    },

    // 战斗胜利的金币奖励
    getBattleGoldReward() {
        const node = this.getCurrentNode();
        if (!node) return 0;
        if (node.type === 'elite') return 3;
        if (node.type === 'boss') return 5;
        return 1;
    }
};
