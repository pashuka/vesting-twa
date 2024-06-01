import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  List,
  ListItem,
  Option,
  Select,
} from '@mui/joy';
import { CHAIN } from '@tonconnect/ui-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { SubmitHandler } from 'react-hook-form';
import { useLinearVestingContract } from '../../hooks/useLinearVestingContract';
import { useTonConnect } from '../../hooks/useTonConnect';
import { LinearVestingForm, durationTypes } from '../../types';
import {
  addDays,
  cliffPeriodHelperText,
  durationLocale,
  durationSeconds,
  getInputDateFormat,
  prepareLinearVestingConfig,
  today,
  unlockPeriodHelperText,
  validateCliffDuration,
  validateTotalDuration,
  validateUnlockPeriod,
} from '../../utils';
import { FormLabelTooltip } from '../FormHelpers';
import { CircularProgress } from '../circular-progress';
import { TonviewerLink } from './tonviewer-link';

dayjs.locale('ru');
dayjs.extend(relativeTime);
dayjs.extend(duration);

export function DeployVestingTab() {
  const { connected, network, isMainnet } = useTonConnect();
  const {
    value,
    address,
    sendDeploy,
    deployMessages,
    deploying,
    checkDeployed,
    // form
    register,
    handleSubmit,
    watch,
    setValue,
    errors,
    isValidForm,
    vestingExistMessage,
  } = useLinearVestingContract();
  const onSubmit: SubmitHandler<LinearVestingForm> = (data) => {
    sendDeploy(prepareLinearVestingConfig(data));
  };

  const totalDurationValue = watch('totalDuration') * durationSeconds(watch('totalDurationType'));

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ display: 'grid', gap: 2 }}>
        {/*  */}
        <FormControl disabled>
          <FormLabel>
            Кошелек администратора
            <FormLabelTooltip title="Адрес кошелька администратора" />
          </FormLabel>
          <Input placeholder="..." type="text" {...register('adminAddress', { required: true })} />
          {errors.ownerAddress && <FormHelperText>{errors.ownerAddress.message}</FormHelperText>}
        </FormControl>
        <FormControl disabled={!connected || deploying} error={!!errors.ownerAddress}>
          <FormLabel>
            Адрес кошелька инвестора
            <FormLabelTooltip title="Адрес кошелька инвестора или того, кто будет иметь право на вывод жетонов из вестинг контракта после периода разблокировки на свой кошелек." />
          </FormLabel>
          <Input
            placeholder="..."
            type="text"
            {...register('ownerAddress', {
              required: true,
              // validate: validateOwnerAddress(network),
            })}
          />
          {errors.ownerAddress && <FormHelperText>{errors.ownerAddress.message}</FormHelperText>}
        </FormControl>
        {/*  */}
        <FormControl disabled={!connected || deploying}>
          <FormLabel>
            Начало вестинга
            <FormLabelTooltip
              title="Время начала вестинг периода (блокировки жетонов), начиная с этого момента или ранее жетоны
        находящиеся на балансе кошелька, пренадлежащего вестинг котракту, будут заблокированы до тех
        пор, пока не наступит первый период разблокировки."
            />
          </FormLabel>
          <Input
            type="date"
            {...register('startTime', { required: true })}
            slotProps={{ input: { min: getInputDateFormat(addDays(today(), -2)) } }}
          />
          {errors.startTime && <FormHelperText>{errors.startTime.message}</FormHelperText>}
        </FormControl>
        {/*  */}
        <FormControl disabled={!connected || deploying} error={!!errors.totalDuration}>
          <FormLabel slotProps={{ root: { htmlFor: 'totalDuration' } }}>
            Общая продолжительность блокировки
            <FormLabelTooltip title="Общая продолжительность блокировки жетонов, начиная со времени начала вестинг периода." />
          </FormLabel>
          <Input
            endDecorator={
              <>
                <Divider orientation="vertical" />
                <Select
                  variant="plain"
                  // disabled={!!errors.totalDuration}
                  {...register('totalDurationType')}
                  defaultValue={watch('totalDurationType')}
                  onChange={(_, value) => setValue('totalDurationType', value! as string)}
                  slotProps={{
                    listbox: {
                      variant: 'outlined',
                    },
                  }}
                  disabled={!connected || deploying}
                  sx={{ mr: -1.5, '&:hover': { bgcolor: 'transparent' } }}
                >
                  {durationTypes.map((m) => (
                    <Option key={m} value={m}>
                      {durationLocale(m)}
                    </Option>
                  ))}
                </Select>
              </>
            }
            type="number"
            {...register('totalDuration', {
              required: true,
              validate: validateTotalDuration,
            })}
          />
          {errors.totalDuration && <FormHelperText>{errors.totalDuration.message}</FormHelperText>}
          {totalDurationValue && (
            <FormHelperText>
              &nbsp;~&nbsp;{dayjs.duration(totalDurationValue, 'second').format('Y[г] M[м] D[д]')}
            </FormHelperText>
          )}
        </FormControl>
        {/*  */}
        <FormControl disabled={!connected || deploying} error={!!errors.unlockPeriod}>
          <FormLabel>
            Частота разблокировки
            <FormLabelTooltip
              title="Частота разблокировки жетонов, например если общая продолжительность равна 60 секунд, а
                  частота разблокировки равна 10 секунд, то получится 6 периодов разблокировки."
            />
          </FormLabel>
          <Input
            endDecorator={
              <>
                <Divider orientation="vertical" />
                <Select
                  variant="plain"
                  // disabled={!!errors.unlockPeriod}
                  {...register('unlockPeriodType')}
                  defaultValue={watch('unlockPeriodType')}
                  onChange={(_, value) => setValue('unlockPeriodType', value! as string)}
                  slotProps={{
                    listbox: {
                      variant: 'outlined',
                    },
                  }}
                  disabled={!connected || deploying}
                  sx={{ mr: -1.5, '&:hover': { bgcolor: 'transparent' } }}
                >
                  {durationTypes.map((m) => (
                    <Option key={m} value={m}>
                      {durationLocale(m)}
                    </Option>
                  ))}
                </Select>
              </>
            }
            type="number"
            {...register('unlockPeriod', {
              required: true,
              validate: validateUnlockPeriod,
            })}
          />
          <FormHelperText>
            {errors.unlockPeriod ? errors.unlockPeriod.message : unlockPeriodHelperText(watch())}
          </FormHelperText>
        </FormControl>
        {/*  */}
        <FormControl disabled={!connected || deploying} error={!!errors.cliffDuration}>
          <FormLabel>
            Холодный период
            <FormLabelTooltip title="Холодный период или клиф (cliff period). Продолжительность холодного периода (ноль, если клифф не нужен) - период после начала вестинга, когда вестинг накапливается, но не может быть отозван, вся накопленная сумма будет доступна для вывода после окончания периода клиффа." />
          </FormLabel>
          <Input
            endDecorator={
              <>
                <Divider orientation="vertical" />
                <Select
                  variant="plain"
                  // disabled={!!errors.cliffDuration}
                  {...register('cliffDurationType')}
                  defaultValue={watch('cliffDurationType')}
                  onChange={(_, value) => setValue('cliffDurationType', value! as string)}
                  slotProps={{
                    listbox: {
                      variant: 'outlined',
                    },
                  }}
                  disabled={!connected || deploying}
                  sx={{ mr: -1.5, '&:hover': { bgcolor: 'transparent' } }}
                >
                  {durationTypes.map((m) => (
                    <Option key={m} value={m}>
                      {durationLocale(m)}
                    </Option>
                  ))}
                </Select>
              </>
            }
            type="number"
            {...register('cliffDuration', {
              required: true,
              validate: validateCliffDuration,
            })}
          />
          <FormHelperText>
            {errors.cliffDuration ? errors.cliffDuration.message : cliffPeriodHelperText(watch())}
          </FormHelperText>
        </FormControl>
        {deployMessages.length > 0 && (
          <Alert color="neutral">
            <List marker="circle" size="sm">
              {deployMessages.map((m, i) => (
                <ListItem key={`deploy-message-${i}`} color={m.color}>
                  {m.message}{' '}
                  {m.address && <TonviewerLink address={m.address} testnet={!isMainnet} />}
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
        {!connected && <Alert color="danger">Подключите кошелек для отправки контракта</Alert>}
        <FormControl>
          {vestingExistMessage && (
            <FormHelperText color={vestingExistMessage.color} sx={{ wordWrap: 'break-word' }}>
              {vestingExistMessage.loading && (
                <CircularProgress
                  sx={{
                    mx: 1,
                    '--CircularProgress-size': '21px',
                    '--CircularProgress-trackThickness': '3px',
                    '--CircularProgress-progressThickness': '3px',
                    bgcolor: 'background.surface',
                  }}
                />
              )}
              {vestingExistMessage.message}{' '}
              {vestingExistMessage.address && (
                <TonviewerLink address={vestingExistMessage.address} testnet={!isMainnet} />
              )}
            </FormHelperText>
          )}
        </FormControl>
        <Button
          loading={deploying}
          type="submit"
          disabled={!isValidForm || !connected || deploying || checkDeployed}
        >
          Отправить контракт в{' '}
          {(network === CHAIN.MAINNET ? 'mainnet' : 'testnet').toLocaleUpperCase()}
        </Button>
      </Box>
    </form>
  );
}
