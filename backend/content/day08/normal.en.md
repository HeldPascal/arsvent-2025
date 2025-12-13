---
id: "25-day08-normal-en"
version: 1
release: "2025-12-08T00:00:00Z"
language: "en"
mode: "normal"
solved:
  when: "all"
---

# 8

## Story
Behind you the door swings open.
You step through and find yourself in a stable.
In front of you stand several horses and… something else.

> My companions and I… we prevailed!
  We prevailed and rode away.
  Where did we go?
  Where did we come from?

## Puzzle
id: "mount"
Which trial rewards you with this mount?

![Mount](/assets/25_08_background_normal.png)

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: "Rockgrove"
  - id: "2"
    label: "Sanity's Edge"
  - id: "3"
    label: "Lucent Citadel"
  - id: "4"
    label: "Dreadsail Reef"
solution: "3"
```

## Wait for: mount

## Story
> Yes, the Lucent Citadel.
  That is where my friends and I fought.
  I was Lytril Telvanni, and on that day my weapon carried a strong enchantment.
  Take this glyph.
  May it serve you in your coming battles as well as it served me in mine.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "glyph"
