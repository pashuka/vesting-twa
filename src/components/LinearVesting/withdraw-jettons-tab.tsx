import { Box } from '@mui/joy';

export function WithdrawJettonsTab() {
  const onSubmit = () => {
    // sendDeploy(prepareLinearVestingConfig(data));
  };

  return (
    <form onSubmit={() => onSubmit()}>
      <Box sx={{ display: 'grid', gap: 2 }}>вывод жетонов инвестором</Box>
    </form>
  );
}
