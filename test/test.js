var xfs = require('../dist/index');
var assert = require('assert');
xfs.mkdir('test1');
xfs.write('test1/testFile', 'teststr xxxxxx');
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
    it('xfs.rm file', () => {
        xfs.rm('test1/testFile');
        assert.equal(xfs.exist('test1/testFile'), false);
        assert.equal(xfs.exist('test1'), true);
    });
    it('xfs.rm dir', () => {
        xfs.rm('test1');
        assert.equal(xfs.exist('test1'), false);
    });
    it('xfs.rm dir', () => {
        xfs.rm('test2');
        assert.equal(xfs.exist('test2'), false);
    });
    it('xfs.rmdir', () => {
        xfs.rmdir('test3');
        xfs.rmdir('test4');
        assert.equal(xfs.exist('test3'), false);
        assert.equal(xfs.exist('test4'), false);
    });
});
