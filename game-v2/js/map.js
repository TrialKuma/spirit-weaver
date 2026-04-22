// ==================== 地图渲染与交互 ====================

// 每幕背景：优先尝试图片，fallback 用渐变
const MAP_BG_IMG = {
    1: 'assets/art/backgrounds/bg_map_act1_v2.png',
    2: 'assets/art/backgrounds/bg_map_act2_v2.png',
    3: 'assets/art/backgrounds/bg_map_act3_v2.png'
};
const MAP_BG_GRADIENT = {
    1: 'radial-gradient(ellipse at 50% 80%, #0d1b2a 0%, #1b2838 40%, #0a0e17 100%)',
    2: 'radial-gradient(ellipse at 50% 60%, #1a1208 0%, #2a1e0a 40%, #0e0a04 100%)',
    3: 'radial-gradient(ellipse at 50% 40%, #150a20 0%, #1e0e30 40%, #0a0510 100%)'
};

// 节点符号（SVG 内联绘制，不依赖外部图片）
const NODE_SYMBOLS = {
    battle: '⚔',
    elite: '☠',
    rest: '♨',
    hammer: '⚒',
    boss: '👁'
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

    // 更新背景（图片 + 渐变兜底）
    const panel = document.querySelector('.map-panel');
    if (panel) {
        const bgImg = MAP_BG_IMG[actMap.act] || MAP_BG_IMG[1];
        const bgGrad = MAP_BG_GRADIENT[actMap.act] || MAP_BG_GRADIENT[1];
        panel.style.backgroundImage = `url('${bgImg}'), ${bgGrad}`;
        panel.style.backgroundColor = '#0a0a0a';
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

    // SVG defs: 发光滤镜 + 渐变
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    glowFilter.setAttribute('id', 'edge-glow');
    glowFilter.setAttribute('x', '-20%');
    glowFilter.setAttribute('y', '-20%');
    glowFilter.setAttribute('width', '140%');
    glowFilter.setAttribute('height', '140%');
    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '3');
    blur.setAttribute('result', 'glow');
    glowFilter.appendChild(blur);
    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const mn1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mn1.setAttribute('in', 'glow');
    merge.appendChild(mn1);
    const mn2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mn2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(mn2);
    glowFilter.appendChild(merge);
    defs.appendChild(glowFilter);

    svg.appendChild(defs);

    // 绘制连线
    const edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    actMap.layers.forEach(layer => {
        layer.forEach(node => {
            node.next.forEach(nextId => {
                const nextNode = actMap.nodeMap[nextId];
                if (!nextNode) return;

                const dy = (nextNode.y - node.y) * 0.4;
                const d = `M ${node.x} ${node.y} C ${node.x} ${node.y + dy}, ${nextNode.x} ${nextNode.y - dy}, ${nextNode.x} ${nextNode.y}`;

                const isOnPath = node.visited && nextNode.visited;
                const isAvailable = node.visited && currentNode && node.id === currentNode.id && nextIds.has(nextId);

                if (isOnPath) {
                    // 已走过的路径：发光金线 + 底层宽光晕
                    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    glow.setAttribute('d', d);
                    glow.setAttribute('fill', 'none');
                    glow.setAttribute('stroke', 'rgba(255, 213, 79, 0.25)');
                    glow.setAttribute('stroke-width', '8');
                    glow.setAttribute('stroke-linecap', 'round');
                    edgeGroup.appendChild(glow);

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    line.setAttribute('d', d);
                    line.setAttribute('fill', 'none');
                    line.setAttribute('stroke', 'rgba(255, 213, 79, 0.85)');
                    line.setAttribute('stroke-width', '2.5');
                    line.setAttribute('stroke-linecap', 'round');
                    line.setAttribute('filter', 'url(#edge-glow)');
                    edgeGroup.appendChild(line);
                } else if (isAvailable) {
                    // 可选路径：呼吸蓝光
                    const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    glow.setAttribute('d', d);
                    glow.setAttribute('fill', 'none');
                    glow.setAttribute('stroke', 'rgba(0, 212, 255, 0.15)');
                    glow.setAttribute('stroke-width', '6');
                    glow.setAttribute('stroke-linecap', 'round');
                    edgeGroup.appendChild(glow);

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    line.setAttribute('d', d);
                    line.setAttribute('fill', 'none');
                    line.setAttribute('stroke', 'rgba(0, 212, 255, 0.6)');
                    line.setAttribute('stroke-width', '2');
                    line.setAttribute('stroke-linecap', 'round');
                    line.setAttribute('filter', 'url(#edge-glow)');
                    line.classList.add('map-edge-available');
                    edgeGroup.appendChild(line);
                } else {
                    // 未探索：虚线
                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    line.setAttribute('d', d);
                    line.setAttribute('fill', 'none');
                    line.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
                    line.setAttribute('stroke-width', '1.5');
                    line.setAttribute('stroke-linecap', 'round');
                    line.setAttribute('stroke-dasharray', '6 4');
                    edgeGroup.appendChild(line);
                }
            });
        });
    });
    svg.appendChild(edgeGroup);

    // 节点发光滤镜
    const nodeGlowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    nodeGlowFilter.setAttribute('id', 'node-glow');
    nodeGlowFilter.setAttribute('x', '-50%');
    nodeGlowFilter.setAttribute('y', '-50%');
    nodeGlowFilter.setAttribute('width', '200%');
    nodeGlowFilter.setAttribute('height', '200%');
    const ngBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    ngBlur.setAttribute('stdDeviation', '4');
    ngBlur.setAttribute('result', 'glow');
    nodeGlowFilter.appendChild(ngBlur);
    const ngMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const ngMn1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    ngMn1.setAttribute('in', 'glow');
    ngMerge.appendChild(ngMn1);
    const ngMn2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    ngMn2.setAttribute('in', 'SourceGraphic');
    ngMerge.appendChild(ngMn2);
    nodeGlowFilter.appendChild(ngMerge);
    defs.appendChild(nodeGlowFilter);

    // 绘制节点
    const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    actMap.layers.forEach(layer => {
        layer.forEach(node => {
            const isCurrent = currentNode && node.id === currentNode.id;
            const isNext = nextIds.has(node.id);
            const isVisited = node.visited && !isCurrent;

            const r = node.type === 'boss' ? MAP_RENDER.NODE_SIZE_BOSS / 2 : MAP_RENDER.NODE_SIZE / 2;
            const color = NODE_COLORS[node.type] || '#ffd54f';

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
            g.setAttribute('data-node-id', node.id);

            // 底层光晕（当前/可选节点）
            if (isCurrent) {
                const outerGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                outerGlow.setAttribute('r', r + 10);
                outerGlow.setAttribute('fill', color);
                outerGlow.setAttribute('opacity', '0.15');
                outerGlow.setAttribute('filter', 'url(#node-glow)');
                outerGlow.classList.add('map-node-pulse');
                g.appendChild(outerGlow);
            }
            if (isNext && !_mapViewOnly) {
                const outerGlow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                outerGlow.setAttribute('r', r + 8);
                outerGlow.setAttribute('fill', 'rgba(0, 212, 255, 0.08)');
                outerGlow.setAttribute('stroke', 'rgba(0, 212, 255, 0.4)');
                outerGlow.setAttribute('stroke-width', '1.5');
                outerGlow.classList.add('map-node-available');
                g.appendChild(outerGlow);
            }

            // 节点圆底
            const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bg.setAttribute('r', r);
            if (isVisited) {
                bg.setAttribute('fill', 'rgba(30, 30, 40, 0.6)');
                bg.setAttribute('stroke', 'rgba(255, 255, 255, 0.15)');
                bg.setAttribute('stroke-width', '1');
            } else if (isCurrent) {
                bg.setAttribute('fill', 'rgba(20, 20, 30, 0.85)');
                bg.setAttribute('stroke', color);
                bg.setAttribute('stroke-width', '2.5');
                bg.setAttribute('filter', 'url(#node-glow)');
            } else if (isNext) {
                bg.setAttribute('fill', 'rgba(20, 20, 30, 0.8)');
                bg.setAttribute('stroke', color);
                bg.setAttribute('stroke-width', '1.5');
            } else {
                bg.setAttribute('fill', 'rgba(20, 20, 30, 0.5)');
                bg.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
                bg.setAttribute('stroke-width', '1');
            }
            g.appendChild(bg);

            // 节点符号
            const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            symbol.setAttribute('text-anchor', 'middle');
            symbol.setAttribute('dominant-baseline', 'central');
            symbol.setAttribute('font-size', node.type === 'boss' ? '28' : '20');
            symbol.setAttribute('fill', isVisited ? 'rgba(255,255,255,0.3)' : color);
            symbol.textContent = NODE_SYMBOLS[node.type] || NODE_SYMBOLS.battle;
            if (!isVisited && !isCurrent && !isNext) {
                symbol.setAttribute('opacity', '0.4');
            }
            g.appendChild(symbol);

            // 已完成对勾
            if (isVisited) {
                const check = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                check.setAttribute('text-anchor', 'middle');
                check.setAttribute('dominant-baseline', 'central');
                check.setAttribute('y', '-2');
                check.setAttribute('fill', 'rgba(255, 213, 79, 0.7)');
                check.setAttribute('font-size', '14');
                check.textContent = '✓';
                g.appendChild(check);
            }

            // 节点标签
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('y', r + 16);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '11');
            label.setAttribute('font-family', 'inherit');
            if (isVisited) {
                label.setAttribute('fill', 'rgba(224, 224, 224, 0.3)');
            } else if (isCurrent) {
                label.setAttribute('fill', color);
            } else if (isNext) {
                label.setAttribute('fill', '#e0e0e0');
            } else {
                label.setAttribute('fill', 'rgba(224, 224, 224, 0.25)');
            }
            label.textContent = node.label;
            g.appendChild(label);

            // 可选节点的交互
            if (isNext && !_mapViewOnly) {
                const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                hitArea.setAttribute('r', r + 12);
                hitArea.setAttribute('fill', 'transparent');
                hitArea.setAttribute('stroke', 'none');
                g.appendChild(hitArea);

                g.style.cursor = 'pointer';
                g.classList.add('map-node-clickable');

                let hoverPlayed = false;
                g.addEventListener('click', () => {
                    if (typeof AudioManager !== 'undefined') AudioManager.playUi('confirm');
                    if (_mapOnNodeChosen) _mapOnNodeChosen(node.id);
                });
                g.addEventListener('mouseenter', () => {
                    if (!hoverPlayed) {
                        hoverPlayed = true;
                        if (typeof AudioManager !== 'undefined') AudioManager.playUi('hover');
                    }
                });
                g.addEventListener('mouseleave', () => { hoverPlayed = false; });
            }

            nodeGroup.appendChild(g);
        });
    });
    svg.appendChild(nodeGroup);

    canvas.appendChild(svg);
}
