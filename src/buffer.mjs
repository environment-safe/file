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

if(isBrowser || isJsDom){
    InternalBuffer = function(){};
    var enc = new TextEncoder();
    var dec = new TextDecoder(); //'utf-8'
    InternalBuffer.from = (ob)=>{
        const type = Array.isArray(ob)?'array':(typeof ob);
        if(InternalBuffer.is(ob)) return ob;
        switch(type){
            case 'object':
            case 'array':
            case 'string':
                return enc.encode(ob).buffer;
            case '':
        }
    };
    InternalBuffer.is = (buffer)=>{
        return buffer instanceof ArrayBuffer
    };
    InternalBuffer.to = (type, buffer)=>{
        switch(type){
            case 'object':
            case 'array':
            case 'string':
                const result = dec.decode(buffer);
                return result;
            case '':
        }
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
    InternalBuffer = function(){};
    InternalBuffer.from = (ob='')=>{
        return Buffer.from(ob);
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
            case '':
        }
    };
}

export const FileBuffer = InternalBuffer;