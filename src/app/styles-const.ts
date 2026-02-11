export const GLOBAL_STYLES = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #f9fafb;
    color: #1f2937;
  }

  body {
    line-height: 1.5;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
    font-family: inherit;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  ul, ol {
    list-style: none;
  }

  code, pre {
    font-family: 'Courier New', Courier, monospace;
  }
`;

/**
 * Application-wide style constants
 */
export const styles = {
  primaryColor: '#3B82F6',
  primaryColorDark: '#1565c0',
  secondaryColor: '#10B981',
  dangerColor: '#EF4444',
  warningColor: '#F97316',
  successColor: '#10B981',
  infoColor: '#3B82F6',
  
  // Grayscale
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  
  // Risk severity colors
  risk: {
    none: '#10B981',
    low: '#3B82F6',
    medium: '#F97316',
    high: '#EF4444',
    critical: '#991B1B',
  },

  // Common border radius
  borderRadius: '6px',
  borderRadiusSm: '4px',
  borderRadiusLg: '8px',

  // Shadows
  shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.1)',
  shadowLg: '0 10px 25px rgba(0, 0, 0, 0.1)',

  // Transitions
  transitionFast: '0.15s ease-in-out',
  transitionNormal: '0.3s ease-in-out',
  transitionSlow: '0.5s ease-in-out',

  // Text styles
  secondaryText: {
    color: '#6B7280',
    fontSize: '0.875rem',
  },

  // Common component styles
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.5rem',
    border: '1px solid #E5E7EB',
  },

  errorBox: {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FCA5A5',
    borderRadius: '6px',
    color: '#991B1B',
    padding: '0.75rem',
  },

  successBox: {
    backgroundColor: '#DCFCE7',
    border: '1px solid #86EFAC',
    borderRadius: '6px',
    color: '#166534',
    padding: '0.75rem',
  },

  warningBox: {
    backgroundColor: '#FEF3C7',
    border: '1px solid #FDE047',
    borderRadius: '6px',
    color: '#92400E',
    padding: '0.75rem',
  },
};

export default styles;
