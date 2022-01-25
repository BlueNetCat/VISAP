// Map Styles
import * as mapStyles from './MapStyles.js';


// EMODNET Bathymetry
// https://tiles.emodnet-bathymetry.eu/
// https://portal.emodnet-bathymetry.eu/services/services.html
export const bathymetryTileLayer = new ol.layer.Tile({
  //preload: 15,
  source: new ol.source.XYZ ({ // https://openlayers.org/en/latest/examples/xyz.html
          url: 'https://tiles.emodnet-bathymetry.eu/2020/baselayer/web_mercator/{z}/{x}/{y}.png', // https://tiles.emodnet-bathymetry.eu/
          attributions: "© EMODnet Bathymetry Consortium (Basemap)",
        }),
});
// Avoids requesting the same tile constantly
// TODO: Check if this affects the peformance (maybe requires a lot of memory from the device?)
bathymetryTileLayer.getSource().tileCache.setSize(512);



// Graticule layer
// https://openlayers.org/en/latest/examples/graticule.html
// https://openlayers.org/en/latest/apidoc/module-ol_layer_Graticule-Graticule.html
export const graticuleLayer = new ol.layer.Graticule({
  // the style to use for the lines, optional.
  strokeStyle: new ol.style.Stroke({
    color: 'rgba(0,0,0,0.2)',
    width: 2,
    lineDash: [0.5, 4],
  }),
  showLabels: true,
  wrapX: false,
  latLabelStyle: mapStyles.textStyleLat,
  lonLabelStyle: mapStyles.textStyleLon,
});



export const catCoastlineLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/shoreline_cat.geojson',
    format: new ol.format.GeoJSON(),
    attributions: "© Instituto Geográfico Nacional (Catalan coastline)",
  }),
  style: mapStyles.catCoastlineStyle
});


export const compCoastlineLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'data/coastline_complementary_cat.geojson',
    format: new ol.format.GeoJSON(),
    attributions: "© European Environment Agency (european coastline)",
  }),
  style: mapStyles.compCoastlineStyle
});



export const portsLayer = new ol.layer.Vector({
 source: new ol.source.Vector({
   url: 'data/ports.geojson',
   format: new ol.format.GeoJSON()
 }),
 //declutter: true,
 style: function(feature) {
   let name = feature.get('name');
   mapStyles.portsStyle.getText().setText(name);
   let paletteColor = palette[name].color || [255,255,255];
   mapStyles.portsStyle.getText().getStroke().setColor('rgba('+paletteColor.toString()+', 0.3)');
   return mapStyles.portsStyle},
});


/*export const dischargePointsLayer = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'https://raw.githubusercontent.com/BlueNetCatAccio4/BlueNetCatAccio4.github.io/main/geoportal/data/discharge_urban_treatment_plants.geojson',
    format: new ol.format.GeoJSON()
  })
});*/
