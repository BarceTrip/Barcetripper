/* Hotel, punti d'appoggio e coordinate delle tappe (usate dal meteo). */
export const G = 'https://www.google.com/maps/dir/?api=1&destination=';

export const ABBA = { name: 'Abba Sants Hotel', addr: 'Carrer Numància 32, 08029 Barcelona', tel: '+34936003100', telTxt: '+34 936 00 31 00', mail: 'abba-sants@abbahoteles.com', ref: 'BC/20CQX44UMN' };
export const RIV  = { name: 'Hotel Riviera Fiumicino', addr: 'Via Licio Visintini 30, 00054 Fiumicino', tel: '+39066580302', telTxt: '+39 06 658 0302', ref: '51220260902093925228' };
export const KIP  = { addr: 'Interno stazione, Via Giolitti 34, Roma Termini', tel: '+390689014069', telTxt: '+39 06 8901 4069' };

/* [lat, lon] */
export const P = {
  HOME:  [39.596, 16.519],
  SIB:   [39.7493, 16.4565],   // stazione FS, non l'autostazione: OSM railway=station
  ROMA:  [41.9010, 12.5015],
  FCO:   [41.7952, 12.2554],   // Terminal 1 (partenza Vueling, arrivo Wizz)
  BCNP:  [41.2890, 2.0761],    // Terminal 1: il punto vecchio stava tra i due terminal
  BCN2:  [41.3030, 2.0760],
  ABBAP: [41.3826, 2.1400],
  LOCKER:[41.38249, 2.13949],   // locker InPost ES-32234, Carrer de Numància 33
  RIVP:  [41.7565, 12.2302],
  MONTI: [41.8947, 12.4925],
  MMONTI:[41.8947, 12.4928],   // Mercato di Monti, Via Leonina 46 (nodo OSM)
  DOMUS: [41.8912, 12.4952],
};
