import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const DEFAULT_AVATAR_URL = 'https://zhsflgbiitabtnbktxte.supabase.co/storage/v1/object/public/images/1a649947-e379-449b-82ec-bd05c9865bc8/avatar.jpeg';

interface UserAvatarProps {
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ className = '' }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR_URL);

  useEffect(() => {
    const getAvatar = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: userAvatarData } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('user_id', session.user.id)
        .single();

      if (userAvatarData?.avatar_url) {
        setAvatarUrl(userAvatarData.avatar_url);
      }
    };

    getAvatar();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getAvatar();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <img
      src={avatarUrl}
      alt="User Avatar"
      className={`rounded-full object-cover ${className}`}
    />
  );
};

export default UserAvatar; 