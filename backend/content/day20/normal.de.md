---
id: "25-day20-normal-de"
version: 1
release: "2025-12-20T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 20

## Story
Du blickst aus dem Fenster und draußen ist die Nacht hereingebrochen.
Hell leuchten die Sterne im Sternbild der Magierin.

> Immer wenn ich Angst hatte, erfüllten mich die Sterne mit Kraft.
  Immer wenn ich einsam war, erfüllten mich die Sterne mit Hoffnung.
  Doch nun weiß ich nicht mehr, welchen Stern ich um Hilfe bitten muss...
  Was soll ich nur tun?

## Puzzle
id: "CP"
Finde die beschriebenen Sterne im blauen CP-Baum.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_05_background_normal.png"
shape: "square"

items:
  - id: "shield-1"
    label: ""
    image: "/assets/25_05_option_1.png"
  - id: "shield-2"
    label: ""
    image: "/assets/25_05_option_2.png"
  - id: "shield-3"
    label: ""
    image: "/assets/25_05_option_3.png"

sockets:
  - id: "socket-1"
    label: ""
    position: { x: 0.9, y: 0.195 }
  - id: "socket-2"
    label: ""
    position: { x: 0.07, y: 0.196 }
  - id: "socket-3"
    label: ""
    position: { x: 0.488, y: 0.9 }

solution:
  - socketId: "socket-1"
    itemId: "shield-3"
  - socketId: "socket-2"
    itemId: "shield-2"
  - socketId: "socket-3"
    itemId: "shield-1"
```

## Wait for: cp

## Story
> Die Sterne, ich erinnere mich an ihre Namen!
  Und ich erinnere mich auch an meinen: Gin-Ei Xeirdes.
  Und ich habe keine Angst mehr.
  Wir sind Wurzelgeschwister, Ihr und ich.
  Bitte, nehmt meine Waffen und rettet uns.

## Reward
inventoryId: "weapons"
