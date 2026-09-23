import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  icon: IconName;
  to?: string;
  chevron?: boolean;
  dot?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Home', icon: 'NavHome' },
  { label: 'Swarmia AI', icon: 'Agents' },
  { label: 'Focus', icon: 'NavInitiative', to: '/issues', chevron: true },
  { label: 'Metrics', icon: 'Metrics', chevron: true },
  { label: 'AI tools', icon: 'AiSparkles', chevron: true },
  { label: 'PR inbox', icon: 'NavPullRequests' },
  { label: 'Agreements', icon: 'NavWorkingAgreements' },
  { label: 'Surveys', icon: 'NavSurveys' },
  { label: 'Capitalization', icon: 'Capitalization' },
  { label: 'Signals', icon: 'Signal', dot: true },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src="/icons/logo-mark-light.svg" alt="Swarmia" height={30} />
      </div>
      <nav className={styles.nav}>
        {navItems.map(item =>
          item.to ? (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
            >
              <ItemBody item={item} />
            </NavLink>
          ) : (
            <span key={item.label} className={styles.item} aria-disabled="true">
              <ItemBody item={item} />
            </span>
          ),
        )}
      </nav>
    </aside>
  );
}

function ItemBody({ item }: { item: NavItem }) {
  return (
    <>
      <Icon name={item.icon} size={18} />
      <span className={styles.label}>{item.label}</span>
      {item.chevron && <Icon name="ChevronRight" size={14} color="rgba(255,255,255,0.55)" />}
      {item.dot && <span className={styles.dot} />}
    </>
  );
}
