// Tone.js is loaded globally via CDN
const Tone = window.Tone || null;

/**
 * BGMプレイヤー（無効化版）
 * パフォーマンス問題により BGM を完全無効化
 */
export class BGMPlayer {
    constructor() {
        this.isPlaying = false;
        this.currentTrack = null;
        this.isLooping = false;
        this.isDisabled = true; // BGMを完全無効化
        
        console.log('🚫 BGMPlayer: BGM is permanently disabled for performance');
        
        // 出力ノード（互換性のため）
        this.output = null;
    }

    /**
     * トラック再生（無効化版）
     * @param {string} trackName - トラック名
     * @param {boolean} loop - ループ再生フラグ
     */
    play(trackName, loop = true) {
        console.log(`🚫 BGMPlayer: BGM "${trackName}" not played (disabled)`);
        return;
    }

    /**
     * BGM停止（無効化版）
     */
    stop() {
        console.log('🚫 BGMPlayer: BGM stop called (disabled)');
        return;
    }

    /**
     * BGM一時停止（無効化版）
     */
    pause() {
        console.log('🚫 BGMPlayer: BGM pause called (disabled)');
        return;
    }

    /**
     * BGM再開（無効化版）
     */
    resume() {
        console.log('🚫 BGMPlayer: BGM resume called (disabled)');
        return;
    }

    /**
     * フェードイン（無効化版）
     */
    fadeIn(duration = 1) {
        return;
    }

    /**
     * フェードアウト（無効化版）
     */
    fadeOut(duration = 1) {
        return;
    }

    /**
     * クロスフェード（無効化版）
     */
    crossfade(newTrack, duration = 2) {
        return;
    }

    /**
     * 音量設定（無効化版）
     */
    setVolume(volume) {
        return;
    }

    /**
     * 動的音楽更新（無効化版）
     */
    updateDynamicMusic(gameState) {
        return;
    }

    /**
     * アクティブボイス数取得（無効化版）
     */
    getActiveVoices() {
        return 0;
    }

    /**
     * リソース解放（無効化版）
     */
    dispose() {
        console.log('🚫 BGMPlayer: BGM dispose called (disabled)');
        this.isDisabled = true;
        this.isPlaying = false;
        this.currentTrack = null;
    }

    /**
     * 再生状態取得
     */
    get isPlayingTrack() {
        return false; // 常にfalse
    }

    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            isPlaying: false,
            isDisabled: true,
            currentTrack: null,
            message: 'BGM permanently disabled for performance'
        };
    }
}