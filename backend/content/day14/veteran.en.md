---
id: "25-day14-veteran-en"
version: 1
release: "2025-12-14T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 14

## Story
You cross the hall and at the other end there are several roughly hewn sculptures.
You recognize that these are Mundus Stones.

> My quest... my final quest.
  Did I complete it?
  First, enter the tower, then perform the ritual there, and finally rescue the lady.
  That was my quest.
  Did I do it?

## Puzzle
id: "mundus"
First find the constellation of the Tower, then the Ritual and finally the Lady.

```yaml puzzle
type: "multi-choice"
size: "large"
options:
  - id: "1"
    label: ""
    image: "/assets/25_14_option_1.png"
  - id: "2"
    label: ""
    image: "/assets/25_14_option_2.png"
  - id: "3"
    label: ""
    image: "/assets/25_14_option_3.png"
  - id: "4"
    label: ""
    image: "/assets/25_14_option_4.png"
  - id: "5"
    label: ""
    image: "/assets/25_14_option_5.png"
minSelections: 3
ordered: true
solution:
  - "3"
  - "4"
  - "1"
```

## Wait for: mundus

## Story
> My quest was completed.
  I rescued the lady and returned to the College of Winterhold.
  There, I, Hilthe Snowdaughter, was welcomed with mead and a feast.
  My mentor there once taught me this skill, and now I wish to pass my knowledge on to you.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "soultrap"
