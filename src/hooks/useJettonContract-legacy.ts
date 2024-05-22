import { useQuery } from '@tanstack/react-query';
import { Address, OpenedContract } from '@ton/core';
import Jetton from '../contracts/Jetton';
import JettonWallet from '../contracts/JettonWallet';
import { useAsyncInitialize } from './useAsyncInitialize';
import { useTonClient } from './useTonClient';
import { useTonConnect } from './useTonConnect';

export function useJettonContract() {
  const { wallet, sender } = useTonConnect();
  const { client } = useTonClient();

  const jettonContract = useAsyncInitialize(async () => {
    if (!client || !wallet) return;
    const contract = new Jetton(Address.parse('EQCPibTvi3oGBXRjXh86SSrYicPXgf-3_9BzOCh-iFssVTuF'));
    return client.open(contract) as OpenedContract<Jetton>;
  }, [client, wallet]);

  const jwContract = useAsyncInitialize(async () => {
    if (!jettonContract || !client) return;
    const jettonWalletAddress = await jettonContract!.getWalletAddress(Address.parse(wallet!));
    return client!.open(
      new JettonWallet(Address.parse(jettonWalletAddress)),
    ) as OpenedContract<JettonWallet>;
  }, [jettonContract, client]);

  const { data, isFetching } = useQuery({
    queryKey: ['jetton'],
    refetchInterval: 500 * 1000,
    queryFn: async () => {
      if (!jwContract) return null;

      return (await jwContract.getBalance()).toString();
    },
  });

  return {
    mint: () => {
      jettonContract?.sendMintFromFaucet(sender, Address.parse(wallet!));
    },
    jettonWalletAddress: jwContract?.address.toString(),
    balance: isFetching ? null : data,
  };
}
