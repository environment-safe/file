/*
import { isBrowser, isJsDom } from 'browser-or-node';
import * as mod from 'module';
import * as path from 'path';
let internalRequire = null;
if(typeof require !== 'undefined') internalRequire = require;
const ensureRequire = ()=> (!internalRequire) && (internalRequire = mod.createRequire(import.meta.url));
//*/

/**
 * A JSON object
 * @typedef { object } JSON
 */
 
// Isn't the fact that we had 2 path scenarios driven by OS, fixed it, (win, unix)
// and we now have 4 an obvious indicator that we went wrong? (win, unix, file, known dirs)
 
import { FileBuffer } from './buffer.mjs';
import {
    isServer, // is running on a server runtime
    isLocalFileRoot, // run within a page using a file: url
} from '@environment-safe/runtime-context';
import { localFile as lf, serverFile as sf, file as f, remote as r} from './filesystem.mjs';
import { Path } from './path.mjs';
export { Path };
const handleCanonicalPath = (dir, os, user)=>{
    
};
/*export const nativePathJoin = (...parts)=>{ //returns buffer, eventually stream
    if(isBrowser || isJsDom){
        return parts.join(fileSeparator);
    }else{
        return path.join.apply(path, parts);
    }
};

export const webPathJoin = (...parts)=>{ //returns buffer, eventually stream
    return parts.join('/');
};

const makeLocation = (path, dir, baseDir=File.directory.current)=>{
    const transformedDir = dir?handleCanonicalPath(dir, File.os, File.user):null;
    const isRelative = (transformedDir || path)[0] === '.' || (
        (transformedDir || path)[1] !== ':' && // windows drive root
        (transformedDir || path)[0] !== '/' // *nix filesystem root
    );
    const isFileUrl = (dir && dir.startsWith('file:')) || path.startsWith('file:');
    const isFileLocation = isFileUrl || transformedDir !== dir;
    if(isLocalFileRoot){
        //glue together an absolute path with a file protocol, no matter what we get
        //if a web url, rebuild 
        if(isRelative){
            const absolutePath = transformedDir?
                nativePathJoin(baseDir, transformedDir, path):
                nativePathJoin(baseDir, path);
            return `file://${absolutePath}`;
        }
    }
    if(isUrlRoot){
        //match the incoming format and output the correct location
        if(isRelative){
            let absolutePath = null;
            if(isFileLocation){ //only if it was a known dir
                absolutePath = transformedDir?
                nativePathJoin(baseDir, transformedDir, path):
                nativePathJoin(baseDir, path);
            }else{
                absolutePath = transformedDir?
                webPathJoin(baseDir, transformedDir, path):
                webPathJoin(baseDir, path);
            }
            return pathRelativeTo(absolutePath, File.directory.current);
        }else{
            let absolutePath = null;
            if(isFileLocation){
                absolutePath = transformedDir?
                nativePathJoin(transformedDir, path):
                nativePathJoin(File.directory.current, path);
            }else{
                absolutePath = transformedDir?
                webPathJoin(transformedDir, path):
                webPathJoin(File.directory.current, path);
            }
            return `file://${absolutePath}`;
        }
    }
    if(isServerRoot){
        return transformedDir?
        nativePathJoin(transformedDir, path):
        nativePathJoin(baseDir, path);
    }
};*/

let localFile=null;
let serverFile=null;
let file=null;
let remote=null;
let inited=false;

export const initialized = async (path, options)=>{
    if(inited) return;
    if(isServer){
        serverFile = await sf.initialize();
        inited = true;
    }else{
        if(isLocalFileRoot){
            localFile = await lf.initialize();
            inited = true;
        }else{
            if(path.indexOf('file://') !== -1){
                //file: url
                localFile = await lf.initialize();
                inited = true;
            }else{
                if(path.indexOf('://') !== -1){
                    //remote url
                    remote = await r.initialize();
                    inited = true;
                }else{
                    //an absolute or relative file path
                    file = await f.initialize();
                    inited = true;
                }
            }
        }
    }
};

export const read = async (path, options)=>{
    await initialized(path);
    if(isServer){
        return serverFile.read(path, options);
    }else{
        if(isLocalFileRoot){
            return localFile.read(path, options);
        }else{
            if(path.indexOf('file://') !== -1){
                //file: url
                return localFile.read(path, options);
            }else{
                if(path.indexOf('://') !== -1){
                    //remote url
                    return remote.read(path, options);
                }else{
                    //an absolute or relative file path
                    return file.read(path, options);
                }
            }
        }
    }
};

export const list = async (path, options)=>{
    await initialized(path);
    if(isServer){
        return serverFile.list(path, options);
    }else{
        if(isLocalFileRoot){
            return localFile.list(path, options);
        }else{
            if(path.indexOf('file://') !== -1){
                //file: url
                return localFile.list(path, options);
            }else{
                if(path.indexOf('://') !== -1){
                    //remote url
                    return remote.list(path, options);
                }else{
                    //an absolute or relative file path
                    return file.list(path, options);
                }
            }
        }
    }
};

export const write = async (path, buffer, options)=>{
    await initialized(path);
    if(isServer){
        return serverFile.write(path, buffer, options);
    }else{
        if(isLocalFileRoot){
            return localFile.write(path, buffer, options);
        }else{
            if(path.indexOf('file://') !== -1){
                //file: url
                return localFile.write(path, buffer, options);
            }else{
                if(path.indexOf('://') !== -1){
                    //remote url
                    return remote.write(path, buffer, options);
                }else{
                    //an absolute or relative file path
                    return file.write(path, buffer, options);
                }
            }
        }
    }
};
export const create = async (path)=>{
    await initialized(path);
    if(isServer){
        return serverFile.create(path);
    }else{
        if(isLocalFileRoot){
            return localFile.create(path);
        }else{
            if(path.indexOf('file://') !== -1){
                //file: url
                return localFile.create(path);
            }else{
                if(path.indexOf('://') !== -1){
                    //remote url
                    return remote.create(path);
                }else{
                    //an absolute or relative file path
                    return file.create(path);
                }
            }
        }
    }
};
export const exists = async (path)=>{
    await initialized(path);
    if(isServer){
        return serverFile.exists(path);
    }else{
        if(isLocalFileRoot){
            return localFile.exists(path);
        }else{
            if(path.indexOf('file://') !== -1){
                //file: url
                return localFile.exists(path);
            }else{
                if(path.indexOf('://') !== -1){
                    //remote url
                    return remote.exists(path);
                }else{
                    //an absolute or relative file path
                    return file.exists(path);
                }
            }
        }
    }
};
export const remove = async (path)=>{
    await initialized(path);
    if(isServer){
        return serverFile.delete(path);
    }else{
        if(isLocalFileRoot){
            return localFile.delete(path);
        }else{
            if(path.indexOf('file://') !== -1){
                //file: url
                return localFile.delete(path);
            }else{
                if(path.indexOf('://') !== -1){
                    //remote url
                    return remote.delete(path);
                }else{
                    //an absolute or relative file path
                    return file.delete(path);
                }
            }
        }
    }
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
        this.buffer = new FileBuffer();
    }
    
    async save(){
        await write(this.path, this.buffer, this.options);
        return this;
    }
    
    async load(){
        this.buffer = await read(this.path, this.options);
        this.buffer.cast = (type)=>{
            return FileBuffer.to(type, this.buffer);
        };
        return this;
    }
    
    body(value){
        if(value === null || value === undefined) return this.buffer;
        this.buffer = FileBuffer.from(value);
        this.buffer.cast = (type)=>{
            return FileBuffer.to(type, this.buffer);
        };
        if(value) return this;
        return this.buffer;
    }
    
    async info(){
        //return await info(this.path);
    }
    
    async 'delete'(){
        await remove(this.path, this.options);
        return this;
    }
    
    static exists(path, directory){
        return exists(path, directory);
    }
    
    static list(path, options){
        return list(path, options);
    }
}