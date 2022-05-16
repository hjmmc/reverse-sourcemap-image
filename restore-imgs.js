var fs = require('fs');
var path = require('path');

//vue 编译后的图片文件路径
var distPath = 'dist/';
//从编译后的 map 文件还原项目代码: reverse-sourcemap --output-dir src dist/static/**/*.map
//此时 src 内的图片只是到源文件的一个连接，使用该脚本可以还原图片
//要遍历的 webpack 图片文件夹所在的路径
var srcPath = 'src/';
//图片的后缀
var imgTypes = ['.png', '.jpg', '.jpeg', '.gif'];
//还原后输出的文件夹
var destPath = 'imgOutput/';


function main() {
    fileDisplay(srcPath, function(filedir) {
        if (imgTypes.find(e => filedir.endsWith(e))) {
            var txt = fs.readFileSync(filedir).toString();
            var reg = /.*__webpack_public_path__.*['\"](.*)['\"]/;
            var reg2 = /\/\/\sWEBPACK\sFOOTER\n\/\/\s(.*)/;
            var m = reg.exec(txt);
            var m2 = reg2.exec(txt);
            if (m) {
                // 可能是到资源文件的一个链接
                var srcImgPath = path.resolve(distPath + m[1]);
                var imgPath = path.resolve(destPath + m2[1]);
                fs.mkdirSync(path.dirname(imgPath), {
                    recursive: true
                });
                fs.copyFileSync(srcImgPath, imgPath);
                console.log(imgPath);
            } else {
                // 可能是 base64 编码
                var reg3 = /.*"data:image\/[a-z]+;base64,(.*)/;
                var m3 = reg3.exec(txt);
                if (m3) {
                    var buff = new Buffer(m3[1], 'base64');
                    var imgPath = path.resolve(destPath + m2[1]);
                    fs.mkdirSync(path.dirname(imgPath), {
                        recursive: true
                    });
                    fs.writeFileSync(imgPath, buff);
                    console.log(imgPath);
                } else {
                    console.warn('no mutch', filedir);
                }
            }
        }
    })
}


/**
 * 文件遍历方法
 */
function fileDisplay(filePath, cb) {
    //根据文件路径读取文件，返回文件列表
    fs.readdir(filePath, function(err, files) {
        if (err) {
            console.warn(err, "读取文件夹错误！");
        } else {
            files.forEach(function(filename) {
                var filedir = path.join(filePath, filename);
                fs.stat(filedir, function(eror, stats) {
                    if (eror) {
                        console.warn('获取文件stats失败');
                    } else {
                        var isFile = stats.isFile();
                        var isDir = stats.isDirectory();
                        if (isFile) {
                            cb(filedir);
                        }
                        if (isDir) {
                            fileDisplay(filedir, cb); //递归
                        }
                    }
                })
            });
        }
    });
}

main();