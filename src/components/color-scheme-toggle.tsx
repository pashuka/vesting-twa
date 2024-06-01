import { DarkModeRounded, LightMode } from '@mui/icons-material';
import { IconButton, IconButtonProps, useColorScheme } from '@mui/joy';
import { useEffect, useState } from 'react';

export default function ColorSchemeToggle(props: IconButtonProps) {
  const { onClick, sx, ...other } = props;
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <IconButton size="sm" variant="outlined" color="neutral" {...other} sx={sx} disabled />;
  }
  return (
    <IconButton
      id="toggle-mode"
      size="sm"
      variant="outlined"
      color="neutral"
      {...other}
      onClick={(event) => {
        setMode(mode === 'light' ? 'dark' : 'light');
        onClick?.(event);
      }}
      sx={[
        {
          '& > *:first-child': {
            display: mode === 'dark' || mode === 'system' ? 'none' : 'initial',
          },
          '& > *:last-child': {
            display: mode === 'light' ? 'none' : 'initial',
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <DarkModeRounded />
      <LightMode />
    </IconButton>
  );
}
