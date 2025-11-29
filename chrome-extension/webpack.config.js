const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
// Load .env file directly first to ensure values are available
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Verify values are loaded (for debugging)
const supabaseUrl = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

if (supabaseUrl !== "YOUR_SUPABASE_URL") {
  console.log(
    "✓ Supabase URL loaded from .env:",
    supabaseUrl.substring(0, 30) + "..."
  );
} else {
  console.warn("⚠️ Supabase URL not found in .env file");
}

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
    // Explicitly define environment variables (already loaded via require('dotenv') above)
    new webpack.DefinePlugin({
      "process.env.SUPABASE_URL": JSON.stringify(supabaseUrl),
      "process.env.SUPABASE_ANON_KEY": JSON.stringify(supabaseKey),
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
