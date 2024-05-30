import { Done } from '@mui/icons-material';
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
  Typography,
} from '@mui/joy';
import { fromNano } from '@ton/core';
import dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useState } from 'react';
import { useJettonContract } from '../../hooks/useSendJettonContract';
import { useTonConnect } from '../../hooks/useTonConnect';
import { TonviewerLink } from './tonviewer-link';

dayjs.locale('ru');
dayjs.extend(relativeTime);
dayjs.extend(duration);

export function SendJettonsTab() {
  const [pickBySelfVestingAddress, setPickBySelfVestingAddress] = useState(false);
  const { connected, network } = useTonConnect();
  const {
    linearVestingAddress,
    jettonWalletAddress,
    jettonMasterAddress,
    setJettonMasterAddress,
    queryBalance,
    queryJettonMetaData,
    queryVesting,
    isVestingFinished,
    jettonAmount,
    sending,
    jettonVestingBalance,
    setJettonAmount,
    sendJettons,
    deployedVestingAddress,
    setDeployedVestingAddress,
    terminateContract,
  } = useJettonContract();

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Alert color="neutral">
        <List size="sm">
          <ListItem color={'neutral'}>
            Вестинг контракт:{' '}
            {linearVestingAddress ? (
              <>
                <TonviewerLink address={linearVestingAddress} />
                {!pickBySelfVestingAddress && (
                  <Button
                    sx={{ mx: 1 }}
                    variant="plain"
                    onClick={() => setPickBySelfVestingAddress(true)}
                  >
                    изменить адрес
                  </Button>
                )}
              </>
            ) : (
              <Button variant="plain" onClick={() => setPickBySelfVestingAddress(true)}>
                указать адрес
              </Button>
            )}
            {pickBySelfVestingAddress && (
              <Input
                endDecorator={
                  <Button
                    variant="plain"
                    sx={{ px: 0.75 }}
                    onClick={() => setPickBySelfVestingAddress(false)}
                  >
                    <Done />
                  </Button>
                }
                value={deployedVestingAddress?.toString() || ''}
                onChange={(e) => setDeployedVestingAddress(e.target.value)}
              />
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
          <ListItem color="neutral">
            Баланс вестинг-кошелка:{' '}
            {!jettonVestingBalance ? '...' : jettonVestingBalance.toString()}{' '}
            {jettonVestingBalance && queryJettonMetaData.data?.content?.symbol}
            {jettonVestingBalance && queryJettonMetaData.data?.content?.name
              ? ` [ ${queryJettonMetaData.data?.content?.name} ]`
              : ''}
          </ListItem>
          <ListItem
            color="neutral"
            endAction={
              !isVestingFinished && (
                <Button
                  disabled={!connected || !linearVestingAddress || sending}
                  variant="solid"
                  color="danger"
                  sx={{ px: 0.75 }}
                  onClick={() =>
                    window.confirm('Вы уверены?') &&
                    window.confirm(
                      'Весь оставшийся баланс жетонов будет отправлен на кошелек администратора. Продолжаем?',
                    ) &&
                    terminateContract()
                  }
                >
                  Отменв вестинга
                </Button>
              )
            }
          >
            Статус: {isVestingFinished && <Typography color="danger">вестинг закрыт</Typography>}
          </ListItem>
        </List>
      </Alert>

      <FormControl disabled={!connected || isVestingFinished}>
        <FormLabel>Мастер контракт жетонв (адрес контракта)</FormLabel>
        <Input
          type="text"
          placeholder="укажите адрес кошелька жетонов откуда будут отправлены монеты на вестинг контракт"
          // EQCPibTvi3oGBXRjXh86SSrYicPXgf-3_9BzOCh-iFssVTuF
          value={jettonMasterAddress?.toString() || ''}
          onChange={(e) => setJettonMasterAddress(e.target.value)}
        />
      </FormControl>
      <FormControl disabled>
        <FormLabel>Адрес вашего кошелька</FormLabel>
        <Input value={jettonWalletAddress?.toString() || ''} />
      </FormControl>
      <FormControl disabled>
        <FormLabel>Баланс вашего кошелька</FormLabel>
        <Input
          value={
            queryBalance.data
              ? `${Number(queryBalance.data).toLocaleString()} ${queryJettonMetaData.data?.content?.symbol}`
              : ''
          }
        />
        {queryJettonMetaData.data?.content?.name && (
          <FormHelperText>
            {queryJettonMetaData.data?.content?.name} [{' '}
            {queryJettonMetaData.data?.content?.description} ]
          </FormHelperText>
        )}
      </FormControl>
      <FormControl
        disabled={!connected || !queryBalance.data || isVestingFinished}
        error={Number(jettonAmount) <= 0}
      >
        <FormLabel>Укажите сумму жетонов</FormLabel>
        <Input
          type="text"
          placeholder="укажите сумму жетонов"
          value={jettonAmount}
          onChange={(e) => setJettonAmount(e.target.value)}
        />
        {jettonAmount.length > 0 && Number(jettonAmount) <= 0 && (
          <FormHelperText>Сумма должна быть больше нуля</FormHelperText>
        )}
      </FormControl>
      {!connected && <Alert color="danger">Подключите кошелек для отправки жетонов</Alert>}
      <Button
        type="submit"
        loading={sending}
        disabled={
          !connected ||
          !queryBalance.data ||
          Number.isNaN(jettonAmount) ||
          Number(jettonAmount) === 0 ||
          !linearVestingAddress ||
          sending ||
          isVestingFinished
        }
        onClick={sendJettons}
      >
        Отправить жетоны на вестинг контракт
      </Button>
    </Box>
  );
}
