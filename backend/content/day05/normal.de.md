---
id: "25-day05-normal-de"
version: 1
release: "2025-12-05T00:00:00Z"
language: "de"
mode: "normal"
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
background-image: "/assets/25_05_background_normal.png"
shape: "square"

inventorySource:
  mode: "tags"
  tags: ["weapon"]

sockets:
  - id: "socket-pact"
    label: ""
    position: { x: 0.9, y: 0.195 }
  - id: "socket-covenant"
    label: ""
    position: { x: 0.07, y: 0.196 }
  - id: "socket-dominion"
    label: ""
    position: { x: 0.488, y: 0.9 }

solution:
  - socketId: "socket-pact"
    itemId: "shield-pact"
  - socketId: "socket-covenant"
    itemId: "shield-covenant"
  - socketId: "socket-dominion"
    itemId: "shield-dominion"
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

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "nickel"
