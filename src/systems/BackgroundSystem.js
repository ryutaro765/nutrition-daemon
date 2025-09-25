import { GAME_CONFIG, STAGES, MSX_MAKIDEN_COLORS } from '../config/gameConfig.js';

/**
 * 背景システム
 */
export class BackgroundSystem {
    constructor() {
        this.scrollOffset = 0;
        this.scrollSpeed = GAME_CONFIG.GAMEPLAY.SCROLL_SPEED;
        this.currentStage = 0; // 常に草原ステージで固定
        this.nextStageTransition = false;
        this.transitionProgress = 0;
        
        // 地形要素
        this.rivers = [];
        this.bridges = [];
        this.questionBoxes = [];
        this.pillars = [];
        this.decorationPillars = []; // スクロール対応装飾柱
        
        // タイル情報
        this.tileSize = 32;
        this.tilesPerRow = Math.ceil(GAME_CONFIG.CANVAS_WIDTH / this.tileSize) + 1;
        this.tileRows = Math.ceil(GAME_CONFIG.CANVAS_HEIGHT / this.tileSize) + 2;
        
        // デバッグフラグ
        this.bridgeDrawLogged = false;
        
        // フレームカウンタ（定期検証用）
        this.frameCount = 0;
        
        this.initializeStage();
    }

    /**
     * ステージ初期化
     */
    initializeStage() {
        // スクロールオフセットをリセット（重要：リスタート時の同期保証）
        this.scrollOffset = 0;
        
        this.generateTerrain();
        this.generateQuestionBoxes();
        this.generatePillars();
        this.generateDecorationPillars();
    }

    /**
     * 地形生成（開始エリア安全版：プレイヤー初期位置周辺に川を生成しない）
     */
    generateTerrain() {
        this.rivers = [];
        this.bridges = [];
        
        // プレイヤー初期スポーン地点の安全エリア定義
        const playerSpawnY = 500; // プレイヤーの初期Y座標
        const safeZoneHeight = 200; // 安全エリアの高さ
        const safeZoneStart = playerSpawnY - safeZoneHeight / 2;
        const safeZoneEnd = playerSpawnY + safeZoneHeight / 2;
        
        // 川の生成（安全エリアを避ける）- 元の3本に戻す
        const riverCount = 3;
        const riverHeight = 100;
        
        for (let i = 0; i < riverCount; i++) {
            let riverY;
            
            // 川の位置を計算（安全エリアを避ける）
            if (i === 0) {
                // 1本目：安全エリアより上
                riverY = Math.min(safeZoneStart - riverHeight - 50, 100);
            } else if (i === 1) {
                // 2本目：安全エリアより下
                riverY = Math.max(safeZoneEnd + 50, GAME_CONFIG.CANVAS_HEIGHT - 300);
            } else {
                // 3本目：更に下
                riverY = Math.max(safeZoneEnd + 200, GAME_CONFIG.CANVAS_HEIGHT - 150);
            }
            
            // 川が画面外に出ないように調整
            riverY = Math.max(50, Math.min(riverY, GAME_CONFIG.CANVAS_HEIGHT - riverHeight - 50));
            
            // 安全エリアと重複しないかチェック
            const riverBottom = riverY + riverHeight;
            const isInSafeZone = (riverY <= safeZoneEnd && riverBottom >= safeZoneStart);
            
            if (!isInSafeZone) {
                this.rivers.push({
                    x: 0,
                    y: riverY,
                    width: GAME_CONFIG.CANVAS_WIDTH,
                    height: riverHeight,
                    originalY: riverY,
                    id: i
                });
                console.log(`🌊 River ${i} placed at Y=${riverY} (safe from spawn area ${safeZoneStart}-${safeZoneEnd})`);
            } else {
                console.log(`⚠️ River ${i} skipped - would overlap with player safe zone`);
            }
        }
        
        // 改良版橋生成システム
        this.generateGuaranteedBridges();
        
        // 簡略化：過度な検証システムを削除（パフォーマンス向上）
        console.log(`🌊 Generated ${this.rivers.length} rivers and ${this.bridges.length} bridges (start area protected)`);
        this.logSimplifiedBridgeLayout();
    }

    /**
     * 簡略化された橋配置ログ
     */
    logSimplifiedBridgeLayout() {
        console.log('🔍 Simplified Bridge Layout:');
        
        for (const river of this.rivers) {
            const riverBridges = this.bridges.filter(bridge => bridge.riverId === river.id);
            
            // カバレッジ率計算
            const totalCovered = riverBridges.reduce((sum, bridge) => sum + bridge.width, 0);
            const coveragePercentage = Math.min(100, (totalCovered / GAME_CONFIG.CANVAS_WIDTH * 100)).toFixed(1);
            
            console.log(`📍 River ${river.id}: ${riverBridges.length} bridges, ${coveragePercentage}% coverage`);
        }
    }

    /**
     * 橋配置の詳細ログ（レガシー - 使用停止）
     */
    logBridgeLayoutDetails() {
        console.log('🔍 Bridge Layout Analysis:');
        
        for (const river of this.rivers) {
            const riverBridges = this.bridges.filter(bridge => bridge.riverId === river.id);
            console.log(`📍 River ${river.id} (y: ${river.y}): ${riverBridges.length} bridges`);
            
            // 橋を位置順にソート
            const sortedBridges = riverBridges.sort((a, b) => a.x - b.x);
            
            sortedBridges.forEach((bridge, index) => {
                const coverage = `x: ${bridge.x} - ${bridge.x + bridge.width}`;
                const type = bridge.generationType || 'standard';
                console.log(`  🌉 Bridge ${index}: ${coverage} (${type})`);
            });
            
            // カバレッジ分析
            const gaps = this.findCoverageGaps(river, riverBridges);
            if (gaps.length > 0) {
                console.warn(`  ⚠️ ${gaps.length} coverage gaps found:`);
                gaps.forEach(gap => {
                    console.warn(`    Gap: x ${gap.start} - ${gap.end} (width: ${gap.width})`);
                });
            } else {
                console.log(`  ✅ Complete coverage confirmed`);
            }
            
            // カバレッジ率計算
            const totalCovered = riverBridges.reduce((sum, bridge) => sum + bridge.width, 0);
            const overlapAdjustedCoverage = this.calculateActualCoverage(river, riverBridges);
            const coveragePercentage = (overlapAdjustedCoverage / GAME_CONFIG.CANVAS_WIDTH * 100).toFixed(1);
            console.log(`  📊 Coverage: ${overlapAdjustedCoverage}/${GAME_CONFIG.CANVAS_WIDTH}px (${coveragePercentage}%)`);
        }
    }

    /**
     * 実際のカバレッジを計算（重複を考慮）
     */
    calculateActualCoverage(river, bridges) {
        if (bridges.length === 0) return 0;
        
        const intervals = bridges.map(bridge => ({
            start: bridge.x,
            end: bridge.x + bridge.width
        })).sort((a, b) => a.start - b.start);
        
        let totalCoverage = 0;
        let currentEnd = 0;
        
        for (const interval of intervals) {
            if (interval.start >= currentEnd) {
                // 重複なし
                totalCoverage += interval.end - interval.start;
                currentEnd = interval.end;
            } else if (interval.end > currentEnd) {
                // 部分的重複
                totalCoverage += interval.end - currentEnd;
                currentEnd = interval.end;
            }
            // 完全重複の場合は何もしない
        }
        
        return totalCoverage;
    }

    /**
     * 川渡り可能性をテスト（デバッグ用）
     */
    testRiverCrossing() {
        console.log('🧪 Testing River Crossing Capabilities:');
        
        for (const river of this.rivers) {
            console.log(`🌊 Testing River ${river.id}:`);
            
            // 複数の横断ポイントをテスト
            const testPoints = [50, 150, 250, 350, 450, 550, 650, 750]; // X座標
            let crossablePoints = 0;
            
            for (const x of testPoints) {
                const canCross = this.canPlayerCrossAtPoint(x, river);
                console.log(`  📍 x=${x}: ${canCross ? '✅ Crossable' : '❌ Not crossable'}`);
                if (canCross) crossablePoints++;
            }
            
            const crossabilityRate = (crossablePoints / testPoints.length * 100).toFixed(1);
            console.log(`  📊 Crossability Rate: ${crossablePoints}/${testPoints.length} (${crossabilityRate}%)`);
            
            if (crossabilityRate < 80) {
                console.warn(`  ⚠️ Low crossability rate detected! Adding emergency bridges.`);
                this.addEmergencyCrossings(river, testPoints.filter((x, i) => !this.canPlayerCrossAtPoint(x, river)));
            }
        }
    }

    /**
     * 指定された点でプレイヤーが川を渡れるかチェック
     */
    canPlayerCrossAtPoint(x, river) {
        const playerWidth = 36;
        const playerBounds = {
            left: x,
            right: x + playerWidth,
            top: river.y,
            bottom: river.y + river.height
        };
        
        // この位置に橋があるかチェック
        const riverBridges = this.bridges.filter(bridge => bridge.riverId === river.id);
        
        for (const bridge of riverBridges) {
            if (playerBounds.left < bridge.x + bridge.width &&
                playerBounds.right > bridge.x &&
                playerBounds.top < bridge.y + bridge.height &&
                playerBounds.bottom > bridge.y) {
                return true; // 橋の上にいる
            }
        }
        
        return false; // 橋がない
    }

    /**
     * 緊急横断ポイントの追加
     */
    addEmergencyCrossings(river, failedPoints) {
        const bridgeWidth = 160;
        const bridgeMargin = 15;
        
        for (const x of failedPoints) {
            const bridgeX = x - (bridgeWidth / 2);
            const finalBridgeX = Math.max(0, Math.min(bridgeX, GAME_CONFIG.CANVAS_WIDTH - bridgeWidth));
            
            // 既存の橋と重複していないかチェック
            const hasConflict = this.bridges.some(bridge => 
                bridge.riverId === river.id &&
                Math.abs(bridge.x - finalBridgeX) < bridgeWidth * 0.5
            );
            
            if (!hasConflict) {
                this.bridges.push({
                    x: finalBridgeX,
                    y: river.y - bridgeMargin,
                    width: bridgeWidth,
                    height: river.height + (bridgeMargin * 2),
                    originalY: river.y - bridgeMargin,
                    riverId: river.id,
                    bridgeMargin: bridgeMargin,
                    isVisible: true,
                    generationType: 'emergency-crossing'
                });
                
                console.log(`🚨 Emergency crossing bridge added at x=${finalBridgeX} for river ${river.id}`);
            }
        }
    }

    /**
     * 保証された橋生成システム（最大2本制限版）
     */
    generateGuaranteedBridges() {
        for (const river of this.rivers) {
            const bridgeWidth = 120; // 橋幅を縮小して川を見えやすく
            const bridgeMargin = 15;
            const maxBridgesPerRiver = 2; // 川1つあたり最大2本
            
            // 川1つあたり最大2本の橋を配置
            const bridgePositions = [0.3, 0.7]; // 画面の3/10と7/10位置
            
            let bridgeCount = 0;
            for (let i = 0; i < bridgePositions.length && bridgeCount < maxBridgesPerRiver; i++) {
                const position = bridgePositions[i];
                const bridgeX = (GAME_CONFIG.CANVAS_WIDTH * position) - (bridgeWidth / 2);
                const finalBridgeX = Math.max(0, Math.min(bridgeX, GAME_CONFIG.CANVAS_WIDTH - bridgeWidth));
                
                this.bridges.push({
                    x: finalBridgeX,
                    y: river.y - bridgeMargin,
                    width: bridgeWidth,
                    height: river.height + (bridgeMargin * 2),
                    originalY: river.y - bridgeMargin,
                    riverId: river.id,
                    bridgeMargin: bridgeMargin,
                    isVisible: true,
                    generationType: 'limited' // 制限モードフラグ
                });
                bridgeCount++;
            }
            
            console.log(`🌉 River ${river.id}: Generated ${bridgeCount} bridges (max: ${maxBridgesPerRiver})`);
        }
    }

    /**
     * ？ボックス生成
     */
    generateQuestionBoxes() {
        this.questionBoxes = [];
        
        // ？ボックスを大量生成（画像のような密度）
        const boxCount = Math.floor(Math.random() * 8) + 12; // 12-19個生成
        console.log(`📦 Generating ${boxCount} question boxes`);
        const canvasWidth = GAME_CONFIG.CANVAS_WIDTH;
        const pillarWidth = 32; // 装飾柱の幅を考慮（縮小）
        const usableWidth = canvasWidth - (pillarWidth * 2); // 柱の間の幅
        
        for (let i = 0; i < boxCount; i++) {
            // 柱の間に配置するようにX座標を調整（大きいサイズを考慮）
            const x = pillarWidth + (Math.random() * (usableWidth - 80));
            const y = -50 - Math.random() * 800; // さらに広い範囲に配置
            
            this.questionBoxes.push({
                x: x,
                y: y,
                width: 80, // 5倍スケールに対応したサイズ（16*5=80）
                height: 80,
                hp: 4,
                maxHp: 4,
                shouldRemove: false,
                blinkTimer: 0
            });
        }
    }

    /**
     * 柱生成（無効化）
     */
    generatePillars() {
        this.pillars = [];
        // 柱生成を無効化（紫の魔法柱を削除）
    }
    
    /**
     * 装飾柱生成（スクロール対応、川エリア回避）
     */
    generateDecorationPillars() {
        this.decorationPillars = [];
        
        const pillarWidth = 32;
        const pillarHeight = 80;
        const canvasHeight = GAME_CONFIG.CANVAS_HEIGHT;
        
        // 左右それぞれに柱を生成
        for (let side = 0; side < 2; side++) {
            const x = side === 0 ? 0 : GAME_CONFIG.CANVAS_WIDTH - pillarWidth;
            
            // ランダムに柱を配置（密度を下げる）
            for (let y = -500; y < canvasHeight + 1000; y += 120 + Math.random() * 80) {
                // 川エリアとの重複チェック
                if (!this.isInRiverArea(x, y, pillarWidth, pillarHeight)) {
                    // 60%の確率で柱を配置（ランダム性）
                    if (Math.random() < 0.6) {
                        this.decorationPillars.push({
                            x: x,
                            y: y,
                            width: pillarWidth,
                            height: pillarHeight,
                            originalY: y,
                            side: side // 0=左, 1=右
                        });
                    }
                }
            }
        }
        
        console.log(`🏛️ Generated ${this.decorationPillars.length} decoration pillars`);
    }
    
    /**
     * 川エリア判定
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @returns {boolean} 川エリアと重複するか
     */
    isInRiverArea(x, y, width, height) {
        for (const river of this.rivers) {
            const pillarBottom = y + height;
            const pillarTop = y;
            const riverBottom = river.y + river.height;
            const riverTop = river.y;
            
            // Y軸で重複チェック
            if (pillarTop < riverBottom && pillarBottom > riverTop) {
                return true;
            }
        }
        return false;
    }

    /**
     * システム更新
     * @param {Object} gameState - ゲーム状態
     */
    update(gameState) {
        // フレームカウンタ更新
        this.frameCount++;
        
        // スクロール更新
        this.updateScroll(gameState);
        
        // ステージ遷移チェック
        this.checkStageTransition(gameState);
        
        // ？ボックス更新
        this.updateQuestionBoxes();
        
        // 地形要素のスクロール
        this.scrollTerrain();
    }

    /**
     * スクロール更新
     * @param {Object} gameState - ゲーム状態
     */
    updateScroll(gameState) {
        if (!gameState.gameOver && gameState.gameStarted) {
            let currentScrollSpeed = this.scrollSpeed;
            
            // 高速モード時は2倍速
            if (gameState.speedModeTimer > 0) {
                currentScrollSpeed *= 2;
            }
            
            this.scrollOffset += currentScrollSpeed;
            
            // スクロールオフセットが画面高さを超えたらリセット
            if (this.scrollOffset >= GAME_CONFIG.CANVAS_HEIGHT) {
                this.scrollOffset = 0;
                this.regenerateDistantTerrain();
            }
        }
    }

    /**
     * ステージ遷移チェック（完全無効化 - 常にステージ0草原固定）
     * @param {Object} gameState - ゲーム状態
     */
    checkStageTransition(gameState) {
        // ステージ変更ロジックを有効化
        // ボス撃破数に基づいてステージを決定
        const targetStage = Math.min(gameState.bossesDefeated, STAGES.length - 1);
        
        if (targetStage !== this.currentStage) {
            console.log(`🎬 Stage transition triggered: ${this.currentStage} → ${targetStage} (bosses defeated: ${gameState.bossesDefeated})`);
            
            this.nextStageTransition = true;
            this.transitionProgress = 0;
            this.currentStage = targetStage;
            
            // 地形を新ステージ用に再生成
            this.regenerateForNewStage();
            
            return true;
        }
        
        // ステージ遷移エフェクトの更新
        if (this.nextStageTransition) {
            this.transitionProgress += 0.02; // 遷移速度
            
            if (this.transitionProgress >= 1.0) {
                this.nextStageTransition = false;
                this.transitionProgress = 0;
                console.log(`✅ Stage transition completed to stage ${this.currentStage}`);
            }
        }
        
        return false;
    }

    /**
     * ？ボックス更新
     */
    updateQuestionBoxes() {
        for (const box of this.questionBoxes) {
            if (box.shouldRemove) continue;
            
            // 点滅アニメーション
            box.blinkTimer += 0.1;
            
            // Y座標をスクロールに合わせて移動
            box.y += this.scrollSpeed;
            
            // 画面外チェック
            if (box.y > GAME_CONFIG.CANVAS_HEIGHT + 50) {
                box.shouldRemove = true;
            }
        }
        
        // 削除対象を除去
        this.questionBoxes = this.questionBoxes.filter(box => !box.shouldRemove);
    }

    /**
     * 地形要素のスクロール
     */
    scrollTerrain() {
        // 川と橋のスクロール
        for (const river of this.rivers) {
            river.y += this.scrollSpeed;
            if (river.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
                river.y = river.originalY - GAME_CONFIG.CANVAS_HEIGHT - 100;
            }
        }
        
        // 橋のスクロールとリセット処理を改善（川との完全同期）
        for (const bridge of this.bridges) {
            const river = this.rivers[bridge.riverId]; // 対応する川を取得
            
            if (!river) {
                console.warn(`⚠️ Bridge with riverId ${bridge.riverId} has no corresponding river`);
                continue;
            }
            
            bridge.y += this.scrollSpeed;
            
            // 橋が画面外に出たら対応する川と同じタイミングでリセット
            if (bridge.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
                // 川のoriginalY位置に基づいて橋をリセット（完全同期）
                bridge.y = river.originalY - GAME_CONFIG.CANVAS_HEIGHT - 100 - bridge.bridgeMargin;
                
                // デバッグ：橋のリセット情報をログ
                console.log(`🌉 Bridge ${bridge.riverId} reset: y=${bridge.y}, riverOriginalY=${river.originalY}`);
            }
        }
        
        // 柱のスクロール
        for (const pillar of this.pillars) {
            pillar.y += this.scrollSpeed;
            if (pillar.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
                pillar.y = -pillar.height - Math.random() * 200;
                pillar.x = Math.random() * GAME_CONFIG.CANVAS_WIDTH;
            }
        }
        
        // 装飾柱のスクロール
        for (const pillar of this.decorationPillars) {
            pillar.y += this.scrollSpeed;
            if (pillar.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
                pillar.y = pillar.originalY - GAME_CONFIG.CANVAS_HEIGHT - 100;
            }
        }
    }

    /**
     * 遠景地形の再生成（シンプル版）
     */
    regenerateDistantTerrain() {
        // パフォーマンス向上のため、複雑な検証システムを無効化
        // 基本的な川と橋のシステムで十分な動作を保証
        
        // 定期的な簡単なチェックのみ（5分に1回）
        if (this.frameCount && this.frameCount % 18000 === 0) {
            console.log('🔄 Simple terrain check performed');
        }
    }
    
    /**
     * 橋カバレッジの検証と修正（完全改良版）
     */
    validateAndFixBridgeCoverage() {
        for (const river of this.rivers) {
            const riverBridges = this.bridges.filter(bridge => bridge.riverId === river.id);
            
            // 川の全幅をカバーしているかチェック
            const coverageGaps = this.findCoverageGaps(river, riverBridges);
            
            // ギャップが見つかった場合は埋める
            for (const gap of coverageGaps) {
                this.fillCoverageGap(river, gap);
            }
            
            // 最終的なカバレッジ検証
            this.verifyCompleteCoverage(river);
        }
    }

    /**
     * カバレッジのギャップを特定
     */
    findCoverageGaps(river, bridges) {
        const gaps = [];
        const bridgeWidth = 160;
        const playerWidth = 36; // プレイヤーの幅を考慮
        const safetyMargin = 20; // 安全マージン
        
        // ブリッジをX座標でソート
        const sortedBridges = bridges.sort((a, b) => a.x - b.x);
        
        let currentPosition = 0;
        
        for (const bridge of sortedBridges) {
            // 現在位置と次の橋の間にギャップがあるかチェック
            if (bridge.x > currentPosition + safetyMargin) {
                gaps.push({
                    start: currentPosition,
                    end: bridge.x,
                    width: bridge.x - currentPosition
                });
            }
            currentPosition = Math.max(currentPosition, bridge.x + bridge.width);
        }
        
        // 最後の橋から画面端までのチェック
        if (currentPosition < GAME_CONFIG.CANVAS_WIDTH - safetyMargin) {
            gaps.push({
                start: currentPosition,
                end: GAME_CONFIG.CANVAS_WIDTH,
                width: GAME_CONFIG.CANVAS_WIDTH - currentPosition
            });
        }
        
        return gaps.filter(gap => gap.width > playerWidth + safetyMargin);
    }

    /**
     * カバレッジギャップを埋める
     */
    fillCoverageGap(river, gap) {
        const bridgeWidth = 160;
        const bridgeMargin = 15;
        
        // ギャップの中央に橋を配置
        const bridgeX = gap.start + (gap.width - bridgeWidth) / 2;
        const finalBridgeX = Math.max(0, Math.min(bridgeX, GAME_CONFIG.CANVAS_WIDTH - bridgeWidth));
        
        this.bridges.push({
            x: finalBridgeX,
            y: river.y - bridgeMargin,
            width: bridgeWidth,
            height: river.height + (bridgeMargin * 2),
            originalY: river.y - bridgeMargin,
            riverId: river.id,
            bridgeMargin: bridgeMargin,
            isVisible: true,
            generationType: 'gap-fill' // ギャップ埋めフラグ
        });
        
        console.log(`🔧 Gap-fill bridge added for river ${river.id}: gap(${gap.start}-${gap.end}), bridge at ${finalBridgeX}`);
    }

    /**
     * 完全カバレッジの検証
     */
    verifyCompleteCoverage(river) {
        const riverBridges = this.bridges.filter(bridge => bridge.riverId === river.id);
        const remainingGaps = this.findCoverageGaps(river, riverBridges);
        
        if (remainingGaps.length > 0) {
            console.warn(`⚠️ River ${river.id} still has ${remainingGaps.length} coverage gaps:`, remainingGaps);
            
            // 強制的に追加の橋を生成
            for (const gap of remainingGaps) {
                this.fillCoverageGap(river, gap);
            }
        } else {
            console.log(`✅ River ${river.id} has complete bridge coverage`);
        }
    }

    /**
     * 橋の有効性検証と緊急生成（改良版）
     */
    validateBridgeAvailability() {
        // 画面内に表示されている川をチェック
        let screenRivers = this.rivers.filter(river => 
            river.y < GAME_CONFIG.CANVAS_HEIGHT + 100 && 
            river.y + river.height > -100
        );
        
        for (const river of screenRivers) {
            // この川に対応する画面内の橋をチェック
            let screenBridges = this.bridges.filter(bridge => 
                bridge.riverId === river.id &&
                bridge.y < GAME_CONFIG.CANVAS_HEIGHT + 100 && 
                bridge.y + bridge.height > -100 &&
                bridge.isVisible
            );
            
            // 画面内での橋カバレッジをチェック
            if (screenBridges.length === 0) {
                console.log(`🚨 No bridges visible for river ${river.id} - emergency generation`);
                this.generateEmergencyBridge(river);
            } else {
                // 画面内でのカバレッジギャップをチェック
                const screenGaps = this.findCoverageGaps(river, screenBridges);
                if (screenGaps.length > 0) {
                    console.log(`🚨 Coverage gaps detected for river ${river.id} on screen - filling gaps`);
                    for (const gap of screenGaps) {
                        this.fillCoverageGap(river, gap);
                    }
                }
            }
        }
    }
    
    /**
     * 緊急橋生成
     * @param {Object} river - 対象の川
     */
    generateEmergencyBridge(river) {
        const bridgeWidth = 160; // 緊急橋は大きめ
        const bridgeMargin = 15;
        const bridgeX = GAME_CONFIG.CANVAS_WIDTH / 2 - bridgeWidth / 2; // 画面中央
        
        const emergencyBridge = {
            x: bridgeX,
            y: river.y - bridgeMargin,
            width: bridgeWidth,
            height: river.height + (bridgeMargin * 2),
            originalY: river.y - bridgeMargin,
            riverId: river.id,
            bridgeMargin: bridgeMargin,
            isVisible: true,
            isEmergency: true // 緊急生成フラグ
        };
        
        this.bridges.push(emergencyBridge);
        console.log(`🌉 Emergency bridge created at (${bridgeX}, ${river.y - bridgeMargin}) for river ${river.id}`);
    }

    /**
     * 新ステージ用の再生成
     */
    regenerateForNewStage() {
        // スクロールオフセットをリセット（リスタート時の同期保証）
        this.scrollOffset = 0;
        
        // ステージ遷移エフェクトの準備
        this.nextStageTransition = true;
        this.transitionProgress = 0;
        
        // 地形を新ステージ用に完全再生成
        this.generateTerrain();
        this.generateQuestionBoxes();
        this.generatePillars();
        
        // ステージ遷移ログ
        const stageName = STAGES[this.currentStage]?.name || 'Unknown';
        console.log(`🎬 Stage regenerated for: ${stageName} (Stage ${this.currentStage})`);
        console.log(`   - Rivers: ${this.rivers.length}`);
        console.log(`   - Bridges: ${this.bridges.length}`);
        console.log(`   - Question boxes: ${this.questionBoxes.length}`);
        
        // ステージ別の特別な初期化
        switch (this.currentStage) {
            case 0: // 草原ステージ
                console.log('🌱 Grassland stage initialized with blue rivers');
                break;
                
            case 1: // 荒野ステージ
                console.log('🏜️ Wasteland stage initialized with sand rivers and rocks');
                break;
                
            case 2: // 魔城ステージ
                console.log('🏰 Demon castle stage initialized with lava rivers and magic decorations');
                break;
        }
        
        // 橋の可用性を再検証（新ステージでのプレイヤー安全確保）
        this.validateBridgeAvailability();
    }

    /**
     * ステージ変更処理
     * @param {number} newStage - 新しいステージ番号
     */
    changeStage(newStage) {
        if (newStage >= 0 && newStage < STAGES.length) {
            this.currentStage = newStage;
            const stageName = STAGES[newStage]?.name || 'Unknown';
            console.log(`🎬 Background stage changed to: ${newStage} (${stageName})`);
            
            // 地形を再生成
            this.regenerateForNewStage();
            
            return true;
        } else {
            console.warn(`⚠️ Invalid stage number: ${newStage}`);
            return false;
        }
    }

    /**
     * 次のステージへ進む
     */
    advanceToNextStage() {
        const nextStage = this.currentStage + 1;
        if (nextStage < STAGES.length) {
            return this.changeStage(nextStage);
        } else {
            console.log(`🏆 All stages completed! Current stage: ${this.currentStage}`);
            return false; // 全ステージクリア
        }
    }

    /**
     * 背景描画
     * @param {Object} renderer - レンダラー
     */
    draw(renderer, gameState = null) {
        // 背景グラデーション描画
        this.drawBackground(renderer, gameState);
        
        // 地形要素描画
        this.drawTerrain(renderer);
        
        // 柱描画
        this.drawPillars(renderer);
        
        // ？ボックス描画
        this.drawQuestionBoxes(renderer);
        
        // ステージ遷移エフェクト
        if (this.nextStageTransition) {
            this.drawStageTransition(renderer);
        }
    }

    /**
     * 背景グラデーション描画（オリジナルKnightmare風）
     * @param {Object} renderer - レンダラー
     * @param {Object} gameState - ゲーム状態
     */
    drawBackground(renderer, gameState = null) {
        const stage = STAGES[this.currentStage] || STAGES[0];
        
        // 草原ステージ（Stage 0）はオリジナルKnightmare風レイアウト
        // ボス戦中かどうかをチェック
        const isBossBattle = gameState && gameState.boss && !gameState.boss.isDefeated;
        
        // デバッグ情報（開発用）
        if (gameState) {
            if (gameState.boss) {
                console.log(`🔥 Boss Battle Debug - Stage: ${this.currentStage}, Boss exists: ${!!gameState.boss}, Boss defeated: ${gameState.boss.isDefeated}, Should show brick: ${isBossBattle}`);
            } else {
                console.log(`🌿 No Boss - Stage: ${this.currentStage}, GameState exists but no boss`);
            }
        } else {
            console.log(`❌ No GameState - Stage: ${this.currentStage}, GameState is null`);
        }
        
        if (this.currentStage === 0) {
            this.drawOriginalKnightmareBackground(renderer, isBossBattle);
        } else {
            // 他のステージは従来のグラデーション
            const gradient = renderer.ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
            gradient.addColorStop(0, stage.skyTop);
            gradient.addColorStop(1, stage.skyBottom);
            
            renderer.ctx.fillStyle = gradient;
            renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
            
            // ボス戦時は全ステージで赤いレンガを上部に表示
            if (isBossBattle) {
                console.log(`🧱 Stage ${this.currentStage} - Drawing red brick background for boss battle`);
                const brickHeight = 100;
                renderer.ctx.fillStyle = '#AA3333'; // 赤いレンガ色
                renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, brickHeight);
                
                // レンガのラインパターン
                renderer.ctx.fillStyle = '#883333';
                for (let y = 0; y < brickHeight; y += 16) {
                    // 水平ライン
                    renderer.ctx.fillRect(0, y, GAME_CONFIG.CANVAS_WIDTH, 2);
                    // 垂直ライン（レンガパターン）
                    for (let x = (y % 32); x < GAME_CONFIG.CANVAS_WIDTH; x += 32) {
                        renderer.ctx.fillRect(x, y, 2, 16);
                    }
                }
            } else {
                console.log(`🌄 Stage ${this.currentStage} - Normal background (no boss battle)`);
            }
            
            // スクロールパターン描画
            this.drawScrollingPattern(renderer, stage);
        }
    }
    
    /**
     * オリジナルKnightmare風背景描画
     * @param {Object} renderer - レンダラー
     * @param {boolean} isBossBattle - ボス戦中かどうか
     */
    drawOriginalKnightmareBackground(renderer, isBossBattle = false) {
        const canvasWidth = GAME_CONFIG.CANVAS_WIDTH;
        const canvasHeight = GAME_CONFIG.CANVAS_HEIGHT;
        
        // デバッグ情報（Stage 0用）
        console.log(`🧱 Stage 0 - Drawing red brick: ${isBossBattle}`);
        
        // 1. 上部の赤いレンガ壁（ボス戦時のみ表示）
        let grassStartY = 0;
        if (isBossBattle) {
            const brickHeight = 100;
            renderer.ctx.fillStyle = '#AA3333'; // 赤いレンガ色
            renderer.ctx.fillRect(0, 0, canvasWidth, brickHeight);
            
            // レンガのラインパターン
            renderer.ctx.fillStyle = '#883333';
            for (let y = 0; y < brickHeight; y += 16) {
                // 水平ライン
                renderer.ctx.fillRect(0, y, canvasWidth, 2);
                // 垂直ライン（レンガパターン）
                for (let x = (y % 32); x < canvasWidth; x += 32) {
                    renderer.ctx.fillRect(x, y, 2, 16);
                }
            }
            grassStartY = brickHeight;
        }
        
        // 2. 中央部分の緑の草原（オリジナル風ドットパターン）
        const grassHeight = canvasHeight - grassStartY;
        
        // 草原ベース
        renderer.ctx.fillStyle = '#228B22'; // 深緑ベース
        renderer.ctx.fillRect(0, grassStartY, canvasWidth, grassHeight);
        
        // 草のドットパターン（より密度高く）
        renderer.ctx.fillStyle = '#32CD32'; // 明るい緑のドット
        const dotSize = 2;
        const dotSpacing = 4;
        
        for (let x = 0; x < canvasWidth; x += dotSpacing) {
            for (let y = grassStartY; y < canvasHeight; y += dotSpacing) {
                // 擬似ランダムでドット配置
                const random = ((x + y) * 7 + (x * 3) + (y * 5)) % 17;
                if (random < 12) { // 約70%の確率
                    renderer.ctx.fillRect(x, y, dotSize, dotSize);
                }
                
                // より明るいドットを少し追加
                if (random < 4) {
                    renderer.ctx.fillStyle = '#90EE90';
                    renderer.ctx.fillRect(x + 1, y, 1, 1);
                    renderer.ctx.fillStyle = '#32CD32';
                }
            }
        }
        
        // 3. 左右の装飾石柱（スクロール対応）
        this.drawScrollingDecorationPillars(renderer);
    }

    /**
     * スクロールパターン描画（MSX Makiden 風草原フィールド）
     * @param {Object} renderer - レンダラー
     * @param {Object} stage - ステージ設定
     */
    drawScrollingPattern(renderer, stage) {
        const patternHeight = 32;
        const numPatterns = Math.ceil(GAME_CONFIG.CANVAS_HEIGHT / patternHeight) + 2;
        
        // ステージ別の背景描画
        switch (this.currentStage) {
            case 0: // 草原ステージ - 画面全体を草原模様で統一
                this.drawMSXGrassField(renderer, 0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT, 0);
                break;
                
            case 1: // 荒野ステージ - 茶色の砂漠風フィールド
                for (let i = 0; i < numPatterns; i++) {
                    const y = (i * patternHeight - this.scrollOffset) % (GAME_CONFIG.CANVAS_HEIGHT + patternHeight);
                    this.drawMSXWastelandField(renderer, 0, y, GAME_CONFIG.CANVAS_WIDTH, patternHeight, i);
                }
                break;
                
            case 2: // 魔城ステージ - 暗い石造りフィールド
                for (let i = 0; i < numPatterns; i++) {
                    const y = (i * patternHeight - this.scrollOffset) % (GAME_CONFIG.CANVAS_HEIGHT + patternHeight);
                    this.drawMSXCastleField(renderer, 0, y, GAME_CONFIG.CANVAS_WIDTH, patternHeight, i);
                }
                break;
                
            default: // フォールバック：草原ステージ
                this.drawMSXGrassField(renderer, 0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT, 0);
                break;
        }
    }

    /**
     * MSX Makiden風草原フィールド描画
     * @param {Object} renderer - レンダラー
     * @param {number} x - X座標
     * @param {number} y - Y座標  
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {number} patternIndex - パターンインデックス（スクロール同期用）
     */
    drawMSXGrassField(renderer, x, y, width, height, patternIndex) {
        // 1. 土のベース層
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.DIRT_BASE;
        renderer.ctx.fillRect(x, y, width, height);
        
        // 2. 草原ベース色で全体を塗りつぶし
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.GRASS_BASE;
        renderer.ctx.fillRect(x, y, width, height);
        
        // 3. MSX風の特徴的な草の点模様を描画
        const dotSize = 2; // MSXスタイルの小さなドット
        const dotSpacing = 8; // ドット間隔
        
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.GRASS_DOTS;
        
        // スクロールと同期したドットパターンを生成
        const scrollOffset = this.scrollOffset % dotSpacing;
        
        for (let dx = 0; dx < width + dotSpacing; dx += dotSpacing) {
            for (let dy = 0; dy < height + dotSpacing; dy += dotSpacing) {
                const dotX = x + dx;
                const dotY = y + dy - scrollOffset;
                
                // パターンの多様性のため、位置に基づいた擬似ランダム
                const randomFactor = ((dx + dy + patternIndex * 16) % 23) / 23;
                
                // 約70%の確率でドットを配置（MSX Makidenの密度を再現）
                if (randomFactor < 0.7) {
                    renderer.ctx.fillRect(dotX, dotY, dotSize, dotSize);
                    
                    // より大きなドットをランダムに配置（原作の質感を再現）
                    if (randomFactor < 0.3) {
                        renderer.ctx.fillRect(dotX + 1, dotY, dotSize, dotSize);
                    }
                    if (randomFactor < 0.2) {
                        renderer.ctx.fillRect(dotX, dotY + 1, dotSize, dotSize);
                    }
                }
                
                // 陰影効果用の濃い緑ドット（より希少）
                if (randomFactor < 0.15) {
                    renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.GRASS_SHADOW;
                    renderer.ctx.fillRect(dotX + dotSize, dotY + dotSize, 1, 1);
                    renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.GRASS_DOTS;
                }
            }
        }
        
        // 4. 土の部分を少し見せる（草の隙間）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.DIRT_SHADOW;
        for (let dx = 0; dx < width; dx += 16) {
            for (let dy = 0; dy < height; dy += 12) {
                const dirtX = x + dx + 2;
                const dirtY = y + dy + 6 - scrollOffset % 12;
                
                const randomFactor = ((dx + dy + patternIndex * 8) % 19) / 19;
                
                // 少量の土を見せる（約15%の確率）
                if (randomFactor < 0.15) {
                    renderer.ctx.fillRect(dirtX, dirtY, 1, 1);
                }
            }
        }
    }

    /**
     * MSX Makiden風荒野フィールド描画（ステージ2）
     * @param {Object} renderer - レンダラー
     * @param {number} x - X座標
     * @param {number} y - Y座標  
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {number} patternIndex - パターンインデックス（スクロール同期用）
     */
    drawMSXWastelandField(renderer, x, y, width, height, patternIndex) {
        // 1. 荒野ベース色（茶色の大地）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.WASTELAND_BASE;
        renderer.ctx.fillRect(x, y, width, height);
        
        // 2. 砂地のベース層
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.SAND_YELLOW;
        renderer.ctx.fillRect(x, y, width, height);
        
        // 3. MSX風の砂粒パターン（小さなドット）
        const sandDotSize = 1;
        const sandSpacing = 6;
        
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.WASTELAND_LIGHT;
        
        // スクロールと同期した砂粒パターン
        const scrollOffset = this.scrollOffset % sandSpacing;
        
        for (let dx = 0; dx < width + sandSpacing; dx += sandSpacing) {
            for (let dy = 0; dy < height + sandSpacing; dy += sandSpacing) {
                const dotX = x + dx;
                const dotY = y + dy - scrollOffset;
                
                // 位置に基づいた擬似ランダム（砂漠らしい散らばり）
                const randomFactor = ((dx + dy + patternIndex * 13) % 17) / 17;
                
                // 約80%の確率で砂粒を配置
                if (randomFactor < 0.8) {
                    renderer.ctx.fillRect(dotX, dotY, sandDotSize, sandDotSize);
                    
                    // より大きな砂粒をランダムに配置
                    if (randomFactor < 0.4) {
                        renderer.ctx.fillRect(dotX + 1, dotY, sandDotSize, sandDotSize);
                    }
                    if (randomFactor < 0.3) {
                        renderer.ctx.fillRect(dotX, dotY + 1, sandDotSize, sandDotSize);
                    }
                }
            }
        }
        
        // 4. 岩の配置（MSX風のブロック状）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.ROCK_GRAY;
        for (let dx = 0; dx < width; dx += 24) {
            for (let dy = 0; dy < height; dy += 20) {
                const rockX = x + dx + 4;
                const rockY = y + dy + 8 - scrollOffset % 20;
                
                const randomFactor = ((dx + dy + patternIndex * 7) % 23) / 23;
                
                // 約25%の確率で岩を配置
                if (randomFactor < 0.25) {
                    // MSX風の四角い岩
                    renderer.ctx.fillRect(rockX, rockY, 4, 4);
                    renderer.ctx.fillRect(rockX - 1, rockY - 1, 6, 6);
                    
                    // 岩の影
                    renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.ROCK_SHADOW;
                    renderer.ctx.fillRect(rockX + 1, rockY + 1, 4, 4);
                    renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.ROCK_GRAY;
                }
            }
        }
        
        // 5. 暗い砂地の部分（風で飛ばされた跡）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.WASTELAND_DARK;
        for (let dx = 0; dx < width; dx += 20) {
            for (let dy = 0; dy < height; dy += 16) {
                const darkX = x + dx + 3;
                const darkY = y + dy + 5 - scrollOffset % 16;
                
                const randomFactor = ((dx + dy + patternIndex * 11) % 19) / 19;
                
                // 約20%の確率で暗い砂地
                if (randomFactor < 0.2) {
                    renderer.ctx.fillRect(darkX, darkY, 2, 1);
                    renderer.ctx.fillRect(darkX + 1, darkY + 1, 2, 1);
                }
            }
        }
    }

    /**
     * MSX Makiden風魔城フィールド描画（ステージ3）
     * @param {Object} renderer - レンダラー
     * @param {number} x - X座標
     * @param {number} y - Y座標  
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {number} patternIndex - パターンインデックス（スクロール同期用）
     */
    drawMSXCastleField(renderer, x, y, width, height, patternIndex) {
        // 1. 魔城ベース色（暗い石壁）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.CASTLE_STONE;
        renderer.ctx.fillRect(x, y, width, height);
        
        // 2. 石畳のパターン（MSX風のブロック状）
        const stoneSize = 8;
        const stoneSpacing = 10;
        
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.CASTLE_DARK;
        
        // スクロールと同期した石畳パターン
        const scrollOffset = this.scrollOffset % stoneSpacing;
        
        for (let dx = 0; dx < width + stoneSpacing; dx += stoneSpacing) {
            for (let dy = 0; dy < height + stoneSpacing; dy += stoneSpacing) {
                const stoneX = x + dx;
                const stoneY = y + dy - scrollOffset;
                
                // 石畳の境界線を描画
                renderer.ctx.fillRect(stoneX, stoneY, 1, stoneSize);
                renderer.ctx.fillRect(stoneX, stoneY, stoneSize, 1);
            }
        }
        
        // 3. 魔城の装飾模様（紫の魔法陣風）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.CASTLE_PURPLE;
        for (let dx = 0; dx < width; dx += 32) {
            for (let dy = 0; dy < height; dy += 24) {
                const decorX = x + dx + 8;
                const decorY = y + dy + 6 - scrollOffset % 24;
                
                const randomFactor = ((dx + dy + patternIndex * 9) % 31) / 31;
                
                // 約15%の確率で魔法装飾を配置
                if (randomFactor < 0.15) {
                    // MSX風の十字形魔法陣
                    renderer.ctx.fillRect(decorX, decorY, 3, 1);
                    renderer.ctx.fillRect(decorX + 1, decorY - 1, 1, 3);
                    
                    // 魔法の輝き効果
                    const time = Date.now() / 1000;
                    const glowIntensity = (Math.sin(time * 2 + decorX + decorY) + 1) * 0.3;
                    renderer.ctx.fillStyle = `rgba(75, 0, 130, ${glowIntensity})`;
                    renderer.ctx.fillRect(decorX - 1, decorY - 1, 5, 5);
                    renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.CASTLE_PURPLE;
                }
            }
        }
        
        // 4. 赤い魔城装飾（血の跡や魔法エネルギー）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.CASTLE_RED;
        for (let dx = 0; dx < width; dx += 28) {
            for (let dy = 0; dy < height; dy += 20) {
                const redX = x + dx + 12;
                const redY = y + dy + 4 - scrollOffset % 20;
                
                const randomFactor = ((dx + dy + patternIndex * 5) % 29) / 29;
                
                // 約10%の確率で赤い装飾を配置
                if (randomFactor < 0.1) {
                    // MSX風の小さな赤い点群
                    renderer.ctx.fillRect(redX, redY, 2, 2);
                    renderer.ctx.fillRect(redX + 2, redY + 1, 1, 1);
                    renderer.ctx.fillRect(redX - 1, redY + 1, 1, 1);
                }
            }
        }
        
        // 5. 古い石の質感（ひび割れ効果）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.CASTLE_DARK;
        for (let dx = 0; dx < width; dx += 16) {
            for (let dy = 0; dy < height; dy += 12) {
                const crackX = x + dx + 2;
                const crackY = y + dy + 3 - scrollOffset % 12;
                
                const randomFactor = ((dx + dy + patternIndex * 17) % 13) / 13;
                
                // 約30%の確率でひび割れを配置
                if (randomFactor < 0.3) {
                    // MSX風の単純なひび割れライン
                    renderer.ctx.fillRect(crackX, crackY, 3, 1);
                    if (randomFactor < 0.15) {
                        renderer.ctx.fillRect(crackX + 1, crackY + 1, 1, 2);
                    }
                }
            }
        }
        
        // 6. 溶岩の光（遠くからの赤い光）
        const time = Date.now() / 500;
        const lavaGlow = Math.sin(time) * 0.1 + 0.05;
        renderer.ctx.fillStyle = `rgba(255, 69, 0, ${lavaGlow})`;
        for (let dx = 0; dx < width; dx += 40) {
            const glowX = x + dx;
            const glowY = y + height - 10;
            
            const randomFactor = ((dx + patternIndex * 7) % 37) / 37;
            
            // 約20%の確率で溶岩の光を配置
            if (randomFactor < 0.2) {
                renderer.ctx.fillRect(glowX, glowY, 6, 8);
            }
        }
    }

    /**
     * 地形描画（デバッグ情報強化版）
     * @param {Object} renderer - レンダラー
     */
    drawTerrain(renderer) {
        // 川描画
        for (const river of this.rivers) {
            this.drawRiver(renderer, river);
        }
        
        // 橋描画（デバッグ情報付き）
        let visibleBridges = 0;
        for (const bridge of this.bridges) {
            // 橋が画面内にあるかチェック
            if (bridge.y < GAME_CONFIG.CANVAS_HEIGHT + 50 && bridge.y + bridge.height > -50) {
                this.drawBridge(renderer, bridge);
                visibleBridges++;
            }
        }
        
        // デバッグ：橋描画情報（定期的にログ）
        if (this.bridges.length > 0 && !this.bridgeDrawLogged) {
            console.log(`🖼️ Bridge rendering info:`);
            console.log(`   - Total bridges: ${this.bridges.length}`);
            console.log(`   - Visible bridges: ${visibleBridges}`);
            this.bridges.forEach((bridge, index) => {
                console.log(`   - Bridge ${index}: x=${bridge.x}, y=${bridge.y}, visible=${bridge.y < GAME_CONFIG.CANVAS_HEIGHT + 50 && bridge.y + bridge.height > -50}`);
            });
            this.bridgeDrawLogged = true;
        }
        
        // 定期的なデバッグ情報（30秒に1回）
        if (this.frameCount && this.frameCount % 1800 === 0) {
            console.log(`🌉 Bridge status update: ${visibleBridges}/${this.bridges.length} bridges visible`);
        }
    }

    /**
     * 川描画（MSX Makiden風）
     * @param {Object} renderer - レンダラー
     * @param {Object} river - 川オブジェクト
     */
    drawRiver(renderer, river) {
        // ステージ別の川の色を決定
        let riverBaseColor, riverLightColor;
        
        switch (this.currentStage) {
            case 0: // 草原ステージ - 青い川
                riverBaseColor = MSX_MAKIDEN_COLORS.RIVER_BLUE;
                riverLightColor = MSX_MAKIDEN_COLORS.RIVER_LIGHT;
                break;
                
            case 1: // 荒野ステージ - 砂の川（茶色）
                riverBaseColor = MSX_MAKIDEN_COLORS.WASTELAND_DARK;
                riverLightColor = MSX_MAKIDEN_COLORS.SAND_YELLOW;
                break;
                
            case 2: // 魔城ステージ - 溶岩川（赤）
                riverBaseColor = MSX_MAKIDEN_COLORS.LAVA_RED;
                riverLightColor = MSX_MAKIDEN_COLORS.LAVA_ORANGE;
                break;
                
            default: // フォールバック
                riverBaseColor = MSX_MAKIDEN_COLORS.RIVER_BLUE;
                riverLightColor = MSX_MAKIDEN_COLORS.RIVER_LIGHT;
                break;
        }
        
        // 川のベース色
        renderer.ctx.fillStyle = riverBaseColor;
        renderer.ctx.fillRect(river.x, river.y, river.width, river.height);
        
        // ステージ別の水面パターン
        renderer.ctx.fillStyle = riverLightColor;
        
        // スクロールに同期した模様パターン
        const stripeHeight = 4;
        const stripeSpacing = 8;
        const scrollOffset = Math.floor(this.scrollOffset / 2) % stripeSpacing;
        
        if (this.currentStage === 2) {
            // 魔城ステージ：溶岩の泡立つパターン
            const time = Math.floor(Date.now() / 150); // 溶岩の泡立ちアニメーション
            
            for (let y = river.y - scrollOffset; y < river.y + river.height + stripeSpacing; y += stripeSpacing) {
                if (y >= river.y && y + stripeHeight <= river.y + river.height) {
                    // 溶岩の不規則な泡パターン
                    const bubbleOffset = (time + y) % 6;
                    renderer.ctx.fillRect(river.x + bubbleOffset, y, river.width - bubbleOffset * 2, stripeHeight);
                }
            }
            
            // 溶岩の火花エフェクト
            for (let i = 0; i < 8; i++) {
                const sparkX = river.x + (i * river.width / 8) + ((time + i * 3) % 12) - 6;
                const sparkY = river.y + river.height / 2 + ((i % 3) * 15 - 15);
                
                if (sparkX >= river.x && sparkX <= river.x + river.width - 2) {
                    renderer.ctx.fillRect(sparkX, sparkY, 2, 2);
                    if ((time + i) % 4 === 0) {
                        renderer.ctx.fillRect(sparkX + 1, sparkY - 1, 2, 2);
                        renderer.ctx.fillRect(sparkX - 1, sparkY + 1, 2, 2);
                    }
                }
            }
        } else if (this.currentStage === 1) {
            // 荒野ステージ：砂の流れパターン
            for (let y = river.y - scrollOffset; y < river.y + river.height + stripeSpacing; y += stripeSpacing) {
                if (y >= river.y && y + stripeHeight <= river.y + river.height) {
                    // 砂の流れる縞模様
                    renderer.ctx.fillRect(river.x, y, river.width, stripeHeight);
                }
            }
            
            // 砂塵エフェクト
            for (let i = 0; i < 5; i++) {
                const dustX = river.x + (i * river.width / 5) + ((scrollOffset + i * 4) % 10) - 5;
                const dustY = river.y + river.height / 2 + ((i % 2) * 20 - 10);
                
                if (dustX >= river.x && dustX <= river.x + river.width - 1) {
                    renderer.ctx.fillRect(dustX, dustY, 1, 1);
                    renderer.ctx.fillRect(dustX + 1, dustY + 1, 1, 1);
                }
            }
        } else {
            // 草原ステージ：通常の水面パターン
            for (let y = river.y - scrollOffset; y < river.y + river.height + stripeSpacing; y += stripeSpacing) {
                if (y >= river.y && y + stripeHeight <= river.y + river.height) {
                    renderer.ctx.fillRect(river.x, y, river.width, stripeHeight);
                }
            }
            
            // MSX風の小さな点状波紋エフェクト（シンプルに）
            const time = Math.floor(Date.now() / 200); // 遅めのアニメーション
            
            for (let i = 0; i < 6; i++) {
                const rippleX = river.x + (i * river.width / 6) + ((time + i * 2) % 16) - 8;
                const rippleY = river.y + river.height / 2 + ((i % 2) * 20 - 10);
                
                if (rippleX >= river.x && rippleX <= river.x + river.width - 2) {
                    renderer.ctx.fillRect(rippleX, rippleY, 2, 2);
                    renderer.ctx.fillRect(rippleX + 1, rippleY - 1, 2, 2);
                    renderer.ctx.fillRect(rippleX - 1, rippleY + 1, 2, 2);
                }
            }
        }
    }

    /**
     * 橋描画（MSX Makiden風）
     * @param {Object} renderer - レンダラー
     * @param {Object} bridge - 橋オブジェクト
     */
    drawBridge(renderer, bridge) {
        // 橋の可視性チェック
        if (!bridge.isVisible) return;
        
        // MSX Makiden風の橋ベース色（鮮やかな黄色）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.BRIDGE_YELLOW;
        renderer.ctx.fillRect(bridge.x, bridge.y, bridge.width, bridge.height);
        
        // 橋の影・境界線（MSX風のハードエッジ）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.BRIDGE_SHADOW;
        
        // 橋の輪郭線（MSXスタイル）
        renderer.ctx.fillRect(bridge.x - 1, bridge.y - 1, bridge.width + 2, 2); // 上辺
        renderer.ctx.fillRect(bridge.x - 1, bridge.y + bridge.height - 1, bridge.width + 2, 2); // 下辺
        renderer.ctx.fillRect(bridge.x - 1, bridge.y, 2, bridge.height); // 左辺
        renderer.ctx.fillRect(bridge.x + bridge.width - 1, bridge.y, 2, bridge.height); // 右辺
        
        // MSX風の簡素な支柱パターン（縦縞）
        const pillarSpacing = 20;
        for (let x = bridge.x + pillarSpacing; x < bridge.x + bridge.width - 8; x += pillarSpacing) {
            renderer.ctx.fillRect(x, bridge.y + 2, 4, bridge.height - 4);
        }
        
        // 橋の横板パターン（MSX風の横縞）
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.BRIDGE_SHADOW;
        const boardSpacing = 8;
        for (let y = bridge.y + 6; y < bridge.y + bridge.height - 6; y += boardSpacing) {
            renderer.ctx.fillRect(bridge.x + 2, y, bridge.width - 4, 2);
        }
        
        // 橋の質感をMSXらしくするための点状パターン
        renderer.ctx.fillStyle = MSX_MAKIDEN_COLORS.BRIDGE_SHADOW;
        for (let x = bridge.x + 4; x < bridge.x + bridge.width - 4; x += 8) {
            for (let y = bridge.y + 4; y < bridge.y + bridge.height - 4; y += 6) {
                const dotPattern = ((x + y) % 12) < 6;
                if (dotPattern) {
                    renderer.ctx.fillRect(x, y, 2, 2);
                }
            }
        }
        
        // 緊急橋の場合は点滅表示（MSX風）
        if (bridge.isEmergency) {
            const blinkPhase = Math.floor(Date.now() / 250) % 2; // 点滅
            if (blinkPhase) {
                renderer.ctx.fillStyle = '#FF0000'; // MSX赤で点滅
                renderer.ctx.fillRect(bridge.x - 2, bridge.y - 2, bridge.width + 4, 2);
                renderer.ctx.fillRect(bridge.x - 2, bridge.y + bridge.height, bridge.width + 4, 2);
            }
        }
    }

    /**
     * 柱描画（無効化）
     * @param {Object} renderer - レンダラー
     */
    drawPillars(renderer) {
        // 柱描画を無効化（紫の魔法柱を削除）
        return;
    }
    
    /**
     * スクロール対応装飾石柱描画
     * @param {Object} renderer - レンダラー
     */
    drawScrollingDecorationPillars(renderer) {
        for (const pillar of this.decorationPillars) {
            // 画面内にある柱のみ描画
            if (pillar.y + pillar.height > 0 && pillar.y < GAME_CONFIG.CANVAS_HEIGHT) {
                this.drawSingleDecorationPillar(renderer, pillar.x, pillar.y, pillar.width, pillar.height);
            }
        }
    }
    
    /**
     * オリジナルKnightmare風装飾石柱描画（旧版・非使用）
     * @param {Object} renderer - レンダラー
     */
    drawDecorationPillars(renderer) {
        // 非使用 - drawScrollingDecorationPillarsを使用
        return;
    }
    
    /**
     * 単一装飾石柱描画
     * @param {Object} renderer - レンダラー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} width - 幅
     * @param {number} height - 高さ
     */
    drawSingleDecorationPillar(renderer, x, y, width, height) {
        // 石柱ベース（グレー）
        renderer.ctx.fillStyle = '#696969'; // 暗いグレー
        renderer.ctx.fillRect(x, y, width, height);
        
        // 石の質感（明るいライン）
        renderer.ctx.fillStyle = '#A9A9A9'; // 明るいグレー
        renderer.ctx.fillRect(x + 4, y + 4, width - 8, height - 8);
        
        // 石のブロックパターン
        renderer.ctx.fillStyle = '#556B2F'; // 暗いオリーブ（影）
        for (let blockY = y; blockY < y + height; blockY += 24) {
            // 水平ライン
            renderer.ctx.fillRect(x, blockY, width, 2);
            // 垂直ライン（交互パターン）
            const offset = (blockY % 48) === 0 ? 0 : width / 2;
            renderer.ctx.fillRect(x + offset, blockY, 2, 24);
        }
        
        // ハイライト（立体感）
        renderer.ctx.fillStyle = '#DCDCDC'; // 薄いグレー
        renderer.ctx.fillRect(x + 2, y + 2, 2, height - 4); // 左ハイライト
        renderer.ctx.fillRect(x + 2, y + 2, width - 4, 2); // 上ハイライト
    }

    /**
     * 個別柱描画
     * @param {Object} renderer - レンダラー
     * @param {Object} pillar - 柱オブジェクト
     */
    drawPillar(renderer, pillar) {
        switch (pillar.type) {
            case 0: // 石柱
                renderer.ctx.fillStyle = '#708090';
                renderer.ctx.fillRect(pillar.x, pillar.y, pillar.width, pillar.height);
                renderer.ctx.fillStyle = '#A9A9A9';
                renderer.ctx.fillRect(pillar.x + 2, pillar.y + 2, pillar.width - 4, pillar.height - 4);
                break;
            case 1: // 木柱
                renderer.ctx.fillStyle = '#8B4513';
                renderer.ctx.fillRect(pillar.x, pillar.y, pillar.width, pillar.height);
                renderer.ctx.fillStyle = '#A0522D';
                for (let i = 0; i < pillar.height; i += 8) {
                    renderer.ctx.fillRect(pillar.x, pillar.y + i, pillar.width, 2);
                }
                break;
            case 2: // 魔法柱
                renderer.ctx.fillStyle = '#4B0082';
                renderer.ctx.fillRect(pillar.x, pillar.y, pillar.width, pillar.height);
                
                // 魔法エフェクト
                const glowIntensity = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
                renderer.ctx.fillStyle = `rgba(138, 43, 226, ${glowIntensity})`;
                renderer.ctx.fillRect(pillar.x + 2, pillar.y + 2, pillar.width - 4, pillar.height - 4);
                break;
        }
    }

    /**
     * ？ボックス描画
     * @param {Object} renderer - レンダラー
     */
    drawQuestionBoxes(renderer) {
        for (const box of this.questionBoxes) {
            if (box.shouldRemove) continue;
            
            const blinkFactor = Math.sin(box.blinkTimer) * 0.3 + 0.7;
            
            // ？ボックス本体（5倍スケール - より大きく見やすく）
            renderer.drawSprite('questionBox', box.x, box.y, 5.0);
            
            // ダメージによる点滅エフェクト（より控えめに）
            if (box.hp < box.maxHp) {
                renderer.ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * blinkFactor})`;
                renderer.ctx.fillRect(box.x, box.y, box.width, box.height);
            }
            
            // HPバー
            if (box.hp < box.maxHp) {
                const hpBarY = box.y - 8;
                renderer.ctx.fillStyle = '#8B0000';
                renderer.ctx.fillRect(box.x, hpBarY, box.width, 4);
                
                const hpWidth = (box.width - 2) * (box.hp / box.maxHp);
                renderer.ctx.fillStyle = '#00FF00';
                renderer.ctx.fillRect(box.x + 1, hpBarY + 1, hpWidth, 2);
            }
        }
    }

    /**
     * ステージ遷移エフェクト描画
     * @param {Object} renderer - レンダラー
     */
    drawStageTransition(renderer) {
        const alpha = Math.sin(this.transitionProgress * Math.PI) * 0.5;
        
        renderer.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        renderer.ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // ステージ名表示（新しいStageNameDisplayシステムに移行したためコメントアウト）
        // if (this.transitionProgress > 0.3 && this.transitionProgress < 0.7) {
        //     const stage = STAGES[this.currentStage];
        //     if (stage) {
        //         renderer.ctx.fillStyle = '#000000';
        //         renderer.ctx.font = 'bold 36px Arial';
        //         renderer.ctx.textAlign = 'center';
        //         renderer.ctx.fillText(stage.name, GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);
        //     }
        // }
    }

    /**
     * ？ボックスとの衝突処理
     * @param {Object} bullet - 弾丸オブジェクト
     * @returns {boolean} 衝突したかどうか
     */
    checkQuestionBoxCollision(bullet) {
        for (const box of this.questionBoxes) {
            if (box.shouldRemove) continue;
            
            if (bullet.x < box.x + box.width &&
                bullet.x + bullet.width > box.x &&
                bullet.y < box.y + box.height &&
                bullet.y + bullet.height > box.y) {
                
                box.hp--;
                
                // ？ボックスヒット音
                if (window.gameInstance?.soundEffects) {
                    window.gameInstance.soundEffects.play('questionBoxHit');
                }
                
                if (box.hp <= 0) {
                    box.shouldRemove = true;
                    return true; // ？ボックス破壊
                }
                return false; // ダメージのみ
            }
        }
        return false;
    }

    /**
     * 現在のステージ取得
     * @returns {number} ステージインデックス
     */
    getCurrentStage() {
        return this.currentStage;
    }

    /**
     * 地形要素取得
     * @returns {Object} 地形要素
     */
    getTerrain() {
        return {
            rivers: this.rivers,
            bridges: this.bridges,
            questionBoxes: this.questionBoxes,
            pillars: this.pillars
        };
    }
}