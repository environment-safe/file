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
            console.log(parsed);
            const path = parsed.toString();
            should.exist(path);
            path.substring(0, 2).should.equal('..');
        });
        
        it(`creates a new path`, async function(){
            Path.setRoot('C:\\foo');
            const path = Path.from('C:\\foo\\bar');
            console.log('>>>>', path.toString(), path);
        });
    });
});