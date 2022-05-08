const mapTools = {};

mapTools.radians = function radians(a) {
  return (a * Math.PI) / 180;
};

mapTools.degrees = function degrees(a) {
  const d = (a * 180) / Math.PI;
  return (d + 360) % 360;
};

mapTools.toXY = function toXY(a, origin) {
  const pt = {
    x: 0,
    y: 0,
  };

  pt.x = 6371000 * this.radians(a.lon - origin.lon)
    * Math.cos(this.radians((a.lat + origin.lat) / 2));
  pt.y = 6371000 * this.radians(origin.lat - a.lat);
  return pt;
};

mapTools.arraytoXY = function arraytoXY(array, origin) {
  const out = [];
  array.forEach((pt) => {
    const newpt = this.toXY(pt, origin);
    out.push(newpt);
  });
  return out;
};

mapTools.angle = function angle(a, b) {
  const x = b.x - a.x;
  const y = b.y - a.y;
  return Math.atan2(-y, x);
};

mapTools.rotateVec = function rotateVec(a, theta) {
  const pt = {
    x: 0,
    y: 0,
  };
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  pt.x = c * a.x - s * a.y;
  pt.y = s * a.x + c * a.y;
  return pt;
};

mapTools.distance = function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
};

// https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
mapTools.downloadObjectAsJSON = function downloadObjectAsJSON(exportObj, exportName) {
  const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(exportObj)}`; // must be stringified!!
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', `${exportName}.json`);
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

console.log('here');
console.log(typeof exports);
console.log(typeof module);
console.log(typeof define);
// console.log(define.amd);
// console.log(global);

console.log('enddebug');
