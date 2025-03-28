import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DivideIcon as LucideIcon, Menu, X, Settings, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import FrenchFlag from './flags/FrenchFlag';
import BritishFlag from './flags/BritishFlag';

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
  const { t, i18n } = useTranslation();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

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
      window.location.href = '/#/admin';
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center md:justify-start justify-center w-full md:w-auto">
            <img src="/logo.png" alt="Logo" className="h-24 w-auto" />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4 items-center">
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
                  {t(`navigation.${item.name.toLowerCase()}`)}
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
                {t('navigation.admin')}
              </Link>
            )}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all duration-200"
              >
                {i18n.language === 'fr' ? <FrenchFlag /> : <BritishFlag />}
                <ChevronDown className="w-4 h-4" />
              </button>
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 py-2 w-32 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                  <button
                    onClick={() => {
                      changeLanguage('fr');
                      setIsLangMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
                  >
                    <FrenchFlag />
                    <span>Français</span>
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      setIsLangMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
                  >
                    <BritishFlag />
                    <span>English</span>
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleAuth}
              className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                isLoggedIn
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isLoggedIn ? t('navigation.logout') : t('navigation.login')}
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
                  {t(`navigation.${item.name.toLowerCase()}`)}
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
                {t('navigation.admin')}
              </Link>
            )}
            <div className="px-3 py-2">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  {i18n.language === 'fr' ? <FrenchFlag /> : <BritishFlag />}
                  <span>{i18n.language === 'fr' ? 'Français' : 'English'}</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
              {isLangMenuOpen && (
                <div className="mt-2 py-2 bg-gray-800/50 rounded-lg">
                  <button
                    onClick={() => {
                      changeLanguage('fr');
                      setIsLangMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
                  >
                    <FrenchFlag />
                    <span>Français</span>
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      setIsLangMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-2 text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all duration-200"
                  >
                    <BritishFlag />
                    <span>English</span>
                  </button>
                </div>
              )}
            </div>
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
              {isLoggedIn ? t('navigation.logout') : t('navigation.login')}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;