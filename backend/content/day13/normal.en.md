---
id: "25-day13-normal-en"
version: 1
release: "2025-12-13T00:00:00Z"
language: "en"
mode: "normal"
solved:
  when: "all"
---

# 13

## Story
The walls around you are shifting.
The small room turns into a huge hall.
The entire floor is covered with symbols and you are standing at the edge of a large grid.

> I once had many skills.
  I was neither a knight nor a sorcerer, neither a necromancer nor an arcanist.
  I was not a templar and I did not wield a blade in the night.
  But what was I then?

## Puzzle
id: "skills"
Select all the abilities of the class Warden.
First select the highlighted number at the start.
Then choose the skill that is directly adjacent to it.
Work your way through until you reach the hightlighted number at end.

```yaml puzzle
type: "grid-path"
grid: { width: 9, height: 9 }
backgroundImage: "/assets/25_13_background.png"

solution:
  startColumn: 5
  goalColumn: 4
  path:
    - { x: 5, y: 1 }
    - { x: 5, y: 2 }
    - { x: 5, y: 3 }
    - { x: 5, y: 4 }
    - { x: 4, y: 4 }
    - { x: 3, y: 4 }
    - { x: 3, y: 5 }
    - { x: 3, y: 6 }
    - { x: 3, y: 7 }
    - { x: 4, y: 7 }
    - { x: 5, y: 7 }
    - { x: 6, y: 7 }
    - { x: 7, y: 7 }
    - { x: 7, y: 8 }
    - { x: 7, y: 9 }
    - { x: 6, y: 9 }
    - { x: 5, y: 9 }
    - { x: 4, y: 9 }
```

## Wait for: skills

## Story
> It's true, I was Logorok Mogdza, and I was a Warden.
  I loved all the animals and plants.
  Pay close attention, and I'll teach you my most important skills!

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "wardenskills"
