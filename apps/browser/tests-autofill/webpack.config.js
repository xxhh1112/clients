const path = require("path");

const moduleRules = [
  {
    test: /\.[cm]?js$/,
    use: [
      {
        loader: "babel-loader",
        options: {
          configFile: false,
          plugins: ["@angular/compiler-cli/linker/babel"],
        },
      },
    ],
  },
  {
    test: /\.tsx?$/,
    loader: require.resolve('ts-loader'),
    exclude: /node_modules/,
    options: {
      compiler: 'ttypescript'
    }
  },
];

const config = {
  mode: "development",
  entry: {
    "autofill": "./tests-autofill/autofill.ts",
  },
  resolve: {
    extensions: [".ts", ".js"],
    symlinks: false,
    modules: [path.resolve("../../node_modules")],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build"),
  },
  module: { rules: moduleRules },
  plugins: [],
};

module.exports = config;
