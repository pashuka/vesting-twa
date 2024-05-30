import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
} from '@ton/core';

export type LinearVestingConfig = {
  admin_address: Address;
  owner_address: Address;
  start_time: number;
  total_duration: number;
  unlock_period: number;
  cliff_duration: number;
};

export function linearVestingConfigToCell(config: LinearVestingConfig): Cell {
  const vestingParams = beginCell()
    .storeUint(config.start_time, 64)
    .storeUint(config.total_duration, 32)
    .storeUint(config.unlock_period, 32)
    .storeUint(config.cliff_duration, 32)
    .storeCoins(0) // total_deposited
    .storeCoins(0) // total_withdrawals
    .endCell();

  return beginCell()
    .storeAddress(config.admin_address)
    .storeAddress(config.owner_address)
    .storeAddress(null) // jetton_wallet
    .storeRef(vestingParams)
    .endCell();
}

export const Opcodes = {
  withdraw: 0xb5de5f9e,
  upgrade: 0xb766741a,
  terminate: 0x6c95e810,
  excesses: 0x3a70c2c,
};

export class LinearVesting implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell },
  ) {}

  static createFromAddress(address: Address) {
    return new LinearVesting(address);
  }

  static createFromConfig(config: LinearVestingConfig, code: Cell, workchain = 0) {
    const data = linearVestingConfigToCell(config);
    const init = { code, data };
    return new LinearVesting(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      // bounce: false,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  async sendWithdrawal(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    opts: {
      queryID?: number;
    },
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell()
        .storeUint(Opcodes.withdraw, 32)
        .storeUint(opts.queryID ?? 0, 64)
        .endCell(),
    });
  }

  async getVestingData(provider: ContractProvider) {
    const result = await provider.get('get_vesting_data', []);
    return {
      startTime: result.stack.readNumber(),
      totalDuration: result.stack.readNumber(),
      unlockPeriod: result.stack.readNumber(),
      cliffDuration: result.stack.readNumber(),
      totalDeposited: result.stack.readBigNumber(),
      totalWithdrawals: result.stack.readBigNumber(),
      ownerAddress: result.stack.readAddress(),
      // jettonWallet: result.stack.readAddress(),
    };
  }

  async getLockedAmount(provider: ContractProvider, time: number): Promise<bigint> {
    const result = await provider.get('get_locked_amount', [
      {
        type: 'int',
        value: BigInt(time),
      },
    ]);
    return result.stack.readBigNumber();
  }
}
