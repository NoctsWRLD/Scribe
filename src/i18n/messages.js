import { DEFAULT_LOCALE, LOCALES, getLocale } from './locales.js';
import appMessages from './messages.app.js';

/**
 * Translations.
 *
 * The key is the Slovenian sentence, so a screen that has not been migrated
 * yet (or a string that was added after the last translation pass) renders
 * Slovenian instead of a raw identifier.
 *
 * The value is a row of four columns, in this order:
 *   [English, German, Italian, Croatian]
 *
 * A missing column is `''` and falls back to English, then to the key.
 * `src/i18n/messages.test.js` checks that English covers every `t()` call in
 * the source tree.
 */
const messages = {
  /* ── Navigation and shell ─────────────────────────────────────────────── */
  'Učenje': ['Study', 'Lernen', 'Studio', 'Učenje'],
  'Skupnost': ['Community', 'Gemeinschaft', 'Comunità', 'Zajednica'],
  'Domov': ['Home', 'Start', 'Home', 'Početna'],
  'Naloge': ['Tasks', 'Aufgaben', 'Compiti', 'Zadaci'],
  'Preverjanja': ['Tests', 'Prüfungen', 'Verifiche', 'Provjere'],
  'Kartice': ['Flashcards', 'Karteikarten', 'Flashcard', 'Kartice'],
  'Urnik': ['Timetable', 'Stundenplan', 'Orario', 'Raspored'],
  'Predmeti': ['Subjects', 'Fächer', 'Materie', 'Predmeti'],
  'Klepet': ['Chat', 'Chat', 'Chat', 'Razgovor'],
  'Prijatelji': ['Friends', 'Freunde', 'Amici', 'Prijatelji'],
  'Moj profil': ['My profile', 'Mein Profil', 'Il mio profilo', 'Moj profil'],
  'Nastavitve': ['Settings', 'Einstellungen', 'Impostazioni', 'Postavke'],
  'Pregled dneva': ['Today at a glance', 'Der Tag im Blick', 'Il giorno in breve', 'Pregled dana'],
  'Roki in kljukice': ['Deadlines and checkmarks', 'Fristen und Haken', 'Scadenze e spunte', 'Rokovi i kvačice'],
  'Odštevanje do testov': ['Countdown to tests', 'Countdown bis zur Prüfung', 'Conto alla rovescia', 'Odbrojavanje do provjera'],
  'Ponovi snov': ['Review the material', 'Stoff wiederholen', 'Ripassa', 'Ponovi gradivo'],
  'Teden po dnevih': ['The week, day by day', 'Die Woche, Tag für Tag', 'La settimana, giorno per giorno', 'Tjedan po danima'],
  'Tvoji predmeti': ['Your subjects', 'Deine Fächer', 'Le tue materie', 'Tvoji predmeti'],
  'Kanali in pogovori': ['Channels and conversations', 'Kanäle und Gespräche', 'Canali e conversazioni', 'Kanali i razgovori'],
  'Sošolci in vabila': ['Classmates and invitations', 'Mitschüler und Einladungen', 'Compagni e inviti', 'Školske kolege i pozivi'],
  'Nova naloga': ['New task', 'Neue Aufgabe', 'Nuovo compito', 'Novi zadatak'],
  'Glavna navigacija': ['Main navigation', 'Hauptnavigation', 'Navigazione principale', 'Glavna navigacija'],
  'Odpri meni': ['Open menu', 'Menü öffnen', 'Apri il menu', 'Otvori izbornik'],
  'Zapri meni': ['Close menu', 'Menü schließen', 'Chiudi il menu', 'Zatvori izbornik'],
  'Meni': ['Menu', 'Menü', 'Menu', 'Izbornik'],
  'Odjava': ['Sign out', 'Abmelden', 'Esci', 'Odjava'],
  'Preskoči na vsebino': ['Skip to content', 'Zum Inhalt springen', 'Vai al contenuto', 'Preskoči na sadržaj'],
  'Scribe domov': ['Scribe home', 'Scribe Startseite', 'Scribe home', 'Scribe početna'],
  'Profil in nastavitve': ['Profile and settings', 'Profil und Einstellungen', 'Profilo e impostazioni', 'Profil i postavke'],
  'Preklopi na temni videz': ['Switch to the dark look', 'Zum dunklen Erscheinungsbild', 'Passa al tema scuro', 'Prebaci na tamni izgled'],
  'Preklopi na svetli videz': ['Switch to the light look', 'Zum hellen Erscheinungsbild', 'Passa al tema chiaro', 'Prebaci na svijetli izgled'],
  'Jezik': ['Language', 'Sprache', 'Lingua', 'Jezik'],
  'Izberi jezik': ['Choose a language', 'Sprache wählen', 'Scegli la lingua', 'Odaberi jezik'],

  /* ── Landing ──────────────────────────────────────────────────────────── */
  'Ustvari račun': ['Create account', 'Konto erstellen', 'Crea un account', 'Stvori račun'],
  'Prijava': ['Sign in', 'Anmelden', 'Accedi', 'Prijava'],
  'Danes': ['Today', 'Heute', 'Oggi', 'Danas'],
  'Učni pas tedna': ['Study rail for the week', 'Lernleiste der Woche', 'Binario di studio della settimana', 'Traka učenja za tjedan'],
  'Vprašanja': ['Questions', 'Fragen', 'Domande', 'Pitanja'],

  /* ── Authentication ───────────────────────────────────────────────────── */
  'E-pošta': ['Email', 'E-Mail', 'Email', 'E-pošta'],
  'Geslo': ['Password', 'Passwort', 'Password', 'Lozinka'],
  'Prijavljam…': ['Signing in…', 'Anmelden…', 'Accesso…', 'Prijava…'],
  'Še nimaš računa?': ['No account yet?', 'Noch kein Konto?', 'Non hai un account?', 'Još nemaš račun?'],
  'Ime': ['Name', 'Name', 'Nome', 'Ime'],
  'Ponovi geslo': ['Repeat password', 'Passwort wiederholen', 'Ripeti la password', 'Ponovi lozinku'],
  'Ustvarjam…': ['Creating…', 'Erstelle…', 'Creazione…', 'Stvaram…'],
  'Gesli se ne ujemata.': ['The passwords do not match.', 'Die Passwörter stimmen nicht überein.', 'Le password non coincidono.', 'Lozinke se ne podudaraju.'],
  'Ta e-pošta je že v uporabi.': ['That email is already in use.', 'Diese E-Mail wird bereits verwendet.', 'Questa email è già in uso.', 'Taj je e-mail već u upotrebi.'],
  'Registracija ni uspela. Preveri podatke in poskusi znova.': [
    'Registration failed. Check your details and try again.',
    'Registrierung fehlgeschlagen. Prüfe deine Angaben und versuch es erneut.',
    'Registrazione non riuscita. Controlla i dati e riprova.',
    'Registracija nije uspjela. Provjeri podatke i pokušaj ponovno.',
  ],
  'Že imaš račun?': ['Already have an account?', 'Schon ein Konto?', 'Hai già un account?', 'Već imaš račun?'],

  /* ── Dashboard and tasks ──────────────────────────────────────────────── */
  'Dobro jutro': ['Good morning', 'Guten Morgen', 'Buongiorno', 'Dobro jutro'],
  'Dober dan': ['Good afternoon', 'Guten Tag', 'Buongiorno', 'Dobar dan'],
  'Dober večer': ['Good evening', 'Guten Abend', 'Buonasera', 'Dobra večer'],
  'učenec': ['student', 'Schüler', 'studente', 'učenik'],
  'Nič odprtega. Dodaj naslednjo stvar ali ponovi kartice.': [
    'Nothing open. Add the next thing or review your cards.',
    'Nichts offen. Füge das Nächste hinzu oder wiederhole die Karten.',
    'Niente in sospeso. Aggiungi la prossima cosa o ripassa le carte.',
    'Ništa otvoreno. Dodaj sljedeće ili ponovi kartice.',
  ],
  'Ponovi kartice': ['Review cards', 'Karten wiederholen', 'Ripassa le carte', 'Ponovi kartice'],
  'Pregled napredka': ['Progress at a glance', 'Fortschritt im Blick', 'Panoramica dei progressi', 'Pregled napretka'],
  'odprtih nalog': ['open tasks', 'offene Aufgaben', 'compiti aperti', 'otvorenih zadataka'],
  'zapade danes': ['due today', 'heute fällig', 'in scadenza oggi', 'dospijeva danas'],
  'zamujenih': ['overdue', 'überfällig', 'in ritardo', 'zakašnjelih'],
  'narejeno': ['done', 'erledigt', 'fatto', 'napravljeno'],
  'Naslednje naloge': ['Next tasks', 'Nächste Aufgaben', 'Prossimi compiti', 'Sljedeći zadaci'],
  'Vse naloge': ['All tasks', 'Alle Aufgaben', 'Tutti i compiti', 'Svi zadaci'],
  'Prazno. In to je v redu.': ['Empty. And that is fine.', 'Leer. Und das ist gut.', 'Vuoto. E va bene.', 'Prazno. I to je u redu.'],
  'Dodaj prvo nalogo za ta teden ali ponovi kartice.': [
    'Add the first task for this week, or review your cards.',
    'Füge die erste Aufgabe für diese Woche hinzu oder wiederhole die Karten.',
    'Aggiungi il primo compito della settimana o ripassa le carte.',
    'Dodaj prvi zadatak za ovaj tjedan ili ponovi kartice.',
  ],
  'Dodaj nalogo': ['Add task', 'Aufgabe hinzufügen', 'Aggiungi compito', 'Dodaj zadatak'],
  'Uredi': ['Edit', 'Bearbeiten', 'Modifica', 'Uredi'],
  'Dodaj prvi predmet': ['Add the first subject', 'Erstes Fach hinzufügen', 'Aggiungi la prima materia', 'Dodaj prvi predmet'],
  'Dodaj prvi predmet, da razvrstiš naloge, preverjanja in kartice.': [
    'Add the first subject so tasks, tests and cards have a place.',
    'Füge das erste Fach hinzu, damit Aufgaben, Prüfungen und Karten einen Platz haben.',
    'Aggiungi la prima materia per dare un posto a compiti, verifiche e carte.',
    'Dodaj prvi predmet da zadaci, provjere i kartice imaju mjesto.',
  ],
  'Odpri predmete': ['Open subjects', 'Fächer öffnen', 'Apri le materie', 'Otvori predmete'],
  'opravljeno': ['completed', 'erledigt', 'completato', 'završeno'],
  'Poišči nalogo': ['Find a task', 'Aufgabe suchen', 'Trova un compito', 'Nađi zadatak'],
  'Poišči nalogo…': ['Find a task…', 'Aufgabe suchen…', 'Trova un compito…', 'Nađi zadatak…'],
  'Filtriraj po predmetu': ['Filter by subject', 'Nach Fach filtern', 'Filtra per materia', 'Filtriraj po predmetu'],
  'Vsi predmeti': ['All subjects', 'Alle Fächer', 'Tutte le materie', 'Svi predmeti'],
  'Razvrsti naloge': ['Sort tasks', 'Aufgaben sortieren', 'Ordina i compiti', 'Razvrstaj zadatke'],
  'Po roku': ['By deadline', 'Nach Frist', 'Per scadenza', 'Po roku'],
  'Najnovejše': ['Newest', 'Neueste', 'Più recenti', 'Najnovije'],
  'Izberi vse': ['Select all', 'Alle auswählen', 'Seleziona tutto', 'Odaberi sve'],
  'Ni zadetkov': ['No matches', 'Keine Treffer', 'Nessun risultato', 'Nema rezultata'],
  'Še ni opravljenih nalog': ['No completed tasks yet', 'Noch keine erledigten Aufgaben', 'Nessun compito completato', 'Još nema završenih zadataka'],
  'Vse je urejeno': ['Everything is clear', 'Alles erledigt', 'Tutto in ordine', 'Sve je riješeno'],
  'Vse naloge so opravljene. Vzemi si zaslužen odmor.': [
    'Every task is done. Take the break you earned.',
    'Alle Aufgaben sind erledigt. Nimm dir die Pause, die du verdient hast.',
    'Tutti i compiti sono fatti. Prenditi la pausa che ti meriti.',
    'Svi su zadaci završeni. Uzmi zasluženi odmor.',
  ],
  'Dodaj novo nalogo in jo razdeli na majhen, izvedljiv korak.': [
    'Add a new task and split it into one small, doable step.',
    'Füge eine neue Aufgabe hinzu und teile sie in einen kleinen, machbaren Schritt.',
    'Aggiungi un compito e dividilo in un passo piccolo e fattibile.',
    'Dodaj novi zadatak i podijeli ga na mali, izvedivi korak.',
  ],
  'Ustvari predmet': ['Create subject', 'Fach anlegen', 'Crea materia', 'Stvori predmet'],

  /* ── Shared ───────────────────────────────────────────────────────────── */
  'Poskusi znova': ['Try again', 'Erneut versuchen', 'Riprova', 'Pokušaj ponovno'],
  'Zapri': ['Close', 'Schließen', 'Chiudi', 'Zatvori'],
  'Prekliči': ['Cancel', 'Abbrechen', 'Annulla', 'Odustani'],
  'Izbriši': ['Delete', 'Löschen', 'Elimina', 'Izbriši'],
  'Shranjevanje ni uspelo. Preveri povezavo in poskusi znova.': [
    'Saving failed. Check the connection and try again.',
    'Speichern fehlgeschlagen. Prüfe die Verbindung und versuch es erneut.',
    'Salvataggio non riuscito. Controlla la connessione e riprova.',
    'Spremanje nije uspjelo. Provjeri vezu i pokušaj ponovno.',
  ],
  'Pozdravljeni, {name}': ['Hello, {name}', 'Hallo, {name}', 'Ciao, {name}', 'Pozdravljeni, {name}'],

  /* ── Page sections and calls to action ────────────────────────────────── */
  'Ustvari': ['Create', 'Erstellen', 'Crea', 'Stvori'],
  'Prijavi se v svoj Scribe račun.': [
    'Sign in to your Scribe account.',
    'Melde dich in deinem Scribe-Konto an.',
    'Accedi al tuo account Scribe.',
    'Prijavi se u svoj Scribe račun.',
  ],
  'Ustvari Scribe račun in dodaj prvega predmeta.': [
    'Create a Scribe account and add your first subject.',
    'Erstelle ein Scribe-Konto und füge dein erstes Fach hinzu.',
    'Crea un account Scribe e aggiungi la prima materia.',
    'Stvori Scribe račun i dodaj prvi predmet.',
  ],
  'Pravni dokumenti so objavljeni v slovenščini.': [
    'The legal documents are published in Slovenian.',
    'Die rechtlichen Dokumente sind auf Slowenisch veröffentlicht.',
    'I documenti legali sono pubblicati in sloveno.',
    'Pravni dokumenti objavljeni su na slovenskom.',
  ],
  'Geslo naj ima vsaj 10 znakov.': ['Use at least 10 characters.', 'Mindestens 10 Zeichen.', 'Almeno 10 caratteri.', 'Najmanje 10 znakova.'],

  /* ── Tasks, dates and bulk actions ────────────────────────────────────── */
  'Zamujeno {date}': ['Overdue {date}', 'Überfällig {date}', 'In ritardo {date}', 'Zakašnjelo {date}'],
  'Jutri': ['Tomorrow', 'Morgen', 'Domani', 'Sutra'],
  'Uredi nalogo {title}': ['Edit task {title}', 'Aufgabe {title} bearbeiten', 'Modifica il compito {title}', 'Uredi zadatak {title}'],
  'Izbriši nalogo {title}': ['Delete task {title}', 'Aufgabe {title} löschen', 'Elimina il compito {title}', 'Izbriši zadatak {title}'],
  'Izbrišem nalogo »{title}«?': [
    'Delete the task “{title}”?',
    'Aufgabe „{title}“ löschen?',
    'Eliminare il compito «{title}»?',
    'Izbrisati zadatak „{title}“?',
  ],
  'Izbrišem {count}?': ['Delete {count}?', '{count} löschen?', 'Eliminare {count}?', 'Izbrisati {count}?'],
  'Seznam nalog': ['Task list', 'Aufgabenliste', 'Elenco dei compiti', 'Popis zadataka'],
  'Napredek pri predmetu {name}': ['Progress in {name}', 'Fortschritt in {name}', 'Progresso in {name}', 'Napredak u predmetu {name}'],
  'Poskusi drug izraz za »{search}«.': [
    'Try a different term for “{search}”.',
    'Versuche einen anderen Begriff für „{search}“.',
    'Prova un altro termine per «{search}».',
    'Pokušaj drugi izraz za „{search}“.',
  ],

  /* ── Counted nouns, one row per Slovenian form ────────────────────────── */
  'odprta naloga': ['open task', 'offene Aufgabe', 'compito aperto', 'otvoreni zadatak'],
  'odprti nalogi': ['open tasks', 'offene Aufgaben', 'compiti aperti', 'otvorena zadatka'],
  'odprte naloge': ['open tasks', 'offene Aufgaben', 'compiti aperti', 'otvorena zadatka'],
  'naloga': ['task', 'Aufgabe', 'compito', 'zadatak'],
  'nalogi': ['tasks', 'Aufgaben', 'compiti', 'zadatka'],
  'naloge': ['tasks', 'Aufgaben', 'compiti', 'zadatka'],
  'nalog': ['tasks', 'Aufgaben', 'compiti', 'zadataka'],
  'nalogo': ['task', 'Aufgabe', 'compito', 'zadatak'],
  'kartica': ['card', 'Karte', 'carta', 'kartica'],
  'kartici': ['cards', 'Karten', 'carte', 'kartice'],
  'kartice': ['cards', 'Karten', 'carte', 'kartice'],
  'kartic': ['cards', 'Karten', 'carte', 'kartica'],
};

// The second dictionary must only add keys; a silent override would make a
// translation change in one file disappear because of the other.
for (const key of Object.keys(appMessages)) {
  if (Object.prototype.hasOwnProperty.call(messages, key)) {
    throw new Error(`Translation key defined twice: ${key}`);
  }
  messages[key] = appMessages[key];
}

const values = Object.entries(messages);
for (const [key, row] of values) {
  if (!Array.isArray(row) || row.length !== 4) {
    throw new Error(`Every translation row must have four columns: ${key}`);
  }
}

const column = (locale) => {
  if (locale === DEFAULT_LOCALE) return -1;
  const index = LOCALES.findIndex((item) => item.id === locale) - 1;
  return index >= 0 ? index : -1;
};

/** `{name}` placeholders, filled from a plain object. */
export function interpolate(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

/**
 * Translate one key. Locale → English → Slovenian source.
 */
export function translate(locale, key, params) {
  const row = messages[key];
  // A key the dictionary does not know is already human-readable Slovenian;
  // return it untouched so placeholders in unknown strings stay visible.
  if (!row) return key;
  // The key is the Slovenian sentence, so the default locale needs no lookup.
  if (locale === DEFAULT_LOCALE) return interpolate(key, params);
  const index = column(locale);
  const text = index >= 0 && row[index] ? row[index] : row[0];
  return text ? interpolate(text, params) : key;
}

export function hasTranslation(key) {
  return Object.prototype.hasOwnProperty.call(messages, key);
}

export function englishMissing(keys) {
  return keys.filter((key) => !messages[key] || !messages[key][0]);
}

export function translatedCount(locale) {
  const index = column(locale);
  if (index < 0) return 0;
  return Object.values(messages).filter((row) => Boolean(row[index])).length;
}

export const MESSAGE_COUNT = values.length;

export const localeTag = (locale) => getLocale(locale).tag;

export { messages };
export default messages;
