/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it, configure } from '@open-automaton/moka';
import { File, Path } from '../src/index.mjs';
const should = chai.should();

describe('@environment-safe/file', ()=>{
    describe('performs a simple test suite', ()=>{
        const filesystemName = Path.join(
            Path.location('videos'), 
            `file${Math.floor( Math.random() * 1000000)}`
        );
        configure({
            dialog : (context, actions)=>{
                actions.confirm();
            } 
        });
        //*
        it(`creates, saves, loads & deletes ${filesystemName}`, async function(){
            this.timeout(40000);
            should.exist(File);
            console.log('1');
            const file = new File(filesystemName, { cache: true });
            console.log('2');
            (await File.exists(filesystemName)).should.equal(false);
            console.log('3');
            await file.body('{}').save();
            console.log('4');
            (await File.exists(filesystemName)).should.equal(true);
            console.log('5');
            await file.body('{"foo":"bar"}').save();
            console.log('6');
            const newFile = new File(filesystemName, { cache: true });
            console.log('7');
            const body = (await newFile.load()).body();
            const str = body.cast('string');
            str.should.equal('{"foo":"bar"}');
            await file.delete();
        }); //*/
        
        it('lists file in user\'s documents dir', async function(){
            //assumes you have some file in your documents directory
            const list = await File.list(Path.location('documents'), {
                files: true,
                directories: false
            });
            should.exist(list);
            should.exist(list[0]);
            const file = new File(Path.join(
                Path.location('documents'), 
                list[0]
            ));
            await file.load();
            file.body().cast('string').length.should.be.above(1);
        });
        
        it('loads an implicit, relative URL', async function(){
            const file = new File('test/local-file-test.html');
            await file.load();
            const titleMatches = file.body().cast('string').match(/@environment-safe\/file/);
            should.exist(titleMatches);
            titleMatches.length.should.equal(1);
        });
        
        it('loads an explicit, relative URL', async function(){
            const file = new File(Path.join(
                './node_modules/@environment-safe/chai',
                'README.md'
            ));
            await file.load();
            file.body().cast('string').length.should.be.above(1);
        });
    });
});

