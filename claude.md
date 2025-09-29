# Makiden-style Vertical Walking Shooter - Claude Code Migration Project

## Project Overview
This project involves migrating a Makiden (Demon Castle Legend) style vertical walking shooter game from a web browser implementation to Claude Code for further development and improvements.

## Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

## Current Implementation Status

### Game Basic Specifications
**Genre**: Vertical Walking Shooter  
**Theme**: Makiden-style Fantasy  
**Player Character**: Popolon (Heavy Armored Warrior)  
**Screen Size**: 800x600px  
**Frame Rate**: 60fps

### Core Features

#### Player System
- **Character**: Popolon (36x36px, pixel art sprite)
- **Movement**: 8-directional movement with arrow keys
- **Walking Animation**: Footsteps, body bounce, arm swing, head bob
- **Speed Mode**: 5-second super-speed movement with red afterimage effects
- **Health**: 60HP (instant death when falling into rivers)
- **Weapons**: 9-stage power-up system

#### Weapon System
1. Normal Shot (single bullet)
2. Twin Shot
3. 3-WAY Shot
4. 5-WAY Shot
5. Circle Shot (8 directions)
6. One-Hit-Kill Laser
7. Flame Shot (spread fire)
8. Thunder Shot (zigzag trajectory)
9. Fireball (with trail effects)

#### Enemy System
- **Bats**: Formation flying, dive attacks
- **Sine Wave Flyers**: Left-right invasion patterns
- **Ground Walkers**: With walking animations
- **Sword-throwing Knights**: Heavy armor, sword throwing attacks
- **Bomb Walkers**: Red-black blinking, explosive contact damage

#### Boss System
- **3 Bosses**: Nutrition-themed bosses at end of each stage
- **1st Boss**: Vitamin Demon (cute demon girl with orange hair, black horns, purple outfit, holding fruits)
- **2nd Boss**: Mineral Demon (mystical demon with purple skin, black hair, red horns)
- **3rd Boss**: Final nutrition-themed boss (TBD - replacing traditional Medusa)
- **Dedicated BGM**: Custom music for each boss
- **Hybrid Sprite System**: PNG images supported alongside traditional pixel arrays

#### Background & Terrain System
- **5 Stages**: Grassland → Sunset → Night → Underground → Demon Realm
- **Dynamic Background**: Combined terrain of grass, rivers, and bridges
- **River System**: Instant death for player, crossable via bridges
- **Pillar Decoration**: Stone pillars on left/right for demon castle atmosphere

#### Item System
- **? Boxes**: Drop various items when destroyed
- **Weapon Enhancement**: Weapon level upgrade
- **Health Recovery**: +20 HP restoration
- **Laser Ammo**: +8 laser shots
- **Speed Mode**: 5-second super-speed movement

#### BGM & SE System
- **Tone.js Integration**: Real-time music generation
- **Start BGM**: Xevious-style opening
- **Normal BGM**: Heroic and uplifting adventure music
- **Boss BGM**: Powerful music for each boss
- **Victory BGM**: Happy ending celebration music
- **Sound Effects**: Attack, hit, defeat, damage, etc.

#### Game Systems
- **Continue System**: Up to 5 continues available
- **Score System**: Points earned by defeating enemies
- **Level System**: Enemy spawn rate increases with score
- **Ending**: Victory screen after defeating all bosses

### Technical Implementation Details

#### Pixel Art System
- **16x16 Base Size**: 2.25x to 3x scaling
- **Color Palette**: 20 retro-style colors
- **Sprite Data**: Array-based pixel art
- **Drawing Function**: `drawSprite(spriteKey, x, y, scale)`

#### Collision Detection
- **Rectangle Collision**: Basic AABB detection
- **Laser Special Detection**: 120px wide vertical detection
- **River Detection**: Non-bridge tile detection

#### Particle System
- **Explosion Effects**: Spectacular effects when enemies are defeated
- **Fire Effects**: Upward flame particles
- **Damage Effects**: Red explosion when player takes damage
- **Fireball Trails**: Afterimage effects

#### Music System (Tone.js)
```javascript
// Music switching example
function switchToBossMusic() {
    isBossMusic = true;
    startBossMusic();
}

// SE playback example
enemyKillSE.triggerAttackRelease("C5", "4n");
```

## Technical Challenges and Improvements

### Current Technical Constraints
1. **Browser Dependencies**: No localStorage support, Tone.js dependency
2. **Performance**: Optimization needed to maintain 60fps
3. **Responsive Design**: Fixed 800x600 screen size
4. **Error Handling**: Stability through extensive try-catch usage

### Expected Improvements with Claude Code Migration
1. **Framework Utilization**: More efficient game loop
2. **Module Division**: Improved code reusability
3. **Music System**: More stable audio system
4. **Save System**: Progress saving functionality
5. **Settings System**: Difficulty adjustment, key configuration, etc.
6. **Performance Optimization**: Smoother operation

## File Structure (Current)
```
Makiden-style Shooter/
├── index.html (single file implementation)
├── Sprite Data (embedded)
├── BGM System (Tone.js)
├── Game Logic (JavaScript)
└── Styles (CSS)
```

## Next Steps

### Migration Plan
1. **Game Engine Selection**: Choose appropriate JavaScript game framework
2. **Module Division**: Separate files by functionality
3. **Music System Improvement**: More stable audio system
4. **Additional Feature Implementation**:
   - Save/Load functionality
   - Settings screen
   - More diverse enemies & bosses
   - Additional stages
   - Power-up diversification

### Expected Outcomes
- More maintainable code structure
- Easily extensible feature design
- Stable performance
- Rich potential for additional game elements

This document serves as a reference for understanding the current implementation status and future direction in Claude Code development.

## Development Server Setup

### Local Development Server (Recommended)

```bash
# Install dependencies
npm install --cache /tmp/.npm  # Use temporary cache to avoid permission issues

# Start development server
npm run dev

# Server will be available at:
# http://localhost:5173/
```

### Alternative Setup (if npm issues occur)

```bash
# Fix npm cache permissions (if needed)
sudo chown -R $(whoami) ~/.npm

# Then run normally
npm install
npm run dev
```

### Notes
- Uses Vite development server for ES6 module support
- Hot reload enabled for development
- All game features work properly including Tone.js audio system

## Recent Major Updates (2025-09-28)

### Implemented Features
1. **Enhanced Sprite System**: Reference image-based character improvements
2. **Nutrition-themed Boss System**: Vitamin Demon, Mineral Demon with PNG support
3. **Popolon & Aphrodite Rescue Ending**: Complete cutscene with romantic dialogue
4. **Boss Mode Fixes**: Resolved critical freezing and method errors
5. **Hybrid Sprite System**: PNG/JPG image support alongside pixel arrays
6. **Zelda-style Stage Display**: 5-second stage name presentation system

### Current Status
- ✅ All major systems operational
- ✅ Hybrid sprite system ready for high-quality PNG assets
- ✅ Boss Mode fully functional for testing
- ⏳ Vitamin Demon PNG implementation in progress