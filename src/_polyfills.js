// requestAnimationFrame
window.requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.oRequestAnimationFrame;

// Math.sign polyfill
Math.sign = function sign(x) {
  return !(x= parseFloat(x)) ? x : x > 0 ? 1 : -1;
};