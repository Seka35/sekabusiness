import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DivideIcon as LucideIcon, Menu, X, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import UserAvatar from './UserAvatar';

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
    setIsMenuOpen(false);
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
              
              // Si c'est le lien du Dashboard, afficher l'avatar à la place de l'icône
              if (item.name === 'Dashboard') {
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
                    <UserAvatar className="w-5 h-5 mr-2" />
                    {item.name}
                  </Link>
                );
              }
              
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

            <button
              onClick={handleAuth}
              className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                isLoggedIn 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300' 
                  : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 hover:from-blue-500/30 hover:to-purple-500/30 hover:text-blue-300'
              }`}
            >
              {isLoggedIn ? 'Logout' : 'Login'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                // Si c'est le lien du Dashboard dans le menu mobile, afficher l'avatar
                if (item.name === 'Dashboard') {
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                      }`}
                    >
                      <UserAvatar className="w-5 h-5 mr-2" />
                      {item.name}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
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

              <button
                onClick={handleAuth}
                className={`w-full px-4 py-2 rounded-lg transition-all duration-200 font-medium ${
                  isLoggedIn 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300' 
                    : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 hover:from-blue-500/30 hover:to-purple-500/30 hover:text-blue-300'
                }`}
              >
                {isLoggedIn ? 'Logout' : 'Login'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;