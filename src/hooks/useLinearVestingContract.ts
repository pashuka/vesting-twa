import { ColorPaletteProp } from '@mui/joy';
import { useQuery } from '@tanstack/react-query';
import { Address, OpenedContract, StateInit, contractAddress, toNano } from '@ton/core';
import { CHAIN } from '@tonconnect/ui-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRecoilState } from 'recoil';
import { DEFAULT_TESTNET_WALLET_2, VESTING_CONTRACT_CODE, WORKCHAIN } from '../constants';
import {
  LinearVesting,
  LinearVestingConfig,
  linearVestingConfigToCell,
} from '../contracts/LinearVesting';
import { deployedVestingAddressState } from '../state';
import { LinearVestingForm, durationTypes } from '../types';
import {
  debounce,
  getInputDateFormat,
  prepareLinearVestingConfig,
  sleep,
  today,
  truncateLong,
  waitForContractDeploy,
} from '../utils';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonClient } from './useTonClient';
import { useTonConnect } from './useTonConnect';

type FormHelperTextMessage = {
  loading?: boolean;
  address?: string;
  message: string;
  color: ColorPaletteProp;
};

export function useLinearVestingContract() {
  const { client } = useTonClient();
  const { sender, network, wallet } = useTonConnect();
  const [deployedAdress, setDeployedAdress] = useRecoilState(deployedVestingAddressState);
  const [checkDeployed, setCheckDeployed] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [vestingExistMessage, setVestingExistMessage] = useState<FormHelperTextMessage>();
  const [deployMessages, setDeployMessages] = useState<FormHelperTextMessage[]>([]);
  const addDeployMessage = useCallback(
    (msg: FormHelperTextMessage) => setDeployMessages((curr) => [...curr, msg]),
    [setDeployMessages],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isValid: isValidForm, errors },
  } = useForm<LinearVestingForm>({
    mode: 'all',
    defaultValues: {
      // adminAddress: wallet ? Address.parse(wallet).toString() : undefined,
      ownerAddress: network === CHAIN.TESTNET ? DEFAULT_TESTNET_WALLET_2 : '',
      cliffDuration: 0,
      cliffDurationType: durationTypes[0],
      startTime: getInputDateFormat(today()),
      totalDuration: 100,
      totalDurationType: durationTypes[2],
      unlockPeriod: 1,
      unlockPeriodType: durationTypes[2],
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

  useEffect(() => {
    if (wallet) {
      setValue('adminAddress', Address.parse(wallet).toString());
    }
  }, [wallet]);

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
    if (!client) return;

    setDeploying(true);

    // check before deploy
    const initialData = linearVestingConfigToCell(config);
    const linearVestingStateInit: StateInit = {
      data: initialData,
      code: VESTING_CONTRACT_CODE,
    };
    const checkAddress = contractAddress(WORKCHAIN, linearVestingStateInit);
    const vestingAddress = truncateLong(checkAddress.toString());

    addDeployMessage({
      loading: true,
      message: `Поиск контракта на основе текущих параметров: ${vestingAddress}`,
      color: 'neutral',
    });

    if (await client?.isContractDeployed(checkAddress)) {
      addDeployMessage({
        address: checkAddress.toString(),
        message: `Контракт с текущими параметрами уже в сети:`,
        color: 'success',
      });
      setDeployedAdress(checkAddress.toString());
      return;
    }
    await sleep(1500);
    addDeployMessage({ message: `Вестинг контракта в сети не обнаружено`, color: 'warning' });
    await sleep(1500);

    const linearVesting = client?.open(
      LinearVesting.createFromConfig(config, VESTING_CONTRACT_CODE),
    );
    addDeployMessage({
      message: `Деплой контракта с адресом ${vestingAddress} в сеть ${(network === CHAIN.MAINNET ? 'mainnet' : 'testnet').toLocaleUpperCase()}`,
      color: 'neutral',
    });
    await sender?.send({
      to: linearVesting.address,
      value: toNano('0.1'),
      init: linearVestingStateInit,
    });
    await waitForContractDeploy(linearVesting.address, client);
    addDeployMessage({
      address: checkAddress.toString(),
      message: `Контракт успешно отправлен в сеть и доступен по адресу:`,
      color: 'success',
    });
    setCheckDeployed(true);
    setDeploying(false);
  };

  const checkDeploymentStatus = async () => {
    setCheckDeployed(true);
    const params = watch();
    if (
      !params.adminAddress ||
      params.adminAddress.length === 0 ||
      !params.ownerAddress ||
      params.ownerAddress.length === 0
    )
      return;
    const config = prepareLinearVestingConfig(params);
    if (!config.owner_address) return;
    const initialData = linearVestingConfigToCell(config);
    const linearVestingStateInit: StateInit = {
      data: initialData,
      code: VESTING_CONTRACT_CODE,
    };
    const checkAddress = contractAddress(WORKCHAIN, linearVestingStateInit);

    setVestingExistMessage({
      loading: true,
      address: checkAddress.toString(),
      message: `Поиск вестинг контракта: в сети`,
      color: 'neutral',
    });
    await sleep(1500);
    if (await client?.isContractDeployed(checkAddress)) {
      setVestingExistMessage({
        address: checkAddress.toString(),
        message: `Вестинг контракт с текущими параметрами уже в сети:`,
        color: 'success',
      });
      setDeployedAdress(checkAddress.toString());
      return;
    }
    await sleep(1500);
    setVestingExistMessage({
      message: `Вестинг контракта с текущими параметрами в сети не обнаружено, а значит его можно создать`,
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
