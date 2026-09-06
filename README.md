# BarceTrip

Compagno di viaggio per Barcellona, 15-20 settembre 2026. Web app installabile su iPhone (PWA), funziona anche offline.

## Comandi

```bash
npm install        # una volta sola
npm run dev        # sviluppo, apre un server locale (anche da iPhone sulla stessa rete)
npm run build      # produce la cartella dist/ da pubblicare
npm run preview    # prova la build come sarà online
python3 scripts/icons.py   # rigenera le icone in public/
```

## Pubblicare su Netlify

Opzione A, trascina la cartella `dist/` su https://app.netlify.com/drop (come facevi con lo zip, ma va caricato `dist/`, non il progetto).

Opzione B, consigliata: metti il progetto su GitHub e collega il repository a Netlify. `netlify.toml` contiene già comando di build e cartella di pubblicazione: ogni push pubblica da solo.

Dopo la pubblicazione, su iPhone: Safari, Condividi, "Aggiungi alla schermata Home". Da lì in poi si apre a schermo intero, con l'icona giusta, e resta disponibile senza rete.

## Struttura

```
index.html            shell: sei pagine vuote e la tab bar
src/main.js           avvio, schede, navigazione fra tappe, impostazioni
src/styles.css        tutto lo stile (tema ispirato a Bring!)
src/state.js          stato condiviso + salvataggio in localStorage
src/data/steps.js     LE TAPPE: qui si aggiunge o modifica il viaggio
src/data/places.js    hotel, coordinate, prefisso Google Maps
src/data/valigia.js   oggetti predefiniti della valigia
src/icons.js          icone SVG inline
src/ui/oggi.js        pagina Oggi (tessera tappa, checklist a tessere, note, piano B)
src/ui/percorso.js    pagina Percorso (tappe per giorno)
src/ui/spese.js       pagina Spese
src/ui/sos.js         pagina Emergenza
src/ui/settings.js    pagina Impostazioni e tema
src/ui/valigia.js     pagina Valigia (tessere spuntabili, andata e ritorno)
src/ui/documenti.js   pagina Documenti (file salvati solo sul telefono, IndexedDB)
src/ui/confetti.js    coriandoli a fine viaggio
src/ui/dom.js         helper: $, toast, intestazione pagina, bus eventi
src/audio/sfx.js      effetti sonori
src/audio/music.js    rumba catalana generativa
src/notify.js         avvisi 30 minuti prima + export ICS
src/ui/luoghi.js      pagina Luoghi (mappa 3D MapLibre, percorsi a piedi o in metro)
src/data/luoghi.js    luoghi e fontanelle
src/weather.js        meteo per tappa (Open-Meteo) e icone meteo vettoriali
scripts/icons.py      genera le icone PNG
```

## Aggiungere una tappa

Si tocca solo `src/data/steps.js`: un oggetto nell'array `STEPS`, in ordine cronologico. Il campo `geo` dice dove sei in quella tappa (serve al meteo): `{p: P.LUOGO}` se sei fermo, `{from, to, arr, dest}` se ti stai spostando. Le coordinate nuove vanno in `places.js`. `pack: "out"` (partenza) o `pack: "back"` (check-out) fa comparire in cima a Oggi la striscia della valigia.

## Interfaccia

Cinque schede in basso: Oggi, Percorso, Spese, Luoghi, SOS. Le impostazioni si aprono dall'ingranaggio in alto a destra e sono una pagina, non un foglio sovrapposto. Nessun elemento galleggia sopra il contenuto mentre scorri. Per aprire una scheda direttamente: `?tab=spese` (anche `valigia`), e `&theme=light` per forzare il tema (comodo per i test).

## Valigia

Tessere spuntabili come quelle di Oggi, divise per categoria. Gli oggetti predefiniti stanno in `src/data/valigia.js`; quelli aggiunti dall'app, quelli tolti con "Togli oggetti" e le spunte restano salvati sul telefono. Il selettore Andata/Ritorno azzera le spunte per rifare la valigia al ritorno senza dimenticare nulla: in Ritorno compare anche la categoria "In camera, prima di uscire". La striscia in cima a Oggi appare alla partenza e ai due check-out; dalle impostazioni la pagina si apre sempre. Il bagaglio è solo l'oggetto personale sotto il sedile, 40×30×20 cm, su entrambi i voli.

## Luoghi

Mappa 3D interattiva con l'hotel al centro: MapLibre GL con le mappe vettoriali di OpenFreeMap (gratuite, senza chiave), rilievo del terreno dagli AWS Terrain Tiles ed edifici estrusi. Pinch per zoomare, due dita per ruotare e inclinare, tasto 3D/2D e tasto per tornare all'hotel. Sopra ci sono i tuoi posti, i luoghi da vedere e le fontanelle pubbliche entro 1,4 km (OpenStreetMap), più il tuo punto GPS con il controllo di MapLibre. I luoghi stanno in `src/data/luoghi.js`. Toccando un luogo l'app stima il modo più comodo per arrivarci da dove sei (a piedi, in metro da Sants, o con i mezzi), scarica il percorso pedonale reale da OSRM e lo disegna, e apre Google Maps con le indicazioni. Stella per "da vedere", spunta per "fatto". La mappa ha bisogno della rete: le tessere già viste restano in cache un mese, l'elenco e le stime funzionano anche offline.

## Documenti

Biglietti, carte d'imbarco, verbali: si aggiungono dal telefono (PDF o immagini) e restano in IndexedDB sul dispositivo, senza passare da nessun server. I PDF vengono convertiti in immagini delle pagine con PDF.js al momento dell'aggiunta (caricato solo allora), perché su iPhone un PDF incorporato non si adatta allo schermo; il visualizzatore mostra le pagine a tutto schermo, con zoom a pulsanti e doppio tocco, anche senza rete, e il file originale si può condividere con il foglio di condivisione. Nessun documento personale va messo nel progetto: l'app è pubblicata, tutto ciò che sta in `dist/` è scaricabile da chiunque. Su iPhone i dati restano finché l'app è sulla schermata Home. La pagina si apre dalle impostazioni e dal tasto "Documenti" nelle tappe che lo prevedono (`docs: true`).

## Meteo

Nella tessera Oggi compare la previsione per il luogo e l'ora della tappa: icona, condizione, temperatura a quell'ora, massima e minima del giorno. Per i giorni liberi una colonna per giorno. Fonte Open-Meteo, che combina i modelli dei servizi meteo nazionali (ECMWF, DWD ICON, Météo-France AROME); orizzonte 16 giorni, una sola richiesta per tutte le località, cache locale di un'ora che vale anche offline. Il luogo usato è quello di arrivo della tappa, o dove si sta fermi.

## Note su iPhone

- Gli avvisi 30 minuti prima funzionano solo ad app aperta. Per averli ad app chiusa usa "Salva nel calendario": apre il foglio di condivisione, scegli Calendario.
- La musica parte al primo tocco: iOS non permette audio automatico.
- I file della sezione Documenti stanno in IndexedDB: Safari li conserva senza limiti di tempo solo per le app aggiunte alla schermata Home.
- La scheda Luoghi chiede il permesso posizione alla prima apertura: serve solo per le distanze e il pallino "Tu".
