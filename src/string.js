nigelgame.Nstring = function(text, cols, rows) {
  //separate into lines
  //if no column limit, just split by newline
  if(!cols) {
    this.lines = text.split('\n');
  }
  //otherwise, split by newline OR line too long
  else {
    this.lines = [];
    var s = text;
    for(var r = 0; s.length > 0 && !(r >= rows); ++r) {
      this.lines.push(s.substr(0, Math.min(s.indexOf('\n'), cols)));
      s = s.substr(Math.min(s.indexOf('\n')+1, cols));
    }
  }
  //max line length, needed to format text
  var maxcol = 0;
  this.lines.forEach(function(x){if(x.length>maxcol)maxcol=x.length;});
  this.maxcol = maxcol;
  //how many rows
  this.rows = this.lines.length;
};