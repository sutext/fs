var fs = require('fs');
var xfs = require('../dist/index');
var assert = require('assert');
fs.mkdirSync('test1');
fs.writeFileSync('test1/testFile', 'teststr xxxxxx');
describe('xfs tester', () => {
    it('xfs.cp file', () => {
        xfs.cp('test1/testFile', 'test2/test');
        assert.equal(fs.existsSync('test2/test'), true);
        assert.equal(fs.statSync('test2').isDirectory(), true);
        assert.equal(fs.statSync('test2/test').isDirectory(), false);
    });
    it('xfs.cp dir', () => {
        xfs.cp('test1', 'test3');
        assert.equal(fs.existsSync('test3'), true);
        assert.equal(fs.statSync('test3').isDirectory(), true);
    });
    it('xfs.cpdir', () => {
        xfs.cpdir('test1', 'test4');
        assert.equal(fs.existsSync('test4'), true);
        assert.equal(fs.statSync('test4').isDirectory(), true);
    });
    it('xfs.rm file', () => {
        xfs.rm('test1/testFile');
        assert.equal(fs.existsSync('test1/testFile'), false);
        assert.equal(fs.existsSync('test1'), true);
    });
    it('xfs.rm dir', () => {
        xfs.rm('test1');
        assert.equal(fs.existsSync('test1'), false);
    });
    it('xfs.rm dir', () => {
        xfs.rm('test2');
        assert.equal(fs.existsSync('test2'), false);
    });
    it('xfs.rmdir', () => {
        xfs.rmdir('test3');
        xfs.rmdir('test4');
        assert.equal(fs.existsSync('test3'), false);
        assert.equal(fs.existsSync('test4'), false);
    });
});