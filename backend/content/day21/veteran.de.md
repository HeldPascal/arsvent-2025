---
id: "25-day21-veteran-de"
version: 1
release: "2025-12-21T00:00:00Z"
language: "de"
mode: "veteran"
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
  - id: "dragontail"
    label: "Drachenschwanz-Verschnittwhiskey"
    image: "/assets/25_21_option_5.png"
  - id: "withered"
    label: "Wildtopfbraten aus dem Verdorrten Baum"
    image: "/assets/25_21_option_4.png"
  - id: "firsthold"
    label: "Ersthalt-Käseplatte mit Früchten"
    image: "/assets/25_21_option_10.png"
  - id: "muthseras"
    label: "Muthseras Reue"
    image: "/assets/25_21_option_2.png"
  - id: "orcrest"
    label: "Orkruh-Schmerzbleichale"
    image: "/assets/25_21_option_12.png"
  - id: "sticky"
    label: "Klebrige Rettichnudeln mit Schweinefleisch"
    image: "/assets/25_21_option_11.png"
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
> Ein bisschen hiervon, ein wenig davon und dann köcheln lassen.
  Ja, so geht es!
  Ich erinnere mich an all meine Rezepte.
  Die Köchin Vilonia Woeus, das war ich.
  Mitglieder aller Allianzen kamen in mein Restaurant.
  Zu schade, dass ich niemals für Euch kochen kann.
  Nehmt stattdessen dies.
  Es sind harte Zeiten und euch steht ein harter Kampf bevor.

Du spürst, dass eine weitere gefangene Seele auf deine Hilfe wartet.

## Reward
inventoryId: "alliance-points"
