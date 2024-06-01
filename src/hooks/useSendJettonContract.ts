import { useQuery } from '@tanstack/react-query';
import { Address, OpenedContract, beginCell, fromNano, toNano } from '@ton/core';
import { useState } from 'react';
import { useRecoilState } from 'recoil';
import { DEFAULT_DECIMAL_PLACES } from '../constants';
import Jetton from '../contracts/Jetton';
import JettonWallet from '../contracts/JettonWallet';
import { LinearVesting, Opcodes } from '../contracts/LinearVesting';
import { getJettonMetadata } from '../metadata';
import { deployedVestingAddressState, jettonMasterAddressState } from '../state';
import { getAddress, toDecimal, waitForSeqno } from '../utils';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonClient } from './useTonClient';
import { useTonConnect } from './useTonConnect';

export const SPINTRIA_MASTER_ADDRESS = 'EQACLXDwit01stiqK9FvYiJo15luVzfD5zU8uwDSq6JXxbP8';

export function useJettonContract() {
  const { client } = useTonClient();
  const { sender, wallet } = useTonConnect();
  const [deployedVestingAddress, setDeployedVestingAddress] = useRecoilState(
    deployedVestingAddressState,
  );
  const [jettonMasterAddress, setJettonMasterAddress] = useRecoilState(jettonMasterAddressState);
  const [jettonAmount, setJettonAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [updateBalance, setUpdateBalance] = useState(true);
  const [updateVestingData, setUpdateVestingData] = useState(true);
  const linearVestingContract = useAsyncInitialize(async () => {
    if (!client || !deployedVestingAddress) return;
    const contract = new LinearVesting(Address.parse(deployedVestingAddress));
    return client.open(contract) as OpenedContract<LinearVesting>;
  }, [client, deployedVestingAddress]);

  const jettonMasterContract = useAsyncInitialize(async () => {
    if (!client || !wallet || !jettonMasterAddress) return;
    const jettonAdress = getAddress(jettonMasterAddress);
    if (!jettonAdress) return;
    const contract = new Jetton(jettonAdress);
    return client.open(contract) as OpenedContract<Jetton>;
  }, [client, wallet, jettonMasterAddress]);

  const jettonWalletContract = useAsyncInitialize(async () => {
    if (!jettonMasterContract || !client) return;
    const jwAddress = await jettonMasterContract!.getWalletAddress(Address.parse(wallet!));
    return client!.open(new JettonWallet(Address.parse(jwAddress))) as OpenedContract<JettonWallet>;
  }, [jettonMasterContract, client]);

  const jettonVestingContract = useAsyncInitialize(async () => {
    if (!jettonMasterContract || !client || !linearVestingContract) return;
    const jettonVestingAddress = await jettonMasterContract!.getWalletAddress(
      linearVestingContract.address,
    );

    return client!.open(
      new JettonWallet(Address.parse(jettonVestingAddress)),
    ) as OpenedContract<JettonWallet>;
  }, [jettonMasterContract, client, linearVestingContract]);

  const queryVesting = useQuery({
    queryKey: ['linear-vesting', linearVestingContract],
    // refetchInterval: 10 * 1000,
    queryFn: async () => {
      if (!linearVestingContract) return null;
      return await linearVestingContract.getVestingData();
    },
  });

  const queryJettonMetaData = useQuery({
    queryKey: ['jetton-master-data', jettonMasterContract],
    // refetchInterval: 5 * 1000,
    queryFn: async () => {
      if (!jettonMasterContract) return null;
      const data = await jettonMasterContract.getJettonData();

      return {
        adminAddress: data.adminAddress.toString(),
        content: await getJettonMetadata(data.content),
        mintable: data.mintable,
        totalSupply: fromNano(data.totalSupply),
      };
    },
  });

  const queryBalance = useQuery({
    queryKey: ['jetton-wallet-balance', jettonWalletContract, updateBalance, queryJettonMetaData],
    // refetchInterval: 5 * 1000,
    queryFn: async () => {
      if (!jettonWalletContract || !queryJettonMetaData.data) return null;
      setUpdateBalance(false);
      const { content } = queryJettonMetaData.data;
      const decimals = content?.decimals ? Number(content.decimals) : DEFAULT_DECIMAL_PLACES;
      const balance = await jettonWalletContract.getBalance();
      return toDecimal(balance, decimals);
      // return fromNano(balance);
    },
  });

  const { data: jettonVestingData, isFetching: jettonVesingIsFetching } = useQuery({
    queryKey: ['jetton-vesting-balance', jettonVestingContract, updateVestingData],
    // refetchInterval: 5 * 1000,
    queryFn: async () => {
      if (!jettonVestingContract) return null;
      if (!jettonVestingContract) return null;
      setUpdateVestingData(false);
      const balance = await jettonVestingContract.getBalance();
      return fromNano(balance);
    },
  });

  return {
    queryVesting,
    isVestingFinished: !!(
      queryVesting.data &&
      queryVesting.data.totalDeposited !== 0n &&
      queryVesting.data.totalDeposited === queryVesting.data.totalWithdrawals
    ),
    queryBalance,
    queryJettonMetaData,
    jettonVestingBalance: jettonVesingIsFetching ? null : jettonVestingData,
    linearVestingAddress: linearVestingContract?.address.toString(),
    jettonMasterAddress,
    setJettonMasterAddress,
    jettonWalletAddress: jettonWalletContract?.address,
    jettonAmount,
    jettonAmountNumber: Number((jettonAmount || '0').split(' ').join('')),
    setJettonAmount,
    deployedVestingAddress,
    setDeployedVestingAddress,
    sending,
    sendJettons: async () => {
      if (!client || !wallet || !linearVestingContract || !jettonWalletContract) {
        return;
      }
      setSending(true);

      const waiter = await waitForSeqno(client, Address.parse(wallet));

      const jettonAmountNumber = Number((jettonAmount || '0').split(' ').join(''));

      await sender?.send({
        to: jettonWalletContract.address,
        value: toNano('0.1'),
        body: JettonWallet.transferMessage(
          toNano(jettonAmountNumber),
          linearVestingContract.address,
          jettonWalletContract.address,
          null,
          toNano('0.05'),
          null,
        ),
      });

      try {
        await waiter();
      } catch (error) {}

      setUpdateBalance(true);
      setUpdateVestingData(true);
      setSending(false);
    },
    terminateContract: async () => {
      if (!client || !wallet || !linearVestingContract) {
        return;
      }

      setSending(true);
      const waiter = await waitForSeqno(client, Address.parse(wallet));

      await sender?.send({
        to: linearVestingContract.address,
        value: toNano('0.1'),
        body: beginCell().storeUint(Opcodes.terminate, 32).storeUint(0, 64).endCell(),
      });

      try {
        await waiter();
      } catch (error) {}

      setSending(false);
    },
  };
}
