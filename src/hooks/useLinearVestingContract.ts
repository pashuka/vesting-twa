import { ColorPaletteProp } from '@mui/joy';
import { useQuery } from '@tanstack/react-query';
import { Address, OpenedContract, StateInit, contractAddress, toNano } from '@ton/core';
import { CHAIN } from '@tonconnect/ui-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilState } from 'recoil';
import { DEFAULT_TESTNET_WALLET_2, VESTING_CONTRACT_CODE, WORKCHAIN } from '../constants';
import { LinearVesting, linearVestingConfigToCell } from '../contracts/LinearVesting';
import { deployedVestingAddressState } from '../state';
import { LinearVestingConfig, LinearVestingForm, durationTypes } from '../types';
import { debounce, getInputDateFormat, prepareLinearVestingConfig, sleep, today } from '../utils';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonClient } from './useTonClient';
import { useTonConnect } from './useTonConnect';

type FormHelperTextMessage = {
  message: string;
  color: ColorPaletteProp;
};

export function useLinearVestingContract() {
  const { client } = useTonClient();
  const { sender, network } = useTonConnect();
  const [deployedAdress, setDeployedAdress] = useRecoilState(deployedVestingAddressState);
  const [checkDeployed, setCheckDeployed] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [vestingExistMessage, setVestingExistMessage] = useState<FormHelperTextMessage>();
  const [deployMessages, setDeployMessages] = useState<FormHelperTextMessage[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid: isValidForm, errors },
  } = useForm<LinearVestingForm>({
    mode: 'all',
    defaultValues: {
      cliffDuration: 0,
      cliffDurationType: durationTypes[0],
      ownerAddress: DEFAULT_TESTNET_WALLET_2,
      startTime: getInputDateFormat(today()),
      totalDuration: 1,
      totalDurationType: durationTypes[1],
      unlockPeriod: 1,
      unlockPeriodType: durationTypes[0],
    },
  });
  const {
    startTime,
    totalDuration,
    totalDurationType,
    unlockPeriod,
    unlockPeriodType,
    cliffDuration,
    cliffDurationType,
    ownerAddress,
  } = watch();

  const linearVestingContract = useAsyncInitialize(async () => {
    if (!client || !deployedAdress) return;
    const contract = new LinearVesting(Address.parse(deployedAdress));
    return client.open(contract) as OpenedContract<LinearVesting>;
  }, [client, deployedAdress]);

  const { data: vestingData, isFetching: vestingIsFetching } = useQuery({
    queryKey: ['linear-vesting', linearVestingContract, deployedAdress],
    queryFn: async () => {
      if (!linearVestingContract) return null;
      return await linearVestingContract.getVestingData();
    },
  });

  const sendDeploy = async (config: LinearVestingConfig) => {
    setDeploying(true);

    // check before deploy
    const initialData = linearVestingConfigToCell(config);
    const linearVestingStateInit: StateInit = {
      data: initialData,
      code: VESTING_CONTRACT_CODE,
    };
    const checkAddress = contractAddress(WORKCHAIN, linearVestingStateInit);

    setDeployMessages((v) => [
      ...v,
      {
        message: `Проверяем адрес вестинг контракта на основе текущих параметров: ${checkAddress.toString()}`,
        color: 'neutral',
      },
    ]);

    if (await client?.isContractDeployed(checkAddress)) {
      setDeployMessages((v) => [
        ...v,
        { message: `Вестинг контракт с текущими параметрами уже в сети`, color: 'success' },
      ]);
      setDeployedAdress(checkAddress.toString());
      return;
    }

    await sleep(1500);
    setDeployMessages((v) => [
      ...v,
      { message: `Вестинг контракта в сети не обнаружено`, color: 'warning' },
    ]);

    await sleep(1500);

    // const walletContract = WalletContractV4.create({ publicKey: Buffer.from(wallet?.account.publicKey!), workchain: 0 });
    // const seqno = await walletContract.getSeqno();
    // const a: WalletContractV4

    const linearVesting = client?.open(
      LinearVesting.createFromConfig(config, VESTING_CONTRACT_CODE),
    );
    setDeployMessages((v) => [
      ...v,
      {
        message: `Деплой ${linearVesting?.address} в сеть ${(network === CHAIN.MAINNET ? 'mainnet' : 'testnet').toLocaleUpperCase()}`,
        color: 'success',
      },
    ]);
    if (!linearVesting) {
      return;
    }
    // const deployResult = await linearVesting?.sendDeploy(sender, toNano('0.1'));
    await sender?.send({
      to: linearVesting.address,
      value: toNano('0.1'),
      init: linearVestingStateInit,
    });
    // if (deployResult) {
    //   setDeployMessages((v) => [...v, `Транзакция отправлена в сеть`]);
    // } else {
    //   setDeployMessages((v) => [...v, `Ошибка отправки транзакции`]);
    // }

    // setDeploying(false);
  };
  const checkDeploymentStatus = async () => {
    setCheckDeployed(true);
    const config = prepareLinearVestingConfig(watch());
    const initialData = linearVestingConfigToCell(config);
    const linearVestingStateInit: StateInit = {
      data: initialData,
      code: VESTING_CONTRACT_CODE,
    };
    const checkAddress = contractAddress(WORKCHAIN, linearVestingStateInit);

    setVestingExistMessage({
      message: `Поиск вестинг контракта: ${checkAddress.toString()} в сети...`,
      color: 'neutral',
    });
    await sleep(1500);
    if (await client?.isContractDeployed(checkAddress)) {
      setVestingExistMessage({
        message: `Вестинг контракт с текущими параметрами уже в сети: ${checkAddress.toString()}`,
        color: 'success',
      });
      setDeployedAdress(checkAddress.toString());
      return;
    }
    await sleep(1500);
    setVestingExistMessage({
      message: `Вестинг контракта ${checkAddress.toString()} с текущими параметрами в сети не обнаружено, значит будет еще деплой вестинг контракта перед отправкой жетонов`,
      color: 'warning',
    });
    setCheckDeployed(false);
  };

  const debouncedHandleCheckDeployment = useMemo(
    () => debounce(checkDeploymentStatus, 2500, true),
    [checkDeploymentStatus],
  );

  useEffect(() => {
    if (!client) return;
    debouncedHandleCheckDeployment();
  }, [
    client,
    startTime,
    totalDuration,
    totalDurationType,
    unlockPeriod,
    unlockPeriodType,
    cliffDuration,
    cliffDurationType,
    ownerAddress,
  ]);

  return {
    value: vestingIsFetching ? null : vestingData,
    address: linearVestingContract?.address.toString(),
    sendDeploy,
    deployMessages,
    deploying,
    checkDeployed,
    deployedContractAdress: deployedAdress,
    vestingExistMessage,
    // form
    register,
    handleSubmit,
    watch,
    setValue,
    errors,
    isValidForm,
  };
}
