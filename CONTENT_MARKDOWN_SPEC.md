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

- inventory — Items the player starts with on this day.
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

## 7.1 Single Choice Puzzle

A multiple-choice puzzle with one correct option.

### Fields
- **type:** `"single-choice"`
- **difficulty:** optional (`easy`, `normal`, `hard`)
- **options:** list of options (id, label, image)
- **solution:** id of the correct option
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

## 7.2 Drag-Sockets Puzzle

Players drag items into specific positions.

### Fields
- **type:** `"drag-sockets"`
- **backgroundImage:** path to background image
- **items:** list of draggable items
- **sockets:** list of socket definitions including accepted item types
- **solution:** list of socketId → itemId relations

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

---

## 7.3 Select-Items Puzzle

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

The actual item definitions live outside the Markdown file.

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
