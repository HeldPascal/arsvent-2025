---
id: "25-day02-veteran-en"
version: 1
release: "2025-12-02T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 2

## Story
Suddenly you're no longer outside, but inside a house.
It appears to be the house of an alchemist.
You find yourself in a large laboratory, and a new voice speaks to you:

> I spent my whole life studying plants, animals, and minerals.
  But now I don't even know my own name.
  Everything is jumbled together in my head, like a potion that's been stirred too much.
  Please help me see what belongs to me and what doesn't.

## Puzzle
id: "alchemy1"
Find the exception among these alchemy ingredients.

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: ""
    image: "/assets/25_02_round1_option1.png"
  - id: "2"
    label: ""
    image: "/assets/25_02_round1_option2.png"
  - id: "3"
    label: ""
    image: "/assets/25_02_round1_option3.png"
  - id: "4"
    label: ""
    image: "/assets/25_02_round1_option4.png"
solution: "2"
```

## Wait for: alchemy1

## Puzzle
id: "alchemy2"
Find the exception among these alchemy ingredients.

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: ""
    image: "/assets/25_02_round2_option1.png"
  - id: "2"
    label: ""
    image: "/assets/25_02_round2_option2.png"
  - id: "3"
    label: ""
    image: "/assets/25_02_round2_option3.png"
  - id: "4"
    label: ""
    image: "/assets/25_02_round2_option4.png"
solution: "4"
```

## Wait for: alchemy2

## Puzzle
id: "alchemy3"
Find the exception among these alchemy ingredients.

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: ""
    image: "/assets/25_02_round3_option1.png"
  - id: "2"
    label: ""
    image: "/assets/25_02_round3_option2.png"
  - id: "3"
    label: ""
    image: "/assets/25_02_round3_option3.png"
  - id: "4"
    label: ""
    image: "/assets/25_02_round3_option4.png"
solution: "3"
```

## Wait for: alchemy3

## Puzzle
id: "alchemy4"
Find the exception among these alchemy ingredients.

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: ""
    image: "/assets/25_02_round4_option1.png"
  - id: "2"
    label: ""
    image: "/assets/25_02_round4_option2.png"
  - id: "3"
    label: ""
    image: "/assets/25_02_round4_option3.png"
  - id: "4"
    label: ""
    image: "/assets/25_02_round4_option4.png"
solution: "1"
```

## Wait for: alchemy4

## Story
> Oh, finally some peace and order.
  Thank you for this clarity.
  Now I remember, my name was Ursalette Metrane.
  At this alchemy table, I made all my great discoveries.
  It now belongs to you.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "craftingtable"
