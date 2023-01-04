// We do a module.exports, because an export default will result in { default: { debug, info, ... } }.
module.exports = {
  log: (...args: unknown[]) => console.log(args),
  debug: (...args: unknown[]) => console.debug(args),
  info: (...args: unknown[]) => console.info(args),
  warn: (...args: unknown[]) => console.warn(args),
  error: (...args: unknown[]) => console.error(args),
  trace: (...args: unknown[]) => console.trace(args),
};
