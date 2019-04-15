const fs = require('fs'),
	gulp = require('gulp'),
	git = require('gulp-git'),
	gulpFile = require('gulp-file'),
	header = require('gulp-header'),
	replace = require('gulp-replace'),
	paths = {
		dist: './dist/oblique-reactive/'
	},
	banner = function (pkg) {
		return '/*! \r * ' + pkg.title + ' - v' + pkg.version
			+ '\r * ' + pkg.homepage
			+ '\r * Copyright (c) ' + new Date().getFullYear() + ' ' + pkg.organization.name + ' (' + pkg.organization.url + ')'
			+ '\r */\n';
	};

const distSources = () => gulp.src([
		'node_modules/oblique-ui/css/**/*',
		'node_modules/oblique-ui/scss/**/*',
		'node_modules/oblique-ui/fonts/**/*',
		'node_modules/oblique-ui/images/**/*'
	], {base: 'node_modules/oblique-ui'}
)
	.pipe(gulp.dest(paths.dist + 'styles'));

const rewriteStylesPath = () =>
	gulp.src(paths.dist + 'styles/scss/themes/oblique-material.scss')
		.pipe(replace('~oblique-ui/scss/variables', '../variables'))
		.pipe(gulp.dest(paths.dist + 'styles/scss/themes'));


const distStyles = () =>
	gulp.src(['projects/oblique-reactive/src/scss/**/*'])
		.pipe(gulp.dest(paths.dist + 'styles/scss/themes'));


const distTestHelpers = () => gulp.src(['test_helpers/*']).pipe(gulp.dest(paths.dist + 'test_helpers'));


const distMeta = () => {
	const meta = reload('./package.json');
	const output = require(paths.dist + 'package.json');

	['version', 'description', 'keywords', 'author', 'contributors', 'homepage', 'repository', 'license', 'bugs', 'publishConfig']
		.forEach(field => output[field] = meta[field]);

	output['peerDependencies'] = {};
	output['scripts'] = {postinstall: 'node copy.js'};
	Object.keys(meta.dependencies).forEach((dependency) => output['peerDependencies'][dependency] = meta.dependencies[dependency]);

	return gulp.src(['README.md', 'CHANGELOG.md', 'copy.js'])
		.pipe(gulpFile('package.json', JSON.stringify(output, null, 2)))
		.pipe(gulp.dest(paths.dist));
};

const distBundle = () => {
	const meta = reload('./package.json');
	return gulp.src(paths.dist + 'bundles/oblique-reactive.umd.js')
		.pipe(header(banner(meta)))
		.pipe(gulp.dest(paths.dist + 'bundles'));
};

const commit = () => gulp.src('.')
	.pipe(git.add())
	.pipe(git.commit('chore(version): release version ' + getPackageJsonVersion()));


gulp.task(
	'dist',
	gulp.parallel(
		distSources,
		distTestHelpers,
		distMeta,
		gulp.series(distStyles, rewriteStylesPath),
		distBundle
	)
);

gulp.task(
	'publish',
	gulp.series(commit)
);

function reload(module) {
	// Uncache module:
	delete require.cache[require.resolve(module)];

	// Require module again:
	return require(module);
}

function getPackageJsonVersion() {
	// We parse the json file instead of using require because require caches
	// multiple calls so the version number won't be updated
	return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
}
