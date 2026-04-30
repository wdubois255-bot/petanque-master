# Process de release Petanque Master

## TL;DR

```bash
# Bumper la version dans package.json (major.minor.patch)
# Lancer le pipeline complet :
npm run release

# Si ca passe → upload le zip genere sur itch.io (cf. checklist a la fin)
```

## Versioning (semver)

- **patch** (1.2.0 → 1.2.1) : bug fix, hotfix, pas de changement visible joueur
- **minor** (1.2.0 → 1.3.0) : nouvelle feature, polish notable, equilibrage
- **major** (1.x.x → 2.0.0) : refonte gameplay, breaking save format

Le tag git est `vX.Y.Z` (avec le `v`).

## Pipeline `npm run release`

1. **Lint** (`eslint src/`) — doit passer sans erreur (warnings tolérés)
2. **Tests** (`npm test`) — 3167/3167 doivent passer
3. **Build** (`vite build`) — produit `dist/`
4. **Zip** — produit `petanque-master-vX.Y.Z.zip` à la racine
5. **Checklist affichée** — sanity check + tag + upload itch.io

Si une étape échoue, le pipeline s'arrête. Pas de zip produit.

## Variantes

```bash
npm run release              # standalone (itch.io)
npm run release:crazygames   # injecte CrazyGames SDK
npm run release:poki         # injecte Poki SDK
```

Les builds portails ont leur propre suffixe : `petanque-master-v1.2.0-poki.zip`.

## Variables d'environnement

Lues par Vite au build et embarquées dans le bundle (préfixe `VITE_`) :

| Variable | Effet si absente | Effet si presente |
|----------|------------------|-------------------|
| `VITE_UMAMI_SCRIPT_URL` | Pas d'analytics | Charge le script Umami au boot |
| `VITE_UMAMI_WEBSITE_ID` | Pas d'analytics | Identifiant site Umami |
| `VITE_PLATFORM` | standalone | Injecte le SDK portail (crazygames/poki) |

Mettre dans `.env` (gitignored) pour le build local. Pour CI : GitHub Repo → Settings → Secrets and variables → Actions.

## Sanity check après build

Avant d'upload sur itch.io, **toujours** :

```bash
npm run preview
```

Puis :
- Ouvrir http://localhost:4173
- F12 → console
- Jouer 1 match Quick Play complet (terrain → match → résultat → level up)
- Vérifier 0 erreur CSP rouge
- Vérifier que la sauvegarde (galets, déblocages) est intacte après reload

Si la console est propre → tu peux upload.

## Tag git de la release

```bash
git tag -a v1.2.0 -m "Release v1.2.0 — securite + privacy + Umami"
git push origin v1.2.0
```

Permet de retrouver précisément la version en cas de hotfix.

## Upload itch.io

1. https://itch.io/dashboard → ton jeu → **Edit game**
2. Section **Uploads** → drag & drop `petanque-master-vX.Y.Z.zip`
3. Cocher **"This file will be played in the browser"**
4. Cocher **"Fullscreen button"** et **"Mobile friendly"**
5. Dimensions : `832 x 480` (desktop), laisser auto pour mobile
6. **Save** (l'URL du jeu reste la même, l'ancienne version est remplacée)
7. (Optionnel) Onglet **Devlog** → New devlog post → annoncer la release

L'ancien zip reste sauvegardé dans l'historique des uploads itch.io — on peut rollback si besoin.

## Hotfix (régression critique en prod)

```bash
# Sur master, fixer le bug
git commit -m "fix: ..."

# Bump patch
# package.json: 1.2.0 → 1.2.1

npm run release
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin v1.2.1
# Upload sur itch.io comme d'habitude
```

## Rollback

Sur la page itch.io → **Edit game** → **Uploads** → trouver le zip précédent → cliquer dessus pour le marquer "primary". L'ancien build reprend le dessus en quelques minutes (cache CDN).

## CI (futur)

Aujourd'hui : release manuelle locale.

Évolution possible : pousser un tag `vX.Y.Z` déclenche un GitHub Action qui build + zip + upload sur itch.io via [butler](https://itch.io/docs/butler/) (CLI itch.io). Voir [.github/workflows/](../../.github/workflows/) pour ajouter quand on en aura besoin.

Pour l'instant le manuel suffit — moins de magie, plus de contrôle, et on voit le zip avant qu'il parte.
