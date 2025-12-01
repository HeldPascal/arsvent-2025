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
  | "confirmVetToNormal"
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
  | "modeVetLabel"
  | "modeHint"
  | "selected"
  | "locked"
  | "settingsTitle"
  | "settingsSubtitle"
  | "calendarLink"
  | "chooseOne"
  | "chooseMany"
  | "sortInstruction"
  | "moveUp"
  | "moveDown"
  | "groupInstruction"
  | "selectGroup"
  | "assignAllOptions"
  | "enterAnswer"
  | "loginSuccess"
  | "loginFailed"
  | "logoutSuccess"
  | "sessionEnded"
  | "introLabel"
  | "introContinue"
  | "introCompleted"
  | "introRevisitHint"
  | "introStory"
  | "dayUnlocked";

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
    confirmVetToNormal: "You have solved as Veteran. Switching to Normal will lock you out of Veteran. Continue?",
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
    modeVetLabel: "Veteran",
    modeHint: "Upgrading to Veteran is locked after choosing Normal. Downgrades are always allowed.",
    selected: "Selected",
    locked: "Locked",
    settingsTitle: "Settings",
    settingsSubtitle: "Adjust your difficulty. You can downgrade from Veteran to Normal anytime.",
    calendarLink: "Calendar",
    chooseOne: "Select exactly one answer.",
    chooseMany: "Select one or more answers.",
    sortInstruction: "Arrange the options in the correct order.",
    moveUp: "Move up",
    moveDown: "Move down",
    groupInstruction: "Assign each option to a group.",
    selectGroup: "Select a group",
    assignAllOptions: "Please assign all options to a group.",
    enterAnswer: "Please enter an answer.",
    loginSuccess: "Logged in with Discord. Welcome!",
    loginFailed: "Login failed. Please try again.",
    logoutSuccess: "You have been logged out.",
    sessionEnded: "Your session ended. Please log in again.",
    introLabel: "Prologue",
    introContinue: "Continue to calendar",
    introCompleted: "Intro completed",
    introRevisitHint: "You can return here anytime to reread the prologue.",
    introStory: "Begin with the prologue and pick your difficulty.",
    dayUnlocked: "A new day has been unlocked!",
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
    confirmVetToNormal: "Du hast als Veteran gelöst. Beim Wechsel auf Normal ist Veteran gesperrt. Fortfahren?",
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
    modeVetLabel: "Veteran",
    modeHint: "Ein Upgrade auf Veteran ist gesperrt, nachdem du Normal gewählt hast. Herabstufen ist immer erlaubt.",
    selected: "Ausgewählt",
    locked: "Gesperrt",
    settingsTitle: "Einstellungen",
    settingsSubtitle: "Passe deine Schwierigkeit an. Von Veteran auf Normal kannst du jederzeit herabstufen.",
    calendarLink: "Kalender",
    chooseOne: "Wähle genau eine Antwort.",
    chooseMany: "Wähle eine oder mehrere Antworten.",
    sortInstruction: "Bringe die Optionen in die richtige Reihenfolge.",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    groupInstruction: "Ordne jede Option einer Gruppe zu.",
    selectGroup: "Gruppe auswählen",
    assignAllOptions: "Bitte ordne alle Optionen einer Gruppe zu.",
    enterAnswer: "Bitte gib eine Antwort ein.",
    loginSuccess: "Mit Discord eingeloggt. Willkommen!",
    loginFailed: "Login fehlgeschlagen. Bitte versuche es erneut.",
    logoutSuccess: "Du wurdest abgemeldet.",
    sessionEnded: "Deine Sitzung ist beendet. Bitte erneut einloggen.",
    introLabel: "Prolog",
    introContinue: "Weiter zum Kalender",
    introCompleted: "Einführung abgeschlossen",
    introRevisitHint: "Du kannst jederzeit hierher zurückkehren, um den Prolog erneut zu lesen.",
    introStory: "Starte mit dem Prolog und wähle deine Schwierigkeit.",
    dayUnlocked: "Ein neuer Tag wurde freigeschaltet!",
  },
};

interface I18nContextValue {
  locale: Locale;
  t: (key: TranslationKey) => string;
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
    const t = (key: TranslationKey) => translations[locale]?.[key] ?? translations.en[key];
    return { locale, t, setLocale };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
