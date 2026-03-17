# Guide Complet : Publier un Jeu Indie HTML5 (Phaser 3) Commercialement

Recherche effectuee le 17 mars 2026. Applicable depuis la France.

---

## 1. STRUCTURE JURIDIQUE (France)

### Auto-Entrepreneur (Micro-Entreprise) -- RECOMMANDE pour debuter

Le statut le plus simple et adapte pour un developpeur indie solo.

**Seuils de chiffre d'affaires (2026) :**
- Prestations de services (BIC) : 83 600 EUR/an max
- Professions liberales (BNC) : 83 600 EUR/an max
- Activites commerciales : 203 100 EUR/an max
- La vente de jeux numeriques releve generalement des prestations de services (BIC)

**Charges sociales :**
- Services BIC : ~21,1% du CA
- Professions liberales BNC : ~21,2% du CA
- Versement liberatoire possible (si revenu fiscal < ~29 579 EUR) : 1,7% a 2,2% d'impot en plus

**Abattements fiscaux (regime micro-fiscal standard) :**
- Commercial/revente : 71%
- Services BIC : 50%
- BNC : 34%

**Franchise de TVA :**
- Pas de TVA tant que CA < 36 800 EUR (services) ou 91 900 EUR (commerce)
- Attention : la vente numerique intra-UE a des regles TVA specifiques (regime OSS)

**Avantages :**
- Creation gratuite en ligne (formalites.entreprises.gouv.fr)
- Comptabilite ultra-simplifiee (livre des recettes)
- Pas de capital social
- Charges proportionnelles au CA (0 EUR si 0 CA)

**Inconvenients :**
- Responsabilite illimitee sur patrimoine personnel
- Pas de deduction des charges reelles
- Plafond de CA

### Alternatives si le jeu genere beaucoup de revenus

| Structure | Capital min | Responsabilite | Complexite | Quand ? |
|-----------|------------|----------------|------------|---------|
| Auto-entrepreneur | 0 EUR | Illimitee | Tres faible | < 83k EUR/an, debut |
| EURL/SARL | 1 EUR | Limitee aux apports | Moyenne | 83k-200k EUR/an |
| SAS/SASU | 1 EUR | Limitee aux apports | Elevee | Levee de fonds, associes |

**Recommandation : commencer en auto-entrepreneur, basculer en SASU si le CA depasse 50-60k EUR/an.**

### Comptes developeur App Stores

**Apple Developer Program :**
- 99 USD/an (environ 92 EUR)
- Inscription individuelle possible (pas besoin de societe)
- Requis : Apple ID avec authentification 2 facteurs, nom legal, age de majorite
- Organisation : necessite un numero D-U-N-S, site web professionnel, email professionnel

**Google Play Developer :**
- 25 USD unique (environ 23 EUR)
- Verification d'identite obligatoire depuis 2023
- Individuel ou organisation
- Requis : piece d'identite, coordonnees verifiables

**Steam (Steamworks) :**
- 87,99 EUR par jeu (Steam Direct Fee)
- Remboursable apres 1 000 USD de revenus bruts
- Revenue share : 70/30 (70% developpeur, 30% Valve)
- Passe a 75/25 apres 10M USD, 80/20 apres 50M USD

---

## 2. CONFORMITE LEGALE

### RGPD (obligatoire pour tout service accessible en UE)

**Quand s'applique-t-il ?**
Toujours, des qu'on collecte des donnees personnelles (email, pseudo, IP, cookies analytiques...).

**4 actions principales (CNIL) :**
1. **Registre des traitements** : documenter quelles donnees, pourquoi, combien de temps
2. **Base legale** : consentement, contrat, interet legitime...
3. **Durees de conservation** : definir et respecter
4. **Securite** : chiffrement, pseudonymisation

**Checklist essentielle :**
- [ ] Politique de confidentialite claire et accessible
- [ ] Consentement explicite avant collecte (opt-in, pas opt-out)
- [ ] Droit d'acces, rectification, suppression, portabilite
- [ ] Notification de violation dans les 72h a la CNIL
- [ ] Accords de sous-traitance avec tout prestataire (analytics, auth...)
- [ ] Protection des donnees des le design (privacy by design)
- [ ] Banniere cookies conforme (si analytics/tracking)

**Pour un jeu sans comptes utilisateur et sans analytics :** le RGPD s'applique quand meme si vous collectez des IPs ou utilisez des cookies. Un jeu 100% client-side sans tracking ni comptes a des obligations minimales.

**Pour un jeu avec comptes :** conformite complete requise. Prevoir 2-5 jours de travail pour la mise en place.

### Cookies / ePrivacy

- Banniere de consentement obligatoire si cookies non-essentiels (analytics, pub)
- Cookies techniques (session, preferences) : pas de consentement requis
- Utiliser une solution comme Tarteaucitron.js (gratuit, francais, open-source)

### Classification PEGI / IARC

**PEGI (Pan European Game Information) :**
- PEGI 3, 7, 12, 16, 18 + descripteurs de contenu
- Un jeu de petanque sans violence = probablement PEGI 3

**IARC (International Age Rating Coalition) :**
- Systeme de classification automatise utilise par Google Play, App Store, Microsoft Store
- **Gratuit** : remplir un questionnaire en ligne sur le contenu du jeu
- Genere automatiquement les ratings PEGI, ESRB, USK, GRAC, ClassInd
- **Obligatoire** pour publier sur Google Play et l'App Store
- Processus : 10-15 minutes, questionnaire a choix multiples

**Pour un jeu web uniquement (pas d'app store) :** pas de classification obligatoire, mais recommandee.

### COPPA (Children's Online Privacy Protection Act - USA)

**S'applique si :**
- Le jeu cible les enfants de moins de 13 ans OU
- Vous savez que des enfants < 13 ans l'utilisent

**Obligations :**
- Consentement parental verifiable avant collecte de donnees
- Politique de confidentialite specifique enfants
- Possibilite pour les parents de consulter/supprimer les donnees

**Pour Petanque Master :** si le jeu ne cible pas specifiquement les enfants et ne collecte pas de donnees personnelles, COPPA est peu pertinent. Si vous ciblez "tous ages", evitez de mentionner les enfants dans le marketing.

### Mentions legales obligatoires (France)

- Identite de l'editeur (nom, adresse, SIRET)
- Hebergeur du site (nom, adresse)
- Directeur de la publication
- Contact (email)

### Documents juridiques a preparer

1. **Conditions Generales d'Utilisation (CGU)** - obligatoire
2. **Politique de confidentialite** - obligatoire RGPD
3. **Politique cookies** - si cookies non-essentiels
4. **Conditions Generales de Vente (CGV)** - si vente (achats in-app)

---

## 3. PROPRIETE INTELLECTUELLE

### Depot de marque (INPI)

**Pourquoi ?** Proteger le nom "Petanque Master" contre la copie.

**Processus INPI :**
1. Recherche d'anteriorite (base INPI gratuite)
2. Depot en ligne sur procedures.inpi.fr
3. Choix des classes Nice (classe 9 : logiciels/jeux video, classe 41 : divertissement)
4. Publication au BOPI (Bulletin Officiel de la Propriete Industrielle)
5. Delai d'opposition de 2 mois

**Couts :**
- 1 classe : 190 EUR
- Classe supplementaire : 40 EUR
- Pour 2 classes (9 + 41) : 230 EUR
- Protection : 10 ans, renouvelable indefiniment

**Timeline :** 4-6 mois pour l'enregistrement definitif

**Marque UE (EUIPO) :** 850 EUR pour 1 classe, protection dans toute l'UE.

### Droit d'auteur sur les assets

**Code source :** protege automatiquement par le droit d'auteur (pas de depot necessaire)

**Assets visuels crees manuellement :** protege automatiquement

**Assets generes par IA -- SITUATION JURIDIQUE COMPLEXE (2025-2026) :**

La position actuelle :
- **USA (Copyright Office, janvier 2025) :** Les oeuvres generees entierement par IA ne sont PAS protegeable par copyright. Seules les parties comportant un apport creatif humain significatif sont protegeables.
- **France/UE :** Pas encore de jurisprudence claire. Le droit d'auteur europeen exige une "empreinte de la personnalite de l'auteur" -- un prompt seul ne suffit probablement pas.
- **Pratique recommandee :**
  - Retoucher significativement les sprites generes par PixelLab (Aseprite)
  - Documenter le processus creatif (prompts + modifications manuelles)
  - Les modifications substantielles (recoloration, redesign, animation) renforcent la revendication de droit d'auteur
  - Conserver les fichiers sources Aseprite comme preuve

**Risques specifiques :**
- Un concurrent pourrait reproduire des assets IA-generes similaires sans enfreindre votre copyright
- Les conditions d'utilisation de PixelLab/Midjourney/DALL-E peuvent restreindre l'usage commercial
- Verifier les ToS de chaque outil IA utilise

### Musique et audio

- **Assets ElevenLabs :** verifier les conditions de licence pour usage commercial
- **Beepbox :** compositions originales = protegees par droit d'auteur
- **jsfxr :** sons generes = generalement libres de droits
- **Toute musique tiers :** licence explicite requise (CC0, CC-BY, licence commerciale)

### Licences open-source

**Phaser 3 (licence MIT) :**
- Usage commercial autorise
- Obligation : inclure la notice de copyright MIT dans le code distribue
- Pas d'obligation de rendre le code source public

**Rex Plugins (licence MIT) :** memes obligations

**Vite (licence MIT) :** memes obligations (outil de build, pas distribue avec le jeu)

**Bonne pratique :** fichier LICENSES.txt ou page "Credits" dans le jeu listant toutes les licences.

---

## 4. APP STORE OPTIMIZATION (ASO)

### Screenshots et visuels

- **App Store :** 3-10 screenshots par appareil (6.7", 6.5", 5.5" iPhone + iPad)
- **Google Play :** 2-8 screenshots (min 320px, max 3840px)
- **Regles d'or :**
  - Premier screenshot = proposition de valeur claire
  - Montrer le gameplay reel, pas des menus
  - Ajouter du texte court sur les screenshots (feature callouts)
  - Video de 15-30 secondes (fortement recommande sur les deux stores)

### Description et mots-cles

- **Titre :** 30 caracteres max (App Store), bref et memorisable
- **Sous-titre (App Store) :** 30 caracteres, mots-cles importants
- **Description courte (Google Play) :** 80 caracteres
- **Mots-cles pertinents pour Petanque Master :**
  - petanque, boules, jeu de boules, bocce
  - strategy game, sports game, arcade
  - pixel art, retro, indie
  - France, Provence, competition
  - multiplayer, versus, tournament

### Strategies de lancement

1. **Pre-registration (Google Play) / Pre-order (App Store) :**
   - Accumuler des inscriptions avant la sortie
   - Boost algorithmique au lancement

2. **Soft launch :**
   - Lancer dans 1-2 pays (Canada, Australie, Nouvelle-Zelande) pour tester
   - Collecter des donnees de retention et monetisation
   - Corriger avant le lancement mondial

3. **Launch window :**
   - Eviter les grosses sorties AAA
   - Privilegier mardi-jeudi pour le lancement
   - Coordonner avec un evenement thematique si possible (ete = saison petanque)

4. **Premiere semaine critique :**
   - Les stores mesurent la velocity de telechargements
   - Concentrer le marketing sur les 72 premieres heures
   - Demander des reviews/ratings des les premiers jours

---

## 5. BUDGET ESTIMATIF DETAILLE

### Couts fixes obligatoires

| Poste | Cout | Frequence |
|-------|------|-----------|
| Auto-entrepreneur (creation) | 0 EUR | Une fois |
| Apple Developer Program | ~92 EUR | /an |
| Google Play Developer | ~23 EUR | Une fois |
| Steam Direct Fee | ~88 EUR | /jeu |
| Domaine (.com ou .fr) | 10-15 EUR | /an |
| **TOTAL minimum** | **~215 EUR** | **Premiere annee** |

### Couts optionnels mais recommandes

| Poste | Cout | Notes |
|-------|------|-------|
| Depot marque INPI (2 classes) | 230 EUR | Une fois, valable 10 ans |
| SSL/CDN (Cloudflare gratuit) | 0 EUR | Plan gratuit suffisant |
| Hebergement web (GitHub Pages) | 0 EUR | Deja en place |
| Hebergement web (Netlify free) | 0 EUR | Alternative, 300 credits/mois |
| Hebergement web (Vercel hobby) | 0 EUR | Alternative, usage personnel uniquement |
| Outils analytics (Plausible) | ~9 EUR/mois | Privacy-friendly, alternative : Umami self-hosted gratuit |
| **TOTAL recommande** | **~445 EUR** | **Premiere annee** |

### Couts de serveur (si mode en ligne async)

| Solution | Cout | Capacite |
|----------|------|----------|
| Supabase (free tier) | 0 EUR | 50k requetes/mois, 500MB DB |
| Firebase (Spark plan) | 0 EUR | 1GB stockage, 50k lectures/jour |
| Serveur VPS (Hetzner) | ~4-5 EUR/mois | Suffisant pour matchmaking simple |
| Railway / Fly.io (free tier) | 0 EUR | Limits varies, bon pour debuter |

### Budget marketing (ordre de grandeur)

| Strategie | Cout | Efficacite |
|-----------|------|------------|
| Gratuit : Reddit, Twitter/X, TikTok, forums | 0 EUR | Elevee si contenu regulier |
| Gratuit : Steam wishlists, demos | 0 EUR | Essential pour Steam |
| Press kit + contact journalistes | 0 EUR | Necessaire, resultat variable |
| Trailer video (fait maison) | 0 EUR | Critique, bonne qualite requise |
| Publicite Facebook/Instagram | 50-200 EUR/mois | CPI mobile ~0,50-2 EUR |
| Publicite TikTok | 50-200 EUR/mois | Bon pour jeux casual/fun |
| Influenceurs/streamers (micro) | 0-500 EUR | Tres variable |
| Festival/salon indie (IndieDevDay, etc.) | 100-500 EUR | Networking + visibilite |
| **Budget marketing realiste (indie solo)** | **0-500 EUR/mois** | Commencer a 0, scaler |

### Estimation totale premiere annee

| Scenario | Budget |
|----------|--------|
| **Minimum** (web only, gratuit) | ~25 EUR (domaine) |
| **Basique** (web + mobile) | ~250-500 EUR |
| **Serieux** (web + mobile + Steam + marque) | ~700-1 000 EUR |
| **Avec marketing** | ~1 500-3 000 EUR |

---

## 6. STRATEGIE DE DISTRIBUTION

### Plateformes par priorite pour Petanque Master

#### Priorite 1 : Web (gratuit, immediat)

**itch.io :**
- 0% de commission par defaut (modele "pay what you want" pour la plateforme)
- Upload HTML5 direct, jouable dans le navigateur
- Communaute indie tres active
- Parfait pour soft-launch et feedback
- Supporte les ventes, donations, et abonnements

**Site propre (GitHub Pages) :**
- Deja en place dans le projet
- Controle total, pas de commission
- SEO direct, monetisation libre (ads, donations, premium)

**Newgrounds :**
- Communaute de joueurs web historique
- Revenue share via publicite
- Bonne visibilite pour les jeux HTML5

**CrazyGames / Poki :**
- Plateformes de jeux web avec monetisation par pub
- Revenue share ~50-70% sur les revenus publicitaires
- Gros traffic (millions de joueurs), bonne decouverte
- Ideal pour un jeu casual comme la petanque

#### Priorite 2 : Mobile (bon potentiel, effort moyen)

**Wrapping HTML5 vers natif :**
- **Capacitor (recommande) :** framework Ionic, wrap web app en app native, acces aux APIs natives, maintenu activement
- **Cordova :** plus ancien, encore fonctionnel mais moins maintenu
- **PWA :** Progressive Web App, installable sans store, mais visibilite limitee

**Google Play (Android) :**
- 15% de commission pour le premier million USD/an (Small Business Program)
- 30% au-dela
- Public plus large, moins exigeant que Apple
- IARC rating gratuit et obligatoire

**App Store (iOS) :**
- 15% de commission pour les devs < 1M USD/an (App Store Small Business Program)
- 30% au-dela
- Review process plus strict (1-7 jours)
- Guidelines strictes sur les webviews (le jeu doit etre "natif-feeling")
- **Attention :** Apple peut rejeter les apps qui sont de simples wrappers web

#### Priorite 3 : Desktop (Steam)

**Steam :**
- Revenue share : 70/30 (standard), 75/25 (>10M), 80/20 (>50M)
- Enorme base de joueurs (130M+ actifs mensuels)
- Wishlists = outil marketing puissant
- Necessité de builder un executable (Electron ou NW.js pour wrapper HTML5)
- 87,99 EUR par jeu, remboursable apres 1 000 USD de revenus
- **Consideration :** un jeu de petanque peut avoir du mal a se demarquer sur Steam sans marketing significatif. La niche est petite mais la competition aussi.

**Alternatives desktop :**
- **Epic Games Store :** 12% de commission, mais process d'acceptation
- **GOG :** 70/30, focus retro/DRM-free, bonne niche pour pixel art

### Considerations cross-platform

**Phaser 3 + Capacitor :** la combinaison la plus efficace pour un jeu HTML5.

| Plateforme | Wrapper | Effort | Commission |
|------------|---------|--------|------------|
| Web | Aucun | Nul | 0% |
| Android | Capacitor | Faible | 15% |
| iOS | Capacitor | Moyen (review Apple) | 15% |
| Desktop | Electron | Faible | 30% (Steam) |

**Recommandation pour Petanque Master :**

1. **Phase 1 (lancement)** : itch.io + site propre + CrazyGames/Poki
   - Cout : 0 EUR
   - Objectif : valider le jeu, collecter du feedback, construire une audience

2. **Phase 2 (1-2 mois apres)** : Google Play Android
   - Cout : ~23 EUR
   - Le wrapping Capacitor est rapide pour un jeu Phaser

3. **Phase 3 (si traction)** : App Store iOS + Steam
   - Cout : ~180 EUR
   - Seulement si les metriques Phase 1-2 sont encourageantes

---

## ANNEXE : Checklist Pre-Publication

### Juridique
- [ ] Creer le statut auto-entrepreneur
- [ ] Obtenir un numero SIRET
- [ ] Rediger les CGU
- [ ] Rediger la politique de confidentialite
- [ ] Mettre en place la banniere cookies (si applicable)
- [ ] Ajouter les mentions legales au site

### Propriete intellectuelle
- [ ] Recherche d'anteriorite sur le nom du jeu
- [ ] Depot de marque INPI (optionnel mais recommande)
- [ ] Verifier les licences de tous les assets (PixelLab, ElevenLabs, etc.)
- [ ] Creer un fichier CREDITS/LICENSES dans le jeu
- [ ] Documenter le processus de creation des assets IA

### Technique
- [ ] Build de production optimise (Vite)
- [ ] Tester sur mobile (responsive, tactile)
- [ ] Wrapper Capacitor pour mobile (si applicable)
- [ ] Wrapper Electron pour desktop (si applicable)
- [ ] IARC rating questionnaire

### Marketing
- [ ] Press kit (logo, screenshots HD, descriptions, trailer)
- [ ] Page itch.io avec screenshots et description
- [ ] Trailer video (30-60 secondes)
- [ ] Compte Twitter/X et/ou TikTok pour le jeu
- [ ] Liste de contacts presse/influenceurs
- [ ] Page Steam Coming Soon avec wishlist (si applicable)

### Stores
- [ ] Screenshots aux bonnes dimensions par store
- [ ] Descriptions optimisees (ASO)
- [ ] Icone d'app (1024x1024, plusieurs variantes)
- [ ] Feature graphic (Google Play : 1024x500)
- [ ] Classification IARC remplie
- [ ] Privacy policy URL (obligatoire sur les stores)

---

*Ce document est un guide de recherche, pas un avis juridique. Consultez un avocat specialise pour les questions legales specifiques a votre situation.*
