import { useRecoilState } from 'recoil';
import { LinearVestingConfig } from '../contracts/LinearVesting';
import { listDeployedContractsState } from '../state/list-deployed-contracts-state';
import { tinyLinearVestingConfig } from '../utils';

export function useListDeployedContracts() {
  const [listDeployedContracts, setListDeployedContracts] = useRecoilState(
    listDeployedContractsState,
  );

  return {
    listDeployedContracts,
    addDeployedContract: (value: LinearVestingConfig) =>
      setListDeployedContracts((curr) => [...curr, tinyLinearVestingConfig(value)]),
  };
}
