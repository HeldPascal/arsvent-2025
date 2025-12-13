---
id: "25-day03-veteran-en"
version: 1
release: "2025-12-03T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 3

## Story
A door swings open and you enter the next room.
Star charts lie on the tables, and a telescope stands by the open window.

> This one loved the stars.
  But after he had gazed at all the constellations, Nirni's sky grew boring to him.
  He traveled and traveled until the sky changed.
  And now he can't remember who he was or where he's been…

## Puzzle
id: "sky"
Assign the images of the sky to the respective zone where the sky looks like that.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_03_background.png"
shape: "square"

items:
  - id: "sky-1"
    label: ""
    image: "/assets/25_03_option_1_veteran.png"
  - id: "sky-2"
    label: ""
    image: "/assets/25_03_option_2_veteran.png"
  - id: "sky-3"
    label: ""
    image: "/assets/25_03_option_3_veteran.png"

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
> Ah, this one remembers.
  This one was K'ren-Dar, the Wanderer.
  Here, this water has been touched by the light of every star.
  It was his most prized possession, and now it is yours.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "stardew"
