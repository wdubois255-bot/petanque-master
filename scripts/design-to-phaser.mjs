#!/usr/bin/env node
/**
 * Bridge Claude Design → Phaser
 *
 * Lit une spec JSON exportée depuis Claude Design (ou écrite à la main selon
 * le format décrit dans docs/mobile/CLAUDE_DESIGN_WORKFLOW.md §1) et génère :
 *   - Un diff pour src/utils/Layout.js (nouvelles ancres par scène/mode)
 *   - Un rapport Markdown avec les positions proposées
 *
 * Usage :
 *   node scripts/design-to-phaser.mjs <spec.json> [--apply]
 *
 * Sans --apply : dry-run, affiche le diff et le rapport dans la console.
 * Avec --apply : patch src/utils/Layout.js et écrit docs/mobile/<scene>_SPEC.md
 *
 * Format spec JSON attendu (exemple) :
 * {
 *   "scene": "TitleScene",
 *   "mode": "portrait",       // "portrait" | "landscape"
 *   "anchors": {
 *     "logo":         { "x": 240, "y": 150, "origin": [0.5, 0] },
 *     "menuPrimary":  { "x": 240, "y": 420, "w": 340, "h": 66 },
 *     "menuStack":    { "step": 80, "count": 4 },
 *     "footer":       { "x": 240, "y": 930 }
 *   },
 *   "components": {
 *     "primaryButton": {
 *       "width": 340, "height": 66, "borderRadius": 8,
 *       "fillFrom": "#C4854A", "fillTo": "#9A6636"
 *     }
 *   }
 * }
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const LAYOUT_PATH = join(ROOT, 'src/utils/Layout.js');
const DOCS_DIR = join(ROOT, 'docs/mobile');

// ─── Parsing CLI ────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const specPath = args.find(a => !a.startsWith('--'));
const apply = args.includes('--apply');

if (!specPath) {
    console.error('Usage: node scripts/design-to-phaser.mjs <spec.json> [--apply]');
    process.exit(1);
}
if (!existsSync(specPath)) {
    console.error(`Spec file not found: ${specPath}`);
    process.exit(1);
}

const spec = JSON.parse(readFileSync(specPath, 'utf-8'));

// ─── Validation ─────────────────────────────────────────────────────────

if (!spec.scene || typeof spec.scene !== 'string') {
    console.error('Spec must have a "scene" (string)');
    process.exit(1);
}
if (!['portrait', 'landscape'].includes(spec.mode)) {
    console.error('Spec mode must be "portrait" or "landscape"');
    process.exit(1);
}
if (!spec.anchors || typeof spec.anchors !== 'object') {
    console.error('Spec must have "anchors" (object)');
    process.exit(1);
}

// ─── Génération de code pour Layout.js ──────────────────────────────────

function toAnchorKey(sceneName, anchorName) {
    // TitleScene + logo → "title_logo"
    const scenePart = sceneName.replace(/Scene$/, '').toLowerCase();
    return `${scenePart}_${anchorName}`;
}

function generateAnchorFunctions(spec) {
    const lines = [];
    for (const [name, data] of Object.entries(spec.anchors)) {
        const key = toAnchorKey(spec.scene, name);
        if (data.x !== undefined && data.y !== undefined) {
            lines.push(`        ${key}: () => ({ x: ${data.x}, y: ${data.y} })${data.w ? `,  // w=${data.w} h=${data.h}` : ''}`);
        } else if (data.step && data.count) {
            lines.push(`        ${key}: (i = 0) => ({ x: 0, y: ${data.step} * i }),  // stack: ${data.count} items step ${data.step}px`);
        }
    }
    return lines;
}

const anchorLines = generateAnchorFunctions(spec);

// ─── Dry-run output ─────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  BRIDGE Claude Design → Phaser`);
console.log(`  Scene    : ${spec.scene}`);
console.log(`  Mode     : ${spec.mode}`);
console.log(`  Anchors  : ${Object.keys(spec.anchors).length}`);
console.log(`  Apply    : ${apply ? 'YES — will patch files' : 'NO (dry-run)'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('Ancres générées pour Layout.js (bloc ANCHORS.' + spec.mode + ') :');
console.log('----------------------------------------------------------------');
anchorLines.forEach(l => console.log(l));
console.log('----------------------------------------------------------------\n');

// ─── Rapport Markdown ───────────────────────────────────────────────────

function generateMarkdownReport(spec) {
    const lines = [
        `# Design Spec — ${spec.scene} (${spec.mode})`,
        '',
        `Généré par \`scripts/design-to-phaser.mjs\` depuis \`${specPath}\`.`,
        '',
        `## Ancres (Layout.js)`,
        '',
        '| Nom | x | y | w | h | Origin | Note |',
        '|-----|---|---|---|---|--------|------|'
    ];
    for (const [name, data] of Object.entries(spec.anchors)) {
        const row = [
            name,
            data.x ?? '—',
            data.y ?? '—',
            data.w ?? '—',
            data.h ?? '—',
            data.origin ? `[${data.origin.join(', ')}]` : '—',
            data.step ? `stack step ${data.step}` : ''
        ];
        lines.push('| ' + row.join(' | ') + ' |');
    }
    if (spec.components) {
        lines.push('', '## Composants', '');
        for (const [name, data] of Object.entries(spec.components)) {
            lines.push(`### ${name}`);
            lines.push('```json');
            lines.push(JSON.stringify(data, null, 2));
            lines.push('```', '');
        }
    }
    lines.push('## Patch proposé (src/utils/Layout.js)');
    lines.push('');
    lines.push('Ajouter dans le bloc `ANCHORS.' + spec.mode + '` :');
    lines.push('```js');
    anchorLines.forEach(l => lines.push(l.trim()));
    lines.push('```');
    return lines.join('\n');
}

const report = generateMarkdownReport(spec);

if (!apply) {
    console.log('--- RAPPORT MARKDOWN (preview) ---\n');
    console.log(report);
    console.log('\n[Dry-run — rien n\'a été modifié. Relance avec --apply pour patcher]');
    process.exit(0);
}

// ─── Application : écrit le rapport + patch Layout.js ───────────────────

if (!existsSync(DOCS_DIR)) mkdirSync(DOCS_DIR, { recursive: true });
const reportPath = join(DOCS_DIR, `${spec.scene}_SPEC.md`);
writeFileSync(reportPath, report, 'utf-8');
console.log(`✓ Rapport écrit : ${reportPath}`);

// Patch Layout.js : ajouter les ancres dans le bon bloc ANCHORS[mode]
let layoutSource = readFileSync(LAYOUT_PATH, 'utf-8');
const blockRegex = new RegExp(`(${spec.mode}:\\s*\\{)([\\s\\S]*?)(\\}\\s*\\};)`, 'm');
const match = layoutSource.match(blockRegex);

if (!match) {
    console.error(`Cannot find ANCHORS.${spec.mode} block in Layout.js`);
    process.exit(1);
}

const existingBlock = match[2];
const newAnchors = anchorLines.join(',\n') + (anchorLines.length ? ',\n' : '');
const existingAnchorKeys = new Set();
existingBlock.split('\n').forEach(l => {
    const m = l.match(/^\s*(\w+):\s*\(/);
    if (m) existingAnchorKeys.add(m[1]);
});

// Filtre les nouvelles ancres pour éviter les doublons
const newUniqueLines = anchorLines.filter(l => {
    const m = l.match(/^\s*(\w+):/);
    return m && !existingAnchorKeys.has(m[1]);
});

if (newUniqueLines.length === 0) {
    console.log('[No new anchors — all already present in Layout.js]');
    process.exit(0);
}

const newBlockContent = existingBlock.trimEnd() + '\n' + newUniqueLines.join(',\n') + '\n    ';
const updatedSource = layoutSource.replace(blockRegex, `$1${newBlockContent}$3`);

writeFileSync(LAYOUT_PATH, updatedSource, 'utf-8');
console.log(`✓ ${newUniqueLines.length} ancre(s) ajoutée(s) dans Layout.js (mode ${spec.mode})`);
console.log(`  Ancres ignorées (déjà existantes) : ${anchorLines.length - newUniqueLines.length}`);

console.log('\n✓ Done. Relancer `npx vitest run` pour valider.');
