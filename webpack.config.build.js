const { merge } = require('webpack-merge');
const path = require('path');

const config = require('./webpack.config');

module.exports = merge(config, {
	mode: 'production',

	output: {
		path: path.join(__dirname, 'dist'),
		assetModuleFilename: '[name].[ext]',
	},
});
