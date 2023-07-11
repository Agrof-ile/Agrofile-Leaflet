const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');

const NodePolyfillWebpackPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
	entry: './src/index.ts',
	module: {
		rules: [
			{
				test: /\.js?$/,
				resolve: {
					fullySpecified: false, // disable the behaviour
				},
			},
			{
				test: /\.ts?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			},
			{
				test: /\.css$/,
				use: [
				  'style-loader',
				  'css-loader'
				]
			}
		],
	},
	resolve: {
		modules: [
			// path.resolve('./app/bundles'),
			'node_modules'
		],
		extensions: ['.tsx', '.ts', '.js'],
		fallback: {
			// 👇️👇️👇️ add this 👇️👇️👇️
			"fs": false,
			"os": false,
			"path": false,
		      }
	},
	output: {
		publicPath: '',
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
	plugins: [
		new HtmlWebpackPlugin({
		title: 'our project', 
		template: 'src/custom.html' }),
		new NodePolyfillWebpackPlugin()
	],
	devServer: {
		static: path.join(__dirname, "dist"),
		compress: true,
		port: 4000,
	}
};

if (module.hot)
  module.hot.accept()