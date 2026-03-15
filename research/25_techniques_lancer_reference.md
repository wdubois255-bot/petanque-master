# 24 - Reference : Techniques de lancer en petanque
> Recherche du 15 mars 2026. Sources : Boulipedia, Decathlon, FIPJP, Sport Coach VIP, etudes biomecanique.

## Donnees cles mesurees

- **Pointage (3 techniques)** : 4.9-6.5 m/s (~18-23 km/h)
- **Tir** : 13-16 m/s (~47-58 km/h) = **2.5-3x plus rapide**
- Distance cochonnet : 6-10m du cercle

## Tableau comparatif

| Technique | Arc (hauteur) | % vol | % roulement | Vitesse | Atterrit ou ? | Impact sol | Apres |
|-----------|--------------|-------|-------------|---------|---------------|------------|-------|
| **Roulette** | 0.3-0.5m | 15% | 85% | 4-5 m/s | 1m du joueur | Aucun | Longue roulée |
| **Demi-portee** | 1.5-2.0m | 50% | 50% | 5-6 m/s | Mi-distance | Petit thud | Roulement moyen |
| **Plombee** | 2.5-4.0m | 90% | 10% | 5-6 m/s | 0.5-1m du cochonnet | Gros cratere | S'arrete quasi sur place |
| **Tir au fer** | 2.0-3.0m | 100% | 0% | 13-16 m/s | SUR la boule cible | Clac metallique | Carreau possible |
| **Tir devant** | 2.0-2.5m | 90% | 10% | 13-16 m/s | 20-30cm devant cible | Poussiere + clac | Dispersion |
| **Tir rafle** | 0.2-0.5m | 15% | 85% | 13-16 m/s | 1m du joueur | Trainee au sol | Chaos |

## Details par technique

### ROULETTE
- Arc tres bas, a peine au-dessus du genou
- La boule roule sur 80-90% de la distance
- Joueur souvent accroupi pour relacher pres du sol
- Meilleur sur terrain plat et dur ("roulant")
- Sensible aux irregularites du terrain

### DEMI-PORTEE
- Technique par defaut, la plus versatile
- Arc a hauteur d'epaule/tete
- 50% vol, 50% roulement
- Fonctionne sur tous les terrains
- Petit rebond a l'atterrissage

### PLOMBEE (PORTEE)
- Lancer "en cloche" tres haut (3-4m)
- Boule descend quasi verticalement
- Avec backspin, boule s'arrete nette a l'impact
- Cree un cratere visible dans le sol meuble
- Essentielle sur terrain mou/sableux

### TIR AU FER (le vrai tir)
- LA technique de tir prestigieuse
- Boule vole DIRECTEMENT sur la boule adverse sans toucher le sol
- 2.5-3x plus rapide que le pointage
- Impact : transfert d'energie (Newton's cradle)
- Carreau = la boule lancee remplace exactement la boule adverse
- Arc moyen-haut pour retomber sur la cible

### TIR DEVANT
- Boule atterrit 20-30cm devant la cible puis rebondit dessus
- Plus facile que le tir au fer
- Moins propre (les deux boules se dispersent)

### TIR A LA RAFLE
- Tir rasant, boule roule a grande vitesse
- Considere comme "non sportif" par les puristes
- Ne marche que sur terrain plat
- Resultat chaotique et imprevisible

## Constantes jeu (implementees)

```javascript
ROULETTE:    landingFactor: 0.15, arcHeight: -6,  rollEfficiency: 1.6
DEMI-PORTEE: landingFactor: 0.50, arcHeight: -40, rollEfficiency: 0.8
PLOMBEE:     landingFactor: 0.90, arcHeight: -80, rollEfficiency: 0.15
TIR:         landingFactor: 0.95, arcHeight: -55, rollEfficiency: 0.1
```

## Effets visuels par technique

1. **Roulette** : pas de poussiere, ombre au sol, roulement continu
2. **Demi-portee** : petite poussiere, ombre qui se separe pendant le vol, micro-rebond
3. **Plombee** : grosse poussiere, ombre loin de la boule en vol (montre la hauteur), cratere, boule "meurt"
4. **Tir au fer** : pas de poussiere sol, flash/etincelle a la collision, clac metallique fort, boule cible propulsee
