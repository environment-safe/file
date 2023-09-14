/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it } from '@open-automaton/moka';
import { File } from '../src/index.mjs';
const should = chai.should();

describe('module', ()=>{
    describe('performs a simple test suite', ()=>{
        const fileName = 'file' + Math.floor( Math.random() * 1000000 );
        //*
        it(`creates, saves, loads & deletes ${fileName}`, async function(){
            this.timeout(20000);
            should.exist(File);
            const file = new File(fileName, {
                directory: 'documents',
                cache: true
            });
            (await File.exists(file.path, file.directory)).should.equal(false);
            await file.body('{}').save();
            (await File.exists(file.path, file.directory)).should.equal(true);
            await file.body('{"foo":"bar"}').save();
            const newFile = new File(fileName, {
                directory: 'documents',
                cache: true
            });
            const body = (await newFile.load()).body();
            const str = body.cast('string');
            str.should.equal('{"foo":"bar"}');
            await file.delete();
        }); //*/
        
        it('lists file in user\'s documents dir', async function(){
            //assumes you have some file in your documents directory
            const list = await File.list('documents', {
                files: true,
                directories: false
            });
            should.exist(list);
            const file = new File(list[0], {directory: 'documents'});
            await file.load();
            file.body().cast('string').length.should.be.above(1);
        });
        
        it('loads an implicit, relative URL', async function(){
            const file = new File('test/index.html');
            await file.load();
            const titleMatches = file.body().cast('string').match(/@environment-safe\/file/);
            should.exist(titleMatches);
            titleMatches.length.should.equal(1);
        });
        
        it('loads an explicit, relative URL', async function(){
            const file = new File('README.md', {directory: './node_modules/@environment-safe/chai'});
            await file.load();
            file.body().cast('string').length.should.be.above(1);
        });
    });
});

