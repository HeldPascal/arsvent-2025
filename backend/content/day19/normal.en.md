---
id: "25-day19-normal-en"
version: 1
release: "2025-12-19T00:00:00Z"
language: "en"
mode: "normal"
solved:
  when: "all"
---

# 19

## Story
The battle scene dissolves before you.
You are gently lowered to the ground and now face only a lone warrior.

> That is me, isn't it?
  Don't even try to attack me!
  I know how to defend myself!
  Well, I used to know...

## Puzzle
id: "defense"
Which armor skill do you need to use in order to achieve this effect?

![Location](/assets/25_19_background_normal.png)

```yaml puzzle
type: "single-choice"
options:
  - id: "light"
    label: "Annulment"
    image: "/assets/25_19_option_1.png"
  - id: "medium"
    label: "Evasion"
    image: "/assets/25_19_option_2.png"
  - id: "heavy"
    label: "Unstoppable"
    image: "/assets/25_19_option_3.png"
solution: "light"
```

## Wait for: defense

## Story
> That's true!
  Now I remember.
  I was able to create this magical shield in oder to protect myself.
  Many have come to me, Latharek, over the years to learn this technique.
  And now I will teach it to you!

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "armorskill"
