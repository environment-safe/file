"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.save = exports.remove = exports.pathJoin = exports.load = exports.listFiles = exports.list = exports.info = exports.handle = exports.fileBody = exports.exists = exports.File = void 0;
var _browserOrNode = require("browser-or-node");
var _buffer = require("./buffer.cjs");
var fs = _interopRequireWildcard(require("fs"));
var path = _interopRequireWildcard(require("path"));
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
  window.addEventListener('load', event => {
    document.body.addEventListener(eventType, handler, false);
  });
  //document.body.addEventListener(eventType, handler, false);
};

if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
  attachInputGenerator('mousedown');
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
  if (dir && dir[0] === '.') {
    if (dir[1] === '.') {
      if (dir[2] === '/' && dir[3]) {
        return pathJoin(File.directory.current, '..', dir.substring(3), path);
      } else {
        if (dir[2]) {
          return pathJoin(File.directory.current, '..', dir.substring(3), path);
        } else {
          return pathJoin(File.directory.current, '..', path);
        }
      }
    } else {
      if (dir[1] === '/') {
        return pathJoin(File.directory.current, dir.substring(2), path);
      } else {
        if (dir[1]) {
          return pathJoin(File.directory.current, dir, path);
        } else {
          return pathJoin(File.directory.current, path);
        }
      }
    }
  }
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
    return path.join.apply(path, parts);
  }
};

//todo: should I remove export (no one should use this)?
exports.pathJoin = pathJoin;
const fileBody = async (path, dir, baseDir, allowRedirect, forceReturn) => {
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
    if (!(response.ok || allowRedirect && response.redirected || forceReturn)) {
      return null;
    }
    return text;
  } catch (ex) {
    //console.log(location, ex);
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
        return new ArrayBuffer();
      }
      const buffer = await response.arrayBuffer();
      buffer;
      return buffer;
    } catch (ex) {
      return new ArrayBuffer();
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
const list = async (path, options = {}) => {
  if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
    // todo: impl
    switch (File.agent.name) {
      case 'chrome':
        {
          const page = await fileBody('', path, null, null, true);
          let rows = page && page.match(/<script>addRow\((.*)\);<\/script>/g) || [];
          rows = rows.map(row => {
            return row.match(/<script>addRow\((.*)\);<\/script>/)[1];
          });
          const jsonData = `[[${rows.join('], [')}]]`;
          const data = JSON.parse(jsonData);
          let results = data.map(meta => {
            return {
              name: meta[0],
              isFile: () => {
                return !!meta[2];
              }
            };
          });
          if (Object.keys(options).length) {
            if (options.files === false) {
              results = results.filter(file => {
                return !file.isFile();
              });
            }
            if (options.directories === false) {
              results = results.filter(file => {
                return file.isFile();
              });
            }
            if (!options.hidden) {
              results = results.filter(file => {
                return file !== '.' && file !== '..';
              });
            }
          }
          return results.map(file => {
            return file.name;
          });
          //TODO: apache fallback
          //break;
        }

      default:
        throw new Error(`Usupported Browser: ${File.os}`);
    }
  } else {
    //todo: platform safe separator
    const target = path.indexOf('/') === -1 ? makeLocation('', path) : path;
    return await new Promise((resolve, reject) => {
      fs.readdir(target, {
        withFileTypes: true
      }, (err, files) => {
        if (err) return reject(err);
        let results = files;
        if (Object.keys(options).length) {
          if (options.files === false) {
            results = results.filter(file => {
              return !file.isFile();
            });
          }
          if (options.directories === false) {
            results = results.filter(file => {
              return file.isFile();
            });
          }
          if (!options.hidden) {
            results = results.filter(file => {
              return file !== '.' && file !== '..';
            });
          }
        }
        resolve(results.map(file => {
          return file.name;
        }));
      });
    });
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
    //todo: clean this rats nest up
    const location = (path && path[0] === '/' ? `file:${path}` : path) || !path && options.directory && handleCanonicalPath(options.directory, File.os, File.user) || '/tmp/' + Math.floor(Math.random() * 10000);
    if (options.cache === true) options.cache = internalCache;
    this.options = options;
    //one of: desktop, documents, downloads, music, pictures, videos
    this.directory = options.directory || '.';
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
    await remove(this.path, this.directory, this.options);
    return this;
  }
  static exists(path, directory) {
    return exists(path, directory);
  }
  static list(path, options) {
    return list(path, options);
  }
}
exports.File = File;
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
      const base = document.getElementsByTagName('base')[0];
      let basedir = null;
      if (base && (basedir = base.getAttribute('href'))) {
        return basedir;
      } else {
        let path = window.location.pathname;
        path = path.split('/');
        path.pop(); // drop the top one
        return path.join('/');
      }
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
Object.defineProperty(File, 'agent', {
  get() {
    if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
      //var nVer = navigator.appVersion;
      var nAgt = navigator.userAgent;
      var browserName = navigator.appName;
      var fullVersion = '' + parseFloat(navigator.appVersion);
      var majorVersion = parseInt(navigator.appVersion, 10);
      var nameOffset, verOffset, ix;

      // In Opera, the true version is after "Opera" or after "Version"
      if ((verOffset = nAgt.indexOf('Opera')) != -1) {
        browserName = 'Opera';
        fullVersion = nAgt.substring(verOffset + 6);
        if ((verOffset = nAgt.indexOf('Version')) != -1) fullVersion = nAgt.substring(verOffset + 8);
      }
      // In MSIE, the true version is after 'MSIE' in userAgent
      else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
        browserName = 'Microsoft Internet Explorer';
        fullVersion = nAgt.substring(verOffset + 5);
      }
      // In Chrome, the true version is after 'Chrome' 
      else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
        browserName = 'Chrome';
        fullVersion = nAgt.substring(verOffset + 7);
      }
      // In Safari, the true version is after 'Safari' or after 'Version' 
      else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
        browserName = 'Safari';
        fullVersion = nAgt.substring(verOffset + 7);
        if ((verOffset = nAgt.indexOf('Version')) != -1) fullVersion = nAgt.substring(verOffset + 8);
      }
      // In Firefox, the true version is after 'Firefox' 
      else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
        browserName = 'Firefox';
        fullVersion = nAgt.substring(verOffset + 8);
      }
      // In most other browsers, 'name/version' is at the end of userAgent 
      else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
        browserName = nAgt.substring(nameOffset, verOffset);
        fullVersion = nAgt.substring(verOffset + 1);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
          browserName = navigator.appName;
        }
      }
      // trim the fullVersion string at semicolon/space if present
      if ((ix = fullVersion.indexOf(';')) != -1) fullVersion = fullVersion.substring(0, ix);
      if ((ix = fullVersion.indexOf(' ')) != -1) fullVersion = fullVersion.substring(0, ix);
      majorVersion = parseInt('' + fullVersion, 10);
      if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
      }
      return {
        name: browserName.toLowerCase(),
        version: fullVersion,
        major: majorVersion
      };
    } else {
      return {};
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