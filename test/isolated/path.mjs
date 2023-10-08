import { chai } from '@environment-safe/chai';
import { it, configure } from '@open-automaton/moka';
import * as path from 'path';
import * as os from 'os';
import { Path } from '../../src/path.mjs';
const should = chai.should();


describe('module', ()=>{
    describe('performs a simple test suite', ()=>{
        
        // This test assumes you are executing from within your home dir
        it(`identifies PWD relative to user home`, ()=>{
            const parsed = Path.from(Path.location('home'));
            const path = parsed.toString();
            should.exist(path);
            path.substring(0, 2).should.equal('..');
        });
        
        it(`identifies a relative windows path`, async function(){
            const oldRoot = Path.current;
            Path.current = 'C:\\foo';
            const path = Path.from('C:\\foo\\bar');
            path.toString().should.equal('bar');
            Path.current = 'C:\\foo';
            const subpath = Path.from('C:\\foo\\bar\\baz');
            subpath.toString().should.equal('bar\\baz');
            Path.current = 'C:\\foo\\nardo';
            const relativePath = Path.from('C:\\foo\\bar\\baz');
            relativePath.toString().should.equal('..\\bar\\baz');
            Path.current = oldRoot;
        });
        
        it(`identifies a relative posix path`, async function(){
            const oldRoot = Path.current;
            Path.current = '/foo';
            const path = Path.from('/foo/bar');
            path.toString().should.equal('bar');
            Path.current = '/foo';
            const subpath = Path.from('/foo/bar/baz');
            subpath.toString().should.equal('bar/baz');
            Path.current = '/foo/nardo';
            const relativePath = Path.from('/foo/bar/baz');
            relativePath.toString().should.equal('../bar/baz');
            Path.current = oldRoot;
        });
    });
});