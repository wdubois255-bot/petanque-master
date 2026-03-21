/**
 * Script de capture automatique — Making Of Petanque Master
 *
 * Parcourt 10 commits cles du projet, lance le jeu a chaque etape,
 * et prend des screenshots pour documenter l'evolution visuelle.
 *
 * Usage : node scripts/capture-making-of.mjs
 *
 * Pre-requis : npm install, playwright installe
 * Le script gere lui-meme les git checkout et le retour a master.
 */

import { chromium } from 'playwright';
import { execSync, spawn } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'docs', 'making-of', 'screenshots');

// ═══════════════════════════════════════════════════════════════
// COMMITS CLES — Les 10 etapes de l'histoire
// ═══════════════════════════════════════════════════════════════
const SNAPSHOTS = [
  {
    hash: '26ed760',
    name: '01_premier_moteur',
    label: 'Jour 1 — Premier moteur petanque',
    scenes: ['boot'],  // Seulement Boot → Petanque direct
    waitFor: 3000,
  },
  {
    hash: '62fe7cd',
    name: '02_monde_ouvert',
    label: 'Jour 1 — Monde ouvert : village et PNJs',
    scenes: ['boot'],
    waitFor: 4000,
  },
  {
    hash: '681559d',
    name: '03_migration_32x32',
    label: 'Jour 3 — Migration 32x32 (resolution doublee)',
    scenes: ['boot'],
    waitFor: 4000,
  },
  {
    hash: '6a3fa1c',
    name: '04_provence',
    label: 'Jour 3 — Sprint 4.0 : fond Provence + gravier',
    scenes: ['boot'],
    waitFor: 4000,
  },
  {
    hash: '197b295',
    name: '05_sprites_pipoya',
    label: 'Jour 4 — Sprites Pipoya PNG integres',
    scenes: ['boot'],
    waitFor: 4000,
  },
  {
    hash: '75b55cd',
    name: '06_chibi_pixellab',
    label: 'Jour 4 — 4 personnages chibi PixelLab',
    scenes: ['boot'],
    waitFor: 4000,
  },
  {
    hash: '8356fff',
    name: '07_pivot_arcade',
    label: 'Jour 5 — Pivot vers arcade/versus',
    scenes: ['boot'],
    waitFor: 4000,
    // Ce commit a CharSelectScene, VSIntroScene, ArcadeScene
  },
  {
    hash: 'c7bc1a8',
    name: '08_refonte_visuelle_v1',
    label: 'Jour 5 — Refonte visuelle complete Pipoya',
    scenes: ['boot'],
    waitFor: 4000,
  },
  {
    hash: 'dd9d3c7',
    name: '09_polish_complet',
    label: 'Jour 6 — Polish : hit stop, iris wipe, portraits',
    scenes: ['boot'],
    waitFor: 4000,
  },
  {
    hash: 'b8e0931',
    name: '10_etat_actuel',
    label: 'Jour 8 — Etat actuel : refonte v2',
    scenes: ['boot'],
    waitFor: 4000,
  },
];

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf-8', timeout: 30000 }).trim();
}

function log(msg) {
  const time = new Date().toLocaleTimeString('fr-FR');
  console.log(`[${time}] ${msg}`);
}

function logSuccess(msg) {
  console.log(`  ✓ ${msg}`);
}

function logError(msg) {
  console.log(`  ✗ ${msg}`);
}

async function startDevServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['vite', '--port', '5999', '--strictPort'], {
      cwd: ROOT,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // On tente quand meme, le serveur est peut-etre pret
        resolve(server);
      }
    }, 15000);

    server.stdout.on('data', (data) => {
      const str = data.toString();
      if (str.includes('Local:') || str.includes('localhost') || str.includes('ready')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          // Petit delai pour laisser Vite finir
          setTimeout(() => resolve(server), 1000);
        }
      }
    });

    server.stderr.on('data', (data) => {
      // Vite met parfois les infos sur stderr
      const str = data.toString();
      if (str.includes('Local:') || str.includes('localhost')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          setTimeout(() => resolve(server), 1000);
        }
      }
    });

    server.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

function killServer(server) {
  if (!server) return;
  try {
    // Sur Windows, il faut tuer l'arbre de processus
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
  } catch (e) {
    // Ignore
  }
}

async function captureScreenshots(page, snapshotName, waitMs) {
  const screenshots = [];

  // Attendre que le jeu charge
  await page.waitForTimeout(waitMs);

  // Screenshot 1 : ce qui s'affiche au boot (titre ou jeu direct)
  const mainShot = path.join(OUTPUT, `${snapshotName}_main.png`);
  await page.screenshot({ path: mainShot, fullPage: false });
  screenshots.push('main');

  // Essayer de cliquer pour avancer (ecran titre → jeu)
  // On clique au centre et on attend
  try {
    await page.mouse.click(416, 240);
    await page.waitForTimeout(1500);
    await page.mouse.click(416, 240);
    await page.waitForTimeout(1500);

    const afterClick = path.join(OUTPUT, `${snapshotName}_after_click.png`);
    await page.screenshot({ path: afterClick, fullPage: false });
    screenshots.push('after_click');
  } catch (e) {
    // Pas grave si ca echoue
  }

  // Essayer d'appuyer sur Espace/Entree pour avancer
  try {
    await page.keyboard.press('Space');
    await page.waitForTimeout(1500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);

    const afterKey = path.join(OUTPUT, `${snapshotName}_gameplay.png`);
    await page.screenshot({ path: afterKey, fullPage: false });
    screenshots.push('gameplay');
  } catch (e) {
    // Pas grave
  }

  return screenshots;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   PETANQUE MASTER — Capture Making Of           ║');
  console.log('║   10 etapes × 3 screenshots = ~30 images        ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // Sauvegarder l'etat actuel
  const currentBranch = git('rev-parse --abbrev-ref HEAD');
  const hasChanges = git('status --porcelain').length > 0;

  if (hasChanges) {
    log('Sauvegarde des changements en cours (git stash)...');
    git('stash push -m "making-of-capture-autostash"');
  }

  // Creer le dossier de sortie
  if (!existsSync(OUTPUT)) {
    mkdirSync(OUTPUT, { recursive: true });
  }

  log(`Dossier de sortie : ${OUTPUT}`);
  log(`Branche actuelle : ${currentBranch}`);
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (let i = 0; i < SNAPSHOTS.length; i++) {
    const snap = SNAPSHOTS[i];
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    log(`[${i + 1}/${SNAPSHOTS.length}] ${snap.label}`);
    log(`Commit: ${snap.hash}`);

    let server = null;

    try {
      // Checkout le commit
      git(`checkout ${snap.hash} --force`);
      logSuccess('git checkout OK');

      // npm install (les deps peuvent avoir change)
      try {
        execSync('npm install --silent --no-audit --no-fund', {
          cwd: ROOT,
          timeout: 60000,
          stdio: 'ignore',
        });
        logSuccess('npm install OK');
      } catch (e) {
        logError('npm install echoue, on tente quand meme...');
      }

      // Lancer le serveur
      server = await startDevServer();
      logSuccess('Serveur dev demarre (port 5999)');

      // Ouvrir le navigateur
      const context = await browser.newContext({
        viewport: { width: 832, height: 480 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      // Charger le jeu
      try {
        await page.goto('http://localhost:5999', {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        logSuccess('Page chargee');

        // Prendre les screenshots
        const shots = await captureScreenshots(page, snap.name, snap.waitFor);
        logSuccess(`${shots.length} screenshots : ${shots.join(', ')}`);
        results.push({ ...snap, status: 'OK', shots: shots.length });
      } catch (e) {
        logError(`Erreur page : ${e.message.slice(0, 80)}`);
        results.push({ ...snap, status: 'ERREUR_PAGE', shots: 0 });
      }

      await context.close();
    } catch (e) {
      logError(`Erreur : ${e.message.slice(0, 100)}`);
      results.push({ ...snap, status: 'ERREUR', shots: 0 });
    } finally {
      killServer(server);
      // Petit delai pour liberer le port
      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('');
  }

  // Revenir a la branche d'origine
  log('Retour a la branche d\'origine...');
  git(`checkout ${currentBranch} --force`);

  if (hasChanges) {
    try {
      git('stash pop');
      logSuccess('Changements restaures (git stash pop)');
    } catch (e) {
      logError('Attention : git stash pop echoue. Verifiez manuellement.');
    }
  }

  await browser.close();

  // Resume
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   RESUME                                         ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  let totalShots = 0;
  for (const r of results) {
    const icon = r.status === 'OK' ? '✓' : '✗';
    console.log(`  ${icon} ${r.name.padEnd(30)} ${r.status.padEnd(15)} ${r.shots} screenshots`);
    totalShots += r.shots;
  }

  console.log('');
  log(`Total : ${totalShots} screenshots dans ${OUTPUT}`);
  console.log('');

  // Generer un index HTML des captures
  await generateIndex(results);
}

async function generateIndex(results) {
  const indexPath = path.join(OUTPUT, 'index.html');
  const cards = SNAPSHOTS.map((snap, i) => {
    const r = results[i];
    const status = r?.status === 'OK' ? '' : ' (echec capture)';
    return `
    <div class="card">
      <h3>${snap.label}${status}</h3>
      <div class="shots">
        <div class="shot">
          <img src="${snap.name}_main.png" alt="main" onerror="this.parentElement.style.display='none'">
          <span>Boot / Titre</span>
        </div>
        <div class="shot">
          <img src="${snap.name}_after_click.png" alt="after click" onerror="this.parentElement.style.display='none'">
          <span>Apres clic</span>
        </div>
        <div class="shot">
          <img src="${snap.name}_gameplay.png" alt="gameplay" onerror="this.parentElement.style.display='none'">
          <span>Gameplay</span>
        </div>
      </div>
    </div>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Petanque Master — Evolution visuelle</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #2A1F1A;
      color: #F5E6D0;
      font-family: 'Courier New', monospace;
      padding: 2rem;
    }
    h1 {
      text-align: center;
      color: #D4A574;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      text-align: center;
      color: #9B7BB8;
      margin-bottom: 2rem;
    }
    .card {
      background: #3A2E28;
      border: 2px solid #6B8E4E;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .card h3 {
      color: #D4A574;
      margin-bottom: 0.8rem;
      font-size: 1.1rem;
    }
    .shots {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .shot {
      flex: 1;
      min-width: 250px;
      text-align: center;
    }
    .shot img {
      width: 100%;
      border: 1px solid #6B8E4E;
      border-radius: 4px;
      image-rendering: pixelated;
    }
    .shot span {
      display: block;
      color: #87CEEB;
      font-size: 0.8rem;
      margin-top: 0.3rem;
    }
  </style>
</head>
<body>
  <h1>Petanque Master — Evolution Visuelle</h1>
  <p class="subtitle">181 commits en 8 jours — 10 etapes capturees</p>
  ${cards}
</body>
</html>`;

  const { writeFileSync } = await import('fs');
  writeFileSync(indexPath, html, 'utf-8');
  logSuccess(`Index HTML genere : ${indexPath}`);
}

main().catch((err) => {
  console.error('Erreur fatale :', err);
  // Tenter de revenir a master quoi qu'il arrive
  try {
    git('checkout master --force');
    git('stash pop');
  } catch (e) { /* ignore */ }
  process.exit(1);
});
