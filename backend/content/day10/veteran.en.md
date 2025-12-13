---
id: "25-day10-veteran-en"
version: 1
release: "2025-12-10T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 10

## Story
On a table you suddenly notice a set of scales that you are sure was not there before.
You step closer and see it is surrounded by weights engraved with the names of some places.

> Did I live in the forest or did I live in the city?
  Did I settle down or seek adventure?
  Balance.
  I searched for balance.
  Did I find it?

## Puzzle
id: "scales1"
Balance the given dungeons.
Dungeons that have versions I and II weigh twice as much as dungeons with only one version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Bal Sunnar"
  - id: "dungeon-2"
    label: "Selene's Web"
  - id: "dungeon-3"
    label: "Banished Cells"

sockets:
  - id: "left-1"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.19, y: 0.5 }
  - id: "left-2"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.31, y: 0.5 }
  - id: "right"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.63, y: 0.5 }

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
Balance the given dungeons.
Dungeons that have versions I and II weigh twice as much as dungeons with only one version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Elden Hollow"
  - id: "dungeon-2"
    label: "Stone Garden"
  - id: "dungeon-3"
    label: "Ruins of Mazzatun"

sockets:
  - id: "left-1"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.19, y: 0.5 }
  - id: "left-2"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.31, y: 0.5 }
  - id: "right"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.63, y: 0.5 }

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
Balance the given dungeons.
Dungeons that have versions I and II weigh twice as much as dungeons with only one version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Depths of Malatar"
  - id: "dungeon-2"
    label: "Unhallowed Grave"
  - id: "dungeon-3"
    label: "Crypt of Hearts"

sockets:
  - id: "left-1"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.19, y: 0.5 }
  - id: "left-2"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.31, y: 0.5 }
  - id: "right"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.63, y: 0.5 }

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
Balance the given dungeons.
Dungeons that have versions I and II weigh twice as much as dungeons with only one version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Imperial City Prison"
  - id: "dungeon-2"
    label: "Wayrest Sewers"
  - id: "dungeon-3"
    label: "Dread Cellar"

sockets:
  - id: "left-1"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.19, y: 0.5 }
  - id: "left-2"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.31, y: 0.5 }
  - id: "right"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.63, y: 0.5 }

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
Balance the given dungeons.
Dungeons that have versions I and II weigh twice as much as dungeons with only one version.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_10_background.png"
shape: "square"

items:
  - id: "dungeon-1"
    label: "Falkreath Hold"
  - id: "dungeon-2"
    label: "City of Ash"
  - id: "dungeon-3"
    label: "Shipwright's Regret"

sockets:
  - id: "left-1"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.19, y: 0.5 }
  - id: "left-2"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.31, y: 0.5 }
  - id: "right"
    label: ""
    image: "/assets/25_10_sockets.png"
    position: { x: 0.63, y: 0.5 }

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
> Of course - the Green Balance.
  I always lived by it.
  I was Falemon and a Bosmer.
  Picking a flower may be as hard for a Wood Elf as slaying a dragon is for others.
  Take these reagents as a sign that anything is possible when you find balance.

You sense that more trapped souls are waiting for your aid.

## Reward
inventoryId: "ingredients"
