const webpack = require('webpack');
const baseConfig = require('./webpack.common.js');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const { merge } = require('webpack-merge');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// common part for production and dev
const { cssLoaders } = require('./util');

const config = require('./config');

// If you want you can enable
// generating only one css file
const oneFileCss = {
  splitChunks: {
    cacheGroups: {
      styles: {
        name: 'styles',
        type: 'css/mini-extract',
        chunks: 'all',
        enforce: true,
      },
    },
  },
};

// configure Optimization
const configureOptimization = () => {
  return {
    minimize: true,
    minimizer: [new TerserPlugin()],
    splitChunks: {
      chunks: 'initial',
      // name: true,
      minSize: 1,
      minChunks: 1,
      cacheGroups: {
        // node_modules vendor chunk
        // vendors: {
        //   test: (module) => {
        //     return (
        //       module.resource &&
        //       /\.js$/.test(module.resource) &&
        //       module.resource.match('node_modules')
        //     );
        //   },
        //   name: 'vendors',
        // },

        // extract all
        // commons: {
        //   // test: /[\\/]node_modules[\\/]/,
        //   // cacheGroupKey here is `commons` as the key of the cacheGroup
        //   name(module, chunks, cacheGroupKey) {
        //     const moduleFileName = module
        //       .identifier()
        //       .split('/')
        //       .reduceRight((item) => item);
        //     const allChunksNames = chunks.map((item) => item.name).join('~');
        //     const comb = `${cacheGroupKey}-${allChunksNames}-${moduleFileName}`;
        //     const ret = comb.replace(/\//g, '_');
        //     return ret;
        //   },
        //   // chunks: 'all',
        // },
        defaultVendors: false,
        default: false,

        // auto common chunk
        commons: {
          name(module, chunks, cacheGroupKey) {
            let retChunkName = '';
            const map = new Map();
            if (chunks.length === config.length) {
              retChunkName = 'common';
              map.set(retChunkName, chunks);
            } else if (chunks.length > 1) {
              // group by sub-project
              chunks.forEach((chunk) => {
                const parts = /([^\/]+)\/(.*)/.exec(chunk.name);
                if (parts) {
                  const groupName = `${parts[1]}-common`;
                  let _chunks = map.get(groupName);
                  if (!_chunks) {
                    _chunks = [];
                    map.set(groupName, _chunks);
                  }
                  _chunks.push(chunk);
                }
              });
              // if only used by 1 chunk, no need to extract it
              for (const [k, chunks] of map) {
                if (chunks.length <= 1) {
                  map.delete(k);
                }
              }
            }

            console.log([...map.keys()]);
            return map;
          },
        },
      },
    },
    // ...oneFileCss,
  };
};

// configure MiniCssExtract
const configureMiniCssExtract = () => {
  return {
    filename: '[name].[contenthash].css',
  };
};

// configure Service Worker
const configureSW = () => {
  return {
    clientsClaim: true,
    skipWaiting: true,
    directoryIndex: 'index.html',
    offlineGoogleAnalytics: true,
  };
};

// configure Copy
const configureCopy = () => {
  return {
    patterns: [
      {
        from: 'sources/assets/',
        to: 'assets/',
      },
      {
        from: 'sources/images/',
        to: 'images/',
        // blocking file copying by plugin webpack will
        // do it for you and rename it with a hash
        globOptions: {
          ignore: ['**.svg'],
        },
      },
    ],
  };
};

module.exports = merge(baseConfig, {
  mode: 'production',
  target: 'browserslist',
  module: {
    rules: [
      {
        test: /\.(css|sass|scss)$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          ...cssLoaders,
        ],
      },
    ],
  },
  optimization: configureOptimization(),
  plugins: [
    // when we run the production build then
    // the docs folder is cleared
    new CleanWebpackPlugin({
      dry: false,
      verbose: true,
    }),

    // we extract scss files from js and create
    // separate files for individual pages
    new MiniCssExtractPlugin(configureMiniCssExtract()),

    // // we create a service-worker for our data
    // new WorkboxPlugin.GenerateSW(configureSW()),

    // we copy all necessary graphic files
    // and assets to build folder
    // new CopyWebpackPlugin(configureCopy()),

    // we create a global variable that
    // we use in pug and we can use in js
    // https://webpack.js.org/plugins/define-plugin/
    // In pug - var DATA = self.htmlWebpackPlugin.options.DATA
    new webpack.DefinePlugin({
      PRODUCTION: JSON.stringify(true),
    }),

    // Visualization of the size of js files
    new BundleAnalyzerPlugin({
      openAnalyzer: false,
    }),
  ],
});
