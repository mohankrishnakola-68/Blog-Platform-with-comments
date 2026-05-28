import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { PenSquare, LogOut, LayoutDashboard, LogIn, UserPlus, Menu, X, Feather } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Brand */}
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo-icon"><Feather size={22} /></span>
          <span className="navbar__logo-text">Ink<span className="gradient-text">Space</span></span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar__actions">
          {user ? (
            <>
              <Link to="/create" className="btn btn-primary btn-sm">
                <PenSquare size={15} /> Write
              </Link>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              <div className="navbar__avatar"
                style={{ background: `hsl(${user.avatar_color})` }}
                title={user.username}>
                {user.username[0].toUpperCase()}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                <LogIn size={15} /> Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} /> Join Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="navbar__hamburger" onClick={() => setMenuOpen(v => !v)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="navbar__mobile-menu">
          {user ? (
            <>
              <div className="mobile-user-info">
                <div className="avatar" style={{ background: `hsl(${user.avatar_color})` }}>
                  {user.username[0].toUpperCase()}
                </div>
                <span>{user.username}</span>
              </div>
              <Link to="/create" className="mobile-link"><PenSquare size={16} /> Write a Post</Link>
              <Link to="/dashboard" className="mobile-link"><LayoutDashboard size={16} /> Dashboard</Link>
              <button className="mobile-link mobile-link--danger" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-link"><LogIn size={16} /> Login</Link>
              <Link to="/register" className="mobile-link"><UserPlus size={16} /> Join Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
