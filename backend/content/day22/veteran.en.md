---
id: "25-day21-veteran-en"
version: 1
release: "2025-12-21T00:00:00Z"
language: "en"
mode: "veteran"
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
  - id: "muthseras"
    label: "Muthsera's Remorse"
    image: "/assets/25_21_option_2.png"
  - id: "orcrest"
    label: "Orcrest Agony Pale Ale"
    image: "/assets/25_21_option_12.png"
  - id: "sticky"
    label: "Sticky Pork and Radish Noodles"
    image: "/assets/25_21_option_11.png"
right:
  - id: "velothi"
    label: "Velothi View Vintage Malbec"
    image: "/assets/25_21_option_3.png"
  - id: "hearts"
    label: "Heart's Day Rose Tea"
    image: "/assets/25_21_option_8.png"
  - id: "port"
    label: "Port Hunding Pinot Noir"
    image: "/assets/25_21_option_6.png"
  - id: "tomato"
    label: "Tomato Garlic Chutney"
    image: "/assets/25_21_option_1.png"
  - id: "garlic"
    label: "Garlic Cod with Potato Crust"
    image: "/assets/25_21_option_9.png"
  - id: "capon"
    label: "Capon Tomato-Beet Casserole"
    image: "/assets/25_21_option_7.png"
solution:
  - { left: "orcrest", right: "velothi" }
  - { left: "dragontail", right: "port" }
  - { left: "firsthold", right: "tomato" }
  - { left: "withered", right: "capon" }
  - { left: "muthseras", right: "hearts" }
  - { left: "sticky", right: "garlic" }
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
