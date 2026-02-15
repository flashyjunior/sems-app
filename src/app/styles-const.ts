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

const styles = {
  primaryColor: '#1e40af',
  accentColor: '#06b6d4',
  successColor: '#10b981',
  warningColor: '#f59e0b',
  dangerColor: '#ef4444',
  card: {
    background: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    padding: '1rem',
    color: '#111827',
  },
  secondaryText: {
    color: '#6b7280',
  },
  errorBox: {
    background: '#fff7f7',
    borderLeft: '4px solid #ef4444',
    color: '#8b1d1d',
  },
};

export default styles;
