import { Address, Cell, Contract, ContractProvider, beginCell } from '@ton/core';

export default class JettonWallet implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  async getBalance(provider: ContractProvider) {
    const { stack } = await provider.get('get_wallet_data', []);
    return stack.readBigNumber();
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
}
