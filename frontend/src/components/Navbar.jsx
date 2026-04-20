import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Database, Search, Upload, User, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); setMenuOpen(false); };
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/search', label: 'Explore', icon: Search },
    ...(isAuthenticated ? [
      { to: '/upload', label: 'Upload', icon: Upload },
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin', icon: Database }] : []),
    ] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/30 group-hover:shadow-primary-500/50 transition-shadow">
              <Database size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:block">DataHub</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive(to)
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-dark-600'
                  }`}>
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>

          {/* Auth Area */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to={`/profile/${user?.username}`}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-dark-600 transition-all duration-200 group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                    {user?.avatar
                      ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                      : user?.username?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white">{user?.username}</span>
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200">
                  <LogOut size={15} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary py-2 px-4 text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-all">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-dark-600 py-3 space-y-1 animate-slide-up">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive(to) ? 'bg-primary-600/20 text-primary-400' : 'text-gray-300 hover:bg-dark-600'}`}>
                <Icon size={16} /> {label}
              </Link>
            ))}
            <div className="border-t border-dark-600 pt-2 mt-2">
              {isAuthenticated ? (
                <>
                  <Link to={`/profile/${user?.username}`} onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-600 rounded-lg">
                    <User size={16} /> {user?.username}
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-4 pb-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1 justify-center text-sm py-2">Sign In</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 justify-center text-sm py-2">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
