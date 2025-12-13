---
id: "25-day07-normal-en"
version: 1
release: "2025-12-07T00:00:00Z"
language: "en"
mode: "normal"
solved:
  when: "all"
---

# 7

## Story
Suddenly you are whisked away to yet another place.
You find yourself in a room with a totem, a strange device, and a statue.
The only door out is sealed.

> Stronger!
  I must become stronger.
  Normal challenges are not hard enough.
  Only then can I reach my goal.
  What was my goal?
  What was my name?
  By my tusks, I've forgotten!

## Puzzle
id: "hardmode1"
In which dungeon can you activate Hard Mode with this switch?

![Hard Mode Switch](/assets/25_07_round_1.png)

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: "Cradle of Shadows"
  - id: "2"
    label: "Icereach"
  - id: "3"
    label: "Frostvault"
solution: "1"
```

## Wait for: hardmode1

## Puzzle
id: "hardmode2"
In which dungeon can you activate Hard Mode with this switch?

![Hard Mode Switch](/assets/25_07_round_2.png)

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: "Cradle of Shadows"
  - id: "2"
    label: "Icereach"
  - id: "3"
    label: "Frostvault"
solution: "3"
```

## Wait for: hardmode2

## Puzzle
id: "hardmode3"
In which dungeon can you activate Hard Mode with this switch?

![Hard Mode Switch](/assets/25_07_round_3.png)

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: "Cradle of Shadows"
  - id: "2"
    label: "Icereach"
  - id: "3"
    label: "Frostvault"
solution: "2"
```

## Wait for: hardmode3

## Story
> My goal?
  To found my own clan.
  My name?
  Magrub Grakish.
  I remember everything again.
  I succeeded, but my clan was small.
  My sons and daughters are still out there.
  I taught them the skills for a good life.
  And I want to pass those skills on to you as well.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "weaponskills"
