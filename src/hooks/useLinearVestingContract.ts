import { ColorPaletteProp } from '@mui/joy';
import { useQuery } from '@tanstack/react-query';
import { Address, OpenedContract, StateInit, contractAddress, toNano } from '@ton/core';
import { CHAIN } from '@tonconnect/ui-react';
import { useState } from 'react';
import { VESTING_CONTRACT_CODE, WORKCHAIN } from '../constants';
import { LinearVesting, linearVestingConfigToCell } from '../contracts/LinearVesting';
import { LinearVestingConfig } from '../types';
import { sleep } from '../utils';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonClient } from './useTonClient';
import { useTonConnect } from './useTonConnect';

type DeployMessage = {
  message: string;
  color: ColorPaletteProp;
};

export function useLinearVestingContract() {
  const { client } = useTonClient();
  const { sender, network } = useTonConnect();
  const [deployedContractAdress, setDeployedContractAdress] = useState<string>();
  const [deploying, setDeploying] = useState(false);
  const [deployMessages, setDeployMessages] = useState<DeployMessage[]>([]);

  const linearVestingContract = useAsyncInitialize(async () => {
    if (!client || !deployedContractAdress) return;
    const contract = new LinearVesting(
      Address.parse(
        deployedContractAdress,
        // network === CHAIN.MAINNET
        //   ? 'EQBPEDbGdwaLv1DKntg9r6SjFIVplSaSJoJ-TVLe_2rqBOmH'
        //   : 'EQBYLTm4nsvoqJRvs_L-IGNKwWs5RKe19HBK_lFadf19FUfb',
      ),
    );
    return client.open(contract) as OpenedContract<LinearVesting>;
  }, [client, deployedContractAdress]);

  const { data, isFetching } = useQuery({
    queryKey: ['linear-vesting'],
    refetchInterval: 10 * 1000,
    queryFn: async () => {
      if (!linearVestingContract) return null;
      return await linearVestingContract.getVestingData();
    },
  });

  return {
    value: isFetching ? null : data,
    address: linearVestingContract?.address.toString(),
    sendDeploy: async (config: LinearVestingConfig) => {
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
        setDeployedContractAdress(checkAddress.toString());
        return;
      }

      await sleep(2000);
      setDeployMessages((v) => [
        ...v,
        { message: `Вестинг контракта в сети не обнаружено`, color: 'warning' },
      ]);

      await sleep(2000);

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
    },
    deployMessages,
    deploying,
    deployedContractAdress,
  };
}
