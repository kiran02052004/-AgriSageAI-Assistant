
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleIcon?: React.ReactNode;
  actions?: React.ReactNode; // e.g., buttons at the bottom of the card
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', titleIcon, actions }) => {
  return (
    <div className={`bg-white shadow-xl rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 ${className}`}>
      {title && (
        <div className="bg-green-600 text-white p-4 sm:p-5 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-semibold flex items-center">
            {titleIcon && <span className="mr-3 text-2xl">{titleIcon}</span>}
            {title}
          </h3>
        </div>
      )}
      <div className="p-4 sm:p-6 text-gray-700">
        {children}
      </div>
      {actions && (
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-200">
          {actions}
        </div>
      )}
    </div>
  );
};