const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/main.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
    }),
  ],
  devServer: {
    static: "./dist",
    port: 3001,
    historyApiFallback: {
      rewrites: [
        // OAuth callback routes - serve index.html
        { from: /^\/login-success/, to: "/index.html" },
        { from: /^\/login-failed/, to: "/index.html" },
        { from: /^\/mock-google-auth/, to: "/index.html" },
        // Default fallback
        { from: /./, to: "/index.html" },
      ],
    },
    proxy: {
      "/api": "http://backend:3000", // Proxy API calls to backend container in Docker
    },
  },
};
