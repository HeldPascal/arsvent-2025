---
id: "25-day24-veteran-en"
version: 1
release: "2025-12-24T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 24

## Story
You enter an arena.
Before you she stands : Drinks-Your-Blood.
She raises her sword in the air and screams as she charges at you.
In your head, the voices scream back.
You don't know if Drinks-Your-Blood can hear them, so you scream too.

Use your skills and your potion to achieve the desired effects.

## Puzzle
id: "expedition"
Drinks-Your-Blood hurls a curse on you.
You will need major expedition to dodge it!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 0
    end: 3.0
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["frontbar-4"]
```

## Wait for: expedition

## Puzzle
id: "berserk"
In order to be prepared, you cast Minor Berserk and Minor Resolve upon yourself.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 3.0
    end: 6.0
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["backbar-2"]
```

## Wait for: berserk

## Puzzle
id: "light_shield"
Drinks-Your-Blood raises her sword.
Protect yourself!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 6.0
    end: 11.0
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["frontbar-1"]
```

## Wait for: light_shield

## Puzzle
id: "healing"
You have blocked a lot of damage, but you're bleeding.
Place a healing circle in the arena!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 11.0
    end: 15.0
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["backbar-4"]
```

## Wait for: healing

## Puzzle
id: "taunt"
Drinks-Your-Blood yells
> Coward!
  Healing yourself will never defeat me!
This game can be played by 2 people.
Taunt her!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 15.0
    end: 26.8
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["backbar-1"]
```

## Wait for: taunt

## Puzzle
id: "defile"
You prepare your offensive.
Afflict Drinks-Your-Blood with Major Defile and Minor Cowardice!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 24.0
    end: 29.0
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["backbar-5"]
```

## Wait for: defile

## Puzzle
id: "dmg_over_time"
You approach Drinks-Your-Blood to within 5 meters.
Surround yourself with damage over time!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 29.0
    end: 32.7
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["frontbar-2"]
```

## Wait for: dmg_over_time

## Puzzle
id: "shimmering_shield"
She hurls another curse at you.
There is not enough time to dodge.
Absorb the projectile!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 32.7
    end: 37.0
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["frontbar-5"]
```

## Wait for: shimmering_shield

## Puzzle
id: "ult"
You feel the heroism coursing through your veins.
Summon an animal guardian!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 37.0
    end: 39.8
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["ultimate"]
```

## Wait for: ult

## Puzzle
id: "potion"
Drinks-Your-Blood is now fully on the defensive.
Increase your critical damage for one last surge!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 39.8
    end: 44.0
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    image: "/assets/25_23_reward.png"
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_24_active_ulti.png"
    position: { x: 0.85, y: 0.8 }

solution: ["quickslot"]
```

## Wait for: potion

## Puzzle
id: "attack"
You grip your dagger and axe tighter.
Now or never: Attack Drinks-Your-Blood with 4 rapid attacks!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 44.0
    end: 46.0
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_24_active_ulti.png"
    position: { x: 0.85, y: 0.8 }

solution: ["frontbar-3"]
```

## Wait for: attack

## Puzzle
id: "trap"
Drinks-Your-Blood is almost finished.
Deal damage to her one last time and capture her soul!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 46.0
    end: 48.1
  freeze-frame: end
  preload: metadata

items:
  - id: "quickslot"
    label: ""
    position: { x: 0.15, y: 0.8 }
  - id: "frontbar-1"
    label: ""
    image: "/assets/25_19_reward.png"
    position: { x: 0.28, y: 0.7 }
  - id: "frontbar-2"
    label: ""
    image: "/assets/25_07_reward_2.png"
    position: { x: 0.39, y: 0.7 }
  - id: "frontbar-3"
    label: ""
    image: "/assets/25_07_reward_1.png"
    position: { x: 0.5, y: 0.7 }
  - id: "frontbar-4"
    label: ""
    image: "/assets/25_13_reward_2.png"
    position: { x: 0.61, y: 0.7 }
  - id: "frontbar-5"
    label: ""
    image: "/assets/25_13_reward_4.png"
    position: { x: 0.72, y: 0.7 }
  - id: "backbar-1"
    label: ""
    image: "/assets/25_22_reward.png"
    position: { x: 0.28, y: 0.9 }
  - id: "backbar-2"
    label: ""
    image: "/assets/25_07_reward_3.png"
    position: { x: 0.39, y: 0.9 }
  - id: "backbar-3"
    label: ""
    image: "/assets/25_14_reward.png"
    position: { x: 0.5, y: 0.9 }
  - id: "backbar-4"
    label: ""
    image: "/assets/25_07_reward_4.png"
    position: { x: 0.61, y: 0.9 }
  - id: "backbar-5"
    label: ""
    image: "/assets/25_13_reward_3.png"
    position: { x: 0.72, y: 0.9 }
  - id: "ultimate"
    label: ""
    image: "/assets/25_24_active_ulti.png"
    position: { x: 0.85, y: 0.8 }

solution: ["backbar-3"]
```

## Wait for: trap

## Puzzle
id: "finale"
Drinks-Your-Blood was defeated.
**Celebrate your victory over Drinks-Your-Blood!**

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_en.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_en.mp4"
      type: "video/mp4"
  segment:
    start: 48.1
    end: 52.5
  freeze-frame: end
  preload: metadata

items:
  - id: "fin"
    label: "VICTORY"
    position: { x: 0.5, y: 0.9 }

solution: ["fin"]
```

## Wait for: finale

## Story
You did it!
Your mission was completed successfully.
What comes next?
