const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const Dotenv = require("dotenv-webpack");

module.exports = {
  entry: {
    background: "./src/background.ts",
    popup: "./src/popup/index.tsx",
    blocked: "./src/blocked-page/index.tsx",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  devtool: false, // Disable source maps to avoid CSP issues in Chrome extensions
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new Dotenv({
      path: path.resolve(__dirname, ".env"),
      safe: false, // Don't require .env.example
      systemvars: true, // Also load system environment variables
    }),
    new CopyPlugin({
      patterns: [
        { from: "manifest.json", to: "manifest.json" },
        { from: "src/popup/popup.html", to: "popup.html" },
        { from: "src/blocked-page/blocked.html", to: "blocked.html" },
        { from: "public", to: ".", noErrorOnMissing: true },
      ],
    }),
    // Note: dotenv-webpack automatically injects process.env variables via DefinePlugin
    // So we don't need a separate DefinePlugin here - that was causing the conflict warnings
  ],
  optimization: {
    minimize: false,
  },
};
