---
id: "25-day08-veteran-de"
version: 1
release: "2025-12-08T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 8

## Story
Hinter dir öffnet sich die Tür, du trittst hindurch und befindest dich in einem Stall.
Vor dir stehen einige Pferde und… noch etwas anderes.

> Meine Gefährten und ich… wir haben gesiegt!
  Wir haben gesiegt und ritten davon.
  Wohin sind sie gegangen? Wo kamen wir her?

## Puzzle
id: "mount"
Welche Prüfung belohnt mit diesem Reittier?

![Reittier](/assets/25_08_background_veteran.png)

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: "Felshain"
  - id: "2"
    label: "Rand des Wahnsinns"
  - id: "3"
    label: "Luminit-Zitadelle"
  - id: "4"
    label: "Grauenssegelriff"
solution: "3"
```

## Wait for: mount

## Story
> Ja, die Luminit-Zitadelle.
  Dort kämpften wir, meine Freunde und ich.
  Ich war Lytril Telvanni und auf meiner Waffe lag an diesem Tag eine starke Verzauberung.
  Nehmt diese Glyphe an Euch.
  Möge sie Euch in deinen bevorstehenden Kämpfen so gute Dienste leisten, wie sie es in meinen tat.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "glyph"
