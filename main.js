#!/usr/bin/env node

/**
 * Nutrition Daemon - 栄養管理アプリケーション
 * 
 * このアプリケーションは、ユーザーの栄養摂取を追跡・管理するための
 * コマンドラインアプリケーションです。
 */

const readline = require('readline');

class NutritionTracker {
    constructor() {
        this.foods = [];
        this.nutritionGoals = {
            calories: 2000,
            protein: 50,
            carbs: 250,
            fat: 65,
            fiber: 25
        };
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    /**
     * アプリケーションを開始
     */
    start() {
        console.log('🍎 Nutrition Daemon を開始しました！');
        console.log('栄養管理を始めましょう。\n');
        this.showMainMenu();
    }

    /**
     * メインメニューを表示
     */
    showMainMenu() {
        console.log('\n=== メインメニュー ===');
        console.log('1. 食事を記録');
        console.log('2. 今日の栄養摂取を確認');
        console.log('3. 栄養目標を設定');
        console.log('4. 食事履歴を表示');
        console.log('5. 終了');
        console.log('=====================');
        
        this.rl.question('選択してください (1-5): ', (answer) => {
            switch(answer.trim()) {
                case '1':
                    this.recordFood();
                    break;
                case '2':
                    this.showTodayNutrition();
                    break;
                case '3':
                    this.setNutritionGoals();
                    break;
                case '4':
                    this.showFoodHistory();
                    break;
                case '5':
                    this.exit();
                    break;
                default:
                    console.log('❌ 無効な選択です。1-5の数字を入力してください。');
                    this.showMainMenu();
            }
        });
    }

    /**
     * 食事を記録
     */
    recordFood() {
        console.log('\n=== 食事記録 ===');
        this.rl.question('食品名を入力してください: ', (foodName) => {
            if (!foodName.trim()) {
                console.log('❌ 食品名を入力してください。');
                this.showMainMenu();
                return;
            }

            this.rl.question('カロリーを入力してください: ', (calories) => {
                const cal = parseFloat(calories);
                if (isNaN(cal) || cal < 0) {
                    console.log('❌ 有効なカロリー値を入力してください。');
                    this.showMainMenu();
                    return;
                }

                this.rl.question('タンパク質 (g): ', (protein) => {
                    const prot = parseFloat(protein) || 0;
                    this.rl.question('炭水化物 (g): ', (carbs) => {
                        const carb = parseFloat(carbs) || 0;
                        this.rl.question('脂質 (g): ', (fat) => {
                            const f = parseFloat(fat) || 0;
                            this.rl.question('食物繊維 (g): ', (fiber) => {
                                const fib = parseFloat(fiber) || 0;

                                const food = {
                                    name: foodName.trim(),
                                    calories: cal,
                                    protein: prot,
                                    carbs: carb,
                                    fat: f,
                                    fiber: fib,
                                    timestamp: new Date()
                                };

                                this.foods.push(food);
                                console.log(`✅ ${foodName} を記録しました！`);
                                this.showMainMenu();
                            });
                        });
                    });
                });
            });
        });
    }

    /**
     * 今日の栄養摂取を確認
     */
    showTodayNutrition() {
        console.log('\n=== 今日の栄養摂取 ===');
        
        const today = new Date();
        const todayFoods = this.foods.filter(food => 
            food.timestamp.toDateString() === today.toDateString()
        );

        if (todayFoods.length === 0) {
            console.log('今日はまだ食事を記録していません。');
            this.showMainMenu();
            return;
        }

        const total = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
        };

        todayFoods.forEach(food => {
            total.calories += food.calories;
            total.protein += food.protein;
            total.carbs += food.carbs;
            total.fat += food.fat;
            total.fiber += food.fiber;
        });

        console.log(`📊 総カロリー: ${total.calories} kcal`);
        console.log(`🥩 タンパク質: ${total.protein}g / ${this.nutritionGoals.protein}g`);
        console.log(`🍞 炭水化物: ${total.carbs}g / ${this.nutritionGoals.carbs}g`);
        console.log(`🧈 脂質: ${total.fat}g / ${this.nutritionGoals.fat}g`);
        console.log(`🌾 食物繊維: ${total.fiber}g / ${this.nutritionGoals.fiber}g`);

        // 目標達成率を計算
        const calorieProgress = (total.calories / this.nutritionGoals.calories * 100).toFixed(1);
        console.log(`\n🎯 カロリー目標達成率: ${calorieProgress}%`);

        if (total.calories > this.nutritionGoals.calories) {
            console.log('⚠️  カロリーオーバーです。運動を増やすか、食事量を調整しましょう。');
        } else if (total.calories < this.nutritionGoals.calories * 0.8) {
            console.log('⚠️  カロリーが不足しています。適切な食事を心がけましょう。');
        } else {
            console.log('✅ バランスの取れた食事です！');
        }

        this.showMainMenu();
    }

    /**
     * 栄養目標を設定
     */
    setNutritionGoals() {
        console.log('\n=== 栄養目標設定 ===');
        console.log('現在の目標:');
        console.log(`カロリー: ${this.nutritionGoals.calories} kcal`);
        console.log(`タンパク質: ${this.nutritionGoals.protein}g`);
        console.log(`炭水化物: ${this.nutritionGoals.carbs}g`);
        console.log(`脂質: ${this.nutritionGoals.fat}g`);
        console.log(`食物繊維: ${this.nutritionGoals.fiber}g`);

        this.rl.question('\n新しいカロリー目標を設定しますか？ (y/n): ', (answer) => {
            if (answer.toLowerCase() === 'y') {
                this.rl.question('新しいカロリー目標 (kcal): ', (calories) => {
                    const cal = parseInt(calories);
                    if (isNaN(cal) || cal < 1000 || cal > 5000) {
                        console.log('❌ 1000-5000の範囲で入力してください。');
                        this.setNutritionGoals();
                        return;
                    }

                    this.nutritionGoals.calories = cal;
                    console.log(`✅ カロリー目標を ${cal} kcal に設定しました。`);
                    this.showMainMenu();
                });
            } else {
                this.showMainMenu();
            }
        });
    }

    /**
     * 食事履歴を表示
     */
    showFoodHistory() {
        console.log('\n=== 食事履歴 ===');
        
        if (this.foods.length === 0) {
            console.log('食事履歴がありません。');
            this.showMainMenu();
            return;
        }

        // 日付ごとにグループ化
        const groupedFoods = {};
        this.foods.forEach(food => {
            const date = food.timestamp.toDateString();
            if (!groupedFoods[date]) {
                groupedFoods[date] = [];
            }
            groupedFoods[date].push(food);
        });

        Object.keys(groupedFoods).sort().reverse().forEach(date => {
            console.log(`\n📅 ${date}`);
            const dayFoods = groupedFoods[date];
            let dayTotal = 0;
            
            dayFoods.forEach(food => {
                console.log(`  • ${food.name}: ${food.calories} kcal`);
                dayTotal += food.calories;
            });
            
            console.log(`  合計: ${dayTotal} kcal`);
        });

        this.showMainMenu();
    }

    /**
     * アプリケーションを終了
     */
    exit() {
        console.log('\n👋 Nutrition Daemon を終了します。');
        console.log('健康的な食事を心がけてください！');
        this.rl.close();
        process.exit(0);
    }
}

// アプリケーションを開始
if (require.main === module) {
    const tracker = new NutritionTracker();
    tracker.start();
}

module.exports = NutritionTracker; 