import type { Configuration } from 'webpack';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for Electron, the file that runs on the
   * 'main' thread.
   */
  entry: `${__dirname}/public/electron/main.ts`,
  target: 'electron-main',
  mode: 'production',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: {
      '@': `${__dirname}/src`,
    },
  },
};

export default mainConfig;
