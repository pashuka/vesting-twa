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
// totalDuration mod unlockPeriod == 0
export const validateTotalDuration = (field: number, form: LinearVestingForm) => {
  const seconds = durationSeconds(form.totalDurationType);
  const totalDurationValue = seconds * field;
  const unlockPeriodValue = durationSeconds(form.unlockPeriodType) * form.unlockPeriod;
  if (
    totalDurationValue < 1 ||
    totalDurationValue > START_TIME_OVERHEAD ||
    totalDurationValue % unlockPeriodValue !== 0
  ) {
    return 'Значение должно быть больше 0, меньше 135 лет, делиться без остатка на частоту разблокировки';
  }
};

// unlockPeriod > 0
// unlockPeriod <= totalDuration
export const validateUnlockPeriod = (field: number, form: LinearVestingForm) => {
  const totalDurationSeconds = durationSeconds(form.totalDurationType) * form.totalDuration;
  const unlockPeriodValue = durationSeconds(form.unlockPeriodType) * field;
  if (unlockPeriodValue < 1 || unlockPeriodValue > totalDurationSeconds) {
    return 'Значение должно быть больше 0 и меньше либо равно общей продолжительности блокировки';
  }
};

// cliffDuration >= 0
// cliffDuration < totalDuration
// cliffDuration mod unlockPeriod == 0
export const validateCliffDuration = (field: number, form: LinearVestingForm) => {
  const totalDurationSeconds = durationSeconds(form.totalDurationType) * form.totalDuration;
  const unlockPeriodValue = durationSeconds(form.unlockPeriodType) * form.unlockPeriod;
  const cliffDdurationValue = durationSeconds(form.cliffDurationType) * field;

  if (
    cliffDdurationValue < 0 ||
    cliffDdurationValue >= totalDurationSeconds ||
    (cliffDdurationValue > 0 && cliffDdurationValue % unlockPeriodValue !== 0)
  ) {
    console.log(
      { cliffDdurationValue, unlockPeriodValue },
      cliffDdurationValue > 0 && cliffDdurationValue % unlockPeriodValue !== 0,
    );
    return 'Значение должно быть больше либо равно 0 и меньше либо равно общей продолжительности блокировки, делиться без остатка на частоту разблокировки';
  }
};

export const getFriendlyVestingParams = (form: LinearVestingForm) => {
  const totalDurationSeconds = durationSeconds(form.totalDurationType) * form.totalDuration;
  const unlockPeriodValue = durationSeconds(form.unlockPeriodType) * form.unlockPeriod;
  return [
    `Жетоны отправленные на вестинг контракт начиная с ${form.startTime} или ранее будут заблокированы`,
    `Общая продолжительность блокировки составит ${form.totalDuration} (${durationLocale2(form.totalDurationType)})`,
    `Частота разблокировки составит ${form.unlockPeriod} (${durationLocale2(form.unlockPeriodType)})`,
    `Вся сумма депозита будет разбита на ${totalDurationSeconds / unlockPeriodValue} части/ей`,
    `Одна часть выплат состалвяет ~ ${(100 / (totalDurationSeconds / unlockPeriodValue)).toPrecision(4)} % от общего депозита`,
    `Вывод жетонов может осуществить только владелец кошелька по адресу ${form.ownerAddress}`,
  ];
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
