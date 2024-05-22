import {
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
import * as dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import { SubmitHandler } from 'react-hook-form';
import { useLinearVestingContract } from '../../hooks/useLinearVestingContract';
import { useTonConnect } from '../../hooks/useTonConnect';
import { LinearVestingForm, durationTypes } from '../../types';
import {
  addDays,
  cliffPeriodHelperText,
  durationLocale,
  getInputDateFormat,
  prepareLinearVestingConfig,
  today,
  unlockPeriodHelperText,
  validateCliffDuration,
  validateOwnerAddress,
  validateTotalDuration,
  validateUnlockPeriod,
} from '../../utils';
import { FormLabelTooltip } from '../FormHelpers';

dayjs.locale('ru');

export function DeployVestingTab() {
  const { connected, network } = useTonConnect();
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

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ display: 'grid', gap: 2 }}>
        {/*  */}
        <FormControl error={!!errors.ownerAddress}>
          <FormLabel>
            Адрес кошелька инвестора
            <FormLabelTooltip title="Адрес кошелька инвестора или того, кто будет иметь право на вывод жетонов из вестинг контракта после периода разблокировки на свой кошелек." />
          </FormLabel>
          <Input
            placeholder="..."
            type="text"
            {...register('ownerAddress', {
              required: true,
              validate: validateOwnerAddress(network),
            })}
            disabled={!connected || deploying}
          />
          {errors.ownerAddress && <FormHelperText>{errors.ownerAddress.message}</FormHelperText>}
          {vestingExistMessage && (
            <FormHelperText sx={{ color: vestingExistMessage.color }}>
              {vestingExistMessage.message}
            </FormHelperText>
          )}
        </FormControl>
        {deployMessages.length > 0 && (
          <List marker="circle" size="sm">
            {deployMessages.map((m, i) => (
              <ListItem key={`deploy-message-${i}`} color={m.color}>
                {m.message}
              </ListItem>
            ))}
          </List>
        )}
        <Divider />
        {/*  */}
        <FormControl>
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
            disabled={!connected || deploying}
          />
          {errors.startTime && <FormHelperText>{errors.startTime.message}</FormHelperText>}
        </FormControl>
        {/*  */}
        <FormControl error={!!errors.totalDuration}>
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
            disabled={!connected || deploying}
          />
          {errors.totalDuration && <FormHelperText>{errors.totalDuration.message}</FormHelperText>}
        </FormControl>
        {/*  */}
        <FormControl error={!!errors.unlockPeriod}>
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
            disabled={!connected || deploying}
          />
          <FormHelperText>
            {errors.unlockPeriod ? errors.unlockPeriod.message : unlockPeriodHelperText(watch())}
          </FormHelperText>
        </FormControl>
        {/*  */}
        <FormControl error={!!errors.cliffDuration}>
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
            disabled={!connected || deploying}
          />
          <FormHelperText>
            {errors.cliffDuration ? errors.cliffDuration.message : cliffPeriodHelperText(watch())}
          </FormHelperText>
        </FormControl>
        <Button type="submit" disabled={!isValidForm || !connected || deploying || checkDeployed}>
          Отправить контракт в{' '}
          {(network === CHAIN.MAINNET ? 'mainnet' : 'testnet').toLocaleUpperCase()}
        </Button>
      </Box>
    </form>
  );
}
