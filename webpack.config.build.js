const path = require('path');

// Minification
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const ImageminWebpWebpackPlugin = require('imagemin-webp-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	mode: 'production',

	devtool: 'source-map',
	devServer: {
		static: {
			directory: path.join(__dirname, 'public'),
		},
		port: 3000,
		open: true,
		hot: true,
		compress: true,
		historyApiFallback: true,
	},

	optimization: {
		splitChunks: {
			chunks: 'all',
		},
		minimize: true,
		minimizer: [
			new TerserPlugin({
				extractComments: true,
				terserOptions: {
					compress: {
						drop_console: true,
					},
				},
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
			new ImageminWebpWebpackPlugin(),
		],
	},
};
