---
id: "25-day16-normal-de"
version: 1
release: "2025-12-16T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 16

## Story
Der Raum um dich herum verändert sich erneut.
Vor dir taucht ein Tisch auf, auf dem ein Modell eines verfallenen Tempels steht.
Daneben liegen einige glitzernde und funkelnde Drachenschuppen.

> Der Mondbischhof des heiligen Alkosh sprach zu dieser.
  Er lud diese ein, nach Sonnspitz zu kommen und die Herrlichkeit von Jone, Jode und Alkosh persönlich zu sehen.
  Warum kann diese sich dann nicht daran erinnern, wie es war, vor den Göttlichen zu stehen?

## Puzzle
id: "sunspire"
Ordne die farblich passenden Schuppen den Orten zu, an denen du Lokkestiiz, Nahviintaas und Yolnahkriin bekämpfst.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_16_background.png"
shape: "square"

items:
  - id: "scales-gold"
    label: ""
    image: "/assets/25_16_option_2.png"
  - id: "scales-red"
    label: ""
    image: "/assets/25_16_option_3.png"
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
> Diese hat keine Göttlichen gesehen, nein.
  Sie war Razaami, eine Pilgerin.
  Doch als sie Sonnspitz erreichte, erzählten die Priester ihr, dass die Drachen Betrüger waren!
  Sie waren böse.
  Also hat Razaami ihr Geschenk für die Göttlichen wieder mitgenommen.
  Ihr sollt es nun haben, Fünfkralle, denn diese glaubt an Euch.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "nirncrux"
