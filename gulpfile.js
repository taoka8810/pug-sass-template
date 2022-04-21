const { src, dest, watch, series, parallel } = require("gulp");
const plumber = require("gulp-plumber"); // エラー時のタスク停止
const notify = require("gulp-notify"); // エラー通知を行う
const browserSync = require("browser-sync"); // ブラウザの自動リロード
const pug = require("gulp-pug"); // pugのコンパイル
const scss = require("gulp-dart-sass"); // scssのコンパイル
const concat = require("gulp-concat"); // ファイルの結合
const uglify = require("gulp-uglify"); // jsファイルの圧縮
const imagemin = require("gulp-imagemin"); // 画像圧縮
const mozjpeg = require("imagemin-mozjpeg"); // jpeg圧縮に対応させる
const pngquant = require("imagemin-pngquant"); // pngの圧縮率を高める
const changed = require("gulp-changed"); // distフォルダ内の監視

const srcPath = {
  pug: "./src/pug/**/*.pug",
  scss: ["./src/scss/**/*.scss", "./src/scss/**/**/*.scss"],
  js: ["./src/js/*.js", "./src/js/lib/*.js", "./src/js/**/*.js"],
  img: ["./src/img/*", "./src/img/**/*"],
};

// Pugのコンパイル
const compilePug = () => {
  return src("./src/pug/index.pug")
    .pipe(plumber(notify.onError("Error: <%= error.message %>")))
    .pipe(pug())
    .pipe(dest("./dist"));
};

// Scssのコンパイル
const compileScss = () => {
  const scssOption = {
    outputStyle: "compressed",
  };
  return src("./src/scss/style.scss")
    .pipe(plumber(notify.onError("Error: <%= error.message %>")))
    .pipe(scss(scssOption))
    .pipe(dest("./dist"));
};

// jsのバンドル
const bundleJS = () => {
  return src(["./src/js/lib/*.js", "./src/js/*.js"])
    .pipe(plumber(notify.onError("Error: <%= error.message %>")))
    .pipe(concat("index.min.js"))
    .pipe(uglify())
    .pipe(dest("./dist"));
};

// 画像圧縮
const compressImage = () => {
  return src(srcPath.img)
    .pipe(plumber(notify.onError("Error: <%= error.message %>")))
    .pipe(changed("./dist/img/"))
    .pipe(
      imagemin([
        pngquant({
          quality: [0.6, 0.7],
          speed: 1,
        }),
        mozjpeg({ quality: 65 }),
        imagemin.svgo(),
        imagemin.optipng(),
        imagemin.gifsicle({ optimizationLevel: 3 }),
      ])
    )
    .pipe(dest("./dist/img/"));
};

// 表示ブラウザの初期設定
const browser = () => {
  return browserSync.init({
    server: {
      baseDir: "./dist/",
    },
    port: 3000,
    reloadOnRestart: true,
  });
};

// ブラウザの自動リロード
const browserReload = (done) => {
  browserSync.reload();
  done();
};

// ファイルのwatch
const watchFile = (done) => {
  watch(srcPath.pug, series(compilePug, browserReload));
  watch(srcPath.scss, series(compileScss, browserReload));
  watch(srcPath.js, series(bundleJS, browserReload));
  watch(srcPath.img, series(compressImage, browserReload));
  done();
};

exports.default = series(
  parallel(compilePug, compileScss, bundleJS, compressImage),
  watchFile,
  browser
);
