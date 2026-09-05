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
src/icons.js          icone SVG inline
src/ui/oggi.js        pagina Oggi (tessera tappa, checklist a tessere, note, piano B)
src/ui/percorso.js    pagina Percorso (tappe per giorno)
src/ui/spese.js       pagina Spese
src/ui/sos.js         pagina Emergenza
src/ui/settings.js    pagina Impostazioni e tema
src/ui/confetti.js    coriandoli a fine viaggio
src/ui/dom.js         helper: $, toast, intestazione pagina, bus eventi
src/audio/sfx.js      effetti sonori
src/audio/music.js    rumba catalana generativa
src/notify.js         avvisi 30 minuti prima + export ICS
src/radar.js          confronto posizione GPS / posizione prevista
src/weather.js        meteo per tappa (Open-Meteo) e icone meteo vettoriali
scripts/icons.py      genera le icone PNG
```

## Aggiungere una tappa

Si tocca solo `src/data/steps.js`: un oggetto nell'array `STEPS`, in ordine cronologico. Il campo `geo` dice al radar dove dovresti essere: `{p: P.LUOGO}` se sei fermo, `{from, to, arr, dest}` se ti stai spostando. Le coordinate nuove vanno in `places.js`.

## Interfaccia

Cinque schede in basso: Oggi, Percorso, Spese, Radar, SOS. Le impostazioni si aprono dall'ingranaggio in alto a destra e sono una pagina, non un foglio sovrapposto. Nessun elemento galleggia sopra il contenuto mentre scorri. Per aprire una scheda direttamente: `?tab=spese`, e `&theme=light` per forzare il tema (comodo per i test).

## Meteo

Nella tessera Oggi compare la previsione per il luogo e l'ora della tappa: icona, condizione, temperatura a quell'ora, massima e minima del giorno. Per i giorni liberi una colonna per giorno. Fonte Open-Meteo, che combina i modelli dei servizi meteo nazionali (ECMWF, DWD ICON, Météo-France AROME); orizzonte 16 giorni, una sola richiesta per tutte le località, cache locale di un'ora che vale anche offline. Il luogo usato è quello di arrivo della tappa, o dove si sta fermi.

## Note su iPhone

- Gli avvisi 30 minuti prima funzionano solo ad app aperta. Per averli ad app chiusa usa "Salva nel calendario": apre il foglio di condivisione, scegli Calendario.
- La musica parte al primo tocco: iOS non permette audio automatico.
- Il radar chiede il permesso posizione alla prima apertura.
