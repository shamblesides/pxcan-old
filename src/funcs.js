// Hashcode of strings.
// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length == 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// random objects
// it can just be called as a function, or it can be seeded
nigelgame.random = (function() {
  function getSeed(s) {
    if(typeof(s) === 'number') return s;
    else if(typeof(s) === 'string') return s.hashCode();
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

// word wrap function by james padolsey
// modified from original
// http://james.padolsey.com/javascript/wordwrap-for-javascript/
nigelgame.wrapString = function(str, width, maxLines) {
  if (!str) return str;
  var regex = '.{1,' +width+ '}(\\s|$)|.{' +width+ '}|.+$';
  var lines = str.match(RegExp(regex, 'g'));
  if(maxLines) lines = lines.slice(0, maxLines);
  for(var i = 0; i < lines.length; ++i) lines[i] = lines[i].trim();
  return lines.join('\n');
};