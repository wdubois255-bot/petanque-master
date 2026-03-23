---
name: session-end
description: Terminer proprement une session de travail. Commit tout, lance les tests, met a jour l'etat du projet et la memoire, genere le journal making-of, liste les priorites suivantes.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Session End : Cloture propre

## Etapes (dans l'ordre)

### 1. Verifier l'etat git
```bash
git status
git diff --stat
```

### 2. Commiter tout travail en cours
S'il reste des modifications non commitees, creer un commit avec message descriptif.

### 3. Lancer les tests
```bash
npx vitest run --reporter=dot 2>&1 | tail -5
```
Si des tests echouent, les corriger et re-commiter.

### 4. Generer le journal making-of de la session

**C'est l'etape cle pour la video making-of.** Generer un fichier dans `docs/making-of/sessions/`.

#### 4a. Collecter les infos de la session
```bash
# Trouver le dernier fichier session pour determiner le point de depart
ls -t docs/making-of/sessions/*.md 2>/dev/null | head -1

# Commits de la session (depuis le dernier journal ou les 24 dernieres heures)
git log --since="24 hours ago" --oneline --stat

# Stats globales du projet
git rev-list --count HEAD
wc -l src/**/*.js src/**/*.mjs 2>/dev/null | tail -1
find public/assets -name "*.png" 2>/dev/null | wc -l
```

#### 4b. Prendre un screenshot du jeu
```bash
node scripts/session-screenshot.mjs "docs/making-of/sessions/screenshot_$(date +%Y-%m-%d).png"
```
Note : si Playwright n'est pas dispo ou que le screenshot echoue, ce n'est PAS bloquant. Continuer sans.

#### 4c. Ecrire le fichier journal
Creer `docs/making-of/sessions/YYYY-MM-DD_session.md` (si le fichier existe deja, suffixer `_2`, `_3`, etc.) avec ce format :

```markdown
# Session du [DATE]

## Chiffres
- **Commits** : [N] commits ([hash_debut]...[hash_fin])
- **Fichiers modifies** : [N] fichiers ([+X] ajouts, [-Y] suppressions)
- **Total projet** : [N] commits, ~[N]k lignes, [N] assets

## Ce qui a ete fait
[Liste concise des realisations, orientee "histoire du projet" — pas technique mais narrative]
- ...
- ...

## Moments forts
[1-3 moments visuellement ou narrativement interessants pour la video]
- ...

## Decisions notables
[Choix de design, pivots, problemes resolus — le "pourquoi" derriere le code]
- ...

## Etat visuel
[Si screenshot disponible : ![Screenshot](screenshot_YYYY-MM-DD.png)]
[Sinon : decrire brievement l'etat visuel du jeu]

## Avant / Apres
[Si pertinent : decrire ce qui a change visuellement par rapport a la session precedente]
```

**Conseils pour un bon journal making-of :**
- Ecrire comme si on racontait l'histoire a un spectateur YouTube
- Privilegier le narratif ("on a decide de tout refaire les sprites parce que...") au technique
- Noter les galeres et les victoires — c'est ca qui fait une bonne video
- Mentionner les outils utilises (PixelLab, ElevenLabs, etc.) quand c'est pertinent

### 5. Mettre a jour la memoire projet
Lire `project_state.md` dans le dossier memoire Claude Code.
Le mettre a jour avec :
- Ce qui a ete fait dans cette session (liste courte)
- Bugs connus non corriges
- Les 3 prochaines priorites
- Decisions prises pendant la session

### 6. Mettre a jour CAHIER_DES_CHARGES.md
Cocher les items termines. Ajouter les nouveaux items decouverts.

### 7. Mettre a jour docs/PLAN_100.md
Si des taches du plan ont ete completees, les marquer.

### 8. Rapport de fin
```
Fin de session — [date]
Commits cette session : [nombre]
Tests : [X/X pass]
Journal making-of : docs/making-of/sessions/[fichier]
Items completes : [liste]
Prochaines priorites :
  1. [priorite 1]
  2. [priorite 2]
  3. [priorite 3]
```
