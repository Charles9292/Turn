var gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  minifyCSS = require('gulp-minify-css'),
  gutil = require('gulp-util'),
  watchPath = require('gulp-watch-path'),
  autoprefixer = require('gulp-autoprefixer')

gulp.task('css', function() {
  gulp.src(['pc/css/*.css'])
    .pipe(autoprefixer({
      browsers: 'last 2 versions'
    }))
    .pipe(minifyCSS())
    .pipe(gulp.dest('dist/pc/css/'))
})

gulp.task('script', function() {
  gulp.src('pc/*/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/pc/'))
})

gulp.task('watchjs', function() {
  gulp.watch('pc/js/*.js', function(event) {
    var paths = watchPath(event, 'pc/', 'dist/pc/')
    gutil.log(gutil.colors.green(event.type) + ' ' + paths.srcPath)
    gutil.log('Dist ' + paths.distPath)
    gulp.src(paths.srcPath)
      .pipe(uglify())
      .pipe(gulp.dest(paths.distDir))
  })
})

gulp.task('watchCSS', function() {
  gulp.watch('pc/css/*.css', function(event) {
    var paths = watchPath(event, 'pc/', 'dist/pc/')
    gutil.log(gutil.colors.green(event.type) + ' ' + paths.srcPath)
    gutil.log('Dist ' + paths.distPath)
    gulp.src(paths.srcPath)
      .pipe(autoprefixer({
        browsers: 'last 2 versions'
      }))
      .pipe(minifyCSS())
      .pipe(gulp.dest(paths.distDir))
  })
})

gulp.task('default', ['script', 'css', 'watchjs', 'watchCSS'])
