// 日志系统
const Logger = {
    log(message, important = false) {
        const logPanel = document.getElementById('log-panel');
        if (!logPanel) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry' + (important ? ' important' : '');
        entry.textContent = `[${GameState.turnCount}] ${message}`;
        logPanel.appendChild(entry);
        logPanel.scrollTop = logPanel.scrollHeight;
    }
};

// 粒子特效系统
class ParticleSystem {
    static createParticles(x, y, count = 10, color = '#00d4ff') {
        const vfxLayer = document.getElementById('vfx-layer');
        if (!vfxLayer) return;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = color;
            particle.style.boxShadow = `0 0 10px ${color}`;
            
            const angle = (Math.PI * 2 * i) / count;
            const distance = 20 + Math.random() * 30;
            const vx = Math.cos(angle) * distance;
            const vy = Math.sin(angle) * distance;
            
            vfxLayer.appendChild(particle);
            
            // 动画
            let opacity = 1;
            let px = x;
            let py = y;
            const animate = () => {
                opacity -= 0.02;
                px += vx * 0.1;
                py += vy * 0.1;
                
                particle.style.left = px + 'px';
                particle.style.top = py + 'px';
                particle.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };
            animate();
        }
    }

    static showDamageNumber(x, y, damage, color = '#ff6b9d', skillName = null, options = {}) {
        const vfxLayer = document.getElementById('vfx-layer');
        if (!vfxLayer) return;

        // 兼容传入 options 作为第 5 个参数
        if (skillName && typeof skillName === 'object') {
            options = skillName;
            skillName = null;
        }
        
        const holdMs = options.holdMs ?? 350;
        const fadeMs = options.fadeMs ?? 900;
        const floatDistance = options.floatDistance ?? 30;
        const fontSize = options.fontSize;
        
        const number = document.createElement('div');
        number.className = 'damage-number';
        
        // 如果有技能名称，显示在伤害数字前面
        if (skillName) {
            const skillLabel = document.createElement('span');
            skillLabel.textContent = skillName + ' ';
            skillLabel.style.fontSize = '16px';
            skillLabel.style.opacity = '0.8';
            number.appendChild(skillLabel);
        }
        
        const text = (typeof damage === 'number' && !Number.isNaN(damage))
            ? Math.floor(damage)
            : String(damage);
        const damageText = document.createTextNode(text);
        number.appendChild(damageText);
        
        number.style.left = x + 'px';
        number.style.top = y + 'px';
        number.style.color = color;
        number.style.textShadow = `0 0 10px ${color}`;
        if (fontSize) {
            number.style.fontSize = fontSize;
        }
        number.style.opacity = '1';
        number.style.transform = 'translateY(0px)';
        number.style.transition = `transform ${fadeMs}ms ease-out, opacity ${fadeMs}ms ease-out`;
        
        vfxLayer.appendChild(number);
        
        setTimeout(() => {
            number.style.opacity = '0';
            number.style.transform = `translateY(-${floatDistance}px)`;
        }, holdMs);

        setTimeout(() => {
            number.remove();
        }, holdMs + fadeMs + 50);
    }

    static createBeam(startX, startY, endX, endY, color = '#00d4ff', options = {}) {
        const vfxLayer = document.getElementById('vfx-layer');
        if (!vfxLayer) return;
        
        const width = options.width || 3;
        const holdMs = options.holdMs || 120;
        const fadeMs = options.fadeMs || 200;
        
        const beam = document.createElement('div');
        beam.style.position = 'absolute';
        beam.style.left = startX + 'px';
        beam.style.top = startY + 'px';
        beam.style.width = width + 'px';
        beam.style.height = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2) + 'px';
        beam.style.background = `linear-gradient(to bottom, ${color}, ${color}80, transparent)`;
        beam.style.boxShadow = `0 0 ${width * 6}px ${color}`;
        beam.style.transformOrigin = 'top';
        beam.style.transform = `rotate(${(Math.atan2(endY - startY, endX - startX) * 180 / Math.PI - 90)}deg)`;
        beam.style.opacity = '0.85';
        beam.style.zIndex = '50';
        beam.style.borderRadius = width + 'px';
        beam.style.pointerEvents = 'none';
        
        vfxLayer.appendChild(beam);
        
        setTimeout(() => {
            beam.style.transition = `opacity ${fadeMs}ms`;
            beam.style.opacity = '0';
            setTimeout(() => beam.remove(), fadeMs + 50);
        }, holdMs);
    }

    static _spriteCache = {};

    static playSpriteEffect(x, y, sheetUrl, opts = {}) {
        const vfxLayer = document.getElementById('vfx-layer');
        if (!vfxLayer) return;

        const frames    = opts.frames    || 4;
        const frameW    = opts.frameW    || 256;
        const frameH    = opts.frameH    || 256;
        const fps       = opts.fps       || 12;
        const scale     = opts.scale     || 1.0;
        const offsetX   = opts.offsetX   || 0;
        const offsetY   = opts.offsetY   || 0;

        const displayW = frameW * scale;
        const displayH = frameH * scale;

        const el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.left   = (x - displayW / 2 + offsetX) + 'px';
        el.style.top    = (y - displayH / 2 + offsetY) + 'px';
        el.style.width  = displayW + 'px';
        el.style.height = displayH + 'px';
        el.style.backgroundImage = `url(${sheetUrl})`;
        el.style.backgroundSize  = `${frames * displayW}px ${displayH}px`;
        el.style.backgroundRepeat = 'no-repeat';
        el.style.backgroundPosition = '0 0';
        if (opts.blendMode) el.style.mixBlendMode = opts.blendMode;
        el.style.pointerEvents = 'none';
        el.style.zIndex = '100';

        vfxLayer.appendChild(el);

        let frame = 0;
        const interval = setInterval(() => {
            frame++;
            if (frame >= frames) {
                clearInterval(interval);
                el.remove();
                return;
            }
            el.style.backgroundPosition = `-${frame * displayW}px 0`;
        }, 1000 / fps);
    }

    static _impactSpriteMap = {
        heavy:    { url: 'assets/vfx/impact_test_alpha.png', frames: 4, frameW: 344, frameH: 768, scale: 0.35 },
        ultimate: { url: 'assets/vfx/impact_test_alpha.png', frames: 4, frameW: 344, frameH: 768, scale: 0.5 },
    };

    // 差异化冲击效果（基于技能标签）
    static createImpact(x, y, type = 'normal', baseColor = '#ff6b9d') {
        const spriteInfo = ParticleSystem._impactSpriteMap[type];
        if (spriteInfo) {
            ParticleSystem.playSpriteEffect(x, y, spriteInfo.url, {
                frames: spriteInfo.frames,
                frameW: spriteInfo.frameW,
                frameH: spriteInfo.frameH,
                fps: 10,
                scale: spriteInfo.scale || 1.0,
            });
        }
        const configs = {
            light:    { count: 8,  color: '#00d4ff', size: 3, spread: 25 },
            heavy:    { count: 22, color: '#ff7043', size: 6, spread: 45 },
            ultimate: { count: 28, color: '#ffffff', size: 5, spread: 55 },
            ranged:   { count: 10, color: '#ffd54f', size: 3, spread: 35 },
            multihit: { count: 6,  color: baseColor, size: 3, spread: 20 },
            normal:   { count: 12, color: baseColor, size: 4, spread: 30 },
            enemy:    { count: 12, color: '#ff6b9d', size: 4, spread: 30 },
            charge:   { count: 20, color: '#ff4444', size: 6, spread: 50 },
            debuff:   { count: 10, color: '#ba68c8', size: 3, spread: 25 },
        };
        const cfg = configs[type] || configs.normal;
        
        const vfxLayer = document.getElementById('vfx-layer');
        if (!vfxLayer) return;
        
        for (let i = 0; i < cfg.count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.width = cfg.size + 'px';
            particle.style.height = cfg.size + 'px';
            particle.style.background = cfg.color;
            particle.style.boxShadow = `0 0 ${cfg.size * 3}px ${cfg.color}`;
            
            const angle = (Math.PI * 2 * i) / cfg.count + (Math.random() - 0.5) * 0.5;
            const distance = cfg.spread * (0.6 + Math.random() * 0.4);
            const vx = Math.cos(angle) * distance;
            const vy = Math.sin(angle) * distance;
            
            vfxLayer.appendChild(particle);
            
            let opacity = 1;
            let px = x;
            let py = y;
            const animate = () => {
                opacity -= (type === 'ultimate' ? 0.015 : 0.025);
                px += vx * 0.12;
                py += vy * 0.12;
                particle.style.left = px + 'px';
                particle.style.top = py + 'px';
                particle.style.opacity = opacity;
                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };
            animate();
        }
    }

    static shakeScreen(intensity = 6, duration = 250) {
        const stage = document.querySelector('.main-stage');
        if (!stage) return;
        stage.style.transition = 'transform 0.05s';
        const start = Date.now();
        const shake = () => {
            const elapsed = Date.now() - start;
            const progress = elapsed / duration;
            if (progress >= 1) {
                stage.style.transform = '';
                return;
            }
            const dx = (Math.random() - 0.5) * intensity;
            const dy = (Math.random() - 0.5) * intensity;
            stage.style.transform = `translate(${dx}px, ${dy}px)`;
            requestAnimationFrame(shake);
        };
        shake();
    }

    static flashScreen(color = 'rgba(255,255,255,0.25)', duration = 120) {
        const stage = document.querySelector('.main-stage');
        if (!stage) return;
        const flash = document.createElement('div');
        flash.style.position = 'absolute';
        flash.style.left = '0';
        flash.style.top = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.background = color;
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '80';
        flash.style.opacity = '0.8';
        stage.appendChild(flash);
        setTimeout(() => {
            flash.style.transition = 'opacity 0.2s';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 220);
        }, duration);
    }

    // ==================== 技能喊话 Cut-in ====================
    // side: 'left'(玩家) | 'right'(敌人)
    // onDone: 播放结束后回调
    static showSkillCutIn({ side = 'left', icon = '', skillName = '', color = '#ff4444', duration = 1000 }, onDone = null) {
        const vfxLayer = document.getElementById('vfx-layer');
        if (!vfxLayer) { if (onDone) onDone(); return; }

        if (typeof SFX !== 'undefined') SFX.cutin();

        const banner = document.createElement('div');
        banner.className = `cutin-banner cutin-${side}`;

        // 背景渐变：主题色 → 深暗
        if (side === 'left') {
            banner.style.background = `linear-gradient(100deg, ${color}dd 0%, ${color}88 55%, ${color}22 100%)`;
        } else {
            banner.style.background = `linear-gradient(260deg, ${color}dd 0%, ${color}88 55%, ${color}22 100%)`;
        }

        // 图标
        const iconEl = document.createElement('span');
        iconEl.className = 'cutin-icon';
        iconEl.textContent = icon;

        // 技能名
        const textEl = document.createElement('span');
        textEl.className = 'cutin-text';
        textEl.textContent = skillName;
        textEl.style.textShadow = `0 0 12px ${color}, 0 0 24px ${color}88, 0 2px 4px rgba(0,0,0,0.6)`;

        banner.appendChild(iconEl);
        banner.appendChild(textEl);
        banner.style.animationDuration = duration + 'ms';

        vfxLayer.appendChild(banner);

        setTimeout(() => {
            banner.remove();
            if (onDone) onDone();
        }, duration);
    }

    // ==================== 近战斩击特效 ====================
    // type: 'light' | 'heavy' | 'special' | 'yin' | 'yang' | 'flip' | 'multihit'
    static createSlash(x, y, type = 'light', color = null) {
        const vfxLayer = document.getElementById('vfx-layer');
        if (!vfxLayer) return;

        // 音效
        if (typeof SFX !== 'undefined') {
            if (type === 'heavy' || type === 'flip') SFX.slashHeavy();
            else SFX.slashLight();
        }

        // w: 刀光宽度, h: 刀光长度(弧长), dur: 持续ms, glow: 发光强度, count: 刀光数量
        const configs = {
            light:   { color: '#ffffff',  w: 140, h: 22, dur: 260, glow: 18, count: 1 },
            heavy:   { color: '#ff4444',  w: 220, h: 36, dur: 380, glow: 30, count: 1 },
            special: { color: '#ff9800',  w: 170, h: 26, dur: 280, glow: 22, count: 1 },
            yin:     { color: '#b388ff',  w: 160, h: 24, dur: 270, glow: 22, count: 1 },
            yang:    { color: '#ffe0b2',  w: 160, h: 24, dur: 270, glow: 22, count: 1 },
            flip:    { color: '#e040fb',  w: 190, h: 28, dur: 320, glow: 26, count: 2 },
            multihit:{ color: '#90caf9',  w: 110, h: 16, dur: 200, glow: 14, count: 1 },
        };
        const cfg = configs[type] || configs.light;
        const c = color || cfg.color;

        for (let n = 0; n < cfg.count; n++) {
            // --- 主刀光：大弧形发光片 ---
            const slash = document.createElement('div');
            slash.className = 'slash-blade';

            const w = cfg.w + (Math.random() - 0.5) * 20;
            const h = cfg.h;
            slash.style.width = w + 'px';
            slash.style.height = h + 'px';
            slash.style.left = (x - w / 2) + 'px';
            slash.style.top = (y - h / 2) + 'px';

            // 弯弧刀光：椭圆形 + 渐变（中心亮→两端淡出）
            slash.style.background = `linear-gradient(90deg, transparent 0%, ${c}44 8%, ${c}cc 25%, #fff 50%, ${c}cc 75%, ${c}44 92%, transparent 100%)`;
            slash.style.borderRadius = '50% / 80%';
            slash.style.boxShadow = `0 0 ${cfg.glow}px ${c}, 0 0 ${cfg.glow * 2}px ${c}88, inset 0 0 ${Math.floor(cfg.glow * 0.6)}px #ffffff88`;
            slash.style.animationDuration = cfg.dur + 'ms';

            // 旋转角度：斜切方向，多段时交叉
            const baseRot = -30 + (Math.random() - 0.5) * 25;
            const rot = baseRot + n * 70;
            slash.style.setProperty('--slash-rot', rot + 'deg');

            vfxLayer.appendChild(slash);

            // --- 刀光拖尾：更宽更淡的残影 ---
            const trail = document.createElement('div');
            trail.className = 'slash-trail';
            const tw = w * 1.15;
            const th = h * 2.5;
            trail.style.width = tw + 'px';
            trail.style.height = th + 'px';
            trail.style.left = (x - tw / 2) + 'px';
            trail.style.top = (y - th / 2) + 'px';
            trail.style.background = `linear-gradient(90deg, transparent 5%, ${c}22 20%, ${c}55 50%, ${c}22 80%, transparent 95%)`;
            trail.style.borderRadius = '50% / 80%';
            trail.style.animationDuration = (cfg.dur + 80) + 'ms';
            trail.style.setProperty('--slash-rot', rot + 'deg');

            vfxLayer.appendChild(trail);

            setTimeout(() => { slash.remove(); trail.remove(); }, cfg.dur + 150);
        }
    }

    // ==================== 远程弹体系统 ====================
    // onHit(x, y) 在弹体到达目标时回调
    static createProjectile(startX, startY, endX, endY, options = {}, onHit = null) {
        const vfxLayer = document.getElementById('vfx-layer');
        if (!vfxLayer) return;

        // 发射音效
        if (typeof SFX !== 'undefined') SFX.projectile();

        const color = options.color || '#64b5f6';
        const size = options.size || 10;
        const speed = options.speed || 300; // 飞行时间 ms
        const glow = options.glow || 15;
        const trailCount = options.trailCount || 5;

        // 弹体本体
        const proj = document.createElement('div');
        proj.className = 'projectile';
        proj.style.width = size + 'px';
        proj.style.height = size + 'px';
        proj.style.background = `radial-gradient(circle, #fff 20%, ${color} 60%, transparent 100%)`;
        proj.style.boxShadow = `0 0 ${glow}px ${color}, 0 0 ${glow * 2}px ${color}55`;
        proj.style.left = startX + 'px';
        proj.style.top = startY + 'px';

        vfxLayer.appendChild(proj);

        const dx = endX - startX;
        const dy = endY - startY;
        const startTime = performance.now();

        // 拖尾粒子数组
        const trails = [];
        for (let i = 0; i < trailCount; i++) {
            const trail = document.createElement('div');
            trail.className = 'projectile-trail';
            const trailSize = size * (0.8 - i * 0.12);
            trail.style.width = Math.max(2, trailSize) + 'px';
            trail.style.height = Math.max(2, trailSize) + 'px';
            trail.style.background = color;
            trail.style.opacity = (0.5 - i * 0.08).toFixed(2);
            trail.style.left = startX + 'px';
            trail.style.top = startY + 'px';
            vfxLayer.appendChild(trail);
            trails.push({ el: trail, delay: (i + 1) * 0.12 }); // 每个拖尾延迟一点
        }

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / speed, 1);

            // ease-out 缓动：开始快，到达时减速
            const eased = 1 - Math.pow(1 - progress, 2);

            const cx = startX + dx * eased;
            const cy = startY + dy * eased;
            proj.style.left = (cx - size / 2) + 'px';
            proj.style.top = (cy - size / 2) + 'px';

            // 更新拖尾位置（延迟跟随）
            trails.forEach(t => {
                const trailProgress = Math.max(0, Math.min((elapsed - t.delay * speed * 0.3) / speed, 1));
                const trailEased = 1 - Math.pow(1 - trailProgress, 2);
                const tx = startX + dx * trailEased;
                const ty = startY + dy * trailEased;
                const ts = parseFloat(t.el.style.width);
                t.el.style.left = (tx - ts / 2) + 'px';
                t.el.style.top = (ty - ts / 2) + 'px';
            });

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 到达目标 - 清理弹体和拖尾
                proj.remove();
                trails.forEach(t => t.el.remove());

                // 到达爆散粒子 + 命中音效
                if (typeof SFX !== 'undefined') SFX.impact();
                ParticleSystem.createImpact(endX, endY, 'ranged', color);

                // 回调
                if (onHit) onHit(endX, endY);
            }
        };

        requestAnimationFrame(animate);
    }
}

// CTB 时间轴系统
class CTBSystem {
    constructor() {
        this.units = [];
        this.tickSpeed = 0.5;
    }

    addUnit(unit) {
        unit.av = 10000 / unit.speed;
        this.units.push(unit);
    }

    tick() {
        // 如果暂停，不减少AV
        if (GameState.isPaused) {
            return null;
        }
        
        // 所有单位减少 AV
        this.units.forEach(unit => {
            unit.av = Math.max(0, unit.av - this.tickSpeed);
        });

        // 检查是否有单位 AV 归零（到达底部）
        const ready = this.units.filter(u => u.av <= 0);
        if (ready.length > 0) {
            // 暂停所有单位的行动
            GameState.isPaused = true;
            // 按速度排序，速度快的先行动
            ready.sort((a, b) => b.speed - a.speed);
            return ready[0];
        }
        return null;
    }

    resetAV(unit) {
        unit.av = 10000 / unit.speed;
        // 重置AV后，解除暂停
        GameState.isPaused = false;
    }

    // 模拟未来 count 次行动，返回有序队列
    previewQueue(count = 9) {
        if (this.units.length === 0) return [];

        const snapshot = this.units.map(u => ({ unit: u, av: u.av }));
        const queue = [];
        let cumTicks = 0;

        for (let i = 0; i < count; i++) {
            let minAv = Infinity, minIdx = -1;
            snapshot.forEach((s, idx) => {
                if (s.av < minAv) { minAv = s.av; minIdx = idx; }
            });
            if (minIdx < 0) break;

            cumTicks += minAv;
            snapshot.forEach(s => { s.av -= minAv; });

            queue.push({
                unit: snapshot[minIdx].unit,
                cumTicks: Math.round(cumTicks)
            });

            snapshot[minIdx].av = 10000 / snapshot[minIdx].unit.speed;
        }

        return queue;
    }

    render() {
        const timeline = document.getElementById('timeline');
        if (!timeline) return;

        const queue = this.previewQueue(9);

        const spirit = GameState.spirit;
        const hasCompanion = spirit && spirit.spiritType === 'cooperative';
        const companionIcon = hasCompanion ? (spirit.icon || '灵') : '';

        let html = '';
        queue.forEach((item, index) => {
            const { unit, cumTicks } = item;
            const isNext = index === 0;
            const typeClass = unit.type;
            const spiritSubClass = (unit.type === 'spirit' && unit.spiritType) ? ` ${unit.spiritType}` : '';
            const nextClass = isNext ? ' tq-next' : '';

            const label = unit.type === 'player' ? '我'
                : unit.type === 'spirit' ? '灵'
                : (unit.name ? unit.name.charAt(0) : '敌');

            const avDisplay = (isNext && cumTicks <= 1) ? '▸' : cumTicks;

            const companion = (hasCompanion && unit.type === 'player')
                ? `<div class="tq-companion" title="${spirit.name || '协力魂灵'}">${companionIcon}</div>`
                : '';

            html += `<div class="tq-slot ${typeClass}${spiritSubClass}${nextClass}" title="${unit.name || unit.type}">` +
                `<div class="tq-av">${avDisplay}</div>` +
                `<div class="tq-icon">${label}</div>` +
                companion +
                `</div>`;
        });

        timeline.innerHTML = html;
    }
}
