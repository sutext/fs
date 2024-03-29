var xfs = require('../dist/index');
var assert = require('assert');
var fstr = 'Sheefsdfsdf哈哈哈哈t';
xfs.mkdir('test1');
xfs.write('test1/testFile', fstr);
console.log((-42398449 & 0xffffffff).toString(16));

describe('xfs tester', () => {
    it('xfs.cp file', () => {
        xfs.cp('test1/testFile', 'test2/test');
        assert.equal(xfs.exist('test2/test'), true);
        assert.equal(xfs.stats('test2').isDirectory(), true);
        assert.equal(xfs.stats('test2/test').isDirectory(), false);
    });
    it('xfs.cp dir', () => {
        xfs.cp('test1', 'test3');
        assert.equal(xfs.exist('test3'), true);
        assert.equal(xfs.stats('test3').isDirectory(), true);
    });
    it('xfs.cpdir', () => {
        xfs.cpdir('test1', 'test4');
        assert.equal(xfs.exist('test4'), true);
        assert.equal(xfs.stats('test4').isDirectory(), true);
    });
    it('xfs.hash crc32', () => {
        var hash1 = xfs.crc('test1/testFile');
        var hash2 = xfs.crc('test2/test');
        assert.equal(hash1, hash2);
        console.log(hash1);
    });
    it('xfs.hash md5', () => {
        var hash1 = xfs.md5('test3/testFile');
        var hash2 = xfs.md5('test4/testFile');
        assert.equal(hash1, hash2);
        console.log(hash1);
    });
    it('xfs.rm file', () => {
        xfs.rm('test1/testFile');
        assert.equal(xfs.exist('test1/testFile'), false);
        assert.equal(xfs.exist('test1'), true);
    });
    it('xfs.rm dir', () => {
        xfs.rm('test1');
        xfs.rm('test2');
        xfs.rmdir('test3');
        xfs.rmdir('test4');
        assert.equal(xfs.exist('test1'), false);
        assert.equal(xfs.exist('test2'), false);
        assert.equal(xfs.exist('test3'), false);
        assert.equal(xfs.exist('test4'), false);
        xfs.mkdir('testrecursive/test2/test3', { recursive: true });
        assert.equal(xfs.exist('testrecursive/test2/test3'), true);
        xfs.rm('testrecursive/test2/test3');
        assert.equal(xfs.exist('testrecursive/test2/test3'), false);
        xfs.rm('testrecursive');
        assert.equal(xfs.exist('testrecursive'), false);
    });
    it('xfs.dir', () => {
        var dir = xfs.dir('.', 1);
        var reg = /.+(\.json)$/;
        var test = function(name){
            return reg.test(name)
        }
        assert.equal(dir.count(reg), 4);
        assert.equal(dir.count(test), 4);
        var cfg = dir.find(function(name){
            return name.endsWith('tsconfig.json')
        })
        assert.ok(cfg.endsWith("tsconfig.json"))

    });
});
