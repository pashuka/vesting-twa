import { OpenInNew } from '@mui/icons-material';
import { Link } from '@mui/joy';
import { truncateLong } from '../../utils';

type Props = {
  address: string;
};

export const TonviewerLink = ({ address }: Props) => (
  <Link
    href={`https://testnet.tonviewer.com/${address}`}
    target="_blank"
    endDecorator={<OpenInNew sx={{ width: 15 }} />}
  >
    {truncateLong(address)}
  </Link>
);
