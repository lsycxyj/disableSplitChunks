const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

// only form HtmlWebPackPlugin
const config = require('./config');

// configure Babel Loader
const configureBabelLoader = () => {
  return {
    test: /\.js$/,
    exclude: /node_modules/,
    use: {
      loader: 'babel-loader',
    },
  };
};

// configure Pug Loader
const configurePugLoader = () => {
  return {
    test: /\.pug$/,
    loader: 'pug-loader',
    options: {
      pretty: true,
      self: true,
    },
  };
};

// configure HtmlWebPackPlugin
const entryHtmlPlugins = config.map(({ site }) => {
  return new HtmlWebPackPlugin({
    filename: `${site}.html`,

    // template for individual pages index, about and contact
    template: `./sources/templates/index.ejs`,
    title: site,
    inject: true,
    minify: false,

    // injecting js and css files into
    // html as well as common share.js file
    chunks: [site],
  });
});

// configure Output
const configureOutput = () => {
  return {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].[contenthash].js',
    // assetModuleFilename: 'images/static/[name].[hash][ext]',
  };
};

const entries = config.reduce((acc, item) => {
  acc[item.site] = path.resolve(__dirname, `../sources/js/${item.site}.js`);
  return acc;
}, {});

module.exports = {
  // input files
  entry: entries,
  // configuration of output files
  output: configureOutput(),
  module: {
    rules: [
      // Images, fonts, e.t.c: Copy files to build folder
      // https://webpack.js.org/guides/asset-modules/#resource-assets
      {
        test: /\.svg/,
        type: 'asset/resource',
        generator: {
          // adding a hash to the file
          filename: 'images/static/[name].[hash][ext]',
        },
      },

      // OR -------------------------

      // creates an inline svg
      // {
      //   test: /\.svg/,
      //   type: 'asset/inline',
      // },

      // OR -------------------------

      // {
      //   test: /\.svg/,
      //   type: "asset",
      //   generator: {
      //     // adding a hash to the file
      //     // and copy to specific folder
      //     filename: 'images/static/[name].[hash][ext]',
      //   },

      //   // depending on the size of the file,
      //   // if the file is too small, the file is inline,
      //   // if the larger niche size, the file is only copied
      //   parser: {
      //     dataUrlCondition: {
      //       maxSize: 30 * 1024, // 30 * 1024
      //     }
      //   },
      // },

      // ----------------------------

      // Other uses, fonts
      // the above solution works not only on
      // graphic files but also on fonts etc.

      {
        test: /\.(woff(2)?|eot|ttf|otf)$/,
        type: 'asset/inline',
      },

      configureBabelLoader(),
      // configurePugLoader(),
    ],
  },
  plugins: [...entryHtmlPlugins],
};
