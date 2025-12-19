---
id: "25-day19-normal-de"
version: 1
release: "2025-12-19T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 19

## Story
Die Szene der Schlacht löst sich vor dir auf.
Du wirst sanft auf dem Boden abgesetzt und stehst nun nur noch einem einzelnen Krieger gegenüber. 

> Das bin ich, nicht wahr?
Versucht gar nicht erst, mich anzugreifen!
Ich weiß mich zu verteidigen!
Oder, ich wusste es einmal...

## Puzzle
id: "defense"
Welche Rüstungsfähigkeit musst du verwenden, um diesen Effekt zu erzielen?

![Location](/assets/25_19_background_normal.png)

```yaml puzzle
type: "single-choice"
options:
  - id: "light"
    label: "Neutralisierende Magie"
    image: "/assets/25_19_option_1.png"
  - id: "medium"
    label: "Ausweichen"
    image: "/assets/25_19_option_2.png"
  - id: "heavy"
    label: "Sicherer Stand"
    image: "/assets/25_19_option_3.png"
solution: "light"
```

## Wait for: defense

## Story
> Es stimmt!
  Nun weiß ich es wieder.
  Ich konnte diesen magischen Schild erschaffen um mich zu schützen.
  Viele kamen im Laufe der Jahre zu mir, Latharek, um diese Technik zu erlernen.
  Und nun lehre ich sie Euch!

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "armorskill"
