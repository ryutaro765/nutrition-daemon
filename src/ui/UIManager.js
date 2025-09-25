import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * UIマネージャー
 * ゲーム内UI要素の描画・管理システム
 */
export class UIManager {
    constructor() {
        this.isVisible = true;
        this.fadeLevel = 1.0;
        this.flashTimer = 0;
        this.shakeIntensity = 0;
        this.shakeTimer = 0;
        
        // UI要素の表示状態
        this.elements = {
            hud: true,
            score: true,
            hp: true,
            weapon: true,
            boss: false,
            gameOver: false,
            pause: false,
            continue: false,
            stageClear: false,
            warning: false
        };
        
        // アニメーション状態
        this.animations = {
            scoreCounter: 0,
            hpBarPulse: 0,
            weaponGlow: 0,
            warningBlink: 0,
            continueCountdown: 0
        };
        
        // カラーテーマ
        this.colors = {
            primary: '#006400',     // 濃い緑（SCORE用）
            secondary: '#FFFF00',
            danger: '#CC0000',      // 濃い赤（COMBO用）
            warning: '#FF6600',
            info: '#00FFFF',
            background: 'rgba(0, 0, 0, 0.7)',
            text: '#FFFFFF',
            shadow: 'rgba(0, 0, 0, 0.8)'
        };
        
        // フォント設定
        this.fonts = {
            small: '14px "Courier New", monospace',
            medium: '18px "Courier New", monospace',
            large: '24px "Courier New", monospace',
            xlarge: '36px "Courier New", monospace',
            title: 'bold 48px "Courier New", monospace'
        };
        
        this.initializeUI();
    }

    /**
     * UI初期化
     */
    initializeUI() {
        // アニメーションタイマーリセット
        Object.keys(this.animations).forEach(key => {
            this.animations[key] = 0;
        });
    }

    /**
     * UI更新
     * @param {Object} gameState - ゲーム状態
     * @param {Object} weaponState - 武器状態
     */
    update(gameState, weaponState) {
        // アニメーション更新
        this.updateAnimations(gameState, weaponState);
        
        // 画面効果更新
        this.updateScreenEffects();
        
        // UI要素表示状態更新
        this.updateElementVisibility(gameState);
    }

    /**
     * アニメーション更新
     * @param {Object} gameState - ゲーム状態
     * @param {Object} weaponState - 武器状態
     */
    updateAnimations(gameState, weaponState) {
        // スコアカウンターアニメーション
        this.animations.scoreCounter += 0.1;
        
        // HPバーパルス（HP低下時）
        if (gameState.hp < gameState.maxHp * 0.3) {
            this.animations.hpBarPulse += 0.2;
        } else {
            this.animations.hpBarPulse *= 0.95;
        }
        
        // 武器グロー（チャージ時）
        if (weaponState && weaponState.isCharging) {
            this.animations.weaponGlow += 0.15;
        } else {
            this.animations.weaponGlow *= 0.9;
        }
        
        // 警告点滅
        this.animations.warningBlink += 0.3;
        
        // コンティニューカウントダウン
        if (this.elements.continue) {
            this.animations.continueCountdown += 0.1;
        }
    }

    /**
     * 画面効果更新
     */
    updateScreenEffects() {
        // フラッシュ効果
        if (this.flashTimer > 0) {
            this.flashTimer--;
        }
        
        // 画面揺れ効果
        if (this.shakeTimer > 0) {
            this.shakeTimer--;
            this.shakeIntensity *= 0.95;
        }
    }

    /**
     * UI要素表示状態更新
     * @param {Object} gameState - ゲーム状態
     */
    updateElementVisibility(gameState) {
        // ボスUI表示判定
        this.elements.boss = gameState.isBossBattle;
        
        // ゲームオーバーUI表示判定
        this.elements.gameOver = gameState.gameOver && !gameState.showingContinue;
        
        // 一時停止UI表示判定
        this.elements.pause = gameState.isPaused;
        
        // コンティニューUI表示判定（正確なプロパティ名を使用）
        this.elements.continue = gameState.showingContinue;
        
        // ステージクリアUI表示判定
        this.elements.stageClear = gameState.stageClear;
        
        // 警告UI表示判定
        this.elements.warning = gameState.showBossWarning;
    }

    /**
     * UI描画
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     * @param {Object} weaponState - 武器状態
     * @param {Object} boss - ボスオブジェクト
     */
    draw(renderer, gameState, weaponState, boss) {
        if (!this.isVisible) return;
        
        renderer.ctx.save();
        
        // 画面揺れ適用
        if (this.shakeIntensity > 0) {
            const offsetX = (Math.random() - 0.5) * this.shakeIntensity;
            const offsetY = (Math.random() - 0.5) * this.shakeIntensity;
            renderer.ctx.translate(offsetX, offsetY);
        }
        
        // HUD描画
        if (this.elements.hud) {
            this.drawHUD(renderer, gameState, weaponState);
        }
        
        // ボスUI描画
        if (this.elements.boss && boss) {
            this.drawBossUI(renderer, boss);
        }
        
        // ゲームオーバーUI描画
        if (this.elements.gameOver) {
            this.drawGameOverUI(renderer, gameState);
        }
        
        // 一時停止UI描画
        if (this.elements.pause) {
            this.drawPauseUI(renderer);
        }
        
        // コンティニューUI描画
        if (this.elements.continue) {
            this.drawContinueUI(renderer, gameState);
        }
        
        // ステージクリアUI描画
        if (this.elements.stageClear) {
            this.drawStageClearUI(renderer, gameState);
        }
        
        // 警告UI描画
        if (this.elements.warning) {
            this.drawWarningUI(renderer);
        }
        
        // フラッシュエフェクト描画
        if (this.flashTimer > 0) {
            this.drawFlashEffect(renderer);
        }
        
        renderer.ctx.restore();
    }

    /**
     * HUD描画
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     * @param {Object} weaponState - 武器状態
     */
    drawHUD(renderer, gameState, weaponState) {
        const padding = 20; // 左端からもう少し離す
        const lineHeight = 28; // 行間も少し広く
        let yOffset = padding;
        
        // スコア表示
        if (this.elements.score) {
            this.drawScore(renderer, padding, yOffset, gameState.score);
            yOffset += lineHeight;
        }
        
        // HP表示
        if (this.elements.hp) {
            this.drawHP(renderer, padding, yOffset, gameState.hp, gameState.maxHp);
            yOffset += lineHeight;
        }
        
        // 武器情報表示
        if (this.elements.weapon && weaponState) {
            this.drawWeaponInfo(renderer, padding, yOffset, weaponState);
            yOffset += lineHeight;
        }
        
        // オーディオ状態表示
        this.drawAudioStatus(renderer, gameState);
        
        // 追加情報表示
        this.drawAdditionalInfo(renderer, padding, yOffset, gameState, weaponState);
    }

    /**
     * スコア描画
     * @param {Object} renderer - レンダラー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} score - スコア
     */
    drawScore(renderer, x, y, score) {
        const glowIntensity = Math.sin(this.animations.scoreCounter) * 0.3 + 0.7;
        
        renderer.ctx.font = this.fonts.medium;
        renderer.ctx.fillStyle = this.colors.shadow;
        renderer.ctx.fillText(`SCORE: ${score.toLocaleString()}`, x + 2, y + 2);
        
        renderer.ctx.fillStyle = `rgba(0, 255, 0, ${glowIntensity})`;
        renderer.ctx.fillText(`SCORE: ${score.toLocaleString()}`, x, y);
    }

    /**
     * HP描画
     * @param {Object} renderer - レンダラー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} currentHP - 現在のHP
     * @param {number} maxHP - 最大HP
     */
    drawHP(renderer, x, y, currentHP, maxHP) {
        const barWidth = 200;
        const barHeight = 16;
        const hpRatio = currentHP / maxHP;
        
        // HP危険時のパルス効果
        const pulseIntensity = hpRatio < 0.3 ? Math.sin(this.animations.hpBarPulse) * 0.5 + 0.5 : 1;
        
        // ラベル
        renderer.ctx.font = this.fonts.medium;
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.fillText('HP:', x, y);
        
        const barX = x + 40;
        const barY = y - 12;
        
        // 背景
        renderer.ctx.fillStyle = this.colors.background;
        renderer.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // HPバー
        const hpWidth = barWidth * hpRatio;
        let hpColor = this.colors.primary;
        
        if (hpRatio < 0.3) {
            hpColor = `rgba(255, 0, 0, ${pulseIntensity})`;
        } else if (hpRatio < 0.6) {
            hpColor = this.colors.warning;
        }
        
        renderer.ctx.fillStyle = hpColor;
        renderer.ctx.fillRect(barX + 2, barY + 2, hpWidth - 4, barHeight - 4);
        
        // HPテキスト
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.font = this.fonts.small;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText(`${currentHP}/${maxHP}`, barX + barWidth / 2, barY + barHeight / 2 + 4);
        renderer.ctx.textAlign = 'start';
        
        // 枠線
        renderer.ctx.strokeStyle = this.colors.text;
        renderer.ctx.lineWidth = 1;
        renderer.ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    /**
     * 武器情報描画
     * @param {Object} renderer - レンダラー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Object} weaponState - 武器状態
     */
    drawWeaponInfo(renderer, x, y, weaponState) {
        const glowIntensity = Math.sin(this.animations.weaponGlow) * 0.5 + 0.5;
        
        renderer.ctx.font = this.fonts.medium;
        renderer.ctx.fillStyle = this.colors.text;
        
        // 武器レベル
        const weaponText = `WEAPON: Lv.${weaponState.level}`;
        renderer.ctx.fillText(weaponText, x, y);
        
        // チャージ表示
        if (weaponState.isCharging) {
            const chargeX = x + 150;
            const chargeWidth = 100 * weaponState.chargeLevel;
            
            renderer.ctx.fillStyle = `rgba(255, 255, 0, ${glowIntensity})`;
            renderer.ctx.fillRect(chargeX, y - 10, chargeWidth, 8);
            
            renderer.ctx.strokeStyle = this.colors.text;
            renderer.ctx.strokeRect(chargeX, y - 10, 100, 8);
        }
        
        // レーザー弾薬表示
        if (weaponState.laserAmmo > 0) {
            renderer.ctx.fillStyle = this.colors.info;
            renderer.ctx.fillText(`LASER: ${weaponState.laserAmmo}`, x + 250, y);
        }
    }

    /**
     * オーディオ状態表示
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     */
    drawAudioStatus(renderer, gameState) {
        const x = renderer.canvas.width - 150;
        const y = 20;
        
        renderer.ctx.font = this.fonts.small;
        
        // BGM状態
        const bgmStatus = window.gameInstance?.audioManager?.isEnabled ? 'ON' : 'OFF';
        const bgmColor = bgmStatus === 'ON' ? '#00FF00' : '#FF0000';
        renderer.ctx.fillStyle = bgmColor;
        renderer.ctx.fillText(`BGM: ${bgmStatus}`, x, y);
        
        // SE状態
        const seStatus = window.gameInstance?.soundEffects?.isDisabled ? 'OFF' : 'ON';
        const seColor = seStatus === 'ON' ? '#00FF00' : '#FF0000';
        renderer.ctx.fillStyle = seColor;
        renderer.ctx.fillText(`SE: ${seStatus}`, x, y + 20);
        
        // Tone.js状態
        const toneStatus = window.Tone?.context?.state || 'unknown';
        const toneColor = toneStatus === 'running' ? '#00FF00' : '#FF0000';
        renderer.ctx.fillStyle = toneColor;
        renderer.ctx.fillText(`Audio: ${toneStatus}`, x, y + 40);
    }

    /**
     * 追加情報描画
     * @param {Object} renderer - レンダラー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {Object} gameState - ゲーム状態
     * @param {Object} weaponState - 武器状態
     */
    drawAdditionalInfo(renderer, x, y, gameState, weaponState) {
        let additionalY = y;
        
        // 高速モード表示
        if (gameState.speedModeTimer > 0) {
            const remaining = Math.ceil(gameState.speedModeTimer / 60);
            renderer.ctx.font = this.fonts.medium;
            renderer.ctx.fillStyle = this.colors.secondary;
            renderer.ctx.fillText(`SPEED MODE: ${remaining}s`, x, additionalY);
            additionalY += 25;
        }
        
        // コンボ表示
        if (weaponState && weaponState.comboCount > 5) {
            renderer.ctx.fillStyle = this.colors.warning;
            renderer.ctx.fillText(`COMBO: ${weaponState.comboCount}`, x, additionalY);
            additionalY += 25;
        }
        
        // 連射ボーナス表示
        if (weaponState && weaponState.rapidFireBonus) {
            const blinkAlpha = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            renderer.ctx.fillStyle = `rgba(255, 20, 147, ${blinkAlpha})`;
            renderer.ctx.fillText('RAPID FIRE!', x, additionalY);
        }
    }

    /**
     * ボスUI描画
     * @param {Object} renderer - レンダラー
     * @param {Object} boss - ボスオブジェクト
     */
    drawBossUI(renderer, boss) {
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const bossBarY = 50;
        const barWidth = 400;
        const barHeight = 20;
        
        // ボス名表示
        renderer.ctx.font = this.fonts.large;
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText(boss.name || 'BOSS', centerX, bossBarY - 10);
        
        // HPバー背景
        renderer.ctx.fillStyle = this.colors.background;
        renderer.ctx.fillRect(centerX - barWidth / 2, bossBarY, barWidth, barHeight);
        
        // HPバー
        const hpRatio = boss.hp / boss.maxHp;
        const hpWidth = (barWidth - 4) * hpRatio;
        
        let hpColor = this.colors.danger;
        if (hpRatio > 0.6) hpColor = this.colors.warning;
        if (hpRatio > 0.8) hpColor = this.colors.primary;
        
        renderer.ctx.fillStyle = hpColor;
        renderer.ctx.fillRect(centerX - barWidth / 2 + 2, bossBarY + 2, hpWidth, barHeight - 4);
        
        // HPテキスト
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.font = this.fonts.small;
        renderer.ctx.fillText(`${boss.hp}/${boss.maxHp}`, centerX, bossBarY + 14);
        
        // 枠線
        renderer.ctx.strokeStyle = this.colors.text;
        renderer.ctx.lineWidth = 2;
        renderer.ctx.strokeRect(centerX - barWidth / 2, bossBarY, barWidth, barHeight);
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * ゲームオーバーUI描画
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     */
    drawGameOverUI(renderer, gameState) {
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
        
        // 背景オーバーレイ
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // GAME OVER テキスト
        renderer.ctx.font = this.fonts.title;
        renderer.ctx.fillStyle = this.colors.danger;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('GAME OVER', centerX, centerY - 50);
        
        // 最終スコア
        renderer.ctx.font = this.fonts.large;
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.fillText(`FINAL SCORE: ${gameState.score.toLocaleString()}`, centerX, centerY);
        
        // 操作案内
        renderer.ctx.font = this.fonts.medium;
        renderer.ctx.fillStyle = this.colors.secondary;
        renderer.ctx.fillText('Press R to Restart', centerX, centerY + 50);
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * 一時停止UI描画
     * @param {Object} renderer - レンダラー
     */
    drawPauseUI(renderer) {
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
        
        // 背景オーバーレイ
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // PAUSED テキスト
        renderer.ctx.font = this.fonts.title;
        renderer.ctx.fillStyle = this.colors.secondary;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('PAUSED', centerX, centerY);
        
        // 操作案内
        renderer.ctx.font = this.fonts.medium;
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.fillText('Press P to Resume', centerX, centerY + 50);
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * コンティニューUI描画
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     */
    drawContinueUI(renderer, gameState) {
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
        
        // 背景オーバーレイ
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // CONTINUE テキスト
        renderer.ctx.font = this.fonts.title;
        renderer.ctx.fillStyle = this.colors.warning;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('CONTINUE?', centerX, centerY - 50);
        
        // 残りコンティニュー回数（正確なプロパティ名を使用）
        const continuesLeft = GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT - gameState.continueCount;
        renderer.ctx.font = this.fonts.large;
        renderer.ctx.fillStyle = this.colors.text;
        renderer.ctx.fillText(`Continues Left: ${continuesLeft}/${GAME_CONFIG.GAMEPLAY.CONTINUE_LIMIT}`, centerX, centerY);
        
        // カウントダウン
        const countdown = Math.ceil(gameState.continueTimer / 60);
        const blinkAlpha = Math.sin(this.animations.continueCountdown) * 0.5 + 0.5;
        renderer.ctx.fillStyle = `rgba(255, 0, 0, ${blinkAlpha})`;
        renderer.ctx.fillText(`${countdown}`, centerX, centerY + 40);
        
        // 操作案内
        renderer.ctx.font = this.fonts.medium;
        renderer.ctx.fillStyle = this.colors.secondary;
        renderer.ctx.fillText('Press C to Continue', centerX, centerY + 80);
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * ステージクリアUI描画
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     */
    drawStageClearUI(renderer, gameState) {
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
        
        // 背景オーバーレイ
        renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // STAGE CLEAR テキスト
        renderer.ctx.font = this.fonts.title;
        renderer.ctx.fillStyle = this.colors.primary;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('STAGE CLEAR!', centerX, centerY - 50);
        
        // ボーナススコア
        renderer.ctx.font = this.fonts.large;
        renderer.ctx.fillStyle = this.colors.secondary;
        renderer.ctx.fillText(`BONUS: ${gameState.stageBonus || 0}`, centerX, centerY);
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * 警告UI描画
     * @param {Object} renderer - レンダラー
     */
    drawWarningUI(renderer) {
        const centerX = GAME_CONFIG.CANVAS_WIDTH / 2;
        const centerY = GAME_CONFIG.CANVAS_HEIGHT / 2;
        
        const blinkAlpha = Math.sin(this.animations.warningBlink) * 0.5 + 0.5;
        
        // WARNING テキスト
        renderer.ctx.font = this.fonts.title;
        renderer.ctx.fillStyle = `rgba(255, 0, 0, ${blinkAlpha})`;
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText('WARNING', centerX, centerY - 50);
        
        // A POWERFUL ENEMY APPROACHES
        renderer.ctx.font = this.fonts.large;
        renderer.ctx.fillStyle = `rgba(255, 100, 0, ${blinkAlpha})`;
        renderer.ctx.fillText('A POWERFUL ENEMY', centerX, centerY);
        renderer.ctx.fillText('APPROACHES', centerX, centerY + 40);
        
        renderer.ctx.textAlign = 'start';
    }

    /**
     * フラッシュエフェクト描画
     * @param {Object} renderer - レンダラー
     */
    drawFlashEffect(renderer) {
        const alpha = this.flashTimer / 10; // 10フレームでフェード
        renderer.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
    }

    /**
     * フラッシュエフェクト開始
     * @param {number} duration - 持続時間（フレーム）
     */
    startFlash(duration = 10) {
        this.flashTimer = duration;
    }

    /**
     * 画面揺れ開始
     * @param {number} intensity - 揺れの強さ
     * @param {number} duration - 持続時間（フレーム）
     */
    startShake(intensity = 10, duration = 30) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    /**
     * UI要素表示切り替え
     * @param {string} element - 要素名
     * @param {boolean} visible - 表示フラグ
     */
    setElementVisibility(element, visible) {
        if (this.elements.hasOwnProperty(element)) {
            this.elements[element] = visible;
        }
    }

    /**
     * UI全体の表示切り替え
     * @param {boolean} visible - 表示フラグ
     */
    setVisibility(visible) {
        this.isVisible = visible;
    }

    /**
     * カラーテーマ変更
     * @param {Object} newColors - 新しいカラーテーマ
     */
    setColorTheme(newColors) {
        Object.assign(this.colors, newColors);
    }

    /**
     * UI要素リセット
     */
    reset() {
        // アニメーション状態リセット
        Object.keys(this.animations).forEach(key => {
            this.animations[key] = 0;
        });
        
        // エフェクトリセット
        this.flashTimer = 0;
        this.shakeIntensity = 0;
        this.shakeTimer = 0;
        
        // UI要素表示状態リセット
        this.elements.gameOver = false;
        this.elements.pause = false;
        this.elements.continue = false;
        this.elements.stageClear = false;
        this.elements.warning = false;
        this.elements.boss = false;
    }
}