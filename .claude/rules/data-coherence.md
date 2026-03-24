---
globs: ["public/data/**/*.json", "src/utils/Constants.js"]
---

# Regles de coherence donnees

AVANT de modifier ce fichier, VERIFIER systematiquement :

1. **Terrains** : Les IDs dans terrains.json correspondent aux cles TERRAIN_FRICTION dans Constants.js (terre, herbe, sable, dalles). Les friction values doivent etre coherentes.
2. **Personnages** : Stats dans characters.json entre 1 et 10. Chaque perso a : id, name, stats, ability.
3. **Boutique** : Prix en Galets (PAS Ecus). Chaque item boule reference un ID existant dans boules.json.
4. **Arcade** : Tous les opponent IDs existent dans characters.json. Tous les terrain IDs existent dans terrains.json.
5. **Constantes** : JAMAIS de valeur hardcodee — tout dans Constants.js.

En cas de doute, lancer `npx vitest run TerrainValidation` pour valider.
