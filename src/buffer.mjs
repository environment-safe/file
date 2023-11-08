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
}

if(isBrowser || isJsDom){
    InternalBuffer = function(value, type){
        if(InternalBuffer.is(value)) return value;
        if(type === 'base64') return base64ToArrayBuffer(value);
        return InternalBuffer.from(value);
    };
    const enc = new TextEncoder();
    const dec = new TextDecoder(); //'utf-8'
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
                break;
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
                result = btoa(InternalBuffer.to('binary-string', buffer));
                break;
        }
        return result;
    };
    InternalBuffer.toString = (type, buffer)=>{
        let result = null;
        if(type === 'base64'){
            result = InternalBuffer.to(type, buffer);;
        }else{
            result = InternalBuffer.to('string', buffer);
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
        //todo: convert encoding to byte offset
    };
}else{
    InternalBuffer = function(value, type){
        return new Buffer(value, type)
    };
    InternalBuffer.from = (ob='')=>{
        return Buffer.from(ob);
    };
    InternalBuffer.is = (buffer)=>{
        return Buffer.isBuffer(buffer);
    };
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
                return btoa(buffer.toString());
            case '':
            
        }
    };
    InternalBuffer.toString = (type, buffer)=>{
        if(type === 'base64') return InternalBuffer.to(type, buffer);
        return InternalBuffer.to('string', buffer);
    };
}

export const FileBuffer = InternalBuffer;