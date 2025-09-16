const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // vscode extensions run in a Node.js-context

  entry: './src/extension.ts', // the entry point of this extension

  output: {
    // the bundle is stored in the 'dist' folder (check package.json)
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded
  },
  resolve: {
    // support reading TypeScript and JavaScript files
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  optimization: {
    minimize: false // 開發階段不壓縮，方便調試
  }
};

// 生產環境配置
if (process.env.NODE_ENV === 'production') {
  config.optimization.minimize = true;
  config.devtool = 'hidden-source-map';
}

module.exports = config;