import { Paid, Token } from '@mui/icons-material';
import { ListItemDecorator, Tab, TabList, TabPanel, Tabs } from '@mui/joy';
import { TonConnectButton } from '@tonconnect/ui-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import { DeployVestingTab } from './deploy-vesting-tab';
import { SendJettonsTab } from './send-jettons-tab';

dayjs.locale('ru');

export const LinearVesting = () => (
  <>
    <TonConnectButton />
    <Tabs variant="plain" color="neutral" defaultValue={0}>
      <TabList disableUnderline tabFlex={1}>
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
          Депозит инвестора
        </Tab>
        {/* <Tab disableIndicator variant="soft" sx={{ flexGrow: 1 }}>
          <ListItemDecorator>
            <CurrencyBitcoin />
          </ListItemDecorator>
          Вывод жетонов
        </Tab> */}
      </TabList>
      <TabPanel value={0}>
        <DeployVestingTab />
      </TabPanel>
      <TabPanel value={1}>
        <SendJettonsTab />
      </TabPanel>
      {/* <TabPanel value={2}>
        <WithdrawJettonsTab />
      </TabPanel> */}
    </Tabs>
  </>
);
