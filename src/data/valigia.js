/* Valigia: cosa mettere nella borsa. Il bagaglio è solo l'oggetto personale sotto il sedile
   (40×30×20 cm) su entrambi i voli, quindi la lista è pensata per una borsa piccola. */

/* categorie: [emoji, nome]. L'ultima compare solo nella valigia del ritorno. */
export const BAG_CATS = [
  ['🪪', 'Documenti'], ['🔌', 'Tecnologia'], ['💊', 'Farmacia'], ['👕', 'Vestiti'], ['🧴', 'Igiene'], ['🎒', 'Varie'], ['🛏️', 'In camera, prima di uscire'],
];
export const BAG_BACK_CAT = 6;

/* id stabile (ci si agganciano le spunte salvate), testo, categoria.
   back: solo al ritorno · out: solo all'andata. Gli oggetti aggiunti dall'app hanno id che inizia per "u". */
export const BAG_ITEMS = [
  { id: 'd1', t: "Carta d'identità", c: 0 },
  { id: 'd2', t: 'Tessera sanitaria europea', c: 0 },
  { id: 'd3', t: 'Bancomat e carta Revolut', c: 0 },
  { id: 'd4', t: 'Contanti in euro', c: 0 },
  { id: 'd5', t: "Biglietti e carte d'imbarco nelle app", c: 0 },
  { id: 'd6', t: 'Chiavi di casa', c: 0 },
  { id: 'd7', t: 'Certificazione 104: copia e foto sul telefono', c: 0 },
  { id: 't1', t: 'Caricabatterie e cavo', c: 1 },
  { id: 't2', t: 'Powerbank carico', c: 1 },
  { id: 't3', t: 'Auricolari', c: 1 },
  { id: 't4', t: 'Adattatore per le spine a 3 poli', c: 1 },
  { id: 'f1', t: 'Pillole per 6 giorni più 2 di scorta', c: 2 },
  { id: 'f2', t: 'Tachipirina o ibuprofene', c: 2 },
  { id: 'f3', t: 'Cerotti per le vesciche', c: 2 },
  { id: 'f4', t: 'Crema solare', c: 2 },
  { id: 'f5', t: 'Imodium e antiacido', c: 2 },
  { id: 'v1', t: 'Intimo per 6 giorni', c: 3 },
  { id: 'v2', t: 'Calze per 6 giorni', c: 3 },
  { id: 'v3', t: '5 magliette', c: 3 },
  { id: 'v4', t: 'Pantaloni lunghi leggeri', c: 3 },
  { id: 'v5', t: 'Pantaloncini', c: 3 },
  { id: 'v6', t: "Felpa per la sera e l'aereo", c: 3 },
  { id: 'v7', t: 'Costume da bagno', c: 3 },
  { id: 'v8', t: 'Pigiama', c: 3 },
  { id: 'v9', t: 'Cappello e occhiali da sole', c: 3 },
  { id: 'v10', t: 'K-way o ombrellino pieghevole', c: 3 },
  { id: 'i1', t: 'Busta da 1 litro per i liquidi', c: 4 },
  { id: 'i2', t: 'Spazzolino e dentifricio mini', c: 4 },
  { id: 'i3', t: 'Deodorante da 100 ml', c: 4 },
  { id: 'i4', t: 'Rasoio', c: 4 },
  { id: 'i5', t: 'Salviette umidificate', c: 4 },
  { id: 'x1', t: 'Borraccia vuota fino ai controlli', c: 5 },
  { id: 'x2', t: 'Colazione per il treno', c: 5, out: true },
  { id: 'x3', t: 'Telo mare in microfibra', c: 5 },
  { id: 'x4', t: 'Sacchetto per i panni sporchi', c: 5 },
  { id: 'x5', t: 'Lucchettino per la zip dello zaino', c: 5 },
  { id: 'r1', t: 'Caricabatterie e cavi dalle prese', c: 6, back: true },
  { id: 'r2', t: 'Cassaforte aperta e vuota', c: 6, back: true },
  { id: 'r3', t: 'Bagno: trousse, spazzolino, rasoio', c: 6, back: true },
  { id: 'r4', t: 'Armadio, cassetti e comodini', c: 6, back: true },
  { id: 'r5', t: 'Sotto il letto e dietro la porta', c: 6, back: true },
  { id: 'r6', t: 'Regali e acquisti nello zaino', c: 6, back: true },
];
