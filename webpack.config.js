const { merge } = require('webpack-merge');
const baseConfig = require('./webpack.config.base.js');
const devConfig = require('./webpack.config.development.js');
const prodConfig = require('./webpack.config.build.js');

module.exports = (env, argv) => {
	const isProduction = argv.mode === 'production';

	if (isProduction) {
		return merge(baseConfig(isProduction), prodConfig);
	} else {
		return merge(baseConfig(isProduction), devConfig);
	}
};
