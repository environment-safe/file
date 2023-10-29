export { Path };
export function initialized(path: any, options: any): Promise<void>;
export function read(path: any, options: any): Promise<any>;
export function list(path: any, options: any): Promise<any>;
export function write(path: any, buffer: any, options: any): Promise<any>;
export function create(path: any): Promise<any>;
export function exists(path: any): Promise<any>;
export function remove(path: any): Promise<any>;
export class File {
    static exists(path: any, directory: any): Promise<any>;
    static list(path: any, options: any): Promise<any>;
    constructor(path: any, options?: {});
    options: {};
    directory: any;
    path: any;
    buffer: any;
    save(): Promise<this>;
    load(): Promise<this>;
    body(value: any): any;
    info(): Promise<void>;
    delete(): Promise<this>;
}
/**
 * A JSON object
 */
export type JSON = object;
import { Path } from './path.mjs';
