'use strict'

import gulp from 'gulp';
import path from 'path';
import gulpWebpack from 'gulp-webpack';
import webpack from'webpack';
import runSequence from 'gulp-run-sequence';
const $ = require('gulp-load-plugins')();

const webpackConfig = {
    debug: true,
    entry: "./src/app/index.js",
    output: {
        filename: "bundle.js",
    },
    module: {
        loaders: [
            // if you're going to do both ng-cache and normal html loading, comment out the two loaders
            // and explicitly write the loader type yourself, e.g. require('html!./blah.html') or require('ng-cache!./blah.html')
            // { test: /\.html$/, loader: "ng-cache-loader" },
            // { test: /\.html$/, loader: "html-loader" },
            {test: /\.css$/, loader: "style!css"},
            {test: /\.scss$/, loader: "style-loader!css-loader!autoprefixer-loader!sass-loader"},
            {test: /\.png$/, loader: "url-loader?limit=100000&mimetype=image/png"},
            {test: /\.jpg$/, loader: "file-loader"},
        ]
    },
    resolve: {
        alias: {
            // lodash: path.resolve( __dirname, './app/bower_components/lodash/lodash.custom.min.js'),
            // models: path.resolve(__dirname, "./app/modules/common/models"),
        }
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
        // new webpack.ProvidePlugin({
        //     _: "lodash",
        // }),
        // uncomment for production. comment out during dev
        new webpack.optimize.UglifyJsPlugin({
            mangle: false
        })
    ]

};

// fire up the connect middleware to plug into the server
gulp.task('connect', function () {
    var connect = require('connect');
    var app = connect()
        .use(require('connect-livereload')({port: 35729}))
        .use(require('connect-modrewrite')([
            '!(\\..+)$ / [L]',
        ]))
        .use(connect.static('dist'))
        .use(connect.directory('dist'));

    require('http').createServer(app)
        .listen(9000)
        .on('listening', function () {
            console.log('Started connect web server on http://localhost:9000');
        });
});

// start the server
gulp.task('serve', ['connect'], function () {
    require('opn')('http://localhost:9000');
});

gulp.task('watch', ['connect', 'serve'], function () {
    var server = $.livereload();

    // watch for changes
    gulp.watch([
        'dist/bundle.js',
        'dist/index.html'
    ]).on('change', function (file) {
        console.log(file.path + " changed");
        server.changed(file.path);
    });

    // run webpack whenever the source files changes
    gulp.watch('src/app/**/*', ['repack']);
    gulp.watch('src/index.html', ['html']);
    // gulp.watch('app/images/*', ['images']);
});

// for development
gulp.task("webpack", function () {
    return gulp.src('src/app/index.js')
        .pipe(gulpWebpack(webpackConfig, webpack))
        .pipe(gulp.dest('dist/'))
});

gulp.task("repack", ['webpack'], function () {
    return gulp.src('dist/bundle.js')
        .pipe($.size());
});

gulp.task("html", function () {
    return gulp.src('src/index.html')
        .pipe(gulp.dest('dist/'));
});

// gulp.task("images", function() {
//     return gulp.src('src/app/images/*')
//         .pipe( $.imagemin({
//             optimizationLevel: 7
//         }))
//         .pipe(gulp.dest('dist/images'))
// });

gulp.task("vendor", function () {
    return gulp.src([
        'node_modules/angular-ui-router/release/angular-ui-router.min.js',
        'node_modules/angular/angular.min.js'
    ])
        .pipe($.order([
            'angular/angular.min.js',
            'angular-ui-router/release/angular-ui-router.min.js'
        ], {base: './node_modules'}))
        .pipe($.concat('vendor.js'))
        .pipe($.size())
        .pipe(gulp.dest('dist/'))
});


gulp.task('build', (cb) => {
    runSequence('webpack', 'vendor', 'watch', cb);
});