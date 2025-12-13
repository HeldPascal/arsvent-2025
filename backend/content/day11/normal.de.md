---
id: "25-day11-normal-de"
version: 1
release: "2025-12-11T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 11

## Story
Hinter dir schwingt eine Tür auf.
Kurz glaubst du, es sei ein Durchgang zu dem Raum voller Karten, den du schon einmal gesehen hast.
Aber als du hineingehst, bemerkst du, dass es eigentlich ein Zelt ist, an dessen Wand eine große Karte hängt.

> Diese hier reiste viel, schon als kleines Kätzchen.
  Sie kannte jedes Sandkorn und jede Stelle voller Gefahren.
  Doch nun erinnert sich diese noch nicht einmal mehr an das Gefühl warmer Sande an ihren Pfoten.
  Was, wenn sie nun ein gefährliches Gebiet betritt und merkt es nicht einmal?

## Puzzle
id: "poi"
Welche dieser Instanzen gibt es wirklich?

```yaml puzzle
type: "select-items"
background-image: "/assets/25_11_background.png"
shape: "square"

items:
  - id: "1"
    label: ""
    image: "/assets/25_11_option_1.png"
    position: { x: 0.91, y: 0.92 }
  - id: "2"
    label: ""
    image: "/assets/25_11_option_1.png"
    position: { x: 0.65, y: 0.2 }
  - id: "3"
    label: ""
    image: "/assets/25_11_option_2.png"
    position: { x: 0.22, y: 0.48 }
  - id: "4"
    label: ""
    image: "/assets/25_11_option_3.png"
    position: { x: 0.37, y: 0.46 }
  - id: "5"
    label: ""
    image: "/assets/25_11_option_2.png"
    position: { x: 0.5, y: 0.8 }
  - id: "6"
    label: ""
    image: "/assets/25_11_option_3.png"
    position: { x: 0.6, y: 0.6 }

solution: ["3", "4"]
```

## Wait for: poi

## Story
> Elsweyr, warme Sande und helle Monde.
  Diese erinnert sich.
  Ihr Name war N'aabi.
  Und jetzt weiß diese wieder, wo sie hingehen muss.
  Nehmt diesen Stein, den diese als Kätzchen fand und immer bei sich trug.
  Sie braucht ihn nicht mehr.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "moonstone"
