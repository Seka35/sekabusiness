import React from 'react';

interface FrenchFlagProps {
  className?: string;
}

const FrenchFlag: React.FC<FrenchFlagProps> = ({ className }) => {
  return (
    <svg className={className} viewBox="0 0 640 480">
      <g fillRule="evenodd" strokeWidth="1pt">
        <path fill="#fff" d="M0 0h640v480H0z"/>
        <path fill="#00267f" d="M0 0h213.3v480H0z"/>
        <path fill="#f31830" d="M426.7 0H640v480H426.7z"/>
      </g>
    </svg>
  );
};

export default FrenchFlag; 