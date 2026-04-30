import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ projectCount = 0, taskCount = 0 }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" style={{stroke:'#43e97b'}} />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" style={{stroke:'#6c63ff'}} />
        </svg>
        TaskFlow
      </Link>

      <nav className="sidebar-nav">
        <div className="nav-label">Menu</div>
        <Link to="/" className={isActive('/')}>
          <span className="nav-icon">📊</span>
          Dashboard
        </Link>
        <Link to="/projects" className={isActive('/projects')}>
          <span className="nav-icon">📁</span>
          Projects
          {projectCount > 0 && <span className="nav-badge">{projectCount}</span>}
        </Link>

        <div className="nav-label">Tasks</div>
        <Link to="/" className="nav-item" style={{pointerEvents: 'none'}}>
          <span className="nav-icon">📋</span>
          All Tasks
          {taskCount > 0 && <span className="nav-badge">{taskCount}</span>}
        </Link>

        {user?.role === 'admin' && (
          <>
            <div className="nav-label">Admin</div>
            <Link to="/projects" className="nav-item">
              <span className="nav-icon">⚙️</span>
              Settings
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name || 'User'}</div>
          <div className="sidebar-user-role">
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={logout} title="Logout">⏻</button>
      </div>
    </aside>
  );
}
