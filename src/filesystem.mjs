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
import { File } from './index.mjs';
import * as fs from 'fs';
import { 
    isClient // is running a client
} from '@environment-safe/runtime-context';
import { Path } from './path.mjs';
//TODO: Streaming
//TODO: browser filesystem contexts

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

const getFilePickerOptions = (path)=>{
    const isLocation = Path.isLocation(path);
    const parsedPath = new Path(path);
    let suffix = path.split('.').pop();
    if(suffix.length > 6) suffix = '';
    const options = {
        suggestedName: name
    };
    if(isLocation){
        options.suggestedName = isLocation.remainingPath;
        options.startIn = isLocation.location;
        //eat leading slash
        if(options.suggestedName[0] === '/') options.suggestedName = options.suggestedName.substring(1);
    }else{
        const posixPath = parsedPath.toUrl('posix', true);
        const parts = posixPath.split('/');
        options.suggestedName = parts.pop();
        options.startIn = parts.join('/');
    }
    if(suffix){
        const accept = {};
        
        accept[mimesBySuffix[suffix]] = '.'+suffix;
        options.types = [{
            description: suffix,
            accept,
        }];
        options.excludeAcceptAllOption = true;
    }
    //global hell 
    // here we need to push this into a global because there is no way to scope drill 
    globalThis._lastFilePickerOptions = options;
    return options;
};


/*
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
*/

// INPUT HACK: most file ops need to happen on a user input action and cannot be deferred:

const inputQueue = [];

let inputHandler = (event, inputQueue)=>{
    if(inputQueue.length){
        const input = inputQueue.shift();
        try{
            input.handler(event, input.resolve, input.reject);
        }catch(ex){
            inputQueue.unshift(input);
        }
    }
};

const attachInputGenerator = (eventType)=>{
    const handler = (event)=>{
        return inputHandler(event, inputQueue);
    };
    window.addEventListener('load', (event) => {
        document.body.addEventListener(eventType, handler, false);
    });
};

export const setInputHandler = (handler)=>{
    inputHandler = handler;
};

let wantInput = async (type, id, handler, cache)=>{
    const promise = new Promise((resolve, reject)=>{
        inputQueue.push({ resolve, reject, handler });
    });
    const input = await promise;
    return await input;
};

//this delivers a set of bindables to a bind target so they can respond to events
export const bindInput = ()=>{
    return (wants)=>{
        wantInput = wants;
        return {
            'mousedown':(e)=>{ 
                // event monitor (not currently used)
            },
            'click':(e)=>{ 
                // event monitor (not currently used)
            }
        };
    };
};

if(isClient){
    // this is only so things work out of the box by clicking on the page
    // anything other than a test/demo needs better behavior
    attachInputGenerator('mousedown');
    // mousemove is cleanest, but seems unreliable
    // attachInputGenerator('mousemove');
}

//const globalFileHandleCache = {read:{}, write:{}};

const fileHandle = async (path, options)=>{
    if(options.isDirectory){
        const dirHandle = await wantInput('click', location, (event, resolve, reject)=>{
            const options = getFilePickerOptions(path);
            try{
                let found = false;
                window.showDirectoryPicker(options).then(async (thisHandle)=>{
                    const values = (await thisHandle.values());
                    if(values){
                        for await (const entry of values){
                            found = found || entry.name === options.suggestedName;
                        }
                    }
                    resolve(found);
                }).catch((ex)=>{
                    reject(ex);
                });
            }catch(ex){
                reject(ex);
            }
        }, options.cache && options.cache.write);
        return dirHandle;
    }else{
        if(options.isWritable){
            const newHandle = await wantInput('click', location, (event, resolve, reject)=>{
                const options = getFilePickerOptions(path);
                try{
                    window.showSaveFilePicker(options).then((thisHandle)=>{
                        resolve(thisHandle);
                    }).catch((ex)=>{
                        reject(ex);
                    });
                }catch(ex){
                    reject(ex);
                }
            }, options.cache && options.cache.write);
            return newHandle;
        }else{
            return await wantInput('click', location, (event, resolve, reject)=>{
                const options = getFilePickerOptions(path);
                try{
                    window.showOpenFilePicker(options).then(([ handle ])=>{
                        resolve(handle);
                    }).catch((ex)=>{
                        reject(ex);
                    });
                }catch(ex){
                    reject(ex);
                }
            }, options.cache && options.cache.read);
        }
    }
};

// END INPUT HACK

export const localFile = {
    initialize : async ()=>{
        return {
            exists: async(path, options={})=>{
                options.isDirectory = true;
                try{
                    const handle = await fileHandle(path, options);
                    return !!handle;
                }catch(ex){
                    return false;
                }
            },
            list: async(path, options={})=>{
                //const dirHandle = await window.showDirectoryPicker();
            },
            create: async (path, options={})=>{
                try{
                    options.isWritable = true;
                    const handle = await fileHandle(path, options);
                    const writableStream = await handle.createWritable();
                    // write our file
                    await writableStream.write(FileBuffer.from(''));
                    // close the file and write the contents to disk.
                    await writableStream.close();
                }catch(ex){
                    console.log(ex);
                    return false;
                }
            },
            read: async (path, options={})=>{
                try{
                    const handle = await fileHandle(path, options);
                    const file = await handle.getFile();
                    const result = await file.arrayBuffer();
                    return result;
                }catch(ex){
                    console.log(ex);
                    return false;
                }
            },
            write: async (path, buffer, options={})=>{
                try{
                    options.isWritable = true;
                    const handle = await fileHandle(path, options);
                    const writableStream = await handle.createWritable();
                    // write our file
                    await writableStream.write(FileBuffer.from(buffer));
                    // close the file and write the contents to disk.
                    await writableStream.close();
                }catch(ex){
                    console.log(ex);
                    return false;
                }
            },
            delete: async (path, options={})=>{
                
            }
        };
    }
};
export const serverFile = {
    initialize : async ()=>{
        return {
            exists: async(filePath, options={})=>{
                const parsed = new Path(filePath);
                const url = parsed.toUrl('native');
                return await new Promise((resolve, reject)=>{
                    fs.stat(url, (err, res)=>{
                        if(err){
                            return resolve(false);
                        }
                        resolve(true);
                    });
                });
            },
            list: async(path, options={})=>{
                const parsed = new Path(path);
                const url = parsed.toUrl('native');
                return await new Promise((resolve, reject)=>{
                    fs.readdir(url, { withFileTypes: true }, (err, files)=>{
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
            },
            create: async (path, options={})=>{
                return await new Promise((resolve, reject)=>{
                    const parsed = new Path(path);
                    const url = parsed.toUrl('native');
                    fs.writeFile(url, '', (err)=>{
                        if(err) return reject(err);
                        resolve();
                    });
                });
            },
            read: async (path, options={})=>{
                const parsed = new Path(path);
                const url = parsed.toUrl('native');
                return await new Promise((resolve, reject)=>{
                    fs.readFile(url, (err, buffer)=>{
                        if(err){
                            reject(new Error(`File not found('${path}')`));
                        }
                        resolve(buffer);
                    });
                });
            },
            write: async (path, buffer, options={})=>{
                const parsed = new Path(path);
                const url = parsed.toUrl('native');
                return await new Promise((resolve, reject)=>{
                    const outBuffer = (buffer.constructor.name === 'ArrayBuffer')?FileBuffer.from(buffer):buffer;
                    fs.writeFile(url, outBuffer, (err)=>{
                        if(err) return reject(err);
                        if(globalThis.handleWrite){
                            globalThis.handleWrite({
                                path,
                                url,
                                buffer,
                                text: ()=>{
                                    return FileBuffer.toString('string', buffer);
                                },
                                arrayBuffer: ()=> buffer,
                            });
                        }
                        resolve();
                    });
                });
            },
            delete: async (path, options={})=>{
                return await new Promise((resolve, reject)=>{
                    const parsed = new Path(path);
                    const url = parsed.toUrl('native');
                    fs.unlink(url, (err)=>{
                        if(err) return reject(err);
                        resolve();
                    });
                });
            }
        };
    }
};


export const file = { //using a file url uses different rules
    initialize : async ()=>{
        return {
            exists: async(path, options={})=>{
                const url = (new Path(path)).toUrl(options.type);
                if(url.parsed){
                    if(Path.browserLocations.indexOf(url.parsed.location) !== -1 ){
                        return localFile.exists(url.parsed, {});
                    }
                }
                const response = await fetch(url);
                return response.status === 200;
            },
            list: async(path, options={})=>{
                //const dirHandle = await window.showDirectoryPicker();
                
            },
            create: async (path, options={})=>{
                throw new Error('Unsupported');
            },
            read: async (path, options={})=>{
                const url = (new Path(path)).toUrl(options.type);
                const response = await fetch(url);
                return await response.json();
            },
            write: async (path, buffer, options={})=>{
                throw new Error('Unsupported');
            },
            delete: async (path, options={})=>{
                throw new Error('Unsupported');
            }
        };
    }
};
export const remote = {
    initialize : async ()=>{
        //todo: support http
        //const protocol = 'https:';
        return {
            exists: async(path, options={})=>{
                try{
                    const response = await fetch(path);
                    return response.status === 200;
                }catch(ex){
                    return false;
                }
            },
            list: async(path, options={})=>{
                // the only real option here is to scrape by browser
                const response = await fetch('file://'+path);
                const text = await response.text();
                if(text.indexOf('Cannot GET '+path)===-1){
                    throw new Error(`Could not find directory: ${path}`);
                }
                return text;
            },
            create: async (path, options={})=>{
                throw new Error('Unsupported');
            },
            read: async (path, options={})=>{
                const response = await fetch(path);
                if(response.status === 404) throw new Error(`File not found('${path}')`);
                return await response.arrayBuffer();
            },
            write: async (path, buffer, options={})=>{
                return await new Promise((resolve, reject)=>{
                    try{
                        var element = document.createElement('a');
                        const type = options.mimeType || File.deriveMIMEType(buffer);
                        const format = options.format || File.deriveFormat(type);
                        const representation = (
                            type === 'text/plain'?
                                FileBuffer.toString('text', buffer):
                                FileBuffer.toString('base64', buffer)
                        );
                        const dataURI = `data:${type};${format},${representation}`;
                        element.setAttribute('href', dataURI);
                        const filename = path.split('/').pop();
                        element.setAttribute('download', filename);
                        element.style.display = 'none';
                        document.body.appendChild(element);
                        element.click();
                        document.body.removeChild(element);
                        resolve();
                    }catch(ex){
                        reject(ex);
                    }
                });
            },
            delete: async (path, options={})=>{
                throw new Error('Unsupported');
            }
        };
    }
};

