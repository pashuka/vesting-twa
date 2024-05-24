import { useQuery } from '@tanstack/react-query';
import { OpenedContract, beginCell, toNano } from '@ton/core';
import { useState } from 'react';
import { useRecoilState } from 'recoil';
import { LinearVesting, Opcodes } from '../contracts/LinearVesting';
import { withdrawVestingAddressState } from '../state';
import { getAddress } from '../utils';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonClient } from './useTonClient';
import { useTonConnect } from './useTonConnect';

export function useWithdrawJetton() {
  const { client } = useTonClient();
  const { sender } = useTonConnect();
  const [withdrawVestingAddress, setWithdrawVestingAddress] = useRecoilState(
    withdrawVestingAddressState,
  );
  const [sending, setSending] = useState(false);

  const linearVestingContract = useAsyncInitialize(async () => {
    if (!client || !withdrawVestingAddress) return;
    const wa = getAddress(withdrawVestingAddress);
    if (!wa) return;
    const contract = new LinearVesting(wa);
    return client.open(contract) as OpenedContract<LinearVesting>;
  }, [client, withdrawVestingAddress]);

  const queryVesting = useQuery({
    queryKey: ['linear-vesting', linearVestingContract],
    // refetchInterval: 10 * 1000,
    queryFn: async () => {
      if (!linearVestingContract) return null;
      return await linearVestingContract.getVestingData();
    },
  });

  return {
    queryVesting,
    linearVestingAddress: linearVestingContract?.address.toString(),
    withdrawVestingAddress,
    setWithdrawVestingAddress,
    sending,
    withdrawJettons: async () => {
      if (!linearVestingContract) {
        return;
      }
      setSending(true);
      await sender?.send({
        to: linearVestingContract.address,
        value: toNano('0.1'),
        body: beginCell().storeUint(Opcodes.withdraw, 32).storeUint(0, 64).endCell(),
      });
      setSending(false);
    },
  };
}
