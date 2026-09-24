import { Outlet } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { styles } from './AppLayout.styles';

export function AppLayout() {
  return (
    <div style={styles.shell} data-ui="AppLayout.shell">
      <Sidebar />
      <main style={styles.main} data-ui="AppLayout.main">
        <div style={styles.content} data-ui="AppLayout.content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
