
// non-standard Math functions useful for games
var pxMath = {
  // Median
  mid: function() {
    var arr = [];
    for(var i = 0; i < arguments.length; ++i) arr.push(+arguments[i]);
    arr.sort(function(a, b) { return a-b; });
    if(arr.length%2 === 1) return arr[Math.floor(arr.length/2)];
    else return (arr[Math.floor(arr.length/2)] + arr[Math.floor(arr.length/2)-1]) / 2;
  },
  // Clamp
  //  returns val if it's between min and max.
  //  or, returns the min or max value.
  //  can be called with two arguments: then it's between val, -max, and max.
  clamp: function(val, min, max) {
    if(arguments.length === 2) {
      max = arguments[1];
      min = -arguments[1];
    }
    return pxMath.mid(min, val, max);
  }
}