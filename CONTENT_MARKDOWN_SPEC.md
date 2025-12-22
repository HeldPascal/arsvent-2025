# Arsvent Markdown Specification

This document defines the authoring format for Arsventskalender day files.
It describes which blocks, structures, and puzzle types can be used when creating new content.
Technical parser or implementation details are intentionally omitted.

---

# 1. Structure Overview

A single **content variant** is stored in **one Markdown file** containing:

1. **YAML frontmatter** (day metadata)
2. **Content blocks** written as Markdown, introduced by `##` headings:
   - `Story`
   - `Puzzle`
   - `Reward`
   - `Continue when`
   - `Wait for: <puzzle-id>`

Puzzle logic and conditions use dedicated YAML code blocks.

---

# 2. Frontmatter

The file must start with YAML frontmatter enclosed by `---`.

## Example

```yaml
---
id: "25-01"
version: 1
release: "2025-12-01T00:00:00Z"
language: "en"
mode: "normal"
inventory:
  - "map-fragment-kynes-aegis"
solved:
  when: "all"
tags:
  - "intro"
  - "kynes-aegis"
---
```

## Frontmatter Fields

### Required

- id — Unique day identifier.
- version — File version number.
- release — ISO timestamp for unlock time.
- language — `"en"` or `"de"`.
- mode — `"normal"` or `"veteran"`.

### Optional

- inventory — Deprecated. Use `content/dayXX/inventory.yaml` snapshots instead.
- tags — Free keywords for organizational use.
- solved.when — Defines the condition required to mark the day as completed.

---

# 3. Conditions (`when`)

Conditions control:
- when a day is considered solved
- when parts of a day become visible
- when rewards are granted

A condition can be:
1. A puzzle ID
```yaml
when: "final-puzzle"
```
2. An AND list
```yaml
when:
  and:
    - "puzzle-1"
    - "puzzle-2"
```
3. An OR list
```yaml
when:
  or:
    - "puzzle-1"
    - "puzzle-2"
```
4. Shortcuts
   - `"all"` — all puzzles in the file must be solved
   - `"any"` — any single puzzle in the file must be solved

---

# 4. Content Blocks

Each block begins with a heading:

```markdown
## Block Type
```

The first non-empty line after the heading may optionally define a block ID:

```markdown
id: "my-block-id"
```

Everything after that belongs to the block until the next `##` heading.

---

# 5. Story Block

### Heading

```markdown
## Story
```
or
```markdown
## Story: <title>
```

### Content

Free Markdown: text, images, quotes, etc.

### Example

```markdown
## Story: Arrival
id: "intro"
You feel a wave of magic surround you…
```

---

# 6. Puzzle Block

### Heading

```markdown
## Puzzle
```
or
```markdown
## Puzzle: <title>
```

### Structure

A Puzzle block contains:
1. Optional block ID (`id: "..."`)
2. Narrative text describing the puzzle
3. A YAML puzzle code block

### Example

````markdown
## Puzzle: Symbol on the Map
id: "symbol-on-map"
Which symbol marks this place?

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: ""
    image: "/assets/25_01_option1.png"
  - id: "2"
    label: ""
    image: "/assets/25_01_option2.png"
  - id: "3"
    label: ""
    image: "/assets/25_01_option3.png"
solution: "1"
```
````

---

# 7. Puzzle Definitions (`yaml puzzle`)

Puzzle logic is defined inside fenced code blocks:

````markdown
```yaml puzzle
# puzzle definition
```
````

The content is YAML describing the puzzle type.  
The following types are currently supported:

---

## 7.1 Text Puzzle

A simple free-text answer.

### Fields
- **type:** `"text"`
- **solution:** string with the expected answer

### Example

```yaml
type: "text"
solution: "my answer"
```

---

## 7.2 Single Choice Puzzle

A multiple-choice puzzle with one correct option.

### Fields
- **type:** `"single-choice"`
- **difficulty:** optional (`easy`, `normal`, `hard`)
- **options:** list of options (id, label, image)
- **solution:** id of the correct option
- **size:** optional (`small`, `medium`, `large`) to adjust rendering
- **consumesInventory:** optional list of required items

### Example

```yaml
type: "single-choice"
options:
  - id: "1"
    label: "Shield"
    image: "/assets/01_opt1.png"
  - id: "2"
    label: "Anchor"
    image: "/assets/01_opt2.png"
solution: "1"
```

---

## 7.3 Multi Choice Puzzle

Multiple correct options; player can select several.

### Fields
- **type:** `"multi-choice"`
- **options:** list of options (id, label, image)
- **minSelections:** optional minimum required (defaults to 1)
- **ordered:** optional `true` to require the exact selection order (defaults to unordered)
- **solution:** array of correct option ids (treated as a list when `ordered: true`, as a set otherwise)
- **size:** optional (`small`, `medium`, `large`) to adjust rendering
- **consumesInventory:** optional list of required items

### Example

```yaml
type: "multi-choice"
minSelections: 2
ordered: true
options:
  - id: "1"
    label: "Rune"
  - id: "2"
    label: "Blade"
  - id: "3"
    label: "Shield"
solution: ["1", "2"]
```

---

## 7.4 Drag-Sockets Puzzle

Players drag items into specific positions.

### Fields
- **type:** `"drag-sockets"`
- **backgroundImage:** optional path to background image (defaults to empty board)
- **shape:** optional default shape for items/sockets (`circle` if omitted)
- **items:** list of draggable items (id, label, image, optional `shape`, optional `defaultSocketId`)
- **inventorySource:** optional alternative to `items` that pulls items from the player inventory snapshot (mutually exclusive with `items`).
  - **mode:** `"all"` | `"ids"` | `"tags"`
  - **items:** list of inventory ids (when mode is `"ids"`)
  - **tags:** list of inventory tag ids (when mode is `"tags"`)
  - **include:** optional list of inventory ids to add after resolving the mode
  - **exclude:** optional list of inventory ids to remove after resolving the mode
  - **excludeTags:** optional list of inventory tag ids to remove after resolving the mode
- **sockets:** list of socket definitions including accepted item types; sockets can set `label`, `image`, and `shape`
- **solution:** list of socketId → itemId relations. Supports:
  - simple list of `{ socketId, itemId }`
  - `lists` + `listId` to reuse pooled items
  - presence-only mode: omit `socketId` to just require items to be placed

### Example

```yaml
type: "drag-sockets"
backgroundImage: "/assets/board.png"

items:
  - id: "gem-red"
    label: "Red Gem"
    image: "/assets/gem_red.png"

sockets:
  - id: "socket-top"
    position: { x: 0.5, y: 0.1 }
    accepts: ["gem-red"]

solution:
  - socketId: "socket-top"
    itemId: "gem-red"
```

### Inventory-sourced example

```yaml
type: "drag-sockets"
backgroundImage: "/assets/board.png"
inventorySource:
  mode: "tags"
  tags: ["crafting", "soul"]

sockets:
  - id: "socket-top"
    position: { x: 0.5, y: 0.1 }
    accepts: ["restostaff", "soultrap"]

solution:
  - socketId: "socket-top"
    itemId: "restostaff"
```

---

## 7.5 Select-Items Puzzle

Players pick the correct items on a background. Items are already placed and cannot be moved; tapping toggles selection.

### Fields
- **type:** `"select-items"`
- **backgroundImage:** path to background image
- **items:** list of items with an absolute position (`0..1` for x/y), optional label/image/shape
- **solution:** list of item ids that must be selected (array or `items: [...]`)

### Example

```yaml
type: "select-items"
backgroundImage: "/assets/map.png"

items:
  - id: "tower"
    label: "Tower"
    image: "/assets/tower.png"
    position: { x: 0.18, y: 0.35 }
  - id: "harbor"
    label: "Harbor"
    image: "/assets/harbor.png"
    position: { x: 0.7, y: 0.65 }

solution: ["tower"]
```

---

## 7.6 Memory Puzzle

Classic matching pairs. Cards start face-down; players flip two at a time to find matching pairs. Matched pairs move into a list below the board.

### Fields
- **type:** `"memory"`
- **backImage:** required card back image
- **hoverBackImage:** optional alternative back used on hover
- **cards:** list of card definitions (`id`, `image`; optional `label`), must be even
- **solution:** pairs of ids (array of `{a, b}` or `[[idA, idB], ...]`), every card appears exactly once
- **maxMisses:** optional non-negative integer; after this many wrong flips the board resets and re-shuffles (omit for unlimited)
- **missIndicator:** optional (`deplete` | `fill`), supports `mode:animation` (e.g. `deplete:shatter`, `fill:burst`) to animate changes; defaults to no animation
- **flipBackMs:** optional non-negative integer (ms) to control how long mismatched cards stay revealed (default 700ms)

### Example

```yaml
type: "memory"
backImage: "/assets/card_back.png"
hoverBackImage: "/assets/card_back_hover.png"
maxMisses: 4
missIndicator: "deplete"

cards:
  - id: "moon-1"
    image: "/assets/moon_left.png"
  - id: "moon-2"
    image: "/assets/moon_right.png"
  - id: "tree-1"
    image: "/assets/tree_left.png"
  - id: "tree-2"
    image: "/assets/tree_right.png"

solution:
  - { a: "moon-1", b: "moon-2" }
  - [ "tree-1", "tree-2" ]
```

---

## 7.7 Pair Items Puzzle

Players match items from two visible columns. Each left item pairs with exactly one right item; matched pairs are listed below. Items remain visible after matching.

### Fields
- **type:** `"pair-items"`
- **left:** list of options for the left column (id, label, image)
- **right:** list of options for the right column (id, label, image)
- **solution:** list of `{ left, right }` pairs (one-to-one mapping)
- **size:** optional (`small`, `medium`, `large`) to adjust rendering

### Example

```yaml
type: "pair-items"
size: "medium"
left:
  - id: "rune"
    label: "Rune"
    image: "/assets/rune.png"
  - id: "blade"
    label: "Blade"
right:
  - id: "fire"
    label: "Fire"
  - id: "steel"
    label: "Steel"
solution:
  - { left: "rune", right: "fire" }
  - { left: "blade", right: "steel" }
```

---

## 7.8 Grid Path Puzzle

Players pick a start column, trace a path through a grid on top of a background image, and finish by clicking the goal in the same column on the bottom.

### Fields
- **type:** `"grid-path"`
- **grid:** optional `{ width, height }` (default `9x9`)
- **backgroundImage:** path to the background image
- **solution:** required path definition  
  - `path`: ordered `{ x, y }` coordinates (1-based; main grid rows are `1..height`, start row is `0`, goal row is `height+1`; no repeats, orthogonal steps only)  
  - `startColumn` and `goalColumn` (optional): 1-based columns that must match the first/last path column if provided

### Example

```yaml
type: "grid-path"
grid: { width: 9, height: 9 }
backgroundImage: "/assets/25_13_background.png"
solution:
  startColumn: 5
  goalColumn: 3
  path:
    - { x: 5, y: 1 }
    - { x: 5, y: 2 }
    - { x: 4, y: 2 }
    - { x: 3, y: 2 }
    - { x: 3, y: 3 }
    - { x: 3, y: 4 }
    - { x: 3, y: 5 }
    - { x: 3, y: 6 }
    - { x: 3, y: 7 }
    - { x: 3, y: 8 }
    - { x: 3,  y: 9 }
```

---

## 7.9 Placeholder Puzzle

Non-interactive stub used while prototyping. It cannot be solved through normal submissions and is only completable via the admin **Solve now** action.

### Fields
- **type:** `"placeholder"`
- **solution:** optional; ignored for gameplay

### Example

```yaml
type: "placeholder"
```

---

# 8. Reward Block

Rewards are defined separately from puzzles.

### Heading

```markdown
## Reward
```
or
```markdown
## Reward: <title>
```

### Fields

- **inventoryId** — Item to grant

### Behavior

- If no `when` block is included, the reward is automatically tied to the **closest puzzle above it**.
- Rewards may also use an explicit condition.

### Example (simple)

```markdown
## Reward
id: "reward-symbol"
inventoryId: "thurwe-healing-staff"
```

### Example (conditional)

````markdown
## Reward
id: "big-reward"
inventoryId: "special-soul-fragment"

```yaml when
and:
  - "puzzle-1"
  - "puzzle-2"
```
````

---

# 9. Continue-When Block

Controls when *subsequent* blocks become visible.

### Heading

```markdown
## Continue when
```

### Structure

Must contain a `yaml when` code block with a condition.

### Example

````markdown
## Continue when

```yaml when
"symbol-on-map"
```
````

All following blocks remain hidden until the condition is satisfied.

---

# 10. Wait-For Block (Shortcut)

A simplified form of `Continue when`.

### Heading

```markdown
## Wait for: <puzzle-id>
```
Equivalent to:
````markdown
## Continue when

```yaml when
"<puzzle-id>"
```
````

---

# 11. Inventory References

Items are referenced by their global IDs:
- In **inventory** field in frontmatter  
- In **consumesInventory** in puzzles  
- In **inventoryId** in rewards  
- In **inventorySource** in drag-sockets puzzles

The actual item definitions live outside the Markdown file.

Inventory snapshots are stored per day in `content/dayXX/inventory.yaml` as a simple YAML list of item IDs.
Inventory tags can be localized in `content/inventory/tags.<locale>.yaml` and are referenced by id in `inventorySource.tags`.

Inventory-sourced puzzles use the snapshot from the day *before* the currently played day (preview uses the day before the previewed day), because day snapshots represent the post-day inventory.

---

# 12. Full Example

````markdown
---
id: "25-01"
version: 1
release: "2025-12-01T00:00:00Z"
language: "en"
mode: "normal"
inventory:
  - "map-fragment-kynes-aegis"
solved:
  when: "all"
tags:
  - "intro"
  - "kynes-aegis"
---

# Kyne's Aegis

## Story
id: "intro"
A wave of magic surrounds you…

## Puzzle: Symbol on the Map
id: "symbol-on-map"
Which symbol marks this place?

```yaml puzzle
type: "single-choice"
options:
  - id: "1"
    image: "/assets/01_opt1.png"
  - id: "2"
    image: "/assets/01_opt2.png"
  - id: "3"
    image: "/assets/01_opt3.png"
solution: "1"
```

## Reward
inventoryId: "thurwe-healing-staff"

## Continue when
```yaml when
"symbol-on-map"
```

## Story
id: "reveal"
"I remember…"

## Puzzle: Gem Placement
id: "gem-sockets"

```yaml puzzle
type: "drag-sockets"
backgroundImage: "/assets/board.png"
items:
  - id: "gem-red"
    image: "/assets/red.png"
sockets:
  - id: "socket-top"
    position: { x: 0.5, y: 0.1 }
    accepts: ["gem-red"]
solution:
  - socketId: "socket-top"
    itemId: "gem-red"
```

## Reward
inventoryId: "soul-fragment-thurwe"
````

---

If you have questions or want to request new puzzle types, please contact the Arsvent team.
