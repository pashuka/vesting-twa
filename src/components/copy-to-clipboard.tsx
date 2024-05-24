import { ContentCopy } from '@mui/icons-material';
import { IconButton, Snackbar } from '@mui/joy';
import { useState } from 'react';

export const CopyToClipboard = ({ s }: { s: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton
        color="neutral"
        size="sm"
        sx={{ mx: 0.5, '--IconButton-size': '24px' }}
        onClick={() => {
          setOpen(true);
          navigator.clipboard.writeText(s);
        }}
      >
        <ContentCopy />
      </IconButton>
      <Snackbar
        variant="soft"
        color="success"
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={open}
        onClose={() => setOpen(false)}
        autoHideDuration={1000}
        startDecorator={<ContentCopy />}
        size="sm"
      >
        Адрес скопирован
      </Snackbar>
    </>
  );
};
