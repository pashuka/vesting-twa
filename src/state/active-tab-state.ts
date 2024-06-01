import { atom } from 'recoil';
import { localStorageEffect } from './effects';

export const activeTabState = atom({
  key: 'activeTabState',
  default: 0,
  effects: [
    localStorageEffect<number | undefined>({
      key: 'active-tab-state',
      isValid: (value) => typeof value === 'number',
    }),
  ],
});
