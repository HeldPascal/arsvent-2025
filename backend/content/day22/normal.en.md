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
type: "drag-sockets"
background-image: "/assets/25_22_background.png"
shape: "square"

inventorySource:
  mode: "tags"
  tags: ["currency"]

sockets:
  - id: "adhazabi"
    label: "Adhazabi Aba-daro"
    image: "/assets/25_22_socket.png"
    position: { x: 0.17, y: 0.5 }
  - id: "faustina"
    label: "Faustina Curio"
    image: "/assets/25_22_socket.png"
    position: { x: 0.5, y: 0.5 }
  - id: "urgalag"
    label: "Urgalag Chief-bane"
    image: "/assets/25_22_socket.png"
    position: { x: 0.84, y: 0.5 }

solution:
  - socketId: "adhazabi"
    itemId: "alliance-points"
  - socketId: "faustina"
    itemId: "voucher"
  - socketId: "urgalag"
    itemId: "key"
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
