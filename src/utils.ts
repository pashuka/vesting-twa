import { Address } from '@ton/core';
import { TonClient } from '@ton/ton';
import { CHAIN } from '@tonconnect/ui-react';
import { START_TIME_OVERHEAD } from './constants';
import { LinearVestingConfig } from './contracts/LinearVesting';
import { DurationType, LinearVestingForm } from './types';

export const truncateLong = (s: string, l = 20, separator = '...') => {
  if (s.length <= l) return s;
  const sepLen = separator.length,
    charsToShow = l - sepLen,
    frontChars = Math.ceil(charsToShow / 2),
    backChars = Math.floor(charsToShow / 2);
  return s.substring(0, frontChars) + separator + s.substring(s.length - backChars);
};

export const sleep = (ms: number | undefined) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const durationLocale = (d: DurationType) => {
  switch (d) {
    case 'day':
      return 'день';
    case 'hour':
      return 'час';
    case 'month':
      return 'месяц';
    case 'week':
      return 'неделя';

    default:
      break;
  }
};

export const durationLocale2 = (d: DurationType) => {
  switch (d) {
    case 'day':
      return 'в днях';
    case 'hour':
      return 'в часах';
    case 'month':
      return 'в месяцах';
    case 'week':
      return 'в неделях';

    default:
      break;
  }
};

export const durationSeconds = (d: DurationType) => {
  const hour = 60 * 60;
  switch (d) {
    case 'day':
      return hour * 24;
    case 'hour':
      return hour;
    case 'month':
      return hour * 24 * 30;
    case 'week':
      return hour * 24 * 7;
    default:
      return 0;
  }
};
export const today = () => new Date();
export const addDays = (d: Date, days: number) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};
export const getInputDateFormat = (d: Date) => d.toISOString().split('T')[0];

export const prepareLinearVestingConfig = (f: LinearVestingForm): LinearVestingConfig => ({
  owner_address: Address.parse(f.ownerAddress),
  admin_address: Address.parse(f.adminAddress),
  start_time: Math.round(new Date(f.startTime).getTime() / 1000),
  total_duration: durationSeconds(f.totalDurationType) * f.totalDuration,
  unlock_period: durationSeconds(f.unlockPeriodType) * f.unlockPeriod,
  cliff_duration: durationSeconds(f.cliffDurationType) * f.cliffDuration,
});

// totalDuration > 0
// totalDuration <= 135 years (2^32 seconds)
export const validateTotalDuration = (_: number, form: LinearVestingForm) => {
  const totalDurationValue = durationSeconds(form.totalDurationType) * form.totalDuration;
  const unlockPeriodValue = durationSeconds(form.unlockPeriodType) * form.unlockPeriod;
  if (totalDurationValue < 1) return 'Значение должно быть больше 0';
  if (totalDurationValue > START_TIME_OVERHEAD) return 'Значение должно быть меньше 135 лет';
  if (totalDurationValue < unlockPeriodValue)
    return 'Значение должно быть больше либо равно частоты зазблокировки';
};

// totalDuration mod unlockPeriod == 0
// unlockPeriod > 0
// unlockPeriod <= totalDuration
export const validateUnlockPeriod = (_: number, form: LinearVestingForm) => {
  const totalDurationValue = durationSeconds(form.totalDurationType) * form.totalDuration;
  const unlockPeriodValue = durationSeconds(form.unlockPeriodType) * form.unlockPeriod;
  if (unlockPeriodValue < 1) return 'Значение должно быть больше 0';
  if (unlockPeriodValue > totalDurationValue)
    return 'Значение должно быть меньше либо равно общей продолжительности блокировки';
  if (totalDurationValue % unlockPeriodValue !== 0)
    return 'Общая продолжительность должна делиться без остатка на частоту разблокировки';
};

// cliffDuration >= 0
// cliffDuration <= totalDuration
// cliffDuration mod unlockPeriod == 0
export const validateCliffDuration = (_: number, form: LinearVestingForm) => {
  const totalDurationValue = durationSeconds(form.totalDurationType) * form.totalDuration;
  const unlockPeriodValue = durationSeconds(form.unlockPeriodType) * form.unlockPeriod;
  const cliffDdurationValue = durationSeconds(form.cliffDurationType) * form.cliffDuration;
  if (cliffDdurationValue < 0) return 'Значение должно быть больше либо равно 0';
  if (cliffDdurationValue > totalDurationValue)
    return 'Значение должно быть меньше общей продолжительности блокировки';
  if (cliffDdurationValue > 0 && cliffDdurationValue % unlockPeriodValue !== 0)
    return 'Значение должно быть делиться без остатка на частоту разблокировки';
};

export const unlockPeriodHelperText = (form: LinearVestingForm) => {
  const totalDurationValue = durationSeconds(form.totalDurationType) * form.totalDuration;
  const unlockPeriodValue = durationSeconds(form.unlockPeriodType) * form.unlockPeriod;
  return `Депозит будет разбит на ${totalDurationValue / unlockPeriodValue} части/ей, где одна часть выплат составит ~ ${(100 / (totalDurationValue / unlockPeriodValue)).toPrecision(4)} % от общего депозита`;
};

export const cliffPeriodHelperText = (form: LinearVestingForm) => {
  const totalDurationValue = durationSeconds(form.totalDurationType) * form.totalDuration;
  const cliffDurationValue = durationSeconds(form.cliffDurationType) * form.cliffDuration;
  if (cliffDurationValue === 0) return `Клифф период отключен`;
  return `По окончании клифа первая выплата составит ${(100 / (totalDurationValue / cliffDurationValue)).toPrecision(4)} % от общего депозита`;
};

export const getAddress = (s: string) => {
  let a: Address | undefined = undefined;
  try {
    a = Address.parse(s);
  } catch (error) {}
  return a;
};

export const validateOwnerAddress =
  (network: CHAIN | null) => (field: string, form: LinearVestingForm) => {
    const ownerAddress = getAddress(field);
    if (!ownerAddress) {
      return 'Адрес получателя указан с ошибкой';
    }
    if (network === CHAIN.MAINNET && ownerAddress.workChain.toString() !== network) {
      return 'Адрес получателя указывает на testnet, а вы подключили кошелек основной сети';
    }
  };

type JettonMetaDataKeys = 'name' | 'description' | 'image' | 'symbol' | 'image_data' | 'decimals';
const jettonOnChainMetadataSpec: {
  [key in JettonMetaDataKeys]: 'utf8' | 'ascii' | undefined;
} = {
  name: 'utf8',
  description: 'utf8',
  image: 'ascii',
  decimals: 'utf8',
  symbol: 'utf8',
  image_data: undefined,
};

export const debounce = (func: () => void, wait: number, immediate?: boolean) => {
  let timeout: number | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (...args: any) => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    const callNow = immediate && !timeout;
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };
};

export async function waitForContractDeploy(address: Address, client: TonClient) {
  let isDeployed = false;
  let maxTries = 25;
  while (!isDeployed && maxTries > 0) {
    maxTries--;
    isDeployed = await client.isContractDeployed(address);
    if (isDeployed) return;
    await sleep(3000);
  }
  throw new Error('Timeout');
}

const getSeqNo = async (client: TonClient, wallet: Address) => {
  const getMethodResult = await client.runMethod(wallet, 'seqno');
  return getMethodResult.stack.readNumber();
};

export async function waitForSeqno(client: TonClient, wallet: Address) {
  const seqnoBefore = await getSeqNo(client, wallet);

  return async () => {
    for (let attempt = 0; attempt < 25; attempt++) {
      await sleep(3000);
      const seqnoAfter = await getSeqNo(client, wallet);
      if (seqnoAfter > seqnoBefore) return;
    }
    throw new Error('Timeout');
  };
}
