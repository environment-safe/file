@environment-safe/file
============================
This is an experimental interface to provide a common file abstraction from client to server.

The design goal is to give the widest possible filesystem access, while minimizing the number of client interactions (via interaction initiation *or* popup) using a common API.

Usage
-----

Roadmap
-------

- [ ] - test existing suite in windows + linux
- [ ] - safari directory returns
- [ ] - firefox directory returns
- [ ] - edge directory returns
- [ ] - safari directory returns
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

