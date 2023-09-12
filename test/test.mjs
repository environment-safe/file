/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it } from '@open-automaton/moka';
import { File } from '../src/index.mjs';
const should = chai.should();

describe('module', ()=>{
    describe('performs a simple test suite', ()=>{
        const fileName = 'file' + Math.floor( Math.random() * 1000000 );
        it(`creates, saves, loads & deletes ${fileName}`, async function(){
            this.timeout(20000);
            should.exist(File);
            const file = new File(fileName, {cache: true});
            (await File.exists(file.path, file.directory)).should.equal(false);
            await file.body('{}').save();
            (await File.exists(file.path, file.directory)).should.equal(true);
            await file.body('{"foo":"bar"}').save();
            const newFile = new File(fileName, {cache: true});
            const body = (await newFile.load()).body();
            const str = body.cast('string');
            str.should.equal('{"foo":"bar"}');
            //await file.delete();
        });
    });
});

