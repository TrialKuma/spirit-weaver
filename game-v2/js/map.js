// ==================== 地图渲染与交互 ====================

const MAP_BG = {
    1: 'assets/art/backgrounds/bg_map_act1_v2.png',
    2: 'assets/art/backgrounds/bg_map_act2_v2.png',
    3: 'assets/art/backgrounds/bg_map_act3_v2.png'
};

const NODE_ICONS = {
    battle: 'assets/art/icons/map_nodes/node_battle.png',
    elite: 'assets/art/icons/map_nodes/node_elite.png',
    rest: 'assets/art/icons/map_nodes/node_rest.png',
    hammer: 'assets/art/icons/map_nodes/node_hammer.png',
    boss: 'assets/art/icons/map_nodes/node_boss.png'
};

const NODE_COLORS = {
    battle: '#00d4ff',
    elite: '#ff0055',
    rest: '#00ff88',
    hammer: '#ffd54f',
    boss: '#9c27b0'
};

const MAP_RENDER = {
    WIDTH: 1000,
    HEIGHT: 800,
    NODE_SIZE: 56,
    NODE_SIZE_BOSS: 72
};

let _mapOnNodeChosen = null;
let _mapViewOnly = false;

function showMapOverlay(onNodeChosen) {
    _mapOnNodeChosen = onNodeChosen;
    _mapViewOnly = false;
    const overlay = document.getElementById('map-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    if (typeof AudioManager !== 'undefined') AudioManager.playUi('open');

    renderMap();
}

// 只读查看地图（战斗中点击"地图"按钮）
function viewMap() {
    _mapOnNodeChosen = null;
    _mapViewOnly = true;
    const overlay = document.getElementById('map-overlay');
    if (!overlay) return;

    overlay.classList.remove('hidden');
    if (typeof AudioManager !== 'undefined') AudioManager.playUi('open');

    GameState.isPaused = true;
    renderMap();
}

function hideMapOverlay() {
    const overlay = document.getElementById('map-overlay');
    if (overlay) overlay.classList.add('hidden');
    _mapOnNodeChosen = null;
}

function renderMap() {
    const canvas = document.getElementById('map-canvas');
    if (!canvas) return;

    const actMap = RunManager.getCurrentActMap();
    if (!actMap) return;

    // 更新标题
    const titleEl = document.getElementById('map-act-title');
    if (titleEl) titleEl.textContent = `第${actMap.act}幕`;

    const progressEl = document.getElementById('map-progress');
    if (progressEl) progressEl.textContent = RunManager.getProgressText();

    // 更新背景
    const panel = document.querySelector('.map-panel');
    if (panel) {
        const bgUrl = MAP_BG[actMap.act] || MAP_BG[1];
        panel.style.backgroundImage = `url('${bgUrl}')`;
    }

    // 当前节点和可选下一步
    const currentNode = RunManager.getCurrentNode();
    const nextChoices = RunManager.getNextChoices();
    const nextIds = new Set(nextChoices.map(n => n.id));

    // 更新提示和关闭按钮
    const footerEl = document.querySelector('.map-footer');
    if (footerEl) {
        if (_mapViewOnly) {
            footerEl.innerHTML = '<button class="map-close-btn" id="map-close-btn">返回战斗</button>';
            const closeBtn = document.getElementById('map-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    hideMapOverlay();
                    GameState.isPaused = false;
                });
                if (typeof AudioManager !== 'undefined') {
                    AudioManager.bindUiSound(closeBtn, { hover: 'hover', click: 'close' });
                }
            }
        } else {
            footerEl.innerHTML = `<span class="map-hint" id="map-hint">${nextChoices.length > 0 ? '选择下一个节点' : '当前节点进行中'}</span>`;
        }
    }

    canvas.innerHTML = '';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${MAP_RENDER.WIDTH} ${MAP_RENDER.HEIGHT}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';

    // 绘制连线
    const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    actMap.layers.forEach(layer => {
        layer.forEach(node => {
            node.next.forEach(nextId => {
                const nextNode = actMap.nodeMap[nextId];
                if (!nextNode) return;

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const dy = (nextNode.y - node.y) * 0.4;
                const d = `M ${node.x} ${node.y} C ${node.x} ${node.y + dy}, ${nextNode.x} ${nextNode.y - dy}, ${nextNode.x} ${nextNode.y}`;
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('stroke-linecap', 'round');

                // 连线着色逻辑
                const isOnPath = node.visited && nextNode.visited;
                const isAvailable = node.visited && currentNode && node.id === currentNode.id && nextIds.has(nextId);

                if (isOnPath) {
                    path.setAttribute('stroke', 'rgba(255, 213, 79, 0.7)');
                    path.setAttribute('stroke-width', '3');
                } else if (isAvailable) {
                    path.setAttribute('stroke', 'rgba(0, 212, 255, 0.5)');
                    path.setAttribute('stroke-width', '2.5');
                    path.classList.add('map-edge-available');
                } else {
                    path.setAttribute('stroke', 'rgba(255, 255, 255, 0.12)');
                }

                edgeGroup.appendChild(path);
            });
        });
    });
    svg.appendChild(edgeGroup);

    // 绘制节点
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    actMap.layers.forEach(layer => {
        layer.forEach(node => {
            const isCurrent = currentNode && node.id === currentNode.id;
            const isNext = nextIds.has(node.id);
            const isVisited = node.visited && !isCurrent;

            const size = node.type === 'boss' ? MAP_RENDER.NODE_SIZE_BOSS : MAP_RENDER.NODE_SIZE;
            const halfSize = size / 2;

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            g.setAttribute('data-node-id', node.id);

            // 节点状态样式
            if (isCurrent) {
                // 当前位置光晕
                const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                glow.setAttribute('r', halfSize + 8);
                glow.setAttribute('fill', 'none');
                glow.setAttribute('stroke', NODE_COLORS[node.type] || '#ffd54f');
                glow.setAttribute('stroke-width', '2');
                glow.setAttribute('opacity', '0.8');
                glow.classList.add('map-node-pulse');
                g.appendChild(glow);
            }

            if (isNext) {
                // 可选节点外圈光晕
                const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                glow.setAttribute('r', halfSize + 6);
                glow.setAttribute('fill', 'none');
                glow.setAttribute('stroke', 'rgba(0, 212, 255, 0.6)');
                glow.setAttribute('stroke-width', '2');
                glow.classList.add('map-node-available');
                g.appendChild(glow);
            }

            // 节点图标
            const icon = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            icon.setAttribute('href', NODE_ICONS[node.type] || NODE_ICONS.battle);
            icon.setAttribute('x', -halfSize);
            icon.setAttribute('y', -halfSize);
            icon.setAttribute('width', size);
            icon.setAttribute('height', size);

            if (isVisited) {
                icon.setAttribute('opacity', '0.4');
                icon.setAttribute('filter', 'grayscale(60%)');
            } else if (!isCurrent && !isNext) {
                icon.setAttribute('opacity', '0.35');
            }

            g.appendChild(icon);

            // 已完成标记
            if (isVisited) {
                const check = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                check.setAttribute('text-anchor', 'middle');
                check.setAttribute('dominant-baseline', 'central');
                check.setAttribute('fill', '#ffd54f');
                check.setAttribute('font-size', '16');
                check.setAttribute('opacity', '0.8');
                check.textContent = '✓';
                g.appendChild(check);
            }

            // 节点标签
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('y', halfSize + 14);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('fill', isNext ? '#e0e0e0' : (isCurrent ? NODE_COLORS[node.type] : 'rgba(224, 224, 224, 0.4)'));
            label.setAttribute('font-size', '11');
            label.setAttribute('font-family', 'inherit');
            label.textContent = node.label;
            g.appendChild(label);

            // 可选节点的交互（仅非只读模式）
            if (isNext && !_mapViewOnly) {
                // 透明点击区域，比图标大一圈，避免边缘闪烁
                const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                hitArea.setAttribute('r', halfSize + 10);
                hitArea.setAttribute('fill', 'transparent');
                hitArea.setAttribute('stroke', 'none');
                g.appendChild(hitArea);

                g.style.cursor = 'pointer';
                g.classList.add('map-node-clickable');

                let hoverPlayed = false;
                g.addEventListener('click', () => {
                    if (typeof AudioManager !== 'undefined') AudioManager.playUi('confirm');
                    if (_mapOnNodeChosen) {
                        _mapOnNodeChosen(node.id);
                    }
                });

                g.addEventListener('mouseenter', () => {
                    if (!hoverPlayed) {
                        hoverPlayed = true;
                        if (typeof AudioManager !== 'undefined') AudioManager.playUi('hover');
                    }
                });

                g.addEventListener('mouseleave', () => {
                    hoverPlayed = false;
                });
            }

            nodeGroup.appendChild(g);
        });
    });
    svg.appendChild(nodeGroup);

    canvas.appendChild(svg);
}
