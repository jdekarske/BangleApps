exports = class mapTools {
  static radians(a) {
    return (a * Math.PI) / 180;
  }

  static degrees(a) {
    const d = (a * 180) / Math.PI;
    return (d + 360) % 360;
  }

  static toXY(a, origin) {
    const pt = {
      x: 0,
      y: 0,
    };

    pt.x = 6371000 * this.radians(a.lon - origin.lon)
            * Math.cos(this.radians((a.lat + origin.lat) / 2));
    pt.y = 6371000 * this.radians(origin.lat - a.lat);
    return pt;
  }

  static arraytoXY(array, origin) {
    const out = [];
    array.forEach((pt) => {
      const newpt = this.toXY(pt, origin);
      out.push(newpt);
    });
    return out;
  }

  static distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  // https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
  static downloadObjectAsJSON(exportObj, exportName) {
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(exportObj)}`; // must be stringified!!
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', `${exportName}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
};
