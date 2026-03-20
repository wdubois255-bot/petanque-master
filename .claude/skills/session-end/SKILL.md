---
name: session-end
description: Terminer proprement une session de travail. Commit tout, lance les tests, met a jour l'etat du projet et la memoire, liste les priorites suivantes.
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

### 4. Mettre a jour la memoire projet
Lire `project_state.md` dans le dossier memoire Claude Code.
Le mettre a jour avec :
- Ce qui a ete fait dans cette session (liste courte)
- Bugs connus non corriges
- Les 3 prochaines priorites
- Decisions prises pendant la session

### 5. Mettre a jour CAHIER_DES_CHARGES.md
Cocher les items termines. Ajouter les nouveaux items decouverts.

### 6. Mettre a jour docs/MASTER_PLAN.md
Si des items de la roadmap ont ete completes, les marquer.

### 7. Rapport de fin
```
Fin de session — [date]
Commits cette session : [nombre]
Tests : [X/X pass]
Items completes : [liste]
Prochaines priorites :
  1. [priorite 1]
  2. [priorite 2]
  3. [priorite 3]
```
