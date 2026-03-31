# Marketing Texts — Petanque Master Launch

> Generated: 2026-03-31
> Tone: Personal, humble, competent, provencal charm
> Constraint: No exaggeration. 12 characters. 3 throwing styles. "Galets" currency.

---

## REDDIT POSTS

### r/indiegames — Post principal (with GIF)

**Title:**
> I spent 2 years making a petanque game in pixel art. It's free, and it actually has physics.

**Body:**
```
[GIF: first throw on Place du Village]

Petanque Master is a browser game I've been building in my spare time — a provencal bocce ball game with custom physics, 12 hand-crafted characters, and genuine FIPJP rules.

The physics were the hardest part. Spin (lateral and retro), terrain friction, wall bounces, rolling resistance on 5 different surfaces — I wrote ~500 lines of custom code instead of using a library, because no library got petanque right.

What it has:
- 3 throwing styles: lob (Demi-portee), high lob (Plombee), precision strike (Tir au Fer)
- 12 characters with unique stats and special abilities
- 5 terrains: Village dirt, Park grass, Hill slope, Beach sand, Docks tiles
- Arcade mode vs escalating opponents + free Quick Play sandbox
- Shop with cosmetic boules and cochonnets (the little target ball)
- Playable in French and English

It's playable right now in the browser, free:
[link]

Would love to hear what you think — especially if you've played real petanque and think the physics are off!
```

---

### r/WebGames — Post direct

**Title:**
> Petanque Master — free browser petanque game with pixel art and real physics

**Body:**
```
Petanque (bocce ball variant from the South of France) finally has a proper browser game.

3 throwing styles, 12 characters, 5 terrains, FIPJP rules. Custom physics engine — no library.

Playable in FR and EN. No install, no login.

[link]

Let me know if the physics feel right. The sand terrain is especially punishing (as it should be).
```

---

### r/petanque — Post communaute

**Title:**
> I made a petanque video game — with real FIPJP rules and physics. Would love feedback from actual players.

**Body:**
```
I play petanque seriously (not competitively, but I care about the rules), and I got frustrated with how badly video games handle the sport. Most either ignore spin, fake the physics, or don't know that the team farthest from the cochonnet replays.

So I built one properly.

Petanque Master is a free browser game with:
- Real FIPJP rules: 1v1, 3 balls each, team farthest from cochonnet replays, first to 13 wins
- 3 throwing techniques: Demi-portee (rolling), Plombee (vertical lob, high bounce risk), Tir au Fer (straight low strike)
- Spin: both lateral and retro. It actually affects the trajectory.
- 5 terrains with distinct friction: packed earth, grass, sand, slope, tiles
- Cochonnet must land 6-10m from the throwing circle (enforced)

It's definitely made by someone who has played a lot of petanque on actual terrain boulodromes, not someone who Googled "bocce ball rules."

Would love to know what you think — especially: does the Tir au Fer feel realistic? The sand terrain friction? 

[link] — free, no install, plays in any browser
```

---

### r/PixelArt — Post visuel (PAS de lien, regles du sub)

**Title:**
> The 5 terrains I drew for my petanque game. Each one has different physics.

**Body:**
```
[Screenshot: gameplay-plage.png ou gameplay-village.png, high quality]

Made for a browser petanque game I've been working on. The tiles are 32x32, rendered at 2x integer scale on an 832x480 canvas.

The sand terrain was the trickiest to get right visually — needed to communicate "this will slow your ball down" without text. I think the footprints and texture do it?

Tools: Aseprite for the tiles, Phaser 4 for the renderer.
```

---

## TWITTER / X THREAD (5 tweets)

**Tweet 1 (avec GIF, accroche):**
```
I spent 2 years making a petanque game.

Not because there wasn't one. Because every existing one has wrong physics.

Petanque Master is free in your browser now. Thread on why it took so long.

[link] [GIF]
```

**Tweet 2 (le probleme technique):**
```
The hard part: spin.

Real petanque has lateral spin and retro-spin. It changes where the ball ends up after impact.

Writing a custom physics engine (no library) to get this right: 500 lines. Worth it.

[Screenshot: gameplay-village.png — ball mid-flight]
```

**Tweet 3 (les personnages):**
```
12 characters. Each with:
- 4 stats (Precision, Power, Spin, Composure)
- A special ability (Mamie Josette shakes your aim. Yes, really.)
- Hand-drawn pixel art sprite

My favorites: Papi Rene (unshakeable calm) and La Choupe (dock enforcer who talks too much).

[Screenshot: vsintro-personnages.png]
```

**Tweet 4 (les terrains):**
```
5 terrains, 5 different experiences:

Village dirt → baseline, learn the physics here
Park grass → mixed friction zones, unpredictable
Hill slope → compensate your aim or lose
Beach sand → balls die fast, throw harder
Docks tiles → walls bounce, use it

[Screenshot: gameplay-plage.png]
```

**Tweet 5 (CTA):**
```
It's a free browser game.
No install. No login. No ads (itch.io).

Play it, tell me if the physics feel right — especially if you've played real petanque on an actual boulodrome.

[link]

#indiegame #pixelart #petanque #gamedev
```

---

## ITCH.IO DEVLOG #1

**Title:** Why I made a petanque game (and why it took so long)

**Body:**
```markdown
## The problem

Every petanque video game I've tried gets the physics wrong.

Either spin doesn't exist, or the "lob" is just a slow projectile with no arc, or they don't know that the team farthest from the cochonnet replays (not alternating turns). One popular mobile game calls the target ball a "pallino" — that's bocce. Petanque has a cochonnet. Different game, different culture.

I grew up watching old men play petanque under plane trees in the south of France. I know what it sounds like when a metal ball hits another one cleanly (a sharp metallic "tac"). I know that sand is brutal. That a Plombee gone wrong leaves you embarrassingly far. That a Tir au Fer that lands right feels like surgery.

So I built a game that gets this right.

## What I built

Petanque Master is a single-player browser game with:

- **Custom physics** (~500 lines, no library): real spin (lateral + retro), terrain friction, rolling resistance, wall bounces
- **3 throwing styles**: Demi-portee (rolling lob), Plombee (vertical drop), Tir au Fer (straight strike)
- **5 terrains** with distinct physics: packed earth, mixed grass, sloped hill, soft sand, hard tiles
- **12 characters** with unique stats and abilities — Papi Rene, Mamie Josette, La Choupe, and 9 others
- **FIPJP rules**: 1v1, 3 balls each, team farthest from cochonnet replays, first to 13

## Why it took 2 years

Getting physics to *feel* right is different from getting them technically correct.

I restarted the physics engine 3 times. The first version was too slippery. The second had spin that felt cosmetic (it moved the ball, but not in a way that matched intuition). The third version — which is what shipped — uses a coefficient of restitution based on actual petanque research and friction values tuned terrain by terrain.

The sand terrain alone took 2 weeks. Petanque on sand is brutal — the ball decelerates so fast that your throwing power calculation completely changes. I wanted players to feel that without reading a manual.

## What's next

Version 1.0 is live and complete. If it gets traction:
- V2 adds a village overworld to explore between matches
- More characters, more terrains, multiplayer is on the wishlist
- A mobile version is feasible (touch controls already work)

**Play it free here: [link]**

If you've played real petanque — I'd especially love your feedback on the physics. Tell me what feels wrong.
```

---

*All texts ready for copy-paste. Substitute [link] with the final itch.io URL.*
*Screenshots to attach: as indicated per post.*
