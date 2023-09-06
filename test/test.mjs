/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it } from '@open-automaton/moka';
import { File } from '../src/index.mjs';
const should = chai.should();

describe('module', ()=>{
    describe('performs a simple test suite', ()=>{
        it('creates, saves, loads & deletes a new garbage json', async ()=>{
            should.exist(File);
            const fileName = 'file' + Math.floor( Math.random() * 1000000 );
            const file = new File(fileName);
            (await File.exists(file.path)).should.equal(false);
            await file.body('{}').save();
            (await File.exists(file.path)).should.equal(true);
            await file.body('{"foo":"bar"}').save();
            const newFile = new File(fileName);
            (await newFile.load()).should.equal('{"foo":"bar"}');
            await file.delete();
        });
    });
});

