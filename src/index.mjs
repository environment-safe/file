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

const inputQueue = [];
const attachInputGenerator = (eventType)=>{
    const handler = (event)=>{
        if(inputQueue.length){
            const input = inputQueue.shift();
            try{
                input.handler(event, input.resolve, input.reject);
            }catch(ex){
                inputQueue.unshift(input);
            }
        }
    };
    document.body.addEventListener(eventType, handler);
};

if(isBrowser || isJsDom){
    attachInputGenerator('click');
    // mousemove is cleanest, but seems unreliable
    // attachInputGenerator('mousemove');
}

const wantInput = async (handler)=>{
    const promise = new Promise((resolve, reject)=>{
        inputQueue.push({ resolve, reject, handler });
    });
    const input = await promise;
    return await input;
};

const getFilePickerOptions = (name, path)=>{
    let suffix = name.split('.').pop();
    if(suffix.length > 6) suffix = '';
    const options = {
        suggestedName: name
    };
    if(path) options.startIn = path;
    if(suffix){
        const accept = {};
        accept[mimesBySuffix[suffix]] = '.'+suffix;
        options.types = [{
            description: suffix,
            accept,
        }];
        options.excludeAcceptAllOption = true;
    }
    return options;
};


export const save = async (name, dir, buffer, meta={})=>{
    if(isBrowser || isJsDom){
        const options = getFilePickerOptions(name, dir);
        const newHandle = await wantInput((event, resolve, reject)=>{
            try{
                window.showSaveFilePicker(options).then((thisHandle)=>{
                    resolve(thisHandle);
                }).catch((ex)=>{
                    reject(ex);
                });
            }catch(ex){
                reject(ex);
            }
        });
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

export const pathJoin = (...parts)=>{ //returns buffer, eventually stream
    if(isBrowser || isJsDom){
        return parts.join('/');
    }else{
        // todo: impl
    }
};


export const fileBody = async (path, dir, baseDir)=>{
    try{
        let location = dir?dir + path:path;
        if(canonicalLocationToPath['darwin'][dir]){
            if(baseDir){
                throw new Error('custom directories unsupported');
            }else{
                location = 'file://'+handleCanonicalPath(dir, File.os, File.user);
            }
        }
        console.log('L', location, (new Error()).stack);
        const response = await fetch(location);
        if(!response.ok){
            return null;
        }
        return response.body;
    }catch(ex){
        return null;
    }
};

export const handle = async (path, dir, writable, cache={})=>{ //returns buffer, eventually stream
    let suffix = path.split('.').pop();
    if(suffix.length > 6) suffix = '';
    if(isBrowser || isJsDom){
        if(cache && cache[path]) return cache[path];
        const options = getFilePickerOptions(path);
        try{
            const response = await fileBody(path, dir);
            if(response === null) throw new Error('File not found');
        }catch(ex){
            const newHandle = await wantInput((event, resolve, reject)=>{
                try{
                    window.showSaveFilePicker(options).then((thisHandle)=>{
                        resolve(thisHandle);
                    }).catch((ex)=>{
                        reject(ex);
                    });
                }catch(ex){
                    reject(ex);
                }
            });
            return newHandle;
        }
        const fileHandle = await wantInput((event, resolve, reject)=>{
            try{
                window.showOpenFilePicker(options).then(([ handle ])=>{
                    resolve(handle);
                }).catch((ex)=>{
                    reject(ex);
                });
            }catch(ex){
                reject(ex);
            }
        });
        // eslint-disable-next-line no-undef
        if(cache) cache[path] = fileHandle;
        // eslint-disable-next-line no-undef
        return fileHandle;
    }else{
        // todo: impl
    }
};

export const load = async (path, dir, cache)=>{ //returns buffer, eventually stream
    if(isBrowser || isJsDom){
        const fileHandle = await handle(path, dir, false, cache);
        const file = await fileHandle.getFile();
        const buffer = await file.buffer();
        return buffer;
    }else{
        // todo: impl
    }
};

export const exists = async (path, dir, cache, incomingHandle)=>{ //returns buffer, eventually stream
    if(isBrowser || isJsDom){
        if(incomingHandle){
            const fileHandle = incomingHandle;
            const file = await fileHandle.getFile();
            const buffer = await file.arrayBuffer();
            return !!buffer;
        }else{
            console.log('fetch', path, dir);
            const body = await fileBody(path, dir);
            return body !== null;
        }
    }else{
        // todo: impl
    }
};

export const remove = async (path, dir, cache)=>{
    if(isBrowser || isJsDom){
        const fileHandle = await handle(path, dir, true, cache);
        if(fileHandle.remove) fileHandle.remove(); //non-standard, but supported
    }else{
        // todo: impl
    }
};

export const info = async (path, dir, cache)=>{
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
        //one of: desktop, documents, downloads, music, pictures, videos
        this.directory = options.directory || 'documents';
        this.path = location;
        this.buffer = new Buffer();
    }
    
    async save(){
        await save(this.path, this.directory, this.buffer, {});
        return this;
    }
    
    async load(){
        this.buffer = await load(this.path, this.directory, this.options);
        return this;
    }
    
    body(str){
        if(str === null) return this.buffer; 
        var enc = new TextEncoder(); // utf8
        const array = enc.encode(str);
        this.buffer = array.buffer;
        return this;
    }
    
    async info(){
        return await info(this.path, this.directory);
    }
    
    async 'delete'(){
        await remove(this.path, this.directory);
        return this;
    }
    
    static exists(path, directory){
        return exists(path, directory);
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
let user = '';
Object.defineProperty(File, 'user', {
    get() {
        if(isBrowser || isJsDom){
            return user || 'khrome'; //todo: something real;
        }else{
            return null;
        }
    },
    set(newValue) {
        user = newValue;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(File, 'os', {
    get() {
        if(isBrowser || isJsDom){
            return 'darwin'; //todo: something real;
        }else{
            return null;
        }
    },
    set(newValue) {
        //do nothing
    },
    enumerable: true,
    configurable: true,
});

const canonicalLocationToPath = {
    darwin : {
        'desktop': '~/Desktop', 
        'documents': '~/Documents', 
        'downloads': '~/Downloads', 
        'music': '~/Music', 
        'pictures': '~/Pictures', 
        'home': '~/Pictures',
        'videos': '~/Movies'
    },
    win : {},
    linux : {},
};

const osToHome = {
    darwin : '/home/${user}',
    win : 'C:/',
    linux : '/home/${user}',
};

/*const handlePath = (path, os, username)=>{
    return path.replace('~', osToHome[os].replace('${user}', username));
};*/

const handleCanonicalPath = (name, os, username)=>{
    const path = canonicalLocationToPath[os][name];
    return path.replace('~', osToHome[os].replace('${user}', username));
};

File.directory = {};
Object.defineProperty(File.directory, 'current', {
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

const directoryGet = (type)=>{
    if(isBrowser || isJsDom){
        return handleCanonicalPath('home', File.os, File.user);
    }else{
        return process.cwd();
    }
};

Object.keys(canonicalLocationToPath['darwin']).forEach((key)=>{
    // register all available keys
    Object.defineProperty(File.directory, key, {
        enumerable: true, configurable: true,
        get() {
            return directoryGet(key);
        },
        set(newValue){ }
    });
});