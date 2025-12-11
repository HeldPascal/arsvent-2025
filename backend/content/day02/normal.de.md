---
id: "25-day02-normal-de"
version: 1
release: "2025-12-02T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 2

## Story
Plötzlich stehst du nicht mehr draußen, sondern im Inneren eines Hauses.
Es scheint das Haus eines Alchemisten zu sein.
Du befindest dich in einem großen Labor und eine neue Stimme spricht zu dir:

> Ein Leben lang studierte ich Pflanzen, Tiere und Mineralien.
  Doch nun kenne ich nicht einmal mehr meinen eigenen Namen.
  Alles vermischt sich in meinem Kopf, wie ein Trank, der zu sehr gerührt wurde.
  Bitte hilf mir zu sehen, was zu mir gehört und was nicht.

## Puzzle
id: "alchemy1"
Finde die Ausnahme bei diesen Alchemiezutaten.

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: ""
    image: "/assets/25_02_round_1_option_1.png"
  - id: "2"
    label: ""
    image: "/assets/25_02_round_1_option_2.png"
  - id: "3"
    label: ""
    image: "/assets/25_02_round_1_option_3.png"
  - id: "4"
    label: ""
    image: "/assets/25_02_round_1_option_4.png"
solution: "2"
```

## Wait for: alchemy1

## Puzzle
id: "alchemy2"
Finde die Ausnahme bei diesen Alchemiezutaten.

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: ""
    image: "/assets/25_02_round_2_option_1.png"
  - id: "2"
    label: ""
    image: "/assets/25_02_round_2_option_2.png"
  - id: "3"
    label: ""
    image: "/assets/25_02_round_2_option_3.png"
  - id: "4"
    label: ""
    image: "/assets/25_02_round_2_option_4.png"
solution: "4"
```

## Wait for: alchemy2

## Puzzle
id: "alchemy3"
Finde die Ausnahme bei diesen Alchemiezutaten.

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: ""
    image: "/assets/25_02_round_3_option_1.png"
  - id: "2"
    label: ""
    image: "/assets/25_02_round_3_option_2.png"
  - id: "3"
    label: ""
    image: "/assets/25_02_round_3_option_3.png"
  - id: "4"
    label: ""
    image: "/assets/25_02_round_3_option_4.png"
solution: "3"
```

## Wait for: alchemy3

## Story
> Oh, endlich etwas Ruhe und Ordnung.
  Danke für diese Klarheit.
  Nun erinnere ich mich, mein Name war Ursalette Metrane.
  An diesem Alchemietisch machte ich all meine großen Entdeckungen.
  Er gehört nun Euch.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "craftingtable"
