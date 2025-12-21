---
id: "25-day05-veteran-en"
version: 1
release: "2025-12-05T00:00:00Z"
language: "en"
mode: "veteran"
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
background-image: "/assets/25_05_background_veteran.png"
shape: "square"

inventorySource:
  mode: "tags"
  tags: ["weapon"]

sockets:
  - id: "socket-pact"
    label: ""
    position: { x: 0.104, y: 0.8 }
  - id: "socket-covenant"
    label: ""
    position: { x: 0.93, y: 0.8 }
  - id: "socket-dominion"
    label: ""
    position: { x: 0.525, y: 0.11 }

solution:
  - socketId: "socket-pact"
    itemId: "shield-pact"
  - socketId: "socket-covenant"
    itemId: "shield-covenant"
  - socketId: "socket-dominion"
    itemId: "shield-dominion"
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
