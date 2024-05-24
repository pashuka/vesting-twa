import { Address, Cell, Contract, ContractProvider, beginCell } from '@ton/core';

export default class Jetton implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  async getWalletAddress(provider: ContractProvider, forAddress: Address) {
    const { stack } = await provider.get('get_wallet_address', [
      { type: 'slice', cell: beginCell().storeAddress(forAddress).endCell() },
    ]);

    return stack.readAddress().toString();
  }

  async getJettonData(provider: ContractProvider) {
    const res = await provider.get('get_jetton_data', []);
    const totalSupply = res.stack.readBigNumber();
    const mintable = res.stack.readBoolean();
    const adminAddress = res.stack.readAddress();
    const content = res.stack.readCell();
    const walletCode = res.stack.readCell();

    return {
      totalSupply,
      mintable,
      adminAddress,
      content,
      walletCode,
    };
  }
}
