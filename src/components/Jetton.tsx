import { useJettonContract } from '../hooks/useJettonContract-legacy';
import { useTonConnect } from '../hooks/useTonConnect';
import { Button, Card, Ellipsis, FlexBoxCol, FlexBoxRow } from './styled/styled';

export function Jetton() {
  const { connected } = useTonConnect();
  const { mint, jettonWalletAddress, balance } = useJettonContract();

  return (
    <Card title="Jetton">
      <FlexBoxCol>
        <h3>Jetton</h3>
        <FlexBoxRow>
          Wallet
          <Ellipsis>{jettonWalletAddress}</Ellipsis>
        </FlexBoxRow>
        <FlexBoxRow>
          Balance
          <div>{balance ?? 'Loading...'}</div>
        </FlexBoxRow>
        <Button
          disabled={!connected || true}
          onClick={async () => {
            mint();
          }}
        >
          Mint jettons
        </Button>
      </FlexBoxCol>
    </Card>
  );
}
