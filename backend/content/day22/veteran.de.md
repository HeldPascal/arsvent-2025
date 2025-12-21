---
id: "25-day22-veteran-de"
version: 1
release: "2025-12-22T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 22

## Story
Du gehst durch die nächste Tür und du befindest dich auf einem Marktplatz.
An den Ständen hängen die Porträts von 3 Händlerinnen.

> Ein Markt?
  Möchtet Ihr etwas kaufen?
  Mein Inventar war immer gut gefüllt.
  Aber nun kann ich Euch nichts mehr anbieten.
  Ich kann Euch nicht einmal mehr meinen Namen nennen...

## Puzzle
id: "currency"
Ordne diesen Händlerinnen die Währungen zu, die sie akzeptieren.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_22_background.png"
shape: "square"

inventorySource:
  mode: "tags"
  tags: ["currency"]

sockets:
  - id: "adhazabi"
    label: ""
    position: { x: 0.17, y: 0.5 }
  - id: "faustina"
    label: ""
    position: { x: 0.5, y: 0.5 }
  - id: "urgalag"
    label: ""
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
> Das sind Adhazabi, Urgalag, Faustina.
  Und ich war Telnidra.
  Wir waren Freundinnen.
  Adhazabi gab mir Schmuck, Faustina gab mir Möbel und Urgalag lehrte mich eine Fähigkeit ihrer unerschrockenen Freunde.
  Schaut her, ich zeige sie Euch!

Du spürst, dass du mit allen gefangenen Seelen gesprochen hast.
Als nächstes solltest du dich auf eine Konfrontation mit derjenigen vorbereiten, die für all das hier verantwortlich ist: Trinkt-Dein-Blut.

## Reward
inventoryId: "taunt"
