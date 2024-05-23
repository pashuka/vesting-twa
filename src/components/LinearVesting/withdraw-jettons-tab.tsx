import { Box, Button, FormControl, FormLabel, Input, List, ListItem } from '@mui/joy';
import { fromNano } from '@ton/core';
import dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTonConnect } from '../../hooks/useTonConnect';
import { useWithdrawJetton } from '../../hooks/useWithdrawJetton';
import { TonviewerLink } from './tonviewer-link';

dayjs.locale('ru');
dayjs.extend(relativeTime);
dayjs.extend(duration);

export function WithdrawJettonsTab() {
  const { connected, network } = useTonConnect();
  const {
    linearVestingAddress,
    withdrawVestingAddress,
    setWithdrawVestingAddress,
    queryVesting,
    sending,
    withdrawJettons,
  } = useWithdrawJetton();
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <FormControl>
        <FormLabel>Вестинг контракт (адрес контракта)</FormLabel>
        <Input
          type="text"
          placeholder="укажите адрес вестинг контракта"
          value={withdrawVestingAddress?.toString() || ''}
          onChange={(e) => setWithdrawVestingAddress(e.target.value)}
        />
      </FormControl>
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
          Начало вестинга:{' '}
          {!queryVesting.data ? '' : dayjs(queryVesting.data?.startTime * 1000).fromNow()} (
          {!queryVesting.data
            ? '...'
            : dayjs(queryVesting.data?.startTime * 1000).format('DD/MM/YYYY')}
          )
        </ListItem>
        <ListItem color="neutral">
          Продолжительность:{' '}
          {!queryVesting.data
            ? '...'
            : dayjs.duration(queryVesting.data?.totalDuration, 'second').humanize()}
        </ListItem>
        <ListItem color="neutral">
          Период блокировки:{' '}
          {!queryVesting.data
            ? '...'
            : dayjs.duration(queryVesting.data?.unlockPeriod, 'second').humanize()}
        </ListItem>
        <ListItem color="neutral">
          Холодный перод (клифф):{' '}
          {!queryVesting.data
            ? '...'
            : queryVesting.data?.cliffDuration > 0
              ? dayjs.duration(queryVesting.data?.cliffDuration, 'second').humanize()
              : 'отключен'}
        </ListItem>
        <ListItem color="neutral">
          Всего получено жетонов:{' '}
          {!queryVesting.data ? '...' : fromNano(queryVesting.data?.totalDeposited).toString()}
        </ListItem>
        <ListItem color="neutral">
          Всего выведено жетонов:{' '}
          {!queryVesting.data ? '...' : fromNano(queryVesting.data?.totalWithdrawals).toString()}
        </ListItem>
      </List>
      <Button
        type="submit"
        disabled={!connected || !withdrawVestingAddress || !linearVestingAddress || sending}
        onClick={withdrawJettons}
      >
        Вывод жетонов на кошелек
      </Button>
    </Box>
  );
}
