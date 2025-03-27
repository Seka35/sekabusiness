import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DivideIcon as LucideIcon, Menu, X, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface NavItem {
  name: string;
  path: string;
  icon: typeof LucideIcon;
}

interface NavbarProps {
  items: NavItem[];
}

const Navbar: React.FC<NavbarProps> = ({ items }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async () => {
    if (isLoggedIn) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Logged out successfully!');
      }
    } else {
      window.location.href = '/admin';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center md:justify-start justify-center w-full md:w-auto">
            <img src={import.meta.env.BASE_URL + 'logo.png'} alt="Logo" className="h-24 w-auto" />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {item.name}
                </Link>
              );
            })}
            {isLoggedIn && (
              <Link
                to="/admin"
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === '/admin'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5 mr-2" />
                Admin
              </Link>
            )}
            <button
              onClick={handleAuth}
              className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                isLoggedIn
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isLoggedIn ? 'Logout' : 'Login'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {item.name}
                </Link>
              );
            })}
            {isLoggedIn && (
              <Link
                to="/admin"
                className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === '/admin'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="w-5 h-5 mr-2" />
                Admin
              </Link>
            )}
            <button
              onClick={() => {
                handleAuth();
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                isLoggedIn
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isLoggedIn ? 'Logout' : 'Login'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;