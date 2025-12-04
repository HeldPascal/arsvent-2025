---
id: "25-day03-veteran-de"
version: 1
release: "2025-12-03T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 3

## Story
Eine Tür schwingt auf und du betrittst den Raum nebenan.
Auf den Tischen liegen Sternenkarten und am geöffneten Fenster steht ein Teleskop.

> Dieser liebte die Sterne.
  Doch nachdem er alle Sternbilder betrachtet hatte, wurde der Himmel von Nirni ihm langweilig.
  Dieser reiste und reiste, bis der Himmel sich wandelte.
  Und nun kann dieser sich nicht erinnern, wer er war und wo er gewesen ist…

## Puzzle
id: "sky"
Weise die Aufnahmen des Himmels dem jeweiligen Gebiet zu, in dem der Himmel so aussieht.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_03_background.png"
shape: "square"

items:
  - id: "sky-1"
    label: ""
    image: "/assets/25_03_option1Vet.png"
  - id: "sky-2"
    label: ""
    image: "/assets/25_03_option2Vet.png"
  - id: "sky-3"
    label: ""
    image: "/assets/25_03_option3Vet.png"

sockets:
  - id: "socket-1"
    label: ""
    position: { x: 0.8, y: 0.1 }
  - id: "socket-2"
    label: ""
    position: { x: 0.18, y: 0.1 }
  - id: "socket-3"
    label: ""
    position: { x: 0.22, y: 0.9 }

solution:
  - socketId: "socket-1"
    itemId: "sky-1"
  - socketId: "socket-2"
    itemId: "sky-2"
  - socketId: "socket-3"
    itemId: "sky-3"
```

## Wait for: sky

## Story
> Ah, dieser erinnert sich.
  Dieser war K'ren-Dar, der Wanderer.
  Hier, dieses Wasser wurde vom Licht jedes Sterns berührt.
  Es war der wertvollste Besitz von diesem, und nun gehört es Euch.

## Reward
inventoryId: "stardew"
