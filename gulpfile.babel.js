import { series, parallel, src, dest, watch } from 'gulp';

import webpack  from 'webpack-stream';
import webpackConfig from './webpack.config';
import del from 'del';
import browserSync from 'browser-sync';
const bs = browserSync.create();

import imageMin from 'gulp-imagemin';
import postCss from 'gulp-postcss';
import rename from 'gulp-rename';
import htmlMin from 'gulp-htmlmin';
import inject from 'gulp-inject-string';

import { parseData, getHtml } from './src/js/objects/timeline';
import mcuData from './src/js/data.json';



function clean(){
    return del(['dist/*']);
}

function staticFiles(){
    return src(["src/*.*","!src/*.html"])
        .pipe(dest("dist/"));
}

function runWebpack(){
    return src('src/js/index.js')
        .pipe(webpack(webpackConfig))
        .pipe(dest("dist/"));
}

function compressImages(){
    return src("src/img/**/*.{jpg,png,gif,svg}")
        .pipe(imageMin())
        .pipe(dest("dist/img/"));
}

function styling(){
    return src("src/css/template.scss")
        .pipe(postCss())
        .pipe(rename("style.css"))
        .pipe(dest("dist/"))
        .pipe(bs.stream());
}

function createHtml(){
    const list = getHtml( parseData(mcuData.shows) );
    return src("src/index.html")
        .pipe(inject.replace("{{prerender}}",list))
        .pipe(htmlMin({
            removeComments: true,
            collapseWhitespace: true
        }))
        .pipe(dest("dist/"));
}

const build = series( clean, parallel(staticFiles, runWebpack, compressImages, styling, createHtml) );

export default build;


function startServer(){
    bs.init({
        server: {
            baseDir: "./dist/"
        }
    });

    watch("src/js/**",runWebpack).on("change", bs.reload);
    watch("src/img/**",compressImages).on("change", bs.reload);
    watch("src/css/**",styling);
    watch("src/*.html",createHtml).on("change", bs.reload);
    watch(["src/*.*","!src/*.html"],staticFiles).on("change", bs.reload);
}

export const start = series(build, startServer);