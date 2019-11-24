import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
const crc32 = (function() {
    function signed_crc_table() {
        var c = 0;
        var table = new Array(256);
        for (var n = 0; n != 256; ++n) {
            c = n;
            c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
            c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
            c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
            c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
            c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
            c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
            c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
            c = c & 1 ? -306674912 ^ (c >>> 1) : c >>> 1;
            table[n] = c;
        }
        return typeof Int32Array !== 'undefined' ? new Int32Array(table) : table;
    }
    var T = signed_crc_table();
    function crc32_buf_8(buf: Buffer, seed?: number) {
        var C = seed ^ -1,
            L = buf.length - 7;
        for (var i = 0; i < L; ) {
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
        }
        while (i < L + 7) C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
        return C ^ -1;
    }
    return function crc32_buf(buf: Buffer, seed?: number) {
        if (buf.length > 10000) return crc32_buf_8(buf, seed);
        var C = seed ^ -1,
            L = buf.length - 3;
        for (var i = 0; i < L; ) {
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
            C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
        }
        while (i < L + 3) C = (C >>> 8) ^ T[(C ^ buf[i++]) & 0xff];
        return C ^ -1;
    };
})();

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
 * @description copy file or directory from src to dist synchronous.
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
 * @description move file or directory to another synchronous.
 * @param src source file or directory
 * @param dist dist file or directory
 */
export const mv: (src: fs.PathLike, dist: fs.PathLike) => void = fs.renameSync;
/**
 * @description gen a md5 hash string for the file synchronous.
 * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export const md5 = (file: fs.PathLike) => {
    const hh = crypto.createHash('md5');
    hh.update(fs.readFileSync(file));
    return hh.digest('hex');
};
/**
 * @description gen a crc32 hash string for the file synchronous.
 * @notice crc32 number using hex encoding
 * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export const crc = (file: fs.PathLike) => {
    return crc32(fs.readFileSync(file)).toString(16);
};
/**
 * @description remove directory recursive synchronous.
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
 * @description copy directory recursive. synchronous.
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
export const exist: (path: fs.PathLike) => boolean = fs.existsSync;
export const stats: (path: fs.PathLike) => void = fs.statSync;
export const mkdir: (path: fs.PathLike, opts?: string | number | fs.MakeDirectoryOptions) => void = fs.mkdirSync;
export const write: (path: fs.PathLike, data: any, opts?: fs.WriteFileOptions) => void = fs.writeFileSync;
/**
 * @description read all files from a directory synchronous.
 * @param A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param encode file encoding @default utf8
 */
export const files: (dir: fs.PathLike, encode?: BufferEncoding) => string[] = fs.readdirSync;
