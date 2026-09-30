import React from 'react';

interface RegCobreLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'header';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const RegCobreLogo: React.FC<RegCobreLogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
  showSubtitle = true,
}) => {
  const isDarkBg = variant === 'dark'; // e.g. in the dark navy sidebar

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Vector Shield Emblem matching Stitch asset */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={size === 'sm' ? 28 : size === 'lg' ? 44 : 34}
          height={size === 'sm' ? 28 : size === 'lg' ? 44 : 34}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Outer Shield with subtle gradient */}
          <path
            d="M24 4L7 11V23.5C7 34.2 14.3 43.1 24 45.8C33.7 43.1 41 34.2 41 23.5V11L24 4Z"
            fill="#0F2942"
            stroke="#1E3E62"
            strokeWidth="1.5"
          />
          {/* Recovery circular arrow loop in Emerald Teal */}
          <path
            d="M24 14C18.477 14 14 18.477 14 24C14 29.523 18.477 34 24 34C28.2 34 31.78 31.42 33.24 27.75"
            stroke="#006A61"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Forward direction arrow / marker */}
          <path
            d="M22 24H33M33 24L28.5 19.5M33 24L28.5 28.5"
            stroke="#006A61"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Central crisp white 'R' lettermark */}
          <path
            d="M21 19H26C27.657 19 29 20.343 29 22C29 23.657 27.657 25 26 25H21V19Z"
            fill="#FFFFFF"
          />
          <path
            d="M21 19V29M26 25L30 29"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Little status node */}
          <circle cx="36" cy="15" r="2.5" fill="#86F2E4" />
        </svg>
      </div>

      {/* Typography Block */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-title-md font-bold tracking-tight uppercase leading-none ${
              isDarkBg ? 'text-surface' : 'text-primary'
            } ${size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-sm' : 'text-base'}`}
          >
            RegCobre
          </span>
          <span
            className={`font-label-uppercase text-[9px] px-1 py-0.2 rounded font-bold tracking-wider uppercase ${
              isDarkBg
                ? 'bg-surface/10 text-surface-variant'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            CORP
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`font-label-uppercase text-[10px] tracking-wider uppercase truncate mt-0.5 ${
              isDarkBg ? 'text-on-primary-container' : 'text-on-surface-variant'
            }`}
          >
            Cobrança Corp
          </span>
        )}
      </div>
    </div>
  );
};
