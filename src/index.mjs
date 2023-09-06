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
 
import { isBrowser, isJsDom } from 'browser-or-node';
import { FileBuffer as Buffer } from './buffer.mjs';


export const save = async (path, buffer, meta={})=>{
    if(isBrowser || isJsDom){
        // create a new handle
        const newHandle = await window.showSaveFilePicker();
        // create a FileSystemWritableFileStream to write to
        const writableStream = await newHandle.createWritable();
        // write our file
        await writableStream.write(buffer);
        // close the file and write the contents to disk.
        await writableStream.close();
    }else{
        //todo: implement
    }
};

const mimesBySuffix = {
    json : 'application/json',
    jpg : 'image/jpeg',
    jpeg : 'image/jpeg',
    gif : 'image/gif',
    png : 'image/png',
    svg : 'image/sxg+xml',
    webp : 'image/webp',
    csv : 'text/csv',
    tsv : 'text/tsv',
    ssv : 'text/ssv',
    js : 'text/javascript',
    mjs : 'text/javascript',
    cjs : 'text/javascript',
    css : 'text/css',
};

export const handle = async (path, writable, cache={})=>{ //returns buffer, eventually stream
    let suffix = path.split('.').pop();
    if(suffix.length > 6) suffix = '';
    if(isBrowser || isJsDom){
        if(cache && cache[path]) return cache[path];
        const options = {};
        if(suffix){
            const accept = {};
            accept[mimesBySuffix[suffix]] = '.'+suffix;
            options.types = [{
                description: suffix,
                accept,
            }];
            options.excludeAcceptAllOption = true;
        }
        try{
            await fetch(path);
        }catch(ex){
            const newHandle = await window.showSaveFilePicker();
            return newHandle;
        }
        // eslint-disable-next-line no-undef
        [ fileHandle ] = await window.showOpenFilePicker(options);
        // eslint-disable-next-line no-undef
        if(cache) cache[path] = fileHandle;
        // eslint-disable-next-line no-undef
        return fileHandle;
    }else{
        // todo: impl
    }
};

export const load = async (path, cache)=>{ //returns buffer, eventually stream
    if(isBrowser || isJsDom){
        const fileHandle = handle(path, false, cache);
        const file = await fileHandle.getFile();
        const buffer = await file.buffer();
        return buffer;
    }else{
        // todo: impl
    }
};

export const exists = async (path, cache, incomingHandle)=>{ //returns buffer, eventually stream
    if(isBrowser || isJsDom){
        const fileHandle = incomingHandle || handle(path, true, cache);
        const file = await fileHandle.getFile();
        const buffer = await file.buffer();
        return buffer;
    }else{
        // todo: impl
    }
};

export const remove = async (path, cache)=>{
    if(isBrowser || isJsDom){
        const fileHandle = handle(path, true, cache);
        if(fileHandle.remove) fileHandle.remove(); //non-standard, but supported
    }else{
        // todo: impl
    }
};

export const info = async (path, cache)=>{
    if(isBrowser || isJsDom){
        // todo: impl
    }else{
        // todo: impl
    }
};

export const list = async (path, cache)=>{
    if(isBrowser || isJsDom){
        // todo: impl
    }else{
        // todo: impl
    }
};

const internalCache = {};

export const listFiles = (path)=>{
    return list(path).map((src)=>{
        const url = src.indexOf('://') !== -1?src:`file://${src}`;
        return new File(url);
    });
};



export class File{
    constructor(path, options={}){
        const location = ( (path && path[0] === '/')?`file:${path}`:path ) || 
            ('/tmp/' + Math.floor( Math.random() * 10000 ));
        if(options.cache === true) options.cache = internalCache;
        this.options = options;
        this.path = location;
        this.buffer = new Buffer();
    }
    
    save(){
        save(this.path, this.buffer, this.options);
        return this;
    }
    
    load(){
        this.buffer = load(this.path, this.options);
        return this;
    }
    
    body(str){
        if(str === null) return this.buffer; 
        var enc = new TextEncoder(); // utf8
        const array = enc.encode(str);
        this.buffer = array.buffer;
    }
    
    info(){
        return info(this.path);
    }
    
    'delete'(){
        remove(this.path);
        return this;
    }
    
    static exists(path){
        return exists(path);
    }
}

Object.defineProperty(File, 'currentDirectory', {
    get() {
        if(isBrowser || isJsDom){
            let path = window.location.pathname;
            path = path.split('/');
            path.pop(); // drop the top one
            return path .join('/');
        }else{
            return process.cwd();
        }
    },
    set(newValue) {
        //do nothing
    },
    enumerable: true,
    configurable: true,
});