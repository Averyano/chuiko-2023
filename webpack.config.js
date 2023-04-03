const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// const BundleAnalyzerPlugin =
// 	require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const IS_DEVELOPMENT = process.env.NODE_ENV === 'dev';

const dirApp = path.join(__dirname, 'src', 'app');
const dirShared = path.join(__dirname, 'src', 'shared');
const dirImages = path.join(__dirname, 'src', 'shared', 'images');
const dirStyles = path.join(__dirname, 'src', 'styles');
const dirNode = 'node_modules';

module.exports = {
	mode: 'development',

	resolve: {
		modules: [dirApp, dirShared, dirStyles, dirNode],
	},

	entry: [path.join(dirApp, 'app.js'), path.join(dirStyles, 'index.scss')],

	plugins: [
		new webpack.DefinePlugin({ IS_DEVELOPMENT }),
		new CopyWebpackPlugin({
			patterns: [{ from: './src/shared/images', to: './images' }],
		}),
		new CopyWebpackPlugin({
			patterns: [{ from: './src/shared/models', to: './models' }],
		}),
		new MiniCssExtractPlugin({
			filename: '[name].css',
			chunkFilename: '[id].css',
		}),
		new CleanWebpackPlugin(),
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: path.join(__dirname, './src/index.pug'),
		}),
	],
	output: {
		path: path.join(__dirname, 'dist'),
		filename: '[name][contenthash].js',
		assetModuleFilename: '[name][ext]',
		publicPath: '/',
	},
	devtool: 'source-map',
	devServer: {
		static: {
			directory: path.join(__dirname, 'dist'),
		},
		port: 3000,
		open: true,
		hot: true,
		compress: true,
		historyApiFallback: true,
	},
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
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
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
				test: /\.pug$/,
				use: [
					{
						loader: 'html-loader',
					},
					{
						loader: 'pug-html-loader',
					},
				],
			},
		],
	},
	optimization: {
		splitChunks: {
			chunks: 'all',
		},
		minimize: false,
		minimizer: [
			new TerserPlugin({
				extractComments: true,
			}),
			new ImageMinimizerPlugin({
				minimizer: {
					implementation: ImageMinimizerPlugin.imageminMinify,
					options: {
						// Lossless optimization with custom option
						// Feel free to experiment with options for better result for you
						plugins: [
							['gifsicle', { interlaced: true }],
							['jpegtran', { progressive: true }],
							['optipng', { optimizationLevel: 10 }],
							// Svgo configuration here https://github.com/svg/svgo#configuration
							[
								'svgo',
								{
									name: 'preset-default',
									params: {
										overrides: {
											removeViewBox: false,
											addAttributesToSVGElement: {
												params: {
													attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
												},
											},
										},
									},
								},
							],
						],
					},
				},
			}),
		],
	},
};
