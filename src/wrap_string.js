// word wrap function by james padolsey
// modified from original
// http://james.padolsey.com/javascript/wordwrap-for-javascript/
pxcan.wrapString = function(str, width, maxLines) {
  if (!str) return str;
  var regex = '.{1,' +width+ '}(\\s|$)|.{' +width+ '}|.+$';
  var lines = str.match(RegExp(regex, 'g'));
  if(maxLines) lines = lines.slice(0, maxLines);
  for(var i = 0; i < lines.length; ++i) lines[i] = lines[i].trim();
  return lines.join('\n');
};