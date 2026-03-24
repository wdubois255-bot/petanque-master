/**
 * SceneTransition — fadeOut vers une scène cible.
 * Utiliser à la place de this.scene.start() pour des transitions fluides.
 *
 * Couleur de fond : #1A1510 (ombre-profond, cohérent avec la palette)
 * Durée par défaut : 200ms (imperceptible, évite le flash blanc)
 *
 * Usage :
 *   import { fadeToScene } from '../utils/SceneTransition.js';
 *   fadeToScene(this, 'TitleScene');
 *   fadeToScene(this, 'ResultScene', { winner: 'player' }, 300);
 */
export function fadeToScene(scene, targetScene, data = {}, duration = 200) {
    if (!scene || !scene.cameras || !scene.cameras.main) {
        // Fallback sans fade si la caméra n'est pas disponible
        scene.scene.start(targetScene, data);
        return;
    }

    const cam = scene.cameras.main;

    // Eviter les doubles déclenchements (ex: ESC + click en même temps)
    if (cam._fadingOut) return;
    cam._fadingOut = true;

    cam.fadeOut(duration, 0x1A, 0x15, 0x10);
    cam.once('camerafadeoutcomplete', () => {
        if (scene.scene.isActive()) {
            scene.scene.start(targetScene, data);
        }
    });
}
