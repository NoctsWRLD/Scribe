# Scribe

Scribe je sodobna spletna aplikacija, zasnovana za pomoč učencem in študentom pri organizaciji časa, predmetov, nalog ter komunikaciji z vrstniki. Razvita je z uporabo tehnologij **React**, **Vite**, **Tailwind CSS** (s svetlo vijolično-modro temo) ter **Firebase** za hrambo podatkov in varno avtentikacijo.

---

## 🚀 Glavne funkcionalnosti

*   **Avtentikacija**: Varna prijava in registracija uporabnikov z uporabo storitve Firebase Authentication.
*   **Nadzorna plošča (Dashboard)**: Hiter in celovit pregled trenutnih aktivnosti, prihajajočih obveznosti ter statistike učenja.
*   **Upravljanje predmetov (Subjects)**: Dodajanje in urejanje učnih predmetov za lažjo organizacijo gradiv in posameznih nalog.
*   **Naloge in zadolžitve (Tasks)**: Iskanje, filtriranje po predmetih, pregled rokov in napredka. Vsaka nova naloga je povezana s predmetom.
*   **Učni pregled**: Sledenje napredku po predmetih, rokih in opravljenih nalogah ter Pomodoro časovnik in učni namigi.
*   **Nastavitve**: Deset barvnih tem (šest temnih), možnosti dostopnosti, pregled napredka in izvoz profilnih podatkov, predmetov ter nalog.
*   **Urnik (Schedule)**: Planiranje učenja in enostaven pregled celotnega šolskega urnika.
*   **Klepet (Chat)**: Vgrajen sistem za pošiljanje sporočil med prijatelji v realnem času.
*   **Prijatelji (Friends)**: Dodajanje in upravljanje seznama prijateljev in sošolcev za lažje skupinsko učenje ter komunikacijo.
*   **Uporabniški profil (Profile)**: Urejanje osebnih nastavitev profila in personalizacija izkušnje prek animiranega menija računa.
*   **Slovenski datum in ura**: Datumi in ure se prikazujejo za časovni pas `Europe/Ljubljana`.

---

## 🛠️ Uporabljene tehnologije

Projekt je zgrajen z najnovejšimi orodji za zagotavljanje hitrosti, varnosti in vrhunske uporabniške izkušnje:

*   **[React 19](https://react.dev/)** - Temeljna knjižnica za postopajočo gradnjo uporabniških vmesnikov (UI).
*   **[Vite](https://vitejs.dev/)** - Izjemno hitro orodje za razvoj in gradnjo spletnih aplikacij.
*   **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS ogrodje za hitro implementacijo stilov, obogateno z nežno svetlo vijolično-modro temo.
*   **[Firebase](https://firebase.google.com/)** - Backend as a Service (BaaS) za upravljanje s podatkovno bazo (Firestore) v realnem času ter avtentikacijo.
*   **React Router Dom** - Upravljanje navigacije in zaščitenih poti (Protected Routes) znotraj in po aplikaciji.

---

## 📂 Struktura projekta

Ključne datoteke so organizirane znotraj `src` mape, in sicer:

*   `/src/pages` - Vsebuje glavne ekrane oziroma poglede aplikacije (npr. *LoginPage*, *RegisterPage*, *DashboardPage*, *ChatPage*, *TasksPage*, *SchedulePage*, itd.).
*   `/src/components` - Vsebuje ponovno uporabne (reusable) komponente (npr. *Modali*, *Kartice nalog/predmetov*, *Layout*, oznake).
*   `/src/contexts` - Vsebuje React kontekste (npr. *AuthContext* za globalno upravljanje s stanjem in podatki prijavljenega uporabnika).
*   `/src/hooks` - Vsebuje prilagojene in namensko napisane React hooks za lažjo enkapsulacijo logike.
*   `/src/utils` - Razne pomožne funkcije in orodja.

---

## 💻 Namestitev in zagon projekta lokalno

Če želite projekt zagnati in testirati na svojem računalniku, sledite tem korakom:

1.  **Odprite mapo aplikacije:**
    ```bash
    cd path/to/Scribe
    ```

2.  **Namestite odvisnosti:**
    S pomočjo pakirnega upravitelja npm namestite vse potrebne pakete:
    ```bash
    npm install
    ```

3.  **Nastavite Firebase:**
    V Firebase konzoli ustvarite Web app, omogočite prijavo z e-pošto in geslom ter nastavite Cloud Firestore. Kopirajte vzorec in vnesite konfiguracijo iz **Project settings → Your apps**:
    ```bash
    cp .env.example .env.local
    ```
    `.env.local` je lokalna datoteka in se ne pošilja v Git. Vrednosti v njej so konfiguracija brskalniške aplikacije, ne Firebase Admin ključ.

4.  **Namestite Firestore varnostna pravila pred prvo uporabo podatkov:**
    Namesti Firebase CLI, se prijavi in izberi svoj Firebase projekt. Nato iz mape aplikacije objavi pravila iz `firestore.rules`:
    ```bash
    firebase login
    firebase use --add
    firebase deploy --only firestore:rules
    ```
    Pravila ločijo zasebne uporabniške podatke od javnih profilov in omejujejo branje ter spreminjanje nalog, predmetov in sporočil na prijavljenega lastnika oziroma udeleženca klepeta.

5.  **Zaženite razvojni strežnik:**
    ```bash
    npm run dev
    ```

6.  **Odprite aplikacijo:**
    V svojem najljubšem brskalniku odprite povezavo, ki jo vrne Vite, običajno je to: `http://localhost:5173`.

---

## 📜 Razpoložljive NPM skripte

V datoteki `package.json` so na voljo naslednji ukazi za upravljanje s projektom:
*   `npm run dev` – Zažene lokalni strežnik za razvoj (razvojni način).
*   `npm run build` – Zgradi optimizirano produkcijsko različico aplikacije z Vite (odloži datoteke v mapo `dist`).
*   `npm run lint` – Aktivira ESLint za pregled kode in iskanje morebitnih napak pri sintaksi ali pravilih koda.
*   `npm run preview` – Zažene poglede in simulira način, kako bi testirali že postavljeno (zgrajeno) produkcijsko različico lokalno aplikacije znotraj `dist`.

## Varnostne opombe

* Preden uporabljaš aplikacijo z resničnimi uporabniki, objavi `firestore.rules` v Firebase projektu. Lokalna datoteka sama po sebi še ne spremeni pravil, ki so že nameščena v oblaku.
* E-poštni naslovi ostanejo v zasebni zbirki `users`; iskanje prijateljev bere samo `publicProfiles`.
* Firebase Web API ključ je v brskalniku viden. Omeji ga na Firebase API-je in pravilno domeno v Google Cloud Console; dostop do podatkov uveljavljajo Firestore pravila.
* Sporočila v kanalih `general`, `subject_*` in `school_*` so vidna vsem prijavljenim uporabnikom. Zasebni klepeti so omejeni na UID-ja, zapisana v ID-ju klepeta.

### Pregled varnosti · 8. 10. 2026

Opravljen je bil statični pregled prijave, odjemalske kode, pravil Firestore, konfiguracije Vercel in odvisnosti.

* Pravila Firestore omejujejo zasebne profile, predmete in naloge na njihovega lastnika. Zbirka `publicProfiles` je dostopna prijavljenim uporabnikom in vsebuje samo prikazne podatke.
* Kanali `general`, `subject_*` in `school_*` so po trenutnih pravilih skupni vsem prijavljenim uporabnikom. V njih ne shranjuj zasebnih šolskih ali osebnih podatkov. Če mora biti `school_*` omejen na uporabnike iste šole, je treba preverjanje dodati v Firestore pravila.
* Sporočila in prošnje za prijateljstvo nimajo strežniške omejitve pogostosti; prijavljen uporabnik jih lahko pošilja večkrat. Za produkcijsko uporabo je treba razmisliti o Firebase App Check in strežniški omejitvi zlorab.
* Pravila za priponke sprejmejo poljubne povezave HTTPS. Z njimi ravnaj kot z zunanjimi, nezaupanja vrednimi povezavami.
* `vercel.json` trenutno ne nastavlja varnostnih HTTP-glav, kot sta Content Security Policy in zaščita pred vdelavo strani.
* `npm run lint` in `npm run build` sta uspela. `npm audit --offline` ni vrnil znanih ranljivosti v lokalno dostopnih podatkih; najnovejše zbirke zaradi nedosegljivega omrežja ni bilo mogoče preveriti. Firebase Emulator ni bil na voljo, zato pravila niso bila dinamično preizkušena z ločenimi računi.
