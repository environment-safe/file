export class Path {
    static browserLocations: string[];
    static from(str: any): Path;
    static location(name: any): any;
    static isLocation(path: any): boolean;
    static within(path: any, subpath: any): boolean;
    static relative(to: any, from: any): any;
    static join(...parts: any[]): string;
    constructor(url: any);
    parsed: {
        type: string;
        windows: {
            name: any;
            root: string;
            drive: any;
            ext: string;
            dir: string;
            base: any;
        };
        url: URL;
        posix: {
            root: string;
            dir: string;
            base: string;
            ext: string;
            name: string;
        };
    };
    toUrl(type: any, relative: any): any;
    toString(): any;
}
export namespace Path {
    let current: any;
    let user: string;
}
