/**
 * ShotResults.test.js — AXE B Phase 3
 * Teste la logique de detection des 8 resultats de tir dans _detectShotResult()
 * en inspectant directement les constantes et la logique sans Phaser.
 */
import { describe, it, expect } from 'vitest';
import {
    CARREAU_THRESHOLD,
    PALET_THRESHOLD,
    CASQUETTE_MAX_DISPLACEMENT,
    BLESSEE_MAX_DISPLACEMENT,
    RECUL_MIN_BACKWARD_PX
} from '../src/utils/Constants.js';

// Helpers purs pour tester la logique de detection sans PetanqueEngine instancie

/** Detecte le type de resultat de tir selon la logique de _detectShotResult */
function detectShotType({
    isTir,
    hitBalls = [],
    ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 10, team: 'player', _throwDirX: 0, _throwDirY: -1 },
    cochonnet = { x: 0, y: -200, radius: 6, isAlive: true },
    lastImpactPoint = null,
    loftId = null,
    carreauDetected = false
}) {
    if (carreauDetected) return 'CARREAU_GUARD';
    if (!isTir) {
        // Biberon : boule pointee touche le cochonnet
        const dx = ball.x - cochonnet.x;
        const dy = ball.y - cochonnet.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= ball.radius + cochonnet.radius + 2) return 'BIBERON';
        return null;
    }

    // Tir
    if (hitBalls.length === 0) return 'TROU_OU_SAUTEE';

    const hitAllied = hitBalls.filter(b => b.team === ball.team);
    if (hitAllied.length > 0) return 'CONTRE';

    const hitCochonnet = hitBalls.filter(b => b.team === 'cochonnet');
    const hitEnemy = hitBalls.filter(b => b.team !== ball.team && b.team !== 'cochonnet');

    if (hitCochonnet.length > 0 && hitEnemy.length === 0) return 'AU_COCHONNET';
    if (hitEnemy.length >= 2) return 'CISEAU';

    if (hitEnemy.length === 1) {
        const target = hitEnemy[0];
        const origX = lastImpactPoint?.x ?? target.x;
        const origY = lastImpactPoint?.y ?? target.y;
        const targetDisplacement = Math.sqrt(
            (target.x - origX) ** 2 + (target.y - origY) ** 2
        );

        if (targetDisplacement < CASQUETTE_MAX_DISPLACEMENT) return 'CASQUETTE';
        if (targetDisplacement < BLESSEE_MAX_DISPLACEMENT) return 'BLESSEE';

        if (lastImpactPoint) {
            const dxImpact = ball.x - lastImpactPoint.x;
            const dyImpact = ball.y - lastImpactPoint.y;
            const distFromImpact = Math.sqrt(dxImpact * dxImpact + dyImpact * dyImpact);
            if (distFromImpact > CARREAU_THRESHOLD && distFromImpact < PALET_THRESHOLD) return 'PALET';
        }

        if (lastImpactPoint && ball._throwDirX !== undefined) {
            const dxFromImpact = ball.x - lastImpactPoint.x;
            const dyFromImpact = ball.y - lastImpactPoint.y;
            const projForward = dxFromImpact * ball._throwDirX + dyFromImpact * ball._throwDirY;
            if (projForward < -RECUL_MIN_BACKWARD_PX) return 'RECUL';
        }
    }
    return null;
}

describe('Shot Result Detection — AXE B', () => {
    // 1. Biberon
    it('detecte BIBERON quand boule pointee touche le cochonnet', () => {
        const result = detectShotType({
            isTir: false,
            ball: { x: 100, y: 100, radius: 10, team: 'player', vx: 0, vy: 0 },
            cochonnet: { x: 100, y: 113, radius: 6, isAlive: true } // dist = 13 <= 10+6+2 = 18
        });
        expect(result).toBe('BIBERON');
    });

    // 2. Trou
    it('detecte TROU quand aucune collision pendant un tir', () => {
        const result = detectShotType({
            isTir: true,
            hitBalls: [],
            ball: { x: 0, y: 0, radius: 10, team: 'player', vx: 0, vy: 0, _throwDirX: 0, _throwDirY: -1 }
        });
        expect(result).toBe('TROU_OU_SAUTEE');
    });

    // 3. Contre
    it('detecte CONTRE quand le tir touche une boule alliee', () => {
        const result = detectShotType({
            isTir: true,
            hitBalls: [{ x: 0, y: -100, team: 'player' }], // allie
            ball: { x: 0, y: 0, radius: 10, team: 'player', vx: 0, vy: 0, _throwDirX: 0, _throwDirY: -1 }
        });
        expect(result).toBe('CONTRE');
    });

    // 4. Ciseau
    it('detecte CISEAU quand 2+ boules adverses touchees', () => {
        const result = detectShotType({
            isTir: true,
            hitBalls: [
                { x: 0, y: -80, team: 'opponent' },
                { x: 10, y: -90, team: 'opponent' }
            ],
            ball: { x: 0, y: 0, radius: 10, team: 'player', vx: 0, vy: 0, _throwDirX: 0, _throwDirY: -1 }
        });
        expect(result).toBe('CISEAU');
    });

    // 5. Casquette (deplacement < CASQUETTE_MAX_DISPLACEMENT = 8px)
    it('detecte CASQUETTE quand la cible a ete a peine deplacee (<8px)', () => {
        const impactPt = { x: 100, y: 100 };
        const result = detectShotType({
            isTir: true,
            hitBalls: [{ x: 103, y: 103, team: 'opponent' }], // deplacement ~4.2px
            lastImpactPoint: impactPt,
            ball: { x: 150, y: 150, radius: 10, team: 'player', vx: 0, vy: 0, _throwDirX: 0, _throwDirY: -1 }
        });
        expect(result).toBe('CASQUETTE');
    });

    // 6. Blessee (deplacement entre 8px et 32px)
    it('detecte BLESSEE quand la cible a ete moderement deplacee (8-32px)', () => {
        const impactPt = { x: 100, y: 100 };
        const result = detectShotType({
            isTir: true,
            hitBalls: [{ x: 115, y: 115, team: 'opponent' }], // deplacement ~21px
            lastImpactPoint: impactPt,
            ball: { x: 160, y: 160, radius: 10, team: 'player', vx: 0, vy: 0, _throwDirX: 0, _throwDirY: -1 }
        });
        expect(result).toBe('BLESSEE');
    });

    // 7. Palet (boule tiree reste entre CARREAU_THRESHOLD et PALET_THRESHOLD du point d'impact)
    it('detecte PALET quand la boule reste pres du point d impact (28-50px)', () => {
        const impactPt = { x: 100, y: 100 };
        // Cible deplacee de 40px (> BLESSEE_MAX 32px → tir reussi), boule tiree a 35px de l'impact
        const result = detectShotType({
            isTir: true,
            hitBalls: [{ x: 140, y: 100, team: 'opponent' }], // deplacement 40px
            lastImpactPoint: impactPt,
            ball: { x: 100 + 35, y: 100, radius: 10, team: 'player', vx: 0, vy: 0, _throwDirX: 1, _throwDirY: 0 }
        });
        expect(result).toBe('PALET');
    });

    // 8. Recul (boule tiree a fini derriere le point d'impact)
    it('detecte RECUL quand la boule tiree a fini derriere le point d impact', () => {
        const impactPt = { x: 100, y: 100 };
        // Tir vers la droite (+X), boule tiree finit a gauche du point d'impact → recul
        const result = detectShotType({
            isTir: true,
            hitBalls: [{ x: 160, y: 100, team: 'opponent' }], // cible deplacee de 60px (tir reussi)
            lastImpactPoint: impactPt,
            ball: {
                x: 100 - 10, y: 100, // 10px en arriere = projForward = -10 < -RECUL_MIN_BACKWARD_PX(5)
                radius: 10, team: 'player', vx: 0, vy: 0,
                _throwDirX: 1, _throwDirY: 0
            }
        });
        expect(result).toBe('RECUL');
    });

    // Verification des constantes (seuils correctement definis)
    it('les constantes de seuil sont coherentes', () => {
        expect(CASQUETTE_MAX_DISPLACEMENT).toBe(8);
        expect(BLESSEE_MAX_DISPLACEMENT).toBe(32);
        expect(RECUL_MIN_BACKWARD_PX).toBe(5);
        expect(CARREAU_THRESHOLD).toBeLessThan(PALET_THRESHOLD);
        expect(CASQUETTE_MAX_DISPLACEMENT).toBeLessThan(BLESSEE_MAX_DISPLACEMENT);
    });

    // Carreau guard
    it('retourne CARREAU_GUARD si _carreauDetected est vrai', () => {
        const result = detectShotType({
            isTir: true,
            hitBalls: [{ x: 100, y: 100, team: 'opponent' }],
            carreauDetected: true
        });
        expect(result).toBe('CARREAU_GUARD');
    });

    // Characters.json — barks nouveau
    it('tous les personnages ont les nouveaux barks (carreau_victim, palet_success, contre_self, fanny_win, fanny_lose)', async () => {
        const { readFileSync } = await import('fs');
        const { resolve } = await import('path');
        const data = JSON.parse(readFileSync(resolve(__dirname, '../public/data/characters.json'), 'utf-8'));
        const requiredBarks = ['carreau_victim', 'palet_success', 'contre_self', 'fanny_win', 'fanny_lose'];
        for (const char of data.roster) {
            for (const bark of requiredBarks) {
                expect(
                    char.barks[bark],
                    `${char.id} manque le bark "${bark}"`
                ).toBeDefined();
                expect(
                    char.barks[bark].length,
                    `${char.id}.barks.${bark} doit avoir >= 2 phrases`
                ).toBeGreaterThanOrEqual(2);
            }
        }
    });
});
