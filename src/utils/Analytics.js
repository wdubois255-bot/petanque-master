// Analytics.js — GA4 custom events wrapper
// Guard: si gtag n'est pas chargé (dev offline, tests), silencieux

const g = (...args) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
        window.gtag(...args);
    }
};

export function trackMatchStart({ terrain, difficulty, mode, playerChar, opponentChar }) {
    g('event', 'match_start', {
        terrain,
        difficulty,
        mode,
        player_char: playerChar || 'rookie',
        opponent_char: opponentChar || 'unknown'
    });
}

export function trackMatchComplete({ won, playerScore, opponentScore, terrain, mode, durationSec, carreaux, biberons, galetsEarned }) {
    g('event', 'match_complete', {
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
    g('event', 'menu_click', { menu_item: item });
}

export function trackShopView() {
    g('event', 'shop_view', {});
}

export function trackPurchase({ itemId, itemType, priceGalets }) {
    g('event', 'purchase', {
        item_id: itemId,
        item_type: itemType,
        price_galets: priceGalets,
        currency: 'galets'
    });
}

export function trackItemEquipped({ itemId, itemType }) {
    g('event', 'item_equipped', { item_id: itemId, item_type: itemType });
}

export function trackUnlock(itemId) {
    g('event', 'item_unlocked', { item_id: itemId });
}

export function trackArcadeRound({ round, won, cumulWins }) {
    g('event', 'arcade_round', {
        round_number: round,
        won: won ? 1 : 0,
        cumul_wins: cumulWins
    });
}
