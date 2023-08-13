import gulp from 'gulp';
import webp from 'gulp-webp';
import clean from 'gulp-clean';
import path from 'path';
import { deleteAsync } from 'del';

const inputDir = './pre';
const outputDir = './post';

gulp.task('clean', function () {
	return deleteAsync(outputDir);
});

gulp.task('copy-originals', function () {
	return gulp
		.src(path.join(inputDir, '*.{jpg,jpeg,png}'))
		.pipe(gulp.dest(outputDir));
});

gulp.task('convert-to-webp', function () {
	return gulp
		.src(path.join(inputDir, '*.{jpg,jpeg,png}'))
		.pipe(webp())
		.pipe(gulp.dest(outputDir));
});

gulp.task(
	'jpg-to-webp',
	gulp.series('clean', 'copy-originals', 'convert-to-webp')
);
