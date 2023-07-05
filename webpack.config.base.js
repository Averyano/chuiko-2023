const path = require('path');

// const BundleAnalyzerPlugin =
// 	require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

// General Webpack plugin
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Compression for Prod
const CompressionPlugin = require('compression-webpack-plugin');

// Folders
const dirApp = path.join(__dirname, 'app');
const dirShared = path.join(__dirname, 'shared');
const dirImages = path.join(__dirname, 'shared', 'images');
const dirIcons = path.join(__dirname, 'shared', 'images', 'icons');
const dirPDF = path.join(__dirname, 'shared', 'pdf');
const dirOther = path.join(__dirname, 'shared', 'other');
const dirModels = path.join(__dirname, 'shared', 'models');
const dirStyles = path.join(__dirname, 'styles');
const dirNode = 'node_modules';
const { pagePlugins } = require('./webpack.config.pages');

// Data for Views
const dataJson = require('./data/home.json');

const webpSrc = (src) => {
	return src.replace(/\.(png|jpe?g)$/i, '.webp');
};

const baseConfig = (isProduction) => {
	/**
	 * Plugins
	 */

	const plugins = [
		// new webpack.DefinePlugin({ IS_DEVELOPMENT }),
		new CopyWebpackPlugin({
			patterns: [
				{ from: dirImages, to: './images' },
				{ from: dirIcons, to: './icons' },
				{ from: dirModels, to: './models' },
				{ from: dirPDF, to: './pdf' },
				{ from: dirOther, to: './' },
			],
		}),
		new MiniCssExtractPlugin({
			filename: '[name].css',
			chunkFilename: '[id].css',
		}),
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			data: dataJson,
			methods: {
				webpSrc: webpSrc,
			},
			template: path.join(__dirname, 'views', 'pages', 'home', 'index.pug'),
		}),
		...pagePlugins,
	];

	if (isProduction) {
		plugins.push(
			new CompressionPlugin({
				algorithm: 'gzip',
				test: /\.(js|css|html|svg)$/,
				threshold: 10240,
				minRatio: 0.8,
			}),
			new CompressionPlugin({
				algorithm: 'brotliCompress',
				test: /\.(js|css|html|svg)$/,
				compressionOptions: {
					level: 11,
				},
				threshold: 10240,
				minRatio: 0.8,
			})
		);
	}

	/**
	 * Base Build
	 */
	return {
		// cache: true,

		resolve: {
			modules: [dirApp, dirShared, dirStyles, dirModels, dirNode],
		},

		entry: [path.join(dirApp, 'app.js'), path.join(dirStyles, 'index.scss')],

		output: {
			path: path.join(__dirname, 'public'),
			filename: '[name][contenthash].js',
			assetModuleFilename: '[name][ext]',
			publicPath: '/',
		},

		plugins: plugins,

		module: {
			rules: [
				{
					test: /\.scss$/,
					use: [
						{
							loader: MiniCssExtractPlugin.loader,
							options: {
								publicPath: '',
							},
						},
						{
							loader: 'css-loader',
						},
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: {
									plugins: [
										['postcss-preset-env', {}],
										['autoprefixer', {}],
									],
								},
							},
						},
						{
							loader: 'sass-loader',
						},
					],
				},
				{
					test: /\.(glsl|vs|fs|vert|frag)$/,
					exclude: /node_modules/,
					use: ['raw-loader'],
				},
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env'],
						},
					},
				},
				{
					test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'images/[name][ext]',
					},
				},
				{
					test: /\.(glb|gltf)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'models/[name][ext]',
					},
				},
				{
					test: /\.(woff|woff2|ttf|otf)$/i,
					type: 'asset/resource',
					generator: {
						filename: 'fonts/[name][ext]',
					},
				},
				{
					test: /\.svg$/,
					type: 'asset/inline',
					// Inline assets with the "inline" query parameter.
					resourceQuery: /inline/,
				},
				{
					test: /\.json$/,
					type: 'asset/resource',
					generator: {
						filename: '[name][ext][query]',
					},
				},
				{
					test: /\.pug$/,
					loader: '@webdiscus/pug-loader',
					options: {
						method: 'render',
						// globals: [webpSrc],
					},
				},
			],
		},
	};
};

module.exports = baseConfig;
