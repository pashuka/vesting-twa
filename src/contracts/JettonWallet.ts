import { Address, Cell, Contract, ContractProvider, SendMode, Sender, beginCell } from '@ton/core';
import { fromNano } from '@ton/ton';

export default class JettonWallet implements Contract {
  async getBalance(provider: ContractProvider) {
    const { stack } = await provider.get('get_wallet_data', []);
    return fromNano(stack.readBigNumber());
  }

  static transferMessage(
    jetton_amount: bigint,
    to: Address,
    responseAddress: Address,
    customPayload: Cell | null,
    forward_ton_amount: bigint,
    forwardPayload: Cell | null,
  ) {
    return beginCell()
      .storeUint(0xf8a7ea5, 32)
      .storeUint(0, 64) // op, queryId
      .storeCoins(jetton_amount)
      .storeAddress(to)
      .storeAddress(responseAddress)
      .storeMaybeRef(customPayload)
      .storeCoins(forward_ton_amount)
      .storeMaybeRef(forwardPayload)
      .endCell();
  }
  async sendTransfer(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    jetton_amount: bigint,
    to: Address,
    responseAddress: Address,
    customPayload: Cell | null,
    forward_ton_amount: bigint,
    forwardPayload: Cell | null,
  ) {
    await provider.internal(via, {
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: JettonWallet.transferMessage(
        jetton_amount,
        to,
        responseAddress,
        customPayload,
        forward_ton_amount,
        forwardPayload,
      ),
      value: value,
    });
  }

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}
}
