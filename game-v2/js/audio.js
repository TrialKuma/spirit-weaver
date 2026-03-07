// ==================== 音频管理（本地 WAV BGM + UI 音效） ====================
const AudioManager = {
    _bgmSource: null,
    _bgmGain: null,
    _bufferCache: {},
    _currentTrackKey: null,
    _trackMap: {
        qi: 'assets/audio/bgm/qi_battle_loop_v15.wav',
        combo: 'assets/audio/bgm/combo_battle_loop_v16.wav',
        mana: 'assets/audio/bgm/mana_battle_loop_v15.wav',
        balance: 'assets/audio/bgm/balance_battle_loop_v14.wav'
    },

    handleUserGesture() {
        if (typeof GameState !== 'undefined' && GameState.audio) {
            GameState.audio.unlocked = true;
        }
        if (typeof SFX !== 'undefined' && typeof SFX._ensureCtx === 'function') {
            SFX._ensureCtx();
        }
    },

    bindUiSound(el, config = {}) {
        if (!el || el.dataset.audioBound === '1') return;
        if (config.hover) {
            el.addEventListener('mouseenter', () => {
                AudioManager.playUi(config.hover);
            });
        }
        if (config.click) {
            el.addEventListener('click', () => {
                AudioManager.handleUserGesture();
                AudioManager.playUi(config.click);
            });
        }
        el.dataset.audioBound = '1';
    },

    playUi(kind) {
        if (typeof GameState !== 'undefined' && GameState.audio && GameState.audio.uiEnabled === false) return;
        if (typeof SFX === 'undefined') return;

        const methodMap = {
            hover: 'uiHover',
            select: 'uiSelect',
            confirm: 'uiConfirm',
            open: 'uiOpen',
            close: 'uiClose',
            skip: 'uiSkip',
            success: 'uiSuccess'
        };
        const method = methodMap[kind] || kind;
        if (typeof SFX[method] === 'function') {
            SFX[method]();
        }
    },

    _getCtx() {
        if (typeof SFX === 'undefined' || typeof SFX._ensureCtx !== 'function') return null;
        return SFX._ensureCtx();
    },

    _ensureBgmGain(ctx) {
        if (this._bgmGain) return this._bgmGain;
        this._bgmGain = ctx.createGain();
        this._bgmGain.gain.value = 0.48;
        this._bgmGain.connect(ctx.destination);
        return this._bgmGain;
    },

    async _loadBuffer(url) {
        if (this._bufferCache[url]) return this._bufferCache[url];
        const ctx = this._getCtx();
        if (!ctx) return null;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`BGM load failed: ${url}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        this._bufferCache[url] = audioBuffer;
        return audioBuffer;
    },

    async playBattleBgm(classId, nodeType = 'battle') {
        if (!classId) return;
        if (typeof GameState !== 'undefined' && GameState.audio && GameState.audio.bgmEnabled === false) return;

        const resolvedClassId = this._trackMap[classId] ? classId : 'qi';
        const trackKey = `${resolvedClassId}:battle`;
        if (this._currentTrackKey === trackKey) return;

        const ctx = this._getCtx();
        if (!ctx) return;

        try {
            const url = this._trackMap[resolvedClassId];
            const buffer = await this._loadBuffer(url);
            if (!buffer) return;

            this.stopBgm();

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            const gain = this._ensureBgmGain(ctx);
            source.connect(gain);
            source.start(0);

            this._bgmSource = source;
            this._currentTrackKey = trackKey;

            if (typeof GameState !== 'undefined' && GameState.audio) {
                GameState.audio.currentTrack = trackKey;
            }
        } catch (err) {
            if (typeof Logger !== 'undefined') {
                Logger.log(`BGM 加载失败：${err.message}`, true);
            }
        }
    },

    stopBgm() {
        if (this._bgmSource) {
            try {
                this._bgmSource.stop(0);
            } catch (err) {
                // ignore repeated stop
            }
            this._bgmSource.disconnect();
            this._bgmSource = null;
        }
        this._currentTrackKey = null;
        if (typeof GameState !== 'undefined' && GameState.audio) {
            GameState.audio.currentTrack = null;
        }
    }
};
