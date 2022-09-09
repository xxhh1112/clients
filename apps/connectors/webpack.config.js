const fs = require("fs");
const path = require("path");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackInjector = require("html-webpack-injector");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

const pjson = require("./package.json");

const ENV = process.env.ENV == null ? "development" : process.env.ENV;
const NODE_ENV = process.env.NODE_ENV == null ? "development" : process.env.NODE_ENV;

const connectors = [
  { folder: "sso", name: "sso" },
  { folder: "captcha", name: "captcha" },
  { folder: "captcha", name: "captcha-mobile" },
  { folder: "webauthn", name: "webauthn" },
  { folder: "webauthn", name: "webauthn-fallback" },
  { folder: "duo", name: "duo" },
];

const moduleRules = [
  {
    test: /\.(html)$/,
    loader: "html-loader",
  },
  {
    test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
    exclude: /loading(|-white).svg/,
    generator: {
      filename: "fonts/[name][ext]",
    },
    type: "asset/resource",
  },
  {
    test: /\.(jpe?g|png|gif|svg|webp|avif)$/i,
    exclude: /.*(bwi-font)\.svg/,
    generator: {
      filename: "images/[name][ext]",
    },
    type: "asset/resource",
  },
  {
    test: /\.scss$/,
    use: [
      {
        loader: MiniCssExtractPlugin.loader,
      },
      "css-loader",
      "sass-loader",
    ],
  },
  {
    test: /\.css$/,
    use: [
      {
        loader: MiniCssExtractPlugin.loader,
      },
      "css-loader",
      "postcss-loader",
    ],
  },
  { test: /\.tsx?$/, loader: "ts-loader" },
];

const plugins = [
  new CleanWebpackPlugin(),
  new HtmlWebpackInjector(),
  ...connectors.map((connector) => {
    return new HtmlWebpackPlugin({
      template: `./src/${connector.folder}/${connector.name}.html`,
      filename: `${connector.name}.html`,
      chunks: [connector.name],
    });
  }),
  new MiniCssExtractPlugin({
    filename: "resources/[name].[contenthash].css",
    chunkFilename: "resources/[id].[contenthash].css",
  }),
  new webpack.ProvidePlugin({
    process: "process/browser.js",
  }),
  new webpack.EnvironmentPlugin({
    ENV: ENV,
    NODE_ENV: NODE_ENV === "production" ? "production" : "development",
    APPLICATION_VERSION: pjson.version,
    CACHE_TAG: Math.random().toString(36).substring(7),
  }),
];

const webpackConfig = {
  mode: NODE_ENV,
  devtool: "source-map",
  entry: connectors.reduce((entries, connector) => {
    entries[connector.name] = `./src/${connector.folder}/${connector.name}.ts`;
    return entries;
  }, {}),
  optimization: {
    minimizer: [new TerserPlugin()],
  },
  resolve: {
    extensions: [".ts", ".js"],
    symlinks: false,
    modules: [path.resolve("../../node_modules")],
    fallback: {
      buffer: false,
      util: require.resolve("util/"),
      assert: false,
      url: false,
    },
  },
  output: {
    filename: "resources/[name].[contenthash].js",
    path: path.resolve(__dirname, "build"),
  },
  module: { rules: moduleRules },
  plugins: plugins,
};

module.exports = webpackConfig;
