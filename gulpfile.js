const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const es = require('event-stream');

const paths = {
    scripts: './src/*.js',
    sheetImages: './src/sheetImages/*.png',
    sheetImageTemplate: './src/sheetImages/sheet.template.js',
    dist: './build',
    distDocs: './docs-src/static'
};

let pipes = {};

pipes.orderedScripts = () => plugins.order([
    'screen.js', 'screen_panel.js', 'screen_drawing.js', 'screen_preloading.js',
    'sheets.js', 'sheets_global.js'
])

pipes.minifiedFileName = () => plugins.rename(path=>path.extname = '.min' + path.extname)

pipes.globalSheetScripts = () => gulp.src(paths.sheetImages)
    .pipe(plugins.imageDataUri({
        template: {
            file: paths.sheetImageTemplate,
        }
    }))

pipes.validatedSrc = () => gulp.src(paths.scripts)
    // .pipe(plugins.jshint())
    // .pipe(plugins.jshint.reporter('jshint-stylish'))

pipes.builtLib = () =>
    es.merge(
        pipes.validatedSrc(),
        pipes.globalSheetScripts()
    )
    .pipe(pipes.orderedScripts())
    .pipe(plugins.concat('pxcan.js'))
    .pipe(plugins.babel({ presets: ['env'] }))
    .pipe(gulp.dest(paths.dist))

pipes.builtLibMin = () => pipes.builtLib()
    .pipe(plugins.uglify())
    .pipe(pipes.minifiedFileName())
    .pipe(gulp.dest(paths.dist))

pipes.builtLibDocs = () => pipes.builtLib()
    .pipe(gulp.dest(paths.distDocs))

gulp.task('build-dev', pipes.builtLib)
gulp.task('build-min', pipes.builtLibMin)
gulp.task('build-lib', pipes.builtLibDocs)
gulp.task('build', ['build-min', 'build-lib'])

gulp.task('watch-dev', ['build-dev'], () => {
    gulp.watch(paths.scripts, ['build-dev'])
    gulp.watch(paths.sheetImages, ['build-dev'])
    gulp.watch(paths.sheetImageTemplate, ['build-dev'])
})

gulp.task('watch', ['build'], () => {
    gulp.watch(paths.scripts, ['build'])
    gulp.watch(paths.sheetImages, ['build'])
    gulp.watch(paths.sheetImageTemplate, ['build'])
})

gulp.task('default', ['build']);