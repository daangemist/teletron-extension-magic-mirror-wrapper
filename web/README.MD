# magic-mirror-wrapper-web

This NPM package provides the functionality required for the web part of a Teletron extension that
wraps a [magic mirror](https://magicmirror.builders) module.

The author of this wrapper is in no way affiliated with the Magic Mirror project. He is however a fan of the project
and the community that has been build around it. This wrapper must be seen as an ode to magic mirror. This code is,
similar to the Magic Mirror codebase, released under the MIT license.

## Installation and usage

There are two ways to use this extension, using vanilla javascript, or by using a bundler, such as webpack or vite.

### Vanilla

To use the umd version of this package, download it from `unpkg.com` and store it somewhere, so that the
`@teletron/magic-mirror-wrapper-node` package can make it available to Teletron.

    wget https://unpkg.com/@teletron/magic-mirror-wrapper-web -O web.umd.js
    wget https://unpkg.com/@teletron/magic-mirror-wrapper-web/build/web.css -O web.css

This will download the latest version of the wrapper script, and its CSS file.

Then create a script, and have that script served by the backend wrapper (as explained in that modules' README):

```javascript
// web.js

// Invoke the teletronRegisterExtension global to register the module.
(function () {
  function extensionStart() {
    if (typeof magicMirrorWrapperWeb === 'undefined') {
      // Wait until the magicMirrorWrap global is available
      setTimeout(() => extensionStart(), 100);
      return;
    }
    const teletron = window.teletronRegisterExtension('extension-name');
    magicMirrorWrapperWeb.start(teletron, 'component-name', 'module-name');
  }
  extensionStart();
})();
```

Update the backend code for the extension accordingly, so that it will load the css and js file that you
downloaded earlier.

### Bundler

First, install the npm package, then use it in the source folder you have assigned for your bundler.

    npm install @teletron/magic-mirror-wrapper-web

Then create a script:

```javascript
import { start } from '@teletron/magic-mirror-wrapper-web';
import from '@teletron/magic-mirror-wrapper-web/build/web.css';

async function extensionStart() {
  const teletron = window.teletronRegisterExtension('extension-name');
  magicMirrorWrapperWeb.start(teletron, 'component-name', 'module-name');
}
extensionStart();
```

Update the backend code for the extension accordingly, so that it will load the css and js file that are
built by the bundler.

### Debugging

To debug what happens in the browser, execute the following in your browser console and refresh the page:

    localStorage.setItem('mmDebug', true);

    // to disable, execute and refresh the page
    localStorage.removeItem('mmDebug');

This will enable the debug logger to start sending out messages.

## Contributing

Contributions are welcome. This does not necessarily have to be code, it can also be updated documentation, tutorials, bug reports or pull requests.

Please create an [issue](https://github.com/daangemist/teletron-extension-magic-mirror-wrapper/issues) to propose a feature you want to implement, so that the details can be discussed in advance.

The major/minor version of this package reflect the last version tag of magic mirror. So that it is clear
against which version of Magic Mirror the wrapper has been tested.
