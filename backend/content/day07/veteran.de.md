---
id: "25-day07-veteran-de"
version: 1
release: "2025-12-07T00:00:00Z"
language: "de"
mode: "veteran"
solved:
  when: "all"
---

# 7

## Story
Urplötzlich wirt du erneut an einen anderen Ort versetzt.
Du befindest dich in einem Raum mit einem Totem, einem seltsamen Apparat und einer Statue.
Die einzige Tür hinaus ist versiegelt.

> Stärker!
  Ich muss stärker werden.
  Normale Herausforderungen sind nicht schwer genug.
  Nur dann kann ich mein Ziel erreichen.
  Was war mein Ziel?
  Was war mein Name?
  Bei meinen Hauern, ich habe es vergessen!

## Puzzle
id: "hardmode1"
In welcher Instanz kann man mit diesem Schalter den HardMode aktivieren?

![Hard-Mode Schalter](/assets/25_07_round1.png)

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: "Gesegnete Feuerprobe"
  - id: "2"
    label: "Gram des Schiffbauers"
  - id: "3"
    label: "Schreckenskeller"
  - id: "4"
    label: "Wiege der Schatten"
  - id: "5"
    label: "Arx Corinium"
  - id: "6"
    label: "Steingarten"
solution: "4"
```

## Wait for: hardmode1

## Puzzle
id: "hardmode2"
In welcher Instanz kann man mit diesem Schalter den HardMode aktivieren?

![Hard-Mode Schalter](/assets/25_07_round2.png)

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: "Selenes Netz"
  - id: "2"
    label: "Weißgoldturm"
  - id: "3"
    label: "Frostgewölbe"
  - id: "4"
    label: "Der Kessel"
  - id: "5"
    label: "Grube der Eidgeschworenen"
  - id: "6"
    label: "Hort von Maarselok"
solution: "3"
```

## Wait for: hardmode2

## Puzzle
id: "hardmode3"
In welcher Instanz kann man mit diesem Schalter den HardMode aktivieren?

![Hard-Mode Schalter](/assets/25_07_round3.png)

```yaml puzzle
type: "single-choice"
difficulty: "easy"
options:
  - id: "1"
    label: "Erdwurzenklave"
  - id: "2"
    label: "Orkaninsel"
  - id: "3"
    label: "Volenfell"
  - id: "4"
    label: "Korallenhorst"
  - id: "5"
    label: "Krallenhort"
  - id: "6"
    label: "Eiskap"
solution: "6"
```

## Wait for: hardmode3

## Story
> Mein Ziel?
  Meinen eigenen Klan zu gründen.
  Mein Name?
  Magrub Grakish.
  Ich erinnere mich wieder an alles.
  Ich war erfolgreich, doch mein Klan war klein.
  Meine Söhne und Töchter sind noch dort draußen.
  Ich lehrte sie die Fähigkeiten für ein gutes Leben.
  Und auch an Euch möchte ich diese Fähigkeiten weitergeben.

## Reward
inventoryId: "weaponskills"
