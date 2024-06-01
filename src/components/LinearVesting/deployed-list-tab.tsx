import { AdminPanelSettings, Person2 } from '@mui/icons-material';
import { Table } from '@mui/joy';
import dayjs from 'dayjs';
import 'dayjs/locale/ru'; // import locale
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useListDeployedContracts } from '../../hooks/useListDeployedContracts';
import { useTonConnect } from '../../hooks/useTonConnect';
import { TonviewerLink } from './tonviewer-link';

dayjs.locale('ru');
dayjs.extend(relativeTime);
dayjs.extend(duration);

export function DeployedListTab() {
  const { isMainnet } = useTonConnect();
  const { listDeployedContracts } = useListDeployedContracts();
  return (
    <Table stripe="even">
      <thead>
        <tr>
          <th style={{ width: '35%' }}>Получатель/Админ</th>
          <th>Старт</th>
          <th>Длительность</th>
          <th>Период</th>
          <th>Клифф</th>
        </tr>
      </thead>
      <tbody>
        {listDeployedContracts?.map((m, i) => (
          <tr key={`deployed-${i}-${m.o}`}>
            <td>
              <Person2 fontSize="small" /> <TonviewerLink address={m.a} testnet={!isMainnet} />
              <br />
              <AdminPanelSettings fontSize="small" />{' '}
              <TonviewerLink address={m.o} testnet={!isMainnet} />
            </td>
            <td>{dayjs(m.s * 1000).format('DD/MM/YYYY')}</td>
            <td>{dayjs.duration(m.t, 'second').format('Y[г] M[м] D[д] H[ч]')}</td>
            <td>{dayjs.duration(m.u, 'second').format('Y[г] M[м] D[д] H[ч]')}</td>
            <td>{dayjs.duration(m.c, 'second').format('Y[г] M[м] D[д] H[ч]')}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
