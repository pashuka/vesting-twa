import { Box, Button, CssBaseline, CssVarsProvider, Stack } from '@mui/joy';
import { CHAIN } from '@tonconnect/protocol';
import { TonConnectButton } from '@tonconnect/ui-react';
import '@twa-dev/sdk';
import { LinearVesting } from './components/LinearVesting';
import ColorSchemeToggle from './components/color-scheme-toggle';
import { useTonConnect } from './hooks/useTonConnect';

// const StyledApp = styled.div`
//   background-color: #e8e8e8;
//   color: black;

//   @media (prefers-color-scheme: dark) {
//     // background-color: #222;
//     // color: white;
//   }
//   min-height: 100vh;
//   padding: 20px 20px;
// `;

// const AppContainer = styled.div`
//   max-width: 900px;
//   margin: 0 auto;
// `;

function App() {
  const { network } = useTonConnect();

  return (
    <CssVarsProvider disableTransitionOnChange defaultMode="system" modeStorageKey={'twa-mode'}>
      <CssBaseline />
      <Stack justifyContent="center" alignItems="center" minHeight="100dvh">
        <Stack
          spacing={2}
          display="flex"
          flexDirection="column"
          maxWidth="900px"
          width="100%"
          py={4}
          px={1}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            px={1}
          >
            <Box display="flex" flexDirection="row">
              <TonConnectButton />
              <Button disabled variant="solid" sx={{ mx: 1 }}>
                {network ? (network === CHAIN.MAINNET ? 'mainnet' : 'testnet') : 'N/A'}
              </Button>
            </Box>
            <ColorSchemeToggle />
          </Stack>
          <LinearVesting />
          {/* <Counter /> */}
          {/* <TransferTon /> */}
          {/* <Jetton /> */}
        </Stack>
      </Stack>
    </CssVarsProvider>
  );
}

export default App;
