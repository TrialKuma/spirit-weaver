// ==================== 音频管理（本地 WAV BGM + UI 音效） ====================
const AudioManager = {
    _bgmSource: null,
    _bgmGain: null,
    _bgmAudioEl: null,
    _htmlAudioCache: {},
    _bufferCache: {},
    _currentTrackKey: null,
    _trackMap: {
        qi: 'assets/audio/bgm/qi_battle_bgm3.mp3',
        combo: 'assets/audio/bgm/combo_battle_bgm.mp3',
        mana: 'assets/audio/bgm/mana_battle_bgm.mp3',
        balance: 'assets/audio/bgm/balance_battle_bgm.mp3'
    },

    handleUserGesture() {
        if (typeof GameState !== 'undefined' && GameState.audio) {
            GameState.audio.unlocked = true;
        }
        if (typeof SFX !== 'undefined' && typeof SFX._ensureCtx === 'function') {
            SFX._ensureCtx();
        }
        if (this._bgmAudioEl) {
            this._bgmAudioEl.muted = false;
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

    _getHtmlAudio(url) {
        if (this._htmlAudioCache[url]) return this._htmlAudioCache[url];
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.loop = true;
        audio.volume = 0.48;
        this._htmlAudioCache[url] = audio;
        return audio;
    },

    async playBattleBgm(classId, nodeType = 'battle') {
        if (!classId) return;
        if (typeof GameState !== 'undefined' && GameState.audio && GameState.audio.bgmEnabled === false) return;

        const resolvedClassId = this._trackMap[classId] ? classId : 'qi';
        const trackKey = `${resolvedClassId}:battle`;
        if (this._currentTrackKey === trackKey) return;

        try {
            const url = this._trackMap[resolvedClassId];
            this.stopBgm();
            const audio = this._getHtmlAudio(url);
            audio.currentTime = 0;
            await audio.play();

            this._bgmAudioEl = audio;
            this._currentTrackKey = trackKey;

            if (typeof GameState !== 'undefined' && GameState.audio) {
                GameState.audio.currentTrack = trackKey;
            }
        } catch (err) {
            try {
                const ctx = this._getCtx();
                const url = this._trackMap[resolvedClassId];
                const buffer = ctx ? await this._loadBuffer(url) : null;
                if (!ctx || !buffer) throw err;

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
            } catch (fallbackErr) {
                if (typeof Logger !== 'undefined') {
                    Logger.log(`BGM 播放失败：${fallbackErr.message}`, true);
                }
            }
        }
    },

    stopBgm() {
        if (this._bgmAudioEl) {
            this._bgmAudioEl.pause();
            this._bgmAudioEl.currentTime = 0;
            this._bgmAudioEl = null;
        }
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
