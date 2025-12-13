---
id: "25-day11-veteran-en"
version: 1
release: "2025-12-11T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 11

## Story
A door swings open behind you.
For a moment you think it leads back to the map room you saw before.
But when you step through, you realize it is a tent with a huge map pinned to the canvas.

> This one traveled far, even as a tiny kitten.
  This one knew every grain of sand and every place of danger.
  But now she no longer even remembers the feeling of warm sands beneath her paws.
  What if she steps into dangerous teritory now and doesn't even notice?

## Puzzle
id: "poi"
Which of these instances actually exist?

```yaml puzzle
type: "select-items"
background-image: "/assets/25_11_background.png"
shape: "square"

items:
  - id: "1"
    label: ""
    image: "/assets/25_11_option_2.png"
    position: { x: 0.91, y: 0.92 }
  - id: "2"
    label: ""
    image: "/assets/25_11_option_3.png"
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
> Elsweyr, warm sands and bright moons.
  This one remembers now.
  Her name was N'aabi.
  And now she knows where she must go.
  Take this stone she found as a kitten and carried ever since.
  She no longer needs it.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "moonstone"
