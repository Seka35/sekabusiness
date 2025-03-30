import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
      >
        {i18n.language === 'fr' ? '🇫🇷' : '🇬🇧'}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-48 bg-gray-800 rounded-md shadow-xl z-50">
          <button
            onClick={toggleLanguage}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            {i18n.language === 'fr' ? '🇬🇧 English' : '🇫🇷 Français'}
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher; 