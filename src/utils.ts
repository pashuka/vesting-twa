import { Address, OpenedContract } from '@ton/core';
import { WalletContractV4 } from '@ton/ton';
import { CHAIN } from '@tonconnect/ui-react';
import { START_TIME_OVERHEAD } from './constants';
import { DurationType, LinearVestingForm } from './types';

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
export const getInputDateFormat = (d: Date) => d.toISOString().split('T')[0];

// totalDuration > 0
// totalDuration <= 135 years (2^32 seconds)
export const validateTotalDuration = (_: number, form: LinearVestingForm) => {
  const totalDurationValue = durationSeconds(form.totalDurationType) * form.totalDuration;
  const unlockPeriodValue = durationSeconds(form.unlockPeriodType) * form.unlockPeriod;
  console.log(form);
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
  return `Депозит будет разбит на ${totalDurationValue / unlockPeriodValue} частей, где одна часть выплат составит ~ ${(100 / (totalDurationValue / unlockPeriodValue)).toPrecision(4)} % от общего депозита`;
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

export async function waitForTransaction(
  seqno: number,
  walletContract: OpenedContract<WalletContractV4>,
) {
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log(`waiting for the transaction (seqno: ${seqno}) to confirm...`);
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log(`Tx (seqno: ${seqno}) confirmed!`);
}
