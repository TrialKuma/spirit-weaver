// ==================== Web Audio API 合成音效系统 ====================
// 全部音效由波形合成生成，无需外部音频文件
class SFX {
    static _ctx = null;
    static _masterGain = null;
    static _enabled = true;
    static _volume = 0.3;

    // 延迟初始化（必须在用户交互后调用）
    static _init() {
        if (SFX._ctx) return SFX._ctx;
        try {
            SFX._ctx = new (window.AudioContext || window.webkitAudioContext)();
            SFX._masterGain = SFX._ctx.createGain();
            SFX._masterGain.gain.value = SFX._volume;
            SFX._masterGain.connect(SFX._ctx.destination);
        } catch (e) {
            SFX._enabled = false;
        }
        return SFX._ctx;
    }

    static _ensureCtx() {
        if (!SFX._enabled) return null;
        const ctx = SFX._init();
        if (!ctx) return null;
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    static setVolume(volume) {
        SFX._volume = Math.max(0, Math.min(1, volume));
        if (SFX._masterGain) {
            SFX._masterGain.gain.value = SFX._volume;
        }
    }

    // ---- 基础工具 ----

    // 创建白噪音缓冲
    static _noiseBuffer(duration = 0.1) {
        const ctx = SFX._ctx;
        if (!ctx) return null;
        const length = Math.floor(ctx.sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    // ---- 音效方法 ----

    // 近战轻击：短促白噪音 + 高频下扫
    static slashLight() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        // 噪音脉冲
        const noise = ctx.createBufferSource();
        noise.buffer = SFX._noiseBuffer(0.08);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.setValueAtTime(2000, now);
        hpf.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        noise.connect(hpf).connect(noiseGain).connect(SFX._masterGain);
        noise.start(now);
        noise.stop(now + 0.1);

        // 音调下扫
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.06);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(oscGain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // 近战重击：更厚的噪音 + 低频震荡
    static slashHeavy() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const noise = ctx.createBufferSource();
        noise.buffer = SFX._noiseBuffer(0.18);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.8, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(1500, now);
        lpf.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        noise.connect(lpf).connect(noiseGain).connect(SFX._masterGain);
        noise.start(now);
        noise.stop(now + 0.2);

        // 低频冲击
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(oscGain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // 弹体发射：上升音调
    static projectile() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    // 命中爆炸：短促噪音爆发
    static impact() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const noise = ctx.createBufferSource();
        noise.buffer = SFX._noiseBuffer(0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(3000, now);
        lpf.frequency.exponentialRampToValueAtTime(500, now + 0.08);
        noise.connect(lpf).connect(gain).connect(SFX._masterGain);
        noise.start(now);
        noise.stop(now + 0.12);
    }

    // 敌人近战攻击
    static enemyAttack() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const noise = ctx.createBufferSource();
        noise.buffer = SFX._noiseBuffer(0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(800, now);
        bpf.Q.value = 2;
        noise.connect(bpf).connect(gain).connect(SFX._masterGain);
        noise.start(now);
        noise.stop(now + 0.12);

        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(oscGain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // Cut-in 出现：快速上行 sweep
    static cutin() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.06);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.12);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        const lpf = ctx.createBiquadFilter();
        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(4000, now);
        osc.connect(lpf).connect(gain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    // 暴击：明亮高频叠加
    static crit() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        // 高频闪光音
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1500, now);
        osc1.frequency.exponentialRampToValueAtTime(2500, now + 0.05);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.25, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc1.connect(g1).connect(SFX._masterGain);
        osc1.start(now);
        osc1.stop(now + 0.2);

        // 噪音爆发
        const noise = ctx.createBufferSource();
        noise.buffer = SFX._noiseBuffer(0.08);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.5, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        const hpf = ctx.createBiquadFilter();
        hpf.type = 'highpass';
        hpf.frequency.value = 3000;
        noise.connect(hpf).connect(g2).connect(SFX._masterGain);
        noise.start(now);
        noise.stop(now + 0.1);
    }

    // 受击音效
    static hit() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        // 噪音冲击
        const noise = ctx.createBufferSource();
        noise.buffer = SFX._noiseBuffer(0.12);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.55, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.frequency.setValueAtTime(1200, now);
        bpf.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        bpf.Q.value = 1.5;
        noise.connect(bpf).connect(noiseGain).connect(SFX._masterGain);
        noise.start(now);
        noise.stop(now + 0.14);

        // 低频冲击体感
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.08);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.25, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(oscGain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // UI 悬停：轻柔短促提示
    static uiHover() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(980, now + 0.035);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    // UI 选择：双音点击，适合卡片选中
    static uiSelect() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        [0, 0.035].forEach((offset, idx) => {
            const osc = ctx.createOscillator();
            osc.type = idx === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(idx === 0 ? 520 : 780, now + offset);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.09, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);
            osc.connect(gain).connect(SFX._masterGain);
            osc.start(now + offset);
            osc.stop(now + offset + 0.07);
        });
    }

    // UI 确认：上行确认感
    static uiConfirm() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const notes = [440, 660, 880];
        notes.forEach((freq, index) => {
            const offset = index * 0.025;
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + offset);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.08, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
            osc.connect(gain).connect(SFX._masterGain);
            osc.start(now + offset);
            osc.stop(now + offset + 0.12);
        });
    }

    // UI 面板打开：空气感上扬
    static uiOpen() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(500, now);
        osc.connect(filter).connect(gain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    // UI 面板关闭：下行收束
    static uiClose() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    // UI 跳过/取消：更轻的钝音
    static uiSkip() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain).connect(SFX._masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    // UI 成功：亮一点的收尾
    static uiSuccess() {
        const ctx = SFX._ensureCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        [523.25, 659.25, 783.99].forEach((freq, index) => {
            const offset = index * 0.03;
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + offset);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.07, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
            osc.connect(gain).connect(SFX._masterGain);
            osc.start(now + offset);
            osc.stop(now + offset + 0.2);
        });
    }
}
