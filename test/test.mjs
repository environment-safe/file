/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it, configure } from '@open-automaton/moka';
import { File } from '../src/index.mjs';
const should = chai.should();

describe('module', ()=>{
    describe('performs a simple test suite', ()=>{
        const fileName = '!documents/file' + Math.floor( Math.random() * 1000000 );
        configure({
            dialog : (context, actions)=>{
                actions.confirm();
            } 
        });
        //*
        it(`creates, saves, loads & deletes ${fileName}`, async function(){
            console.log('A')
            this.timeout(20000);
            console.log('1');
            should.exist(File);
            const file = new File(fileName, { cache: true });
            console.log('2');
            (await File.exists(fileName)).should.equal(false);
            await file.body('{}').save();
            console.log('3');
            (await File.exists(fileName)).should.equal(true);
            await file.body('{"foo":"bar"}').save();
            console.log('4');
            const newFile = new File(fileName, { cache: true });
            console.log('5');
            const body = (await newFile.load()).body();
            const str = body.cast('string');
            str.should.equal('{"foo":"bar"}');
            await file.delete();
        }); //*/
        
        it.skip('lists file in user\'s documents dir', async function(){
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
        
        it.skip('loads an implicit, relative URL', async function(){
            const file = new File('test/local-file-test.html');
            await file.load();
            const titleMatches = file.body().cast('string').match(/@environment-safe\/file/);
            should.exist(titleMatches);
            titleMatches.length.should.equal(1);
        });
        
        it.skip('loads an explicit, relative URL', async function(){
            const file = new File('README.md', {directory: './node_modules/@environment-safe/chai'});
            await file.load();
            file.body().cast('string').length.should.be.above(1);
        });
    });
});

