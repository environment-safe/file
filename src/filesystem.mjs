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

// INPUT HACK: most file ops need user input:

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

if(isClient){
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

// END INPUT HACK

export const localFile = {
    initialize : async ()=>{
        return {
            exists: async(path, options={})=>{
                
            },
            list: async(path, options={})=>{
                
            },
            create: async (path, options={})=>{
                const newHandle = await wantInput(location, (event, resolve, reject)=>{
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
                }, options.cache);
                const writableStream = await newHandle.createWritable();
                // write our file
                await writableStream.write(FileBuffer.from(''));
                // close the file and write the contents to disk.
                await writableStream.close();
            },
            read: async (path, options={})=>{
                /*const fileHandle = */await wantInput(location, (event, resolve, reject)=>{
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
                }, options.cache);
            },
            write: async (path, buffer, options={})=>{
                const newHandle = await wantInput(location, (event, resolve, reject)=>{
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
                }, options.cache);
                const writableStream = await newHandle.createWritable();
                // write our file
                await writableStream.write(FileBuffer.from(buffer));
                // close the file and write the contents to disk.
                await writableStream.close();
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
                        if(err) return reject(err);
                        resolve(buffer);
                    });
                });
            },
            write: async (path, buffer, options={})=>{
                const parsed = new Path(path);
                const url = parsed.toUrl('native');
                return await new Promise((resolve, reject)=>{
                    fs.writeFile(url, buffer, (err)=>{
                        if(err) return reject(err);
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
                const response = await fetch((new Path(path)).toUrl('file:'));
                return !!response;
            },
            list: async(path, options={})=>{
                // the only real option here is to scrape by browser
                await fetch((new Path(path)).toUrl('http:'));
            },
            create: async (path, options={})=>{
                throw new Error('Unsupported');
            },
            read: async (path, options={})=>{
                const response = await fetch((new Path(path)).toUrl('file:'));
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
        const protocol = 'https:';
        return {
            exists: async(path, options={})=>{
                const response = await fetch((new Path(path)).toUrl(protocol));
                return !!response;
            },
            list: async(path, options={})=>{
                // the only real option here is to scrape by browser
                await fetch((new Path(path)).toUrl(protocol));
            },
            create: async (path, options={})=>{
                throw new Error('Unsupported');
            },
            read: async (path, options={})=>{
                const response = await fetch((new Path(path)).toUrl(protocol));
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

