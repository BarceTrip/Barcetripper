/* Salute a Barcellona: numeri e punti verificati intorno all'hotel (dati OpenStreetMap e CatSalut). */
export const SALUTE_NUM = [
  { n: '112', t: 'Emergenze', d: 'Ambulanza, polizia, vigili del fuoco. Vale in Spagna e in Italia', pri: true },
  { n: '061', t: '061 Salut Respon', d: 'Personale sanitario al telefono, gratis, 24 ore: consigli, dove andare, dubbi sui farmaci' },
];
/* [nome, tipo, indirizzo, note, lat, lon, telefono] */
export const SALUTE_LUOGHI = [
  { id: 'cap', ico: 'cross', n: 'CAP Numància', t: 'Ambulatorio pubblico', a: 'Carrer de Numància 23', d: 'A 150 metri dall\'hotel, dall\'altro lato della strada. Con la tessera sanitaria europea ti visitano qui. Per i casi non gravi è il posto giusto.', h: 'Lun-ven 8-20 · verifica al 061', p: [41.38187, 2.14036], tel: '+34934831910' },
  { id: 'clinic', ico: 'cross', n: 'Hospital Clínic', t: 'Pronto soccorso', a: 'Carrer de Villarroel 170', d: 'Il pronto soccorso pubblico più vicino, aperto sempre. Circa 1,5 km dall\'hotel, metro L5 fino a Hospital Clínic.', h: '24 ore', p: [41.38949, 2.15224], tel: '+34932275400' },
  { id: 'farm24', ico: 'pill', n: 'Farmàcia Aragó 1', t: 'Farmacia 24 ore', a: "Carrer d'Aragó 1", d: 'La farmacia aperta giorno e notte più vicina, circa 900 metri verso Plaça d\'Espanya.', h: '24 ore', p: [41.37829, 2.14600] },
  { id: 'farm24b', ico: 'pill', n: 'Farmàcia Torres', t: 'Farmacia 24 ore', a: "Carrer d'Aribau 62", d: 'Altra farmacia sempre aperta, in Carrer d\'Aribau: la stessa via del Consolato, un chilometro più in basso.', h: '24 ore', p: [41.38864, 2.15918] },
];
export const FARMACIE_TURNO = 'https://www.farmaceuticos.com/farmacias-de-guardia/barcelona/';

/* Etichette della scheda medica: [chiave, italiano, spagnolo, segnaposto, tipo] */
export const MED_CAMPI = [
  ['nome', 'Nome e cognome', 'Nombre y apellidos', 'Come sul documento', 'text'],
  ['nato', 'Data di nascita', 'Fecha de nacimiento', '05/09/1991', 'text'],
  ['sangue', 'Gruppo sanguigno', 'Grupo sanguíneo', 'Se lo sai', 'text'],
  ['allergie', 'Allergie', 'Alergias', 'Farmaci, alimenti, altro. Scrivi "nessuna" se non ne hai', 'area'],
  ['cond', 'Condizioni di salute', 'Condiciones de salud', 'Cosa deve sapere un medico che non ti conosce', 'area'],
  ['note', 'Cosa mi aiuta', 'Qué me ayuda', 'Per esempio: parlarmi piano, un posto tranquillo, chiamare mio fratello', 'area'],
];
