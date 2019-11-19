import * as fs from 'fs';
import * as path from 'path';
function _rmdir(dir: string) {
    var files = [];
    if (fs.existsSync(dir)) {
        files = fs.readdirSync(dir);
        files.forEach(function(file) {
            var sub = path.join(dir, file);
            if (fs.statSync(sub).isDirectory()) {
                _rmdir(sub);
            } else {
                fs.unlinkSync(sub);
            }
        });
        fs.rmdirSync(dir);
    }
}
function _cpdir(s: string, d: string) {
    fs.mkdirSync(d);
    var files = fs.readdirSync(s);
    files.forEach(function(file) {
        var srcFile = path.join(s, file);
        var distFile = path.join(d, file);
        if (fs.statSync(srcFile).isDirectory()) {
            _cpdir(srcFile, distFile);
        } else {
            fs.copyFileSync(srcFile, distFile);
        }
    });
}
/**
 * @description Remove all of fileOrdDir
 * @param fileOrdDir
 */
export const rm = (fileOrdDir: string) => {
    if (!fs.existsSync(fileOrdDir)) {
        throw new Error('The fileOrdDir:(' + fileOrdDir + ') not exist!');
    }
    if (fs.statSync(fileOrdDir).isDirectory()) {
        _rmdir(fileOrdDir);
    } else {
        fs.unlinkSync(fileOrdDir);
    }
};
/**
 * @description remove directory recursive
 * @throws dir not exist error
 * @param src The source directory.
 */
export const rmdir = (src: string) => {
    if (!fs.existsSync(src)) {
        throw new Error('The src:(' + src + ') dir not exist!');
    }
    if (!fs.statSync(src).isDirectory()) {
        throw new Error('The src:(' + src + ') is not a directory!');
    }
    _rmdir(src);
};
/**
 * @description copy file or directory from src to dist
 * @param src the source file or directory
 * @param dist the dist file or directory
 * @notice if dist dir not exist the method will try to create
 */
export const cp = (src: string, dist: string) => {
    if (!fs.existsSync(src)) {
        throw new Error('The src:(' + src + ') file or dir not exist!');
    }
    if (fs.statSync(src).isDirectory()) {
        _cpdir(src, dist);
    } else {
        var parsed = path.parse(dist);
        if (!fs.existsSync(parsed.dir)) {
            fs.mkdirSync(parsed.dir);
        } else if (!fs.statSync(parsed.dir).isDirectory()) {
            throw new Error('The directory of file:(' + dist + ') invalid!');
        }
        fs.copyFileSync(src, dist);
    }
};
/**
 * @description copy directory recursive.
 * @param src the source directory must be exist
 * @param dist the dist directory must not exist
 */
export const cpdir = (src: string, dist: string) => {
    if (!fs.existsSync(src)) {
        throw new Error('The src:(' + src + ') dir not exist!');
    }
    if (!fs.statSync(src).isDirectory()) {
        throw new Error('The src:(' + src + ') must be directory!');
    }
    if (fs.existsSync(dist)) {
        throw new Error('The dist:(' + dist + ') dir already exist!');
    }
    _cpdir(src, dist);
};
