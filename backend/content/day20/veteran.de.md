---
id: "25-day20-veteran-de"
version: 1
release: "2025-12-20T00:00:00Z"
language: "de"
mode: "veteran"
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
background-image: "/assets/25_05_background_veteran.png"
shape: "circle"

items:
  - id: "shield-1"
    label: "Aaaaa"
    image: "/assets/25_05_option_1.png"
    defaultSocketId: "start-1"
  - id: "shield-2"
    label: "Bbbbb"
    image: "/assets/25_05_option_2.png"
    defaultSocketId: "start-2"
  - id: "shield-3"
    label: "Ccccc"
    image: "/assets/25_05_option_3.png"
    defaultSocketId: "start-3"
  - id: "shield-4"
    label: "Ddddd"
    image: "/assets/25_05_option_3.png"

sockets:
  # starting sockets for default placements (centerline, evenly spaced)
  - id: "start-1"
    label: ""
    position: { x: 0.35, y: 0.50 }
  - id: "start-2"
    label: ""
    position: { x: 0.50, y: 0.50 }
  - id: "start-3"
    label: ""
    position: { x: 0.65, y: 0.50 }
  # target sockets that accept any of the three items
  - id: "socket-1"
    label: ""
    position: { x: 0.20, y: 0.52 }
  - id: "socket-2"
    label: ""
    position: { x: 0.50, y: 0.30 }
  - id: "socket-3"
    label: ""
    position: { x: 0.80, y: 0.52 }

solution:
  lists:
    - id: "any-shield"
      items: ["shield-1", "shield-2", "shield-3"]
  sockets:
    - socketId: "socket-1"
      listId: "any-shield"
    - socketId: "socket-2"
      listId: "any-shield"
    - socketId: "socket-3"
      listId: "any-shield"
```

## Wait for: cp

## Story
> Die Sterne, ich erinnere mich an ihre Namen!
  Und ich erinnere mich auch an meinen: Gin-Ei Xeirdes.
  Und ich habe keine Angst mehr.
  Wir sind Wurzelgeschwister, Ihr und ich.
  Bitte, nehmt meine Waffen und rettet uns.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "weapons"