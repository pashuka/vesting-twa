import { CurrencyBitcoin, Paid, Token } from '@mui/icons-material';
import { ListItemDecorator, Tab, TabList, TabPanel, Tabs, tabClasses } from '@mui/joy';
import { TonConnectButton } from '@tonconnect/ui-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import { DeployVestingTab } from './deploy-vesting-tab';
import { SendJettonsTab } from './send-jettons-tab';
import { WithdrawJettonsTab } from './withdraw-jettons-tab';

dayjs.locale('ru');

export const LinearVesting = () => (
  <>
    <TonConnectButton />
    <Tabs
      variant="outlined"
      aria-label="Pricing plan"
      defaultValue={0}
      sx={{
        borderRadius: 'lg',
        boxShadow: 'sm',
        overflow: 'auto',
      }}
    >
      <TabList
        disableUnderline
        tabFlex={1}
        sx={{
          [`& .${tabClasses.root}`]: {
            [`&[aria-selected="true"]`]: {
              color: 'primary.500',
              bgcolor: 'background.surface',
            },
            [`&.${tabClasses.focusVisible}`]: {
              outlineOffset: '-4px',
            },
          },
        }}
      >
        <Tab disableIndicator variant="soft" sx={{ flexGrow: 1 }}>
          <ListItemDecorator>
            <Token />
          </ListItemDecorator>
          Вестинг контракт
        </Tab>
        <Tab disableIndicator variant="soft" sx={{ flexGrow: 1 }}>
          <ListItemDecorator>
            <Paid />
          </ListItemDecorator>
          Пополнить депозит
        </Tab>
        <Tab disableIndicator variant="soft" sx={{ flexGrow: 1 }}>
          <ListItemDecorator>
            <CurrencyBitcoin />
          </ListItemDecorator>
          Вывод жетонов
        </Tab>
      </TabList>
      <TabPanel value={0}>
        <DeployVestingTab />
      </TabPanel>
      <TabPanel value={1}>
        <SendJettonsTab />
      </TabPanel>
      <TabPanel value={2}>
        <WithdrawJettonsTab />
      </TabPanel>
    </Tabs>
  </>
);
