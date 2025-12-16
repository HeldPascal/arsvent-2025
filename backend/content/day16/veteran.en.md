---
id: "25-day16-veteran-en"
version: 1
release: "2025-12-16T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 16

## Story
The space around you changes again.
A table appears before you, upon which lies a model of a ruined temple.
Glittering and sparkling dragon scales lie scattered across it.

> The Moon-Bishop of Devine Alkosh spoke to her.
  He invited her to come to Sunspire and see the glory of Jone, Jode, and Alkosh in person.
  Why then can't she remember what it was like to stand before the Divines?

## Puzzle
id: "sunspire"
Match the correctly color scales to the locations where you fight Lokkestiiz, Nahviintaas, and Yolnahkriin.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_16_background.png"
shape: "square"

items:
  - id: "scales-purple"
    label: ""
    image: "/assets/25_16_option_1.png"
  - id: "scales-gold"
    label: ""
    image: "/assets/25_16_option_2.png"
  - id: "scales-red"
    label: ""
    image: "/assets/25_16_option_3.png"
  - id: "scales-green"
    label: ""
    image: "/assets/25_16_option_4.png"
  - id: "scales-iceblue"
    label: ""
    image: "/assets/25_16_option_5.png"

sockets:
  - id: "lokkestiiz"
    label: ""
    image: "/assets/25_16_socket.png"
    position: { x: 0.61, y: 0.6 }
  - id: "yolnahkriin"
    label: ""
    image: "/assets/25_16_socket.png"
    position: { x: 0.426, y: 0.633 }
  - id: "nahviintaas"
    label: ""
    image: "/assets/25_16_socket.png"
    position: { x: 0.515, y: 0.46 }

solution:
  - socketId: "lokkestiiz"
    itemId: "scales-iceblue"
  - socketId: "yolnahkriin"
    itemId: "scales-red"
  - socketId: "nahviintaas"
    itemId: "scales-gold"
```

## Wait for: sunspire

## Story
> This one didn't see any Divines, no.
  She was Razaami, a pilgrim.
  But when she reached Sunspire, the priests told her that the dragons were imposters!
  They were evil.
  So Razaami took her gift for the Divines back with her.
  Now you shall have it, five-claw, for this one believes in you.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "nirncrux"
