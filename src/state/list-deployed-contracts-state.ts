import { atom } from 'recoil';
import { LinearVestingConfigTiny } from '../contracts/LinearVesting';
import { instanceOfLVCTinyArray } from '../utils';
import { localStorageEffect } from './effects';

export const listDeployedContractsState = atom({
  key: 'listDeployedContractsState',
  default: [],
  effects: [
    localStorageEffect<LinearVestingConfigTiny[]>({
      key: 'list-deployed-contracts',
      isValid: (value) => instanceOfLVCTinyArray(value),
    }),
  ],
});
