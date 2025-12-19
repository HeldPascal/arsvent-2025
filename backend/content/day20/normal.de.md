---
id: "25-day20-normal-de"
version: 1
release: "2025-12-20T00:00:00Z"
language: "de"
mode: "normal"
solved:
  when: "all"
---

# 20

## Story
Du blickst aus dem Fenster und draußen ist die Nacht hereingebrochen.
Hell leuchten die Sterne im Sternbild der Magierin.

> Immer wenn ich Angst hatte, erfüllten mich die Sterne mit Kraft.
  Immer wenn ich einsam war, erfüllten mich die Sterne mit Hoffnung.
  Doch nun weiß ich nicht mehr, welchen Stern ich um Hilfe bitten muss...
  Was soll ich nur tun?

## Puzzle
id: "cp"
Finde diese Sterne im blauen CP-Baum:
- Kampffinesse
- Fokussierte Pflege
- Ausdauernde Entschlossenheit
- Beißende Aura

```yaml puzzle
type: "drag-sockets"
background-image: "/assets/25_20_background_none.png"
shape: "circle"
size: "small"

items:
  - id: "foresight"
    label: "Vorblick"
    image: "/assets/25_20_option.png"
    defaultSocketId: "foresight-socket"
  - id: "cleansing-revival"
    label: "Reinigende Belebung"
    image: "/assets/25_20_option.png"
    defaultSocketId: "cleansing-revival-socket"
  - id: "focused-mending"
    label: "Fokussierte Pflege"
    image: "/assets/25_20_option.png"
    defaultSocketId: "focused-mending-socket"
  - id: "swift-renewal"
    label: "Geschwinde Erneuerung"
    image: "/assets/25_20_option.png"
    defaultSocketId: "swift-renewal-socket"
  - id: "rejuvinator"
    label: "Verjüngerer"
    image: "/assets/25_20_option.png"
    defaultSocketId: "rejuvinator-socket"
  - id: "soothing-tide"
    label: "Besänftigender Strom"
    image: "/assets/25_20_option.png"
    defaultSocketId: "soothing-tide-socket"

  - id: "reaving-blows"
    label: "Pflündernde Hiebe"
    image: "/assets/25_20_option.png"
    defaultSocketId: "reaving-blows-socket"
  - id: "wrathful-strikes"
    label: "Zornerfüllte Schläge"
    image: "/assets/25_20_option.png"
    defaultSocketId: "wrathful-strikes-socket"
  - id: "occult-overload"
    label: "Okkulte Überladung"
    image: "/assets/25_20_option.png"
    defaultSocketId: "occult-overload-socket"
  - id: "backstabber"
    label: "Hinterhalt"
    image: "/assets/25_20_option.png"
    defaultSocketId: "backstabber-socket"
  - id: "fighting-finesse"
    label: "Kampffinesse"
    image: "/assets/25_20_option.png"
    defaultSocketId: "fighting-finesse-socket"

  - id: "eldritch-insight"
    label: "Schaurige Erkenntnis"
    image: "/assets/25_20_option.png"
    defaultSocketId: "eldritch-insight-socket"
  - id: "precision"
    label: "Präzision"
    image: "/assets/25_20_option.png"
    defaultSocketId: "precision-socket"
  - id: "tireless-discipline"
    label: "Unermüdliche Disziplin"
    image: "/assets/25_20_option.png"
    defaultSocketId: "tireless-discipline-socket"

  - id: "duellists-rebuff"
    label: "Abfuhr des Duellanten"
    image: "/assets/25_20_option.png"
    defaultSocketId: "duellists-rebuff-socket"
  - id: "riposte"
    label: "Erwidern"
    image: "/assets/25_20_option.png"
    defaultSocketId: "riposte-socket"
  - id: "last-stand"
    label: "Letztes Aufbäumen"
    image: "/assets/25_20_option.png"
    defaultSocketId: "last-stand-socket"
  - id: "enduring-resolve"
    label: "Ausdauernde Entschlossenheit"
    image: "/assets/25_20_option.png"
    defaultSocketId: "enduring-resolve-socket"
  - id: "reinforced"
    label: "Verstärkt"
    image: "/assets/25_20_option.png"
    defaultSocketId: "reinforced-socket"
  - id: "unassailable"
    label: "Unbezwingbar"
    image: "/assets/25_20_option.png"
    defaultSocketId: "unassailable-socket"
  - id: "bulwark"
    label: "Bollwerk"
    image: "/assets/25_20_option.png"
    defaultSocketId: "bulwark-socket"
  - id: "cutting-defense"
    label: "Schneidende Verteidigung"
    image: "/assets/25_20_option.png"
    defaultSocketId: "cutting-defense-socket"

  - id: "deadly-aim"
    label: "Tödliches Zielen"
    image: "/assets/25_20_option.png"
    defaultSocketId: "deadly-aim-socket"
  - id: "thaumaturge"
    label: "Thaumaturg"
    image: "/assets/25_20_option.png"
    defaultSocketId: "thaumaturge-socket"
  - id: "master-at-arms"
    label: "Waffenmeister"
    image: "/assets/25_20_option.png"
    defaultSocketId: "master-at-arms-socket"
  - id: "biting-aura"
    label: "Beißende Aura"
    image: "/assets/25_20_option.png"
    defaultSocketId: "biting-aura-socket"

  - id: "arcane-supremacy"
    label: "Arkane Überlegenheit"
    image: "/assets/25_20_option.png"
    defaultSocketId: "arcane-supremacy-socket"
  - id: "untamed-aggression"
    label: "Ungezähmte Aggression"
    image: "/assets/25_20_option.png"
    defaultSocketId: "untamed-aggression-socket"
  - id: "endless-endurance"
    label: "Endlose Beständigkeit"
    image: "/assets/25_20_option.png"
    defaultSocketId: "endless-endurance-socket"

sockets:
  - id: "blue-1"
    label: ""
    image: "/assets/25_20_socket.png"
    position: { x: 0.461, y: 0.069 }
  - id: "blue-2"
    label: ""
    image: "/assets/25_20_socket.png"
    position: { x: 0.491, y: 0.069 }
  - id: "blue-3"
    label: ""
    image: "/assets/25_20_socket.png"
    position: { x: 0.521, y: 0.069 }
  - id: "blue-4"
    label: ""
    image: "/assets/25_20_socket.png"
    position: { x: 0.551, y: 0.069 }

  - id: "foresight-socket"
    label: ""
    position: { x: 0.071, y: 0.168 }
  - id: "cleansing-revival-socket"
    label: ""
    position: { x: 0.095, y: 0.317 }
  - id: "focused-mending-socket"
    label: ""
    position: { x: 0.157, y: 0.474 }
  - id: "swift-renewal-socket"
    label: ""
    position: { x: 0.164, y: 0.355 }
  - id: "rejuvinator-socket"
    label: ""
    position: { x: 0.162, y: 0.238 }
  - id: "soothing-tide-socket"
    label: ""
    position: { x: 0.235, y: 0.405 }

  - id: "reaving-blows-socket"
    label: ""
    position: { x: 0.42, y: 0.426  }
  - id: "wrathful-strikes-socket"
    label: ""
    position: { x: 0.423, y: 0.268 }
  - id: "occult-overload-socket"
    label: ""
    position: { x: 0.477, y: 0.203 }
  - id: "backstabber-socket"
    label: ""
    position: { x: 0.558, y: 0.254 }
  - id: "fighting-finesse-socket"
    label: ""
    position: { x: 0.592, y: 0.367 }

  - id: "eldritch-insight-socket"
    label: ""
    position: { x: 0.419, y: 0.603 }
  - id: "precision-socket"
    label: ""
    position: { x: 0.52, y: 0.443 }
  - id: "tireless-discipline-socket"
    label: ""
    position: { x: 0.602, y: 0.513 }

  - id: "duellists-rebuff-socket"
    label: ""
    position: { x: 0.46, y: 0.682 }
  - id: "riposte-socket"
    label: ""
    position: { x: 0.465, y: 0.788 }
  - id: "last-stand-socket"
    label: ""
    position: { x: 0.465, y: 0.915 }
  - id: "enduring-resolve-socket"
    label: ""
    position: { x: 0.534, y: 0.724 }
  - id: "reinforced-socket"
    label: ""
    position: { x: 0.54, y: 0.852 }
  - id: "unassailable-socket"
    label: ""
    position: { x: 0.595, y: 0.649 }
  - id: "bulwark-socket"
    label: ""
    position: { x: 0.596, y: 0.77 }
  - id: "cutting-defense-socket"
    label: ""
    position: { x: 0.617, y: 0.906 }

  - id: "deadly-aim-socket"
    label: ""
    position: { x: 0.778, y: 0.18 }
  - id: "thaumaturge-socket"
    label: ""
    position: { x: 0.851, y: 0.085 }
  - id: "master-at-arms-socket"
    label: ""
    position: { x: 0.871, y: 0.188 }
  - id: "biting-aura-socket"
    label: ""
    position: { x: 0.83, y: 0.272 }

  - id: "arcane-supremacy-socket"
    label: ""
    position: { x: 0.774, y: 0.568 }
  - id: "untamed-aggression-socket"
    label: ""
    position: { x: 0.831, y: 0.688 }
  - id: "endless-endurance-socket"
    label: ""
    position: { x: 0.73, y: 0.77 }

solution:
  lists:
    - id: "solution-cps"
      items: ["fighting-finesse", "focused-mending", "enduring-resolve", "biting-aura"]
  sockets:
    - socketId: "blue-1"
      listId: "solution-cps"
    - socketId: "blue-2"
      listId: "solution-cps"
    - socketId: "blue-3"
      listId: "solution-cps"
    - socketId: "blue-4"
      listId: "solution-cps"
```

## Wait for: cp

## Story
> Die Sterne, ich erinnere mich an ihre Namen!
  Und ich erinnere mich auch an meinen: Gin-Ei Xeirdes.
  Und ich habe keine Angst mehr.
  Wir sind Wurzelgeschwister, Ihr und ich.
  Bitte, nehmt meine Waffen und rettet uns.

Du spürst, dass weitere gefangene Seelen auf deine Hilfe warten.

## Reward
inventoryId: "weapons"
