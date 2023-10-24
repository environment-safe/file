/* global describe:false */
import { chai } from '@environment-safe/chai';
import { it, configure, interactive } from '@open-automaton/moka';
import { File, Path, Download } from '../src/index.mjs';
import { FileBuffer } from '../src/buffer.mjs';
import { isServer } from '@environment-safe/runtime-context';
const should = chai.should();

describe('@environment-safe/file', ()=>{
    describe('performs a simple test suite', ()=>{
        const testKnownDirectory = 'videos';
        const filesystemName = Path.join(
            Path.location(testKnownDirectory), 
            `file${Math.floor( Math.random() * 1000000)}`
        );
        const fileProtocolName = `file://${Path.join(Path.current, 'src', 'index.mjs')}`;
        const missingFileProtocolName = `file://${Path.join(Path.current, 'src', 'unknown.mjs')}`;
        const fileRelativeName = Path.join('..', 'src', 'index.mjs');
        const fileRelativeSaveName = Path.join(Path.location('downloads'), 'index.mjs');
        const missingFileRelativeName = Path.join('..', 'src', 'unknown.mjs');
        const download = new Download();
        configure({
            dialog : async (context, actions)=> await actions.confirm(), // OK everything,
            wantsInput : async (context, actions)=> await actions.click('#mocha'), // click everything
            downloads: (dl)=> download.observe(dl)
        });
        /**********************************************************
          * Until Playwright supports the filesystem APIs this must 
          * tested interactively and should be skipped headless
          **********************************************************/
          //interactive
        it.skip(`creates, saves, loads & deletes ${filesystemName} using FilesystemAPI`, async function(){
            this.timeout(40000);
            should.exist(File);
            const options = { cache: true, filesystemAPI: true };
            const file = new File(filesystemName, options);
            (await File.exists(filesystemName)).should.equal(false);
            await file.body('{}').save();
            (await File.exists(filesystemName)).should.equal(true);
            await file.body('{"foo":"bar"}').save();
            const newFile = new File(filesystemName, options);
            const body = (await newFile.load()).body();
            const str = body.cast('string');
            str.should.equal('{"foo":"bar"}');
            await file.delete();
        }); //*/
        
        it(`examines & loads ${fileProtocolName}`, async function(){
            this.timeout(40000);
            should.exist(File);
            (await File.exists(missingFileProtocolName)).should.equal(false);
            (await File.exists(fileProtocolName)).should.equal(true);
            const file = new File(fileProtocolName, { cache: true });
            const body = (await file.load()).body();
            const str = body.cast('string');
            str.should.contain('export class File');
        });
        
        it(`examines & loads ${fileRelativeName}`, async function(){
            this.timeout(40000);
            should.exist(File);
            (await File.exists(missingFileRelativeName)).should.equal(false);
            (await File.exists(fileRelativeName)).should.equal(true);
            const file = new File(fileRelativeName, { cache: true });
            const body = (await file.load()).body();
            const str = body.cast('string');
            str.should.contain('export class File');
        });
        
        it(`saves ${fileRelativeName}`, async function(){
            this.timeout(40000);
            should.exist(File);
            (await File.exists(fileRelativeName)).should.equal(true);
            const file = new File(fileRelativeName, { cache: true });
            //we're going to live dangerously and replace the source, because we save to downloads
            await file.load();
            file.body('foo!');
            const anticipatedDownload = download.expect();
            await file.save();
            const downloadedText = await anticipatedDownload;
            downloadedText.should.equal('foo!');
        });
        
        it.skip('lists file in user\'s documents dir', async function(){
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
        
        it.skip('loads an implicit, relative URL', async function(){
            const file = new File('test/local-file-test.html');
            await file.load();
            const titleMatches = file.body().cast('string').match(/@environment-safe\/file/);
            should.exist(titleMatches);
            titleMatches.length.should.equal(1);
        });
        
        it.skip('loads an explicit, relative URL', async function(){
            const file = new File(Path.join(
                './node_modules/@environment-safe/chai',
                'README.md'
            ));
            await file.load();
            file.body().cast('string').length.should.be.above(1);
        });
    });
});

