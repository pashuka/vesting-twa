import { useQuery } from '@tanstack/react-query';
import { Address, OpenedContract, fromNano, toNano } from '@ton/core';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import Jetton from '../contracts/Jetton';
import JettonWallet from '../contracts/JettonWallet';
import { LinearVesting } from '../contracts/LinearVesting';
import { deployedVestingAddressState, jettonMasterAddressState } from '../state';
import { getAddress } from '../utils';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonClient } from './useTonClient';
import { useTonConnect } from './useTonConnect';

export function useJettonContract() {
  const { client } = useTonClient();
  const [tonConnectUI] = useTonConnectUI();
  const { sender, network, wallet } = useTonConnect();
  const deployedVestingAddress = useRecoilValue(deployedVestingAddressState);
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

  const queryBalance = useQuery({
    queryKey: ['jetton-wallet-balance', jettonWalletContract, updateBalance],
    // refetchInterval: 5 * 1000,
    queryFn: async () => {
      if (!jettonWalletContract) return null;
      setUpdateBalance(false);
      return (await jettonWalletContract.getBalance()).toString();
    },
  });

  const queryData = useQuery({
    queryKey: ['jetton-master-data', jettonMasterContract],
    // refetchInterval: 5 * 1000,
    queryFn: async () => {
      if (!jettonMasterContract) return null;
      const data = await jettonMasterContract.getJettonData();
      return {
        adminAddress: data.adminAddress.toString(),
        // content: await loadJettonContent(data.content),
        mintable: data.mintable,
        totalSupply: fromNano(data.totalSupply),
      };
    },
  });

  const { data: jettonVestingData, isFetching: jettonVesingIsFetching } = useQuery({
    queryKey: ['jetton-vesting-balance', jettonVestingContract, updateVestingData],
    // refetchInterval: 5 * 1000,
    queryFn: async () => {
      if (!jettonVestingContract) return null;
      if (!jettonVestingContract) return null;
      setUpdateVestingData(false);
      return (await jettonVestingContract.getBalance()).toString();
    },
  });

  return {
    queryVesting,
    queryBalance,
    queryData,
    jettonVestingBalance: jettonVesingIsFetching ? null : jettonVestingData,
    linearVestingAddress: linearVestingContract?.address.toString(),
    jettonMasterAddress,
    setJettonMasterAddress,
    jettonWalletAddress: jettonWalletContract?.address,
    jettonAmount,
    setJettonAmount,
    sending,
    sendJettons: async () => {
      if (!linearVestingContract || !jettonWalletContract) {
        return;
      }
      setSending(true);
      const forwardAmount = toNano('0.05');
      await sender?.send({
        to: jettonWalletContract.address,
        value: toNano('0.1'),
        body: JettonWallet.transferMessage(
          toNano(jettonAmount),
          linearVestingContract.address,
          jettonWalletContract.address,
          null,
          forwardAmount,
          null,
        ),
      });
      setUpdateBalance(true);
      setUpdateVestingData(true);
      setSending(false);
    },
  };
}