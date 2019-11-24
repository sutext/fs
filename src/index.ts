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
 * @description Synchronously copy file or directory from src to dist.
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
 * @description Synchronously move file or directory to another.
 * @param src source file or directory
 * @param dist dist file or directory
 */
export const mv: (src: fs.PathLike, dist: fs.PathLike) => void = fs.renameSync;
/**
 * @description Synchronously gen a md5 hash string for the file.
 * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export const md5 = (file: fs.PathLike) => {
    const hh = crypto.createHash('md5');
    hh.update(fs.readFileSync(file));
    return hh.digest('hex');
};
/**
 * @description Synchronously gen a crc32 hash string for the file.
 * @notice crc32 number using hex encoding
 * @param file A path to a file. If a URL is provided, it must use the `file:` protocol.
 */
export const crc = (file: fs.PathLike) => {
    return (crc32(fs.readFileSync(file)) >>> 0).toString(16);
};
/**
 * @description Synchronously remove directory recursive.
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
 * @description Synchronously copy directory recursive.
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
/**
 * @description Synchronously reads the entire contents of a file.
 * @param A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param encoding file encoding @default utf8
 */
export const file = (path: fs.PathLike, encoding?: BufferEncoding) => {
    return fs.readFileSync(path).toString(encoding);
};
/**
 * @description Synchronously read all files from dir.
 * @param A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param encoding file encoding @default utf8
 */
export const files: (dir: fs.PathLike, encoding?: BufferEncoding) => string[] = fs.readdirSync;
/**
 * @description Synchronously tests whether or not the given path exists by checking with the file system.
 * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 */
export const exist: (path: fs.PathLike) => boolean = fs.existsSync;
/**
 * @description Synchronously get the fs.Stats of given file path
 * @param path A path to a file or directory. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 */
export const stats: (path: fs.PathLike) => fs.Stats = fs.statSync;
/**
 * @description Synchronously create a directory.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @param options Either the file mode, or an object optionally specifying the file mode and whether parent folders
 * should be created. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
 */
export const mkdir: (path: fs.PathLike, opts?: string | number | fs.MakeDirectoryOptions) => void = fs.mkdirSync;
/**
 * @description Synchronously writes data to a file, replacing the file if it already exists.
 * @param path A path to a file. If a URL is provided, it must use the `file:` protocol.
 * URL support is _experimental_.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
 * @param opts Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
 * If `encoding` is not supplied, the default of `'utf8'` is used.
 * If `mode` is not supplied, the default of `0o666` is used.
 * If `mode` is a string, it is parsed as an octal integer.
 * If `flag` is not supplied, the default of `'w'` is used.
 */
export const write: (path: fs.PathLike, data: any, opts?: fs.WriteFileOptions) => void = fs.writeFileSync;
