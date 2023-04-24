import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
const crc32 = (function () {
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
        files.forEach(function (file) {
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
    files.forEach(function (file) {
        var srcFile = path.join(s, file);
        var distFile = path.join(d, file);
        if (fs.statSync(srcFile).isDirectory()) {
            _cpdir(srcFile, distFile);
        } else {
            fs.copyFileSync(srcFile, distFile);
        }
    });
}
function _rmkdir(dir: string, mode?: number | string) {
    const info = path.parse(path.resolve(dir));
    if (!fs.existsSync(info.dir)) {
        _rmkdir(info.dir, mode);
    }
    const abs = path.resolve(dir);
    fs.mkdirSync(abs, mode);
}
class Dir {
    private _root: string;
    private _deep: number;
    private _maxDeep: number;
    constructor(root: string, deep: number, maxDeep: number) {
        this._deep = deep;
        this._root = path.resolve(root);
        this._maxDeep = maxDeep;
    }
    public each(block: (root: string, stat: fs.Stats, deep: number) => void, reg?: RegExp|FileFilter) {
        const dir = this._root;
        let deep = this._deep;
        const names = fs.readdirSync(dir);
        names.forEach((name) => {
            const file = path.join(dir, name);
            const stat = fs.statSync(file);
            if (stat.isDirectory()) {
                if (deep < this._maxDeep) {
                    new Dir(file, deep + 1, this._maxDeep).each(block, reg);
                }
            } else {
                if (reg instanceof RegExp) {
                    reg.test(file) && block(file, stat, deep);
                } else if(reg instanceof Function){
                    reg(file) && block(file, stat, deep);
                } else {
                    block(file, stat, deep);
                }
            }
        });
    }
    public count(reg?: RegExp|FileFilter) {
        let count = 0;
        this.each(() => {
            count++;
        }, reg);
        return count;
    }
    public find(reg: RegExp|FileFilter): string {
        const dir = this._root;
        let deep = this._deep;
        const names = fs.readdirSync(dir);
        for (const name of names) {
            const file = path.join(dir, name);
            const stat = fs.statSync(file);
            if (stat.isDirectory()) {
                if (deep < this._maxDeep) {
                    return new Dir(file, deep + 1, this._maxDeep).find(reg);
                }
            } else {
                if (reg instanceof RegExp){
                    if (reg.test(file)) {
                        return file;
                    }
                }else if (reg instanceof Function){
                    if (reg(file)) {
                        return file;
                    }
                }
            }
        }
    }
    public search(reg: RegExp|FileFilter) {
        const dir = this._root;
        let deep = this._deep;
        const names = fs.readdirSync(dir);
        const result = [];
        for (const name of names) {
            const file = path.join(dir, name);
            const stat = fs.statSync(file);
            if (stat.isDirectory()) {
                if (deep < this._maxDeep) {
                    result.push.apply(result, new Dir(file, deep + 1, this._maxDeep).search(reg));
                }
            } else {
                if (reg instanceof RegExp){
                    reg.test(file) && result.push(file);
                }else if (reg instanceof Function){
                    reg(file) && result.push(file);
                }
            }
        }
        return result;
    }
}

type FileFilter = (fullPath:string)=>boolean

interface IDir {
    /**
     * @description Synchronously and Recursively find a file which filePath match the reg.
     * @param regOrFilter the filePath matcher RegExp or filter
     */
    readonly find: (regOrFilter: RegExp|FileFilter) => string;
    /**
     * @description Synchronously and Recursively enumerate all file
     * @param fn each file callback function
     * @param regOrFilter the filePath matcher RegExp or filter
     */
    readonly each: (fn: (fullPath: string, stat: fs.Stats, deep: number) => void, regOrFilter?: RegExp|FileFilter) => void;
    /**
     * @description Synchronously and Recursively calculate count of file
     * @param regOrFilter the filePath matcher RegExp or filter
     */
    readonly count: (regOrFilter?: RegExp|FileFilter) => number;
    /**
     * @description Synchronously and Recursively search all files which filePath match the reg.
     * @param regOrFilter the filePath matcher RegExp  or filter
     */
    readonly search: (regOrFilter: RegExp|FileFilter) => string[];
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
export const mv: (src: string, dist: string) => void = fs.renameSync;
/**
 * @description Synchronously gen a md5 hash string for the file.
 * @param pathOrData A file path or file data
 */
export const md5 = (pathOrData: string | Buffer) => {
    const hh = crypto.createHash('md5');
    if (pathOrData instanceof Buffer) {
        hh.update(pathOrData);
    } else {
        hh.update(fs.readFileSync(pathOrData));
    }
    return hh.digest('hex');
};
/**
 * @description Synchronously gen a crc32 hash string for the file.
 * @notice crc32 number using hex encoding
 * @param pathOrData A file path or file data
 */
export const crc = (pathOrData: string | Buffer) => {
    if (pathOrData instanceof Buffer) {
        return (crc32(pathOrData) >>> 0).toString(16);
    }
    return (crc32(fs.readFileSync(pathOrData)) >>> 0).toString(16);
};
/**
 * @description Synchronously generate a folder handler.
 * @param path folder path
 * @param deep The max recurse deep. @default Number.MAX_SAFE_INTEGER
 */
export const dir = (root: string, deep: number = Number.MAX_SAFE_INTEGER): IDir => {
    if (!fs.statSync(root).isDirectory()) {
        throw new Error('The dir path:(' + root + ') must be directory!');
    }
    return new Dir(root, 1, deep);
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
 * @param A path to a file.
 * @param encoding file encoding @default utf8
 * @param flag If a flag is not provided, it defaults to `'r'`.
 * @returns file content string usring encoding.
 */
export const read = (file: string, flag?: string, encoding?: BufferEncoding) => {
    return fs.readFileSync(file, { flag ,encoding: encoding  || 'utf-8'})
};
/**
 * @description Synchronously reads the entire contents of a file.
 * @param A path to a file.
 * @param flag file open flag @default 'r'
 * @returns file data Buffer
 */
export const data = (file: string, flag?: string) => {
    return fs.readFileSync(file, { flag });
};
/**
 * @description Synchronously read all files from dir.
 * @param A path to a file.
 * @param encoding file encoding @default utf8
 * @returns file name array
 */
export const files: (dir: string, encoding?: BufferEncoding) => string[] = fs.readdirSync;
/**
 * @description Synchronously tests whether or not the given path exists by checking with the file system.
 * @param path A path to a file or directory.
 * URL support is _experimental_.
 */
export const exist: (path: string) => boolean = fs.existsSync;
/**
 * @description Synchronously get the fs.Stats of given file path
 * @param path A path to a file or directory.
 * URL support is _experimental_.
 */
export const stats: (path: string) => fs.Stats = fs.statSync;
/**
 * @description Synchronously create a directory.
 * @param path A path to a file.
 * @param opts The file mode or option object. If a string is passed, it is parsed as an octal integer. If not specified, defaults to `0o777`.
 * @param opts.recursive If true will create all the parent dir recursively. @notice This is different from core fs module
 */
export const mkdir = (dir: string, opts?: number | string | fs.MakeDirectoryOptions) => {
    let mode: number | string;
    let recursive = false;
    if (typeof opts === 'object') {
        mode = opts.mode;
        recursive = !!opts.recursive;
    } else {
        mode = opts;
    }
    if (recursive) {
        _rmkdir(dir, mode);
    } else {
        fs.mkdirSync(dir, mode);
    }
};

/**
 * @description Synchronously writes data to a file, replacing the file if it already exists.
 * @param path A path to a file.
 * If a file descriptor is provided, the underlying file will _not_ be closed automatically.
 * @param data The data to write. If something other than a Buffer or Uint8Array is provided, the value is coerced to a string.
 * @param opts Either the encoding for the file, or an object optionally specifying the encoding, file mode, and flag.
 * If `encoding` is not supplied, the default of `'utf8'` is used.
 * If `mode` is not supplied, the default of `0o666` is used.
 * If `mode` is a string, it is parsed as an octal integer.
 * If `flag` is not supplied, the default of `'w'` is used.
 */
export const write: (path: string, data: any, opts?: fs.WriteFileOptions) => void = fs.writeFileSync;
