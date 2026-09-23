// --- CONFIGURACIÓN DE COORDENADAS MANUALES ---
export const MANUAL_POSITIONS: Record<number, { row: number; span: number }> = {
  1: { row: 1, span: 4 }, 2: { row: 3, span: 4 }, 3: { row: 5, span: 4 }, 4: { row: 7, span: 4 },
  5: { row: 9, span: 4 }, 6: { row: 11, span: 4 }, 7: { row: 13, span: 4 }, 8: { row: 15, span: 4 },
  9: { row: 1, span: 4 }, 10: { row: 3, span: 4 }, 11: { row: 5, span: 4 }, 12: { row: 7, span: 4 },
  13: { row: 2, span: 4 }, 14: { row: 6, span: 4 }, 15: { row: 10, span: 4 }, 16: { row: 14, span: 4 },
  17: { row: 7, span: 4 }, 18: { row: 5, span: 4 }, 19: { row: 3, span: 4 }, 20: { row: 1, span: 4 },
  21: { row: 6, span: 4 }, 22: { row: 2, span: 4 }, 23: { row: 4, span: 4 }, 24: { row: 12, span: 4 },
  25: { row: 2, span: 4 }, 26: { row: 6, span: 4 }, 27: { row: 4, span: 4 }, 28: { row: 8, span: 4 },
  29: { row: 4, span: 4 }, 30: { row: 8, span: 4 }, 31: { row: 8, span: 4 },
};

// --- CONFIGURACIÓN DE CONECTORES ---
export interface ConnectorConfig {
  type: 'up' | 'down' | 'straight';
  step?: number;
}

export const MANUAL_CONNECTORS: Record<number, ConnectorConfig> = {
  1: { type: 'down', step: 1 }, 2: { type: 'up', step: 1 }, 3: { type: 'down', step: 1 }, 4: { type: 'up', step: 1 },
  5: { type: 'down', step: 1 }, 6: { type: 'up', step: 1 }, 7: { type: 'down', step: 1 }, 8: { type: 'up', step: 1 },
  9: { type: 'straight' }, 10: { type: 'straight' }, 11: { type: 'straight' }, 12: { type: 'straight' },
  13: { type: 'down', step: 2 }, 14: { type: 'up', step: 2 }, 15: { type: 'down', step: 2 }, 16: { type: 'up', step: 2 },
  17: { type: 'up', step: 1 }, 18: { type: 'down', step: 1 }, 19: { type: 'up', step: 1 }, 20: { type: 'down', step: 1 },
  21: { type: 'straight' }, 22: { type: 'straight' }, 23: { type: 'down', step: 4 }, 24: { type: 'up', step: 4 },
  25: { type: 'down', step: 2 }, 26: { type: 'up', step: 2 }, 27: { type: 'straight' }, 28: { type: 'straight' },
  29: { type: 'straight' }, 30: { type: 'straight' }, 31: { type: 'straight' },
};

// --- MAPA DE PLACEHOLDERS PARA LOSERS (TIPO CHALLONGE) ---
export const LOSER_PLACEHOLDERS: Record<number, { p1?: string; p2?: string }> = {
  17: { p1: "Perdedor QF4" },
  18: { p1: "Perdedor QF3" },
  19: { p1: "Perdedor QF2" },
  20: { p1: "Perdedor QF1" },
  25: { p1: "Perdedor SF1" },
  26: { p1: "Perdedor SF2" },
  29: { p1: "Perdedor F1" },
  30: { p2: "Ganador GF R1" },
};

export const WINNERS_STAGES = [
  'ROUND OF 16',
  'QUARTERFINALS',
  'SEMIFINALS',
  'FINALS',
  'GRAND FINALS',
];

export const LOSERS_STAGES = [
  'QUARTERFINALS R1',
  'SEMIFINALS R1',
  'SEMIFINALS R2',
  'FINALS R1',
  'FINALS R2',
  'GRAND FINALS R1',
];

// --- INFORMACIÓN DE FORMATO, PROTECTS Y BANS DE PARTIDOS ---
export interface MatchMeta {
  firstTo: number;
  bestOf: number;
  protects: string[];
  bans: string[];
}

export const MATCH_META: Record<number, MatchMeta> = {
  1: { firstTo: 5, bestOf: 9, protects: ['LN2', 'RC2'], bans: ['HB2', 'RC5'] },
  2: { firstTo: 5, bestOf: 9, protects: ['RC3', 'HB2'], bans: ['HB3', 'RC4'] },
  3: { firstTo: 5, bestOf: 9, protects: ['RC3', 'LN3'], bans: ['RC2', 'LN2'] },
  4: { firstTo: 5, bestOf: 9, protects: ['RC1', 'RC3'], bans: ['LN2', 'HB3'] },
  5: { firstTo: 5, bestOf: 9, protects: ['RC3', 'LN1'], bans: ['LN2'] },
  6: { firstTo: 5, bestOf: 9, protects: ['LN2', 'LN1'], bans: ['RC3', 'HB3'] },
  7: { firstTo: 5, bestOf: 9, protects: ['RC4', 'HB1'], bans: ['LN2', 'RC2'] },
  8: { firstTo: 5, bestOf: 9, protects: ['RC1', 'HB1'], bans: ['RC5', 'LN2'] },
  9: { firstTo: 6, bestOf: 11, protects: ['RC3', 'RC2'], bans: ['HB2', 'RC4'] },
  10: { firstTo: 6, bestOf: 11, protects: ['RC4', 'HB1'], bans: ['RC3', 'HB4'] },
  11: { firstTo: 6, bestOf: 11, protects: ['LN2', 'RC1'], bans: ['LN1', 'HB1'] },
  12: { firstTo: 6, bestOf: 11, protects: ['RC3', 'RC1'], bans: ['RC4', 'HB2'] },
  13: { firstTo: 6, bestOf: 11, protects: ['LN2', 'RC4'], bans: ['RC3', 'RC6'] },
  14: { firstTo: 6, bestOf: 11, protects: ['RC4', 'LN1'], bans: ['RC3', 'HB1'] },
  15: { firstTo: 6, bestOf: 11, protects: ['RC4', 'RC5'], bans: ['HB4', 'LN1'] },
  16: { firstTo: 6, bestOf: 11, protects: ['HB3', 'RC2'], bans: ['HB1', 'RC4'] },
  17: { firstTo: 6, bestOf: 11, protects: ['RC1', 'RC3'], bans: ['HB2', 'RC4'] },
  18: { firstTo: 6, bestOf: 11, protects: ['RC5', 'HB4'], bans: ['RC4', 'HB2'] },
  19: { firstTo: 6, bestOf: 11, protects: ['RC6', 'HB4'], bans: ['HB2', 'RC1'] },
  20: { firstTo: 6, bestOf: 11, protects: ['RC1', 'HB4'], bans: ['HB2', 'RC3'] },
  21: { firstTo: 6, bestOf: 11, protects: ['LN1', 'RC6'], bans: ['HB2', 'LN3'] },
  22: { firstTo: 6, bestOf: 11, protects: [], bans: [] },
  23: { firstTo: 6, bestOf: 11, protects: ['LN1', 'HB3'], bans: ['HB2', 'RC4'] },
  24: { firstTo: 6, bestOf: 11, protects: ['RC4', 'HB1'], bans: ['LN3', 'RC3'] },
  25: { firstTo: 7, bestOf: 13, protects: ['RC4', 'LN2'], bans: ['HB2', 'LN3'] },
  26: { firstTo: 7, bestOf: 13, protects: ['RC4', 'LN2'], bans: ['HB1', 'HB4'] },
  27: { firstTo: 7, bestOf: 13, protects: ['RC4', 'LN2'], bans: ['RC1', 'LN4'] },
  28: { firstTo: 7, bestOf: 13, protects: ['HB3', 'LN2'], bans: ['HB4', 'RC1'] },
  29: { firstTo: 7, bestOf: 13, protects: ['LN2', 'RC3'], bans: ['LN3', 'RC4'] },
  30: { firstTo: 7, bestOf: 13, protects: ['RC4', 'LN1'], bans: ['RC3', 'LN3'] },
};
