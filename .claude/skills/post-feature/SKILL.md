---
name: post-feature
description: Verifier une feature apres implementation. Lance les tests, verifie la coherence doc/code, met a jour la documentation. Utiliser APRES chaque implementation.
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Post-Feature : Verification apres implementation

## Checklist obligatoire (dans l'ordre)

### 1. Tests unitaires
```bash
npx vitest run --reporter=verbose 2>&1 | tail -20
```
Si des tests echouent, les corriger AVANT de continuer.

### 2. Recherche de debug oublie
```bash
grep -rn "console.log" src/ --include="*.js" | grep -v node_modules
```
Supprimer tout console.log trouve.

### 3. Coherence des donnees
Verifier que :
- Aucune valeur dans Constants.js ne contredit characters.json ou terrains.json
- Aucun nouveau `localStorage` direct (tout passe par SaveManager)
- Pas de `window.__variable` ajoute
- Chaque scene modifiee a un `init()` avec reset des flags

### 4. Mise a jour documentation
- Si une feature est terminee : cocher dans `CAHIER_DES_CHARGES.md`
- Si des valeurs numeriques ont change : verifier Constants.js
- Si un personnage a ete modifie : verifier characters.json

### 5. Commit
Commiter avec un message descriptif :
- `feat:` pour nouvelle feature
- `fix:` pour correction de bug
- `balance:` pour equilibrage
- `refactor:` pour reorganisation sans changement fonctionnel
- `chore:` pour maintenance (docs, config, tests)

### 6. Rapport
Afficher un resume :
```
Tests : [X/X pass]
Console.log : [aucun / X trouves et supprimes]
Coherence : [OK / problemes trouves]
Doc mise a jour : [fichiers modifies]
Commit : [hash] [message]
```
