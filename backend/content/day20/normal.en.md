---
id: "25-day20-normal-en"
version: 1
release: "2025-12-20T00:00:00Z"
language: "en"
mode: "normal"
solved:
  when: "all"
---

# 20

## Story
You look out of the window and night has fallen outside.
The stars shine brightly in the constellation of the Mage.

> Whenever I was afraid, the stars filled me with strength.
  Whenever I was lonely, the stars filled me with hope.
  But now I do not know which star to ask for help...
  Whatever should I do?

## Puzzle
id: "CP"
Find the described stars in the blue CP tree.

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
> The stars, I remember their names!
  And I remember mine too: Gin-Ei Xeirdes.
  And I am no longer afraid.
  We are root-siblings, you and I.
  Please, take my weapons and save us.

## Reward
inventoryId: "weapons"