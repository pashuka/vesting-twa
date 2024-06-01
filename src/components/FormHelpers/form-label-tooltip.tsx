import { InfoOutlined } from '@mui/icons-material';
import { Box, Tooltip } from '@mui/joy';

type Props = {
  title: string;
};

export const FormLabelTooltip = ({ title }: Props) => (
  <Tooltip
    title={<Box sx={{ maxWidth: 300, p: 0.5 }}>{title}</Box>}
    variant="solid"
    enterTouchDelay={0}
  >
    <InfoOutlined sx={{ width: 29, color: (t) => t.palette.primary.main, px: 0.5 }} />
  </Tooltip>
);
