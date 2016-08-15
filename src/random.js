// custom random number generator
//  it can just be called as a function, or it can be seeded
pxcan.random = (function() {
  // Hashcode of strings.
  //  http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  function hashString(str) {
    var hash = 0, i, chr, len;
    if (str.length == 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
  function getSeed(s) {
    if(typeof(s) === 'number') return s;
    else if(typeof(s) === 'string') return hashString(s);
    else throw new Error('not sure what to do with seed: ' + s);
  }
  function SinRand(s) {
    var seed = getSeed(s);
    var obj = function() {
      var x = Math.sin(seed++) * 10000;
      x -= Math.floor(x);
      if(arguments.length === 0) return x;
      if(arguments.length === 1 && (arguments[0] instanceof Array)) return arguments[0][Math.floor(x*arguments[0].length)];
      if(arguments.length === 1) return Math.floor(x*arguments[0]);
      if(arguments.length === 2) return Math.floor(x*(arguments[1]+1-arguments[0]))+arguments[0];
      else throw new Error('invalid arguments for random generator.');
    };
    obj.seed = function(s) { seed = getSeed(s); };
    obj.create = function(s) {
      return SinRand((s !== undefined)? s: obj());
    };
    return obj;
  };
  return SinRand(Math.random());
})();