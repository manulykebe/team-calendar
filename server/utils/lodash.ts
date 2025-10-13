import * as _ from 'lodash';

// Re-export all named functions
export const {
  get, set, merge, find, findIndex, sortBy, groupBy, debounce, throttle,
  cloneDeep, isEqual, isEmpty, isArray, isObject, isString, isNumber,
  isBoolean, isUndefined, isNull, pick, omit, uniq, uniqBy, flatten,
  chunk, difference, differenceBy, intersection, union, range
  // Add other lodash functions you need
} = _;

// Export default
export default _;