// ゲーム設定定数
export const GAME_CONFIG = {
    // 画面設定
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // プレイヤー設定
    PLAYER: {
        WIDTH: 36,
        HEIGHT: 36,
        SPEED: 2.0, // 2.5 -> 2.0 (より歩いている感を出すため速度を下げる)
        SPEED_MULTIPLIER_HIGH: 2.5, // 高速モード時の倍率
        INITIAL_HP: 100, // HPを増量（60→100）でより優しく
        INITIAL_X: 400, // canvas.width / 2
        INITIAL_Y: 500, // canvas.height - 100
        SHOOT_COOLDOWN: 0
    },
    
    // ゲームプレイ設定
    GAMEPLAY: {
        SCROLL_SPEED: 0.2, // 元の速度に戻す
        ENEMY_SPAWN_RATE: 0.008,
        POWER_UP_SPAWN_RATE: 0.005,
        BOSS_SPAWN_DISTANCE: 1000, // テスト用に短縮 (1000 / 0.1 = 166秒)
        CONTINUE_LIMIT: 5,
        CONTINUE_TIME: 600, // 10秒 (60fps * 10)
        SPEED_MODE_DURATION: 300, // 5秒 (60fps * 5)
        LASER_AMMO_INITIAL: 10
    },
    
    // 音楽設定
    MUSIC: {
        BPM_NORMAL: 120,
        BPM_BOSS: 160,
        BPM_VICTORY: 160,
        START_MUSIC_DURATION: 480 // 8秒 (60fps * 8)
    },
    
    // エフェクト設定
    EFFECTS: {
        BOSS_WARNING_DURATION: 3000, // 3秒
        STAGE_INFO_DURATION: 3000, // 3秒
        PARTICLE_LIFE: 30
    }
};

// 武器名配列
export const WEAPON_NAMES = {
    1: "通常弾",
    2: "2連弾", 
    3: "デラックス3WAY弾",
    4: "デラックス5WAY弾",
    5: "デラックスサークル弾",
    6: "一撃必殺レーザー",
    7: "炎弾",
    8: "雷撃弾",
    9: "ファイヤーボール"
};

// ステージ配列（オリジナル魔城伝説デザイン準拠）
export const STAGES = [
    { name: "草原", skyTop: "#87CEEB", skyBottom: "#32CD32" }, // ステージ1: 緑の草原フィールド
    { name: "荒野", skyTop: "#DAA520", skyBottom: "#8B4513" }, // ステージ2: 茶色の荒野フィールド  
    { name: "魔城", skyTop: "#2F2F2F", skyBottom: "#8B0000" }  // ステージ3: 暗い魔城フィールド
];

// カラーパレット（ドット絵スプライト用）
export const COLORS = {
    0: '#000000', // 黒
    1: '#333333', // 濃いグレー（コウモリの体）
    2: '#00AAFF', // MSX風シアンブルー鎧（ポポロンのメイン）
    3: '#FF0000', // 赤（目、高速モード）
    4: '#8B4513', // 茶色（ポポロンの髪・革）
    5: '#FFE4C4', // 肌色
    6: '#FFD700', // 金色（？ボックス外枠）
    7: '#FFA500', // オレンジ（？ボックス内側）
    8: '#696969', // ダークグレー（？ボックス外枠）
    9: '#228B22', // 緑（メデューサの髪・蛇）
    10: '#DC143C', // 深紅（メデューサの服）
    11: '#0088FF', // MSXブルー（鎧のベース色）
    12: '#C0C0C0', // ライトグレー（？ボックス内側）
    13: '#808080', // グレー（？ボックス影）
    14: '#00CCFF', // MSX明るいシアン（鎧のハイライト）
    15: '#FF6B6B', // 明るい赤（高速モード鎧装飾）
    16: '#FF1493', // 深いピンク（高速モード鎧中央）
    17: '#D2691E', // ブロンズ（ヘルメットの角）
    18: '#C0C0C0', // シルバー（ヘルメット装飾）
    19: '#FFD700', // ゴールド（鎧の装飾）
    20: '#FFA500'  // オレンジゴールド（高速モード装飾）
};

// MSX Makiden 専用カラーパレット（各ステージ用）
export const MSX_MAKIDEN_COLORS = {
    // ステージ1: 草原フィールド
    GRASS_BASE: '#00AA00',      // MSX緑 - 草原ベース色（明るい緑）
    GRASS_DOTS: '#008800',      // MSX濃緑 - 草の点模様（少し濃い緑）
    GRASS_SHADOW: '#006600',    // MSX深緑 - 草の影部分（深い緑）
    DIRT_BASE: '#AA5500',       // MSX茶 - 土ベース色
    DIRT_SHADOW: '#885500',     // MSX濃茶 - 土の影
    RIVER_BLUE: '#0000AA',      // MSX青 - 川の色（深い青）
    RIVER_LIGHT: '#5555FF',     // MSX明青 - 川の明るい部分
    BRIDGE_YELLOW: '#FFFF00',   // MSX黄 - 橋の色（鮮やかな黄色）
    BRIDGE_SHADOW: '#AAAA00',   // MSX濃黄 - 橋の影部分
    
    // ステージ2: 荒野フィールド
    WASTELAND_BASE: '#8B4513',   // MSX茶 - 荒野ベース色（茶色の大地）
    WASTELAND_DARK: '#654321',   // MSX濃茶 - 荒野の暗い部分
    WASTELAND_LIGHT: '#DAA520',  // MSX明茶 - 荒野の明るい部分（砂色）
    ROCK_GRAY: '#696969',        // MSX灰 - 岩の色
    ROCK_SHADOW: '#2F2F2F',      // MSX黒灰 - 岩の影
    SAND_YELLOW: '#F4A460',      // MSX砂色 - 砂地の色
    
    // ステージ3: 魔城フィールド
    CASTLE_STONE: '#2F2F2F',     // MSX暗灰 - 魔城の石壁
    CASTLE_DARK: '#000000',      // MSX黒 - 魔城の暗部
    CASTLE_RED: '#8B0000',       // MSX濃赤 - 魔城の赤い部分
    CASTLE_PURPLE: '#4B0082',    // MSX紫 - 魔城の紫装飾
    LAVA_RED: '#FF4500',         // MSX赤 - 溶岩の色
    LAVA_ORANGE: '#FF8C00'       // MSX橙 - 溶岩の明るい部分
};

// ボス設定（HP大幅強化）
export const BOSS_CONFIG = {
    TYPES: [
        {
            name: 'ビタミンデーモン',
            width: 180,
            height: 180,
            hp: 2000, // Stage 1 boss - 適度な難易度に調整
            bulletDamage: 15, // ダメージも少し下げる
            color: '#228B22',
            secondaryColor: '#DC143C',
            accentColor: '#9932CC',
            glowColor: '#FF00FF',
            spriteScale: 11.25 // 180px / 16px = 11.25
        },
        {
            name: 'ミネラルデーモン',
            width: 225,
            height: 225,
            hp: 8000, // Stage 2 boss - 適度な難易度
            bulletDamage: 25, // バランス調整
            color: '#9370DB', // 紫色（メインカラー）
            secondaryColor: '#DC143C', // 赤色（角・翼）
            accentColor: '#4169E1', // 青色（MINERALボール）
            glowColor: '#FF69B4', // ピンクの光
            spriteScale: 14.0625 // 225px / 16px = 14.0625
        },
        {
            name: '氷結の魔王',
            width: 270,
            height: 270,
            hp: 20000, // Stage 3 boss - 300% increase for final boss difficulty
            bulletDamage: 45, // Tripled damage for ultimate challenge
            color: '#191970',
            secondaryColor: '#4169E1',
            accentColor: '#87CEEB',
            glowColor: '#00BFFF',
            spriteScale: 16.875 // 270px / 16px = 16.875
        }
    ]
};

// 敵設定
export const ENEMY_CONFIG = {
    BAT: {
        width: 43,
        height: 43,
        hp: 20,
        speed: 1.2, // 2.5 → 1.2 (さらに52%減)
        color: '#333333'
    },
    SINE_FLYER: {
        width: 43,
        height: 43,
        hp: 60,
        speed: 1.1, // 2.2 → 1.1 (50%減)
        color: '#4B0082'
    },
    GROUND_WALKER: {
        width: 43,
        height: 43,
        hp: 50,
        speed: 0.7, // 1.4 → 0.7 (50%減)
        color: '#8B4513'
    },
    SWORD_THROWER: {
        width: 50,
        height: 50,
        hp: 80,
        speed: 0.5, // 1.0 → 0.5 (50%減)
        color: '#4169E1'
    },
    BOMB_WALKER: {
        width: 45,
        height: 45,
        hp: 80,
        speed: 0.4, // 0.8 → 0.4 (50%減)
        color: '#8B0000',
        contactDamage: 40
    }
};

// 弾丸設定
export const BULLET_CONFIG = {
    NORMAL: { width: 8, height: 16, speed: 12, damage: 25, color: '#ffffff' },
    LASER: { width: 20, damage: 9999, color: '#00ffff', life: 45 }, // レーザー幅を40→20に縮小（精密狙撃用）
    FLAME: { width: 12, height: 12, speed: 10, damage: 40, color: '#ff4400', life: 45 }, // スピードを8→10、ライフタイムを基本値でも延長
    THUNDER: { width: 12, height: 24, speed: 15, damage: 60, color: '#ffff00' },
    FIREBALL: { width: 24, height: 24, speed: 10, damage: 100, color: '#FF4500', life: 60 },
    
    // Enhanced weapon configurations for visual improvements
    DELUXE_3WAY: { 
        width: 12, height: 20, speed: 12, damage: 25, 
        color: '#00ffff', glowColor: '#ffffff',
        trailLength: 8, rotationSpeed: 3,
        glowRadius: 8, trailAlpha: 0.7
    },
    DELUXE_5WAY: { 
        width: 14, height: 22, speed: 12, damage: 25, 
        color: '#ff00ff', glowColor: '#ff66ff',
        trailLength: 10, rotationSpeed: 4,
        glowRadius: 10, trailAlpha: 0.8,
        sparkleCount: 3, wobbleAmplitude: 1.5
    },
    DELUXE_CIRCLE: { 
        width: 16, height: 24, speed: 15, damage: 25, 
        color: '#ff8c00', secondaryColor: '#ff4500',
        trailLength: 12, rotationSpeed: 6,
        glowRadius: 12, trailAlpha: 0.9,
        fireParticleCount: 4, pulsePeriod: 20
    }
};