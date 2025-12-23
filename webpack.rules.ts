import type { RuleSetRule } from 'webpack';

export const rules: RuleSetRule[] = [
  // Add support for native node modules
  {
    test: /native_modules[/\\].+\\.node$/,
    use: 'node-loader',
  },
  {
    test: /[/\\]node_modules[/\\].+\\.node$/,
    use: 'node-loader',
  },
  // TypeScript loader
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
  // CSS loader
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader', 'postcss-loader'],
  },
  // Images and assets
  {
    test: /\.(gif|jpe?g|png|svg)$/,
    type: 'asset/resource',
  },
];
