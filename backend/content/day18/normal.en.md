---
id: "25-day18-normal-en"
version: 1
release: "2025-12-18T00:00:00Z"
language: "en"
mode: "normal"
solved:
  when: "all"
---

# 18

## Story
The ground beneath your feet dissolves, and you plummet into the heart of a raging battle.
Just before you hit the ground, time freezes around you.
You can look around without any pressure.

> These are my brothers and sisters.
  We were fighting.
  Why?
  It was important, that much I know.
  Were we victorious?
  How did the battle go?

## Puzzle
id: "scriveners"
Find at least 4 of the impossible things during the fight in Scriverner's Hall.

```yaml puzzle
type: "select-items"
background-image: "/assets/25_18_background.png"
shape: "square"
requiredSelections: 4

items:
  - id: "group-frame"
    position: { x: 0.08, y: 0.16 }
  - id: "health-bar"
    position: { x: 0.68, y: 0.06 }
  - id: "boss-level"
    position: { x: 0.4, y: 0.1 }
  - id: "boss-immunity"
    position: { x: 0.52, y: 0.1 }
  - id: "player-dead"
    position: { x: 0.7, y: 0.48 }
  - id: "social-icons"
    position: { x: 0.02, y: 0.79 }
  - id: "skill-bar"
    position: { x: 0.5, y: 0.96 }
  - id: "ultimate"
    position: { x: 0.615, y: 0.96 }
  - id: "soul-resorvoire"
    position: { x: 0.95, y: 0.96 }

  - id: "magicka"
    position: { x: 0.21, y: 0.9 }
  - id: "stamina"
    position: { x: 0.8, y: 0.9 }
  - id: "quickslot"
    position: { x: 0.39, y: 0.96 }
  - id: "crosshair"
    position: { x: 0.5, y: 0.5 }
  - id: "red-area"
    position: { x: 0.87, y: 0.63 }
  - id: "npc"
    position: { x: 0.79, y: 0.47 }
  - id: "background-banner"
    position: { x: 0.74, y: 0.29 }
  - id: "background-structure"
    position: { x: 0.37, y: 0.35 }
  - id: "crystall"
    position: { x: 0.16, y: 0.57 }

solution:
  - "group-frame"
  - "health-bar"
  - "boss-level"
  - "boss-immunity"
  - "player-dead"
  - "social-icons"
  - "skill-bar"
  - "ultimate"
  - "soul-resorvoire"
```

## Wait for: scriveners

## Story
> My beloved siblings, my comrades.
  I remember all their faces.
  And my own, too.
  I was Uralest Jeneve.
  Each of us was a specialist in a field.
  My specialty was crafting equipment.
  Never go into battle without good gear!
  I was often rewarded for my skills.
  Take this.
  It is not one of my weapons or armor, but it is the next best thing.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "voucher"
