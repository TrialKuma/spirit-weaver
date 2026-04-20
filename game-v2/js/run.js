// ==================== 单局流程管理器（分支地图版） ====================
// 3幕结构，每幕一张分层分支地图（7 层），玩家在地图上选择路线前进

const NODE_LABELS = {
    battle: '遭遇战',
    elite: '精英战',
    rest: '休息点',
    hammer: '魂铸台',
    boss: 'BOSS'
};

const RunManager = {
    acts: [],
    currentAct: 0,
    currentNodeId: null,
    visitedPath: [],
    gold: 0,

    // ---- 地图生成 ----

    generateRun() {
        this.acts = [];
        this.currentAct = 0;
        this.currentNodeId = null;
        this.visitedPath = [];
        this.gold = 0;

        this.acts.push(this._generateActMap(1, 1));
        this.acts.push(this._generateActMap(2, 2));
        this.acts.push(this._generateActMap(3, 3));
    },

    _generateActMap(actNum, basePhase) {
        const TOTAL_LAYERS = 7;
        const layers = [];
        const nodeMap = {};

        // Layer 0: 固定 1 个入口 battle
        const entryNode = this._makeNode(actNum, 0, 0, 'battle', basePhase);
        layers.push([entryNode]);
        nodeMap[entryNode.id] = entryNode;

        // Layer 1~5: 中间层
        for (let L = 1; L <= 5; L++) {
            const count = 2 + Math.floor(Math.random() * 2); // 2~3
            const layerNodes = [];
            for (let c = 0; c < count; c++) {
                const node = this._makeNode(actNum, L, c, 'battle', basePhase);
                layerNodes.push(node);
                nodeMap[node.id] = node;
            }
            layers.push(layerNodes);
        }

        // Layer 6: 固定 1 个 boss
        const bossPhase = basePhase + 1;
        const bossNode = this._makeNode(actNum, 6, 0, 'boss', actNum === 3 ? 4 : bossPhase);
        bossNode.label = actNum === 3 ? '最终 BOSS' : `幕${actNum} BOSS`;
        layers.push([bossNode]);
        nodeMap[bossNode.id] = bossNode;

        // 生成连线
        this._generateEdges(layers);

        // 分配节点类型（跳过 L0 和 L6）
        this._assignNodeTypes(layers, actNum);

        // 计算渲染坐标
        this._computePositions(layers);

        return { act: actNum, layers, nodeMap };
    },

    _makeNode(act, layer, column, type, phase) {
        const id = `act${act}-L${layer}-${column}`;
        return {
            id,
            type,
            phase,
            act,
            layer,
            column,
            label: NODE_LABELS[type] || type,
            next: [],
            visited: false,
            x: 0,
            y: 0
        };
    },

    _generateEdges(layers) {
        for (let L = 0; L < layers.length - 1; L++) {
            const curr = layers[L];
            const next = layers[L + 1];

            // 每个当前节点至少连 1 个下层节点
            curr.forEach(node => {
                const idx = Math.floor(Math.random() * next.length);
                if (!node.next.includes(next[idx].id)) {
                    node.next.push(next[idx].id);
                }
            });

            // 每个下层节点至少被 1 个上层连到
            next.forEach(nNode => {
                const hasParent = curr.some(cNode => cNode.next.includes(nNode.id));
                if (!hasParent) {
                    const idx = Math.floor(Math.random() * curr.length);
                    curr[idx].next.push(nNode.id);
                }
            });

            // 额外随机连线增加路径多样性（30% 概率每对多连一条）
            curr.forEach(cNode => {
                next.forEach(nNode => {
                    if (!cNode.next.includes(nNode.id) && Math.random() < 0.3) {
                        cNode.next.push(nNode.id);
                    }
                });
            });
        }

        // 去除过多交叉：对每层的连线按列排序减少交叉
        for (let L = 0; L < layers.length - 1; L++) {
            const curr = layers[L];
            const next = layers[L + 1];
            const nextIdxMap = {};
            next.forEach((n, i) => { nextIdxMap[n.id] = i; });

            curr.forEach(cNode => {
                cNode.next.sort((a, b) => (nextIdxMap[a] || 0) - (nextIdxMap[b] || 0));
            });
        }
    },

    _assignNodeTypes(layers, actNum) {
        // 收集可分配的中间层节点（L1~L5）
        const middleNodes = [];
        for (let L = 1; L <= 5; L++) {
            layers[L].forEach(node => middleNodes.push(node));
        }

        const totalMiddle = middleNodes.length;

        // 先保证最低要求：1 elite, 1 rest, 1 hammer
        const guaranteed = ['elite', 'rest', 'hammer'];
        const shuffled = [...middleNodes].sort(() => Math.random() - 0.5);
        const assigned = new Set();

        guaranteed.forEach(type => {
            for (const node of shuffled) {
                if (!assigned.has(node.id)) {
                    node.type = type;
                    node.label = NODE_LABELS[type];
                    assigned.add(node.id);
                    break;
                }
            }
        });

        // 按权重随机分配剩余节点
        const typeWeights = [
            { type: 'battle', weight: 50 },
            { type: 'elite', weight: 15 },
            { type: 'rest', weight: 15 },
            { type: 'hammer', weight: 15 }
        ];

        const remaining = middleNodes.filter(n => !assigned.has(n.id));
        remaining.forEach(node => {
            node.type = this._weightedRandom(typeWeights);
            node.label = NODE_LABELS[node.type];
        });

        // 约束修正：rest 最多 2 个
        let restCount = middleNodes.filter(n => n.type === 'rest').length;
        while (restCount > 2) {
            const restNodes = middleNodes.filter(n => n.type === 'rest');
            const victim = restNodes[restNodes.length - 1];
            victim.type = 'battle';
            victim.label = NODE_LABELS['battle'];
            restCount--;
        }

        // 约束修正：rest 不能在相邻层
        for (let L = 1; L <= 4; L++) {
            const thisLayerHasRest = layers[L].some(n => n.type === 'rest');
            const nextLayerHasRest = layers[L + 1].some(n => n.type === 'rest');
            if (thisLayerHasRest && nextLayerHasRest) {
                const victim = layers[L + 1].find(n => n.type === 'rest');
                if (victim) {
                    victim.type = 'battle';
                    victim.label = NODE_LABELS['battle'];
                }
            }
        }
    },

    _weightedRandom(weights) {
        const total = weights.reduce((s, w) => s + w.weight, 0);
        let r = Math.random() * total;
        for (const w of weights) {
            r -= w.weight;
            if (r <= 0) return w.type;
        }
        return weights[0].type;
    },

    _computePositions(layers) {
        const MAP_W = 1000;
        const MAP_H = 800;
        const PAD_X = 100;
        const PAD_Y = 70;
        const usableW = MAP_W - PAD_X * 2;
        const usableH = MAP_H - PAD_Y * 2;
        const layerCount = layers.length;

        layers.forEach((layer, L) => {
            const y = PAD_Y + (L / (layerCount - 1)) * usableH;
            const count = layer.length;
            layer.forEach((node, c) => {
                if (count === 1) {
                    node.x = MAP_W / 2;
                } else {
                    node.x = PAD_X + (c / (count - 1)) * usableW;
                }
                node.y = y;
            });
        });
    },

    // ---- 运行时 API ----

    getCurrentActMap() {
        return this.acts[this.currentAct] || null;
    },

    getCurrentNode() {
        if (!this.currentNodeId) return null;
        const actMap = this.getCurrentActMap();
        if (!actMap) return null;
        return actMap.nodeMap[this.currentNodeId] || null;
    },

    getNextChoices() {
        const node = this.getCurrentNode();
        if (!node || node.next.length === 0) return [];
        const actMap = this.getCurrentActMap();
        return node.next.map(id => actMap.nodeMap[id]).filter(Boolean);
    },

    chooseNode(nodeId) {
        const actMap = this.getCurrentActMap();
        if (!actMap || !actMap.nodeMap[nodeId]) return false;

        const node = actMap.nodeMap[nodeId];
        this.currentNodeId = nodeId;
        node.visited = true;
        this.visitedPath.push(nodeId);
        return true;
    },

    startAct() {
        const actMap = this.getCurrentActMap();
        if (!actMap) return;
        const entryNode = actMap.layers[0][0];
        this.currentNodeId = entryNode.id;
        entryNode.visited = true;
        this.visitedPath.push(entryNode.id);
    },

    advanceAct() {
        this.currentAct++;
        if (this.currentAct >= this.acts.length) {
            return false;
        }
        this.currentNodeId = null;
        return true;
    },

    isLastAct() {
        return this.currentAct >= this.acts.length - 1;
    },

    isFinished() {
        return this.currentAct >= this.acts.length;
    },

    isBossNode() {
        const node = this.getCurrentNode();
        return node && node.type === 'boss';
    },

    // ---- 兼容旧 API ----

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

    getProgressText() {
        const actMap = this.getCurrentActMap();
        if (!actMap) return '完成';
        const visited = this.visitedPath.filter(id => id.startsWith(`act${actMap.act}-`)).length;
        const total = actMap.layers.length;
        return `${visited}/${total}`;
    },

    getActText() {
        const actMap = this.getCurrentActMap();
        if (!actMap) return '';
        return `第${actMap.act}幕`;
    },

    getNodeLabel() {
        const node = this.getCurrentNode();
        if (!node) return '';
        return node.label || '';
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
    },

    getTotalVisited() {
        return this.visitedPath.length;
    }
};
