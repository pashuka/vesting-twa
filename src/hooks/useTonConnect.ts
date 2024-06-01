import { Cell, Sender, SenderArguments, beginCell, storeStateInit } from '@ton/core';
import { CHAIN } from '@tonconnect/protocol';
import { SendTransactionRequest, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';

type ExtendedSender = Sender & {
  sendBulk(args: SenderArguments[]): Promise<void>;
};

export function useTonConnect(): {
  sender: ExtendedSender;
  connected: boolean;
  wallet: string | null;
  network: CHAIN | null;
  isMainnet?: boolean;
} {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  return {
    sender: {
      send: async (args: SenderArguments) => {
        let stateCell = new Cell();
        if (args.init) {
          stateCell = beginCell().store(storeStateInit(args.init)).endCell();
        }
        tonConnectUI.sendTransaction({
          messages: [
            {
              address: args.to.toString(),
              amount: args.value.toString(),
              stateInit: args.init ? stateCell.toBoc().toString('base64') : undefined,
              payload: args.body?.toBoc().toString('base64'),
            },
          ],
          validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes for user to approve
        });
      },
      sendBulk: async (args: SenderArguments[]) => {
        const messages: SendTransactionRequest['messages'] = [];
        if (args.length === 0) return;
        args.forEach((f) => {
          let stateCell = new Cell();
          if (f.init) {
            stateCell = beginCell().store(storeStateInit(f.init)).endCell();
          }
          messages.push({
            address: f.to.toString(),
            amount: f.value.toString(),
            stateInit: f.init ? stateCell.toBoc().toString('base64') : undefined,
            payload: f.body?.toBoc().toString('base64'),
          });
        });
        tonConnectUI.sendTransaction({
          messages,
          validUntil: Date.now() + 5 * 60 * 1000, // 5 minutes for user to approve
        });
      },
    },
    connected: !!wallet?.account.address,
    wallet: wallet?.account.address ?? null,
    network: wallet?.account.chain ?? null,
    isMainnet: wallet ? wallet?.account.chain === CHAIN.MAINNET : undefined,
  };
}
