pxcan.globalSheets = {};
pxcan._registerGlobalSheet = function (content, filename) {
  pxcan.preload(content);

  var alias = filename.split('.')[0];
  var dimensions = filename.split('.')[1];
  pxcan.globalSheets[alias] = new pxcan.Sheet(
    alias, content, +dimensions.split('x')[0], +dimensions.split('x')[1]
  );
};