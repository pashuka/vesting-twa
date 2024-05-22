import { Box, Button, FormControl, FormHelperText, FormLabel, Input } from '@mui/joy';
import * as dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import { useJettonContract } from '../../hooks/useJettonContract';
import { useTonConnect } from '../../hooks/useTonConnect';

dayjs.locale('ru');

export function SendJettonsTab() {
  const { connected, network } = useTonConnect();
  const {
    linearVestingAddress,
    jettonMasterAddress,
    setJettonMasterAddress,
    jettonBalance,
    jettonAmount,
    setJettonAmount,
    sendJettons,
  } = useJettonContract();
  const onSubmit = () => {
    // sendDeploy(prepareLinearVestingConfig(data));
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <FormControl>
        <FormLabel>Адрес кошелька жетонов отправителя</FormLabel>
        <Input
          type="text"
          placeholder="укажите адрес кошелька жетонов откуда будут отправлены монеты на вестинг контракт"
          // EQCPibTvi3oGBXRjXh86SSrYicPXgf-3_9BzOCh-iFssVTuF
          value={jettonMasterAddress?.toString() || ''}
          onChange={(e) => setJettonMasterAddress(e.target.value)}
        />
        <FormHelperText>
          {jettonBalance ? `${Number(jettonBalance).toLocaleString()} JETTONS` : '...'}
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>Укажите сумму жетонов</FormLabel>
        <Input
          disabled={!jettonBalance}
          type="number"
          placeholder="укажите сумму жетонов"
          value={jettonAmount}
          onChange={(e) => setJettonAmount(Number(e.target.value))}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Адрес вестинг контракта</FormLabel>
        <Input type="text" placeholder="не указан" value={linearVestingAddress || ''} disabled />
        <FormHelperText>
          {linearVestingAddress
            ? ''
            : 'Будет указан после деплоя вестинг-контракта из предыдущей вкладки'}
        </FormHelperText>
      </FormControl>
      <Button
        type="submit"
        disabled={!connected || !jettonBalance || jettonAmount === 0 || !linearVestingAddress}
        onClick={() => sendJettons()}
      >
        Отправить жетоны на вестинг контракт
      </Button>
    </Box>
  );
}
