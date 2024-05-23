import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  List,
  ListItem,
} from '@mui/joy';
import { fromNano, toNano } from '@ton/core';
import * as dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useJettonContract } from '../../hooks/useJettonContract';
import { useTonConnect } from '../../hooks/useTonConnect';
import { TonviewerLink } from './tonviewer-link';

dayjs.locale('ru');
dayjs.extend(relativeTime);
dayjs.extend(duration);

export function SendJettonsTab() {
  const { connected, network } = useTonConnect();
  const {
    linearVestingAddress,
    jettonWalletAddress,
    jettonMasterAddress,
    setJettonMasterAddress,
    queryBalance,
    queryData,
    queryVesting,
    jettonAmount,
    sending,
    jettonVestingBalance,
    setJettonAmount,
    sendJettons,
  } = useJettonContract();
  const onSubmit = () => {
    // sendDeploy(prepareLinearVestingConfig(data));
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {queryVesting.isFetched && queryVesting.data && (
        <Alert color="neutral">
          <List marker="circle" size="sm">
            <ListItem color="neutral">
              Вестинг контракт:{' '}
              {linearVestingAddress ? (
                <TonviewerLink address={linearVestingAddress} />
              ) : (
                'Будет указан после деплоя вестинг-контракта из предыдущей вкладки'
              )}
            </ListItem>
            <ListItem color="neutral">
              Инвестор:{' '}
              {queryVesting.data && (
                <TonviewerLink address={queryVesting.data?.ownerAddress.toString()} />
              )}
            </ListItem>
            <ListItem color="neutral">
              Начало вестинга: {dayjs(queryVesting.data?.startTime * 1000).fromNow()} (
              {dayjs(queryVesting.data?.startTime * 1000).format('DD/MM/YYYY')})
            </ListItem>
            <ListItem color="neutral">
              Продолжительность:{' '}
              {dayjs.duration(queryVesting.data?.totalDuration, 'second').humanize()}
            </ListItem>
            <ListItem color="neutral">
              Период блокировки:{' '}
              {dayjs.duration(queryVesting.data?.unlockPeriod, 'second').humanize()}
            </ListItem>
            <ListItem color="neutral">
              Холодный перод (клифф):{' '}
              {queryVesting.data?.cliffDuration > 0
                ? dayjs.duration(queryVesting.data?.cliffDuration, 'second').humanize()
                : 'отключен'}
            </ListItem>
            <ListItem color="neutral">
              Всего получено жетонов: {fromNano(queryVesting.data?.totalDeposited).toString()}
            </ListItem>
            <ListItem color="neutral">
              Всего выведено жетонов: {fromNano(queryVesting.data?.totalWithdrawals).toString()}
            </ListItem>
            <ListItem color="neutral">
              Баланс вестинг-кошелка:{' '}
              {jettonVestingBalance ? jettonVestingBalance.toString() : ' ? '}
            </ListItem>
          </List>
        </Alert>
      )}
      <FormControl>
        <FormLabel>Мастер контракт жетонв (адрес контракта)</FormLabel>
        <Input
          type="text"
          placeholder="укажите адрес кошелька жетонов откуда будут отправлены монеты на вестинг контракт"
          // EQCPibTvi3oGBXRjXh86SSrYicPXgf-3_9BzOCh-iFssVTuF
          value={jettonMasterAddress?.toString() || ''}
          onChange={(e) => setJettonMasterAddress(e.target.value)}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Адрес вашего кошелька</FormLabel>
        <Input disabled value={jettonWalletAddress?.toString() || ''} />
      </FormControl>
      <FormControl>
        <FormLabel>Баланс вашего кошелька</FormLabel>
        <Input
          disabled
          value={queryBalance.data ? `${Number(queryBalance.data).toLocaleString()} JETTONS` : ''}
        />
      </FormControl>
      <FormControl error={Number(jettonAmount) <= 0}>
        <FormLabel>Укажите сумму жетонов</FormLabel>
        <Input
          disabled={!queryBalance.data}
          type="text"
          placeholder="укажите сумму жетонов"
          value={jettonAmount}
          onChange={(e) => setJettonAmount(e.target.value)}
        />
        {Number(jettonAmount) <= 0 && (
          <FormHelperText>Сумма должна быть больше нуля</FormHelperText>
        )}
        <FormHelperText>{fromNano(toNano(jettonAmount)).toString()}</FormHelperText>
      </FormControl>
      <Button
        type="submit"
        disabled={
          !connected ||
          !queryBalance.data ||
          Number.isNaN(jettonAmount) ||
          Number(jettonAmount) === 0 ||
          !linearVestingAddress ||
          sending
        }
        onClick={sendJettons}
      >
        Отправить жетоны на вестинг контракт
      </Button>
    </Box>
  );
}
