import { useQuery } from '@tanstack/react-query';
import { Address, OpenedContract, toNano } from '@ton/core';
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
  const { sender, network, wallet } = useTonConnect();
  const deployedVestingAddress = useRecoilValue(deployedVestingAddressState);
  const [jettonMasterAddress, setJettonMasterAddress] = useRecoilState(jettonMasterAddressState);
  const [jettonAmount, setJettonAmount] = useState(0);

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
    const jettonWalletAddress = await jettonMasterContract!.getWalletAddress(
      Address.parse(wallet!),
    );
    return client!.open(
      new JettonWallet(Address.parse(jettonWalletAddress)),
    ) as OpenedContract<JettonWallet>;
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

  const { data: vestingData, isFetching: vestingIsFetching } = useQuery({
    queryKey: ['linear-vesting', linearVestingContract],
    // refetchInterval: 10 * 1000,
    queryFn: async () => {
      if (!linearVestingContract) return null;
      return await linearVestingContract.getVestingData();
    },
  });

  const { data: jettonWalletData, isFetching: jettonWalletIsFetching } = useQuery({
    queryKey: ['jetton-wallet-balance', jettonWalletContract],
    // refetchInterval: 5 * 1000,
    queryFn: async () => {
      if (!jettonWalletContract) return null;

      return (await jettonWalletContract.getBalance()).toString();
    },
  });

  const { data: jettonVestingData, isFetching: jettonVesingIsFetching } = useQuery({
    queryKey: ['jetton-vesting-balance', jettonVestingContract],
    // refetchInterval: 5 * 1000,
    queryFn: async () => {
      if (!jettonVestingContract) return null;

      return (await jettonVestingContract.getBalance()).toString();
    },
  });

  return {
    vestingData: vestingIsFetching ? null : vestingData,
    jettonBalance: jettonWalletIsFetching ? null : jettonWalletData,
    jettonVestingBalance: jettonVesingIsFetching ? null : jettonVestingData,
    linearVestingAddress: linearVestingContract?.address.toString(),
    jettonMasterAddress,
    setJettonMasterAddress,
    jettonAmount,
    setJettonAmount,
    sendJettons: () => {
      if (!sender.address || !linearVestingContract) return;
      let forwardAmount = toNano('0.05');
      jettonWalletContract?.sendTransfer(
        sender,
        toNano('0.1'), //tons
        BigInt(jettonAmount),
        linearVestingContract.address,
        sender.address,
        null,
        forwardAmount,
        null,
      );
    },
  };
}
