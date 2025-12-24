---
id: "25-day24-veteran-de"
version: 1
release: "2025-12-24T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 24

## Story
Du betrittst eine Arena.
Vor dir steht sie: Trinkt-Dein-Blut.
Sie hebt ihr Schwert in die Luft und schreit, während sie auf dich zustürmt.
In deinem Kopf schreien die Stimmen zurück.
Du weißt nicht, ob Trinkt-Dein-Blut sie hören kann, also schreist auch du.

Setze deine Fähigkeiten und deinen Trank ein, um die gewünschten Effekte zu erzielen.

## Puzzle
id: "expedition"
Trinkt-Dein-Blut wirft einen Fluch nach dir.
Du brauchst größere Schnelligkeit, um auszuweichen!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
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
Um ihr gewappnet zu sein, wirkst du kleinere Raserei und kleinere Entschlossenheit auf dich.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
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
Trinkt-Dein-Blut holt mit ihrem Schwert aus.
Schilde dich!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
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
Du hast viel Schaden abgefangen, aber du blutest.
Lege einen heilenden Kreis in die Arena!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
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
Trinkt-Dein-Blut ruft
> Feigling!
  Dadurch, dass du dich heilst, wirst du mich nie besiegen!
Dieses Spiel können 2 Leute spielen.
Verspotte sie!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
      type: "video/mp4"
  segment:
    start: 15.0
    # end: 22.0
    # start: 22.0
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
Du bereitest deine Offensive vor.
Belege Trinkt-Dein-Blut mit größerer Schändung und kleinerer Feigheit!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
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
Du näherst dich Trinkt-Dein-Blut auf 5 Meter.
Umgib dich mit Schaden über Zeit!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
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
Sie wirft erneut einen Fluch nach dir.
Es ist zu wenig Zeit, um auszuweichen.
Absorbiere das Projektil!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
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
Du spürst den Heldenmut durch deine Adern strömen.
Beschwöre einen tierischen Wächter!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
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
Trinkt-Dein-Blut ist nun endgültig in der Defensive.
Erhöhe deinen kritischen Schaden für einen letzten Ansturm!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
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
    image: "/assets/25_13_reward_1.png"
    position: { x: 0.85, y: 0.8 }

solution: ["quickslot"]
```

## Wait for: potion

## Puzzle
id: "attack"
Du greifst deinen Dolch und deine Axt fester.
Jetzt oder nie: Greife Trinkt-Dein-Blut mit 4 raschen Angriffen an!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
      type: "video/mp4"
  segment:
    start: 44.0
    end: 46.0
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

solution: ["frontbar-3"]
```

## Wait for: attack

## Puzzle
id: "trap"
Trinkt-Dein-Blut ist fast erledigt.
Wirke ein letztes Mal Schaden auf sie und fang ihre Seele ein!

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_testrender.mov"
      type: "video/mp4"
  segment:
    start: 46.0
    end: 48.1
    # start: 48.1
    # end: 52.5
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

solution: ["backbar-3"]
```

## Wait for: trap

## Story
Du hast es geschafft!
Trinkt-Dein-Blut, der General des Wurmkults, wurde besiegt.
Nicht nur das: Du hast sie an eben jenen Seelenstein gebunden, den sie selbst erschaffen hatte, um andere zu quälen.
Du spürst, wie die gefangenen Seelen sich auf ihre Lebensessenz stürzen.
Vor deinen Augen löst sich die gefürchtete Trinkt-Dein-Blut in nichts als pure Leere auf.
Ohne seine Erschafferin kann der Seelenstein keine Seelen mehr halten.
Du spürst, wie die anderen Seelen nach und nach den Seelenstein verlassen um endlich ihre Reise nach Ätherius anzutreten.
Thurwe Hrorikson, Ursalette Metrane, K’ren-Dar, Maleric Pontecus, Ciira Imutis, Enniz at-Hunding, Gin-Ei Xeirdes, Lytril Telvanni, Estile, Falemon, N’aabi, Erendas Dres, Logorok Mogdza, Hilthe Schneetochter, Oraar Ugrud, Razaami, Itius Spurelus, Uralest Jeneve, Latharek, Magrub Grakish, Vilonia Woeus und zuletzt Telnidra.
Schließlich bist du einen Moment lang allein.
Und dann stehst du wieder vor dem zerstörten Lager des Wurmkults.
In deinen Händen hältst du den Seelenstein.
Er schimmert sauber und rein, nicht länger böse und gefährlich.

![Seelenstein](/assets/pure_soul_gem.png)

Du bist nicht sicher, wie viel Zeit vergangen ist.
Waren es 24 Minuten, Stunden oder Tage?
Du weißt jedoch, dass Tamriel ein Stück sicherer ist, als es noch war, bevor du dieses Abenteuer angetreten bist.
Du solltest Prinz Azah aufsuchen.
Er hat sicher eine Belohnung für dich.
