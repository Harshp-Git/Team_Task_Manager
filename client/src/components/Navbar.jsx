import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:24,height:24}}>
            <path d="M9 11l3 3L22 4" style={{stroke:'#00d4aa'}} />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" style={{stroke:'#6c63ff'}} />
          </svg>
          TaskFlow
        </Link>

        <div className="navbar-links">
          <Link to="/" className={isActive('/')}>Dashboard</Link>
          <Link to="/projects" className={isActive('/projects')}>Projects</Link>
        </div>

        <div className="navbar-right">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className={`badge badge-${user?.role}`}>{user?.role}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
