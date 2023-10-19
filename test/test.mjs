/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it, configure, bind } from '@open-automaton/moka';
import { File, Path, bindInput } from '../src/index.mjs';
bind(bindInput()); //this enables the `wantsInput` config
const should = chai.should();

describe('@environment-safe/file', ()=>{
    describe('performs a simple test suite', ()=>{
        const testKnownDirectory = 'videos';
        const filesystemName = Path.join(
            Path.location(testKnownDirectory), 
            `file${Math.floor( Math.random() * 1000000)}`
        );
        configure({
            dialog : (context, actions)=>{
                //when a dialog comes up, say OK
                actions.confirm();
            },
            wantsInput : (context, actions)=>{
                //when the system wants user input, click on something
                actions.click('#mocha-report');
            }
        });
        //*
        it(`creates, saves, loads & deletes ${filesystemName}`, async function(){
            this.timeout(40000);
            should.exist(File);
            const file = new File(filesystemName, { cache: true });
            (await File.exists(filesystemName)).should.equal(false);
            await file.body('{}').save();
            (await File.exists(filesystemName)).should.equal(true);
            await file.body('{"foo":"bar"}').save();
            const newFile = new File(filesystemName, { cache: true });
            const body = (await newFile.load()).body();
            const str = body.cast('string');
            str.should.equal('{"foo":"bar"}');
            await file.delete();
        }); //*/
        
        it('lists file in user\'s documents dir', async function(){
            //assumes you have some file in your documents directory
            const list = await File.list(Path.location(testKnownDirectory), {
                files: true,
                directories: false
            });
            should.exist(list);
            should.exist(list[0]);
            const file = new File(Path.join(
                Path.location(testKnownDirectory), 
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

