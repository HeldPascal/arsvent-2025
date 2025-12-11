---
id: "25-day04-normal-de"
version: 1
release: "2025-12-04T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 4

## Story
Die Umgebung um dich herum ändert sich.
Du befindest dich in einer Arena und vor dir steht eine Frau.

> Vorsicht, das ist Erzzaubermeisterin Twelvane!
  Sie ist eine mächtige Bestienmeisterin und sehr gefährlich.
  Ich bereitete mich auf einen Kampf gegen sie vor, aber ich starb, bevor ich sie herausfordern konnte.
  Der einzige Weg, sie und ihre Chimäre zu bekämpfen ist es, ebenfalls eine Chimäre zu erschaffen.
  Ich erinnere mich nicht mehr an meinen Plan.
  Welche Bestien wollte ich nur zähmen?

## Puzzle
id: "chimera"
Wähle die Tiere aus, die **nicht** in Twelvanes Chimäre am Rand des Wahnsinns enthalten sind.

```yaml puzzle
type: "multi-choice"
size: "large"
options:
  - id: "gryphon"
    label: "Greif"
    image: "/assets/25_04_option_1.png"
  - id: "lion"
    label: "Löwe"
    image: "/assets/25_04_option_2.png"
  - id: "dragon"
    label: "Drache"
    image: "/assets/25_04_option_3.png"
  - id: "eagle"
    label: "Adler"
    image: "/assets/25_04_option_4.png"
  - id: "bear"
    label: "Bär"
    image: "/assets/25_04_option_5.png"
  - id: "wamasu"
    label: "Wamasu"
    image: "/assets/25_04_option_6.png"
minSelections: 2
solution:
  - "eagle"
  - "bear"
  - "dragon"
```

## Wait for: chimera

## Story
> Ja, das war es!
  Ich war Maleric Pontecus.
  Ich sammelte Kreaturen und Verbündete in ganz Tamriel.
  Mitglieder aller Allianzen wollten an meiner Seite kämpfen.
  Hier, nehmt diese Embleme meiner Kameraden.
  Führt diesen Kampf im Namen aller Sterblichen!

## Reward
inventoryId: "shields"
