export namespace localFile {
    function initialize(): Promise<{
        exists: (path: any, options?: {}) => Promise<boolean>;
        list: (path: any, options?: {}) => Promise<void>;
        create: (path: any, options?: {}) => Promise<boolean>;
        read: (path: any, options?: {}) => Promise<any>;
        write: (path: any, buffer: any, options?: {}) => Promise<boolean>;
        delete: (path: any, options?: {}) => Promise<void>;
    }>;
}
export namespace serverFile {
    export function initialize_1(): Promise<{
        exists: (filePath: any, options?: {}) => Promise<any>;
        list: (path: any, options?: {}) => Promise<any>;
        create: (path: any, options?: {}) => Promise<any>;
        read: (path: any, options?: {}) => Promise<any>;
        write: (path: any, buffer: any, options?: {}) => Promise<any>;
        delete: (path: any, options?: {}) => Promise<any>;
    }>;
    export { initialize_1 as initialize };
}
export namespace file {
    export function initialize_2(): Promise<{
        exists: (path: any, options?: {}) => Promise<any>;
        list: (path: any, options?: {}) => Promise<void>;
        create: (path: any, options?: {}) => Promise<never>;
        read: (path: any, options?: {}) => Promise<any>;
        write: (path: any, buffer: any, options?: {}) => Promise<never>;
        delete: (path: any, options?: {}) => Promise<never>;
    }>;
    export { initialize_2 as initialize };
}
export namespace remote {
    export function initialize_3(): Promise<{
        exists: (path: any, options?: {}) => Promise<boolean>;
        list: (path: any, options?: {}) => Promise<void>;
        create: (path: any, options?: {}) => Promise<never>;
        read: (path: any, options?: {}) => Promise<any>;
        write: (path: any, buffer: any, options?: {}) => Promise<never>;
        delete: (path: any, options?: {}) => Promise<never>;
    }>;
    export { initialize_3 as initialize };
}
/**
 * A JSON object
 */
export type JSON = object;
