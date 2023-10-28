/**
 * A JSON object
 * @typedef { object } JSON
 */
 
// Isn't the fact that we had 2 path scenarios driven by OS, fixed it, (win, unix)
// and we now have an explosion an obvious indicator that we went wrong?
// win, posix, file:win, file:posix, known dirs, web urls, plus file: behavior is different on local vs server
 
import { FileBuffer } from './buffer.mjs';
import {
    isServer, // is running on a server runtime
    isLocalFileRoot, // run within a page using a file: url
    variables
} from '@environment-safe/runtime-context';
import { localFile as lf, serverFile as sf, file as f, remote as r, setInputHandler, bindInput} from './filesystem.mjs';
import { Path } from './path.mjs';
export { Path, setInputHandler, bindInput };
const handleCanonicalPath = (dir, os, user)=>{
    
};

let localFile=null;
let serverFile=null;
let file=null;
let remote=null;

export const initialized = async (path, options={})=>{
    if(isServer){
        if(serverFile) return;
        serverFile = await sf.initialize();
    }else{
        if(isLocalFileRoot){
            if(file) return;
            file = await f.initialize();
        }else{
            if(path.indexOf('://') !== -1){
                if(path.indexOf('file://') === 0){
                    try{
                        Path.relative(path);
                    }catch(ex){
                        //if it's not
                        // 1) A file url root
                        // 2) within the web root
                        // we have no idea what to do
                        console.log(ex);
                        throw new Error(`Could not resolve path:${path}`);
                    }
                }
                if(remote) return;
                //remote url
                remote = await r.initialize();
            }else{
                if(options.filesystemAPI){
                    if(localFile) return;
                    //an absolute or relative file path
                    localFile = await lf.initialize();
                }else{
                    if(remote) return;
                    //remote url
                    remote = await r.initialize();
                }
            }
        }
    }
};

export const act = async (action, ...args)=>{
    const path = args[0];
    const options = args[1] || {};
    await initialized(path, options);
    if(isServer){
        return serverFile[action].apply(serverFile, args);
    }else{
        if(isLocalFileRoot){
            return file[action].apply(file, args);
        }else{
            if(path.indexOf('://') !== -1){
                if(path.indexOf('file://') === 0){
                    try{
                        const currentProtocol = variables.location?variables.location.protocol:'http:';
                        const relativePath = Path.from(path).toUrl(currentProtocol, true);
                        args[0] = '../'+relativePath;
                    }catch(ex){
                        //if it's not
                        // 1) A file url root
                        // 2) within the web root
                        // we have no idea what to do
                        throw new Error(`Could not resolve path:${path}`);
                    }
                }
                return remote[action].apply(remote, args);
                
            }else{
                if(options.filesystemAPI){
                    return localFile[action].apply(localFile, args);
                }else{
                    return remote[action].apply(remote, args);
                }
            }
        }
    }
};

//*
export const read = async (path, options)=>{
    return await act('read', path, options);
};

export const list = async (path, options)=>{
    return await act('list', path, options);
};

export const write = async (path, buffer, options)=>{
    return await act('write', path, buffer, options);
};

export const create = async (path)=>{
    return await act('create', path);
};

export const exists = async (path)=>{
    return await act('exists', path);
};

export const remove = async (path)=>{
    return await act('delete', path);
};

const internalCache = {};

export class File{
    constructor(path, options={}){
        //todo: clean this rats nest up
        const location = ( path ) || 
            ( (!path) && options.directory && handleCanonicalPath(options.directory, File.os, File.user) ) ||
            ('/tmp/' + Math.floor( Math.random() * 10000 ));
        if(options.cache === true) options.cache = internalCache;
        this.options = options;
        //one of: desktop, documents, downloads, music, pictures, videos
        this.directory = options.directory || '.';
        this.path = location;
        this.setBuffer(FileBuffer.from(''));
    }
    
    async save(){
        await write(this.path, this.buffer, this.options);
        return this;
    }
    
    setBuffer(buffer){
        this.buffer = buffer;
        if(!this.buffer) throw new Error(`Error: ${this.path} ${this.options}`);
        this.buffer.cast = (type)=>{
            return FileBuffer.to(type, this.buffer);
        };
    }
    
    async load(){
        this.setBuffer(await read(this.path, this.options));
        return this;
    }
    
    body(value){
        if(value === null || value === undefined) return this.buffer;
        this.setBuffer(FileBuffer.from(value));
        return this;
    }
    
    async info(){
        //return await info(this.path);
    }
    
    async 'delete'(){
        await remove(this.path, this.options);
        return this;
    }
    
    static async exists(path, directory){
        return await exists(path, directory);
    }
    
    static async list(path, options){
        return await list(path, options);
    }
}

let staticInstance = null;
export class Download{
    constructor(){
        if(staticInstance) return staticInstance;
        this.promise = null;
        staticInstance = this;
    }
    expect(){
        this.promise = new Promise((resolve)=>{
            this.resolve = resolve;
        });
        //if(isServer) this.flushPromise();
        return this.promise;
    }
    flushPromise(result){
        if(this.resolve){
            this.resolve(result);
            this.resolve = null;
        }
        this.promise = null;
    }
    async observe(download){
        const result = await download;
        this.flushPromise(result);
    }
}

(()=>{
    globalThis.handleDownload = async (download)=>{
        const root = Path.location('downloads');
        const file = download.suggestedFilename();
        const path = Path.join(root, file);
        await download.saveAs(path);
    };
    if(variables.moka && variables.moka.bind){
        //bind the input mechanics of File to moka
        variables.moka.bind(bindInput());
    }
})();