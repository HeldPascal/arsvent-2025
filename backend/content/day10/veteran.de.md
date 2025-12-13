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
id: "scales1"
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

## Wait for: scales1

## Puzzle
id: "scales2"
Stelle ein Gleichgewicht zwischen den angegebenen Dungeons her.
Dungeons mit Versionen I und II wiegen doppelt so schwer wie Dungeons mit nur einer Version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Eldengrund"
  - id: "dungeon-2"
    label: "Steingarten"
  - id: "dungeon-3"
    label: "Die Ruinen von Mazzatun"

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
      items: ["dungeon-2", "dungeon-3"]
  sockets:
    - socketId: "left-1"
      listId: "dungeons"
    - socketId: "left-2"
      listId: "dungeons"
    - socketId: "right"
      itemId: "dungeon-1"
```

## Wait for: scales2

## Puzzle
id: "scales3"
Stelle ein Gleichgewicht zwischen den angegebenen Dungeons her.
Dungeons mit Versionen I und II wiegen doppelt so schwer wie Dungeons mit nur einer Version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Tiefen von Malatar"
  - id: "dungeon-2"
    label: "Unheiliges Grab"
  - id: "dungeon-3"
    label: "Krypta der Herzen"

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

## Wait for: scales3

## Puzzle
id: "scales4"
Stelle ein Gleichgewicht zwischen den angegebenen Dungeons her.
Dungeons mit Versionen I und II wiegen doppelt so schwer wie Dungeons mit nur einer Version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Gefängnis der Kaiserstadt"
  - id: "dungeon-2"
    label: "Kanalisation von Wegesruh"
  - id: "dungeon-3"
    label: "Schreckenskeller"

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
      items: ["dungeon-1", "dungeon-3"]
  sockets:
    - socketId: "left-1"
      listId: "dungeons"
    - socketId: "left-2"
      listId: "dungeons"
    - socketId: "right"
      itemId: "dungeon-2"
```

## Wait for: scales4

## Puzzle
id: "scales5"
Stelle ein Gleichgewicht zwischen den angegebenen Dungeons her.
Dungeons mit Versionen I und II wiegen doppelt so schwer wie Dungeons mit nur einer Version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Falkenring"
  - id: "dungeon-2"
    label: "Stadt der Asche"
  - id: "dungeon-3"
    label: "Gram des Schiffsbauers"

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
      items: ["dungeon-1", "dungeon-3"]
  sockets:
    - socketId: "left-1"
      listId: "dungeons"
    - socketId: "left-2"
      listId: "dungeons"
    - socketId: "right"
      itemId: "dungeon-2"
```

## Wait for: scales5

## Story
> Natürlich, das Grüne Gleichgewicht.
  Ich lebte stets danach.
  Ich war Falemon und ein Bosmer.
  Eine Blume zu pflücken mag für einen Waldelf so schwer sein, wie für andere, einen Drachen zu töten.
  Nehmt diese Reagenzien als Zeichen dafür, dass alles möglich ist, wenn man ein Gleichgewicht findet.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "ingredients"
