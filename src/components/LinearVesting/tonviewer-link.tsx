import { OpenInNew } from '@mui/icons-material';
import { Link } from '@mui/joy';

type Props = {
  address: string;
};

const truncateLong = (s: string, n = 16) => (s.length > n ? s.slice(0, n - 1) + '...' : s);

export const TonviewerLink = ({ address }: Props) => (
  <Link
    href={`https://testnet.tonviewer.com/${address}`}
    target="_blank"
    endDecorator={<OpenInNew sx={{ width: 15 }} />}
  >
    {truncateLong(address)}
  </Link>
);
