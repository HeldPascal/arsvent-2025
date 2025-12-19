---
id: "25-day21-veteran-en"
version: 1
release: "2025-12-21T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 21

## Story
A door that was sealed up until now swings open.
You step through it into a large kitchen.
The shelves are filled with ingredients, several dishes are simmering and grilling, and numerous barrels are just waiting to be emptied.
It smells heavenly.

> Add a pinch of sugar to the slaughterfish.
  That's how the recipe goes, isn't it?
  No, no, that can't be right.
  Stir a pinch of pepper into the custard!
  No, no, no!
  I don't remember!

## Puzzle
id: "food"
Any two of these buff foods will have the same effect.
Find the pairs.

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

## Wait for: food

## Story
> A little of this, a little of that, and then let it simmer.
  Yes, that's how it's done!
  I remember all my recipes.
  Chef Vilonia Woeus, that was me.
  Members of all alliances came to my restaurant.
  A shame I will never be able to cook for you.
  Take this instead.
  These are tough times, and you have a tough fight ahead of you.

You sense that one more trapped soul is waiting for your aid.

## Reward
inventoryId: "alliance-points"
