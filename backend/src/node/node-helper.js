import { Helper } from './helper';

/**
 * This is the NodeHelper that should be required from the modules' node_helper.js file.
 */
const NodeHelper = (() => {
  // @ts-ignore We are in a JS file, but somehow tsc still complains.
  function create(moduleDefinition) {
    const helper = new Helper(moduleDefinition);
    Object.entries(moduleDefinition).forEach(([key, value]) => {
      // @ts-expect-error We override the function using the ones in the module definition.
      helper[key] = value;
    });

    return helper;
  }

  return {
    create,
  };
})();

// We do a module.exports, because an export default will result in { default: { create, sendSocketNotification } }.
module.exports = NodeHelper;
