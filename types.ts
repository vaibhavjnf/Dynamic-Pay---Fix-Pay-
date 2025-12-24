export interface Transaction {
  id: string;
  amount: string;
  timestamp: string;
  shopName: string;
  upiId: string;
  items?: string; // Comma separated list of items if picked from catalog
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
}

export interface AppConfig {
  shopName: string;
  upiId: string;
  quickAmounts: number[];
  catalog: CatalogItem[];
}

export interface User {
  id: string;
  email: string;
}

export enum Screen {
  WELCOME = 'WELCOME',
  SETUP = 'SETUP',
  POS = 'POS',
  LEDGER = 'LEDGER',
  SETTINGS = 'SETTINGS'
}