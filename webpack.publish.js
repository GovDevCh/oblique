var webpack = require('webpack'),
	pkg = require('./package.json'),
	banner = function () { // Lazy evaluation as interpolated values may have been updated between tasks!
		return "\r * " + pkg.title + " - v" + pkg.version
			+ "\r * " + pkg.homepage
			+ "\r * Copyright (c) " + new Date().getFullYear() + " " + pkg.organization.name +" ("+ pkg.organization.url + ")"
			+ "\r";
	};

module.exports = {
	entry: './src/lib/index.ts',
	output: {
		filename: './dist/bundles/oblique-reactive.js',
		library: 'oblique-reactive',
		libraryTarget: 'umd'
	},
	plugins: [new webpack.optimize.UglifyJsPlugin(), new webpack.BannerPlugin(banner())],
	devtool: 'source-map',

	externals: [
		{
			'@angular/core': ngExternal('core'),
			'@angular/common': ngExternal('common'),
			'@angular/forms': ngExternal('forms')
		},
		rxjsExternal,
		'@ngx-translate/core', //TODO: Modification needed?
		'ajv'
	],
	resolve: {
		extensions: ['.ts', '.js']
	},
	module: {
		loaders: [
			{
				test: /\.ts$/,
				//exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							configFile: 'tsconfig.publish.json'
						}
					},
					'angular2-template-loader?keepUrl=true'
				],
				exclude: [/\.(spec|e2e)\.ts$/]
			},
			{
				test: /\.(html|css)$/,
				loader: 'raw-loader',
				exclude: /\.async\.(html|css)$/
			}
		]
	}
};

function ngExternal(ns) {
	var ng2Ns = '@angular/' + ns;
	return {root: ['ng', ns], commonjs: ng2Ns, commonjs2: ng2Ns, amd: ng2Ns};
}

function rxjsExternal(context, request, cb) {
	if (/^rxjs\/add\/observable\//.test(request)) {
		return cb(null, {root: ['Rx', 'Observable'], commonjs: request, commonjs2: request, amd: request});
	} else if (/^rxjs\/add\/operator\//.test(request)) {
		return cb(null, {root: ['Rx', 'Observable', 'prototype'], commonjs: request, commonjs2: request, amd: request});
	} else if (/^rxjs\//.test(request)) {
		return cb(null, {root: ['Rx'], commonjs: request, commonjs2: request, amd: request});
	}
	cb();
}
