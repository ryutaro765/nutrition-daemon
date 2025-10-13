/**
 * BGMプレイヤー (MP3再生版)
 * HTML5 Audio APIを使用したBGM再生システム
 */
export class BGMPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentTrack = null;
        this.isLooping = true;
        this.isDisabled = false;
        this.baseVolume = 0.5; // 基本音量 (0.0 ~ 1.0)

        console.log('🎵 BGMPlayer: MP3 BGM system enabled');

        // MP3ファイルの定義
        this.tracks = {
            // フィールド用BGM（ステージ1/2/3共通）
            'stage1': { file: '/audio/bgm/med_field1.mp3', type: 'field' },
            'stage2': { file: '/audio/bgm/med_field1.mp3', type: 'field' },
            'stage3': { file: '/audio/bgm/med_field1.mp3', type: 'field' },

            // ボス用BGM（ボス1/2/3/4共通）
            'boss1': { file: '/audio/bgm/med_boss1.mp3', type: 'boss' },
            'boss2': { file: '/audio/bgm/med_boss1.mp3', type: 'boss' },
            'boss3': { file: '/audio/bgm/med_boss1.mp3', type: 'boss' },
            'boss4': { file: '/audio/bgm/med_boss1.mp3', type: 'boss' },

            // 勝利用BGM（将来追加予定）
            'victory': { file: '/audio/bgm/med_field1.mp3', type: 'field' }
        };

        // Audioオブジェクト（2つのトラックを切り替え）
        this.audioElements = {
            field: null,
            boss: null
        };

        // 各タイプのAudioオブジェクトを作成
        this.initializeAudioElements();
    }

    /**
     * Audioオブジェクトの初期化
     */
    initializeAudioElements() {
        // フィールドBGM
        this.audioElements.field = new Audio('/audio/bgm/med_field1.mp3');
        this.audioElements.field.loop = true;
        this.audioElements.field.volume = this.baseVolume;
        this.audioElements.field.preload = 'auto';

        // ボスBGM
        this.audioElements.boss = new Audio('/audio/bgm/med_boss1.mp3');
        this.audioElements.boss.loop = true;
        this.audioElements.boss.volume = this.baseVolume;
        this.audioElements.boss.preload = 'auto';

        console.log('🎵 BGMPlayer: Audio elements initialized');
    }

    /**
     * トラック再生
     * @param {string} trackName - トラック名（stage1, stage2, boss1など）
     * @param {boolean} loop - ループ再生フラグ（デフォルト: true）
     */
    play(trackName, loop = true) {
        if (this.isDisabled) {
            console.log(`🚫 BGMPlayer: BGM "${trackName}" not played (disabled)`);
            return;
        }

        try {
            const track = this.tracks[trackName];
            if (!track) {
                console.warn(`BGMPlayer: Track "${trackName}" not found`);
                return;
            }

            // 同じトラックタイプが既に再生中なら何もしない
            const currentAudio = this.audioElements[track.type];
            if (this.isPlaying && this.currentTrack === trackName && !currentAudio.paused) {
                console.log(`🎵 BGMPlayer: "${trackName}" is already playing`);
                return;
            }

            // 既存のBGMを停止
            this.stopAll();

            console.log(`🎵 BGMPlayer: Playing "${trackName}" (${track.type})`);

            // 対応するAudioオブジェクトを再生
            // ボスBGMは5秒から再生
            if (track.type === 'boss') {
                currentAudio.currentTime = 5.0; // 5秒から再生
            } else {
                currentAudio.currentTime = 0;
            }
            currentAudio.loop = loop;
            currentAudio.volume = this.baseVolume;

            // play()はPromiseを返すので、エラーハンドリング
            currentAudio.play().then(() => {
                this.isPlaying = true;
                this.currentTrack = trackName;
                this.isLooping = loop;
                console.log(`✅ BGMPlayer: "${trackName}" started successfully`);
            }).catch(error => {
                console.error('BGMPlayer: Error playing audio:', error);
            });

        } catch (error) {
            console.error('BGMPlayer: Error in play():', error);
        }
    }

    /**
     * 全BGM停止
     */
    stopAll() {
        try {
            Object.values(this.audioElements).forEach(audio => {
                if (audio && !audio.paused) {
                    audio.pause();
                    audio.currentTime = 0;
                }
            });
        } catch (error) {
            console.error('BGMPlayer: Error stopping all audio:', error);
        }
    }

    /**
     * BGM停止
     */
    stop() {
        if (!this.isPlaying) return;

        try {
            this.stopAll();
            this.isPlaying = false;
            this.currentTrack = null;
            console.log('🛑 BGMPlayer: BGM stopped');
        } catch (error) {
            console.error('BGMPlayer: Error stopping BGM:', error);
        }
    }

    /**
     * BGM一時停止
     */
    pause() {
        if (!this.isPlaying) return;

        try {
            const track = this.tracks[this.currentTrack];
            if (track) {
                const audio = this.audioElements[track.type];
                if (audio && !audio.paused) {
                    audio.pause();
                    console.log('⏸️ BGMPlayer: BGM paused');
                }
            }
        } catch (error) {
            console.error('BGMPlayer: Error pausing BGM:', error);
        }
    }

    /**
     * BGM再開
     */
    resume() {
        if (!this.isPlaying) return;

        try {
            const track = this.tracks[this.currentTrack];
            if (track) {
                const audio = this.audioElements[track.type];
                if (audio && audio.paused) {
                    audio.play().then(() => {
                        console.log('▶️ BGMPlayer: BGM resumed');
                    }).catch(error => {
                        console.error('BGMPlayer: Error resuming audio:', error);
                    });
                }
            }
        } catch (error) {
            console.error('BGMPlayer: Error resuming BGM:', error);
        }
    }

    /**
     * フェードイン
     * @param {number} duration - フェード時間（秒）
     */
    fadeIn(duration = 1) {
        const track = this.tracks[this.currentTrack];
        if (!track) return;

        const audio = this.audioElements[track.type];
        if (!audio) return;

        const steps = 20;
        const stepTime = (duration * 1000) / steps;
        let currentStep = 0;

        audio.volume = 0;

        const fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.min((currentStep / steps) * this.baseVolume, this.baseVolume);

            if (currentStep >= steps) {
                clearInterval(fadeInterval);
            }
        }, stepTime);
    }

    /**
     * フェードアウト
     * @param {number} duration - フェード時間（秒）
     */
    fadeOut(duration = 1) {
        const track = this.tracks[this.currentTrack];
        if (!track) return;

        const audio = this.audioElements[track.type];
        if (!audio) return;

        const steps = 20;
        const stepTime = (duration * 1000) / steps;
        let currentStep = 0;
        const startVolume = audio.volume;

        const fadeInterval = setInterval(() => {
            currentStep++;
            audio.volume = Math.max(startVolume * (1 - currentStep / steps), 0);

            if (currentStep >= steps) {
                clearInterval(fadeInterval);
                audio.pause();
            }
        }, stepTime);
    }

    /**
     * クロスフェード
     * @param {string} newTrack - 新しいトラック名
     * @param {number} duration - クロスフェード時間（秒）
     */
    crossfade(newTrack, duration = 2) {
        this.fadeOut(duration / 2);
        setTimeout(() => {
            this.play(newTrack);
            this.fadeIn(duration / 2);
        }, (duration / 2) * 1000);
    }

    /**
     * 音量設定
     * @param {number} volume - 音量（0.0 ~ 1.0）
     */
    setVolume(volume) {
        this.baseVolume = Math.max(0, Math.min(1, volume));
        Object.values(this.audioElements).forEach(audio => {
            if (audio) {
                audio.volume = this.baseVolume;
            }
        });
    }

    /**
     * リソース解放
     */
    dispose() {
        this.stop();
        Object.keys(this.audioElements).forEach(key => {
            if (this.audioElements[key]) {
                this.audioElements[key].pause();
                this.audioElements[key].src = '';
                this.audioElements[key] = null;
            }
        });
        console.log('🗑️ BGMPlayer: Resources disposed');
    }

    /**
     * 再生状態取得
     */
    get isPlayingTrack() {
        return this.isPlaying;
    }

    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            isPlaying: this.isPlaying,
            isDisabled: this.isDisabled,
            currentTrack: this.currentTrack,
            message: this.isPlaying ? `Playing: ${this.currentTrack}` : 'Not playing'
        };
    }
}