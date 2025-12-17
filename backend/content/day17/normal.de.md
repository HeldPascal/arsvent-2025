---
id: "25-day17-normal-de"
version: 1
release: "2025-12-17T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 17

## Story
Das Modell des Tempels löst sich vor deinen Augen in Luft auf.
Scheinbar stand es auf einem Blatt Papier.
Dieses Blatt enthält eine Liste von Orten, die du instinktiv als gefährlich erkennst.

> Ich suchte immer nach einer Herausforderung.
  Eine, zwei, drei.
  Herausforderungen, ganz viele.
  Fand ich sie?
  Habe ich sie verloren?
  Habe ich mich selbst verloren?

## Puzzle
id: "dlcs"
Welche dieser Verliese gehören zum selben DLC?

```yaml puzzle
type: "pair-items"
left:
  - id: "cauldron"
    label: "Der Kessel"
  - id: "coral-aerie"
    label: "Korallenhorst"
  - id: "icereach"
    label: "Eiskap"
right:
  - id: "black-drake-villa"
    label: "Schwarzdrachenvilla"
  - id: "unhallowed-grave"
    label: "Unheiliges Grab"
  - id: "shipwrights-regret"
    label: "Gram des Schiffbauers"
solution:
  - { left: "cauldron", right: "black-drake-villa" }
  - { left: "coral-aerie", right: "shipwrights-regret" }
  - { left: "icereach", right: "unhallowed-grave" }
```

## Wait for: dlcs

## Story
> Ja, ich erinnere mich.
  Ich war Itium Spurelus.
  Ich habe all diese Herausforderungen gesucht, mich ihnen gestellt und sie gemeistert.
  Genau wie nach Herausforderungen suchte ich ebenfalls immer nach neuen Kombinationen für Runensteine.
  Hier, nehmt diese kleine Sammlung, die ich bei mir trug, als ich starb.
  Findet die Kombination, die für Euch am besten funktioniert.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "runes"
