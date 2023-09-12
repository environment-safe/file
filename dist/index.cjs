"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.save = exports.remove = exports.pathJoin = exports.load = exports.listFiles = exports.list = exports.info = exports.handle = exports.fileBody = exports.exists = exports.File = void 0;
var _browserOrNode = require("browser-or-node");
var _buffer = require("./buffer.cjs");
var fs = _interopRequireWildcard(require("fs"));
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
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

const inputQueue = [];
const attachInputGenerator = eventType => {
  const handler = event => {
    if (inputQueue.length) {
      const input = inputQueue.shift();
      try {
        input.handler(event, input.resolve, input.reject);
      } catch (ex) {
        inputQueue.unshift(input);
      }
    }
  };
  document.body.addEventListener(eventType, handler);
};
if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
  attachInputGenerator('click');
  // mousemove is cleanest, but seems unreliable
  // attachInputGenerator('mousemove');
}

const wantInput = async (id, handler, cache) => {
  const promise = new Promise((resolve, reject) => {
    inputQueue.push({
      resolve,
      reject,
      handler
    });
  });
  const input = await promise;
  return await input;
};
const getFilePickerOptions = (name, path) => {
  let suffix = name.split('.').pop();
  if (suffix.length > 6) suffix = '';
  const options = {
    suggestedName: name
  };
  if (path) options.startIn = path;
  if (suffix) {
    const accept = {};
    accept[mimesBySuffix[suffix]] = '.' + suffix;
    options.types = [{
      description: suffix,
      accept
    }];
    options.excludeAcceptAllOption = true;
  }
  return options;
};
const makeLocation = (path, dir) => {
  return dir ? handleCanonicalPath(dir, File.os, File.user) + '/' + path : path;
};
const save = async (name, dir, buffer, meta = {}) => {
  const location = makeLocation(name, dir);
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    const options = getFilePickerOptions(name, dir);
    const newHandle = await wantInput(location, (event, resolve, reject) => {
      try {
        window.showSaveFilePicker(options).then(thisHandle => {
          resolve(thisHandle);
        }).catch(ex => {
          reject(ex);
        });
      } catch (ex) {
        reject(ex);
      }
    }, meta.cache);
    const writableStream = await newHandle.createWritable();
    // write our file
    await writableStream.write(buffer);
    // close the file and write the contents to disk.
    await writableStream.close();
  } else {
    return await new Promise((resolve, reject) => {
      fs.writeFile(location, buffer, err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }
};
exports.save = save;
const mimesBySuffix = {
  json: 'application/json',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  png: 'image/png',
  svg: 'image/sxg+xml',
  webp: 'image/webp',
  csv: 'text/csv',
  tsv: 'text/tsv',
  ssv: 'text/ssv',
  js: 'text/javascript',
  mjs: 'text/javascript',
  cjs: 'text/javascript',
  css: 'text/css'
};
const pathJoin = (...parts) => {
  //returns buffer, eventually stream
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    return parts.join('/');
  } else {
    // todo: impl
  }
};
exports.pathJoin = pathJoin;
const fileBody = async (path, dir, baseDir, allowRedirect) => {
  try {
    //let location = dir?dir+ '/' + path:path; //todo: looser handling
    let location = makeLocation(path, dir);
    if (canonicalLocationToPath['darwin'][dir]) {
      if (baseDir) {
        throw new Error('custom directories unsupported');
      } else {
        location = 'file://' + handleCanonicalPath(dir, File.os, File.user) + '/' + path;
      }
    }
    const response = await fetch(location);
    const text = await response.text();
    if (!(response.ok || allowRedirect && response.redirected)) {
      return null;
    }
    return text;
  } catch (ex) {
    return null;
  }
};
exports.fileBody = fileBody;
const handle = async (path, dir, writable, cache = {}) => {
  //returns buffer, eventually stream
  let suffix = path.split('.').pop();
  if (suffix.length > 6) suffix = '';
  const location = makeLocation(path, dir);
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    if (cache && cache[path]) return cache[path];
    const options = getFilePickerOptions(path);
    try {
      const response = await fileBody(path, dir);
      if (response === null) throw new Error('File not found');
    } catch (ex) {
      const newHandle = await wantInput(location, (event, resolve, reject) => {
        try {
          window.showSaveFilePicker(options).then(thisHandle => {
            resolve(thisHandle);
          }).catch(ex => {
            reject(ex);
          });
        } catch (ex) {
          reject(ex);
        }
      });
      return newHandle;
    }
    const fileHandle = await wantInput(location, (event, resolve, reject) => {
      try {
        window.showOpenFilePicker(options).then(([handle]) => {
          resolve(handle);
        }).catch(ex => {
          reject(ex);
        });
      } catch (ex) {
        reject(ex);
      }
    }, cache);
    // eslint-disable-next-line no-undef
    if (cache) cache[location] = fileHandle;
    // eslint-disable-next-line no-undef
    return fileHandle;
  } else {
    // todo: impl
  }
};
exports.handle = handle;
const load = async (path, dir, cache) => {
  //returns buffer, eventually stream
  const location = makeLocation(path, dir);
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    try {
      const response = await fetch(location);
      if (!response) {
        return [];
      }
      const buffer = await response.arrayBuffer();
      buffer;
      return buffer;
    } catch (ex) {
      return [];
    }
  } else {
    return await new Promise((resolve, reject) => {
      fs.readFile(location, (err, body) => {
        if (err) return reject(err);
        resolve(body);
      });
    });
  }
};
exports.load = load;
const exists = async (path, dir, cache, incomingHandle) => {
  //returns buffer, eventually stream
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    if (incomingHandle) {
      const fileHandle = incomingHandle;
      const file = await fileHandle.getFile();
      const buffer = await file.arrayBuffer();
      return !!buffer;
    } else {
      const body = await fileBody(path, dir);
      return body !== null;
    }
  } else {
    return await new Promise((resolve, reject) => {
      const location = makeLocation(path, dir);
      fs.stat(location, (err, res) => {
        if (err) resolve(false);
        resolve(true);
      });
    });
  }
};
exports.exists = exists;
const remove = async (path, dir, cache) => {
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    const fileHandle = await handle(path, dir, true, cache);
    if (fileHandle.remove) fileHandle.remove(); //non-standard, but supported
  } else {
    // todo: impl
  }
};
exports.remove = remove;
const info = async (path, dir, cache) => {
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    // todo: impl
  } else {
    // todo: impl
  }
};
exports.info = info;
const list = async (path, cache) => {
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    // todo: impl
  } else {
    // todo: impl
  }
};
exports.list = list;
const internalCache = {};
const listFiles = path => {
  return list(path).map(src => {
    const url = src.indexOf('://') !== -1 ? src : `file://${src}`;
    return new File(url);
  });
};
exports.listFiles = listFiles;
class File {
  constructor(path, options = {}) {
    const location = (path && path[0] === '/' ? `file:${path}` : path) || '/tmp/' + Math.floor(Math.random() * 10000);
    if (options.cache === true) options.cache = internalCache;
    this.options = options;
    //one of: desktop, documents, downloads, music, pictures, videos
    this.directory = options.directory || 'documents';
    this.path = location;
    this.buffer = new _buffer.FileBuffer();
  }
  async save() {
    await save(this.path, this.directory, this.buffer, this.options);
    return this;
  }
  async load() {
    const dir = this.path.indexOf('/') === -1 ? this.directory : '';
    this.buffer = await load(this.path, dir, this.options);
    this.buffer.cast = type => {
      return _buffer.FileBuffer.to(type, this.buffer);
    };
    return this;
  }
  body(value) {
    if (value === null || value === undefined) return this.buffer;
    this.buffer = _buffer.FileBuffer.from(value);
    this.buffer.cast = type => {
      return _buffer.FileBuffer.to(type, this.buffer);
    };
    if (value) return this;
    return this.buffer;
  }
  async info() {
    return await info(this.path, this.directory);
  }
  async 'delete'() {
    await remove(this.path, this.directory, this.option);
    return this;
  }
  static exists(path, directory) {
    return exists(path, directory);
  }
}
exports.File = File;
Object.defineProperty(File, 'currentDirectory', {
  get() {
    if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
      let path = window.location.pathname;
      path = path.split('/');
      path.pop(); // drop the top one
      return path.join('/');
    } else {
      return process.cwd();
    }
  },
  set(newValue) {
    //do nothing
  },
  enumerable: true,
  configurable: true
});
let user = '';
Object.defineProperty(File, 'user', {
  get() {
    if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
      return user || 'khrome'; //todo: something real;
    } else {
      return user || 'khrome'; //todo: something real;
    }
  },

  set(newValue) {
    user = newValue;
  },
  enumerable: true,
  configurable: true
});
Object.defineProperty(File, 'os', {
  get() {
    if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
      return 'darwin'; //todo: something real;
    } else {
      return 'darwin';
    }
  },
  set(newValue) {
    //do nothing
  },
  enumerable: true,
  configurable: true
});
const canonicalLocationToPath = {
  darwin: {
    'desktop': '~/Desktop',
    'documents': '~/Documents',
    'downloads': '~/Downloads',
    'music': '~/Music',
    'pictures': '~/Pictures',
    'home': '~/Pictures',
    'videos': '~/Movies'
  },
  win: {},
  linux: {}
};
const osToHome = {
  darwin: '/Users/${user}',
  win: 'C:/',
  linux: '/Users/${user}'
};

/*const handlePath = (path, os, username)=>{
    return path.replace('~', osToHome[os].replace('${user}', username));
};*/

const handleCanonicalPath = (name, os, username) => {
  const path = canonicalLocationToPath[os][name];
  return path.replace('~', osToHome[os].replace('${user}', username));
};
File.directory = {};
Object.defineProperty(File.directory, 'current', {
  get() {
    if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
      let path = window.location.pathname;
      path = path.split('/');
      path.pop(); // drop the top one
      return path.join('/');
    } else {
      return process.cwd();
    }
  },
  set(newValue) {
    //do nothing
  },
  enumerable: true,
  configurable: true
});
const directoryGet = type => {
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    return handleCanonicalPath('home', File.os, File.user);
  } else {
    return process.cwd();
  }
};
Object.keys(canonicalLocationToPath['darwin']).forEach(key => {
  // register all available keys
  Object.defineProperty(File.directory, key, {
    enumerable: true,
    configurable: true,
    get() {
      return directoryGet(key);
    },
    set(newValue) {}
  });
});