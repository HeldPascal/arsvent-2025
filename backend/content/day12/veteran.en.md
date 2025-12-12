---
id: "25-day12-veteran-en"
version: 1
release: "2025-12-12T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 12

## Story
All at once you are no longer standing in a Khajiiti tent, but in a stone fortress.
Around you lie destroyed images of dangerous-looking monsters.
They stare at you as if they could actually see you.

> I slew them!
  I killed them all!
  Or did they slay me?
  What happened?
  I don't remember!

## Puzzle
id: "memory-bosses"
Put the bosses back together.

```yaml puzzle
type: "memory"
backImage: "/assets/25_12_background_not_selected.png"
hoverBackImage: "/assets/25_12_background_selected.png"
maxMisses: 12
missIndicator: "deplete:burst"
flipBackMs: 2500

cards:
  - id: "01"
    image: "/assets/25_12_option_01.png"
  - id: "02"
    image: "/assets/25_12_option_02.png"
  - id: "03"
    image: "/assets/25_12_option_03.png"
  - id: "04"
    image: "/assets/25_12_option_04.png"
  - id: "05"
    image: "/assets/25_12_option_05.png"
  - id: "06"
    image: "/assets/25_12_option_06.png"
  - id: "07"
    image: "/assets/25_12_option_07.png"
  - id: "08"
    image: "/assets/25_12_option_08.png"
  - id: "09"
    image: "/assets/25_12_option_09.png"
  - id: "10"
    image: "/assets/25_12_option_10.png"
  - id: "11"
    image: "/assets/25_12_option_11.png"
  - id: "12"
    image: "/assets/25_12_option_12.png"
  - id: "13"
    image: "/assets/25_12_option_13.png"
  - id: "14"
    image: "/assets/25_12_option_14.png"
  - id: "15"
    image: "/assets/25_12_option_15.png"
  - id: "16"
    image: "/assets/25_12_option_16.png"

solution:
  - { a: "07", b: "12" }
  - { a: "01", b: "15" }
  - { a: "10", b: "03" }
  - { a: "16", b: "05" }
  - { a: "14", b: "04" }
  - { a: "13", b: "02" }
  - { a: "09", b: "06" }
  - { a: "11", b: "08" }
```

## Wait for: memory-bosses

## Story
> No, I slew them.
  I remember again, all my battles and my name.
  I was Erendas of House Dres.
  Take this shard of volcanic glass from my homeland Vvardenfell.
  Carry it with you on the way to your next great battle.

## Reward
inventoryId: "obsidian"
