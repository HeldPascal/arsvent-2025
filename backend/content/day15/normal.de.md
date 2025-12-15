---
id: "25-day15-normal-de"
version: 1
release: "2025-12-15T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 15

## Story
Du blinzelt und dort wo eben noch die Mundussteine standen, stehen nun Statuen.
Sie sind nicht aus Stein gemeißelt oder aus Holz geschnitzt, sondern sie bestehen vollständig aus Glas und Kristall.

> Ein Kampf und dann der nächste, immer und immer wieder.
  Es war endlos.
  So viele Bücher, so viel Tinte.
  Bin ich entkommen?
  Ich habe sie gejagt, in jeder Gestalt, die sie angenommen hat.
  Ist sie vernichtet?

## Puzzle
id: "archive"
In welcher Reihenfolge triffst du auf diese Aspekte von Tho'at Replicanum?

```yaml puzzle
type: "multi-choice"
size: "large"
options:
  - id: "1"
    label: ""
    image: "/assets/25_15_option_1.png"
  - id: "2"
    label: ""
    image: "/assets/25_15_option_2.png"
  - id: "3"
    label: ""
    image: "/assets/25_15_option_3.png"
  - id: "4"
    label: ""
    image: "/assets/25_15_option_4.png"
minSelections: 4
ordered: true
solution:
  - "2"
  - "3"
  - "4"
  - "1"
```

## Wait for: archive

## Story
> Das endlose Archiv.
  Tho'at Replicanum.
  Nun erinnere ich mich, man kann sie niemals ganz besiegen.
  Doch ich?
  Ich war Oraar Ugrud und ich konnte das Archiv verlassen.
  Ich kehrte zu meinen Brüdern und Schwestern bei den Unerschrockenen zurück.
  Ihr seid auch unerschrocken, nicht wahr?
  Dann nehmt diesen Schlüssel als Zeichen meines Vertrauens in Euch.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "key"
