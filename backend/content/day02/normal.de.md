---
id: "day02-normal-de"
version: 1
release: "2025-12-02T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# Lichter am Himmel

## Story
Du trittst hinaus und siehst den Winterhimmel farbig schimmern.

## Puzzle: Lichter am Himmel
id: "sky-lights"
Welches Schauspiel färbt nachts den Himmel nahe der Pole?

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "aurora"
    label: "Aurora borealis"
  - id: "rainbow"
    label: "Regenbogen"
  - id: "lighthouse"
    label: "Lichtstrahl eines Leuchtturms"
  - id: "candle"
    label: "Kerzenschimmer"
solution: "aurora"
```

## Wait for: sky-lights

## Story: Test title
id: "test-id"
Testcontent

## Puzzle
id: "sky-lights2"
Welches Schauspiel färbt nachts den Himmel nahe der Pole?

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "aurora"
    label: "Aurora borealis"
  - id: "rainbow"
    label: "Regenbogen"
  - id: "lighthouse"
    label: "Lichtstrahl eines Leuchtturms"
  - id: "candle"
    label: "Kerzenschimmer"
solution: "aurora"
```

## Wait for: sky-lights2

## Story: Test title 2
id: "test-id2"
Testcontent2
