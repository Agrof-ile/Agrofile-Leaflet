const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require('path');
// const Buffer = require('buffer/').Buffer;

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

// const webpackConfig = {
// 	resolve: {
// 	    fallback: {
// 		buffer: require.resolve('buffer/'),
// 	    },
// 	},
// 	plugins: [
// 	    new webpack.ProvidePlugin({
// 		Buffer: ['buffer', 'Buffer'],
// 	    }),
// 	],
//     };

if (module.hot)
  module.hot.accept()