const Storage = require('Storage');
const Layout = require('Layout');
const golfviewTools = require('golfviewTools');

const courselist = Storage.list(/^golf-\d+\.json$/);
const course = Storage.readJSON(courselist[0]).holes;
const numHoles = course.length;

let currentHole = 1;
let hole = course[currentHole.toString()];
const userPosition = {
  fix: false,
  lat: 0,
  lon: 0,
  x: 0,
  y: 0,
  to_hole: 0,
  last_time: getTime(),
  transform: {},
};

function drawUser() {
  if (!userPosition.fix) return;
  const newPos = g.transformVertices([userPosition.x, userPosition.y], userPosition.transform);
  g.setColor(g.theme.fg);
  g.drawCircle(newPos[0], newPos[1], 8);
}

function drawHole(l) {
  let newnodelist = [];
  let nodelist = [];

  // console.log(l);
  // eslint-disable-next-line max-len
  const holeStraightDistance = golfviewTools.distance(hole.nodesXY[0], hole.nodesXY[hole.nodesXY.length - 1]);

  const holeScale = (0.9 * l.h) / holeStraightDistance;

  const transform = {
    x: l.x + l.w / 2, // center in the box
    y: l.h * 0.95, // pad it just a bit TODO use the extent of the teeboxes/green
    scale: holeScale,
    rotate: hole.angle - Math.PI / 2.0, // angle in radians (default 0)
  };

  userPosition.transform = transform;

  // draw the fairways first
  hole.features.sort((a) => {
    if (a.type === 'fairway') {
      return -1;
    }
    return 1;
  });

  hole.features.forEach((feature) => {
    // console.log(Object.keys(feature));
    if (feature.type === 'fairway') {
      g.setColor(1, 0, 1); // magenta
    } else if (feature.type === 'tee') {
      g.setColor(1, 0, 0); // red
    } else if (feature.type === 'green') {
      g.setColor(0, 1, 0); // green
    } else if (feature.type === 'bunker') {
      g.setColor(1, 1, 0); // yellow
    } else if (feature.type === 'water_hazard') {
      g.setColor(0, 0, 1); // blue
    } else {
      return;
    }

    nodelist = [];
    feature.nodesXY.forEach((node) => {
      nodelist.push(node.x);
      nodelist.push(node.y);
    });
    newnodelist = g.transformVertices(nodelist, transform);

    g.fillPoly(newnodelist, true);
    // console.log(feature.type);
    // console.log(newnodelist);
  });

  const waynodelist = [];
  hole.nodesXY.forEach((node) => {
    waynodelist.push(node.x);
    waynodelist.push(node.y);
  });

  newnodelist = g.transformVertices(waynodelist, transform);
  g.setColor(0, 1, 1); // cyan
  g.drawPoly(newnodelist);
}
const layout = new Layout({
  type: 'h',
  c: [
    {
      type: 'v',
      c: [
        {
          type: 'txt', font: '10%', id: 'hole', label: 'HOLE 18',
        },
        {
          type: 'txt', font: '10%', id: 'par', label: 'PAR 4',
        },
        {
          type: 'txt', font: '10%', id: 'hcp', label: 'HCP 18',
        },
        {
          type: 'txt', font: '35%', id: 'postyardage', label: '---',
        },
        {
          type: 'txt', font: '20%', id: 'measyardage', label: '---',
        },
      ],
    },
    {
      type: 'custom', render: drawHole, id: 'holeImage', bgCol: g.theme.bg, fillx: 1, filly: 1,
    },
    {
      type: 'custom', render: drawUser, id: 'user',
    },
  ],
  lazy: true,
});

function setHole(newHole) {
  layout.hole.label = `HOLE ${newHole}`;
  layout.par.label = `PAR ${course[newHole.toString()].par}`;
  layout.hcp.label = `HCP ${course[newHole.toString()].handicap}`;
  layout.postyardage.label = course[newHole.toString()]
    .tees[course[newHole.toString()].tees.length - 1];

  g.clear();
  layout.render();
}

function updateDistanceToHole() {
  const xy = golfviewTools.toXY({ lat: userPosition.lat, lon: userPosition.lon }, hole.way[0]);
  userPosition.x = xy.x;
  userPosition.y = xy.y;
  userPosition.last_time = getTime();
  let newDistance = golfviewTools.distance(xy, hole.nodesXY[hole.nodesXY.length - 1]);
  newDistance = Math.round(newDistance * 1.093613); // yards
  // console.log(newDistance);
  layout.measyardage.label = (newDistance < 999) ? newDistance : '---';

  g.clear();
  layout.render();
}

Bangle.on('swipe', (direction) => {
  if (direction > 0) {
    currentHole -= 1;
  } else {
    currentHole += 1;
  }

  if (currentHole > numHoles) { currentHole = 1; }
  if (currentHole < 1) { currentHole = numHoles; }
  hole = course[currentHole.toString()];

  setHole(currentHole);
});

Bangle.on('GPS', (fix) => {
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(fix.lat)) return;
  // console.log(fix.hdop * 5); //precision
  userPosition.fix = true;
  userPosition.lat = fix.lat;
  userPosition.lon = fix.lon;
  updateDistanceToHole();

  g.clear();
  layout.render();
});

Bangle.setGPSPower(1);
setHole(currentHole);
// layout.debug();
