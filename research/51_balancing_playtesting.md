# 51 — Balancing & Playtesting

> A lire quand : on ajuste les stats des persos, les prix, la difficulte IA, ou qu'on organise des sessions de test.
> Complementaire a : research/45 (progression), research/38 (retention), research/41 (analytics)

---

## 1. POURQUOI LE BALANCING EST CRITIQUE

Petanque Master a un **systeme interconnecte** ou tout s'influence :

```
Stats perso (PRE/PUI/EFF/SF)
     ↕
Capacites uniques
     ↕
Stats boules (friction_x, restitution_x)
     ↕
Proprietes terrains (friction, pente, zones)
     ↕
Niveaux d'IA (angleDev, strategie)
     ↕
Economie (Ecus, prix boutique, rythme deblocage)
     ↕
Progression Rookie (10→40 pts, repartition)
```

Un seul parametre mal calibre casse l'ensemble. Exemple : si le terrain Plage (friction 3.0) est trop punitif, personne ne le joue → les stats de jeu montrent 5% de matchs sur Plage → le contenu est gaspille.

---

## 2. FRAMEWORK DE BALANCING

### 2.1 Les 3 niveaux d'equilibrage

| Niveau | Ce qu'on equilibre | Methode | Frequence |
|--------|-------------------|---------|-----------|
| **Macro** | Est-ce que tous les persos sont viables ? Tous les terrains joues ? | Analytics (win rates, pick rates) | Apres chaque vague de joueurs |
| **Micro** | Est-ce que +1 Precision se sent ? Le tir est-il trop fort ? | Playtest cible, mesures precises | A chaque changement de stats |
| **Economie** | Les prix sont-ils justes ? Le grind est-il raisonnable ? | Simulation + playtest | Avant le lancement |

### 2.2 Cibles d'equilibrage

| Metrique | Cible ideale | Seuil d'alerte |
|----------|-------------|----------------|
| Win rate par perso (vs IA meme difficulte) | 45-55% | < 40% ou > 60% |
| Pick rate par perso (Quick Play) | 15-25% chacun (pour 5 persos) | < 8% ou > 35% |
| Pick rate par terrain | 15-25% chacun | < 8% ou > 35% |
| Match duration | 5-10 min | < 3 min ou > 15 min |
| Carreaux par match | 0.5-2 | 0 (jamais = frustrant) ou > 5 (trop facile) |
| Score moyen fin de match | 13-8 a 13-11 | 13-0 (ecrasement) ou 13-12 systematique |
| Arcade completion rate | 40-70% | < 20% (trop dur) ou > 90% (trop facile) |
| Temps pour premier achat boutique | 15-30 min | > 1h (decourageant) |
| Temps pour maxer le Rookie | 4-6h | > 10h (grind) ou < 2h (trop rapide) |

---

## 3. BALANCING DES PERSONNAGES

### 3.1 Roster actuel — Analyse

| Perso | Total stats | Archetype | Risque |
|-------|-----------|-----------|--------|
| Ley | 31 | Tireur | **Le plus fort en stats brutes** — risque OP |
| Le Magicien | 30 | Pointeur | Precision 10 = quasi-parfait → potentiellement dominant au pointing |
| Reyes | 27 | Equilibre | Bien place, pas de risque evident |
| Marcel | 26 | Equilibre | Bien place, capacite defensive |
| La Choupe | 24 | Tireur | **Le plus faible** — compense par Puissance 10 |
| Rookie (10/40) | 10-40 | Adaptable | Debut trop faible ? Fin potentiellement OP a 40 pts ? |

### 3.2 Analyse des stats — Impact reel

Chaque stat doit avoir un impact **perceptible** quand elle change de ±1 :

| Stat | Valeur 1 | Valeur 5 | Valeur 10 | Comment ca se sent |
|------|---------|---------|----------|-------------------|
| **Precision** | Wobble ±15° | Wobble ±7° | Wobble ±1.5° | 1→5 = enorme, 5→10 = subtil |
| **Puissance** | Force max 60% | Force max 80% | Force max 100% | Lineaire, toujours perceptible |
| **Effet** | Courbe max 5° | Courbe max 15° | Courbe max 30° | Peu utilise au debut, crucial pour les experts |
| **Sang-froid** | Tremblement x2 a 10+ | Tremblement x1 | Tremblement x0.3 | Invisible jusqu'a 10-10, puis game-changing |

**Probleme identifie** : la Precision a un impact non-lineaire. La difference entre 1 et 5 est massive, entre 8 et 10 est minime. Ca desavantage les persos a faible Precision (La Choupe = 5) de maniere disproportionnee.

**Solution possible** : ajuster la courbe de wobble pour qu'elle soit plus lineaire :
```javascript
// Actuel (problematique)
const wobble = MAX_WOBBLE / precision; // 1=max, 10=min

// Propose (plus lineaire)
const wobble = MAX_WOBBLE * (1 - (precision - 1) / 9); // 1=max, 10=0
```

### 3.3 Capacites uniques — Equilibrage

| Capacite | Perso | Puissance percue | Risque | Ajustement |
|----------|-------|-----------------|--------|------------|
| Carreau Instinct (+50% ejection) | Ley | Forte | OP en combinaison avec PUI 9 | Reduire a +30% ? |
| Lecture du Terrain (trajectoire 3s) | Magicien | Tres forte | Info = avantage massif | Limiter a 1 charge/mene au lieu de /match |
| Coup de Canon (+30% puis, -20% prec) | Choupe | Moderee | Risk/reward bien equilibre | OK |
| Vieux Renard (annule tremblement) | Marcel | Situationnelle | Niche mais puissante a 10+ | OK |
| Le Mur (boule 2x rayon) | Reyes | Moderee | Plus facile a placer mais aussi a toucher | OK |

### 3.4 Matrice de matchups

Chaque paire de persos devrait avoir un matchup **proche de 50/50** (±5%) :

```
         Ley  Mag  Cho  Mar  Rey  Roo
Ley       -    ?    ?    ?    ?    ?
Magicien  ?    -    ?    ?    ?    ?
Choupe    ?    ?    -    ?    ?    ?
Marcel    ?    ?    ?    -    ?    ?
Reyes     ?    ?    ?    ?    -    ?
Rookie    ?    ?    ?    ?    ?    -
```

**A remplir apres playtest** : jouer 10+ matchs par paire sur le terrain Village (neutre). Si un matchup est > 60/40, ajuster les stats ou la capacite du perso dominant.

---

## 4. BALANCING DES TERRAINS

### 4.1 Analyse des terrains

| Terrain | Friction | Special | Avantage a... | Risque |
|---------|----------|---------|--------------|--------|
| Village | 1.0 | Aucun | Equilibre (pur skill) | Aucun — terrain de reference |
| Plage | 3.0 | Haute friction | Tireurs (PUI haute) | Trop punitif pour les pointeurs ? |
| Parc | 1.8/1.2 | Zones mixtes | Stratèges (connaissance du terrain) | Zones mixtes confuses pour les novices ? |
| Colline | 1.0 + pente | Gravity | Pointeurs (precision pour compenser) | Pente trop forte → frustration ? |
| Docks | 0.4 + murs | Rebonds | Wild cards (chaos) | Trop aleatoire ? |

### 4.2 Test de viabilite par terrain

Pour chaque terrain, verifier :
- [ ] Un pointeur (PRE haute) peut gagner sur ce terrain
- [ ] Un tireur (PUI haute) peut gagner sur ce terrain
- [ ] La duree du match est dans la cible (5-10 min)
- [ ] Le joueur comprend la particularite du terrain en 1-2 menes
- [ ] Le terrain ne favorise pas systematiquement un type de jeu

### 4.3 Ajustement des frictions

| Terrain | Friction actuelle | Si trop facile | Si trop dur |
|---------|------------------|---------------|------------|
| Plage | 3.0 | Augmenter a 3.5 | Reduire a 2.5 |
| Parc (herbe) | 1.8 | Augmenter a 2.0 | Reduire a 1.5 |
| Parc (gravier) | 1.2 | — | Reduire a 1.0 |
| Docks | 0.4 | Reduire a 0.3 | Augmenter a 0.6 |

**Regle d'or** : les ajustements de friction se font par **increments de 0.1-0.2**, jamais de changements brutaux.

---

## 5. BALANCING DE L'ECONOMIE

### 5.1 Simulation de progression

**Scenario : joueur "normal"** (60% win rate, 3 matchs/session, 3 sessions/semaine)

| Semaine | Victoires cumulees | Ecus cumules | Deblocages | Rookie pts |
|---------|-------------------|-------------|------------|-----------|
| 1 (S1-S3) | 5 | ~300 | Choupe, Marcel | 14/40 |
| 2 (S4-S6) | 10 | ~600 | Magicien, Boule Chrome | 20/40 (Capacite 1!) |
| 3 (S7-S9) | 15 | ~950 | Plage, Cochonnet Dore | 26/40 |
| 4 (S10-S12) | 20 | ~1300 | "L'Artilleur" | 30/40 (Capacite 2!) |
| 5 (S13-S15) | 25 | ~1700 | Boule Doree, Titane | 36/40 |
| 6 (S16-S18) | 30 | ~2100 | Tout achete | 40/40 (MAX!) |

**Verdict** : ~6 semaines pour tout debloquer a raison de 3 sessions/semaine. C'est un bon rythme pour un casual — ni trop rapide ni trop lent.

### 5.2 Scenario "hardcore" (80% win rate, 5 matchs/session, 5 sessions/semaine)

| Semaine | Ecus | Rookie | Temps total |
|---------|------|--------|-------------|
| 1 | ~1000 | 26/40 | ~4h |
| 2 | ~2200 | 40/40 (MAX) | ~8h |

Un joueur hardcore finit en ~2 semaines / ~8h. C'est correct — pas trop court, le contenu post-max (defis, online) prend le relais.

### 5.3 Scenario "casual" (40% win rate, 2 matchs/session, 2 sessions/semaine)

| Semaine | Ecus | Rookie | Temps |
|---------|------|--------|-------|
| 1 | ~100 | 12/40 | ~1h |
| 4 | ~400 | 16/40 | ~4h |
| 8 | ~800 | 22/40 | ~8h |
| 12 | ~1200 | 28/40 | ~12h |

**Probleme** : ce joueur n'a sa premiere capacite qu'apres ~6 semaines. C'est trop lent.

**Solution** : ajouter des Ecus/XP de consolation en defaite (10 Ecus, +0.5 pts Rookie) pour que meme les joueurs faibles progressent.

---

## 6. METHODOLOGIE DE PLAYTESTING

### 6.1 Types de playtests

| Type | Objectif | Qui teste | Duree | Frequence |
|------|---------|-----------|-------|-----------|
| **Test interne** | Bugs, crashes, navigation | Dev (toi) | 15-30 min | A chaque changement |
| **Test de balance** | Stats, difficulte, economie | Dev + 1-2 proches | 30-60 min | Apres chaque ajustement de stats |
| **Test d'onboarding** | 1ere experience, comprehension | Personne qui n'a JAMAIS joue | 20 min | 2-3 fois avant lancement |
| **Test de stress** | Performance, edge cases | Dev sur mobile low-end | 15 min | Avant chaque release |
| **Beta ouverte** | Feedback global, retention | 10-50 joueurs via itch.io | 1 semaine | 1 fois avant lancement |

### 6.2 Protocole de test d'onboarding (CRITIQUE)

**Materiel** : le jeu sur un navigateur, un testeur qui n'a JAMAIS joue, toi qui observes SANS RIEN DIRE.

**Etapes** :
1. Le testeur ouvre le jeu. Tu ne dis rien.
2. Tu observes :
   - Ou clique-t-il en premier ?
   - Combien de temps avant le premier lancer ?
   - Comprend-il le scoring sans explication ?
   - Exprime-t-il de la frustration ? Du plaisir ?
   - Abandonne-t-il ? Si oui, quand ?
3. Apres 15-20 min, tu poses 3 questions :
   - "C'etait comment ?"
   - "Qu'est-ce que tu n'as pas compris ?"
   - "Tu rejoueras ?"

**Regles sacrees** :
- **NE JAMAIS expliquer** pendant le test (si le joueur a besoin d'aide, c'est un bug UX)
- **NE JAMAIS defendre** le jeu ("c'est prevu pour plus tard" = interdit)
- **TOUT noter** : chaque hesitation, chaque clic inattendu, chaque emotion

### 6.3 Grille de notation playtest

```
Playtest #__  Date: ___  Testeur: ___  Profil: ___

NAVIGATION
[ ] Le testeur trouve le mode Arcade en < 10s     ○ Oui  ○ Non
[ ] Le testeur comprend la selection de perso      ○ Oui  ○ Non
[ ] Le testeur clique sur un perso verrouille      ○ Oui  ○ Non → reaction ?

GAMEPLAY
[ ] Premier lancer reussi (boule part)             ○ Oui  ○ Non
[ ] Comprend la direction du drag                  ○ Oui  ○ Non
[ ] Comprend la puissance du drag                  ○ Oui  ○ Non
[ ] Comprend le scoring                            ○ Oui  ○ Non
[ ] Utilise le Focus spontanement                  ○ Oui  ○ Non
[ ] Change le mode de lancer                       ○ Oui  ○ Non
[ ] Exprime du plaisir (sourire, "oh!")            ○ Oui  ○ Non
[ ] Exprime de la frustration                      ○ Oui  ○ Non → quand ?

RESULTATS
[ ] Finit le premier match                         ○ Oui  ○ Non
[ ] Lance un deuxieme match                        ○ Oui  ○ Non
[ ] Temps total de jeu avant d'arreter : ___ min
[ ] "Tu rejoueras ?" :                             ○ Oui  ○ Non  ○ Peut-etre

NOTES LIBRES :
_____________________________________________
```

### 6.4 Playtest automatise (Playwright)

En complement du playtest humain, des tests automatises Playwright simulent des parties :

```javascript
// tests/balance.spec.js
test('Le match dure entre 3 et 15 minutes', async ({ page }) => {
  await page.goto('/');
  // Lancer un Quick Play avec IA facile
  // ...
  // Mesurer le temps
  const duration = endTime - startTime;
  expect(duration).toBeGreaterThan(3 * 60 * 1000);
  expect(duration).toBeLessThan(15 * 60 * 1000);
});

test('Le Rookie 10/40 peut battre IA facile', async ({ page }) => {
  // Simuler 20 matchs Rookie vs IA facile
  // Win rate devrait etre > 30%
});

test('Aucun perso ne gagne > 65% vs IA meme difficulte', async ({ page }) => {
  // Pour chaque perso, simuler 50 matchs vs IA
  // Verifier que le win rate est entre 35-65%
});
```

---

## 7. OUTILS DE BALANCING

### 7.1 Debug overlay (mode dev)

```javascript
// Activer avec Ctrl+D en dev mode
class DebugOverlay {
  show(scene) {
    // Afficher en temps reel :
    // - Distance de chaque boule au cochonnet
    // - Wobble actuel (en degres)
    // - Puissance reelle du dernier lancer
    // - Score de l'IA (decision pointer/tirer, confiance)
    // - FPS
    this.text = scene.add.text(10, 10, '', { fontSize: '10px', color: '#0f0' })
      .setScrollFactor(0).setDepth(99999);
  }

  update(engine) {
    this.text.setText([
      `Distances: ${engine.getDistances().map(d => d.toFixed(1)).join(', ')}`,
      `Wobble: ${engine.aimingSystem.currentWobble.toFixed(2)}°`,
      `AI decision: ${engine.ai.lastDecision}`,
      `AI confidence: ${engine.ai.confidence.toFixed(2)}`,
      `FPS: ${Math.round(this.scene.game.loop.actualFps)}`
    ].join('\n'));
  }
}
```

### 7.2 Replay d'analyse

Enregistrer chaque lancer avec ses parametres pour analyse post-match :

```javascript
// Historique de match pour analyse
{
  throws: [
    { player: 'rookie', angle: 0.32, power: 0.65, loft: 'roulette',
      result_distance: 12.4, was_carreau: false, wobble_at_release: 3.2 },
    // ...
  ]
}
```

Exporter en CSV pour analyser dans un tableur :
- Distribution des distances au cochonnet par perso
- Frequence des carreaux par perso/terrain
- Correlation precision → distance moyenne

### 7.3 Tableau de bord balancing

```
┌──── BALANCE DASHBOARD (dev mode) ────────────────┐
│                                                    │
│ WIN RATES (50 derniers matchs)                     │
│ Ley: 58% ⚠️  Mag: 52% ✅  Cho: 44% ⚠️            │
│ Mar: 49% ✅  Rey: 51% ✅  Roo: 46% ✅              │
│                                                    │
│ TERRAINS (pick rate)                               │
│ Village: 35% ⚠️  Plage: 8% ❌  Parc: 25% ✅       │
│ Colline: 20% ✅  Docks: 12% ⚠️                    │
│                                                    │
│ ECONOMIE                                           │
│ Ecus moyens/session: 145  Premier achat: 22min ✅  │
│ Temps max Rookie: 5.2h ✅                          │
│                                                    │
│ MATCHS                                             │
│ Duree moyenne: 7.1min ✅  Carreaux/match: 1.3 ✅   │
│ Score moyen: 13-9 ✅                               │
└────────────────────────────────────────────────────┘
```

---

## 8. AJUSTEMENTS TYPES

### 8.1 Si un perso est trop fort (win rate > 58%)

| Action | Impact | Risque |
|--------|--------|--------|
| Reduire sa stat la plus haute de 1 | Subtil, premier essai | Peut ne pas suffire |
| Nerf sa capacite (duree, charges) | Plus visible | Frustrant pour les joueurs du perso |
| Buff les persos faibles a la place | Plus positif | Plus de travail |

**Regle** : toujours preferer **buff les faibles** plutot que **nerf les forts**. Les joueurs detestent les nerfs.

### 8.2 Si un terrain est evite (pick rate < 10%)

1. Le terrain est-il **incomprehensible** ? → Ameliorer les indices visuels
2. Le terrain est-il **trop punitif** ? → Reduire la friction/pente
3. Le terrain est-il **ennuyeux** ? → Ajouter un element unique (zone secrete, obstacle)
4. Le terrain est-il **moche** ? → Ameliorer les visuels

### 8.3 Si les matchs sont trop longs (> 12 min)

- Reduire le nombre de boules (3→2 en tete-a-tete)
- Reduire le score de victoire (13→11)
- Augmenter la precision de l'IA (matchs plus decisifs)
- Reduire la friction globale (les boules vont plus vite = tours plus courts)

### 8.4 Si les matchs sont trop courts (< 4 min)

- Le scoring est-il trop genereux ? (menes a 3-4 pts frequentes)
- L'IA est-elle trop faible ? (ecrasement systematique)
- Les carreaux sont-ils trop faciles ? (score grimpe trop vite)

---

## 9. PROCESS DE BALANCING

### 9.1 Workflow

```
1. HYPOTHESE : "Ley est trop fort parce que sa precision 8 + puissance 9 = trop polyvalent"
2. MESURE : jouer 20 matchs Ley vs chaque autre perso, noter les win rates
3. DIAGNOSTIC : si win rate > 58%, l'hypothese est confirmee
4. AJUSTEMENT : reduire puissance de 9 → 8 (petit changement)
5. RE-MESURE : rejouer 20 matchs
6. VALIDATION : win rate entre 45-55% → OK
7. COMMIT : sauvegarder les nouvelles stats
```

### 9.2 Ne JAMAIS ajuster plus d'une variable a la fois

Si on change simultanément la precision de Ley ET la friction du terrain, on ne saura pas quel changement a eu l'effet. **Un changement → un test → un résultat.**

### 9.3 Garder un historique

```javascript
// Dans un fichier balancing_log.md ou dans les commits
// 2026-03-20 : Ley PUI 9→8 (win rate 61% → test)
// 2026-03-21 : Ley PUI 8 → win rate 53% ✅ valide
// 2026-03-22 : Plage friction 3.0→2.7 (pick rate 8% → test)
```

---

## 10. CHECKLIST AVANT LANCEMENT

### Equilibrage valide

- [ ] Chaque perso a un win rate entre 40-60% (50+ matchs testes)
- [ ] Chaque terrain est joue par > 10% des joueurs (ou au moins jouable sans frustration)
- [ ] La duree moyenne des matchs est entre 5-10 min
- [ ] L'Arcade est completable par un joueur "normal" en 3-5 tentatives
- [ ] Le Rookie a 10/40 peut battre l'IA facile (win rate > 40%)
- [ ] Le Rookie a 40/40 n'est pas OP (win rate < 60% vs IA difficile)
- [ ] Le premier achat boutique est possible en < 30 min de jeu
- [ ] Aucune strategie dominante evidente (tir > pointer systematiquement)

### Playtests effectues

- [ ] Au moins 3 personnes qui n'ont JAMAIS joue ont teste l'onboarding
- [ ] Au moins 1 joueur sur mobile a teste
- [ ] Au moins 100 matchs automatises (Playwright) sans crash
- [ ] Le balance dashboard ne montre aucun ❌
