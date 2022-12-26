/* global magicMirrorWrapperWeb */
'use strict';

function createMockTeletronWebStart(extensionName, moduleName) {
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
            console.log(DISPATCH, args);
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
      renderer(document.getElementById('container-simple'), {
        componentType: `simple.${moduleName}`,
        configuration: {
          foo: 'bar',
        },
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
}
localStart();
