---
id: "25-day22-normal-en"
version: 1
release: "2025-12-22T00:00:00Z"
language: "en"
mode: "normal"
solved:
  when: "all"
---

# 22

## Story
You go through the next door and find yourself in a marketplace.
Portraits of three female merchants hang on the stalls.

> A market?
  Would you like to buy something?
  My inventory was always well-stocked.
  But now I have nothing left to offer you.
  I can't even tell you my name anymore...

## Puzzle
id: "currency"
Match these merchants with the currencies they accept.

```yaml puzzle
type: "pair-items"
left:
  - id: "dragontail"
    label: "Dragontail Blended Whisky"
    image: "/assets/25_21_option_5.png"
  - id: "withered"
    label: "Withered Tree Inn Venison Pot Roast"
    image: "/assets/25_21_option_4.png"
  - id: "firsthold"
    label: "Firsthold Fruit and Cheese Plate"
    image: "/assets/25_21_option_10.png"
  - id: "orcrest"
    label: "Orcrest Agony Pale Ale"
    image: "/assets/25_21_option_12.png"
right:
  - id: "velothi"
    label: "Velothi View Vintage Malbec"
    image: "/assets/25_21_option_3.png"
  - id: "port"
    label: "Port Hunding Pinot Noir"
    image: "/assets/25_21_option_6.png"
  - id: "tomato"
    label: "Tomato Garlic Chutney"
    image: "/assets/25_21_option_1.png"
  - id: "capon"
    label: "Capon Tomato-Beet Casserole"
    image: "/assets/25_21_option_7.png"
solution:
  - { left: "orcrest", right: "velothi" }
  - { left: "dragontail", right: "port" }
  - { left: "firsthold", right: "tomato" }
  - { left: "withered", right: "capon" }
```

## Wait for: currency

## Story
> These are Adhazabi, Urgalag, and Faustina.
  And I was Telnidra.
  We were friends.
  Adhazabi gave me jewelry, Faustina gave me furniture, and Urgalag taught me a skill of her undaunted friends.
  Look, I'll show you!

You sense that you have spoken with all the trapped souls.
Next, you should prepare for a confrontation with the one responsible for all of this: Drinks-Your-Blood.

## Reward
inventoryId: "taunt"
