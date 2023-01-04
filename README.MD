# Teletron Extension Magic Mirror Wrapper

This repository contains two wrapper packages, to easily wrap a [Magic Mirror](https://magicmirror.builders/) module into a [Teletron](https://www.teletron.me) compatible extension.

The author of this wrapper is in no way affiliated with the Magic Mirror project. He is however a fan of the project
and the community that has been build around it. This wrapper must be seen as an ode to magic mirror. This code is,
similar to the Magic Mirror codebase, released under the MIT license.

## Node / backend

See the backend package details for more information on usage and installation.

[backend](./backend)

## Web

See the web package details for more information on usage and installation.

[web](./web)

# Contributing

Contributions are welcome. This does not necessarily have to be code, it can also be updated documentation, tutorials, bug reports or pull requests.

Please create an [issue](https://github.com/daangemist/teletron-extension-magic-mirror-wrapper/issues) to propose a feature you want to implement, so that the details can be discussed in advance.

## Getting started

Run `docker-compose up` in the root of the project to start three containers, that will automatically recompile/restart on
code changes.

## Tests

Three containers are started when running `docker-compose up` in the root of the project. One of which is a simple test
scripts, that emulates teletron and two magic mirror modules. This can be used to manually validate
any changes you make to the code. The test page can be accessed by opening http://localhost:3000.
