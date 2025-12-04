---
id: "25-day01-normal-en"
version: 1
release: "2025-12-01T00:00:00Z"
language: "en"
mode: "normal"
solved:
  when: "all"
---

# 1

## Story
A magical wave washes over you.
The soul gem has pulled you inside of itself!
Everything feels almost dreamlike.
You stand on a shore.
The voices in your head grow louder and clearer.
One comes to the forefront and speaks:

> I traveled the world and mapped out what I saw.
  Was this the last place I visited?
  Where was I when death found me?

## Puzzle
id: "poi"
Which symbol marks this place on your map?

![Location](/assets/25_01_background.png)

```yaml puzzle
type: single-choice
options:
  - id: "1"
    label: ""
    image: "/assets/25_01_option1.png"
  - id: "2"
    label: ""
    image: "/assets/25_01_option2.png"
  - id: "3"
    label: ""
    image: "/assets/25_01_option3.png"
solution: "1"
```

## Wait for: poi

## Story
> Yes, I remember.
  My name was Thurwe Hrorikson.
  And this is Kynes Aegis, my home and my final trial.
  Thank you.
  Take this restoration staff.
  May it serve you better than it served me.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "restostaff"
