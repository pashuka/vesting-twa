import { Address, Cell, Contract, ContractProvider } from '@ton/core';
import { fromNano } from '@ton/ton';

export default class JettonWallet implements Contract {
  async getBalance(provider: ContractProvider) {
    const { stack } = await provider.get('get_wallet_data', []);
    return fromNano(stack.readBigNumber());
  }

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}
}
