---
id: "25-day21-normal-de"
version: 1
release: "2025-12-21T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 21

## Story
Eine eben noch versiegelte Tür schwingt auf.
Du trittst hindurch in eine große Küche.
Die Regale sind gefüllt mit Zutaten, mehrere Gerichte schmoren und grillen vor sich hin, etliche Fässer warten nur darauf, leergetrunken zu werden.
Es riecht himmlisch.

> Eine Priese Zucker zum gebratenen Schlachterfisch geben.
  So ging das Rezept, nicht wahr?
  Nein, nein das kann nicht sein.
  Eine Priese Pfeffer in den Pudding rühren!
  Nein, nein, nein!
  Ich erinnere mich nicht!

## Puzzle
id: "food"
Immer 2 dieser BuffFoods haben denselben Effekt.
Finde die Paare.

```yaml puzzle
type: "pair-items"
left:
  - id: "orcrest"
    label: "Orkruh-Schmerzbleichale"
    image: "/assets/25_21_option_12.png"
  - id: "muthseras"
    label: "Muthseras Reue"
    image: "/assets/25_21_option_2.png"
  - id: "dragontail"
    label: "Drachenschwanz-Verschnittwhiskey"
    image: "/assets/25_21_option_5.png"
  - id: "firsthold"
    label: "Ersthalt-Käseplatte mit Früchten"
    image: "/assets/25_21_option_10.png"
  - id: "sticky"
    label: "Klebrige Rettichnudeln mit Schweinefleisch"
    image: "/assets/25_21_option_11.png"
  - id: "withered"
    label: "Wildtopfbraten aus dem Verdorrten Baum"
    image: "/assets/25_21_option_4.png"
right:
  - id: "velothi"
    label: "Velothi-Fernmalbec"
    image: "/assets/25_21_option_3.png"
  - id: "hearts"
    label: "Herztags-Rosentee"
    image: "/assets/25_21_option_8.png"
  - id: "port"
    label: "Hundingshafen-Dunkelwein"
    image: "/assets/25_21_option_6.png"
  - id: "tomato"
    label: "Tomatenknoblauchchutney"
    image: "/assets/25_21_option_1.png"
  - id: "garlic"
    label: "Knoblauchdorsch mit Kartoffelkruste"
    image: "/assets/25_21_option_9.png"
  - id: "capon"
    label: "Kapaunenauflauf mit Tomaten und Gemüse"
    image: "/assets/25_21_option_7.png"
solution:
  - { left: "orcrest", right: "velothi" }
  - { left: "dragontail", right: "port" }
  - { left: "firsthold", right: "tomato" }
  - { left: "withered", right: "capon" }
  - { left: "muthseras", right: "hearts" }
  - { left: "sticky", right: "garlic" }
```

## Wait for: food

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
