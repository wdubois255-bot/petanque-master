# Umami self-hosted — guide d'install (15 min)

## Pourquoi Umami plutot que GA4

| | GA4 | Umami |
|---|---|---|
| Cookies | Oui (`_ga`, `_gid`) | Aucun |
| RGPD/CNIL | Banniere consentement obligatoire en France | **Exempt** (pas de PII, pas de cookie) |
| Donnees apres opt-in | ~20% des visiteurs | 100% |
| Hebergement | Google | Toi (free tier Vercel + Neon) |
| Cout | Gratuit (mais cookies → conformite) | Gratuit (self-host) ou 9 €/mois (cloud) |

## Architecture cible (free tier 100% gratuit)

```
[Joueurs] ──script.js──> [Vercel (Umami webapp Node.js)] ──SQL──> [Neon (Postgres)]
```

- **Vercel** : Hobby tier suffisant (100 GB bandwidth/mois)
- **Neon** : 0.5 GB Postgres gratuit (suffit pour ~5M events)

## Etape 1 — Provisionner la base (Neon, 5 min)

1. https://neon.tech → Sign up (GitHub OAuth)
2. Create project → name `umami` → region `eu-central-1` (Francfort, latence basse depuis FR)
3. Copier la connection string (commence par `postgresql://...`)

## Etape 2 — Deployer Umami sur Vercel (5 min)

1. https://vercel.com → New Project → Import Git Repository
2. Repository : `https://github.com/umami-software/umami` → Fork puis Import
3. Framework : Next.js (auto-detect)
4. Environment Variables :
   ```
   DATABASE_URL = (ta connection string Neon de l'etape 1)
   APP_SECRET   = (genere une chaine aleatoire 32+ chars : openssl rand -hex 32)
   ```
5. Deploy

Apres deploy : `https://ton-projet.vercel.app/` → login admin / umami → **change le mot de passe immediatement**.

## Etape 3 — Creer le site dans Umami (1 min)

1. Settings → Websites → Add website
2. Name : `Petanque Master`
3. Domain : `wdubois255-bot.itch.io` (ou ton domaine prod)
4. Save → noter le **Website ID** (UUID)

## Etape 4 — Configurer le jeu (2 min)

Dans `.env` (gitignored) a la racine du projet :
```
VITE_UMAMI_SCRIPT_URL=https://ton-projet.vercel.app/script.js
VITE_UMAMI_WEBSITE_ID=le-uuid-de-l-etape-3
```

Pour le build CI (GitHub Actions deploy.yml) → ajouter ces vars dans Repo Settings → Secrets and variables → Actions :
- `VITE_UMAMI_SCRIPT_URL`
- `VITE_UMAMI_WEBSITE_ID`

Et reference-les dans `.github/workflows/deploy.yml` :
```yaml
- run: npm run build
  env:
    VITE_UMAMI_SCRIPT_URL: ${{ secrets.VITE_UMAMI_SCRIPT_URL }}
    VITE_UMAMI_WEBSITE_ID: ${{ secrets.VITE_UMAMI_WEBSITE_ID }}
```

## Etape 5 — Tester (2 min)

1. `npm run build && npm run preview` localement
2. Ouvre la page, joue un peu
3. Dashboard Umami → tu vois la pageview en quasi temps reel

## Events custom deja branches

Le wrapper `src/utils/Analytics.js` envoie ces events sans rien faire de plus :

| Event | Trigger |
|-------|---------|
| `match_start` | Debut d'une partie (Quick Play / Arcade) |
| `match_complete` | Fin de match (won/lost, scores, duration) |
| `menu_click` | Clic dans un menu principal |
| `shop_view` | Ouverture de la boutique |
| `purchase` | Achat d'un item (boule/cochonnet/capacite) |
| `item_equipped` | Equipement d'un item |
| `item_unlocked` | Deblocage (perso/terrain) |
| `arcade_round` | Fin d'une manche arcade |

Dans le dashboard Umami : Events → tu vois le funnel complet.

## Couts a long terme

- **Neon free** : 0.5 GB. Avec ~100 events/match et 1k matchs/jour → tu es a ~30 MB/mois. **Tu tiens 16 mois minimum** sans payer.
- **Vercel Hobby** : 100 GB bandwidth/mois → meme avec 100k pageviews/mois tu es loin du plafond.
- Si depassement : Vercel Pro = 20 USD/mois, Neon Launch = 19 USD/mois. Mais tu seras alors a 50k joueurs/mois minimum.

## Filet de securite

Si Umami down (Vercel/Neon outage), `window.umami?.track(...)` est juste no-op. **Le jeu ne plante pas, ne ralentit pas.** L'analytics est strictement bonus.

## Migration future vers Plausible (optionnel)

Si Umami devient limitant (ex : tu veux des goals funnels visuels) :
- Plausible self-host = Go + ClickHouse + Postgres (plus lourd)
- Plausible Cloud = 9 USD/mois pour 10k pageviews
- Switch = changer 2 env vars + remplacer `window.umami.track` par `window.plausible` dans `Analytics.js` (10 lignes)

Le decouplage est volontaire : `Analytics.js` masque le provider, le jeu ne sait pas qui collecte.
