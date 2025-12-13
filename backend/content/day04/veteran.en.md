---
id: "25-day04-veteran-en"
version: 1
release: "2025-12-04T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 4

## Story
The scene shifts.
You're standing in an arena, a woman in front of you.

> Careful, that's Archwizard Twelvane!
  She's a fearsome beastmaster.
  I was preparing to fight her, but I died before I could challenge her.
  The only way to face her chimera is to craft your own.
  I can't recall my plan anymore.
  Which beasts was I going to tame?

## Puzzle
id: "chimera"
Select the beasts that are **not** part of Twelvane's chimera.

```yaml puzzle
type: "multi-choice"
size: "large"
options:
  - id: "gryphon"
    label: "Gryphon"
    image: "/assets/25_04_option_1.png"
  - id: "lion"
    label: "Lion"
    image: "/assets/25_04_option_2.png"
  - id: "dragon"
    label: "Dragon"
    image: "/assets/25_04_option_3.png"
  - id: "eagle"
    label: "Eagle"
    image: "/assets/25_04_option_4.png"
  - id: "bear"
    label: "Bear"
    image: "/assets/25_04_option_5.png"
  - id: "wamasu"
    label: "Wamasu"
    image: "/assets/25_04_option_6.png"
minSelections: 2
solution:
  - "eagle"
  - "bear"
  - "dragon"
```

## Wait for: chimera

## Story
> Yes, that was it!
  I was Maleric Pontecus.
  I gathered creatures and allies across Tamriel.
  Members of every alliance wished to fight by my side.
  Here, take these shields of my companions.
  Fight this battle for all mortals!

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "shields"
