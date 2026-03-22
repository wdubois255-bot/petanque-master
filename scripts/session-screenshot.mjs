/**
 * Capture un screenshot du jeu dans son état actuel.
 * Utilisé automatiquement par /session-end pour le journal making-of.
 *
 * Usage : node scripts/session-screenshot.mjs [output-path]
 * Par défaut sauvegarde dans docs/making-of/sessions/
 */

import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Argument optionnel : chemin de sortie
const outputPath = process.argv[2] || path.join(
  ROOT, 'docs', 'making-of', 'sessions',
  `screenshot_${new Date().toISOString().slice(0, 10)}.png`
);

// Créer le dossier parent si nécessaire
const outputDir = path.dirname(outputPath);
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

function log(msg) {
  console.log(`[session-screenshot] ${msg}`);
}

async function startDevServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['vite', '--port', '5998', '--strictPort'], {
      cwd: ROOT,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(server);
      }
    }, 15000);

    const onData = (data) => {
      const str = data.toString();
      if (str.includes('Local:') || str.includes('localhost') || str.includes('ready')) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          setTimeout(() => resolve(server), 1000);
        }
      }
    };

    server.stdout.on('data', onData);
    server.stderr.on('data', onData);
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
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' });
    } else {
      server.kill('SIGTERM');
    }
  } catch (e) { /* ignore */ }
}

async function main() {
  log('Lancement du serveur dev...');
  const server = await startDevServer();

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 832, height: 480 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await page.goto('http://localhost:5998', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    // Attendre que Phaser charge (le canvas apparaît)
    await page.waitForTimeout(4000);

    // Screenshot du titre
    await page.screenshot({ path: outputPath, fullPage: false });
    log(`Screenshot sauvegardé : ${outputPath}`);

    // Essayer d'aller plus loin (clic pour passer le titre)
    const gameplayPath = outputPath.replace('.png', '_gameplay.png');
    try {
      await page.mouse.click(416, 240);
      await page.waitForTimeout(2000);
      await page.mouse.click(416, 240);
      await page.waitForTimeout(2000);
      await page.screenshot({ path: gameplayPath, fullPage: false });
      log(`Screenshot gameplay : ${gameplayPath}`);
    } catch (e) {
      // Pas grave si le gameplay ne marche pas
    }

    await context.close();
    await browser.close();
  } finally {
    killServer(server);
  }

  log('Terminé.');
}

main().catch((err) => {
  console.error('[session-screenshot] Erreur:', err.message);
  process.exit(1);
});
