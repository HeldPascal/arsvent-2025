---
id: "25-day07-veteran-de"
version: 1
release: "2025-12-07T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 7

## Story
Von der Arena wirst du in einen Vorbereitungsraum versetzt.
Die Wände hängen voller Karten.
Überall liegen Berichte und Briefe verstreut umher.

> Meine Heimat war das schöne Cyrodiil.
  Das Herzland.
  Ich war glücklich.
  Doch dann, Zerstörung.
  Waren es die Daedra?
  Nein, da war ein Krieg… was ist nur geschehen?

## Puzzle
id: "cyrodiil"
Lege die Embleme der Allianzen auf die Karte – die genaue Anordnung spielt keine Rolle.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_05_background_veteran.png"
shape: "circle"

items:
  - id: "shield-1"
    label: "Aaaaa"
    image: "/assets/25_05_option_1.png"
    defaultSocketId: "start-1"
  - id: "shield-2"
    label: "Bbbbb"
    image: "/assets/25_05_option_2.png"
    defaultSocketId: "start-2"
  - id: "shield-3"
    label: "Ccccc"
    image: "/assets/25_05_option_3.png"
    defaultSocketId: "start-3"
  - id: "shield-4"
    label: "Ddddd"
    image: "/assets/25_05_option_3.png"

sockets:
  # starting sockets for default placements (centerline, evenly spaced)
  - id: "start-1"
    label: ""
    position: { x: 0.35, y: 0.50 }
  - id: "start-2"
    label: ""
    position: { x: 0.50, y: 0.50 }
  - id: "start-3"
    label: ""
    position: { x: 0.65, y: 0.50 }
  # target sockets that accept any of the three items
  - id: "socket-1"
    label: ""
    position: { x: 0.20, y: 0.52 }
  - id: "socket-2"
    label: ""
    position: { x: 0.50, y: 0.30 }
  - id: "socket-3"
    label: ""
    position: { x: 0.80, y: 0.52 }

solution:
  lists:
    - id: "any-shield"
      items: ["shield-1", "shield-2", "shield-3"]
  sockets:
    - socketId: "socket-1"
      listId: "any-shield"
    - socketId: "socket-2"
      listId: "any-shield"
    - socketId: "socket-3"
      listId: "any-shield"
```

## Wait for: cyrodiil

## Story
> Ein Krieg?
  Natürlich, der Krieg der drei Banner!
  Und ich, Ciira Imutis, inmitten von allem.
  Ich half den Menschen bei der Flucht, so gut ich konnte.
  Am Ende floh auch ich.
  Von meinem geliebten Cyrodiil blieb mir nur dieser Stein.
  Nehmt ihn, ich brauche ihn nicht mehr.

## Reward
inventoryId: "nickel"
