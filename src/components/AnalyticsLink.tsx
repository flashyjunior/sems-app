/**
 * Quick Analytics Access Component
 * Displays link/button to access the analytics dashboard
 */

'use client';

import React from 'react';
import Link from 'next/link';
import styles from '@/app/styles-const';

export const AnalyticsLink: React.FC = () => {
  return (
    <Link href="/analytics">
      <a style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: styles.primaryColor,
        color: 'white',
        borderRadius: '6px',
        fontWeight: 'bold',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = '#1565c0';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = styles.primaryColor;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
      >
        📊 Analytics Dashboard
      </a>
    </Link>
  );
};

/**
 * Analytics Button Component
 * Can be placed in any layout
 */
export const AnalyticsButton: React.FC<{ variant?: 'primary' | 'secondary' | 'outline' }> = ({
  variant = 'primary',
}) => {
  const buttonStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: styles.primaryColor,
      color: 'white',
      border: 'none',
    },
    secondary: {
      backgroundColor: '#f0f0f0',
      color: styles.primaryColor,
      border: `2px solid ${styles.primaryColor}`,
    },
    outline: {
      backgroundColor: 'transparent',
      color: styles.primaryColor,
      border: `2px solid ${styles.primaryColor}`,
    },
  };

  return (
    <Link href="/analytics">
      <button
        style={{
          ...buttonStyles[variant],
          padding: '0.75rem 1.5rem',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '1rem',
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          if (variant === 'primary') {
            btn.style.backgroundColor = '#1565c0';
          } else {
            btn.style.backgroundColor = styles.primaryColor;
            btn.style.color = 'white';
          }
          btn.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement;
          btn.style.transform = 'translateY(0)';
          if (variant === 'secondary' || variant === 'outline') {
            btn.style.color = styles.primaryColor;
            btn.style.backgroundColor = variant === 'secondary' ? '#f0f0f0' : 'transparent';
          } else {
            btn.style.backgroundColor = styles.primaryColor;
          }
        }}
      >
        📊 View Analytics
      </button>
    </Link>
  );
};

export default AnalyticsLink;
