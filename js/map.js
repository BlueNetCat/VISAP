// Popup piechart
import {PieChart} from './PieChart.js';
// Map Styles
import * as mapStyles from './MapStyles.js';
// Map Layers
import * as mapLayers from './MapLayers.js';

// https://github.com/cschwarz/wkx
// There was a redifinition of require, which caused errors with ArcGIS widget
var Buffer = require2('buffer').Buffer;
var wkx = require2('wkx');




let map = undefined;


// Attributions
const attributions = new ol.control.Attribution({
   collapsible: true
 });

// Mouse position
const mousePositionControl = new ol.control.MousePosition({
  coordinateFormat: (coord) => ol.coordinate.format(coord, '{x}º E / {y}º N', 2),//ol.coordinate.createStringXY(2),
  projection: 'EPSG:4326',
  className: 'custom-mouse-position', // Text style defined in CSS class outside
  target: document.getElementById('mouse-position'), // ALERT IF SEVERAL MAPS EXIST
  undefinedHTML: '&nbsp;', // What to show when mouse is out of map
});

// View
const mapView = new ol.View({
  center: ol.proj.fromLonLat([3,41.5]),
  zoom: 8,
  minZoom: 8,
  extent: ol.proj.fromLonLat([-2,39.5]).concat(ol.proj.fromLonLat([12, 50]))//extent: [-2849083.336923, 3025194.250092, 4931105.568733, 6502406.032920]//olProj.get("EPSG:3857").getExtent()
});

// Popup info overlay
let popupContainerEl; // ALERT IF SEVERAL MAPS EXIST
let popupContentEl;
let popupCloserEl;
let popupOverlay;




// Get track lines information
// Load and create pie chart
const getTrackLines = (address, staticFile) => {
  console.log("Getting data: " + address +", "+ staticFile +", ");
  // Try data from server
  fetch(address)
    .then(r => r.json())
    .then(r => {
      createTrackLines(r);
    })
    .catch(e => {
      if (staticFile !== undefined){ // Load static file
        console.error("Could not fetch from " + address + ". Error: " + e + ". Trying with static file.");
        window.serverConnection = false;
        getTrackLines(staticFile, undefined);
      } else {
        console.error("Could not fetch from " + address + ". Error: " + e + ".");
      }
    })
}


// Create trackLines GEOJSON object and add vector layer
const createTrackLines = (data)=>{
  let geoJSONData = {
    'type': 'FeatureCollection',
    'features': []
  };

  // For the timeSlider and selecting track lines
  let startDate = '2020-1-1';
  let endDate = '2020-12-31';
  for (let i = 0; i < data.length; i++){
    //https://github.com/cschwarz/wkx
    //Parsing a node Buffer containing a WKB object
    if (data[i].geom === null)
      continue;

    // Only data until end of 2020
    if (data[i].Data.split('-')[0] > "2020")
      continue;
    // Find earliest date
    if (startDate.split('-')[0] >= data[i].Data.split('-')[0]) {
      if (startDate.split('-')[1] >= data[i].Data.split('-')[1]) {
        if (startDate.split('-')[2] > data[i].Data.split('-')[2]) {
          startDate = data[i].Data;
    }}}


    let wkbBuffer = new Buffer(data[i].geom, 'hex');
    let geometry = wkx.Geometry.parse(wkbBuffer);
    let gJSON = geometry.toGeoJSON();
    delete data[i].geom; // delete geom, as we do not want it in the features
    // Create geoJSON
    let feature = {
      'type': 'Feature',
      'properties': {
        "id": data[i].Id,
        "info": data[i],
        "featType": "trackLine",
      },
      'geometry': gJSON,
    }

    geoJSONData.features.push(feature);
  }
  //console.log(JSON.stringify(geoJSONData)); // To write static file
  // Create URL
  let dataStr = JSON.stringify(geoJSONData);
  let dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  // Create layer
  let vectorTrackLines = new ol.layer.Vector({
    source: new ol.source.Vector({
      //features: new ol.format.GeoJSON().readFeatures(geoJSONData), // This is not working??? https://openlayers.org/en/latest/examples/geojson.html
      url: dataUri,//'data/trackLines.geojson',
      format: new ol.format.GeoJSON(),
    }),
    style: mapStyles.trackLineStyle,
  });

  // Remove 1 to month! https://www.w3schools.com/js/js_dates.asp
  let sDate = startDate.split('-');
  let eDate = endDate.split('-');
  sDate[1] -= 1;
  eDate[1] -= 1;
  var timeSlider = new TimeSliderArcGIS("trackLinesTimeslider", new Date(...sDate), new Date(...eDate),undefined);
  timeSlider.createTimeSlider();

  // Add layer to map
  map.addLayer(vectorTrackLines);
}

// Add map interaction for trackLine
// https://openlayers.org/en/latest/examples/popup.html
// https://openlayers.org/en/latest/examples/select-features.html
const selectInteraction = new ol.interaction.Select();
selectInteraction.on('select', (e) => {
  if (e.selected[0] === undefined)
    return false;

  // Track line is cliked
  if (e.selected[0].getProperties().featType == "trackLine"){
    trackLineClicked(e);
  }
  // Port is clicked
  else if (e.selected[0].getProperties().featType == "port") {
    portClicked(e);
  }

});

// When a track line is clicked
const trackLineClicked = (e) => {
  // Show pop-up
  //console.log(e.selected[0].getProperties().info);
  let info = e.selected[0].getProperties().info;
  // Create HTML
  let htmlInfo = "<ul>";
  for (let key in info)
    htmlInfo += "<li>" + key + ": "+ info[key] + "</li>";
  htmlInfo += "</ul>";
  popupContentEl.innerHTML = htmlInfo;
  popupOverlay.setPosition(e.mapBrowserEvent.coordinate);


  // Get data from server to create pie chart
  // var results = fetch("http://localhost:8080/haulSpecies?HaulId=" + haulId).then(r => r.json()).then(r => results = r).catch(e => console.log(e))
  let haulId = info.Id;
  if (window.serverConnection)
    getHaul("http://localhost:8080/haulSpecies?HaulId=" + haulId, 'data/hauls/' + haulId + '.json', info);
  else
    getHaul('data/hauls/' + haulId + '.json', undefined, info);
}

// Fetch haul data from server of static file
const getHaul = (address, staticFile, info) => {
  fetch(address).then(r => r.json()).then(r => {
    //console.log(r)
    // Create PieChart
    let pieChart = new PieChart();
    let preparedData = pieChart.processSample(r);
    pieChart.runApp(popupContentEl, preparedData, d3, info.Port + ", " + info.Data, "Biomassa", "kg / km2");

  }).catch(e => {
    if (staticFile !== undefined){ // Load static file
      console.error("Could not fetch from " + address + ". Error: " + e + ".");
      window.serverConnection = false;
      getHaul(staticFile, undefined, info);
    } else {
      console.error("Could not fetch from " + address + ". Error: " + e + ".");
    }
  })
};


// Port is clicked
const portClicked = (e) => {
  // Position popup
  popupContentEl.innerHTML = "";
  popupOverlay.setPosition(e.mapBrowserEvent.coordinate);

  let portName = e.selected[0].getProperties().name;

  // Get data and crete piechart
  if (window.serverConnection)
    getPortBiomass("http://localhost:8080/portBiomass", 'pesca_arrossegament_port_biomassa.json', portName);
  else
    getPortBiomass('data/pesca_arrossegament_port_biomassa.json', undefined, portName);

}

// Get biomass by port
const getPortBiomass = (address, staticFile, portName) => {
  fetch(address).then(r => r.json()).then(r => {
    //console.log(r)
    // Create PieChart
    let pieChart = new PieChart();
    let preparedData = pieChart.processPortBiomass(r, portName);
    pieChart.runApp(popupContentEl, preparedData, d3, portName, "Biomassa", "kg / km2");

  }).catch(e => {
    if (staticFile !== undefined){ // Load static file
      console.error("Could not fetch from " + address + ". Error: " + e + ".");
      window.serverConnection = false;
      getHaul(staticFile, undefined, portName);
    } else {
      console.error("Could not fetch from " + address + ". Error: " + e + ".");
    }
  })
}



export const startMap = () => {


  // Popup info overlay
  popupContainerEl = document.getElementById('popup'); // ALERT IF SEVERAL MAPS EXIST
  popupContentEl = popupContainerEl.querySelector('#popup-content');
  popupCloserEl = popupContainerEl.querySelector('#popup-closer');
  popupOverlay = new ol.Overlay({
    element: popupContainerEl,
    positioning: 'center-right',
    autoPan: true,
    autoPanAnimation: {
      duration: 250,
    },
  });
  //popupOverlay.setPositioning('center-center');
  popupCloserEl.onclick = function () {
    popupOverlay.setPosition(undefined);
    popupCloserEl.blur();
    return false;
  };



  // Map
  map = new ol.Map({
    target: 'map-container',
    //controls: ol.control.defaults().extend([mousePositionControl]),
    controls: ol.control.defaults({attributions: false}).extend([attributions, mousePositionControl]),
    layers: [
      mapLayers.bathymetryTileLayer,
      mapLayers.graticuleLayer,
      mapLayers.catCoastlineLayer,
      mapLayers.compCoastlineLayer,
      mapLayers.portsLayer
      //mapLayers.dischargePointsLayer
    ],
    overlays: [popupOverlay],
    view: mapView
  });




  if (window.serverConnection)
    getTrackLines('http://localhost:8080/trackLines', 'data/trackLines.json');
  else
    getTrackLines('data/trackLines.json', undefined);





  // Add interaction to map
  map.addInteraction(selectInteraction);


  // Interaction of moveover
  //let selectedTrack = null;
  map.on('pointermove', function (e) {
    // Reset style
    /*if (selectedTrack !== null && selectedTrack.getProperties().featType == "trackLine") {
      selectedTrack.setStyle(mapStyles.trackLineStyle);
      selectedTrack = null;
    }*/
    // Highlight style
    let hit = map.forEachFeatureAtPixel(e.pixel, function (f) {
      // Track line hovered
      /*if (f.getProperties().featType == "trackLine"){
        selectedTrack = f;
        f.setStyle(mapStyles.trackLineHighlightStyle);
      }
      // Port is hovered
      else {

      }*/
      // Track line is hovered
      if (f.getProperties().featType == "trackLine"){
        return true
      }
      // Port is hovered
      else if (f.getProperties().featType == "port") {
        return true
      } else {
        return false
      }

    });
    // Mouse pointer
    map.getTargetElement().style.cursor = hit ? 'pointer' : '';

  });

/*  const mapColor = new ol.Map({
    target: 'mapColor-container',
    controls: ol.control.defaults().extend([mousePositionControl]),
    layers: [
      portsLayer
    ],
    view: mapView
  })*/





  // Mouse hover/onclick
  // https://openlayers.org/en/latest/examples/select-features.html
/*  const selectHover = new ol.interaction.Select({
    condition: ol.events.condition.pointerMove
  });
  const selectClick = new ol.interaction.Select({
    condition: ol.events.condition.click
  })
  // https://openlayers.org/en/latest/examples/icon-negative.html
  mapColor.addInteraction(selectHover);
  selectHover.on('select', function(e){
    console.log(e.selected[0]);
  })
*/


/*
  // SVG FILTER
  let once = false;
  // Canvas 2D filter
  map.on('postrender', function(e){ // https://openlayers.org/en/latest/apidoc/module-ol_MapEvent-MapEvent.html#event:moveend
    if (!once){
      var ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
      ctx.filter = 'grayscale(100%) contrast(1.2) brightness(1.1) hue-rotate(-10deg)';
    }
  });*/
}

export default startMap;
