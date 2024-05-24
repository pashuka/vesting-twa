import { OpenInNew } from '@mui/icons-material';
import { IconButton } from '@mui/joy';
import { truncateLong } from '../../utils';
import { CopyToClipboard } from '../copy-to-clipboard';

type Props = {
  address: string;
};

export const TonviewerLink = ({ address }: Props) => (
  <>
    {truncateLong(address)}
    <CopyToClipboard s={address} />
    <IconButton
      onClick={() => window.open(`https://testnet.tonviewer.com/${address}`, '_blank')}
      size="sm"
      color="primary"
      sx={{ '--IconButton-size': '24px' }}
    >
      <OpenInNew />
    </IconButton>
  </>
);
