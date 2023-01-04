# magic-mirror-wrapper-node

This NPM package provides the functionality required for the backend part of a Teletron extension that
wraps a [magic mirror](https://magicmirror.builders) module.

The author of this wrapper is in no way affiliated with the Magic Mirror project. He is however a fan of the project
and the community that has been build around it. This wrapper must be seen as an ode to magic mirror. This code is,
similar to the Magic Mirror codebase, released under the MIT license.

## Installation

Inside the folder where you want to place the backend code for the extension, run:

    npm install @teletron/magic-mirror-wrapper-node

## Usage

Inside the script where the `"main"` section of the `package.json` of the extension points to place the following:

```javascript
const path = require('node:path');
const { start } = require('@teletron/magic-mirror-wrapper-node');

async function extensionStart(extensionManager) {
  await start(
    'module', // the name of the module
    'extension', // the name of the extension, as defined in the teletron section of the extension package.json
    teletron, // the ExtensionManager object provided by Teletron at initialization
    path.join(__dirname, '../module-code') // the path to the code of the module
  );

  // Add the component configuration
  extensionManager.components.add({
    name: 'componentname',
    displayName: 'Display name for Component',
    configuration: {
      fields: [
        {
          attribute: 'text',
          type: 'text',
          required: true,
          label: 'Text to display',
        },
      ],
    },
  });

  // Tell Teletron where to read the web scripts, the folder is ./web in this example. The second parameter is the files to load.
  // web.umd.js is the umd version of the @teletron/magic-mirror-wrapper-web, web.js is the custom initialization script, and web.css
  // is the css file, also from the @teletron/magic-mirror-wrapper-web package.
  extensionManager.assets(path.join(__dirname, './web'), [
    'web.umd.js',
    'web.js',
    'web.css',
  ]);
}

module.exports = extensionStart;
```

## node_helper.js

In Magic Mirror modules it is possible to have a node worker running. This is done by providing a file called `node_helper.js` in the
module folder. This wrapper will start the helper.

Some manual changes are required for the node_helper to work in this wrapper.

### Necessary changes

Magic Mirror uses these two aliases, to make it easier for module developers.

    moduleAlias.addAlias('node_helper', path.join(**dirname, '../../build/node/nodeHelper.js'));
    moduleAlias.addAlias('logger', path.join(**dirname, '../../build/node/logger.js'));

These two aliases are not present in this wrapper, in order to make it work you need to replace the require statements:

```javascript
const NodeHelper = require('node_helper');
const Logger = require('logger');

// become
const { NodeHelper, Logger } = require('@teletron/magic-mirror-wrapper-node');
```

# Development

## Contributing

Contributions are welcome. This does not necessarily have to be code, it can also be updated documentation, tutorials, bug reports or pull requests.

Please create an [issue](https://github.com/daangemist/teletron-extension-magic-mirror-wrapper/issues) to propose a feature you want to implement, so that the details can be discussed in advance.

## Updating the Magic Mirror version

This module uses parts of the magic mirror repository. When a new version of magic mirror releases, you
can update these dependencies using the script below.

```bash
cd backend
rm -rf ./magic-mirror/*.*
mkdir /tmp/mm-clone
cd /tmp/mm-clone
git clone --depth 1 git@github.com:MichMich/MagicMirror.git .
cd -
cp -R /tmp/mm-clone/translations ./magic-mirror
rm -rf /tmp/mm-clone
```

Update the major and minor version of this package to have it reflect the last version tag of magic mirror. So that it is clear
what the version is of the Magic Mirror assets that are used.

## Debugging

To see the wrappers' debug logs, set the `DEBUG` environment variable to:

```
DEBUG=teletron:extensions:magic-mirror-wrapper:*
```
