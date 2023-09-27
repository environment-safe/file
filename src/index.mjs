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
import * as fs from 'fs';
import * as path from 'path';
import { 
    isBrowser, 
    isNode, 
    isWebWorker, 
    isJsDom, 
    isDeno,
    isBun,
    isClient, // is running a client
    isServer, // is running on a server runtime
    variables, // global variables
    isLocalFileRoot, // run within a page using a file: url
    isUrlRoot, //run within a page with a served url
    isServerRoot, //run within a 
    os, // Operating system, machine friendly
    operatingSystem, // Operating System, label
    runtime // server runtime name or browser name
} from '@environment-safe/runtime-context';
import { localFile as lf, serverFile as sf, file as f, remote as r} from './filesystem.mjs';

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
export const initialized = async (path, options)=>{
    if(isServer){
        serverFile = await sf.initialize();
    }else{
        if(isLocalFileRoot){
            localFile = await lf.initialize();
        }else{
            if(path.indexOf('file://') !== -1){
                //file: url
                localFile = await lf.initialize();
            }else{
                if(path.indexOf('://') !== -1){
                    //remote url
                    remote = await r.initialize();
                }else{
                    //an absolute or relative file path
                    file = await f.initialize();
                }
            }
        }
    }
};

export const read = async (path, options)=>{
    await initialized();
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
export const write = async (path, buffer, options)=>{
    await initialized();
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
    await initialized();
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
    await initialized();
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
    await initialized();
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
        const location = ( (path && path[0] === '/')?`file:${path}`:path ) || 
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
        const dir = this.path.indexOf('/') === -1?this.directory:'';
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
        return await info(this.path);
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

/*
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
    window.addEventListener('load', (event) => {
        document.body.addEventListener(eventType, handler, false);
    });
    //document.body.addEventListener(eventType, handler, false);
};

if(isBrowser || isJsDom){
    attachInputGenerator('mousedown');
    // mousemove is cleanest, but seems unreliable
    // attachInputGenerator('mousemove');
}

const wantInput = async (id, handler, cache)=>{
    const promise = new Promise((resolve, reject)=>{
        inputQueue.push({ resolve, reject, handler });
    });
    const input = await promise;
    return await input;
};

const filesystem = ()=>{ //get a browser filesystem context
    return new Promise((resolve, reject)=>{
        variables.requestFileSystem(
            TEMPORARY,
            1024 * 1024 //1MB,
            (fs) => {
                resolve(fs);
            },
            (err)=>{
                reject(fs);
            },
        );
    });
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
const fileSeparator = os.indexOf('windows') === -1?'/':'\\';
export const nativePathJoin = (...parts)=>{ //returns buffer, eventually stream
    if(isBrowser || isJsDom){
        return parts.join(fileSeparator);
    }else{
        return path.join.apply(path, parts);
    }
};

export const webPathJoin = (...parts)=>{ //returns buffer, eventually stream
    return parts.join('/');
};
// paths are stupid because browsers chose a separator, but node + file urls decided to provide native paths like jerks
const pathRelativeTo = (target, relativeToPath, separator='/')=>{
    let len = 0;
    while(target.substring(0, len+1) === relativeToPath.substring(0, len+1)) len++;
    let result = target.substring(len-1);
    let parts = relativeToPath.substring(len).split(separator);
    for (let lcv=0; lcv < parts.length; lcv++){
        result = '..'+separator+result;
    }
    console.log('PRT', result, target, relativeToPath);
    return result;
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
};

export const save = async (name, dir, buffer, meta={})=>{
    const location = makeLocation(name, dir);
    if(isBrowser || isJsDom){
        const options = getFilePickerOptions(name, dir);
        const newHandle = await wantInput(location, (event, resolve, reject)=>{
            try{
                window.showSaveFilePicker(options).then((thisHandle)=>{
                    resolve(thisHandle);
                }).catch((ex)=>{
                    reject(ex);
                });
            }catch(ex){
                reject(ex);
            }
        }, meta.cache);
        const writableStream = await newHandle.createWritable();
        // write our file
        await writableStream.write(buffer);
        // close the file and write the contents to disk.
        await writableStream.close();
    }else{
        return await new Promise((resolve, reject)=>{
            fs.writeFile(location, buffer, (err)=>{
                if(err) return reject(err);
                resolve();
            });
        });
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


//todo: should I remove export (no one should use this)?
export const fileBody = async (path, dir, baseDir, cache={})=>{
    try{
        //let location = dir?dir+ '/' + path:path; //todo: looser handling
        let location = makeLocation(path, dir, baseDir);
        
        console.log('FB', location)
        const fileHandle = await wantInput(location, (event, resolve, reject)=>{
            try{
                window.showOpenFilePicker(options).then(([ handle ])=>{
                    resolve(handle);
                }).catch((ex)=>{
                    reject(ex);
                });
            }catch(ex){
                reject(ex);
            }
        }, cache);
        //const response = await fetch(location);
        const text = await response.text();
        if(!(response.ok || (allowRedirect && response.redirected) || forceReturn)){
            return null;
        }
        return text;
    }catch(ex){
        console.log(location, ex);
        return null;
    }
};

export const handle = async (path, dir, writable, cache={})=>{ //returns buffer, eventually stream
    let suffix = path.split('.').pop();
    if(suffix.length > 6) suffix = '';
    const location = makeLocation(path, dir);
    if(isBrowser || isJsDom){
        if(cache && cache[path]) return cache[path];
        const options = getFilePickerOptions(path);
        try{
            const response = await fileBody(path, dir);
            if(response === null) throw new Error('File not found');
        }catch(ex){
            const newHandle = await wantInput(location, (event, resolve, reject)=>{
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
        const fileHandle = await wantInput(location, (event, resolve, reject)=>{
            try{
                window.showOpenFilePicker(options).then(([ handle ])=>{
                    resolve(handle);
                }).catch((ex)=>{
                    reject(ex);
                });
            }catch(ex){
                reject(ex);
            }
        }, cache);
        // eslint-disable-next-line no-undef
        if(cache) cache[location] = fileHandle;
        // eslint-disable-next-line no-undef
        return fileHandle;
    }else{
        // todo: impl
    }
};

export const load = async (path, dir, cache)=>{ //returns buffer, eventually stream
    const location = makeLocation(path, dir);
    if(isBrowser || isJsDom){
        try{
            const response = await fetch(location);
            if(!response){
                return new ArrayBuffer();
            }
            const buffer = await response.arrayBuffer();
            buffer;
            return buffer;
        }catch(ex){
            return new ArrayBuffer();
        }
    }else{
        return await new Promise((resolve, reject)=>{
            fs.readFile(location, (err, body)=>{
                if(err) return reject(err);
                resolve(body);
            });
        });
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
            //const body = await fileBody(path, dir , File.directory.current);
            const body = await fileBody(path, dir);
            return body !== null;
        }
    }else{
        return await new Promise((resolve, reject)=>{
            const location = makeLocation(path, dir);
            fs.stat(location, (err, res)=>{
                if(err) resolve(false);
                resolve(true);
            });
        });
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

export const list = async (path, options={})=>{
    if(isBrowser || isJsDom){
        // todo: impl
        switch(File.agent.name){
            case 'chrome': {
                console.log(path, (new Error()).stack);
                //const page = await fileBody('', path, null, null, true);
                const page = await fileBody('', path, File.directory.current, options.cache);
                let rows = (page && page.match( /<script>addRow\((.*)\);<\/script>/g ) ) || [];
                rows = rows.map((row)=>{
                    return row.match( /<script>addRow\((.*)\);<\/script>/ )[1];
                });
                const jsonData = `[[${rows.join('], [')}]]`;
                const data = JSON.parse(jsonData);
                let results = data.map((meta)=>{
                    return {
                        name: meta[0],
                        isFile: ()=>{
                            return !!meta[2];
                        }
                    };
                });
                if(Object.keys(options).length){
                    if(options.files === false){
                        results = results.filter((file)=>{
                            return !file.isFile();
                        });
                    }
                    if(options.directories === false){
                        results = results.filter((file)=>{
                            return file.isFile();
                        });
                    }
                    if(!options.hidden){
                        results = results.filter((file)=>{
                            return file !== '.' && file !== '..';
                        });
                    }
                }
                return results.map((file)=>{
                    return file.name;
                });
                //TODO: apache fallback
                //break;
            }
            default: throw new Error(`Usupported Browser: ${File.os}`);
        }
    }else{
        //todo: platform safe separator
        const target = path.indexOf('/') === -1?makeLocation('', path):path;
        return await new Promise((resolve, reject)=>{
            fs.readdir(target, { withFileTypes: true }, (err, files)=>{
                if(err) return reject(err);
                let results = files;
                if(Object.keys(options).length){
                    if(options.files === false){
                        results = results.filter((file)=>{
                            return !file.isFile();
                        });
                    }
                    if(options.directories === false){
                        results = results.filter((file)=>{
                            return file.isFile();
                        });
                    }
                    if(!options.hidden){
                        results = results.filter((file)=>{
                            return file !== '.' && file !== '..';
                        });
                    }
                }
                resolve(results.map((file)=>{
                    return file.name;
                }));
            });
        });
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
        //todo: clean this rats nest up
        const location = ( (path && path[0] === '/')?`file:${path}`:path ) || 
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
        await save(this.path, this.directory, this.buffer, this.options);
        return this;
    }
    
    async load(){
        const dir = this.path.indexOf('/') === -1?this.directory:'';
        this.buffer = await load(this.path, dir, this.options);
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
        return await info(this.path, this.directory);
    }
    
    async 'delete'(){
        await remove(this.path, this.directory, this.options);
        return this;
    }
    
    static exists(path, directory){
        return exists(path, directory);
    }
    
    static list(path, options){
        return list(path, options);
    }
}
let user = '';
Object.defineProperty(File, 'user', {
    get() {
        if(isBrowser || isJsDom){
            return user || 'khrome'; //todo: something real;
        }else{
            return user || 'khrome'; //todo: something real;
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
            return 'darwin';
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
    darwin : '/Users/${user}',
    win : 'C:/',
    linux : '/Users/${user}',
};

const handleCanonicalPath = (name, os, username)=>{
    const path = canonicalLocationToPath[os][name];
    if(!path) return name;
    return path.replace('~', osToHome[os].replace('${user}', username));
};

File.directory = {};
Object.defineProperty(File.directory, 'current', {
    get() {
        if(isBrowser || isJsDom){
            const base = document.getElementsByTagName('base')[0];
            let basedir = null;
            if(base && (basedir = base.getAttribute('href') && basedir.indexof('file://') !== -1)){
                return basedir;
            }else{
                if(base && (basedir = base.getAttribute('filesystem'))){
                    return basedir;
                }else{
                    let path = window.location.pathname;
                    path = path.split('/');
                    path.pop(); // drop the top one
                    return path .join('/');
                }
            }
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

Object.defineProperty(File, 'agent', {
    get() {
        if(isBrowser || isJsDom){
            //var nVer = navigator.appVersion;
            var nAgt = navigator.userAgent;
            var browserName  = navigator.appName;
            var fullVersion  = ''+parseFloat(navigator.appVersion); 
            var majorVersion = parseInt(navigator.appVersion,10);
            var nameOffset,verOffset,ix;
            
            // In Opera, the true version is after "Opera" or after "Version"
            if ((verOffset=nAgt.indexOf('Opera'))!=-1) {
                browserName = 'Opera';
                fullVersion = nAgt.substring(verOffset+6);
                if ((verOffset=nAgt.indexOf('Version'))!=-1) 
                    fullVersion = nAgt.substring(verOffset+8);
            }
            // In MSIE, the true version is after 'MSIE' in userAgent
            else if ((verOffset=nAgt.indexOf('MSIE'))!=-1) {
                browserName = 'Microsoft Internet Explorer';
                fullVersion = nAgt.substring(verOffset+5);
            }
            // In Chrome, the true version is after 'Chrome' 
            else if ((verOffset=nAgt.indexOf('Chrome'))!=-1) {
                browserName = 'Chrome';
                fullVersion = nAgt.substring(verOffset+7);
            }
            // In Safari, the true version is after 'Safari' or after 'Version' 
            else if ((verOffset=nAgt.indexOf('Safari'))!=-1) {
                browserName = 'Safari';
                fullVersion = nAgt.substring(verOffset+7);
                if ((verOffset=nAgt.indexOf('Version'))!=-1) 
                    fullVersion = nAgt.substring(verOffset+8);
            }
            // In Firefox, the true version is after 'Firefox' 
            else if ((verOffset=nAgt.indexOf('Firefox'))!=-1) {
                browserName = 'Firefox';
                fullVersion = nAgt.substring(verOffset+8);
            }
            // In most other browsers, 'name/version' is at the end of userAgent 
            else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) < (verOffset=nAgt.lastIndexOf('/')) ) {
                browserName = nAgt.substring(nameOffset,verOffset);
                fullVersion = nAgt.substring(verOffset+1);
                if (browserName.toLowerCase()==browserName.toUpperCase()) {
                    browserName = navigator.appName;
                }
            }
            // trim the fullVersion string at semicolon/space if present
            if ((ix=fullVersion.indexOf(';'))!=-1)
                fullVersion=fullVersion.substring(0,ix);
            if ((ix=fullVersion.indexOf(' '))!=-1)
                fullVersion=fullVersion.substring(0,ix);
            
            majorVersion = parseInt(''+fullVersion,10);
            if (isNaN(majorVersion)) {
                fullVersion  = ''+parseFloat(navigator.appVersion); 
                majorVersion = parseInt(navigator.appVersion,10);
            }
            return { name: browserName.toLowerCase(), version: fullVersion, major: majorVersion };
        }else{
            return {};
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
*/