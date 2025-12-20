---
id: "25-day22-veteran-de"
version: 1
release: "2025-12-22T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 22

## Story
Du gehst durch die nächste Tür und du befindest dich auf einem Marktplatz.
An den Ständen hängen die Porträts von 3 Händlerinnen.

> Ein Markt?
  Möchtet Ihr etwas kaufen?
  Mein Inventar war immer gut gefüllt.
  Aber nun kann ich Euch nichts mehr anbieten.
  Ich kann Euch nicht einmal mehr meinen Namen nennen...

## Puzzle
id: "currency"
Ordne diesen Händlerinnen die Währungen zu, die sie akzeptieren.

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

## Wait for: currency

## Story
> Das sind Adhazabi, Urgalag, Faustina.
  Und ich war Telnidra.
  Wir waren Freundinnen.
  Adhazabi gab mir Schmuck, Faustina gab mir Möbel und Urgalag lehrte mich eine Fähigkeit ihrer unerschrockenen Freunde.
  Schaut her, ich zeige sie Euch!

Du spürst, dass du mit allen gefangenen Seelen gesprochen hast.
Als nächstes solltest du dich auf eine Konfrontation mit derjenigen vorbereiten, die für all das hier verantwortlich ist: Trinkt-Dein-Blut.

## Reward
inventoryId: "taunt"
