# UX/UI Inspirations — jeux mobiles sports casual

Référentiel de bonnes pratiques UI/UX pour la Phase 2 polish portrait, inspiré de 6 jeux leaders du genre sport casual mobile.

## Les 6 références

| Jeu | Éditeur | Points forts UI/UX | Relevance Pétanque |
|---|---|---|---|
| **Golf Clash** | Playdemic | Aim drag + power meter circulaire, HUD abilities cooldown | ★★★★★ — le plus proche mécaniquement |
| **8 Ball Pool** | Miniclip | Shop grid 2-cols, chat emotes, rank system, matchmaking UI | ★★★★☆ — shop + social |
| **Clash Royale** | Supercell | Card system rarity, deck builder, progression tree | ★★★★☆ — CharSelect + unlocks |
| **Royal Match** | Dream Games | Juicy feedback (confettis, tweens), progression visible | ★★★☆☆ — game feel |
| **Mini Golf King** | Yakuto | Match flow multi-rounds, XP/coin rewards animés | ★★★☆☆ — result scene |
| **Stumble Guys** | Kitka / Scopely | Onboarding instant, UI discrète pendant action | ★★★☆☆ — lisibilité match |

## Patterns UX à intégrer (par scène)

### TitleScene
**Inspi** : Golf Clash + 8 Ball Pool
- [ ] **Player card en haut** : avatar rookie + pseudo + niveau + galets live (banner 72px haut)
- [ ] **News ticker** défilant sous le card (« Nouveau terrain débloqué !», « Arcade mise à jour »)
- [ ] **Bouton JOUER primaire** surélevé (shadow 6px, pulse subtil 2s) pour attirer le pouce
- [ ] **Daily Challenge card** : bannière clickable « Défi du jour — 50 galets » avec timer countdown
- [ ] **Bottom nav fixe** (5 icônes) : Home / Shop / Persos / Classement / Settings — pattern Candy Crush / Clash Royale

### CharSelectScene
**Inspi** : Clash Royale cards + Mini Golf King
- [ ] **Portrait HD 96×96** au centre de chaque card (pas juste emoji), avec background dégradé selon rareté
- [ ] **Rareté 5 niveaux** : commun (gris) / rare (bleu) / épique (violet) / légendaire (or) / mythique (rouge) — cohérent avec archétypes pétanque
- [ ] **Stats comparaison inline** : quand tu tap un perso, les 4 stats s'animent (tween) pour montrer la différence vs le perso précédent
- [ ] **Progress bar sous chaque card** : « 1/3 tournois gagnés → next reward »
- [ ] **Teaser unlock** sur la carte verrouillée : « Gagnez 3 matchs en Arcade »
- [ ] **Swipe horizontal entre tabs** « Tous / Débloqués / Favoris »

### ShopScene
**Inspi** : 8 Ball Pool + Golf Clash shop
- [ ] **Featured deal en haut** : card grande (h=120px) « BOULE DORÉE - 30% off - 2 jours restants » avec timer countdown
- [ ] **Grid 2 cols** au lieu de liste : plus efficient sur portrait, montre 6 items au lieu de 4
- [ ] **Rarity glow** sur chaque item (même code couleur que CharSelect)
- [ ] **Compare mode** : tap long sur un item → overlay comparant stats avec l'item équipé
- [ ] **Bundle packs** : « Pack débutant — 3 boules + 1 cochonnet → 500 galets au lieu de 800 »
- [ ] **Sold out / rupture** badge sur items événementiels
- [ ] **CTA achat** avec animation coin counter (galets diminuent en tween 300ms)

### PetanqueScene (match)
**Inspi** : Golf Clash aim + Mini Golf King
- [ ] **Power meter circulaire** autour de la boule pendant le drag : anneau qui se remplit (0→100%) + graduation couleurs (vert-jaune-rouge)
- [ ] **Sweet spot indicator** : zone verte sur l'anneau power (~75% = optimal carreau)
- [ ] **Arc prédictif coloré** selon probabilité de réussite : vert si > 80%, orange 50-80%, rouge < 50%
- [ ] **Wind indicator** (si terrain a du vent) : flèche discrète coin droit, intensité texte
- [ ] **Match progress bar** : top sous score, 3 pastilles (round 1/2/3) + pastille active pulse
- [ ] **Timer par tour** (optionnel, mode speedy) : petit ring countdown autour du cercle de lancer
- [ ] **Boule "fantôme"** pendant drag : montre où la boule finirait, transparente
- [ ] **HUD abilities cooldown visuel** : ring qui se remplit au tour où la charge revient
- [ ] **Crowd reactions icons** : émoji 👏 / 😮 / 😂 qui fly up quand foule réagit (durée 1s)

### ResultScene
**Inspi** : Royal Match juicy feedback + Golf Clash end screen
- [ ] **Séquence de révélation** : (1) score final bounce in → (2) reward counter anime 0→100 → (3) XP bar remplit → (4) boutons fade in (staggered 200ms)
- [ ] **Confetti particle system** (pas juste dots statiques) : 50 particules colorées, gravité, rotation
- [ ] **"Moves highlight"** : replay animé des 3 meilleurs coups du match (tir au fer, carreau, etc.)
- [ ] **MVP badge** sur le personnage qui a dominé
- [ ] **Daily streak** indicator : « 3 victoires d'affilée → bonus 20% »
- [ ] **Share button** : génère une carte image avec score, persos, terrain → partageable réseaux
- [ ] **Next opponent teaser** : « Prochain adversaire : Suchaud » avec portrait faded

## Juicy feedback patterns transverses

Inspi **Royal Match** + **Stumble Guys** :
- **Squash & stretch** sur tous les tap (scale 0.95 → 1.05 → 1 en 150ms)
- **Haptic feedback** : tap boutons (20ms), tir réussi (50ms), carreau (pattern 30/50/30ms)
- **Sound layering** : chaque action = ≥2 sons (click + whoosh + chime si success)
- **Color flash** brief sur événements importants (+10 galets → flash jaune 150ms sur compteur)
- **Screen shake** micro pour impacts (carreau, défaite) — 4-8px, 100-200ms
- **Floating text** récompenses (+100 galets) : spawn sprite, tween up, fade out, 800ms

## Couleurs par rarité (à ajouter dans Constants.js)

```js
export const RARITY_COLORS = {
    common:     { base: 0x9E9E8E, glow: 0xC0C0B0 },  // gris
    rare:       { base: 0x4A90D9, glow: 0x87CEEB },  // bleu ciel
    epic:       { base: 0x9B7BB8, glow: 0xC8A0E8 },  // lavande
    legendary:  { base: 0xFFD700, glow: 0xFFF0A0 },  // or
    mythic:     { base: 0xC44B3F, glow: 0xFF6B60 }   // rouge carreau
};
```

Mapping par personnage (à ajouter dans characters.json) :
- Rookie = common
- La Choupe, Mamie Josette, Papi René = rare
- Foyot, Rocher, Robineau, Sofia = epic
- Ley, Suchaud, Fazzino, Rizzi = legendary
- (futur mythic réservé pour personnage secret)

## Accessibilité mobile

- **Contraste WCAG AA** : tous les textes doivent passer 4.5:1 (tester #D4A574 sur #3A2E28 = 4.7:1 ✅)
- **Touch targets ≥ 44×44 CSS px** → au scale portrait ≈ 40×40 game px minimum
- **No text below 11px** sur mobile (sauf décoratif)
- **Support VoiceOver / TalkBack** : labels descriptifs sur boutons
- **Reduced motion** : respecter `prefers-reduced-motion` (désactiver tweens décoratifs)

## Priorités d'implémentation (Phase 2 polish)

**Tier S (must-have)** :
1. Match progress bar (round 1/2/3)
2. Power meter circulaire (Golf Clash killer feature)
3. Confettis particles Result (vs dots statiques)
4. Juicy feedback taps (squash/stretch)
5. Floating text récompenses

**Tier A (should-have)** :
6. Rarity colors personnages
7. Shop featured deal header
8. Bottom nav Title
9. Grid 2 cols Shop
10. Portrait HD cards CharSelect

**Tier B (nice-to-have)** :
11. Daily Challenge card Title
12. Wind indicator match
13. Share button Result
14. Compare mode Shop
15. Move highlights replay

## Métriques à tracker (GA4 custom events déjà en place)

Mesurer l'impact des améliorations UX :
- `match_completed` : taux (doit monter avec UX amélioré)
- `shop_view` → `shop_purchase` funnel
- `session_duration` : objectif +30% avec juicy feedback
- `char_select_tap_to_confirm` : délai moyen (proxy pour fluidité UX)
- `retry_after_defeat` : doit monter (indique que le feedback défaite donne envie de rejouer)
