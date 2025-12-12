---
id: "25-day12-veteran-de"
version: 1
release: "2025-12-12T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 12

## Story
Mit einem Mal stehst du nicht länger in einem khajiitischen Zelt, sondern einer steinernen Festung.
Um dich herum liegen zerstörte Bilder gefährlich aussehender Monster.
Sie starren dich an, als könnten sie dich tatsächlich sehen.

> Ich habe sie erschlagen!
  Ich habe sie alle getötet!
  Oder haben sie mich erschlagen?
  Was ist geschehen?
  Ich erinnere mich nicht!

## Puzzle
id: "memory-bosses"
Füge die Bosse wieder richtig zusammen.

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
> Nein, ich habe sie erschlagen.
  Ich erinnere mich wieder, an alle meine Schlachten und an meinen Namen.
  Ich war Erendas vom Hause Dres.
  Nehmt diesen Splitter Vulkanglas aus meiner Heimat Vvardenfell.
  Tragt ihn mit Euch auf dem Weg zu Eurer nächsten großen Schlacht.

## Reward
inventoryId: "obsidian"
