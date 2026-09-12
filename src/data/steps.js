import { G, ABBA, RIV, KIP, P } from './places.js';

/*
 Ogni tappa:
  at     ISO locale o null (giorni liberi)      mode   rail | air | stay | road | free
  facts  coppie [etichetta, valore]              ready  checklist "da avere in mano"
  notes  "da sapere" (warn = indice della nota da evidenziare)
  planB  cosa fare se va storto                  docs   mostra il tasto Documenti nella tessera
  geo    luogo della tappa (usato dal meteo): {p} se si sta fermi, {from,to,arr,dest} se ci si sposta
  pack   striscia Valigia in cima a Oggi: "out" alla partenza, "back" ai check-out
*/
export const STEPS = [
 {geo:{from:P.HOME,to:P.SIB,arr:'2026-09-15T06:05',dest:'Stazione di Sibari'},at:"2026-09-15T05:45",day:"Martedì 15 settembre",city:"Sibari",mode:"road",time:"05:45",title:"Partenza da casa",pack:"out",place:"Verso la stazione di Sibari",det:"Ti accompagnano · in banchina entro le 06:05",nav:G+"Stazione+di+Sibari&travelmode=driving",
  ready:["Carta d'identità","Biglietti nell'app Trenitalia","Pillole nel bagaglio a mano","Powerbank"],
  notes:["Il treno non aspetta: alle 06:05 in banchina, non nel piazzale.","Controlla di avere la carta d'identità e non solo la patente: in aeroporto la patente non basta."],
  planB:"Se perdi il treno, fatti portare a Paola: dalla linea tirrenica passano molti più treni per Roma e hai ancora 4 ore di margine sul volo."},
 {geo:{from:P.SIB,to:P.ROMA,arr:'2026-09-15T10:35',dest:'Roma Termini'},at:"2026-09-15T06:19",day:"Martedì 15 settembre",city:"Sibari → Roma",mode:"rail",time:"06:19",title:"Frecciarossa",code:"FR 8509",docs:true,place:"Sibari → Roma Termini",det:"4h 16min · arrivo 10:35 · carrozza 7, posto 1A · PNR SJMTUN",
  facts:[["PNR","SJMTUN"],["Carrozza","7"],["Posto","1A"],["Arrivo","10:35"]],ready:["QR del biglietto per il controllo a bordo","Documento"],
  notes:["Tariffa Super Economy: non modificabile né rimborsabile.","Fermate: Torano, Paola, Scalea, Salerno, Napoli Afragola. Orari come sul biglietto: 06:19 da Sibari, 10:35 a Roma.","Colazione portata da casa: il bar apre tardi."],
  planB:"Con ritardi fino a 2 ore prendi comunque il volo delle 15:30. Oltre, apri l'app Vueling e guarda i voli successivi: ce ne sono fino a sera."},
 {geo:{p:P.ROMA},at:"2026-09-15T10:35",day:"Martedì 15 settembre",city:"Roma",mode:"rail",time:"10:35",title:"Arrivo a Roma Termini",place:"Vai ai binari 23-24",det:"Leonardo Express ogni 15 min · 14 €",
  ready:["14 € per il Leonardo Express (app Trenitalia o macchinette)"],
  notes:["I binari 23-24 sono in fondo alla stazione, lato Via Giolitti: 5-8 minuti a piedi dai binari dei Frecciarossa.","Conserva il biglietto anche dopo la convalida: serve per uscire dai tornelli a Fiumicino."]},
 {geo:{from:P.ROMA,to:P.FCO,arr:'2026-09-15T11:35',dest:'Fiumicino'},at:"2026-09-15T11:00",day:"Martedì 15 settembre",city:"Roma → Fiumicino",mode:"rail",time:"11:00",title:"Leonardo Express",place:"Roma Termini → Fiumicino",det:"32 min senza fermate · arriva al Terminal 3",
  facts:[["Durata","32 min"],["Arrivo","11:35"]],notes:["Arriva alla stazione collegata al Terminal 3. Il T1 di Vueling è a 5 minuti a piedi seguendo i cartelli."]},
 {geo:{p:P.FCO},at:"2026-09-15T11:35",day:"Martedì 15 settembre",city:"Fiumicino",mode:"air",time:"11:35",title:"Attesa a Fiumicino",place:"Terminal 1, partenze Vueling",det:"Quasi 4 ore di margine · check-in online Vueling",
  ready:["Carta d'imbarco Vueling nell'app","Documento","Liquidi nella busta trasparente da 1 litro"],
  notes:["Se il check-in online non l'hai fatto, fallo adesso dall'app: al banco si paga.","Riempi la borraccia dopo i controlli.","Mangia qui: sul volo si paga tutto."]},
 {geo:{from:P.FCO,to:P.BCNP,arr:'2026-09-15T17:25',dest:'Barcellona El Prat'},at:"2026-09-15T15:30",day:"Martedì 15 settembre",city:"Fiumicino → Barcellona",mode:"air",time:"15:30",title:"Vueling",code:"VY 6109",docs:true,place:"Fiumicino T1 → Barcelona El Prat",det:"1h 55min · arrivo 17:25 · PNR ZWV6HN",
  facts:[["PNR","ZWV6HN"],["Al gate entro","14:50"],["Arrivo","17:25"],["Terminal","T1"]],ready:["Carta d'imbarco","Documento"],
  notes:["Tariffa base: solo l'oggetto personale sotto il sedile.","Presentati al gate entro le 14:50, 40 minuti prima come chiede la carta d'imbarco: chiude alle 15:10, 20 minuti prima del decollo."],
  planB:"Se il volo ritarda non hai vincoli a valle: la reception dell'hotel è aperta 24 ore."},
 {geo:{from:P.BCNP,to:P.ABBAP,arr:'2026-09-15T18:50',dest:'Abba Sants Hotel'},at:"2026-09-15T17:25",day:"Martedì 15 settembre",city:"Barcellona",mode:"road",time:"17:25",title:"Atterraggio a Barcellona",place:"Terminal 1 → hotel, metro L9 Sud e L5",det:"Metro L9 Sud dal T1 fino a Collblanc, poi L5 fino a Sants Estació · 5,90 € · in hotel verso le 18:50",nav:G+encodeURIComponent(ABBA.addr)+"&travelmode=transit",
  ready:["Bitllet Aeroport da 5,90 € alle macchinette del T1","Indirizzo dell'hotel per il taxi: Carrer de Numància 32"],
  notes:["Metro L9 Sud, stazione al piano 0 del T1: treni ogni 7 minuti, scendi a Collblanc dopo meno di mezz'ora. Lì cambi sulla L5 direzione Vall d'Hebron, tre fermate fino a Sants Estació, poi cinque minuti a piedi risalendo Carrer de Numància.","Alle stazioni dell'aeroporto serve il Bitllet Aeroport da 5,90 €: la T-casual e il biglietto singolo lì non valgono. Copre tutto il viaggio, cambio compreso.","Esci dal T1 verso le 18: volo Schengen, niente controllo passaporti, e senza bagaglio da ritirare. In hotel sei verso le 18:50.","L'Aerobús A1 porta a Plaça d'Espanya, 7,45 €: da lì sono ancora due fermate di L3 o un quarto d'ora a piedi. La metro dal T1 è più diretta e costa meno.","Il taxi, circa 30-35 € fino a Sants, serve solo se il volo ritarda parecchio o sei troppo stanco.","Stessa ora dell'Italia: non toccare l'orologio."],warn:1,
  planB:"Se la L9 è ferma, Aerobús A1 fino a Plaça d'Espanya e poi L3 direzione Zona Universitària, due fermate, Sants Estació. Stasera non hai orari da rispettare: la reception è aperta 24 ore e il locker pure."},
 {geo:{p:P.LOCKER},at:"2026-09-15T19:00",day:"Martedì 15 settembre",city:"Barcellona",mode:"box",time:"19:00",title:"Locker InPost",place:"Carrer de Numància 33, davanti all'hotel",det:"Punto ES-32234 · armadietto automatico aperto 24 ore · PIN di 6 cifre",addr:"Carrer de Numància 33, 08029 Barcelona",nav:G+encodeURIComponent("Carrer de Numància 33, 08029 Barcelona")+"&travelmode=walking",
  facts:[["Punto","ES-32234"],["Aperto","24 ore"],["Giacenza","8 giorni"]],
  ready:["Il PIN di sei cifre, arriva per email e per SMS","Telefono carico, se preferisci aprire con l'app InPost"],
  notes:["Da Sants Estació sono sei minuti a piedi risalendo Carrer de Numància: il locker è al numero 33, di fronte all'hotel.","Si apre digitando il PIN di sei cifre sullo schermo, oppure dall'app InPost quando sei a meno di settanta metri.","Nel registro ufficiale InPost risulta aperto tutti i giorni 24 ore su 24: non c'è nessuna fretta, se stasera sei stanco ci passi domani.","Sta dentro il parcheggio Indigo Car Berlin di Numància 33. Indigo scrive che i suoi locker li usa chiunque, anche chi non parcheggia, a qualsiasi ora: se la porta pedonale è chiusa, accanto c'è un tastierino con l'interfono, suoni e ti aprono.","I pacchi restano otto giorni, poi tornano al mittente."],
  planB:"Se lo schermo non accetta il PIN, apri l'app InPost e usa l'apertura a distanza. Se il locker è guasto o non riesci a entrare, l'assistenza InPost dall'estero è il +34 938 16 62 34, lun-ven 8:30-20 e sabato mattina. L'hotel è a cinquanta metri: ci riprovi domani con calma."},
 {geo:{p:P.ABBAP},at:"2026-09-15T19:15",day:"Martedì 15 settembre",city:"Barcellona",mode:"stay",time:"19:15",title:"Check-in Abba Sants",place:"A Sants, davanti al locker InPost",det:"Prenotazione BC/20CQX44UMN · 805,03 € da pagare in hotel · reception 24 ore",addr:ABBA.addr,tel:ABBA.tel,telTxt:ABBA.telTxt,nav:G+encodeURIComponent(ABBA.addr)+"&travelmode=walking",
  facts:[["Prenotazione","BC/20CQX44UMN"],["Notti","4"],["Check-out","19 set"],["Cancellabile fino","15 set"]],ready:["Documento","Codice prenotazione BC/20CQX44UMN","Carta per pagare in hotel e per la tassa di soggiorno"],
  notes:["Prenotato direttamente sul sito Abba: paghi qui 805,03 € più la tassa di soggiorno, circa 40 €, raddoppiata nel 2026.","Inclusi: bottiglia d'acqua e welcome drink.","Chiedi una camera lato cortile: le stanze su strada sono rumorose.","Verifica che sia la matrimoniale e non i due letti singoli.","Colazione non inclusa, ma è la cosa più lodata dell'hotel: se la vuoi, si aggiunge al banco."]},
 {geo:{p:P.ABBAP},at:null,days:['2026-09-16','2026-09-17','2026-09-18'],day:"Da mercoledì 16 a venerdì 18",city:"Barcellona",mode:"free",time:"—",title:"Tre giorni pieni a Barcellona",place:"Nessun vincolo di orario",det:"16, 17 e 18 settembre · metro Sants Estació a 300 m",
  ready:["Tessera sanitaria europea per qualsiasi visita medica","112 per le emergenze"],
  notes:["Metro Sants Estació (L3, L5) all'uscita dell'hotel. Plaça d'Espanya a un quarto d'ora a piedi, Camp Nou a mezz'ora.","Fontanella più vicina in Carrer de Viriat, 240 m.","T-casual da 10 corse, 13 € nel 2026, alle macchinette: conviene da 3 corse al giorno in su e vale anche sul treno per l'aeroporto.","Borsa chiusa e portata davanti in metro e sulle Ramblas.","Prendi le pillole agli orari soliti, il fuso è lo stesso."]},
 {geo:{p:P.ABBAP},at:"2026-09-19T12:00",day:"Sabato 19 settembre",city:"Barcellona",mode:"stay",time:"12:00",title:"Check-out Abba Sants",pack:"back",place:"Lascia i bagagli in hotel",det:"Prenotazione BC/20CQX44UMN · deposito gratuito in reception · pomeriggio libero",tel:ABBA.tel,telTxt:ABBA.telTxt,facts:[["Prenotazione","BC/20CQX44UMN"]],
  ready:["Chiave della camera","Un giro su cassetti, cassaforte e bagno"],notes:["Chiedi il tagliando del deposito bagagli.","Giornata libera fino alle 19."]},
 {geo:{from:P.ABBAP,to:P.BCN2,arr:'2026-09-19T19:45',dest:'Aeroporto, Terminal 2'},at:"2026-09-19T19:00",day:"Sabato 19 settembre",city:"Barcellona",mode:"rail",time:"19:00",title:"Riprendi i bagagli e vai in aeroporto",place:"Sants → Aeroport Terminal 2",det:"Treno R2 Nord da Sants · ~20 min · arriva direttamente al T2",nav:G+"Aeroport+del+Prat+Terminal+2&travelmode=transit",
  facts:[["Al gate entro","21:05"],["Terminal","T2"]],ready:["Biglietto Rodalies zona 1 dalle macchinette di Sants, oppure una corsa della T-casual","Carta d'imbarco Wizz nell'app"],
  notes:["Wizz Air parte dal Terminal 2, non dal T1: verifica sulla carta d'imbarco.","A Sants cerca i treni Rodalies R2 Nord direzione \"Aeroport\": ogni 30 minuti, la fermata è dentro il T2.","In alternativa Aerobús A2 da Plaça d'Espanya, che va al T2. Non l'A1, che va al T1.","Parti con margine: il sabato sera il traffico rallenta."],warn:0,
  planB:"Se perdi il treno R2, taxi dal posteggio davanti a Sants: 25 minuti, circa 35 €."},
 {geo:{from:P.BCNP,to:P.FCO,arr:'2026-09-19T23:40',dest:'Fiumicino'},at:"2026-09-19T21:45",day:"Sabato 19 settembre",city:"Barcellona → Roma",mode:"air",time:"21:45",title:"Wizz Air Malta",code:"W4 6020",docs:true,place:"Barcelona El Prat T2 → Fiumicino",det:"1h 55min · arrivo 23:40 · PNR JPIMFD",
  facts:[["PNR","JPIMFD"],["Gate chiude","21:15"],["Arrivo","23:40"],["Terminal","T2"]],ready:["Carta d'imbarco Wizz (check-in online obbligatorio)","Documento"],
  notes:["Solo l'oggetto personale è incluso, 40×30×20 cm. Il trolley solo se acquistato: è più severa di Vueling.","Check-in online obbligatorio: farlo al banco costa una penale salata.","Cena prima di imbarcarti: atterri a mezzanotte meno venti."],warn:0,
  planB:"Se il volo ritarda oltre un'ora, chiama l'Hotel Riviera al "+RIV.telTxt+" per confermare che arrivi comunque."},
 {geo:{from:P.FCO,to:P.RIVP,arr:'2026-09-20T00:30',dest:'Hotel Riviera'},at:"2026-09-19T23:40",day:"Sabato 19 settembre",city:"Fiumicino",mode:"road",time:"23:40",title:"Atterraggio a Fiumicino",place:"Verso l'Hotel Riviera",det:"Atterri al Terminal 1 · taxi dal posteggio ufficiale · 10 minuti · 25 € tariffa minima Comune di Fiumicino",addr:RIV.addr,tel:RIV.tel,telTxt:RIV.telTxt,nav:G+encodeURIComponent(RIV.addr)+"&travelmode=driving",warn:1,
  facts:[["Taxi","25 €"],["Tragitto","~10 min"]],
  ready:["25 € in contanti o carta per il taxi","Indirizzo da dire: Via Licio Visintini 30, Fiumicino"],
  notes:["Navetta dell'hotel finita alle 22 e Leonardo Express quasi: il taxi è l'unica opzione, ed è quella giusta.","Solo taxi bianchi con scritta TAXI sul tetto e numero di licenza sulle portiere, dal posteggio ufficiale fuori dagli Arrivi. Ignora chi ti avvicina dentro il terminal.","Tariffa minima 25 € per il Comune di Fiumicino, già tutto incluso: non accettare cifre diverse.","Il posteggio è al livello Arrivi, sia al Terminal 1 sia al Terminal 3."]},
 {geo:{p:P.RIVP},at:"2026-09-20T00:30",day:"Sabato 19 settembre",city:"Fiumicino",mode:"stay",time:"00:30",title:"Check-in Hotel Riviera",place:"Reception aperta 24 ore",det:"Prenotazione 51220260902093925228 · 105 € con colazione · reception 24 ore",addr:RIV.addr,tel:RIV.tel,telTxt:RIV.telTxt,
  facts:[["Prenotazione","51220260902093925228"],["Tariffa","105 € con colazione"],["Pagamento","in hotel"],["Check-out","20 set"]],
  ready:["Documento","Codice prenotazione 51220260902093925228","Carta per pagare"],notes:["Arrivo dopo mezzanotte già concordato: la reception è attiva 24 ore.","C'è una scala all'ingresso, niente rampa: con la valigia sappilo.","Prendi la pillola della sera se non l'hai già fatto.","Domani colazione inclusa, poi navetta per l'aeroporto, circa 7 € a testa: chiedi gli orari in reception stasera."]},
 {geo:{from:P.RIVP,to:P.FCO,arr:'2026-09-20T11:15',dest:'Fiumicino'},at:"2026-09-20T10:30",day:"Domenica 20 settembre",city:"Fiumicino",mode:"stay",time:"10:30",title:"Check-out Hotel Riviera",pack:"back",place:"Torna verso l'aeroporto",det:"Prenotazione 51220260902093925228 · colazione inclusa · navetta circa 7 € a testa",tel:RIV.tel,telTxt:RIV.telTxt,
  facts:[["Prenotazione","51220260902093925228"],["Navetta","~7 €"],["Al T3 entro","11:15"]],
  ready:["Colazione fatta, è inclusa","Contanti per la navetta, circa 7 € a testa","Conto saldato in reception"],notes:["Il treno per Sibari è alle 18:20: hai tutto il tempo.","La navetta parte dall'hotel dalle 6 circa, con orari da confermare in reception, e ti lascia al Terminal 3, parcheggio bus 24.","Dal T3 alla stazione del Leonardo Express sono 5 minuti a piedi seguendo i cartelli."]},
 {geo:{from:P.FCO,to:P.ROMA,arr:'2026-09-20T12:02',dest:'Roma Termini'},at:"2026-09-20T11:30",day:"Domenica 20 settembre",city:"Fiumicino → Roma",mode:"rail",time:"11:30",title:"Leonardo Express",place:"Fiumicino T3 → Roma Termini",det:"32 min · 14 € · arrivo verso mezzogiorno",
  facts:[["Durata","32 min"],["Arrivo","~12:00"]],ready:["Biglietto dall'app o dalle macchinette in stazione"],notes:["Parte dalla stazione del Terminal 3."]},
 {geo:{p:P.ROMA},at:"2026-09-20T12:10",day:"Domenica 20 settembre",city:"Roma",mode:"free",time:"12:10",title:"Deposito bagagli KiPoint",place:"Dentro Roma Termini, lato Via Giolitti",det:"Aperto 07:00-21:00 · 6 € per 5 ore, poi 1 € l'ora",addr:KIP.addr,tel:KIP.tel,telTxt:KIP.telTxt,nav:G+"Via+Giovanni+Giolitti+34,+Roma&travelmode=walking",
  facts:[["Apertura","07:00-21:00"],["Costo","~7 €"]],ready:["Circa 7 € in contanti o carta"],
  notes:["Piano terra, lato Via Giolitti, vicino al binario 24.","Conserva la ricevuta: serve per ritirare.","Chiude alle 21:00, ampiamente dopo il tuo treno."]},
 {geo:{p:P.ROMA},at:"2026-09-20T12:30",day:"Domenica 20 settembre",city:"Roma",mode:"free",time:"12:30",title:"Pranzo al Mercato Centrale",place:"Dentro Roma Termini, Via Giolitti 36",det:"Food hall aperta 8-24 · zero spostamenti",nav:G+"Mercato+Centrale+Roma+Termini&travelmode=walking",
  facts:[["Orario","8:00-24:00"]],ready:["Carta o contanti"],
  notes:["È dentro la stazione, ingresso da Via Giolitti: non devi uscire.","Banchi di artigiani del cibo, non un autogrill: pizza, pasta fresca, carne, pesce, dolci.","Esci entro le 13:10: la Domus Aurea è alle 14:00 e ci vogliono 25 minuti a piedi.","Torna qui alle 17:30 per la cena da portare sul treno."]},
 {geo:{from:P.ROMA,to:P.DOMUS,arr:'2026-09-20T13:40',dest:'Domus Aurea'},at:"2026-09-20T13:15",day:"Domenica 20 settembre",city:"Roma → Colle Oppio",mode:"road",time:"13:15",title:"A piedi verso la Domus Aurea",place:"Termini → Colle Oppio · 25 minuti",det:"Via Cavour, Via degli Annibaldi, poi Via Labicana: l'ingresso è su Via della Domus Aurea, dentro il parco",nav:G+"Domus+Aurea,+Via+della+Domus+Aurea,+Roma&travelmode=walking",
  ready:["Scarpe comode","Felpa o giacca per il sotterraneo","Borraccia piena"],
  notes:["Da Termini scendi Via Cavour fino a Via degli Annibaldi, poi Via Labicana: l'ingresso del parco del Colle Oppio è sulla destra, il cancello della Domus è dentro, su Via della Domus Aurea.","Devi essere al cancello alle 13:45, un quarto d'ora prima del turno.","Se sei in ritardo: metro B da Termini a Colosseo, due fermate, poi 5 minuti a piedi risalendo Via Labicana."]},
 {geo:{p:P.DOMUS},at:"2026-09-20T14:00",day:"Domenica 20 settembre",city:"Colle Oppio",mode:"free",time:"14:00",title:"Domus Aurea con la realtà virtuale",place:"Ingresso su Via della Domus Aurea, Colle Oppio",det:"Turno 14:00 · al cancello alle 13:45 · 75 minuti · percorso didattico in italiano con visore",addr:"Via della Domus Aurea, 00184 Roma",tel:"+390639967700",telTxt:"+39 06 399 67 700",nav:G+"Domus+Aurea,+Via+della+Domus+Aurea,+Roma&travelmode=walking",docs:true,
  facts:[["Prenotazione","GPCO54KG2XQNN8NW"],["Biglietto","SPCOLG75A3JBVJBV"],["Turno","14:00"],["Pagato","8 €"]],
  ready:["Documento d'identità","Verbale 104 in versione omissis, in Documenti","Biglietto con il QR, in Documenti","Felpa o giacca: dentro fa freddo","Scarpe comode"],
  notes:["Biglietto gratuito per disabilità più 8 € del percorso didattico: all'ingresso mostri il QR, il documento e il verbale. Nessuno deve leggere la diagnosi, la versione omissis basta.","Sotterraneo e umido, una decina di gradi meno che fuori, luce bassa. Il visore lo indossi solo in alcune sale.","Niente zaini voluminosi, valigie o trolley: la borsa piccola passa, i bagagli sono al KiPoint.","Pavimenti irregolari e qualche scalino: segui i percorsi segnalati."],warn:1,
  planB:"Se arrivi in ritardo il turno è perso: chiama il +39 06 399 67 700 e chiedi un turno successivo, l'ultimo ingresso è alle 15:30. Se non c'è posto, il pomeriggio è tutto Monti, a dieci minuti a piedi."},
 {geo:{from:P.DOMUS,to:P.MMONTI,arr:'2026-09-20T15:30',dest:'Monti'},at:"2026-09-20T15:20",day:"Domenica 20 settembre",city:"Monti",mode:"free",time:"15:20",title:"Monti: mercato o giro vintage",place:"Dalla Domus 10 minuti a piedi · Mercato Monti, sede storica Via Leonina 46",det:"Sab-dom 10-20 · ingresso libero · vintage, vinili, design · poi gelato da Fatamorgana",addr:"Via Leonina 46, 00184 Roma",nav:G+"Via+Leonina+46,+Roma&travelmode=walking",
  facts:[["Orario","10:00-20:00"],["Ingresso","gratis"],["Metro","Cavour, linea B"]],
  ready:["Contanti: molti banchi non hanno il POS","Spazio nello zaino per quello che compri"],
  notes:["Negli ultimi anni ha cambiato sede e per il 2026 ne annuncia una nuova: prima di andare controlla mercatomonti.com o Instagram @mercatomonti. Via Leonina 46 è la sede storica.","Non confonderlo con il Mercato Rionale Monti di Via Baccina 36: quello è il mercato alimentare del quartiere, con panini con la porchetta e pasta fresca, ma la domenica è chiuso.","Mercato urbano al coperto: le bancarelle vanno a rotazione a giovani designer, artigiani e venditori vintage.","Gli espositori cambiano ogni settimana: quello che vedi oggi la prossima domenica non c'è più.","Vinili, capi second-hand, gioielli artigianali, stampe illustrate, borse in pelle fatte a mano.","I prezzi non sono da mercatino delle pulci: si compra per il pezzo unico, non per l'affare.","Stagione da settembre a giugno, chiuso ad agosto.","Gelato da Fatamorgana, Piazza degli Zingari 5: gusti naturali e strani, basilico noci e miele in testa.","Alle 17 risali Via Cavour verso Termini, oppure metro B da Cavour, una fermata."],warn:0,
  planB:"Se il mercato è chiuso o trasferito, il giro vintage lo fai lo stesso: Pifebo in Via dei Serpenti 135 e 141, King Size Vintage in Via Leonina 78, le boutique di Via del Boschetto e Via Urbana, poi Piazza della Madonna dei Monti e il gelato. Se piove, Palazzo delle Esposizioni in Via Nazionale 194, aperto fino alle 20."},
 {geo:{from:P.MMONTI,to:P.ROMA,arr:'2026-09-20T17:15',dest:'Roma Termini'},at:"2026-09-20T17:00",day:"Domenica 20 settembre",city:"Monti → Roma",mode:"road",time:"17:00",title:"Rientro a Termini",place:"Monti → Roma Termini · 15 minuti a piedi",det:"Via Cavour in salita, oppure metro B da Cavour, una fermata",nav:G+"Roma+Termini&travelmode=walking",
  notes:["A piedi risali Via Cavour: 15 minuti in salita leggera.","Se sei stanco, metro B da Cavour a Termini: una fermata, 2 minuti.","Passa dal Mercato Centrale per la cena da portare sul treno."]},
 {geo:{p:P.ROMA},at:"2026-09-20T17:45",day:"Domenica 20 settembre",city:"Roma",mode:"rail",time:"17:45",title:"Ritira il bagaglio",place:"Torna a Roma Termini",det:"35 min prima del treno · binario sui tabelloni 15 min prima",
  ready:["Ricevuta del deposito","Acqua e qualcosa da mangiare per 4 ore"],notes:["Il binario compare sui tabelloni circa 15 minuti prima della partenza."]},
 {geo:{from:P.ROMA,to:P.SIB,arr:'2026-09-20T22:33',dest:'Sibari'},at:"2026-09-20T18:20",day:"Domenica 20 settembre",city:"Roma → Sibari",mode:"rail",time:"18:20",title:"Frecciarossa",code:"FR 8519",docs:true,place:"Roma Termini → Sibari",det:"4h 13min · arrivo 22:33 · carrozza 7, posto 14D · PNR SJMTUN",
  facts:[["PNR","SJMTUN"],["Carrozza","7"],["Posto","14D"],["Arrivo","22:33"]],ready:["QR del biglietto","Documento"],
  notes:["È l'unico diretto della giornata.","Fermate: Napoli Afragola, Salerno, Scalea, Paola alle 21:43, Torano."],warn:0,
  planB:"Se lo perdi non ci sono altri diretti oggi. Guarda su Trenitalia una soluzione con cambio a Paola, oppure una notte a Roma e il treno di domani. Il biglietto Super Economy comunque è perso."},
 {geo:{p:P.SIB},at:"2026-09-20T22:33",day:"Domenica 20 settembre",city:"Sibari",mode:"stay",time:"22:33",title:"Arrivo a Sibari",place:"Sei a casa",det:"Avvisa chi ti viene a prendere quando passi da Paola, alle 21:43",
  notes:["Domenica sera i collegamenti da Sibari sono pochi: accordati prima con chi ti viene a prendere."]}
];

/* Categorie di spesa, ognuna con la sua icona vettoriale nello stile delle altre icone dell'app. */
const I = inner => '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
export const CATS = [
  { n: 'Cibo', i: I('<path d="M7 3v5a3 3 0 0 0 6 0V3M10 3v5M10 11v10"/><path d="M18 3c-2 1.8-3 5-3 8h3v10"/>') },
  { n: 'Mezzi', i: I('<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M8 21v-3M16 21v-3M9 7h6"/><circle cx="8.5" cy="14.5" r="1.1" fill="currentColor"/><circle cx="15.5" cy="14.5" r="1.1" fill="currentColor"/>') },
  { n: 'Da pagare', sub: 'hotel e tassa di soggiorno', i: I('<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>') },
  { n: 'Vestiti', i: I('<path d="M9 3a3 3 0 0 0 6 0l5.5 2.5-2 4-2.5-1V21h-8V8.5l-2.5 1-2-4z"/>') },
  { n: 'Igiene e farmacia', i: I('<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6M12 10v6M9 13h6"/>') },
  { n: 'Piacere', i: I('<path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z"/>') },
];
/* categorie vecchie (Cibo, Trasporti, Hotel, Shopping, Ingressi, Farmacia, Altro) -> nuove, per le spese già salvate */
export const CAT_MIGRATE = [0, 1, 2, 3, 5, 4, 5];

export const PHRASES = [
  'Me han robado la cartera y el móvil. Necesito presentar una denuncia.',
  '¿Dónde está la farmacia más cercana?',
  'Me he perdido. Tengo que ir a esta dirección: {ADDR}',
  'Necesito un médico, por favor.',
  '¿Puede llamar a la policía, por favor?',
  'No hablo español. ¿Habla inglés o italiano?',
];

/* Hotel in cui si dorme in un dato istante (usato da SOS). */
export const curHotel = (T = Date.now()) => T < Date.parse('2026-09-19T12:00') ? ABBA : RIV;
export { ABBA, RIV, KIP };
