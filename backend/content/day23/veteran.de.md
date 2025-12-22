---
id: "25-day23-veteran-de"
version: 1
release: "2025-12-23T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 23

## Story
Erneut verändert sich die Umgebung um dich herum.
Du befindest dich in einem Raum, der mit Tischen, Handwerksstationen und einem großen Schrank gefüllt ist.
In eine Wand ist eine große, schwere Tür eingelassen.
Du schaust dich um, als erneut viele Stimmen gleichzeitig in deinem Kopf erklingen.

> Wir danken Euch.
  Ein jeder von uns hat seine Identität zurückerlangt.
  Wir sind Menschen, Mer, Argonier und Khajiit.
  Doch noch jemand ist hier - sie ist hier!
  Trinkt-Dein-Blut befindet sich hinter dieser Tür.
  Verwendet unsere Geschenke und bereitet Euch auf einen Kampf vor.

## Puzzle
id: "style_furniture"
Öffne den Schrank mit dem Stilmaterial, welches man zu seiner Herstellung benötigt.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_23_style_furniture_background.png"
shape: "square"

inventorySource:
  mode: "tags"
  tags: ["style"]

sockets:
  - id: "furniture-socket"
    label: ""
    position: { x: 0.5, y: 0.5 }

solution:
  - socketId: "furniture-socket"
    itemId: "obsidian"
```

## Wait for: style_furniture

## Puzzle
id: "style_armor"
Der Schrank öffnet sich.
Darin befinden sich drei vollständige Rüstungen: eine leichte, eine mittlere und eine schwere.
Welches Stilmaterial wurde zur Herstellung der jeweiligen Rüstung verwendet?

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_23_style_armor_background.png"
shape: "square"

inventorySource:
  mode: "tags"
  tags: ["style"]
  exclude: ["obsidian"]

sockets:
  - id: "khajiit-armor-socket"
    label: ""
    position: { x: 0.2, y: 0.5 }
  - id: "redguard-armor-socket"
    label: ""
    position: { x: 0.5, y: 0.5 }
  - id: "imperial-armor-socket"
    label: ""
    position: { x: 0.8, y: 0.5 }

solution:
  - socketId: "khajiit-armor-socket"
    itemId: "moonstone"
  - socketId: "redguard-armor-socket"
    itemId: "starmetal"
  - socketId: "imperial-armor-socket"
    itemId: "nickel"
```

## Wait for: style_armor

## Puzzle
id: "trait"
Du nimmst die leichte Rüstung aus dem Schrank und bringst sie zu dem Schneidertisch.
Mit welchem Eigenschaftsmaterial kannst du die Rüstung verstärken?

```yaml puzzle
type: single-choice
options:
  - id: "potent"
    label: ""
    image: "/assets/25_23_trait_option_1.png"
  - id: "fortified"
    label: ""
    image: "/assets/25_23_trait_option_2.png"
solution: "fortified"
```

## Wait for: trait

## Puzzle
id: "alchemy_table"
Zufrieden legst du die Rüstung an und schaust neben dich.
An der Wand hängt ein Schild, aber davor ist der Platz frei.
Es wirkt, als würde hier etwas fehlen.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_23_alchemy_table_background.png"
shape: "square"

inventorySource:
  mode: "all"
  excludeTags: ["style"]

sockets:
  - id: "socket"
    label: ""
    position: { x: 0.5, y: 0.5 }

solution:
  - socketId: "socket"
    itemId: "craftingtable"
```

## Wait for: alchemy_table

## Puzzle
id: "alchemy_crafting"
Du entscheidest dich, einen Trank herzustellen.
Zum Glück hast du eine Auswahl an Reagenzien bei dir.
Wähle ein Tranklösemittel und die benötigten Reagenzien aus, um einen Trank mit folgenden Eigenschaften herzustellen:
- Leben wiederherstellen
- Kritische Magietreffer
- Magicka wiederherstellen

```yaml puzzle
type: "drag-sockets"
background-image: ""
shape: "square"

inventorySource:
  mode: "tags"
  tags: ["alchemy"]

sockets:
  - id: "solvent"
    label: ""
    image: "/assets/25_23_alchemy_crafting_socket_1.png"
    position: { x: 0.2, y: 0.5 }
  - id: "ingredient-1"
    label: ""
    image: "/assets/25_23_alchemy_crafting_socket_2.png"
    position: { x: 0.4, y: 0.5 }
  - id: "ingredient-2"
    label: ""
    image: "/assets/25_23_alchemy_crafting_socket_2.png"
    position: { x: 0.6, y: 0.5 }
  - id: "ingredient-3"
    label: ""
    image: "/assets/25_23_alchemy_crafting_socket_2.png"
    position: { x: 0.8, y: 0.5 }

solution:
  lists:
    - id: "ingredients"
      items: ["plant-2", "plant-1", "ingredient-2"]
  sockets:
    - socketId: "solvent"
      itemId: "stardew"
    - socketId: "ingredient-1"
      listId: "ingredients"
    - socketId: "ingredient-2"
      listId: "ingredients"
    - socketId: "ingredient-3"
      listId: "ingredients"
```

## Wait for: alchemy_crafting

## Reward
inventoryId: "potion"

## Puzzle
id: "enchanting_crafting"
Die übrigen Reagenzien legst du auf einem Tisch beiseite.
Du weißt, dass du sie nicht brauchen wirst.
Stattdessen trittst du an den Verzauberungstisch heran.
Du hast einen Heilungsstab, einen Dolch und eine einhändige Axt bei dir.
Um all deine Waffen gleich zu verzaubern, benötigst du noch 2 weitere Glyphen.
Welche Runensteine benötigst du zur Herstellung derselben Glyphe, wie die du bereits besitzt?

```yaml puzzle
type: "drag-sockets"
background-image: ""
shape: "square"

inventorySource:
  mode: "tags"
  tags: ["enchanting"]
  exclude: ["glyph"]

sockets:
  - id: "potency"
    label: ""
    image: "/assets/25_23_enchanting_crafting_socket_1.png"
    position: { x: 0.3, y: 0.5 }
  - id: "essence"
    label: ""
    image: "/assets/25_23_enchanting_crafting_socket_2.png"
    position: { x: 0.5, y: 0.5 }
  - id: "aspect"
    label: ""
    image: "/assets/25_23_enchanting_crafting_socket_3.png"
    position: { x: 0.7, y: 0.5 }

solution:
  - socketId: "potency"
    itemId: "rune-5"
  - socketId: "essence"
    itemId: "rune-3"
  - socketId: "aspect"
    itemId: "rune-6"
```

## Wait for: enchanting_crafting

## Puzzle
id: "skill-bar"
Du legst die überzähligen Runensteine ebenfalls auf einem Tisch ab.
Nun kannst du Stab, Dolch und Axt verzaubern.
Gekleidet in eine vollständige Rüstung, mit einem Trank in der Tasche und dem Stab auf dem Rücken, einem Dolch an einer Hüfte und einer Axt an der anderen fühlst du dich fast bereit, Trinkt-Dein-Blut gegenüberzutreten.
Du gehst noch einmal alle Fähigkeiten durch, die du erlernt hast.
Weise die jeweiligen Fähigkeiten den Orten auf deiner Leiste zu.

- 1 = Neutralisierende Magie
- 2 = Klingenmantel
- 3 = Schnelle Stöße
- 4 = Raschheit des Falken
- 5 = Schimmernder Schild
- 6 = Inneres Feuer
- 7 = Kampfgebet
- 8 = Seelenfalle
- 9 = Heilende Quellen
- 10 = Verderbende Pollen
- 11 = Ewiger Wächter

```yaml puzzle
type: "placeholder"
```

## Wait for: skill-bar

## Story
Nun bist du vollständig vorbereitet.
Entschlossen gehst du auf die Tür zu und bist bereit, dich Trinkt-Dein-Blut zu stellen.
