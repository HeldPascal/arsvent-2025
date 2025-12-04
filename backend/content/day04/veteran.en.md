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
The arena coalesces around you, Twelvane poised to strike.

> “That’s Archmage Twelvane. Her chimera is deadly. I died before I could challenge her. To defeat her, you need a chimera of your own. Which beasts are **not** part of Twelvane’s creature?”

## Puzzle
id: "chimera"
Select the beasts that are **not** part of Twelvane’s chimera.

```yaml puzzle
type: "multi-choice"
options:
  - id: "gryphon"
    label: "Gryphon"
    image: "/assets/25_04_option1.png"
  - id: "lion"
    label: "Lion"
    image: "/assets/25_04_option2.png"
  - id: "dragon"
    label: "Dragon"
    image: "/assets/25_04_option3.png"
  - id: "eagle"
    label: "Eagle"
    image: "/assets/25_04_option4.png"
  - id: "bear"
    label: "Bear"
    image: "/assets/25_04_option5.png"
  - id: "wamasu"
    label: "Wamasu"
    image: "/assets/25_04_option6.png"
minSelections: 2
solution:
  - "eagle"
  - "bear"
  - "dragon"
```

## Wait for: chimera

## Story
> “I remember. I was Maleric Pontecus. I gathered creatures and allies across Tamriel. Members of every alliance stood ready to fight beside me. These shields belonged to my companions. Fight this battle for all mortals!”

## Reward
inventoryId: "shields"
