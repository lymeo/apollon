/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(foo, ...args) {
  if (args.length > 0) {
    return args
      .filter(a => a)
      .reduce((a, b) => {
        function merge(left, right) {
          for (let key in right) {
            if (isObject(left[key])) {
              merge(left[key], right[key]);
            } else {
              left[key] = right[key];
            }
          }
        }
        return merge(a, b);
      }, foo);
  }
}

export default mergeDeep;
