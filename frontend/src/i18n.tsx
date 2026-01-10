/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import type { Locale } from "./types";

type TranslationKey =
  | "brand"
  | "logout"
  | "languageLabel"
  | "loading"
  | "homeTitle"
  | "homeSubtitle"
  | "login"
  | "continueCalendar"
  | "loadingSession"
  | "calendarTitle"
  | "calendarSubtitle"
  | "calendarOrderHint"
  | "welcomeTitle"
  | "welcomeBody"
  | "daySolved"
  | "dayAvailable"
  | "dayLocked"
  | "daySolvePrev"
  | "dayNext"
  | "open"
  | "soon"
  | "warnNormalLock"
  | "confirmVeteranToNormal"
  | "confirm"
  | "cancel"
  | "backToCalendar"
  | "day"
  | "solved"
  | "unsolved"
  | "yourAnswer"
  | "submit"
  | "checking"
  | "submissionFailed"
  | "notAvailable"
  | "difficulty"
  | "modeChangeNotAllowed"
  | "dayLoadFailed"
  | "modeNormalLabel"
  | "modeVeteranLabel"
  | "modeHint"
  | "selected"
  | "locked"
  | "settingsTitle"
  | "settingsSubtitle"
  | "calendarLink"
  | "chooseOne"
  | "chooseMany"
  | "chooseManyOrdered"
  | "sortInstruction"
  | "moveUp"
  | "moveDown"
  | "groupInstruction"
  | "selectGroup"
  | "assignAllOptions"
  | "enterAnswer"
  | "loginSuccess"
  | "loginStagingDisabled"
  | "loginFailed"
  | "saving"
  | "prizesTitle"
  | "prizesSubtitle"
  | "prizeSectionTitle"
  | "prizeSectionBody"
  | "prizeSectionBodyPending"
  | "prizeSectionBodyLocked"
  | "prizesBannerTitle"
  | "prizesBannerEndedTitle"
  | "prizesBannerEndedSubtitle"
  | "prizesBannerCta"
  | "prizeStatusEnded"
  | "prizeStatusPending"
  | "feedbackBannerTitle"
  | "feedbackTitle"
  | "feedbackSubtitle"
  | "feedbackVeryDissatisfied"
  | "feedbackDissatisfied"
  | "feedbackNeutral"
  | "feedbackSatisfied"
  | "feedbackVerySatisfied"
  | "feedbackCommentLabel"
  | "feedbackCommentPlaceholder"
  | "feedbackCharsRemaining"
  | "feedbackLockedTitle"
  | "feedbackLockedBody"
  | "feedbackSkip"
  | "feedbackSubmit"
  | "feedbackSubmitted"
  | "feedbackSkipped"
  | "feedbackRatingRequired"
  | "feedbackThanksTitle"
  | "feedbackThanksBody"
  | "feedbackClosedTitle"
  | "feedbackClosedBody"
  | "settingsSaved"
  | "logoutSuccess"
  | "sessionEnded"
  | "sessionRefreshRetry"
  | "introLabel"
  | "introContinue"
  | "introCompleted"
  | "introRevisitHint"
  | "introStory"
  | "epilogueLabel"
  | "epilogueUnlocked"
  | "dayUnlocked"
  | "answerCorrect"
  | "answerIncorrect"
  | "placeAllItems"
  | "dragHint"
  | "socketPlaceholder"
  | "allItemsPlaced"
  | "memoryHint"
  | "memoryReset"
  | "memoryMisses"
  | "matchAllPairs"
  | "gridPathHint"
  | "gridPathGoalHint"
  | "gridPathStartLabel"
  | "gridPathGoalLabel"
  | "gridPathCannotSwitchStart"
  | "gridPathChooseStart"
  | "gridPathNoRevisit"
  | "gridPathStartTop"
  | "gridPathStartMatchesColumn"
  | "gridPathAdjacency"
  | "gridPathChooseCells"
  | "gridPathNeedBottom"
  | "gridPathGoalColumn"
  | "gridPathStepBack"
  | "gridPathNothingToUndo"
  | "gridPathNothingToReset"
  | "gridPathResetDisabledSolved"
  | "gridPathResetHintLocked"
  | "gridPathAlreadySolved"
  | "gridPathResetAfterIncorrect"
  | "selectItemsHint"
  | "selectItemsRequired"
  | "replay"
  | "pairItemsHint"
  | "pairItemsMismatch"
  | "placeholderOnlySolveNow"
  | "override"
  | "noContent"
  | "funSettingTitle"
  | "funSettingDescription"
  | "funSettingToggle"
  | "funSettingSaved"
  | "reset"
  | "solveNow"
  | "inventoryTitle"
  | "inventorySubtitle"
  | "inventoryEmptySubtitle"
  | "inventoryEmpty"
  | "inventoryCount"
  | "inventorySearchLabel"
  | "inventorySearchPlaceholder"
  | "inventoryRarityLabel"
  | "inventoryRarityAll"
  | "inventoryTagsLabel"
  | "inventoryTagAll"
  | "inventoryLoadFailed"
  | "inventoryLink";

const translations: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    brand: "Arsvent",
    logout: "Logout",
    languageLabel: "Language",
    loading: "Loading…",
    homeTitle: "Arsvent 2025",
    homeSubtitle: "Advent calendar of puzzles and progress for the ESO guild Ars Necandi.",
    login: "Login",
    continueCalendar: "Continue to your calendar",
    loadingSession: "Loading your session…",
    sessionRefreshRetry: "Temporary issue checking your session. Retrying…",
    calendarTitle: "Your calendar",
    calendarSubtitle: "Click an available day to play the riddle.",
    calendarOrderHint: "Solve days in order. Only the next unlocked day can be played.",
    welcomeTitle: "Welcome! Pick your difficulty",
    welcomeBody: "You can freely choose Normal or Veteran until you solve your first riddle. After that, upgrading is locked.",
    daySolved: "Solved",
    dayAvailable: "Available",
    dayLocked: "Locked",
    daySolvePrev: "Solve the previous day first",
    dayNext: "Next to solve",
    open: "Open",
    soon: "Soon",
    warnNormalLock: "Solving day 1 on Normal will lock Veteran. Continue?",
    confirmVeteranToNormal: "You have solved as Veteran. Switching to Normal will lock you out of Veteran. Continue?",
    confirm: "Confirm",
    cancel: "Cancel",
    backToCalendar: "Back to calendar",
    day: "Day",
    solved: "Solved",
    unsolved: "Unsolved",
    yourAnswer: "Your answer",
    submit: "Submit",
    checking: "Checking...",
    submissionFailed: "Submission failed.",
    notAvailable: "This day is not available yet.",
    difficulty: "Difficulty",
    modeChangeNotAllowed: "Mode change not allowed.",
    dayLoadFailed: "Unable to load this day.",
    modeNormalLabel: "Normal",
    modeVeteranLabel: "Veteran",
    modeHint: "Upgrading to Veteran is locked after choosing Normal. Downgrades are always allowed.",
    selected: "Selected",
    locked: "Locked",
    settingsTitle: "Settings",
    settingsSubtitle: "Adjust your difficulty. You can downgrade from Veteran to Normal anytime.",
    calendarLink: "Calendar",
    chooseOne: "Select exactly one answer.",
    chooseMany: "Select one or more answers.",
    chooseManyOrdered: "Select the answers in the correct order.",
    sortInstruction: "Arrange the options in the correct order.",
    moveUp: "Move up",
    moveDown: "Move down",
    groupInstruction: "Assign each option to a group.",
    selectGroup: "Select a group",
    assignAllOptions: "Please assign all options to a group.",
    enterAnswer: "Please enter an answer.",
    loginSuccess: "Logged in with Discord. Welcome!",
    loginStagingDisabled: "Staging logins are restricted. Contact an admin to get access.",
    loginFailed: "Login failed. Please try again.",
    saving: "Saving…",
    prizesTitle: "Prizes",
    prizesSubtitle: "Feedback and prize results live here once they are available.",
    prizeSectionTitle: "Prize draws",
    prizeSectionBody: "Draw results will appear here after the draw is published.",
    prizeSectionBodyPending: "Prize results will appear here once a draw is published.",
    prizeSectionBodyLocked: "Complete the calendar to unlock prize information and eligibility status.",
    prizesBannerTitle: "Prizes are available",
    prizesBannerEndedTitle: "Prizes have ended",
    prizesBannerEndedSubtitle: "You can still play, but new prize eligibility has closed.",
    prizesBannerCta: "Open",
    prizeStatusEnded: "Prizes ended for this pool because you completed after the cutoff.",
    prizeStatusPending: "Prize draw not published yet.",
    feedbackBannerTitle: "Feedback is open",
    feedbackTitle: "Event feedback",
    feedbackSubtitle: "Tell us how you felt about Arsvent 2025. One response per account.",
    feedbackVeryDissatisfied: "Very dissatisfied",
    feedbackDissatisfied: "Dissatisfied",
    feedbackNeutral: "Neutral",
    feedbackSatisfied: "Satisfied",
    feedbackVerySatisfied: "Very satisfied",
    feedbackCommentLabel: "Optional comment",
    feedbackCommentPlaceholder: "Share what you liked or what we can improve.",
    feedbackCharsRemaining: "{count} characters left",
    feedbackLockedTitle: "Feedback opens after completion",
    feedbackLockedBody: "Finish the full calendar to unlock the feedback form.",
    feedbackSkip: "Skip",
    feedbackSubmit: "Submit feedback",
    feedbackSubmitted: "Feedback submitted.",
    feedbackSkipped: "Feedback skipped.",
    feedbackRatingRequired: "Please select a rating before submitting.",
    feedbackThanksTitle: "Thanks for the feedback!",
    feedbackThanksBody: "Your response has been recorded.",
    feedbackClosedTitle: "Feedback is closed",
    feedbackClosedBody: "Feedback submissions are no longer available.",
    settingsSaved: "Settings saved.",
    logoutSuccess: "You have been logged out.",
    sessionEnded: "Your session ended. Please log in again.",
    introLabel: "Prologue",
    introContinue: "Continue to calendar",
    introCompleted: "Intro completed",
    introRevisitHint: "You can return here anytime to reread the prologue.",
    introStory: "Begin with the prologue and pick your difficulty.",
    epilogueLabel: "Epilogue",
    epilogueUnlocked: "The epilogue has been unlocked.",
    dayUnlocked: "A new day has been unlocked!",
    answerCorrect: "Correct! Well done.",
    answerIncorrect: "Incorrect answer. Try again.",
    placeAllItems: "Place the items onto the marked sockets.",
    dragHint: "Select or drag an item, then click or drop on a matching socket to place or swap it.",
    allItemsPlaced: "All items are placed. Select or drag one to a socket to adjust.",
    memoryHint: "Flip cards to find the correct pairs. Matched cards move to the list below.",
    memoryReset: "Too many misses. The board has been reset and shuffled.",
    memoryMisses: "{count} tries left",
    matchAllPairs: "Match all pairs before submitting.",
    gridPathHint: "Choose a start column, then trace a path through the grid.",
    gridPathGoalHint: "Reach the bottom and click the matching goal to submit.",
    gridPathStartLabel: "Start",
    gridPathGoalLabel: "Goal",
    gridPathCannotSwitchStart: "Reset before choosing a different start column.",
    gridPathChooseStart: "Choose a start column first.",
    gridPathNoRevisit: "You already stepped there.",
    gridPathStartTop: "Start on the top row.",
    gridPathStartMatchesColumn: "Enter the grid in your chosen column.",
    gridPathAdjacency: "Moves must be to an unvisited orthogonal cell.",
    gridPathChooseCells: "Build a path before finishing.",
    gridPathNeedBottom: "Reach the bottom row before selecting a goal.",
    gridPathGoalColumn: "Use the goal beneath your current column.",
    gridPathStepBack: "Step back",
    gridPathNothingToUndo: "Nothing to undo yet.",
    gridPathNothingToReset: "Nothing to reset.",
    gridPathResetDisabledSolved: "Already solved.",
    gridPathResetHintLocked: "Reset to try again.",
    gridPathAlreadySolved: "Puzzle already solved; actions are disabled.",
    gridPathResetAfterIncorrect: "Incorrect submission. Use Reset to start over.",
    selectItemsHint: "Tap the items that belong to the answer. Tap again to unselect.",
    selectItemsRequired: "Select at least one item.",
    replay: "Replay",
    pairItemsHint: "Match items by selecting one from each column.",
    pairItemsMismatch: "Those items do not match.",
    placeholderOnlySolveNow: "Placeholder puzzle for prototyping. Use admin “Solve now” to mark it complete.",
    socketPlaceholder: "?",
    override: "Override",
    noContent: "No content yet",
    funSettingTitle: "Fun setting",
    funSettingDescription: "Swap gryphon/dragon names everywhere.",
    funSettingToggle: "Swap gryphon ↔ dragon",
    funSettingSaved: "Fun setting updated.",
    reset: "Reset",
    solveNow: "Solve now",
    inventoryTitle: "Inventory",
    inventorySubtitle: "Inventory after day {day}.",
    inventoryEmptySubtitle: "Solve a day to start collecting rewards.",
    inventoryEmpty: "No items match your filters yet.",
    inventoryCount: "{count} of {total} items",
    inventorySearchLabel: "Search",
    inventorySearchPlaceholder: "Search items",
    inventoryRarityLabel: "Rarity",
    inventoryRarityAll: "All",
    inventoryTagsLabel: "Tags",
    inventoryTagAll: "All",
    inventoryLoadFailed: "Inventory could not be loaded.",
    inventoryLink: "View inventory",
  },
  de: {
    brand: "Arsvent",
    logout: "Abmelden",
    languageLabel: "Sprache",
    loading: "Lade…",
    homeTitle: "Arsvent 2025",
    homeSubtitle: "Adventskalender mit Rätseln und Fortschritt für die ESO-Gilde Ars Necandi.",
    login: "Login",
    continueCalendar: "Weiter zum Kalender",
    loadingSession: "Lade deine Sitzung…",
    sessionRefreshRetry: "Verbindungsproblem beim Sitzungscheck. Versuche es erneut…",
    calendarTitle: "Dein Kalender",
    calendarSubtitle: "Klicke auf einen verfügbaren Tag, um das Rätsel zu spielen.",
    calendarOrderHint: "Löse die Tage der Reihenfolge nach. Nur der nächste Tag ist spielbar.",
    welcomeTitle: "Willkommen! Wähle deine Schwierigkeit",
    welcomeBody: "Du kannst Normal oder Veteran frei wählen, bis du dein erstes Rätsel gelöst hast. Danach ist ein Upgrade gesperrt.",
    daySolved: "Gelöst",
    dayAvailable: "Verfügbar",
    dayLocked: "Gesperrt",
    daySolvePrev: "Löse zuerst den vorherigen Tag",
    dayNext: "Als Nächstes",
    open: "Öffnen",
    soon: "Bald",
    warnNormalLock: "Wenn du Tag 1 auf Normal löst, ist Veteran gesperrt. Fortfahren?",
    confirmVeteranToNormal: "Du hast als Veteran gelöst. Beim Wechsel auf Normal ist Veteran gesperrt. Fortfahren?",
    confirm: "Bestätigen",
    cancel: "Abbrechen",
    backToCalendar: "Zurück zum Kalender",
    day: "Tag",
    solved: "Gelöst",
    unsolved: "Ungelöst",
    yourAnswer: "Deine Antwort",
    submit: "Absenden",
    checking: "Prüfe...",
    submissionFailed: "Einreichen fehlgeschlagen.",
    notAvailable: "Dieser Tag ist noch nicht verfügbar.",
    difficulty: "Schwierigkeit",
    modeChangeNotAllowed: "Schwierigkeitswechsel nicht erlaubt.",
    dayLoadFailed: "Dieser Tag konnte nicht geladen werden.",
    modeNormalLabel: "Normal",
    modeVeteranLabel: "Veteran",
    modeHint: "Ein Upgrade auf Veteran ist gesperrt, nachdem du Normal gewählt hast. Herabstufen ist immer erlaubt.",
    selected: "Ausgewählt",
    locked: "Gesperrt",
    settingsTitle: "Einstellungen",
    settingsSubtitle: "Passe deine Schwierigkeit an. Von Veteran auf Normal kannst du jederzeit herabstufen.",
    calendarLink: "Kalender",
    chooseOne: "Wähle genau eine Antwort.",
    chooseMany: "Wähle eine oder mehrere Antworten.",
    chooseManyOrdered: "Wähle die Antworten in der richtigen Reihenfolge.",
    sortInstruction: "Bringe die Optionen in die richtige Reihenfolge.",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    groupInstruction: "Ordne jede Option einer Gruppe zu.",
    selectGroup: "Gruppe auswählen",
    assignAllOptions: "Bitte ordne alle Optionen einer Gruppe zu.",
    enterAnswer: "Bitte gib eine Antwort ein.",
    loginSuccess: "Mit Discord eingeloggt. Willkommen!",
    loginStagingDisabled: "Staging-Zugänge sind eingeschränkt. Bitte wende dich an einen Admin.",
    loginFailed: "Login fehlgeschlagen. Bitte versuche es erneut.",
    saving: "Speichern…",
    prizesTitle: "Preise",
    prizesSubtitle: "Feedback und Gewinninformationen findest du hier, sobald sie verfügbar sind.",
    prizeSectionTitle: "Preisziehungen",
    prizeSectionBody: "Ziehungsergebnisse erscheinen hier, sobald die Ziehung veröffentlicht ist.",
    prizeSectionBodyPending: "Preisergebnisse erscheinen hier, sobald die Ziehung veröffentlicht ist.",
    prizeSectionBodyLocked: "Schließe den Kalender ab, um Preisinfos und deine Berechtigung zu sehen.",
    prizesBannerTitle: "Preise sind verfügbar",
    prizesBannerEndedTitle: "Preise sind beendet",
    prizesBannerEndedSubtitle: "Du kannst weiter spielen, aber neue Preisberechtigung ist beendet.",
    prizesBannerCta: "Öffnen",
    prizeStatusEnded: "Preise sind für diesen Pool beendet, weil du nach dem Stichtag abgeschlossen hast.",
    prizeStatusPending: "Die Ziehung ist noch nicht veröffentlicht.",
    feedbackBannerTitle: "Feedback ist offen",
    feedbackTitle: "Event-Feedback",
    feedbackSubtitle: "Sag uns, wie dir Arsvent 2025 gefallen hat. Eine Antwort pro Account.",
    feedbackVeryDissatisfied: "Sehr unzufrieden",
    feedbackDissatisfied: "Unzufrieden",
    feedbackNeutral: "Neutral",
    feedbackSatisfied: "Zufrieden",
    feedbackVerySatisfied: "Sehr zufrieden",
    feedbackCommentLabel: "Optionaler Kommentar",
    feedbackCommentPlaceholder: "Teile, was dir gefallen hat oder was wir verbessern können.",
    feedbackCharsRemaining: "Noch {count} Zeichen",
    feedbackLockedTitle: "Feedback nach Abschluss",
    feedbackLockedBody: "Schließe den Kalender ab, um das Feedback freizuschalten.",
    feedbackSkip: "Überspringen",
    feedbackSubmit: "Feedback senden",
    feedbackSubmitted: "Feedback gesendet.",
    feedbackSkipped: "Feedback übersprungen.",
    feedbackRatingRequired: "Bitte wähle eine Bewertung aus.",
    feedbackThanksTitle: "Danke für dein Feedback!",
    feedbackThanksBody: "Deine Antwort wurde gespeichert.",
    feedbackClosedTitle: "Feedback geschlossen",
    feedbackClosedBody: "Feedback ist derzeit nicht verfügbar.",
    settingsSaved: "Einstellungen gespeichert.",
    logoutSuccess: "Du wurdest abgemeldet.",
    sessionEnded: "Deine Sitzung ist beendet. Bitte erneut einloggen.",
    introLabel: "Prolog",
    introContinue: "Weiter zum Kalender",
    introCompleted: "Einführung abgeschlossen",
    introRevisitHint: "Du kannst jederzeit hierher zurückkehren, um den Prolog erneut zu lesen.",
    introStory: "Starte mit dem Prolog und wähle deine Schwierigkeit.",
    epilogueLabel: "Epilog",
    epilogueUnlocked: "Der Epilog wurde freigeschaltet.",
    dayUnlocked: "Ein neuer Tag wurde freigeschaltet!",
    answerCorrect: "Richtig! Gut gemacht.",
    answerIncorrect: "Falsche Antwort. Versuche es erneut.",
    placeAllItems: "Platziere die Teile auf den markierten Stellen.",
    dragHint: "Wähle oder ziehe ein Teil und klicke bzw. lasse es auf einem passenden Feld los, um es zu platzieren oder zu tauschen.",
    allItemsPlaced: "Alle Teile sind platziert. Wähle oder ziehe eines auf ein Feld, um es anzupassen.",
    memoryHint: "Decke Karten auf und finde die passenden Paare. Gefundene Karten wandern unten in die Liste.",
    memoryReset: "Zu viele Fehlversuche. Das Feld wurde zurückgesetzt und neu gemischt.",
    memoryMisses: "{count} Versuche übrig",
    matchAllPairs: "Decke alle Paare auf, bevor du abschickst.",
    gridPathHint: "Wähle eine Startspalte und zeichne deinen Weg durchs Raster.",
    gridPathGoalHint: "Erreiche die unterste Reihe und klicke dann das Ziel in derselben Spalte.",
    gridPathStartLabel: "Start",
    gridPathGoalLabel: "Ziel",
    gridPathCannotSwitchStart: "Setze erst zurück, bevor du eine andere Startspalte wählst.",
    gridPathChooseStart: "Wähle zuerst eine Startspalte.",
    gridPathNoRevisit: "Dieses Feld hast du schon betreten.",
    gridPathStartTop: "Beginne in der obersten Reihe.",
    gridPathStartMatchesColumn: "Steige in deiner gewählten Spalte ein.",
    gridPathAdjacency: "Züge müssen orthogonal auf ein unbesuchtes Feld gehen.",
    gridPathChooseCells: "Lege einen Pfad fest, bevor du abschließt.",
    gridPathNeedBottom: "Erreiche die unterste Reihe, bevor du das Ziel wählst.",
    gridPathGoalColumn: "Nutze das Ziel unter deiner aktuellen Spalte.",
    gridPathStepBack: "Einen Schritt zurück",
    gridPathNothingToUndo: "Nichts zum Rückgängig machen.",
    gridPathNothingToReset: "Nichts zum Zurücksetzen.",
    gridPathResetDisabledSolved: "Bereits gelöst.",
    gridPathResetHintLocked: "Setze zurück, um neu zu starten.",
    gridPathAlreadySolved: "Rätsel gelöst; Aktionen sind deaktiviert.",
    gridPathResetAfterIncorrect: "Falsche Abgabe. Nutze Zurücksetzen für einen neuen Versuch.",
    selectItemsHint: "Tippe die passenden Elemente in der Szene an. Tippe erneut, um abzuwählen.",
    selectItemsRequired: "Wähle mindestens ein Element aus.",
    replay: "Erneut abspielen",
    pairItemsHint: "Paare bilden, indem du je ein Element aus jeder Spalte wählst.",
    pairItemsMismatch: "Diese beiden Elemente passen nicht zusammen.",
    placeholderOnlySolveNow: "Platzhalter-Rätsel für Prototypen. Nur per Admin-„Jetzt lösen“ abschließbar.",
    socketPlaceholder: "?",
    override: "Überschreiben",
    noContent: "Kein Inhalt",
    funSettingTitle: "Spaß-Einstellung",
    funSettingDescription: "Vertauscht überall Greif-/Drachen-Namen.",
    funSettingToggle: "Greif ↔ Drache tauschen",
    funSettingSaved: "Spaß-Einstellung aktualisiert.",
    reset: "Zurücksetzen",
    solveNow: "Jetzt lösen",
    inventoryTitle: "Inventar",
    inventorySubtitle: "Inventar nach Tag {day}.",
    inventoryEmptySubtitle: "Löse einen Tag, um Belohnungen zu sammeln.",
    inventoryEmpty: "Keine Gegenstände passen zu deinen Filtern.",
    inventoryCount: "{count} von {total} Gegenständen",
    inventorySearchLabel: "Suche",
    inventorySearchPlaceholder: "Gegenstände durchsuchen",
    inventoryRarityLabel: "Seltenheit",
    inventoryRarityAll: "Alle",
    inventoryTagsLabel: "Tags",
    inventoryTagAll: "Alle",
    inventoryLoadFailed: "Inventar konnte nicht geladen werden.",
    inventoryLink: "Inventar ansehen",
  },
};

interface I18nContextValue {
  locale: Locale;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue>({
  locale: "en",
  t: (key) => translations.en[key],
  setLocale: () => undefined,
});

export function I18nProvider({
  locale,
  setLocale,
  children,
}: {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const t = (key: TranslationKey, vars?: Record<string, string | number>) => {
      const template = translations[locale]?.[key] ?? translations.en[key];
      if (!vars) return template;
      return Object.entries(vars).reduce((acc, [name, value]) => acc.replace(new RegExp(`{${name}}`, "g"), String(value)), template);
    };
    return { locale, t, setLocale };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
