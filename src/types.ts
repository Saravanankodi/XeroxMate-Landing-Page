export interface Lead {
  id: string;
  name: string;
  email: string;
  role?: string;
  timestamp: string;
  syncedToSheets: boolean;
  sheetRowId?: number;
}

export interface CountdownTime {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
}

export interface PrintSimulationOption {
  docType: 'notes' | 'thesis' | 'flyer' | 'cards' | 'cad';
  pages: number;
  copies: number;
  colorMode: 'bw' | 'color';
  paperGsm: '75gsm' | '100gsm' | '300gsm';
  binding: 'none' | 'spiral' | 'hardbound' | 'stapled';
  deliveryType: 'pickup' | 'express';
}
