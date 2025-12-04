---
id: "25-day01-normal-de"
version: 1
release: "2025-12-01T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 1

## Story
Du spürst eine magische Welle um dich herum.
Der Seelenstein hat dich in sich hineingezogen!
Alles fühlt sich fast wie ein Traum an.
Du befindest dich an einem Strand.
Die Stimmen in deinem Kopf sind lauter und klarer als zuvor.
Eine tritt in den Vordergrund und spricht zu dir:

> Ich reiste durch die Welt und zeichnete Karten von dem, was ich sah.
  War dieser Ort der letzte, den ich besuchte?
  Wo war ich, als der Tod mich fand?

## Puzzle
id: "poi"
Mit welchem Symbol wird dieser Ort auf deiner Karte markiert?

![Location](/assets/25_01_background.png)

```yaml puzzle
type: single-choice
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

## Wait for: poi

## Story
> Ja, ich erinnere mich.
  Mein Name war Thurwe Hrorikson.
  Und dies ist Kynes Ägis, meine Heimat und meine letzte Prüfung.
  Ich danke Euch.
  Nehmt diesen Heilungsstab.
  Möge er Euch bessere Dienste leisten, als mir.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "restostaff"
