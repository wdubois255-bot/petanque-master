#!/usr/bin/env node
/**
 * Analyse les feedbacks Petanque Master.
 *
 * Sources :
 * 1. Fichier JSON exporte depuis la console du navigateur
 *    (FeedbackWidget.getLocalFeedback() → copier/coller → feedback-export.json)
 * 2. Fichier CSV exporte depuis Google Sheets
 *    (Fichier → Telecharger → CSV)
 *
 * Usage :
 *   node scripts/analyze-feedback.js feedback-export.json
 *   node scripts/analyze-feedback.js feedback-export.csv
 *
 * Output : synthese lisible avec metriques cles.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const file = process.argv[2];
if (!file) {
    console.log(`
  Usage : node scripts/analyze-feedback.js <fichier.json|fichier.csv>

  Pour exporter depuis le navigateur :
    1. Ouvrir la console (F12)
    2. Taper : copy(JSON.stringify(FeedbackWidget.getLocalFeedback(), null, 2))
    3. Coller dans un fichier feedback-export.json

  Pour exporter depuis Google Sheets :
    1. Fichier → Telecharger → CSV
    2. Sauvegarder le fichier
`);
    process.exit(0);
}

const raw = readFileSync(resolve(file), 'utf-8');
let entries;

if (file.endsWith('.csv')) {
    entries = parseCSV(raw);
} else {
    entries = JSON.parse(raw);
}

if (!entries.length) {
    console.log('Aucun feedback trouve.');
    process.exit(0);
}

// ================================================================
// ANALYSE
// ================================================================
const total = entries.length;
const ratings = { good: 0, ok: 0, bad: 0, none: 0 };
const devices = { mobile: 0, desktop: 0, unknown: 0 };
const scenes = {};
const terrains = {};
const withComments = [];
const withErrors = [];

for (const e of entries) {
    // Rating
    const r = e.rating || (e.Rating || '').toLowerCase() || 'none';
    if (r in ratings) ratings[r]++;
    else ratings.none++;

    // Device
    const ctx = e.context || {};
    const device = ctx.device || e.Device || 'unknown';
    if (device in devices) devices[device]++;
    else devices.unknown++;

    // Scene
    const scene = ctx.scene || e.Scene || 'unknown';
    scenes[scene] = (scenes[scene] || 0) + 1;

    // Terrain
    const terrain = ctx.terrain || e.Terrain || null;
    if (terrain) terrains[terrain] = (terrains[terrain] || 0) + 1;

    // Comments
    const comment = e.comment || e.Comment || '';
    if (comment.trim()) withComments.push({ rating: r, comment: comment.trim(), scene, terrain, device });

    // Errors
    const errors = ctx.errors || [];
    const errorStr = e.Errors || '';
    if (errors.length > 0 || errorStr) {
        withErrors.push({ errors: errors.length > 0 ? errors : errorStr, scene, device });
    }
}

// ================================================================
// OUTPUT
// ================================================================
console.log(`
=====================================
  ANALYSE FEEDBACK — Petanque Master
=====================================

Total feedbacks : ${total}

--- RATINGS ---
  Super !  : ${ratings.good} (${pct(ratings.good, total)})
  Correct  : ${ratings.ok} (${pct(ratings.ok, total)})
  Bof...   : ${ratings.bad} (${pct(ratings.bad, total)})
  Sans avis: ${ratings.none} (${pct(ratings.none, total)})

  Score satisfaction : ${satisfactionScore(ratings)}

--- DEVICES ---
  Desktop : ${devices.desktop} (${pct(devices.desktop, total)})
  Mobile  : ${devices.mobile} (${pct(devices.mobile, total)})

--- SCENES (ou le feedback a ete donne) ---
${Object.entries(scenes).sort((a, b) => b[1] - a[1]).map(([s, n]) => `  ${s} : ${n}`).join('\n')}

--- TERRAINS MENTIONNES ---
${Object.keys(terrains).length > 0
    ? Object.entries(terrains).sort((a, b) => b[1] - a[1]).map(([t, n]) => `  ${t} : ${n}`).join('\n')
    : '  (aucun — feedbacks donnes hors match)'}
`);

if (withComments.length > 0) {
    console.log(`--- COMMENTAIRES (${withComments.length}) ---`);
    for (const c of withComments) {
        const emoji = c.rating === 'good' ? '+' : c.rating === 'bad' ? '-' : '~';
        console.log(`  [${emoji}] ${c.comment}`);
        if (c.terrain) console.log(`      (${c.scene}, ${c.terrain}, ${c.device})`);
    }
    console.log();
}

if (withErrors.length > 0) {
    console.log(`--- ERREURS SIGNALEES (${withErrors.length} feedbacks avec erreurs) ---`);
    for (const e of withErrors) {
        const errs = Array.isArray(e.errors) ? e.errors.map(x => x.msg || x).join('; ') : e.errors;
        console.log(`  [${e.scene}/${e.device}] ${errs}`);
    }
    console.log();
}

// Recommendations
console.log('--- RECOMMANDATIONS ---');
if (ratings.bad > total * 0.3) {
    console.log('  /!\\ Plus de 30% de "Bof" — probleme UX majeur a investiguer.');
}
if (ratings.bad > 0) {
    const badComments = withComments.filter(c => c.rating === 'bad');
    if (badComments.length > 0) {
        console.log('  Commentaires negatifs a prioriser :');
        for (const c of badComments) console.log(`    - "${c.comment}"`);
    }
}
if (devices.mobile > 0 && devices.mobile > devices.desktop) {
    console.log('  Majorite mobile — prioriser les fixes touch/mobile.');
}
if (withErrors.length > total * 0.2) {
    console.log('  /!\\ >20% des feedbacks contiennent des erreurs JS — fix technique urgent.');
}
if (ratings.good > total * 0.6) {
    console.log('  Le jeu plait ! Passer a la publication itch.io.');
}
if (total < 5) {
    console.log('  Pas assez de feedbacks pour conclure. Viser 10+ avant de decider.');
}
console.log();

// ================================================================
// HELPERS
// ================================================================
function pct(n, t) { return t > 0 ? `${Math.round(n / t * 100)}%` : '0%'; }

function satisfactionScore(r) {
    const scored = r.good * 2 + r.ok * 1 + r.bad * 0;
    const maxScore = (r.good + r.ok + r.bad) * 2;
    if (maxScore === 0) return 'N/A';
    const pct = Math.round(scored / maxScore * 100);
    if (pct >= 75) return `${pct}% — Excellent`;
    if (pct >= 50) return `${pct}% — Correct`;
    if (pct >= 25) return `${pct}% — Problematique`;
    return `${pct}% — Critique`;
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
        const vals = line.match(/(".*?"|[^,]*)/g) || [];
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = (vals[i] || '').replace(/^"|"$/g, '').trim();
        });
        // Map CSV columns to expected structure
        return {
            rating: (obj['Rating'] || 'none').toLowerCase(),
            comment: obj['Comment'] || '',
            timestamp: obj['Timestamp'] || '',
            context: {
                scene: obj['Scene'] || '',
                terrain: obj['Terrain'] || '',
                scores: {
                    player: obj['Score Player'] ? parseInt(obj['Score Player']) : null,
                    opponent: obj['Score Opponent'] ? parseInt(obj['Score Opponent']) : null
                },
                opponent: obj['Opponent'] || '',
                mene: obj['Mene'] || null,
                device: (obj['Device'] || '').toLowerCase(),
                screen: obj['Screen'] || '',
                lang: obj['Language'] || '',
                arcadeProgress: obj['Arcade Progress'] ? parseInt(obj['Arcade Progress']) : 0,
                totalMatches: obj['Total Matches'] ? parseInt(obj['Total Matches']) : 0,
                totalWins: obj['Total Wins'] ? parseInt(obj['Total Wins']) : 0,
                playtime: obj['Playtime (s)'] ? parseInt(obj['Playtime (s)']) : 0,
                errors: obj['Errors'] ? [{ msg: obj['Errors'] }] : [],
                userAgent: obj['User Agent'] || ''
            }
        };
    });
}
