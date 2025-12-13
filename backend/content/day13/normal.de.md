---
id: "25-day13-normal-de"
version: 1
release: "2025-12-13T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 13

## Story
Die Wände um dich herum verschieben sich.
Aus dem kleinen Raum wird eine riesige Halle.
Der gesamte Boden ist mit Symbolen bedeckt und du stehst am Rand eines großen Rasters.

> Einst hatte ich viele Fähigkeiten.
  Ich war kein Ritter und kein Zauberer, weder Nekromant noch Arkanist.
  Ich war kein Templer und führte keine Klinge in der Nacht.
  Doch was war ich dann?

## Puzzle
id: "skills"
Wähle alle Fähigkeiten der Klasse Hüter aus.
Wähle zuerst die hervorgehobenen Zahl am Start aus.
Wähle dann die Fähigkeit, die direkt daran angenzt.
Arbeite dich so bis zur hervorgehobenen Zahl am Ende vor.

```yaml puzzle
type: "grid-path"
grid: { width: 9, height: 9 }
backgroundImage: "/assets/25_13_background.png"

solution:
  startColumn: 5
  goalColumn: 4
  path:
    - { x: 5, y: 1 }
    - { x: 5, y: 2 }
    - { x: 5, y: 3 }
    - { x: 5, y: 4 }
    - { x: 4, y: 4 }
    - { x: 3, y: 4 }
    - { x: 3, y: 5 }
    - { x: 3, y: 6 }
    - { x: 3, y: 7 }
    - { x: 4, y: 7 }
    - { x: 5, y: 7 }
    - { x: 6, y: 7 }
    - { x: 7, y: 7 }
    - { x: 7, y: 8 }
    - { x: 7, y: 9 }
    - { x: 6, y: 9 }
    - { x: 5, y: 9 }
    - { x: 4, y: 9 }
```

## Wait for: skills

## Story
> Es stimmt, ich war Logorok Mogdza und ich war ein Hüter.
Ich liebte die Tiere und die Pflanzen.
Gebt gut acht und ich lehre Euch die wichtigsten meiner Fähigkeiten!

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "wardenskills"
