import React from 'react';

export const Card = ({ title, children, icon: Icon, className = '' }) => {
  return (
    <div className={`card animate-fade-in ${className}`}>
      {title && (
        <h2 className="card-title">
          {Icon && <Icon size={24} className="text-primary" />}
          {title}
        </h2>
      )}
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};
