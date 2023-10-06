@environment-safe/file
======================
This is an experimental interface to provide a common file abstraction from client to server.

The design goal is to give the widest possible filesystem access, while minimizing the number of client interactions (via interaction initiation *or* popup) using a common API.

Usage
-----

If you want absolute URLs to work (raw, file://, etc.), you must include a base tag in your html with a `filesystem` attribute that denotes the filesystem path of the server root.

```html
<html>
    <head>
        <base filesystem="/Users/foo/webroot/" user="foo">
    </head>
    <body></body>
</html>
```

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
//or
const file = new File('foo.bar', '.');
```

You can load a file relative to the a predefined directory, for example `baz.mpg` in `videos`:
```javascript
const file = new File('baz.mpg', 'videos');
```

You can load a file relative to the a fully specified directory, for example `baz.info` in `/Users/me/`:
```javascript
const file = new File('baz.info', '/Users/me/');
```

You can load a file relative to the a relative directory, for example `package.json` in `../node_modules/dep`:
```javascript
const file = new File('package.json', '../node_modules/dep');
```

You can load a file directly from a fully specified path:
```javascript
const file = new File('/Users/me/file.ext');
```

Other scenarios may work in isolated circumstances, but are not supported client/server.


Roadmap
-------

- [ ] - test existing suite in windows + linux
- [ ] - safari directory returns
- [ ] - firefox directory returns
- [ ] - edge directory returns
- [ ] - apache directory returns
- [ ] - opera directory returns
- [ ] - streaming support

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

