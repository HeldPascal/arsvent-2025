---
id: "25-day10-veteran-de"
version: 1
release: "2025-12-10T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 10

## Story
Auf einem Tisch bemerkst du plötzlich eine Waage, von der du sicher bist, dass sie eben noch nicht dort stand.
Du gehst näher heran und siehst, dass sie von Gewichten umgeben ist, auf denen die Namen einiger Orte eingraviert wurden.

> Lebte ich im Wald oder lebte ich in der Stadt?
  Ließ ich mich nieder oder suchte ich Abenteuer?
  Das Gleichgewicht.
  Ich suchte nach einem Gleichgewicht.
  Habe ich es gefunden?

## Puzzle
id: "scales"
Stelle ein Gleichgewicht zwischen den angegebenen Dungeons her.
Dungeons mit Versionen I und II wiegen doppelt so schwer wie Dungeons mit nur einer Version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Bal Sunnar"
  - id: "dungeon-2"
    label: "Selenes Netz"
  - id: "dungeon-3"
    label: "Verbannungszellen"

sockets:
  - id: "left-1"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.19, y: 0.5}
  - id: "left-2"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.31, y: 0.5}
  - id: "right"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.63, y: 0.5}
  
solution:
  lists:
    - id: "dungeons"
      items: ["dungeon-1", "dungeon-2"]
  sockets:
    - socketId: "left-1"
      listId: "dungeons"
    - socketId: "left-2"
      listId: "dungeons"
    - socketId: "right"
      itemId: "dungeon-3"
```

## Wait for: scales

## Story
> Natürlich, das Grüne Gleichgewicht.
  Ich lebte stets danach.
  Ich war Falemon und ein Bosmer.
  Eine Blume zu pflücken mag für einen Waldelf so schwer sein, wie für andere, einen Drachen zu töten.
  Nehmt diese Reagenzien als Zeichen dafür, dass alles möglich ist, wenn man ein Gleichgewicht findet.

## Reward
inventoryId: "day10-reward"

[Liste mit Bal Sunnar, Selenes Netz, Verbannungszellen]
[Liste mit Eldengrund, Steingarten, Ruinen von Mazzatun]
[Liste mit Tiefen von Malatar, Unheiliges Grab, Krypta der Herzen]
[auf Vet außerdem Liste mit Gefängnis der Kaiserstadt, Kanalisation von Wegesruh, Schreckenskeller]
[auf Vet außerdem Liste mit Falkenring, Stadt der Asche, Gram des Schiffbauers]
