import React, { useState, useEffect } from 'react';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const { t, i18n } = useTranslation();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      setIsAdmin(!!adminData);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const checkSubscriptionStatus = async (userId: string) => {
    try {
      console.log('Checking subscription for user:', userId);
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Subscription check error:', error);
        setHasSubscription(false);
        return;
      }

      const isActive = !!subscriptionData && subscriptionData.status === 'active';
      console.log('Subscription data:', subscriptionData, 'isActive:', isActive);
      setHasSubscription(isActive);
    } catch (error) {
      console.error('Subscription check error:', error);
      setHasSubscription(false);
    }
  };

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        checkSubscriptionStatus(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        checkAdminStatus(session.user.id);
        checkSubscriptionStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setHasSubscription(false);
      }
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
      window.location.href = '/#/login';
    }
  };

  // Filter items based on subscription status
  const filteredItems = React.useMemo(() => {
    const baseItems = items.map(item => {
      // Hide dashboard if not logged in
      if (item.name.toLowerCase() === 'profile' || item.name.toLowerCase() === 'dashboard') {
        if (!isLoggedIn) {
          return null;
        }
        return { ...item, name: 'Dashboard' };
      }
      
      // Handle chat access
      if (item.path === '/chat') {
        if (hasSubscription) {
          return item;
        } else {
          return { ...item, path: '/subscribe' };
        }
      }
      
      return item;
    });

    // Add admin button for admin users
    if (isAdmin) {
      baseItems.push({
        name: 'Admin',
        path: '/admin',
        icon: Settings
      });
    }
    
    return baseItems.filter((item): item is NavItem => item !== null);
  }, [items, hasSubscription, isLoggedIn, isAdmin]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center md:justify-start justify-center w-full md:w-auto">
            <img src="/logo.png" alt="Logo" className="h-24 w-auto" />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4 items-center">
            {filteredItems.map((item) => {
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

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all duration-200"
              >
                {i18n.language === 'fr' ? (
                  <FrenchFlag className="w-5 h-5" />
                ) : (
                  <BritishFlag className="w-5 h-5" />
                )}
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-gray-800 rounded-lg shadow-xl z-50">
                  <button
                    onClick={() => {
                      changeLanguage('fr');
                      setIsLangMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  >
                    <FrenchFlag className="w-5 h-5 mr-2" />
                    Français
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      setIsLangMenuOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  >
                    <BritishFlag className="w-5 h-5 mr-2" />
                    English
                  </button>
                </div>
              )}
            </div>

            {/* Auth Button */}
            <button
              onClick={handleAuth}
              className="flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              {isLoggedIn ? t('navigation.logout') : t('navigation.login')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 mb-2 ${
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

            {/* Language Selector Mobile */}
            <div className="px-3 py-2">
              <button
                onClick={() => changeLanguage('fr')}
                className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white mb-2"
              >
                <FrenchFlag className="w-5 h-5 mr-2" />
                Français
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-700/50 text-gray-300 hover:text-white"
              >
                <BritishFlag className="w-5 h-5 mr-2" />
                English
              </button>
            </div>

            {/* Auth Button Mobile */}
            <button
              onClick={handleAuth}
              className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors mt-4"
            >
              {isLoggedIn ? t('navigation.logout') : t('navigation.login')}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;