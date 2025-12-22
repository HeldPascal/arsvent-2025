---
id: "25-day23-veteran-en"
version: 1
release: "2025-12-21T00:00:00Z"
language: "en"
mode: "veteran"
solved:
  when: "all"
---

# 23

## Story
The environment around you changes again.
You find yourself in a room filled with tables, crafting stations, and a large wardrobe.
A large, heavy door is set into one of the walls.
You look around as many voices begin to ring in your head simultaneously once more.

> We thank you.
  Each of us has reclaimed their identity.
  We are Men, Mer, Argonians, and Khajiit.
  But someone else is here, too - she is here!
  Drinks-Your-Blood stands behind this door.
  Use our gifts and prepare for battle.

## Puzzle
id: "style_furniture"
Open the wardrobe with the style material needed to craft it.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_23_style_furniture_background.png"
boardMaxWidth: "clamp(200px, 40vw, 460px)"
shape: "circle"

inventorySource:
  mode: "tags"
  tags: ["style"]

sockets:
  - id: "furniture-socket"
    label: ""
    position: { x: 0.485, y: 0.42 }

solution:
  - socketId: "furniture-socket"
    itemId: "obsidian"
```

## Wait for: style_furniture

## Story
The wardrobe opens.
Inside are three complete suits of armor: light, medium, and heavy.

## Puzzle
id: "style_armor"
What style material was used to make each suit of armor?

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_23_style_armor_background.png"
shape: "circle"

inventorySource:
  mode: "tags"
  tags: ["style"]
  exclude: ["obsidian"]

sockets:
  - id: "khajiit-armor-socket"
    label: ""
    position: { x: 0.17, y: 0.4 }
  - id: "redguard-armor-socket"
    label: ""
    position: { x: 0.5, y: 0.4 }
  - id: "imperial-armor-socket"
    label: ""
    position: { x: 0.84, y: 0.4 }

solution:
  - socketId: "khajiit-armor-socket"
    itemId: "moonstone"
  - socketId: "redguard-armor-socket"
    itemId: "starmetal"
  - socketId: "imperial-armor-socket"
    itemId: "nickel"
```

## Wait for: style_armor

## Story
You take the light armor from the wardrobe and bring it to the clothier table.

## Puzzle
id: "trait"
Which trait material can you use to enhance the armor?

<img src="/assets/25_16_reward.png" alt="Nirncrux" style="display: block; margin: 0 auto; max-width: clamp(200px, 30vw, 460px)" />

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

## Story
Satisfied, you put on the armor and look beside you.
There's a sign on the wall, but the space in front of it is empty.

## Puzzle
id: "alchemy_table"
It looks like something is missing here.

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_23_alchemy_table_background.png"
boardMaxWidth: "clamp(200px, 40vw, 460px)"
shape: "square"

inventorySource:
  mode: "all"
  excludeTags: ["style"]
  exclude: ["nirncrux"]

sockets:
  - id: "socket"
    label: ""
    position: { x: 0.5, y: 0.9 }

solution:
  - socketId: "socket"
    itemId: "craftingtable"
```

## Wait for: alchemy_table

## Story
You decide to craft a potion.
Luckily, you have a selection of reagents with you.

## Puzzle
id: "alchemy_crafting"
Choose a potion solvent and the reagents to craft a potion with the following effects:
- Restore Health
- Spell Critical
- Restore Magicka

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

## Story
You set the remaining reagents aside on a table.
You know you won't need them.
Instead, you approach the enchanting table.
You have a healing staff, a dagger, and a one-handed axe with you.
To enchant all your weapons, you will need two more glyphs.

## Puzzle
id: "enchanting_crafting"
Which runestones do you need to create a glyph like the one you already own?

<img src="/assets/25_08_reward.png" alt="Glyph" style="display: block; margin: 0 auto" />

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

## Story
You also set aside the extra runestones on a table.
Now you can enchant the staff, dagger, and axe.
Clothed in full armor, with a potion in your pocket, the staff on your back, a dagger at one hip, and an axe at the other, you feel almost ready to face Drinks-Your-Blood.
You review all the skills you have learned.

## Puzzle
id: "skill-bar"
Assign the respective skills to the slots on your action bar.

```yaml puzzle
type: "drag-sockets"
background-image: ""
shape: "square"
ordered: true

inventorySource:
  mode: "tags"
  tags: ["skill"]
  include: ["potion"]

sockets:
  - id: "quickslot"
    label: ""
    position: { x: 0.125, y: 0.5 }
    hint: "Potion"
  - id: "frontbar-1"
    label: ""
    position: { x: 0.25, y: 0.4 }
    hint: "Annulment"
  - id: "frontbar-2"
    label: ""
    position: { x: 0.375, y: 0.4 }
    hint: "Deadly Cloak"
  - id: "frontbar-3"
    label: ""
    position: { x: 0.5, y: 0.4 }
    hint: "Rapid Strikes"
  - id: "frontbar-4"
    label: ""
    position: { x: 0.625, y: 0.4 }
    hint: "Falcon's Swiftness"
  - id: "frontbar-5"
    label: ""
    position: { x: 0.75, y: 0.4 }
    hint: "Shimmering Shield"
  - id: "backbar-1"
    label: ""
    position: { x: 0.25, y: 0.6 }
    hint: "Inner Fire"
  - id: "backbar-2"
    label: ""
    position: { x: 0.375, y: 0.6 }
    hint: "Combat Prayer"
  - id: "backbar-3"
    label: ""
    position: { x: 0.5, y: 0.6 }
    hint: "Soul Trap"
  - id: "backbar-4"
    label: ""
    position: { x: 0.625, y: 0.6 }
    hint: "Healing Springs"
  - id: "backbar-5"
    label: ""
    position: { x: 0.75, y: 0.6 }
    hint: "Corrupting Pollen"
  - id: "ultimate"
    label: ""
    position: { x: 0.875, y: 0.5 }
    hint: "Eternal Guardian"

solution:
  - socketId: "quickslot"
    itemId: "potion"
  - socketId: "frontbar-1"
    itemId: "armorskill"
  - socketId: "frontbar-2"
    itemId: "weaponskill-2"
  - socketId: "frontbar-3"
    itemId: "weaponskill-1"
  - socketId: "frontbar-4"
    itemId: "wardenskill-2"
  - socketId: "frontbar-5"
    itemId: "wardenskill-4"
  - socketId: "backbar-1"
    itemId: "taunt"
  - socketId: "backbar-2"
    itemId: "weaponskill-3"
  - socketId: "backbar-3"
    itemId: "soultrap"
  - socketId: "backbar-4"
    itemId: "weaponskill-4"
  - socketId: "backbar-5"
    itemId: "wardenskill-3"
  - socketId: "ultimate"
    itemId: "wardenskill-1"
```

## Wait for: skill-bar

## Story
Now you are perfectly prepared.
You walk resolutely towards the door, ready to face Drinks-Your-Blood.
