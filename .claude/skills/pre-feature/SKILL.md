---
name: pre-feature
description: Planifier une feature avant de coder. Lit le code existant, identifie les fichiers impactes, propose un plan. Utiliser AVANT toute implementation.
user-invocable: true
argument-hint: "[description de la feature]"
allowed-tools: Read, Glob, Grep, Agent
---

# Pre-Feature : Planification avant implementation

## Etapes obligatoires AVANT de coder

1. **Comprendre la demande** : reformuler en 1 phrase ce que `$ARGUMENTS` doit faire
2. **Lire le code existant** : identifier tous les fichiers qui seront modifies
3. **Lire les tests existants** : identifier les tests qui couvrent ces fichiers (`tests/`)
4. **Identifier les constantes** : quelles nouvelles constantes dans `src/utils/Constants.js` ?
5. **Identifier les donnees** : quels JSON dans `public/data/` seront impactes ?
6. **Verifier les contradictions** : la feature est-elle coherente avec `GAME_DESIGN.md` ?
7. **Verifier le PLAN_100** : la feature est-elle deja decrite dans `docs/PLAN_100.md` ? Si oui, suivre ses instructions.
8. **Proposer un plan** : liste ordonnee des modifications, fichier par fichier

## Format de sortie

```markdown
## Plan : [nom de la feature]

### Resume
[1 phrase : ce que ca fait pour le joueur]

### Fichiers a modifier (dans l'ordre)
1. `fichier.js` — [ce qui change]
2. ...

### Nouvelles constantes (Constants.js)
- NOM_CONSTANTE = valeur (justification)

### Donnees JSON impactees
- fichier.json : [ce qui change]

### Tests a ecrire/modifier
- test_fichier.test.js : [ce qui est teste]

### Risques identifies
- [risque] → [mitigation]

### Estimation
- [X minutes/heures]
```

**IMPORTANT** : Ne pas commencer a coder. Presenter le plan et attendre validation du user.
