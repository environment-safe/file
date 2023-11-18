/* global Buffer:false */
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
 
// TODO: make this live in streams

import { isBrowser, isJsDom } from 'browser-or-node';

let InternalBuffer = null;

const base64ToArrayBuffer = (base64)=>{
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

if(isBrowser || isJsDom){
    InternalBuffer = function(value, type){
        if(InternalBuffer.is(value)) return value;
        if(type === 'base64') return base64ToArrayBuffer(value);
        return InternalBuffer.from(value);
    };
    const enc = new TextEncoder();
    const dec = new TextDecoder(); //'utf-8'
    InternalBuffer.fromDataURI = async (url)=>{
        if(typeof url === 'string' && url.startsWith('data:')){
            const result = await fetch(url);
            const buffer = await result.arrayBuffer();
            return buffer;
        }else{
            throw new Error('not a data uri');
        }
    };
    InternalBuffer.fromDataURL = InternalBuffer.fromDataURI;
    InternalBuffer.from = (ob)=>{
        const type = Array.isArray(ob)?'array':(typeof ob);
        if(InternalBuffer.is(ob)){
            return ob;
        }
        switch(type){
            case 'object':
            case 'array':
            case 'string':
                return enc.encode(ob).buffer;
            case '':
        }
    };
    InternalBuffer.is = (buffer)=>{
        return buffer instanceof ArrayBuffer;
    };
    const toBinString = (bytes) => bytes.reduce((str, byte) => str + byte.toString(2).padStart(8, '0'), '');
    InternalBuffer.to = (type, buffer)=>{
        let result = null;
        switch(type){
            case 'object':
            case 'array':
            case 'string':
                result = dec.decode(buffer);
                break;
            case 'binary-string':
                result = toBinString(Uint8Array.from(buffer));
                break;
            case 'base64':
                var binary = '';
                var bytes = new Uint8Array( buffer );
                var len = bytes.byteLength;
                for (var i = 0; i < len; i++) {
                    binary += String.fromCharCode( bytes[ i ] );
                }
                result = btoa( binary );
                break;
        }
        return result;
    };
    InternalBuffer.toString = (type, buffer)=>{
        let result = null;
        switch(type){
            case 'hex':
                result = Array.prototype.map.call(
                    new Uint8Array(buffer),
                    x => ('00' + x.toString(16)).slice(-2)
                ).join('').match(/[a-fA-F0-9]{2}/g).join('');
                break;
            case 'base64':
                result = InternalBuffer.to(type, buffer);
                break;
            default: result = InternalBuffer.to('string', buffer);
        }
        return result;
    };
    InternalBuffer.alloc = (size, fill, encoding='utf-8')=>{
        const result = new Uint8Array(size);
        if(fill){
            for(let lcv=0; lcv< size; lcv++){
                result[lcv] = fill;
            }
        }
        return result;
        //todo: convert encoding to byte offset
    };
}else{
    InternalBuffer = function(value, type){
        return new Buffer(value, type);
    };
    InternalBuffer.from = (ob='')=>{
        return Buffer.from(ob);
    };
    InternalBuffer.is = (buffer)=>{
        return Buffer.isBuffer(buffer);
    };
    InternalBuffer.fromDataURI = async (url)=>{
        if(typeof url === 'string' && url.startsWith('data:')){
            const result = await fetch(url);
            const buffer = await result.arrayBuffer();
            return buffer;
        }else{
            throw new Error('not a data uri');
        }
    };
    InternalBuffer.fromDataURL = InternalBuffer.fromDataURI;
    //InternalBuffer = Buffer;
    InternalBuffer.to = (type, buffer)=>{
        switch(type){
            case 'object':
                return buffer.toJSON();
            case 'array':
                return buffer.toJSON();
            case 'string':
                return buffer.toString();
            case 'base64':
                return buffer.toString('base64');
            case '':
            
        }
    };
    InternalBuffer.toString = (type, buffer)=>{
        if(type === 'base64') return InternalBuffer.to(type, buffer);
        return InternalBuffer.to('string', buffer);
    };
}
InternalBuffer.stringify = (buffer, indent='  ', lineIndent='', lineSize=80)=>{
    let pos = 0;
    return InternalBuffer.toString('hex', buffer).split('').map((value, index)=>{
        const chars = (pos%2 === 0 && pos !== 0)?indent+value:value;
        if(pos + chars.length > lineSize){
            const add = lineIndent+value;
            pos = add.length;
            return '\n'+add;
        }
        pos += chars.length;
        return chars;
    }).join('');
};

export const FileBuffer = InternalBuffer;