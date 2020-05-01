// initialize our map
var map = L.map('map', {
  //center: [41.658939, -91.534605], //center map on Iowa City, IA
  //zoom: 10 //set the zoom level
});

//add esri topo basemap
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 18,
  minZoom: 10,
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
}).addTo(map);

//add a scale bar
L.control.scale({
  position: 'bottomleft'
}).addTo(map);

// Add functions to style the polygons by values
function getColor(d) {
  return d === '0.2 PCT ANNUAL CHANCE FLOOD HAZARD' ? '#edf8b1' :
    d === 'A' ? '#7fcdbb' :
    d === 'AE' ? '#2c7fb8' :
    'rgba(0,0,0,0.0)';
};

//load the data asynchronously
d3.queue()
  .defer(d3.json, 'data/Johnson_County.geojson') //the Johnson County layer
  .defer(d3.json, 'data/JC_Flood_Hazard_Area.json') //the Flood Risk layer
  .await(drawMap); //load the layers after the map loads

//provide instructions for drawing the map
function drawMap(err, jcCounty, floodRisk) {

  var county = L.geoJson(jcCounty, { //define layer with a variable

    style: function(feature) {

      var props = feature.properties;

      return {
        stroke: 1,
        color: "grey",
        weight: 1,
        fillColor: 'rgba(0,0,0,0.0)',
        fillOpacity: 0
      };
    }

  }).addTo(map); // add Johnson County layer and style

  var floods = L.geoJson(floodRisk, { //define layer with a variable

    style: function(feature) {
      var props = feature.properties;
      return {
        stroke: 1,
        color: "grey",
        weight: 1,
        fillColor: getColor(props.FLD_ZONE),
        fillOpacity: 0.5
      };
    },

    //restyle on mouseover, reset style on mouseout
    onEachFeature: function(feature, layer) {

      if (feature.properties.FLD_ZONE === "0.2 PCT ANNUAL CHANCE FLOOD HAZARD") {
        var floodProp = 'Areas of 500-year flood; areas of 100-year flood  with average depths of less than 1 foot or with drainage areas less than 1 square mile; and areas protected by levees from 100-year flood.  An area inundated by 0.2% annual chance flooding.'
      }
      if (feature.properties.FLD_ZONE === "A") {
        var floodProp = 'An area inundated by 1% annual chance flooding, for which no base flood elevations have been determined.'
      }
      if (feature.properties.FLD_ZONE === "AE") {
        var floodProp = 'An area inundated by 1% annual chance flooding, for which base flood elevations have been determined.'
      }

      // bind a popup window
      layer.bindPopup('<h4><b>Flood Zone: ' + feature.properties.FLD_ZONE + '</b><br><br>' + floodProp +
        '</h4>', {
          maxHeight: 300,
          minWidth: 250,
          maxWidth: 300,
        });

      // change layer style on mouseover
      layer.on("mouseover", function(e) {
        layer.setStyle({
          opacity: 0.75,
          fillOpacity: 0.75,
        }).bringToFront();
      });
      // reset style on mouseout
      layer.on("mouseout", function(e) {
        floods.resetStyle(e.target);
      });

    }

  }).addTo(map); // add the floods layer and style

  //fit the map to the extent of the county layer upon drawing
  map.fitBounds(county.getBounds());
  /*
    //define layers
    var overlays = {
      "Johnson County": county,
      "Flood Risk Areas": floods,
    };

    //send the layers to the layer control
    L.control.layers(null, overlays, {
      collapsed: false,
    }).addTo(map);
  */
  // create an info button to describe the map and supporting data
  var infoButton = L.easyButton({
    id: 'infoButton',
    position: 'topright',
    states: [{
      stateName: 'show-info',
      icon: '<strong>?</strong>',
      title: 'Tell me about this map',
      onClick: function(btn, map) {
        $("#dialog").dialog();
      }
    }]
  }).addTo(map);

  // create a legend
  var floodLegend = L.control({
    position: 'bottomright'
  });

  // add content to the legend
  floodLegend.onAdd = function(map) {

    var div = L.DomUtil.create('div', 'info legend'),
      grades = ['0.2 PCT ANNUAL CHANCE FLOOD HAZARD', 'A', 'AE'],
      regrades = ['0.2%', 'A (1.0%)', 'AE (1.0%)']
    labels = ["<h6 style='font-size:14px; font-weight:bold'>Flood Risk Classes</h6>"];

    // loop through the classes and generate a label with a colored square for each class
    for (var i = 0; i < grades.length; i++) {
      div.innerHTML +=
        labels.push('<i style="background:' + getColor(grades[i]) + '"></i> ' +
          (regrades[i]));
    }
    div.innerHTML = labels.join('<br>');
    return div;
  };

  floodLegend.addTo(map);

}; //end drawMap function
