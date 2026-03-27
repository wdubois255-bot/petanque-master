/**
 * Google Apps Script — a deployer dans Google Sheets
 *
 * SETUP (5 minutes) :
 *
 * 1. Creer un Google Sheet vierge (https://sheets.new)
 * 2. Aller dans Extensions → Apps Script
 * 3. Coller TOUT le code ci-dessous dans l'editeur
 * 4. Cliquer Deployer → Nouveau deploiement
 *    - Type : Application Web
 *    - Executer en tant que : Moi
 *    - Qui a acces : Tout le monde
 * 5. Copier l'URL du deploiement (ressemble a https://script.google.com/macros/s/XXXX/exec)
 * 6. Coller cette URL dans src/utils/Constants.js a la place de PLACEHOLDER :
 *      export const FEEDBACK_URL = 'https://script.google.com/macros/s/XXXX/exec';
 *
 * Chaque feedback du widget arrivera comme une nouvelle ligne dans le Sheet.
 */

// ============================================================
// COPIER CI-DESSOUS DANS GOOGLE APPS SCRIPT
// ============================================================

/*

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Create header row if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Rating',
        'Comment',
        'Scene',
        'Terrain',
        'Score Player',
        'Score Opponent',
        'Opponent',
        'Mene',
        'Device',
        'Screen',
        'Language',
        'Arcade Progress',
        'Total Matches',
        'Total Wins',
        'Playtime (s)',
        'Errors',
        'User Agent'
      ]);
      // Bold header
      sheet.getRange(1, 1, 1, 18).setFontWeight('bold');
      // Freeze header row
      sheet.setFrozenRows(1);
    }

    var ctx = data.context || {};
    var scores = ctx.scores || {};
    var errors = (ctx.errors || []).map(function(e) { return e.msg; }).join(' | ');

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.rating || 'none',
      data.comment || '',
      ctx.scene || '',
      ctx.terrain || '',
      scores.player != null ? scores.player : '',
      scores.opponent != null ? scores.opponent : '',
      ctx.opponent || '',
      ctx.mene != null ? ctx.mene : '',
      ctx.device || '',
      ctx.screen || '',
      ctx.lang || '',
      ctx.arcadeProgress != null ? ctx.arcadeProgress : '',
      ctx.totalMatches != null ? ctx.totalMatches : '',
      ctx.totalWins != null ? ctx.totalWins : '',
      ctx.playtime != null ? ctx.playtime : '',
      errors,
      (ctx.userAgent || '').substring(0, 100)
    ]);

    // Return success with CORS headers
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ready', message: 'Petanque Master Feedback endpoint' }))
    .setMimeType(ContentService.MimeType.JSON);
}

*/
