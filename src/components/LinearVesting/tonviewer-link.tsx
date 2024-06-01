import { OpenInNew } from '@mui/icons-material';
import { IconButton } from '@mui/joy';
import { truncateLong } from '../../utils';
import { CopyToClipboard } from '../copy-to-clipboard';

type Props = {
  address: string;
  title?: string;
  withCopy?: boolean;
  testnet?: boolean;
};

export const TonviewerLink = ({ address, title, withCopy = true, testnet = false }: Props) => (
  <>
    {truncateLong(address)}
    {withCopy && <CopyToClipboard s={address} />}
    <IconButton
      onClick={() =>
        window.open(`https://${testnet ? 'testnet.' : ''}tonviewer.com/${address}`, '_blank')
      }
      size="sm"
      color="primary"
      sx={{ '--IconButton-size': '24px' }}
    >
      <OpenInNew />
    </IconButton>
  </>
);
