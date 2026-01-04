import { Player, PlayerCategory, PlayerStatus } from './types';

export const MAX_PURSE = 120000;
export const MIN_SQUAD_SIZE = 15;
export const CAT_A_CAP = 50000;
export const MIN_CAT_A = 1;
export const MIN_CAT_B = 4;
export const MIN_CAT_C = 7;

export const BASE_PRICES = {
  [PlayerCategory.A]: 10000,
  [PlayerCategory.B]: 5000,
  [PlayerCategory.C]: 3000,
};
