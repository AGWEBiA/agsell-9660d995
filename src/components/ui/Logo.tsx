import React from 'react';
import { cn } from '@/lib/utils';
import logoRed from '@/assets/logo-red.png';
import logoWhite from '@/assets/logo-white.png';
import logoBlack from '@/assets/logo-black.png';
import logoAlternativo from '@/assets/logo-alternativo.png';

interface LogoProps {
  variant?: 'red' | 'white' | 'black' | 'alternativo' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

const textSizeMap = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl',
  xl: 'text-2xl',
};

export function Logo({ 
  variant = 'auto', 
  size = 'md', 
  className,
  showText = false 
}: LogoProps) {
  const getLogoSrc = () => {
    switch (variant) {
      case 'red':
        return logoRed;
      case 'white':
        return logoWhite;
      case 'black':
        return logoBlack;
      case 'alternativo':
        return logoAlternativo;
      case 'auto':
      default:
        // Auto mode: use red logo for better contrast on light backgrounds
        return logoRed;
    }
  };

  if (showText) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <img 
          src={getLogoSrc()} 
          alt="AG Sell" 
          className={cn(sizeMap[size], 'object-contain')}
        />
        <div>
          <span className={cn('font-bold text-foreground', textSizeMap[size])}>
            AG Sell
          </span>
          {size === 'xl' && (
            <p className="text-xs text-muted-foreground">CRM & Automação</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <img 
      src={getLogoSrc()} 
      alt="AG Sell" 
      className={cn(sizeMap[size], 'object-contain', className)}
    />
  );
}

// Icon-only version for compact spaces
export function LogoIcon({ 
  variant = 'alternativo', 
  size = 'md', 
  className 
}: Omit<LogoProps, 'showText'>) {
  const getLogoSrc = () => {
    switch (variant) {
      case 'red':
        return logoRed;
      case 'white':
        return logoWhite;
      case 'black':
        return logoBlack;
      case 'alternativo':
      default:
        return logoAlternativo;
    }
  };

  return (
    <img 
      src={getLogoSrc()} 
      alt="AG Sell" 
      className={cn(sizeMap[size], 'object-contain', className)}
    />
  );
}
