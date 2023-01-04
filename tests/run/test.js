/* global magicMirrorWrapperWeb */
'use strict';

function createMockTeletronWebStart(extensionName) {
  const httpPrefix = '/extensions/' + extensionName;
  return {
    messages: {
      dispatch: function (...args) {
        console.log('MESSAGES.DISPATCH', args);
      },
      subscribe: function (...args) {
        console.log('MESSAGES.SUBSCRIBE', args);
        return [
          function (...args) {
            console.log('DISPATCH', args);
          },
        ];
      },
    },
    http: {
      PREFIX: httpPrefix,
      get: async (url) => {
        const rsp = await fetch(httpPrefix + url);
        return await rsp.json();
      },
    },
    registerComponent: function (moduleName, renderer) {
      renderer(document.getElementById(`container-${moduleName}`), {
        componentType: `${extensionName}.${moduleName}`,
        foo: 'bar',
        actualModuleName: moduleName,
        actualExtensionName: extensionName,
      });
    },
  };
}

async function localStart() {
  magicMirrorWrapperWeb.start(
    createMockTeletronWebStart('simple'),
    'simple',
    'simple'
  );
  magicMirrorWrapperWeb.start(
    createMockTeletronWebStart('mm-advanced'),
    'advanced',
    'advanced'
  );
}
localStart();
