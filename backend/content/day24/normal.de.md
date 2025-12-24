---
id: "25-day24-normal-de"
version: 1
release: "2025-12-24T00:00:00Z"
language: "de"
mode: "normal"
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
Eine der Fähigkeiten des Hüters kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
id: "slayer"
Um ihr gewappnet zu sein, wirkst du kleinere Raserei und kleinere Entschlossenheit auf dich.
Eine der Fähigkeiten des Heilungsstabs kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Die Fähigkeit der leichten Rüstung kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Eine der Fähigkeiten des Heilungsstabs kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Die Fähigkeit der Unerschrockenen kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Du bereitest deine Offensive vor.
Belege Trinkt-Dein-Blut mit größerer Schändung und kleinerer Feigheit!
Eine der Fähigkeiten des Hüters kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Eine der Fähigkeiten mit zwei Einhandwaffen kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Eine der Fähigkeiten des Hüters kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Eine der Fähigkeiten des Hüters kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Dein Trank kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Du greifst deinen Dolch und deine Axt fester.
Jetzt oder nie: Greife Trinkt-Dein-Blut mit 4 raschen Angriffen an!
Eine der Fähigkeiten mit zwei Einhandwaffen kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Trinkt-Dein-Blut ist fast erledigt.
Wirke ein letztes Mal Schaden auf sie und fang ihre Seele ein!
Die letzte verbleibende Fähigkeit kann dir dabei helfen.

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
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
Trinkt-Dein-Blut wurde besiegt.
**Feiere deinen Sieg über Trinkt-Dein-Blut!**

```yaml puzzle
type: "select-items"
shape: "square"
background-video:
  sources:
    - src: "/assets/25_24_combat_de.webm"
      type: "video/webm"
    - src: "/assets/25_24_combat_de.mp4"
      type: "video/mp4"
  segment:
    start: 48.1
    end: 52.5
  freeze-frame: end
  preload: metadata

items:
  - id: "fin"
    label: "SIEG"
    position: { x: 0.5, y: 0.9 }

solution: ["fin"]
```

## Wait for: finale

## Story
Du hast es geschafft!
Dein Auftrag wurde erfolgreich ausgeführt.
Was kommt nun als nächstes?
