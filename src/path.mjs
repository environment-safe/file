/* eslint-disable no-case-declarations */
import * as os from 'os'; 
import { 
    isBrowser,
    isJsDom,
    isServer, // is running on a server runtime
    os as osName, // Operating system, machine friendly
} from '@environment-safe/runtime-context';

const knownLocationsMap = {
    darwin : {
        'desktop': '~/Desktop', 
        'documents': '~/Documents', 
        'downloads': '~/Downloads', 
        'music': '~/Music', 
        'pictures': '~/Pictures', 
        'temporary': '/tmp',
        'videos': '~/Movies',
        'web': '~/Sites',
        'home': '~'
    },
    win : {},
    linux : {},
};
knownLocationsMap['mac os x'] = knownLocationsMap.darwin;
knownLocationsMap['windows'] = knownLocationsMap.win;

const canonicalLocationToPath = (location, username)=>{
    const os = osName;
    return (
        (knownLocationsMap[os] && knownLocationsMap[os][location]) || location
    ).replace('~', osToHome[os].replace('${user}', username));
};

const osToHome = {
    darwin : '/Users/${user}',
    win : 'C:\\Users\\${user}',
    linux : '/Users/${user}',
};
osToHome['mac os x'] = osToHome.darwin;
osToHome['windows'] = osToHome.win;

const join = (osName, ...parts)=>{
    if(osName === 'windows') return parts.join('\\');
    return parts.join('/');
};

const formatWindows = (parsed)=>{
    return `${parsed.dir}\\${parsed.name}`;
};

//todo: audit the posix code
const windowsRelative = (from, to)=>{
    if (from === to) return '';
    const fromDrive = from.substring(0,1);
    const toDrive = to.substring(0,1);
    const fromPath = from.substring(2);
    const toPath = to.substring(2);
    if(fromDrive !== toDrive) return from;
    let pos = 0;
    let commonPath = '';
    let pathSeparator = '\\';
    if(fromPath[pos] === pathSeparator || (fromPath[pos] === null && toPath[pos] === pathSeparator)){
        commonPath = fromPath.substring(0, pos);
    }
    while(fromPath[pos] === toPath[pos]){
        pos++;
        if(fromPath[pos] === pathSeparator || ((!fromPath[pos]) && toPath[pos] === pathSeparator)){
            commonPath = fromPath.substring(0, pos);
        }
    }
    if(!commonPath) return from;
    const remainingFrom = fromPath.substring(commonPath.length);
    const remainingTo = toPath.substring(commonPath.length);
    const fromParts = remainingFrom.split(pathSeparator);
    const toParts = remainingTo.split(pathSeparator);
    if(fromParts[0] === '' && toParts[0] === ''){
        fromParts.shift();
        toParts.shift();
    }
    const ascendToCommonDirParts = fromParts.map(part=>'..');
    return ascendToCommonDirParts.concat(toParts).join(pathSeparator);
};

/*
    const pathRelativeTo = (target, relativeToPath, separator='/')=>{
        let len = 0;
        while(target.substring(0, len+1) === relativeToPath.substring(0, len+1)) len++;
        let result = target.substring(len-1);
        let parts = relativeToPath.substring(len).split(separator);
        for (let lcv=0; lcv < parts.length; lcv++){
            result = '..'+separator+result;
        }
        return result;
    };
*/ 


 
export class Path{
    
    static browserLocations = [
        'documents', 'desktop', 'downloads', 'music', 'pictures', 'videos'
    ];
    
    static from(str){
        return new Path(str);
    }
    
    static location(name){
        if(name === 'home' && isServer) return os.homedir();
        return canonicalLocationToPath(name, Path.user);
    }
    
    static isLocation(path){
        let found = false;
        Object.keys(knownLocationsMap[osName]).forEach((name)=>{
            if(found) return;
            const testPath = canonicalLocationToPath(name, Path.user);
            if(Path.within(path, testPath)){
                found = {
                    location : name,
                    locationPath : testPath,
                    remainingPath: path.substring(testPath.length)
                };
            }
        });
        return found;
    }
    
    static within(path, subpath){
        return path.indexOf(subpath) === 0;
    }
    
    //only supports absolute URLs
    static relative(to, from){
        if((to.indexOf(':\\')) === 1){
            return windowsRelative(to, from);
        }else{
            return posix.relative(to, from || Path.current);
        }
    }
    
    static join(...parts){
        return join(osName, ...parts);
    }
    
    static parent(path){
        const newPath = new Path(path);
        if(newPath.parsed && newPath.parsed.posix) return newPath.parsed.posix.dir;
        if(newPath.parsed && newPath.parsed.windows) return newPath.parsed.windows.dir;
        //TODO: handle link reference
    }
     
    constructor(url){
        const result = {};
        if((url.indexOf(':\\')) === 1){
            const drive = url.substring(0, 1);
            const path = url.substring(2).split('\\');
            result.type = 'absolute';
            const name = path.pop();
            result.windows = {
                name,
                root: `${drive}:\\`,
                drive,
                ext: '',
                dir: join('windows', `${drive}:${path.join('\\')}`),
                base: name.split('.').shift()
            };
        }else{
            if((url.indexOf('file://')) === 0){
                result.posix = posix.parse(url.substring(7));
                if(result.posix.dir && result.posix.dir[0] === '!'){
                    const target = result.posix.dir.substring(1);
                    result.posix.original = result.posix.dir;
                    result.posix.known = target.toLowerCase();
                    result.posix.dir = this.location(target.toLowerCase());
                }
            }else{
                if((url.indexOf('://')) !== -1){
                    result.url = new URL(url);
                }else{
                    if(url[0] === '.') result.type = 'relative';
                    else result.type = 'absolute';
                    result.posix = posix.parse(url);
                    if(result.posix.dir && result.posix.dir[0] === '!'){
                        const target = result.posix.dir.substring(1);
                        result.posix.original = result.posix.dir;
                        result.posix.known = target.toLowerCase();
                        result.posix.dir = this.location(target.toLowerCase());
                    }
                }
            }
        }
        this.parsed = result;
    }
     
    toUrl(type, relative){
        switch(type){
            case 'https:':
            case 'http:':
                //todo: simple mode that doesn't compute full URLs
                const url = this.toUrl('native');
                if(relative || url[0]=='.'){
                    const relativeTo = typeof relative === 'string'?relative:Path.current;
                    return `${Path.relative(relativeTo, url)}`;
                }
                //todo: support not having the current dir (pure web mode)
                if(!Path.within(Path.current, url)){
                    //uh oh, looks like we're outside the web root
                    let location = null;
                    // eslint-disable-next-line no-cond-assign
                    if(location = Path.isLocation(url)){
                        const result = `::${location.location}/${location.remainingPath}`;
                        result.parsed = location;
                        return result;
                    }else{
                        throw new Error('Path is outside of addressable locations');
                    }
                }
                const relativePath = Path.relative(Path.current, url);
                const prefix = relativePath[0]=='.'?'':type+'//';
                const result = `${prefix}${relativePath}`;
                return result;
            case 'file:':
                let res = null;
                if(relative){
                    res = `${ Path.relative(Path.current, this.toUrl('native')).replace(/\\/g, '/') }`;
                }
                res = `file://${this.toUrl('native')}`;
                return res;
            case 'native':
                switch(osName){
                    case 'darwin': 
                    case 'mac os x': 
                    case 'linux': 
                        return this.toUrl('posix', relative);
                    case 'win': 
                    case 'windows': 
                        return this.toUrl('windows', relative);
                    default: throw new Error('unsupported OS'+osName);
                }
            case 'windows':
                if(this.parsed.windows){
                    const windowsPath = `${this.parsed.windows.dir}\\${this.parsed.windows.name}`;
                    if(relative){
                        const relativeTo = typeof relative === 'string'?relative:Path.current;
                        return `${Path.relative(relativeTo, windowsPath)}`;
                    }
                    return windowsPath;
                }
                return '';
            case 'posix':
                if(this.parsed.posix){
                    const posixPath = posix.format(this.parsed.posix);
                    if(relative){
                        const relativeTo = typeof relative === 'string'?relative:Path.current;
                        return `${Path.relative(relativeTo, posixPath)}`;
                    }
                    return posixPath;
                }
                if(this.parsed.windows){
                    let windowsPath = formatWindows(this.parsed.windows);
                    if(relative){
                        const relativeTo = typeof relative === 'string'?relative:Path.current;
                        windowsPath = `${windowsRelative(relativeTo, windowsPath)}`;
                    }
                    windowsPath = windowsPath.replace(/[A-Z]:/g, '');
                    const posixPath = windowsPath;
                    return posixPath;
                }
                //it was parsed as a url
                return '';
            //anything else must be a relative path or url
            default: 
                
                /*if(this.parsed.posix){
                    let posixFormat = this.parsed.posix || {};
                    return posix.relative(type, posix.format(posixFormat));
                }
                if(this.parsed.windows){
                    let windowsFormat = this.parsed.windows || {};
                    return windowsRelative(type, formatWindows(windowsFormat));
                }*/
                if(this.parsed.url){
                    return this.parsed.url.toString();
                }
                return this.toUrl('native', true);
        }
    }
     
    toString(){
        return this.toUrl('native', Path.current);
    }
}
let currentPath = null;
let initialPath = null;
Object.defineProperty(Path, 'current', {
    get() {
        if(!currentPath){
            if(isBrowser || isJsDom){
                const base = document.getElementsByTagName('base')[0];
                let basedir = null;
                if(base && (basedir = base.getAttribute('href') && basedir.indexof('file://') !== -1)){
                    currentPath = basedir;
                }else{
                    if(base && (basedir = base.getAttribute('filesystem'))){
                        currentPath = basedir;
                    }else{
                        let path = window.location.pathname;
                        path = path.split('/');
                        path.pop(); // drop the top one
                        currentPath = path .join('/');
                    }
                }
            }else{
                currentPath = process.cwd();
            }
        }
        if(!initialPath) initialPath = currentPath;
        return currentPath;
    },
    set(newValue) {
        currentPath = newValue;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Path, 'user', {
    get() {
        if(isBrowser || isJsDom){
            const base = document.getElementsByTagName('base')[0];
            let user = null;
            if(base && (user = base.getAttribute('user'))){
                return user;
            }
            return user;
        }else{
            return os.userInfo().username;
        }
    },
    set(newValue) {
        //do nothing
    },
    enumerable: true,
    configurable: true,
});

function assertPath(path) {
    if(typeof path !== 'string'){
        throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
    }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
    var res = '';
    var lastSegmentLength = 0;
    var lastSlash = -1;
    var dots = 0;
    var code;
    for (var i = 0; i <= path.length; ++i) {
        if (i < path.length)
            code = path.charCodeAt(i);
        else if (code === 47 /*/*/)
            break;
        else
            code = 47 /*/*/;
        if (code === 47 /*/*/) {
            if (lastSlash === i - 1 || dots === 1) {
            // NOOP
            } else if (lastSlash !== i - 1 && dots === 2) {
                if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
                    if (res.length > 2) {
                        var lastSlashIndex = res.lastIndexOf('/');
                        if (lastSlashIndex !== res.length - 1) {
                            if (lastSlashIndex === -1) {
                                res = '';
                                lastSegmentLength = 0;
                            } else {
                                res = res.slice(0, lastSlashIndex);
                                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                            }
                            lastSlash = i;
                            dots = 0;
                            continue;
                        }
                    } else if (res.length === 2 || res.length === 1) {
                        res = '';
                        lastSegmentLength = 0;
                        lastSlash = i;
                        dots = 0;
                        continue;
                    }
                }
                if (allowAboveRoot) {
                    if (res.length > 0)
                        res += '/..';
                    else
                        res = '..';
                    lastSegmentLength = 2;
                }
            }else{
                if(res.length > 0)
                    res += '/' + path.slice(lastSlash + 1, i);
                else
                    res = path.slice(lastSlash + 1, i);
                lastSegmentLength = i - lastSlash - 1;
            }
            lastSlash = i;
            dots = 0;
        }else if (code === 46 /*.*/ && dots !== -1){
            ++dots;
        }else{
            dots = -1;
        }
    }
    return res;
}

function _format(sep, pathObject) {
    var dir = pathObject.dir || pathObject.root;
    var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
    if (!dir) {
        return base;
    }
    if (dir === pathObject.root) {
        return dir + base;
    }
    return dir + sep + base;
}

var posix = {
    // path.resolve([from ...], to)
    resolve: function resolve() {
        var resolvedPath = '';
        var resolvedAbsolute = false;
        var cwd;
    
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path;
            if (i >= 0)
                path = arguments[i];
            else {
                if(cwd === undefined) cwd = Path.current;
                path = cwd;
            }
    
            assertPath(path);
    
            // Skip empty entries
            if (path.length === 0) {
                continue;
            }
    
            resolvedPath = path + '/' + resolvedPath;
            resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
        }
    
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
    
        // Normalize the path
        resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
    
        if(resolvedAbsolute){
            if(resolvedPath.length > 0)
                return '/' + resolvedPath;
            else
                return '/';
        }else if (resolvedPath.length > 0){
            return resolvedPath;
        }else{
            return '.';
        }
    },

    normalize: function normalize(path) {
        assertPath(path);
    
        if (path.length === 0) return '.';
    
        var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
        var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;
    
        // Normalize the path
        path = normalizeStringPosix(path, !isAbsolute);
    
        if (path.length === 0 && !isAbsolute) path = '.';
        if (path.length > 0 && trailingSeparator) path += '/';
    
        if (isAbsolute) return '/' + path;
        return path;
    },

    isAbsolute: function isAbsolute(path) {
        assertPath(path);
        return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
    },

    join: function join() {
        if (arguments.length === 0)
            return '.';
        var joined;
        for (var i = 0; i < arguments.length; ++i) {
            var arg = arguments[i];
            assertPath(arg);
            if (arg.length > 0) {
                if (joined === undefined)
                    joined = arg;
                else
                    joined += '/' + arg;
            }
        }
        if (joined === undefined) return '.';
        return posix.normalize(joined);
    },

    relative: function relative(from, to) {
        assertPath(from);
        assertPath(to);
    
        if (from === to) return '';
    
        from = posix.resolve(from);
        to = posix.resolve(to);
    
        if (from === to) return '';
    
        // Trim any leading backslashes
        var fromStart = 1;
        for (; fromStart < from.length; ++fromStart) {
            if (from.charCodeAt(fromStart) !== 47 /*/*/) break;
        }
        var fromEnd = from.length;
        var fromLen = fromEnd - fromStart;
    
        // Trim any leading backslashes
        var toStart = 1;
        for (; toStart < to.length; ++toStart) {
            if (to.charCodeAt(toStart) !== 47 /*/*/) break;
        }
        var toEnd = to.length;
        var toLen = toEnd - toStart;
    
        // Compare paths to find the longest common path from root
        var length = fromLen < toLen ? fromLen : toLen;
        var lastCommonSep = -1;
        var i = 0;
        for (; i <= length; ++i) {
            if (i === length) {
                if (toLen > length) {
                    if (to.charCodeAt(toStart + i) === 47 /*/*/) {
                        // We get here if `from` is the exact base path for `to`.
                        // For example: from='/foo/bar'; to='/foo/bar/baz'
                        return to.slice(toStart + i + 1);
                    } else if (i === 0) {
                        // We get here if `from` is the root
                        // For example: from='/'; to='/foo'
                        return to.slice(toStart + i);
                    }
                } else if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
                        // We get here if `to` is the exact base path for `from`.
                        // For example: from='/foo/bar/baz'; to='/foo/bar'
                        lastCommonSep = i;
                    } else if (i === 0) {
                        // We get here if `to` is the root.
                        // For example: from='/foo'; to='/'
                        lastCommonSep = 0;
                    }
                }
                break;
            }
            var fromCode = from.charCodeAt(fromStart + i);
            var toCode = to.charCodeAt(toStart + i);
            if (fromCode !== toCode) break;
            else if (fromCode === 47 /*/*/) lastCommonSep = i;
        }
    
        var out = '';
        // Generate the relative path based on the path difference between `to`
        // and `from`
        for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
            if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
                if (out.length === 0)
                    out += '..';
                else
                    out += '/..';
            }
        }
    
        // Lastly, append the rest of the destination (`to`) path that comes after
        // the common path parts
        if (out.length > 0)
            return out + to.slice(toStart + lastCommonSep);
        else {
            toStart += lastCommonSep;
            if (to.charCodeAt(toStart) === 47 /*/*/) ++toStart;
            return to.slice(toStart);
        }
    },

    _makeLong: function _makeLong(path) {
        return path;
    },

    dirname: function dirname(path) {
        assertPath(path);
        if (path.length === 0) return '.';
        var code = path.charCodeAt(0);
        var hasRoot = code === 47 /*/*/;
        var end = -1;
        var matchedSlash = true;
        for(var i = path.length - 1; i >= 1; --i){
            code = path.charCodeAt(i);
            if(code === 47 /*/*/){
                if(!matchedSlash){
                    end = i;
                    break;
                }
            }else{
                // We saw the first non-path separator
                matchedSlash = false;
            }
        }
        if (end === -1) return hasRoot ? '/' : '.';
        if (hasRoot && end === 1) return '//';
        return path.slice(0, end);
    },

    basename: function basename(path, ext) {
        if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
        assertPath(path);
    
        var start = 0;
        var end = -1;
        var matchedSlash = true;
        var i;
    
        if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
            if (ext.length === path.length && ext === path) return '';
            var extIdx = ext.length - 1;
            var firstNonSlashEnd = -1;
            for (i = path.length - 1; i >= 0; --i) {
                var code = path.charCodeAt(i);
                if(code === 47 /*/*/){
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                } else {
                    if(firstNonSlashEnd === -1){
                        // We saw the first non-path separator, remember this index in case
                        // we need it if the extension ends up not matching
                        matchedSlash = false;
                        firstNonSlashEnd = i + 1;
                    }
                    if(extIdx >= 0){
                        // Try to match the explicit extension
                        if (code === ext.charCodeAt(extIdx)) {
                            if (--extIdx === -1){
                                // We matched the extension, so mark this as the end of our path
                                // component
                                end = i;
                            }
                        }else{
                            // Extension does not match, so our result is the entire path
                            // component
                            extIdx = -1;
                            end = firstNonSlashEnd;
                        }
                    }
                }
            }
    
            if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
            return path.slice(start, end);
        } else {
            for (i = path.length - 1; i >= 0; --i) {
                if (path.charCodeAt(i) === 47 /*/*/) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                        start = i + 1;
                        break;
                    }
                } else if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // path component
                    matchedSlash = false;
                    end = i + 1;
                }
            }
    
            if (end === -1) return '';
            return path.slice(start, end);
        }
    },

    extname: function extname(path) {
        assertPath(path);
        var startDot = -1;
        var startPart = 0;
        var end = -1;
        var matchedSlash = true;
        // Track the state of characters (if any) we see before our first dot and
        // after any path separator we find
        var preDotState = 0;
        for (var i = path.length - 1; i >= 0; --i) {
            var code = path.charCodeAt(i);
            if (code === 47 /*/*/) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if (end === -1) {
                // We saw the first non-path separator, mark this as the end of our
                // extension
                matchedSlash = false;
                end = i + 1;
            }
            if(code === 46 /*.*/){
                // If this is our first dot, mark it as the start of our extension
                if (startDot === -1)
                    startDot = i;
                else if (preDotState !== 1)
                    preDotState = 1;
            }else if (startDot !== -1){
                // We saw a non-dot and non-path separator before our dot, so we should
                // have a good chance at having a non-empty extension
                preDotState = -1;
            }
        }
    
        if(startDot === -1 || end === -1 ||
            // We saw a non-dot character immediately before the dot
            preDotState === 0 ||
            // The (right-most) trimmed path component is exactly '..'
            preDotState === 1 && startDot === end - 1 && startDot === startPart + 1
        ){
            return '';
        }
        return path.slice(startDot, end);
    },

    format: function format(pathObject) {
        if (pathObject === null || typeof pathObject !== 'object') {
            throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
        }
        return _format('/', pathObject);
    },

    parse: function parse(path) {
        assertPath(path);
    
        var ret = { root: '', dir: '', base: '', ext: '', name: '' };
        if (path.length === 0) return ret;
        var code = path.charCodeAt(0);
        var isAbsolute = code === 47 /*/*/;
        var start;
        if (isAbsolute) {
            ret.root = '/';
            start = 1;
        } else {
            start = 0;
        }
        var startDot = -1;
        var startPart = 0;
        var end = -1;
        var matchedSlash = true;
        var i = path.length - 1;
    
        // Track the state of characters (if any) we see before our first dot and
        // after any path separator we find
        var preDotState = 0;
    
        // Get non-dir info
        for (; i >= start; --i) {
            code = path.charCodeAt(i);
            if(code === 47 /*/*/){
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if(!matchedSlash){
                    startPart = i + 1;
                    break;
                }
                continue;
            }
            if(end === -1){
                // We saw the first non-path separator, mark this as the end of our
                // extension
                matchedSlash = false;
                end = i + 1;
            }
            if(code === 46 /*.*/){
                // If this is our first dot, mark it as the start of our extension
                if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
            }else if (startDot !== -1){
                // We saw a non-dot and non-path separator before our dot, so we should
                // have a good chance at having a non-empty extension
                preDotState = -1;
            }
        }
    
        if (startDot === -1 || end === -1 ||
            // We saw a non-dot character immediately before the dot
            preDotState === 0 ||
            // The (right-most) trimmed path component is exactly '..'
            preDotState === 1 && startDot === end - 1 && startDot === startPart + 1
        ){
            if (end !== -1) {
                if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);
                else ret.base = ret.name = path.slice(startPart, end);
            }
        } else {
            if (startPart === 0 && isAbsolute) {
                ret.name = path.slice(1, startDot);
                ret.base = path.slice(1, end);
            } else {
                ret.name = path.slice(startPart, startDot);
                ret.base = path.slice(startPart, end);
            }
            ret.ext = path.slice(startDot, end);
        }
        if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';
        return ret;
    },

    sep: '/',
    delimiter: ':',
    win32: null,
    posix: null
};

