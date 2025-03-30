import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Monitor, BookOpen, MessageSquare } from 'lucide-react';

const Home: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: Monitor,
      title: t('home.tools.title'),
      description: t('home.tools.description'),
      link: '/tools'
    },
    {
      icon: BookOpen,
      title: t('home.blog.title'),
      description: t('home.blog.description'),
      link: '/blog'
    },
    {
      icon: MessageSquare,
      title: t('home.chat.title'),
      description: t('home.chat.description'),
      link: '/chat'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
          SEKA Business
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          {t('home.hero.description')}
        </p>
      </div>

      <div className="mt-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.title}
                to={feature.link}
                className="relative group bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 hover:bg-gray-800 transition-all duration-200"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 blur" />
                <div className="relative">
                  <Icon className="h-8 w-8 text-blue-500" />
                  <h3 className="mt-4 text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-gray-300">
                    {feature.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home; 