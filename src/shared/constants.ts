import type { AccountConfig } from './types.js';

export const DEFAULT_GAME_URL = 'https://tibidle.com';

export const DEFAULT_ACCOUNTS: AccountConfig[] = [
  {
    id: 'account_01',
    name: '01',
    partition: 'persist:tibidle_01',
    url: DEFAULT_GAME_URL,
  },
  {
    id: 'account_02',
    name: '02',
    partition: 'persist:tibidle_02',
    url: DEFAULT_GAME_URL,
  },
  {
    id: 'account_03',
    name: '03',
    partition: 'persist:tibidle_03',
    url: DEFAULT_GAME_URL,
  },
  {
    id: 'account_04',
    name: '04',
    partition: 'persist:tibidle_04',
    url: DEFAULT_GAME_URL,
  },
];

export const IPC_CHANNELS = {
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',
  WINDOW_STATE_CHANGE: 'window:state-change',
  SYSTEM_GET_INFO: 'system:get-info',
  SYSTEM_GET_METRICS: 'system:get-metrics',
} as const;
