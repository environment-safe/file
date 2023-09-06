"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FileBuffer = void 0;
var _browserOrNode = require("browser-or-node");
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

let InternalBuffer = null;
if (_browserOrNode.isBrowser || _browserOrNode.isJsDom) {
  InternalBuffer = function () {};
  InternalBuffer.from = ob => {
    const type = Array.isArray(ob) ? 'array' : typeof ob;
    switch (type) {
      case 'object':
      case 'array':
      case 'string':
        var enc = new TextEncoder(); // utf8
        var array = enc.encode(ob);
        return array.buffer;
      case '':
    }
  };
  InternalBuffer.alloc = (size, fill, encoding = 'utf-8') => {
    const result = new Uint8Array(size);
    if (fill) {
      for (let lcv = 0; lcv < size; lcv++) {
        result[lcv] = fill;
      }
    }
    //todo: convert encoding to byte offset
  };
} else {
  InternalBuffer = Buffer;
}
const FileBuffer = InternalBuffer;
exports.FileBuffer = FileBuffer;