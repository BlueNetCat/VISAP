

// Graticule Layer style
// Text style of the map graticule
export const textStyleLat = new ol.style.Text({
  font: '12px Arial, Helvetica, sans-serif',
  textAlign: 'end',
  fill: new ol.style.Fill({
    color: 'rgba(0,0,0,0.9)',
  }),
  stroke: new ol.style.Stroke({
    color: 'rgba(255,255,255,0.5)',
    width: 3
  })
});
export const textStyleLon = textStyleLat.clone(true);
textStyleLon.setTextAlign('center');
textStyleLon.setTextBaseline('bottom');



// Catalunya coastline
// https://openlayers.org/en/latest/examples/geojson.html
// http://www.ign.es/web/ign/portal/ide-area-nodo-ide-ign
export const catCoastlineStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(0,0,0,1)',
    width: 1
  })
});


// European coastline complementary
// https://www.eea.europa.eu/data-and-maps/data/eea-coastline-for-analysis-1/gis-data/europe-coastline-shapefile
export const compCoastlineStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(0,0,0,0.6)',
    width: 1
  })
});




// Port labels trawling / arrossegament
export const portsTextStyle = textStyleLat.clone(true);
portsTextStyle.setTextAlign('right');
portsTextStyle.setOffsetX(-10);
export const portsStyle = new ol.style.Style({
  text: portsTextStyle,
  image: new ol.style.Circle({
    radius: 5,
    fill: new ol.style.Fill({color: 'rgba(255,255,255,0.6)'}),
    stroke: new ol.style.Stroke({color: 'rgba(0,0,0,0.8)', width: 1})
  })
});




// Track lines styles
export const trackLineStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(255,0,0,0.6)', // TODO: depening on the feature port
    width: 2,
  })
});
export const trackLineHighlightStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: 'rgba(255,0,0,0.9)', // TODO: depening on the feature port
    width: 8
  })
});
