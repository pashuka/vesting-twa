import { InfoOutlined } from '@mui/icons-material';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardOverflow,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  List,
  ListItem,
  Option,
  Select,
  Typography,
} from '@mui/joy';
import { Address } from '@ton/core';
import { TonConnectButton } from '@tonconnect/ui-react';
import * as dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import { SubmitHandler, useForm } from 'react-hook-form';
import { DEFAULT_TESTNET_WALLET_2 } from '../constants';
import { useLinearVestingContract } from '../hooks/useLinearVestingContract';
import { useTonConnect } from '../hooks/useTonConnect';
import { LinearVestingForm, durationTypes } from '../types';
import {
  cliffPeriodHelperText,
  durationLocale,
  durationSeconds,
  getInputDateFormat,
  today,
  unlockPeriodHelperText,
  validateCliffDuration,
  validateOwnerAddress,
  validateTotalDuration,
  validateUnlockPeriod,
} from '../utils';
import { FormLabelTooltip } from './FormHelpers';

dayjs.locale('ru');

export function LinearVesting() {
  const { connected, network } = useTonConnect();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LinearVestingForm>({
    mode: 'all',
    defaultValues: {
      cliffDuration: 0,
      cliffDurationType: durationTypes[0],
      ownerAddress: DEFAULT_TESTNET_WALLET_2,
      startTime: getInputDateFormat(today()),
      totalDuration: 1,
      totalDurationType: durationTypes[1],
      unlockPeriod: 1,
      unlockPeriodType: durationTypes[0],
    },
  });
  const { value, address, sendDeploy, deployMessages, deploying, deployedContractAdress } =
    useLinearVestingContract();
  const onSubmit: SubmitHandler<LinearVestingForm> = (data) => {
    sendDeploy({
      start_time: Math.round(new Date(data.startTime).getTime() / 1000),
      total_duration: durationSeconds(data.totalDurationType) * data.totalDuration,
      unlock_period: durationSeconds(data.unlockPeriodType) * data.unlockPeriod,
      cliff_duration: durationSeconds(data.cliffDurationType) * data.cliffDuration,
      owner_address: Address.parse(data.ownerAddress),
    });
  };

  return (
    <>
      <TonConnectButton />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card variant="outlined">
          <Typography level="title-lg" startDecorator={<InfoOutlined />}>
            Линейный вестинг
          </Typography>
          <Divider inset="none" />
          <CardContent sx={{ display: 'grid', gap: 2 }}>
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
                slotProps={{ input: { min: getInputDateFormat(today()) } }}
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
              {errors.totalDuration && (
                <FormHelperText>{errors.totalDuration.message}</FormHelperText>
              )}
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
                {errors.unlockPeriod
                  ? errors.unlockPeriod.message
                  : unlockPeriodHelperText(watch())}
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
                {errors.cliffDuration
                  ? errors.cliffDuration.message
                  : cliffPeriodHelperText(watch())}
              </FormHelperText>
            </FormControl>
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
              />
              {errors.ownerAddress && (
                <FormHelperText>{errors.ownerAddress.message}</FormHelperText>
              )}
            </FormControl>
            {/*  */}
            {/* <FormControl>
              <FormLabel>Адрес вестинг контракта после деплоя</FormLabel>
              <Input
                type="text"
                disabled
                placeholder="адрес появится после того как произойдет деплой контракта"
                value={address || ''}
              />
            </FormControl> */}
            {/*  */}
            {/* <FormControl>
              <FormLabel>Counter contract value</FormLabel>
              <Input placeholder="" type="text" disabled value={value ?? 'Loading...'} />
              <FormHelperText>This is a helper text.</FormHelperText>
            </FormControl> */}
            {deployMessages.length > 0 && (
              <List marker="circle" size="sm">
                {deployMessages.map((m, i) => (
                  <ListItem key={`deploy-message-${i}`} color={m.color}>
                    {m.message}
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
          <CardOverflow sx={{ bgcolor: 'background.level1' }}>
            <CardActions buttonFlex="1">
              <Button type="submit" disabled={!connected || deploying}>
                Деплой контракта в сеть
              </Button>
            </CardActions>
          </CardOverflow>
        </Card>
      </form>
    </>
  );
}
