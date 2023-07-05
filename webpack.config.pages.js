// Routes
const webpackPageRoutes = {
	rewrites: [
		{ from: /^\/$/, to: '/index.html' },
		{ from: /^\/home$/, to: '/index.html' },
		{ from: /^\/gallery$/, to: '/index.html' },
		{ from: /^\/404$/, to: '/notfound.html' },
		{ from: /./, to: '/notfound.html' },
	],
};

// For HTML plugin
const dataJson = require('./data/home.json');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const otherPages = ['notfound'];

let pagePlugins = [];

if (otherPages.length > 0) {
	pagePlugins = otherPages.map(
		(page) =>
			new HtmlWebpackPlugin({
				template: path.join(__dirname, 'views', 'pages', page, 'index.pug'),
				filename: `${page}.html`,
				data: dataJson,
			})
	);
}

module.exports.webpackPageRoutes = webpackPageRoutes;
module.exports.pagePlugins = pagePlugins;
