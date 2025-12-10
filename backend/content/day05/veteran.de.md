---
id: "25-day05-veteran-de"
version: 1
release: "2025-12-05T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 5

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
Lege die Embleme der Allianzen auf die korrekten Bereiche der Karte.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_05_background_veteran.png"
shape: "square"

items:
  - id: "shield-1"
    label: ""
    image: "/assets/25_05_option_1.png"
  - id: "shield-2"
    label: ""
    image: "/assets/25_05_option_2.png"
  - id: "shield-3"
    label: ""
    image: "/assets/25_05_option_3.png"

sockets:
  - id: "socket-1"
    label: ""
    position: { x: 0.104, y: 0.8 }
  - id: "socket-2"
    label: ""
    position: { x: 0.93, y: 0.8 }
  - id: "socket-3"
    label: ""
    position: { x: 0.525, y: 0.11 }

solution:
  - socketId: "socket-1"
    itemId: "shield-3"
  - socketId: "socket-2"
    itemId: "shield-2"
  - socketId: "socket-3"
    itemId: "shield-1"
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
