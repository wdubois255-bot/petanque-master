# 41 — Analytics & Player Data

> A lire quand : on veut mesurer le comportement des joueurs, optimiser la retention, ou prendre des decisions data-driven.

---

## 1. POURQUOI TRACKER

"On ne peut pas ameliorer ce qu'on ne mesure pas."

L'analytics repond a 3 questions :
1. **Les joueurs s'amusent-ils ?** (engagement, retention)
2. **Ou est-ce qu'ils decrochent ?** (funnels, drop-off)
3. **Qu'est-ce qui marche le mieux ?** (contenus populaires, balancing)

---

## 2. SOLUTION TECHNIQUE

### 2.1 Options evaluees

| Solution | Prix | Complexite | Respect vie privee | Verdict |
|----------|------|-----------|-------------------|---------|
| **Plausible Analytics** | 9€/mo (cloud) ou gratuit (self-host) | Faible | Excellent (EU, no cookies) | ✅ Recommande |
| Google Analytics 4 | Gratuit | Moyen | Moyen (RGPD complexe) | Possible |
| Mixpanel | Gratuit < 100k events/mo | Moyen | Bon | Alternative |
| PostHog | Gratuit (self-host) ou cloud | Moyen | Excellent (EU option) | Alternative |
| Custom (localStorage + export) | Gratuit | Faible | Parfait | MVP minimal |

### 2.2 Recommandation : approche hybride

**Phase 1 (MVP)** : analytics local (localStorage) — zero dependance externe
**Phase 2 (lancement)** : Plausible Analytics (respectueux RGPD, leger, pas de cookies)
**Phase 3 (scale)** : PostHog ou Mixpanel pour les funnels avances

### 2.3 Implementation MVP (localStorage)

```javascript
// src/utils/AnalyticsManager.js
class AnalyticsManager {
  static events = JSON.parse(localStorage.getItem('analytics') || '[]');

  static track(eventName, data = {}) {
    this.events.push({
      event: eventName,
      timestamp: Date.now(),
      ...data
    });
    // Limiter a 1000 events (FIFO)
    if (this.events.length > 1000) this.events.shift();
    localStorage.setItem('analytics', JSON.stringify(this.events));
  }

  static getStats() {
    return {
      totalSessions: this.events.filter(e => e.event === 'session_start').length,
      totalMatches: this.events.filter(e => e.event === 'match_end').length,
      avgSessionLength: this._avgSessionLength(),
      // ... calculs
    };
  }

  // Export pour analyse manuelle (dev tools)
  static export() {
    const blob = new Blob([JSON.stringify(this.events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'analytics.json'; a.click();
  }
}
```

---

## 3. EVENEMENTS A TRACKER

### 3.1 Evenements de session

| Evenement | Donnees | Pourquoi |
|-----------|---------|----------|
| `session_start` | timestamp, platform, screen_size | Comptage sessions, devices |
| `session_end` | duration_seconds | Duree moyenne de session |
| `first_launch` | — | Acquisition, premiere ouverture |
| `tutorial_step` | step_number (0-4) | Ou les joueurs decrochent dans le tuto |
| `tutorial_complete` | — | Taux de completion du tutoriel |

### 3.2 Evenements de navigation

| Evenement | Donnees | Pourquoi |
|-----------|---------|----------|
| `scene_enter` | scene_name | Funnels de navigation |
| `menu_click` | button_name | Quels boutons sont utilises |
| `char_select` | character_id | Perso le plus populaire |
| `terrain_select` | terrain_id | Terrain le plus populaire |
| `shop_view` | — | Interet pour la boutique |
| `shop_purchase` | item_id, price | Quoi est achete |

### 3.3 Evenements de gameplay

| Evenement | Donnees | Pourquoi |
|-----------|---------|----------|
| `match_start` | mode, character, terrain, opponent, difficulty | Configuration des matchs |
| `match_end` | result (win/lose), score_player, score_opponent, duration, menes | Performance et difficulte |
| `throw` | loft_type, power, distance_cochonnet, is_carreau | Analyse des lancers |
| `carreau` | character, terrain | Frequence des carreaux |
| `focus_used` | charges_remaining | Usage du focus |
| `ability_used` | ability_name | Usage des capacites |
| `mene_end` | score_gained, total_boules_closer | Analyse des menes |

### 3.4 Evenements de progression

| Evenement | Donnees | Pourquoi |
|-----------|---------|----------|
| `rookie_levelup` | new_total_points, stat_chosen | Comment les joueurs buildent |
| `unlock` | item_type, item_id | Rythme de deblocage |
| `ecus_earned` | amount, source | Economie du jeu |
| `ecus_spent` | amount, item_id | Economie du jeu |
| `arcade_progress` | round_number, result | Progression arcade |
| `arcade_complete` | is_perfect, total_attempts | Difficulte globale |

### 3.5 Evenements d'erreur

| Evenement | Donnees | Pourquoi |
|-----------|---------|----------|
| `error` | message, stack, scene | Bugs en production |
| `crash` | message, scene, game_state | Crashes critiques |
| `perf_warning` | fps, heap_mb | Problemes de performance |

---

## 4. METRIQUES DERIVEES (KPIs)

### 4.1 Engagement

| KPI | Formule | Cible |
|-----|---------|-------|
| DAU (Daily Active Users) | Sessions uniques/jour | Croissance |
| Session length | Moyenne `session_end.duration` | > 8 min |
| Matches per session | `match_end.count / session_start.count` | > 2 |
| Actions per match | `throw.count / match_end.count` | Info |

### 4.2 Retention

| KPI | Formule | Cible |
|-----|---------|-------|
| D1 retention | Users jour 2 / Users jour 1 | > 40% |
| D7 retention | Users jour 8 / Users jour 1 | > 15% |
| D30 retention | Users jour 31 / Users jour 1 | > 5% |
| Churn point | Premier jour ou > 50% des joueurs quittent | Identifier et corriger |

### 4.3 Monetisation (Phase 2+)

| KPI | Formule | Cible |
|-----|---------|-------|
| Conversion rate | Paying users / Total users | > 2% (F2P) |
| ARPU | Revenue / Users | > 0.50€ |
| ARPPU | Revenue / Paying users | > 5€ |

### 4.4 Gameplay balance

| KPI | Formule | Cible |
|-----|---------|-------|
| Win rate par perso | Victoires perso / Total matchs perso | 45-55% (equilibre) |
| Win rate par terrain | Victoires joueur / Total matchs terrain | 45-55% |
| Carreau frequency | Carreaux / Total lancers | 5-10% |
| Match duration | Moyenne minutes | 5-10 min |
| Score moyen | Moyenne score gagnant | 13 (victoire) |
| Closest match | % de matchs finissant 13-12 ou 13-11 | 20-30% (suspense) |

---

## 5. FUNNELS CRITIQUES

### 5.1 Funnel d'onboarding

```
100% — Premier lancement
 │
 ├── ?% — Clique "Arcade"
 ├── ?% — Finit le tutoriel (etape 5/5)
 ├── ?% — Gagne le premier match
 ├── ?% — LevelUp le Rookie
 └── ?% — Lance un deuxieme match
```

**Action** : si le drop est > 50% entre "Premier lancement" et "Clique Arcade", le menu pose probleme.

### 5.2 Funnel Arcade

```
100% — Commence l'Arcade
 │
 ├── ?% — Gagne Round 1 (La Choupe)
 ├── ?% — Gagne Round 2 (Marcel)
 └── ?% — Gagne Round 3 (Le Magicien)
```

**Action** : si < 30% finissent le Round 3, Le Magicien est trop dur.

### 5.3 Funnel boutique

```
100% — Ouvre la boutique
 │
 ├── ?% — Regarde un item
 ├── ?% — A assez d'Ecus pour l'acheter
 └── ?% — Achete
```

---

## 6. DASHBOARD (Phase 2)

### 6.1 Vue d'ensemble

```
┌──── ANALYTICS DASHBOARD ──────────────────────┐
│                                                 │
│  DAU: 142    Sessions today: 234   Avg: 9.2min │
│                                                 │
│  Retention          Funnel Arcade               │
│  D1: 42% ✅        Start:  100%                │
│  D7: 18% ✅        R1 win:  78%                │
│  D30: 6% ✅        R2 win:  61%                │
│                     R3 win:  34% ⚠️             │
│                                                 │
│  Top persos         Top terrains                │
│  1. Rookie (38%)    1. Village (32%)            │
│  2. Ley (24%)       2. Parc (28%)              │
│  3. Marcel (18%)    3. Colline (22%)            │
│  4. Choupe (12%)    4. Plage (10%)             │
│  5. Magicien (8%)   5. Docks (8%)             │
│                                                 │
│  Win rate / perso   Avg match duration          │
│  Ley: 58% ⚠️       7.3 min ✅                  │
│  Marcel: 51% ✅     (cible: 5-10 min)          │
│  Choupe: 47% ✅                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6.2 Actions correctives par KPI

| KPI hors cible | Diagnostic probable | Action |
|----------------|-------------------|--------|
| D1 < 30% | Le jeu ne captive pas d'entree | Ameliorer le tutoriel, le game feel du premier lancer |
| Session < 5 min | Le jeu lasse vite | Plus de variete, feedback plus satisfaisant |
| Arcade R3 < 25% | Trop difficile | Baisser Le Magicien d'un cran |
| Ley win rate > 55% | Ley est OP | Nerf precision ou puissance |
| Docks played < 5% | Terrain impopulaire | Revoir la physique ou le visuel |
| Shop conversion < 5% | Les prix sont trop eleves | Baisser les prix ou augmenter les gains |

---

## 7. VIE PRIVEE ET RGPD

### 7.1 Regles

| Regle | Implementation |
|-------|---------------|
| **Pas de donnees personnelles** | Pas de nom, email, IP, device ID |
| **Pas de cookies tiers** | Plausible = cookieless |
| **Consentement** | Bandeau opt-in pour les analytics (sauf Plausible cookieless) |
| **Droit a l'effacement** | Bouton "Supprimer mes donnees" dans Options |
| **Localisation des donnees** | Serveur EU (Plausible = EU natif) |
| **Minimisation** | Ne tracker que ce qui est utile |

### 7.2 Bandeau de consentement

```
┌──────────────────────────────────────────────────┐
│ Nous utilisons des statistiques anonymes pour     │
│ ameliorer le jeu. Aucune donnee personnelle.      │
│                                                   │
│ [Accepter]  [Refuser]  [En savoir plus]          │
└──────────────────────────────────────────────────┘
```

Si refuse : desactiver tout tracking externe. Le tracking local (localStorage) ne necessite pas de consentement (donnees locales uniquement).

### 7.3 Anonymisation

```javascript
// Generer un ID anonyme (pas lié à l'identite)
const anonymousId = crypto.randomUUID(); // Regeneré si localStorage efface
// Jamais transmis a un tiers dans le MVP
```

---

## 8. IMPLEMENTATION PAR PHASE

### Phase 1 — MVP (0€, localStorage)
- AnalyticsManager basique (localStorage)
- Events : session, match, progression
- Export JSON pour analyse manuelle
- Pas de serveur, pas de RGPD

### Phase 2 — Lancement (9€/mo, Plausible)
- Plausible Analytics (pageviews + custom events)
- Dashboard basic automatique
- Funnels manuels
- Bandeau consentement

### Phase 3 — Scale (gratuit/29€/mo, PostHog)
- PostHog self-hosted ou cloud
- Funnels automatiques
- Cohort analysis
- A/B testing (titres, prix, difficulte)
- Heatmaps (si pertinent)

---

## 9. A/B TESTING (Phase 3)

### Tests a mener

| Test | Variante A | Variante B | Metrique |
|------|-----------|-----------|----------|
| Difficulte R1 | IA facile (actuel) | IA tres facile | Win rate R1 |
| Prix cochonnet | 50 Ecus | 30 Ecus | Shop conversion |
| Tutoriel | Avec guide (actuel) | Sans guide | Tutorial completion |
| Prediction | Visible (actuel) | Cachee | Session length |
| Ecus victoire | 50 Ecus | 80 Ecus | D7 retention |

### Implementation simple

```javascript
// A/B test basique
const variant = localStorage.getItem('ab_test_r1_difficulty')
  || (Math.random() < 0.5 ? 'A' : 'B');
localStorage.setItem('ab_test_r1_difficulty', variant);

if (variant === 'B') {
  // IA tres facile
  aiDifficulty = 'very_easy';
}

AnalyticsManager.track('ab_test', { test: 'r1_difficulty', variant });
```
