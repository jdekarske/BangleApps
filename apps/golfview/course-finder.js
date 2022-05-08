const url = 'https://overpass-api.de/api/interpreter';
const searchURL = 'https://nominatim.openstreetmap.org/search';
let searchQuery = null;
const searchResults = $('#searchresults');
const courses = [];

function preprocessCoords(coordArray, origin) {
  const manyPoints = golfviewTools.arraytoXY(coordArray, origin);
  let lessPoints = simplify(manyPoints, 2, true); // from simplify-js

  // convert to int to save some memory
  lessPoints = lessPoints.map((pt) => ({ x: Math.round(pt.x), y: Math.round(pt.y) }));

  return lessPoints;
}

function processFeatures(courseVerbose) {
  const courseProcessed = {
    holes: {},
  };
  courseVerbose.forEach((element) => {
    if (element.tags.golf === 'hole') {
      // if we find a high-level hole feature
      // todo check if hole exists
      const currentHole = parseInt(element.tags.ref, 10);
      const tees = [];
      Object.keys(element.tags).forEach((key) => {
        if (key.includes('dist')) {
          tees.push(Math.round(element.tags[key]));
        }
      });
      const hole = {
        hole_number: currentHole,
        handicap: parseInt(element.tags.handicap, 10),
        par: parseInt(element.tags.par, 10),
        nodesXY: preprocessCoords(element.geometry, element.geometry[0]),
        tees: tees.sort(),
        way: element.geometry,
        features: [],
        angle: 0,
      };

      // TODO rotate hole here
      hole.angle = golfviewTools.angle(hole.nodesXY[0], hole.nodesXY[hole.nodesXY.length - 1]);
      courseProcessed.holes[currentHole.toString()] = hole;
    } else {
      if (!('ref' in element.tags)) return;
      if (element.type === 'relation') {
        element.members.forEach((member) => {
          if (member.role === 'outer') {
            Object.assign(element, { geometry: member.geometry });
          }
        });
      }
      // if we find a feature add it to the corresponding hole
      element.tags.ref.split(';').forEach((featureHole) => {
        const newFeature = {
          nodesXY: preprocessCoords(element.geometry, courseProcessed.holes[featureHole].way[0]),
          type: element.tags.golf,
          id: element.id,
        };
        courseProcessed.holes[featureHole].features.push(newFeature);
      });
    }
  });

  return courseProcessed;
}

// download info from the course
function doQuery(course) {
  const query = `[out:json][timeout:5];way(${course.osm_id});map_to_area ->.golfcourse;way["golf"="hole"](area.golfcourse)->.holes;(relation["golf"="fairway"](area.golfcourse);way["golf"~"^(green|tee|water_hazard|bunker|fairway)"](area.golfcourse);)->.features;.holes out geom;.features out geom;`;
  const courseID = course.osm_id;
  $.post(url, query, (result) => {
    if (result.elements.length === 0) {
      $('#status').text('Course not found!');
      return;
    }
    // console.log(result);
    const out = processFeatures(result.elements);
    // console.log(out);
    courses.push({
      name: `golf-${courseID}.json`,
      content: JSON.stringify(out),
    });
    $('#status').text('Course retrieved!');
    $('#upload').attr('disabled', false);
    $('#download').attr('disabled', false);
  });
}
function buildCourseListElement(title, subtitle, element) {
  const baseElement = $(`<div class="column col-4">
        <div class="tile">
          <div class="tile-icon">
            <figure class="avatar avatar-lg"><img src="./golfview.png" alt="Avatar"></figure>
          </div>
          <div class="tile-content">
            <p class="tile-title">${title}</p>
            <p class="tile-subtitle">${subtitle}</p>
            <div class="btn-group btn-group-block">
            </div>
          </div>
        </div>
      </div>`);

  // add the buttons
  baseElement.find('.btn-group')
    .append($('<button>').addClass('btn btn-primary').text('select')
      .on('click', () => {
        // console.log(element);
        doQuery(element);
      }))
    .append($('<a>').attr('href', `https://www.openstreetmap.org/${element.osm_type}/${element.osm_id}`).attr('target', '_blank')
      .append('<button>')
      .addClass('btn')
      .text('view'));
  return baseElement;
}

// download info from the course
function doSearch() {
  $.get(searchURL, searchQuery, (result) => {
    if (result.length === 0) {
      $('#status').text('Course not found!');
      return;
    }

    searchResults.empty();
    result.forEach((element) => {
      if (element.type !== 'golf_course') return;
      searchResults.append(buildCourseListElement(element.display_name.split(',')[0], element.display_name, element));
    });
  });
}

// set to member rather than defining in html
function courseSearch() {
  const inputVal = document.getElementById('courseID').value;
  searchQuery = {
    format: 'jsonv2',
    q: inputVal,
  };
  doSearch();
}

$('#upload').on('click', () => {
  sendCustomizedApp({
    storage: courses,
  });
});

$('#download').on('click', () => {
  golfviewTools.downloadObjectAsJSON(courses[0].content, 'golfcourse-download');
});

$('#searchButton').on('click', courseSearch);
