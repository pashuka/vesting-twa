import { useQuery } from '@tanstack/react-query';
import { Address, OpenedContract } from '@ton/core';
import { CHAIN } from '@tonconnect/protocol';
import Counter from '../contracts/counter';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonClient } from './useTonClient';
import { useTonConnect } from './useTonConnect';

export function useCounterContract() {
  const { client } = useTonClient();
  const { sender, network } = useTonConnect();

  const counterContract = useAsyncInitialize(async () => {
    if (!client) return;
    const contract = new Counter(
      Address.parse(
        network === CHAIN.MAINNET
          ? 'EQBPEDbGdwaLv1DKntg9r6SjFIVplSaSJoJ-TVLe_2rqBOmH'
          : 'EQBYLTm4nsvoqJRvs_L-IGNKwWs5RKe19HBK_lFadf19FUfb',
      ), // replace with your address from tutorial 2 step 8
    );
    return client.open(contract) as OpenedContract<Counter>;
  }, [client]);

  const { data, isFetching } = useQuery({
    queryKey: ['counter'],
    refetchInterval: 300 * 1000,
    queryFn: async () => {
      if (!counterContract) return null;
      return (await counterContract!.getCounter()).toString();
    },
  });

  return {
    value: isFetching ? null : data,
    address: counterContract?.address.toString(),
    sendIncrement: () => {
      return counterContract?.sendIncrement(sender);
    },
  };
}
