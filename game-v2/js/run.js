// ==================== 单局流程管理器 ====================
// 3幕结构: (3战+1精英+1休息+幕Boss) × 3 + 最终Boss = ~21 节点
// 锤子节点：每幕精英战后有一次锤子选择机会

const RunManager = {
    nodes: [],
    currentNodeIndex: 0,
    gold: 0,

    generateRun() {
        this.nodes = [];
        this.currentNodeIndex = 0;
        this.gold = 0;

        // 幕1: 3普通 + 1精英 + 1锤子 + 1休息 = 6节点
        this.nodes.push({ type: 'battle', phase: 1, act: 1, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 1, act: 1, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 1, act: 1, label: '遭遇战' });
        this.nodes.push({ type: 'elite', phase: 1, act: 1, label: '精英战' });
        this.nodes.push({ type: 'hammer', phase: 1, act: 1, label: '锻造' });
        this.nodes.push({ type: 'rest', phase: 1, act: 1, label: '休息点' });

        // 幕1 Boss
        this.nodes.push({ type: 'boss', phase: 2, act: 1, label: '幕1 BOSS' });

        // 幕2: 3普通 + 1精英 + 1锤子 + 1休息 = 6节点
        this.nodes.push({ type: 'battle', phase: 2, act: 2, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 2, act: 2, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 2, act: 2, label: '遭遇战' });
        this.nodes.push({ type: 'elite', phase: 2, act: 2, label: '精英战' });
        this.nodes.push({ type: 'hammer', phase: 2, act: 2, label: '锻造' });
        this.nodes.push({ type: 'rest', phase: 2, act: 2, label: '休息点' });

        // 幕2 Boss
        this.nodes.push({ type: 'boss', phase: 3, act: 2, label: '幕2 BOSS' });

        // 幕3: 3普通 + 1精英 + 1锤子 + 1休息 = 6节点
        this.nodes.push({ type: 'battle', phase: 3, act: 3, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 3, act: 3, label: '遭遇战' });
        this.nodes.push({ type: 'battle', phase: 3, act: 3, label: '遭遇战' });
        this.nodes.push({ type: 'elite', phase: 3, act: 3, label: '精英战' });
        this.nodes.push({ type: 'hammer', phase: 3, act: 3, label: '锻造' });
        this.nodes.push({ type: 'rest', phase: 3, act: 3, label: '休息点' });

        // 最终Boss
        this.nodes.push({ type: 'boss', phase: 4, act: 3, label: '最终 BOSS' });
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

    getProgressText() {
        const node = this.getCurrentNode();
        if (!node) return '完成';
        return `${this.currentNodeIndex + 1}/${this.nodes.length}`;
    },

    getActText() {
        const node = this.getCurrentNode();
        if (!node) return '';
        return `第${node.act || 1}幕`;
    },

    getNodeLabel() {
        const node = this.getCurrentNode();
        if (!node) return '';
        return node.label || '';
    },

    isBattleNode() {
        const node = this.getCurrentNode();
        return node && (node.type === 'battle' || node.type === 'elite' || node.type === 'boss');
    },

    isRestNode() {
        const node = this.getCurrentNode();
        return node && node.type === 'rest';
    },

    isHammerNode() {
        const node = this.getCurrentNode();
        return node && node.type === 'hammer';
    },

    getEnemyScaling() {
        const node = this.getCurrentNode();
        if (!node) return { hpMult: 1, atkMult: 1 };
        const phase = node.phase;

        let hpMult = 1 + (phase - 1) * 0.2;
        let atkMult = 1 + (phase - 1) * 0.1;

        if (node.type === 'elite') {
            hpMult *= 1.5;
            atkMult *= 1.3;
        }

        if (node.type === 'boss') {
            hpMult *= 2.0;
            atkMult *= 1.5;
        }

        return { hpMult, atkMult };
    },

    addGold(amount) {
        this.gold += amount;
    },

    spendGold(amount) {
        if (typeof hasInfiniteResources === 'function' && hasInfiniteResources()) {
            return true;
        }
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    },

    getBattleGoldReward() {
        const node = this.getCurrentNode();
        if (!node) return 0;
        if (node.type === 'elite') return 3;
        if (node.type === 'boss') return 5;
        return 1;
    }
};
