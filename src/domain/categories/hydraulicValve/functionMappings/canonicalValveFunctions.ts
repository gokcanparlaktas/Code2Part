export type CanonicalValveFunctionId =
  | 'closed_center_4_3'
  | 'tandem_center_4_3'
  | 'open_center_4_3'
  | 'partially_open_4_3'
  | 'two_position_directional'
  | 'unknown';

export interface CanonicalValveFunction {
  id: CanonicalValveFunctionId;
  labelTr: string;
}

export const CANONICAL_VALVE_FUNCTIONS: CanonicalValveFunction[] = [
  { id: 'closed_center_4_3', labelTr: '4/3 kapalı merkez (olası)' },
  { id: 'tandem_center_4_3', labelTr: '4/3 tandem merkez (olası)' },
  { id: 'open_center_4_3', labelTr: '4/3 açık merkez (olası)' },
  { id: 'partially_open_4_3', labelTr: '4/3 kısmen açık / ofset merkez (olası)' },
  { id: 'two_position_directional', labelTr: '2 konumlu yön kontrol (olası)' },
  { id: 'unknown', labelTr: 'Bilinmiyor' },
];

