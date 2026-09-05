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
index.html            markup della shell (header, viste, dock, fogli)
src/main.js           avvio, render, navigazione fra tappe, eventi
src/styles.css        tutto lo stile
src/state.js          stato condiviso + salvataggio in localStorage
src/data/steps.js     LE TAPPE: qui si aggiunge o modifica il viaggio
src/data/places.js    hotel, coordinate, prefisso Google Maps
src/icons.js          icone SVG inline
src/ui/step.js        vista Tappa (hero, checklist, note, piano B)
src/ui/map.js         vista Mappa (timeline con l'omino)
src/ui/spese.js       vista Spese
src/ui/sos.js         schermata Emergenza
src/ui/sheet.js       foglio Impostazioni e tema
src/ui/confetti.js    coriandoli a fine viaggio
src/ui/dom.js         helper: $, toast, bus eventi
src/audio/sfx.js      effetti sonori
src/audio/music.js    rumba catalana generativa
src/notify.js         avvisi 30 minuti prima + export ICS
src/radar.js          confronto posizione GPS / posizione prevista
scripts/icons.py      genera le icone PNG
```

## Aggiungere una tappa

Si tocca solo `src/data/steps.js`: un oggetto nell'array `STEPS`, in ordine cronologico. Il campo `geo` dice al radar dove dovresti essere: `{p: P.LUOGO}` se sei fermo, `{from, to, arr, dest}` se ti stai spostando. Le coordinate nuove vanno in `places.js`.

## Note su iPhone

- Gli avvisi 30 minuti prima funzionano solo ad app aperta. Per averli ad app chiusa usa "Salva nel calendario": apre il foglio di condivisione, scegli Calendario.
- La musica parte al primo tocco: iOS non permette audio automatico.
- Il radar chiede il permesso posizione alla prima apertura.
