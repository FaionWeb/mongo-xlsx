'use strict';

exports.deepCompare = function(a, b) {
  //var i, l;
  var leftChain = [];
  var rightChain = [];
  var p;
  function compare2Objects(x, y) {
    //console.log("COMPARING: ", JSON.stringify(x), JSON.stringify(y));

    // remember that NaN === NaN returns false
    // and isNaN(undefined) returns true
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
      return true;
    }

    // Compare primitives and functions.
    // Check if both arguments link to the same object.
    // Especially useful on step when comparing prototypes
    if (x === y) {
      return true;
    }

    // Works in case when functions are created in constructor.
    // Comparing dates is a common scenario. Another built-ins?
    // We can even handle functions passed across iframes
    if ((typeof x === 'function' && typeof y === 'function') ||
      (x instanceof Date && y instanceof Date) ||
      (x instanceof RegExp && y instanceof RegExp) ||
      (x instanceof String && y instanceof String) ||
      (x instanceof Number && y instanceof Number)) {
      var status = x.toString() === y.toString();
      if (!status) {
        console.log("ERROR", status, x, y);
      }
      return status;
    }

    // At last checking prototypes as good a we can
    if (!(x instanceof Object && y instanceof Object)) {

      // NOTE We allow null=={} due to excel parsing of empty rows...
      var bothEmpty = (isEmpty(y) && isEmpty(x));
      if (!bothEmpty) {
        console.log("ERROR", "instanceof", x, y);
        return false;
      } else {
        if (x === null || y === null || (typeof x === 'undefined') || (typeof y === 'undefined')) {
          return true; // this will crash later on...
        }
      }
    }

    if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
      console.log("ERROR", "isPrototypeOf", x, y);

      return false;
    }

    if (x.constructor !== y.constructor) {
      if (x instanceof Date || y instanceof Date) {
        // TODO
        // This temporal workaround is to allow dates that are represented as json objects.
        return true;
      }
      console.log("ERROR", "constructor", x, y);
      return false;
    }

    if (x.prototype !== y.prototype) {
      console.log("ERROR", "prototype", x, y);

      return false;
    }

    // Check for infinitive linking loops
    if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
      console.log("ERROR", "indexOfChain", x, y);

      return false;
    }

    // Quick checking of one object beeing a subset of another.
    // todo: cache the structure of arguments[0] for performance
    for (p in y) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        console.log("ERROR", "hasOwnProperty1", y, x, p);

        return false;
      }
      else if (typeof y[p] !== typeof x[p]) {

        if (x[p] instanceof Date || x[p] instanceof Date) {
          // TODO
          // This temporal workaround is to allow dates that are represented as json objects.
          return true;
        }

        console.log("ERROR", "typeof1", x[p], y[p]);

        return false;
      }
    }

    for (p in x) {
      if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
        // due to nulls on excels and nulls != empty rows...
        var bothEmpty = (isEmpty(y.p) && isEmpty(x.p));
        if (!bothEmpty) {
          console.log("ERROR", "hasOwnProperty2", x, y, p);
          return false;
        }
      }
      else if (typeof y[p] !== typeof x[p]) {
        console.log("ERROR", "typeof2", x[p], y[p], p);

        return false;
      }

      switch (typeof (x[p])) {
        case 'object':
        case 'function':

          leftChain.push(x);
          rightChain.push(y);

          if (!compare2Objects(x[p], y[p])) {
            console.log("ERROR", "recursive", x, x[p], y[p], p);
            return false;
          }

          leftChain.pop();
          rightChain.pop();
          break;

        default:
          if (x[p] !== y[p]) {
            //[ 'hello', 'world', t: 's' ] s undefined t
            console.log("ERROR", "chain", JSON.stringify(x), x[p], y[p], p);
            return false;
          }
          break;
      }
    }
    return true;
  }

  return compare2Objects(a, b);
};

var hasOwnPropertyProtype = Object.prototype.hasOwnProperty;

function isEmpty(obj) {
  if (!obj) {
    return true;
  }
  if (obj.length > 0) {
    for(var i = 0; i < obj.length; i++) {
      if (!isEmpty(obj[i])) {
        return false;
      }
    }
  }
  if (obj.length === 0) {
    return true;
  }
  for (var key in obj) {
    if (hasOwnPropertyProtype.call(obj, key)) {
      if (!isEmpty(obj[key])) {
        return false;
      }
    }
  }

  return true;
}