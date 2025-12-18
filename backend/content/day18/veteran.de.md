---
id: "25-day18-veteran-de"
version: 1
release: "2025-12-18T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 18

## Story
Der Boden unter deinen Füßen löst sich auf und du stürzt mitten in eine tobende Schlacht hinab.
Kurz bevor du den Boden berührst, friert die Zeit um dich herum ein.
In Ruhe kannst du dich umsehen.

> Dies sind meine Brüder und Schwestern.
  Wir kämpften.
  Warum nur?
  Es war wichtig, so viel weiß ich.
  Waren wir siegreich?
  Wie lief der Kampf ab?

## Puzzle
id: "scriveners"
Finde mindestens 8 der unmöglichen Dinge während des Kampfs in der Haller der Schriftmeister.

```yaml puzzle
type: "select-items"
background-image: "/assets/25_18_background.png"
shape: "square"
requiredSelections: 8

items:
  - id: "group-frame"
    position: { x: 0.08, y: 0.16 }
  - id: "health-bar"
    position: { x: 0.68, y: 0.06 }
  - id: "boss-level"
    position: { x: 0.4, y: 0.1 }
  - id: "boss-immunity"
    position: { x: 0.52, y: 0.1 }
  - id: "player-dead"
    position: { x: 0.7, y: 0.48 }
  - id: "social-icons"
    position: { x: 0.02, y: 0.79 }
  - id: "skill-bar"
    position: { x: 0.5, y: 0.96 }
  - id: "ultimate"
    position: { x: 0.615, y: 0.96 }
  - id: "soul-resorvoire"
    position: { x: 0.95, y: 0.96 }

  - id: "magicka"
    position: { x: 0.21, y: 0.9 }
  - id: "stamina"
    position: { x: 0.8, y: 0.9 }
  - id: "quickslot"
    position: { x: 0.39, y: 0.96 }
  - id: "crosshair"
    position: { x: 0.5, y: 0.5 }
  - id: "red-area"
    position: { x: 0.87, y: 0.63 }
  - id: "npc"
    position: { x: 0.79, y: 0.47 }
  - id: "background-banner"
    position: { x: 0.74, y: 0.29 }
  - id: "background-structure"
    position: { x: 0.37, y: 0.35 }
  - id: "crystall"
    position: { x: 0.16, y: 0.57 }

solution:
  - "group-frame"
  - "health-bar"
  - "boss-level"
  - "boss-immunity"
  - "player-dead"
  - "social-icons"
  - "skill-bar"
  - "ultimate"
  - "soul-resorvoire"
```

## Wait for: scriveners

## Story
> Meine geliebten Geschwister, meine Kameraden.
  Ich erinnere mich an all ihre Gesichter.
  Und auch an mein eigenes.
  Ich war Uralest Jeneve.
  Jeder von uns war ein Spezialist auf einem Gebiet.
  Meine Spezialität war das herstellen von Ausrüstung.
  Zieht niemals ohne gute Ausrüstung in eine Schlacht!
  Für mein Können wurde ich oft entlohnt.
  Nehmt dies.
  Es ist keine meiner Waffen oder Rüstungen, aber es ist das nächstbeste.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "voucher"
