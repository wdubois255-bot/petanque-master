/**
 * End-to-end playtest - Full game flow
 * Tests: TitleScene → IntroScene → OverworldScene → PetanqueScene
 * Also: NPC interaction, map walking, petanque match completion
 */
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

const errors = [];
const warnings = [];
page.on('pageerror', err => errors.push(err.message));
page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('Framebuffer')) {
        errors.push(msg.text());
    }
    if (msg.type() === 'warn') {
        warnings.push(msg.text());
    }
});

const results = { passed: 0, failed: 0, details: [] };
function report(name, pass, error = null) {
    if (pass) {
        results.passed++;
        results.details.push({ name, status: 'PASS' });
    } else {
        results.failed++;
        results.details.push({ name, status: 'FAIL', error });
    }
}

// Helper: press and release a key (works with Phaser JustDown)
async function pressKey(key, holdMs = 80) {
    await page.keyboard.down(key);
    await page.waitForTimeout(holdMs);
    await page.keyboard.up(key);
    await page.waitForTimeout(50);
}

// Helper: hold a key for movement
async function holdKey(key, durationMs = 300) {
    await page.keyboard.down(key);
    await page.waitForTimeout(durationMs);
    await page.keyboard.up(key);
    await page.waitForTimeout(100);
}

console.log('=== END-TO-END PLAYTEST ===\n');

// --- PHASE 1: Load game ---
console.log('--- Phase 1: Game Load ---');
await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const gameExists = await page.evaluate(() => !!window.__PHASER_GAME__);
report('Phaser game loaded', gameExists, gameExists ? null : 'window.__PHASER_GAME__ not found');

const bootScene = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    return game?.scene?.scenes?.map(s => s.sys.settings.key) || [];
});
report('All scenes registered', bootScene.length >= 4,
    `Found ${bootScene.length} scenes: ${bootScene.join(', ')}`);
console.log(`  Scenes: ${bootScene.join(', ')}`);

// --- PHASE 2: TitleScene ---
console.log('\n--- Phase 2: TitleScene ---');

const titleActive = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    const scene = game.scene.getScene('TitleScene');
    return scene && scene.sys.isActive();
});
report('TitleScene is active', titleActive, 'TitleScene not active');

// Check title menu items exist
const titleUI = await page.evaluate(() => {
    const scene = window.__PHASER_GAME__.scene.getScene('TitleScene');
    if (!scene) return null;
    return {
        menuItems: scene._menuItems?.length || 0,
        mode: scene._mode
    };
});
report('TitleScene has menu items', titleUI && titleUI.menuItems > 0,
    `menuItems: ${titleUI?.menuItems}`);

// Select "Nouvelle Partie" and press Space
await pressKey('Space');
await page.waitForTimeout(800);

// --- PHASE 3: IntroScene ---
console.log('\n--- Phase 3: IntroScene ---');

const introActive = await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    // Could be in fade transition, wait a bit
    const scene = game.scene.getScene('IntroScene');
    return scene && scene.sys.isActive();
});
// It may take a moment due to camera fade
await page.waitForTimeout(600);

const introCheck = await page.evaluate(() => {
    const scene = window.__PHASER_GAME__.scene.getScene('IntroScene');
    if (!scene || !scene.sys.isActive()) return null;
    return {
        phase: scene._phase,
        dialogueIndex: scene._dialogueIndex
    };
});
report('IntroScene is active', introCheck !== null,
    introCheck ? `phase=${introCheck.phase}` : 'IntroScene not active');

// Advance through all dialogue lines (14 lines)
if (introCheck) {
    console.log('  Advancing through intro dialogue...');
    for (let i = 0; i < 16; i++) {
        const phase = await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('IntroScene');
            return scene?._phase;
        });
        if (phase !== 'dialogue') break;
        await pressKey('Space');
        await page.waitForTimeout(200);
    }

    const afterDialogue = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('IntroScene');
        return scene ? { phase: scene._phase, selectedBoule: scene._selectedBoule } : null;
    });
    report('IntroScene reached boule choice', afterDialogue?.phase === 'choose' || afterDialogue?.phase === 'confirm',
        `phase=${afterDialogue?.phase}`);

    // Choose boule (press right once for Bronze, then Space to confirm)
    await pressKey('ArrowRight');
    await page.waitForTimeout(200);
    await pressKey('Space'); // Confirm selection → goes to 'confirm' phase
    await page.waitForTimeout(200);

    const confirmPhase = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('IntroScene');
        return scene?._phase;
    });
    report('IntroScene confirm phase', confirmPhase === 'confirm',
        `phase=${confirmPhase}`);

    // Confirm choice
    await pressKey('Space');
    await page.waitForTimeout(1000); // Camera fade + scene transition
}

// --- PHASE 4: OverworldScene ---
console.log('\n--- Phase 4: OverworldScene ---');
await page.waitForTimeout(1500); // Allow scene create + camera fade in

const overworldCheck = await page.evaluate(() => {
    const scene = window.__PHASER_GAME__.scene.getScene('OverworldScene');
    if (!scene || !scene.sys.isActive()) return null;
    return {
        hasPlayer: !!scene.player,
        hasMapManager: !!scene.mapManager,
        hasNpcManager: !!scene.npcManager,
        hasDialogBox: !!scene.dialogBox,
        playerTileX: scene.player?.tileX,
        playerTileY: scene.player?.tileY,
        mapName: scene.mapManager?.currentMapName,
        npcCount: scene.npcManager?.npcs?.length || 0,
        gameState: !!scene.gameState
    };
});
report('OverworldScene is active', overworldCheck !== null,
    'OverworldScene not active');

if (overworldCheck) {
    report('Player created', overworldCheck.hasPlayer);
    report('MapManager created', overworldCheck.hasMapManager);
    report('NPCManager created', overworldCheck.hasNpcManager);
    report('DialogBox created', overworldCheck.hasDialogBox);
    report('Game state exists', overworldCheck.gameState);
    console.log(`  Player at (${overworldCheck.playerTileX}, ${overworldCheck.playerTileY})`);
    console.log(`  Map: ${overworldCheck.mapName}, NPCs: ${overworldCheck.npcCount}`);

    // Walk around: up, left, down, right
    console.log('  Walking around...');
    for (let i = 0; i < 3; i++) {
        await holdKey('ArrowUp', 250);
        await page.waitForTimeout(200);
    }
    for (let i = 0; i < 2; i++) {
        await holdKey('ArrowLeft', 250);
        await page.waitForTimeout(200);
    }
    for (let i = 0; i < 2; i++) {
        await holdKey('ArrowDown', 250);
        await page.waitForTimeout(200);
    }
    for (let i = 0; i < 2; i++) {
        await holdKey('ArrowRight', 250);
        await page.waitForTimeout(200);
    }

    const afterWalk = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('OverworldScene');
        return {
            tileX: scene.player?.tileX,
            tileY: scene.player?.tileY,
            isMoving: scene.player?.isMoving
        };
    });
    report('Player moved successfully', afterWalk !== null && !afterWalk.isMoving,
        `Now at (${afterWalk?.tileX}, ${afterWalk?.tileY})`);
    console.log(`  Player now at (${afterWalk?.tileX}, ${afterWalk?.tileY})`);

    // Try to find and interact with an NPC
    const npcPositions = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('OverworldScene');
        return scene.npcManager?.npcs?.map(n => ({
            id: n.id,
            name: n.npcName,
            tileX: n.tileX,
            tileY: n.tileY,
            type: n.type,
            canBattle: n.canBattle?.()
        })) || [];
    });
    console.log(`  NPCs found: ${npcPositions.map(n => `${n.name}(${n.tileX},${n.tileY})`).join(', ')}`);
    report('NPCs loaded on map', npcPositions.length > 0,
        `${npcPositions.length} NPCs`);

    // Navigate to first NPC and try to interact
    if (npcPositions.length > 0) {
        const target = npcPositions[0];
        console.log(`  Navigating toward ${target.name} at (${target.tileX}, ${target.tileY})...`);

        // Teleport player near the NPC for reliable testing
        await page.evaluate(({tx, ty}) => {
            const scene = window.__PHASER_GAME__.scene.getScene('OverworldScene');
            const player = scene.player;
            const newTileX = tx;
            const newTileY = ty + 1;
            player.tileX = newTileX;
            player.tileY = newTileY;
            player.x = newTileX * 16 + 8;
            player.y = newTileY * 16 + 8 - 4;
            player.facing = 'up';
            player.isMoving = false;
        }, {tx: target.tileX, ty: target.tileY});
        await page.waitForTimeout(300);

        // Press Space to interact
        await pressKey('Space');
        await page.waitForTimeout(500);

        const dialogVisible = await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('OverworldScene');
            return scene.dialogBox?.isVisible || false;
        });
        report('NPC dialogue opens', dialogVisible,
            `Dialog visible: ${dialogVisible}`);

        if (dialogVisible) {
            // Advance dialogue
            for (let i = 0; i < 10; i++) {
                await pressKey('Space');
                await page.waitForTimeout(300);

                const stillOpen = await page.evaluate(() => {
                    const scene = window.__PHASER_GAME__.scene.getScene('OverworldScene');
                    return scene.dialogBox?.isVisible || false;
                });
                if (!stillOpen) break;
            }
            console.log('  Dialogue completed');
        }
    }
}

// --- PHASE 5: PetanqueScene (direct launch for combat testing) ---
console.log('\n--- Phase 5: PetanqueScene Combat ---');

// Launch PetanqueScene directly for thorough combat testing
await page.evaluate(() => {
    const game = window.__PHASER_GAME__;
    // Stop all scenes and start PetanqueScene directly
    game.scene.scenes.forEach(s => {
        if (s.sys.isActive()) game.scene.stop(s.sys.settings.key);
    });
    game.scene.start('PetanqueScene', {
        terrain: 'terre',
        difficulty: 'easy',
        format: 'tete_a_tete',
        opponentName: 'Marcel',
        opponentId: 'marcel_terre',
        personality: 'pointeur'
    });
});
await page.waitForTimeout(2500);

const petanqueCheck = await page.evaluate(() => {
    const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
    if (!scene || !scene.sys.isActive()) return null;
    return {
        hasEngine: !!scene.engine,
        hasAI: !!scene.ai,
        hasAiming: !!scene.aimingSystem,
        hasScorePanel: !!scene.scorePanel,
        state: scene.engine?.state,
        currentTeam: scene.engine?.currentTeam,
        aimingEnabled: scene.engine?.aimingEnabled,
        ballsPerPlayer: scene.engine?.ballsPerPlayer,
        remaining: scene.engine?.remaining,
        scores: scene.engine?.scores,
        mene: scene.engine?.mene,
        aiPersonality: scene.ai?.personality?.personality,
        aiPrecision: scene.ai?.precisionConfig ? {
            angleDev: scene.ai.precisionConfig.angleDev,
            powerDev: scene.ai.precisionConfig.powerDev
        } : null,
        loftPreset: scene.aimingSystem?.loftPreset?.id,
        hasPlayerSprite: !!scene.playerSprite,
        hasOpponentSprite: !!scene.opponentSprite,
        throwCircleX: scene.throwCircleX,
        throwCircleY: scene.throwCircleY
    };
});

report('PetanqueScene is active', petanqueCheck !== null);
if (petanqueCheck) {
    report('Engine created', petanqueCheck.hasEngine);
    report('AI created with personality', petanqueCheck.hasAI && petanqueCheck.aiPersonality === 'pointeur',
        `personality: ${petanqueCheck.aiPersonality}`);
    report('AimingSystem created with loft', petanqueCheck.hasAiming && !!petanqueCheck.loftPreset,
        `loft: ${petanqueCheck.loftPreset}`);
    report('ScorePanel created', petanqueCheck.hasScorePanel);
    report('Player sprite on terrain', petanqueCheck.hasPlayerSprite);
    report('Opponent sprite on terrain', petanqueCheck.hasOpponentSprite);
    report('State is COCHONNET_THROW', petanqueCheck.state === 'COCHONNET_THROW',
        `state: ${petanqueCheck.state}`);
    report('Aiming enabled for cochonnet', petanqueCheck.aimingEnabled);
    report('3 balls per player (tete_a_tete)', petanqueCheck.ballsPerPlayer === 3,
        `ballsPerPlayer: ${petanqueCheck.ballsPerPlayer}`);
    console.log(`  State: ${petanqueCheck.state}, Team: ${petanqueCheck.currentTeam}`);
    console.log(`  AI: ${petanqueCheck.aiPersonality}, Loft: ${petanqueCheck.loftPreset}`);
    console.log(`  Remaining: P=${petanqueCheck.remaining?.player} O=${petanqueCheck.remaining?.opponent}`);

    // --- Test cochonnet throw ---
    console.log('\n  --- Throwing cochonnet ---');
    await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        scene.engine.throwCochonnet(-Math.PI / 2, 0.5);
    });
    await page.waitForTimeout(2000);

    const afterCochonnet = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        return {
            state: scene.engine.state,
            cochonnetAlive: scene.engine.cochonnet?.isAlive,
            cochonnetX: Math.round(scene.engine.cochonnet?.x || 0),
            cochonnetY: Math.round(scene.engine.cochonnet?.y || 0)
        };
    });
    report('Cochonnet thrown successfully', afterCochonnet.cochonnetAlive,
        `alive: ${afterCochonnet.cochonnetAlive}`);
    report('State advanced to FIRST_BALL', afterCochonnet.state === 'FIRST_BALL',
        `state: ${afterCochonnet.state}`);
    console.log(`  Cochonnet at (${afterCochonnet.cochonnetX}, ${afterCochonnet.cochonnetY})`);

    // --- Test player ball throw ---
    console.log('\n  --- Player throws first ball ---');
    await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        const LOFT_DEMI_PORTEE = scene.aimingSystem.loftPreset; // Current loft
        scene.engine.throwBall(-Math.PI / 2, 0.45, 'player', 'pointer', LOFT_DEMI_PORTEE);
    });
    await page.waitForTimeout(3000); // Wait for fly animation + rolling + stop

    const afterFirstBall = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        return {
            state: scene.engine.state,
            ballCount: scene.engine.balls.length,
            playerRemaining: scene.engine.remaining.player,
            opponentRemaining: scene.engine.remaining.opponent,
            ballAlive: scene.engine.balls[0]?.isAlive,
            ballTeam: scene.engine.balls[0]?.team,
            projectedScore: scene.engine.calculateProjectedScore()
        };
    });
    report('First ball thrown', afterFirstBall.ballCount >= 1,
        `balls: ${afterFirstBall.ballCount}`);
    report('Player remaining decremented', afterFirstBall.playerRemaining === 2,
        `remaining: ${afterFirstBall.playerRemaining}`);
    report('Ball is alive', afterFirstBall.ballAlive);
    report('Projected score available', afterFirstBall.projectedScore !== null,
        `projected: ${JSON.stringify(afterFirstBall.projectedScore)}`);
    console.log(`  State: ${afterFirstBall.state}, Balls: ${afterFirstBall.ballCount}, Remaining: P=${afterFirstBall.playerRemaining} O=${afterFirstBall.opponentRemaining}`);
    console.log(`  Projected score: ${JSON.stringify(afterFirstBall.projectedScore)}`);

    // --- Let AI and game play out (simulate several throws) ---
    console.log('\n  --- Simulating full mene ---');

    // Wait for AI turn (SECOND_TEAM_FIRST) + its throw
    await page.waitForTimeout(4000);

    // Throw remaining balls alternating
    for (let turn = 0; turn < 6; turn++) {
        const turnState = await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            const e = scene.engine;
            return {
                state: e.state,
                currentTeam: e.currentTeam,
                aimingEnabled: e.aimingEnabled,
                playerRemaining: e.remaining.player,
                opponentRemaining: e.remaining.opponent,
                ballCount: e.balls.length,
                scores: e.scores
            };
        });

        console.log(`  Turn ${turn + 1}: state=${turnState.state} team=${turnState.currentTeam} aiming=${turnState.aimingEnabled} P=${turnState.playerRemaining} O=${turnState.opponentRemaining} balls=${turnState.ballCount}`);

        // If game is scoring or ended, break
        if (['SCORE_MENE', 'MENE_DEAD', 'GAME_OVER'].includes(turnState.state)) {
            console.log(`  Mene ended with state: ${turnState.state}`);
            break;
        }

        // If it's player's turn and aiming is enabled, throw
        if (turnState.currentTeam === 'player' && turnState.aimingEnabled && turnState.playerRemaining > 0) {
            await page.evaluate(() => {
                const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
                const loft = scene.aimingSystem.loftPreset;
                // Slight angle variation for realism
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.3;
                const power = 0.3 + Math.random() * 0.4;
                scene.engine.throwBall(angle, power, 'player', 'pointer', loft);
            });
            await page.waitForTimeout(3000);
        } else {
            // Wait for AI turn to complete
            await page.waitForTimeout(3500);
        }
    }

    // Wait for scoring
    await page.waitForTimeout(3000);

    const finalState = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        const e = scene.engine;
        return {
            state: e.state,
            scores: e.scores,
            mene: e.mene,
            ballCount: e.balls.length,
            playerRemaining: e.remaining.player,
            opponentRemaining: e.remaining.opponent
        };
    });
    console.log(`\n  Final: state=${finalState.state} scores=${finalState.scores.player}-${finalState.scores.opponent} mene=${finalState.mene}`);
    report('Mene completed (score > 0 or mene > 1)',
        finalState.scores.player > 0 || finalState.scores.opponent > 0 || finalState.mene > 1,
        `scores: ${finalState.scores.player}-${finalState.scores.opponent}, mene: ${finalState.mene}`);

    // --- PHASE 6: Test other terrains ---
    console.log('\n--- Phase 6: Terrain variants ---');
    for (const terrain of ['herbe', 'sable', 'dalles']) {
        await page.evaluate((t) => {
            const game = window.__PHASER_GAME__;
            game.scene.stop('PetanqueScene');
            game.scene.start('PetanqueScene', {
                terrain: t,
                difficulty: 'medium',
                format: 'tete_a_tete',
                opponentName: `Test ${t}`,
                personality: 'tireur'
            });
        }, terrain);
        await page.waitForTimeout(2000);

        const terrainCheck = await page.evaluate((t) => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            if (!scene?.engine) return null;
            return {
                terrainType: scene.engine.terrainType,
                frictionMult: scene.frictionMult,
                state: scene.engine.state,
                aiPersonality: scene.ai?.personality?.personality
            };
        }, terrain);

        report(`Terrain ${terrain} loads`, terrainCheck?.terrainType === terrain,
            `got: ${terrainCheck?.terrainType}, friction: ${terrainCheck?.frictionMult}`);
        console.log(`  ${terrain}: friction=${terrainCheck?.frictionMult}, AI=${terrainCheck?.aiPersonality}`);
    }

    // --- PHASE 7: Test AI personalities ---
    console.log('\n--- Phase 7: AI personality variants ---');
    for (const personality of ['pointeur', 'tireur', 'stratege', 'complet']) {
        await page.evaluate((p) => {
            const game = window.__PHASER_GAME__;
            game.scene.stop('PetanqueScene');
            game.scene.start('PetanqueScene', {
                terrain: 'terre',
                difficulty: 'hard',
                format: 'tete_a_tete',
                opponentName: `AI ${p}`,
                personality: p
            });
        }, personality);
        await page.waitForTimeout(1500);

        const aiCheck = await page.evaluate(() => {
            const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
            if (!scene?.ai) return null;
            return {
                personality: scene.ai.personality?.personality,
                shootProb: scene.ai.personality?.shootProbability,
                loftPref: scene.ai.personality?.loftPref,
                targetsCocho: scene.ai.personality?.targetsCocho,
                angleDev: scene.ai.precisionConfig?.angleDev,
                powerDev: scene.ai.precisionConfig?.powerDev
            };
        });

        report(`AI ${personality} personality loaded`, aiCheck?.personality === personality,
            `got: ${aiCheck?.personality}`);
        console.log(`  ${personality}: shoot=${aiCheck?.shootProb}, loft=${aiCheck?.loftPref}, cocho=${aiCheck?.targetsCocho}, precision=(${aiCheck?.angleDev}°, ${aiCheck?.powerDev})`);
    }

    // --- PHASE 8: Petanque rules verification ---
    console.log('\n--- Phase 8: Rules verification ---');

    // Restart a fresh game for rules testing
    await page.evaluate(() => {
        const game = window.__PHASER_GAME__;
        game.scene.stop('PetanqueScene');
        game.scene.start('PetanqueScene', {
            terrain: 'terre',
            difficulty: 'easy',
            format: 'tete_a_tete',
            opponentName: 'Rules Test',
            personality: 'pointeur'
        });
    });
    await page.waitForTimeout(2000);

    const rulesCheck = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        const e = scene.engine;

        // Test rules
        const results = {};

        // FIPJP: tete-a-tete = 3 balls per player
        results.ballsPerPlayer = e.ballsPerPlayer === 3;

        // Victory at 13 points
        results.victoryScore = 13; // From Constants.js VICTORY_SCORE

        // First thrower is player
        results.firstThrower = e.currentTeam === 'player';

        // State machine starts correctly
        results.initialState = e.state === 'COCHONNET_THROW';

        // Score starts at 0-0
        results.initialScores = e.scores.player === 0 && e.scores.opponent === 0;

        // Mene starts at 1
        results.initialMene = e.mene === 1;

        // calculateProjectedScore returns null with no balls
        results.projectedNull = e.calculateProjectedScore() === null;

        // computeThrowParams is available
        results.hasComputeThrow = typeof e.constructor.computeThrowParams === 'function';

        // Carreau tracking initialized
        results.carreauTracking = Array.isArray(e._pendingCarreauChecks) && e._hitstopUntil === 0;

        // Best pulse indicator
        results.bestPulse = typeof e._bestPulse?.t === 'number';

        return results;
    });

    report('3 balls per player (FIPJP tete-a-tete)', rulesCheck.ballsPerPlayer);
    report('First thrower is player', rulesCheck.firstThrower);
    report('Initial state is COCHONNET_THROW', rulesCheck.initialState);
    report('Scores start at 0-0', rulesCheck.initialScores);
    report('Mene starts at 1', rulesCheck.initialMene);
    report('Projected score null with no balls', rulesCheck.projectedNull);
    report('computeThrowParams available', rulesCheck.hasComputeThrow);
    report('Carreau tracking initialized', rulesCheck.carreauTracking);
    report('Best pulse indicator initialized', rulesCheck.bestPulse);

    // Test: team furthest from cochonnet should play next
    console.log('\n  Testing turn order rules...');
    await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        // Throw cochonnet
        scene.engine.throwCochonnet(-Math.PI / 2, 0.5);
    });
    await page.waitForTimeout(2000);

    // Throw player ball close to cochonnet
    await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        scene.engine.throwBall(-Math.PI / 2, 0.44, 'player', 'pointer', scene.aimingSystem.loftPreset);
    });
    await page.waitForTimeout(3000);

    const turnAfterPlayer = await page.evaluate(() => {
        const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
        return {
            state: scene.engine.state,
            nextTeam: scene.engine.currentTeam
        };
    });
    report('After player throws, state progresses',
        turnAfterPlayer.state !== 'FIRST_BALL',
        `state: ${turnAfterPlayer.state}, nextTeam: ${turnAfterPlayer.nextTeam}`);
}

// --- PHASE 9: ScorePanel Sprint 3.5 features ---
console.log('\n--- Phase 9: ScorePanel features ---');
const scorePanelCheck = await page.evaluate(() => {
    const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
    if (!scene?.scorePanel) return null;
    const sp = scene.scorePanel;
    return {
        hasPlayerProjected: !!sp.playerProjected,
        hasOpponentProjected: !!sp.opponentProjected,
        hasBallsGfx: !!sp.ballsGfx,
        hasBallsBg: !!sp.ballsBg,
        hasDistGfx: !!sp._distGfx,
        distLabelsCount: sp._distLabels?.length,
        hasMeneText: !!sp.meneText
    };
});

if (scorePanelCheck) {
    report('ScorePanel projected score texts', scorePanelCheck.hasPlayerProjected && scorePanelCheck.hasOpponentProjected);
    report('ScorePanel ball dots graphics', scorePanelCheck.hasBallsGfx && scorePanelCheck.hasBallsBg);
    report('ScorePanel distance graphics', scorePanelCheck.hasDistGfx);
    report('ScorePanel 6 distance labels', scorePanelCheck.distLabelsCount === 6,
        `labels: ${scorePanelCheck.distLabelsCount}`);
    report('ScorePanel mene text', scorePanelCheck.hasMeneText);
}

// --- PHASE 10: AimingSystem Sprint 3.5 features ---
console.log('\n--- Phase 10: AimingSystem features ---');
const aimingCheck = await page.evaluate(() => {
    const scene = window.__PHASER_GAME__.scene.getScene('PetanqueScene');
    if (!scene?.aimingSystem) return null;
    const as = scene.aimingSystem;
    return {
        hasLoftPreset: !!as.loftPreset,
        loftId: as.loftPreset?.id,
        hasPredictionGfx: !!as._predictionGfx,
        hasShotMode: as.shotMode !== undefined
    };
});

if (aimingCheck) {
    report('AimingSystem has loft preset', aimingCheck.hasLoftPreset,
        `loft: ${aimingCheck.loftId}`);
    report('AimingSystem has prediction graphics', aimingCheck.hasPredictionGfx);
}

// --- Final report ---
console.log('\n\n========================================');
console.log('=== PLAYTEST RESULTS ===');
console.log('========================================\n');

for (const detail of results.details) {
    const icon = detail.status === 'PASS' ? '✓' : '✗';
    console.log(`  ${icon} ${detail.name}${detail.error && detail.status === 'FAIL' ? ` - ${detail.error}` : ''}`);
}

console.log(`\n${results.passed} passed, ${results.failed} failed`);

if (errors.length > 0) {
    console.log('\n--- JS Errors ---');
    errors.forEach(e => console.log(`  ❌ ${e}`));
}

if (warnings.length > 0 && warnings.length < 20) {
    console.log('\n--- Warnings ---');
    warnings.forEach(w => console.log(`  ⚠ ${w}`));
}

await browser.close();

if (results.failed > 0 || errors.length > 0) {
    console.log('\n❌ SOME TESTS FAILED');
    process.exit(1);
} else {
    console.log('\n✅ ALL TESTS PASSED - GAME IS PLAYABLE');
}
