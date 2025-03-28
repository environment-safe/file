@environment-safe/file
======================
This is an experimental interface to provide a common file abstraction from client to server.

The design goal is to give the widest possible filesystem access, while minimizing the number of client interactions (via interaction initiation *or* popup) using a common API.

You may need native paths, relative paths, file paths or web paths and may be running from an environment with a current directory or a web page with both a native location as well as a webroot. This allows all scenarios in all environments.

The browser file APIs are a total mess: with 6 different addressable formats, embedded proprietary formats and a bizarre array of interaction scenarios between client and server, and the abstraction does not fully cover all use cases yet.

Usage
-----

If you want absolute URLs to work (raw, file://, etc.), you must include a base tag in your html with a `filesystem` attribute that denotes the filesystem path of the server root. If not present, it assumes we are on a remote server.

```html
<html>
    <head>
        <base filesystem="/Users/foo/webroot/" user="foo">
    </head>
    <body></body>
</html>
```

To import the various 


### listing

You can list contents from an arbitrary location or from one of a few predefined locations (`desktop`, `documents`, `downloads`, `music`, `pictures`, `videos`). For example to list all the files in your `documents` directory:

```javascript
const list = await File.list('documents', {
    files: true,
    directories: false
});
```

### loading
You can load a file relative to the current directory, for example `foo.bar`

```javascript
const file = new File('foo.bar');
```

You can load a file relative to the a predefined directory, for example `baz.mpg` in `videos`:
```javascript
const file = new File(Path.join(Path.location('videos'), 'baz.mpg'));
```

You can load a file relative to the a fully specified directory, for example `baz.info` in `/Users/me/`:
```javascript
const file = new File(Path.join(Path.location('home'), 'baz.info'));
```

You can load a file relative to the web root, for example `package.json` in `../node_modules/dep`:
```javascript
const file = new File('../node_modules/dep/package.json'));
```

You can load a file directly from a fully specified path:
```javascript
const file = new File('/Users/me/file.ext');
```

You can stream a file:

```javascript
const stream = (new File('foo.bar')).stream();
```
Which returns a [WebStream](https://vercel.com/blog/an-introduction-to-streaming-on-the-web) in both [node.js](https://nodejs.org/api/webstreams.html) and the [browser](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) which are fully compatible with [@environment-safe/stream]()

Other scenarios may work in isolated circumstances, but are not supported client/server.


Roadmap
-------

- [x] - test existing suite in mac node
- [x] - test existing suite in in chrome + server
- [x] - test existing suite in in chrome + file
- [x] - streaming support
- [ ] - test existing suite in windows node
- [ ] - test existing suite in linux node
- [ ] - safari directory returns
- [ ] - firefox directory returns
- [ ] - edge directory returns
- [ ] - apache directory returns
- [ ] - opera directory returns

Testing
-------

Run the es module tests to test the root modules
```bash
npm run import-test
```
to run the same test inside the browser:

```bash
npm run browser-test
```
to run the same test headless in chrome:
```bash
npm run headless-browser-test
```

to run the same test inside docker:
```bash
npm run container-test
```

Run the commonjs tests against the `/dist` commonjs source (generated with the `build-commonjs` target).
```bash
npm run require-test
```

Development
-----------
All work is done in the .mjs files and will be transpiled on commit to commonjs and tested.

If the above tests pass, then attempt a commit which will generate .d.ts files alongside the `src` files and commonjs classes in `dist`

In order to run the `import-test`, you must link the local `moka`, which can be done with `npm run link-local-moka` This is normally solved via dependency hoisting except in the case where you are developing on the file API which has a circular dependency with `moka`.

