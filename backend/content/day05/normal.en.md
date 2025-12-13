---
id: "25-day05-normal-en"
version: 1
release: "2025-12-05T00:00:00Z"
language: "en"
mode: "normal"
solved:
  when: "all"
---

# 5

## Story
From the arena you are shifted into a preparation room.
The walls are covered in maps.
Reports and letters are scattered everywhere.

> My homeland was beautiful Cyrodiil.
  The Heartland.
  I was happy.
  But then, destruction.
  Was it the Daedra?
  No, there was a war… what happened?

## Puzzle
id: "cyrodiil"
Place the alliance emblems on the correct regions of the map.

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

## Wait for: cyrodiil

## Story
> A war?
  Of course—the Three Banners War!
  And I, Ciira Imutis, in the middle of it all.
  I helped the people flee as best I could.
  In the end, I fled as well.
  All that remains of my beloved Cyrodiil is this stone.
  Take it, I no longer need it.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "nickel"
