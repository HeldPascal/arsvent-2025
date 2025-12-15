---
id: "25-day14-veteran-de"
version: 1
release: "2025-12-14T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 14

## Story
Du durchquerst die Halle und am anderen Ende stehen mehrere grobe Skulpturen.
Du erkennst, dass es sich um Mundussteine handelt.

> Mein Auftrag... mein letzter Auftrag.
  Habe ich ihn erfüllt?
  Betritt zuerst den Turm, führe dort das Ritual durch und rette dann die Fürstin.
  Das war mein Auftrag.
  Habe ich es geschafft?

## Puzzle
id: "mundus"
Finde zuerst das Sternbild Turm, dann das Ritual und dann die Fürstin.

```yaml puzzle
type: "multi-choice"
size: "large"
options:
  - id: "1"
    label: ""
    image: "/assets/25_14_option_1.png"
  - id: "2"
    label: ""
    image: "/assets/25_14_option_2.png"
  - id: "3"
    label: ""
    image: "/assets/25_14_option_3.png"
  - id: "4"
    label: ""
    image: "/assets/25_14_option_4.png"
  - id: "5"
    label: ""
    image: "/assets/25_14_option_5.png"
minSelections: 3
ordered: true
solution:
  - "3"
  - "4"
  - "1"
```

## Wait for: mundus

## Story
> Mein Auftrag wurde erfüllt.
  Ich rettete die Fürstin und kehrte zur Akademie von Winterfeste zurück.
  Dort empfing man mich, Hilthe Schneetochter, mit Met und einem Fest.
  Mein Mentor dort lehrte mich einst diese Fähigkeit und nun möchte ich mein Wissen an Euch weitergeben.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "soultrap"
