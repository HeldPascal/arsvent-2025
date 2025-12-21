---
id: "25-day21-veteran-en"
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
type: "pair-items"
```

## Wait for: style_furniture

## Puzzle
id: "style_armor"
The wardrobe opens.
Inside are three complete suits of armor: light, medium, and heavy.
What style material was used to make each suit of armor?

```yaml puzzle
type: "pair-items"
```

## Wait for: style_armor

## Puzzle
id: "trait"
You take the light armor from the wardrobe and bring it to the clothier table.
Which trait material can you use to enhance the armor?

```yaml puzzle
type: "pair-items"
```

## Wait for: trait

## Puzzle
id: "alchemy_table"
Satisfied, you put on the armor and look beside you.
There's a sign on the wall, but the space in front of it is empty.
It looks like something is missing here.

```yaml puzzle
type: "pair-items"
```

## Wait for: alchemy_table

## Puzzle
id: "alchemy_crafting"
You decide to craft a potion.
Luckily, you have a selection of reagents with you.
Choose a potion solvent and three reagents to craft a potion with the following effects:
- Restore Health
- Spell Critical
- Restore Magicka

```yaml puzzle
type: "pair-items"
```

## Wait for: alchemy_crafting

## Puzzle
id: "enchanting_crafting"
You set the remaining reagents aside on a table.
You know you won't need them.
Instead, you approach the enchanting table.
You have a healing staff, a dagger, and a one-handed axe with you.
To enchant all your weapons, you will need two more glyphs.
Which runestones do you need to create a glyph like the one you already own?

```yaml puzzle
type: "pair-items"
```

## Wait for: enchanting_crafting

## Puzzle
id: "skill-bar"
You also set aside the extra runestones on a table.
Now you can enchant the staff, dagger, and axe.
Clothed in full armor, with a potion in your pocket, the staff on your back, a dagger at one hip, and an axe at the other, you feel almost ready to face Drinks-Your-Blood.
You review all the skills you have learned.
Assign the respective skills to the slots on your action bar.

- 1 = Annulment
- 2 = Blade Cloak
- 3 = Rapid Strikes
- 4 = Falcon's Swiftness
- 5 = Shimmering Shield
- 6 = Inner Fire
- 7 = Combat Prayer
- 8 = Soul Trap
- 9 = Healing Springs
- 10 = Corrupting Pollen
- 11 = Eternal Guardian

```yaml puzzle
type: "pair-items"
```

## Wait for: skill-bar

## Story
Now you are perfectly prepared.
You walk resolutely towards the door, ready to face Drinks-Your-Blood.

## Reward
inventoryId: "potion"
