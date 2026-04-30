// scripts/release.mjs — pipeline de release locale.
//
// Pipeline:
//   1. Lint (max 0 erreur, warnings tolérés)
//   2. Vitest (3167 tests doivent passer)
//   3. Build production (Vite)
//   4. Zip dist/* en petanque-master-vX.Y.Z.zip a la racine
//   5. Affiche la checklist upload itch.io
//
// Usage:
//   npm run release                              → build standalone (itch.io)
//   VITE_PLATFORM=crazygames npm run release     → build CrazyGames
//   VITE_PLATFORM=poki       npm run release     → build Poki
//
// Env vars (optionnel) lues par Vite et incluses dans le bundle si presentes:
//   VITE_UMAMI_SCRIPT_URL  — URL du script Umami self-hosted
//   VITE_UMAMI_WEBSITE_ID  — UUID du site dans Umami

import { readFileSync, createWriteStream, existsSync, statSync, unlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import archiver from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const version = pkg.version;
const platform = process.env.VITE_PLATFORM || 'standalone';
const suffix = platform === 'standalone' ? '' : `-${platform}`;
const zipName = `petanque-master-v${version}${suffix}.zip`;
const zipPath = path.join(ROOT, zipName);

const c = {
    ok:    s => `\x1b[32m${s}\x1b[0m`,
    err:   s => `\x1b[31m${s}\x1b[0m`,
    info:  s => `\x1b[36m${s}\x1b[0m`,
    warn:  s => `\x1b[33m${s}\x1b[0m`,
    bold:  s => `\x1b[1m${s}\x1b[0m`
};

function step(label) {
    console.log(`\n${c.bold(c.info('▶'))} ${c.bold(label)}`);
}

function run(cmd) {
    try {
        execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: process.env });
    } catch (e) {
        console.error(c.err(`✘ ${cmd} a echoue`));
        process.exit(1);
    }
}

function humanSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

async function zipDist() {
    if (!existsSync(DIST)) {
        console.error(c.err(`✘ ${DIST} n'existe pas — le build a echoue ?`));
        process.exit(1);
    }
    if (existsSync(zipPath)) unlinkSync(zipPath);

    return new Promise((resolve, reject) => {
        const output = createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(archive.pointer()));
        archive.on('warning', err => {
            if (err.code !== 'ENOENT') reject(err);
        });
        archive.on('error', reject);
        archive.pipe(output);

        // IMPORTANT : zipper le CONTENU de dist/, PAS le dossier dist/.
        // itch.io exige index.html a la racine du zip.
        archive.directory(DIST, false);
        archive.finalize();
    });
}

async function main() {
    const t0 = Date.now();

    console.log(c.bold(`\n=== Petanque Master release v${version} (${platform}) ===\n`));

    // Sanity: env Umami
    if (!process.env.VITE_UMAMI_SCRIPT_URL) {
        console.log(c.warn('⚠  VITE_UMAMI_SCRIPT_URL non defini → analytics desactive dans ce build.'));
        console.log(c.warn('   Voir docs/lancement/UMAMI_SETUP.md pour activer.\n'));
    }

    step('1/4 — Lint (eslint)');
    run('npm run lint');

    step('2/4 — Tests unitaires (Vitest)');
    run('npm test');

    step(`3/4 — Build production (target: ${platform})`);
    run('npm run build');

    step(`4/4 — Zip → ${zipName}`);
    const size = await zipDist();

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n${c.ok('✔')} ${c.bold(zipName)} ${c.info(`(${humanSize(size)})`)} pret en ${elapsed}s\n`);

    // Checklist post-build
    console.log(c.bold('=== A faire maintenant ==='));
    console.log(`${c.info('1.')} Sanity check local:`);
    console.log(`     ${c.warn('npm run preview')}`);
    console.log(`     → ouvre http://localhost:4173, joue 1 match, verifie console F12 (0 erreur CSP)`);
    console.log(`${c.info('2.')} Tagger ce release:`);
    console.log(`     ${c.warn(`git tag -a v${version} -m "Release v${version}"`)}`);
    console.log(`     ${c.warn(`git push origin v${version}`)}`);
    console.log(`${c.info('3.')} Upload itch.io:`);
    console.log(`     a. https://itch.io/dashboard → Petanque Master → Edit game`);
    console.log(`     b. Uploads → drag & drop ${c.bold(zipName)}`);
    console.log(`     c. Cocher ${c.bold('"This file will be played in the browser"')}`);
    console.log(`     d. Dimensions: 832 x 480 (desktop) — laisser le mobile en auto`);
    console.log(`     e. Cocher ${c.bold('"Fullscreen button"')} et ${c.bold('"Mobile friendly"')}`);
    console.log(`     f. Save (l'ancienne version est remplacee, le lien reste le meme)`);
    console.log(`${c.info('4.')} Devlog itch.io (optionnel mais recommande):`);
    console.log(`     Onglet Devlog → New devlog post → annoncer les changements v${version}.`);
    console.log();
}

main().catch(err => {
    console.error(c.err(`\n✘ Release a echoue: ${err.message}`));
    process.exit(1);
});
