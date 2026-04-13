import React from 'react';

export const CircularLogo = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'w-10 h-10',
    default: 'w-14 h-14 md:w-16 md:h-16',
    large: 'w-20 h-20',
  };

  const logoSrc = "https://customer-assets.emergentagent.com/job_carloop-dealer/artifacts/1p0vv1ry_Gemini_Generated_Image_sp7phhsp7phhsp7p.png";

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-md border border-gray-100 ${className}`}
      data-testid="circular-logo"
    >
      <img 
        src={logoSrc}
        alt="TruVant"
        className="w-full h-full object-cover"
        style={{ borderRadius: '50%' }}
      />
    </div>
  );
};

// Text Logo variant for places where text is needed alongside
export const TruVantLogo = ({ showText = true, size = 'default', className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CircularLogo size={size} />
      {showText && (
        <span className="font-outfit font-bold text-xl md:text-2xl text-[#0F172A]">
          TruVant
        </span>
      )}
    </div>
  );
};
