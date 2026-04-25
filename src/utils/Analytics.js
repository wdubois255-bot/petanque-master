// Analytics.js — Umami events wrapper (cookieless, RGPD/CNIL exempt).
//
// Le tag <script> Umami est injecte au build par vite.config.js si les env vars
// VITE_UMAMI_SCRIPT_URL et VITE_UMAMI_WEBSITE_ID sont definies. Sinon, window.umami
// reste undefined et tous les appels ci-dessous sont des no-ops silencieux.
//
// Avantage vs GA4 : pas de cookie depose, pas de PII, pas de banniere de consentement
// requise en France. Voir docs/lancement/UMAMI_SETUP.md pour l'install self-host.

const track = (event, props) => {
    if (typeof window !== 'undefined' && typeof window.umami?.track === 'function') {
        try { window.umami.track(event, props); } catch (_) { /* analytics non bloquant */ }
    }
};

export function trackMatchStart({ terrain, difficulty, mode, playerChar, opponentChar }) {
    track('match_start', {
        terrain,
        difficulty,
        mode,
        player_char: playerChar || 'rookie',
        opponent_char: opponentChar || 'unknown'
    });
}

export function trackMatchComplete({ won, playerScore, opponentScore, terrain, mode, durationSec, carreaux, biberons, galetsEarned }) {
    track('match_complete', {
        won: won ? 1 : 0,
        player_score: playerScore,
        opponent_score: opponentScore,
        terrain,
        mode,
        duration_sec: durationSec,
        carreaux,
        biberons,
        galets_earned: galetsEarned
    });
}

export function trackMenuClick(item) {
    track('menu_click', { menu_item: item });
}

export function trackShopView() {
    track('shop_view');
}

export function trackPurchase({ itemId, itemType, priceGalets }) {
    track('purchase', {
        item_id: itemId,
        item_type: itemType,
        price_galets: priceGalets,
        currency: 'galets'
    });
}

export function trackItemEquipped({ itemId, itemType }) {
    track('item_equipped', { item_id: itemId, item_type: itemType });
}

export function trackUnlock(itemId) {
    track('item_unlocked', { item_id: itemId });
}

export function trackArcadeRound({ round, won, cumulWins }) {
    track('arcade_round', {
        round_number: round,
        won: won ? 1 : 0,
        cumul_wins: cumulWins
    });
}
