// Crossfilter and jquery
import crossfilter from "crossfilter2";
import { ref, reactive } from "vue";

// dc.js
import * as d3 from "d3";
import * as dc from "dc";
import "dc/src/compat/d3v6.js";
import "dc/dist/style/dc.min.css";

// Leaflet and related
import L from "leaflet";
import "@asymmetrik/leaflet-d3/dist/leaflet-d3.min.js";

// ZIP codes
import zipCodes from "./zipCodes.js";

// Set color scheme
dc.config.defaultColors(d3.schemeCategory10);

// Whether to show reset all button
const showResetAllButton = ref(false);

// The map objects
let map = null;
let info = null;
let overlays = null;
let hexLayer = null;

// Reset flags for specific charts
const resetFlags = reactive({});

function getShowResetButton() {
  let charts = dc.chartRegistry.list();
  for (let i = 0; i < charts.length; i++) {
    if (charts[i].hasFilter()) return true;
  }
  return false;
}

function resetChart(id) {
  let charts = dc.chartRegistry.list();
  for (let i = 0; i < charts.length; i++) {
    if (charts[i].anchorName() == id) {
      charts[i].filterAll();
      dc.redrawAll();
      return;
    }
  }
}

// Update the dashboard
function updateDashboard(data) {
  // Initialize the map and set it up
  if (map === null) {
    map = L.map("map").setView([39.985, -75.165222], 11);

    // Load the base tile layer
    L.tileLayer(
      "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
        subdomains: "abcd",
        maxZoom: 18,
        minZoom: 10,
      }
    ).addTo(map);

    // Control that shows state info on hover
    info = L.control();

    // Create info div to show selected zip code
    info.onAdd = function (map) {
      this._div = L.DomUtil.create("div", "info");
      this.update();
      return this._div;
    };

    // Specify update for info legend
    info.update = function (props) {
      if (props) {
        this._div.style.visibility = "visible";
        this._div.innerHTML = "<h4>ZIP Code</h4>" + "<b>" + props.CODE + "</b>";
      } else {
        this._div.style.visibility = "hidden";
      }
    };
    info.addTo(map);

    // Overlays layer group will hold the hex bin layer
    overlays = L.layerGroup().addTo(map);

    // Initialize the hex bin layer
    hexLayer = L.hexbinLayer({ radius: 12, opacity: 0.8 }).hoverHandler(
      L.HexbinHoverHandler.compound({
        handlers: [L.HexbinHoverHandler.resizeFill(), tooltip()],
      })
    );

    let colorRange = [
      d3.interpolateReds(0.1),
      d3.interpolateReds(0.5),
      d3.interpolateReds(0.75),
      d3.interpolateReds(1),
    ];
    hexLayer.colorScale().range(colorRange);

    // Other hex layer options
    hexLayer
      .radiusRange([5, 12])
      .lng(function (d) {
        return d[0];
      })
      .lat(function (d) {
        return d[1];
      })
      .colorValue(function (d) {
        return d.length;
      })
      .radiusValue(function (d) {
        return d.length;
      });
  }

  // Initialize reset flags
  let chartIds = [
    "time-chart",
    "ticket-type-row-chart",
    "agency-row-chart",
    "day-hour-chart",
    "zipcode-row-chart",
  ];
  for (let i = 0; i < chartIds.length; i++) {
    resetFlags[chartIds[i]] = false;
  }

  // The tooltip for the map to show total count per hex bin
  function tooltip() {
    // Generate the tooltip
    let tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "hexbin-tooltip")
      .style("z-index", 9999)
      .style("pointer-events", "none")
      .style("visibility", "hidden")
      .style("position", "absolute");

    tooltip.append("div").attr("class", "tooltip-content");

    // Return the handler instance
    return {
      mouseover: function (event, data) {
        let gCoords = d3.pointer(this);
        tooltip.style("visibility", "visible").html("Count: " + data.length);

        tooltip
          .style("top", event.pageY + 10 + "px")
          .style("left", event.pageX + 10 + "px");
      },

      mouseout: function (event, data) {
        tooltip.style("visibility", "hidden").html();
      },
    };
  }

  // Add the hex bin layer to the map
  function addHexLayer(recordsJson) {
    // Get coordinate pairs for each record
    let coords = [];
    recordsJson.map((val, i) => {
      coords.push([val["longitude"], val["latitude"]]);
    });

    // Update the layer data
    hexLayer.data(coords);

    // Add to the overlay group
    hexLayer.addTo(overlays);
  }

  // Initialize the crossfilter
  let ndx = crossfilter(data);

  // Define Dimensions
  let dateDim = ndx.dimension(function (d) {
    return d["timestamp"];
  });
  let zipcodeDim = ndx.dimension(function (d) {
    return d["violation_location_zip"];
  });
  let descDim = ndx.dimension(function (d) {
    return d["violation_description"];
  });
  let dayhourDim = ndx.dimension(function (d) {
    return [d["dayofweek"], d["hour"]];
  });
  let agencyDim = ndx.dimension(function (d) {
    return d["issuing_agency"];
  });
  let latlngDim = ndx.dimension(function (d) {
    return [
      d["location"],
      d["violation_location_zip"],
      d["violation_description"],
    ];
  });
  let allDim = ndx.dimension(function (d) {
    return d;
  });

  // Group data
  let numRecordsByDate = dateDim.group();
  let zipcodeGroup = zipcodeDim.group();
  let agencyGroup = agencyDim.group();
  let descGroup = descDim.group();
  let dayhourGroup = dayhourDim.group().reduceCount();
  let latlngGroup = latlngDim.group().reduceCount();

  // Min and Max date for axis bounds
  let minDate = dateDim.bottom(1)[0]["timestamp"];
  let maxDate = dateDim.top(1)[0]["timestamp"];

  // Initialize charts
  let numberTicketsND = dc.numberDisplay("#number-records-nd");
  let numberRevenueND = dc.numberDisplay("#number-revenue-nd");

  // Count total records and total revenue
  let revenueGroup = ndx.groupAll().reduce(
    function (p, v) {
      ++p.n;
      p.tot += v.fine;
      return p;
    },
    function (p, v) {
      --p.n;
      p.tot -= v.fine;
      return p;
    },
    function () {
      return { n: 0, tot: 0 };
    }
  );

  // Keep track of the original ordering of row charts
  function save_first_order() {
    let original_value = {};
    return function (chart) {
      chart
        .group()
        .all()
        .forEach(function (kv) {
          original_value[kv.key] = kv.value;
        });
      chart.ordering(function (kv) {
        return -original_value[kv.key];
      });
    };
  }

  // Number of tickets number display
  numberTicketsND
    .formatNumber(d3.format(",d"))
    .valueAccessor((d) => d.n)
    .group(revenueGroup);

  // Total revenue number display
  numberRevenueND
    .formatNumber(d3.format("$,.0f"))
    .valueAccessor((d) => d.tot)
    .group(revenueGroup);

  // Get the other charts
  let zipcodeChart = dc.rowChart("#zipcode-row-chart");
  let descChart = dc.rowChart("#ticket-type-row-chart");
  let agencyChart = dc.rowChart("#agency-row-chart");
  let heatChart = dc.heatMap("#day-hour-chart");
  let timeChart = dc.barChart("#time-chart");
  let hotspotChart = dc.dataTable(".hot-spot-table");

  function reversible_group(group) {
    return {
      top: function (N) {
        return group.top(N);
      },
      bottom: function (N) {
        return group.top(Infinity).slice(-N).reverse();
      },
    };
  }

  // Bar chart to show number of tickets per hour
  timeChart
    .width(1250)
    .height(140)
    .margins({ top: 10, right: 10, bottom: 20, left: 30 })
    .dimension(dateDim)
    .group(numRecordsByDate)
    .transitionDuration(500)
    .x(d3.scaleTime().domain([minDate, maxDate]))
    .elasticY(true)
    .useViewBoxResizing(true)
    .on("filtered", function (chart) {
      // Update reset flags
      showResetAllButton.value = getShowResetButton();
      resetFlags[chart.anchorName()] = chart.hasFilter();

      // Update hex leayer
      addHexLayer(allDim.top(Infinity));
    })
    .yAxis()
    .ticks(4);

  // Table
  hotspotChart
    .width(100)
    .height(300)
    .dimension(reversible_group(latlngGroup))
    .size(10)
    .showSections(false)
    .section(function (d) {
      return [d.location, d.violation_location_zip, d.violation_description];
    })
    .columns([
      {
        label: "Location Block",
        format: function (d) {
          return d.key[0];
        },
      },
      {
        label: "ZIP Code",
        format: function (d) {
          return d.key[1];
        },
      },
      {
        label: "Ticket Type",
        format: function (d) {
          return d.key[2];
        },
      },
      {
        label: "Number of Tickets",
        format: function (d) {
          return d.value;
        },
      },
    ])
    .sortBy(function (d) {
      return d.value;
    })
    .order(d3.descending)
    .on("renderlet", (table) => {
      table.selectAll(".hot-spot-table").classed("info", true);
    });

  // Row chart by zip code
  zipcodeChart
    .width(35 * 7 + 80)
    .height(1000)
    .dimension(zipcodeDim)
    .group(zipcodeGroup)
    .margins({ bottom: 50, top: 10, left: 10, right: 10 })
    .colors(["#6baed6"])
    .elasticX(true)
    .useViewBoxResizing(true)
    .on("postRender", save_first_order())
    .on("filtered", function (chart) {
      // Update reset flags
      showResetAllButton.value = getShowResetButton();
      resetFlags[chart.anchorName()] = chart.hasFilter();

      // Update map hex layer
      addHexLayer(allDim.top(Infinity));
    })
    .xAxis()
    .ticks(4);

  // Heat map of hour vs day of week
  const daysOfWeek = ["Mon", "Tues", "Wed", "Thurs", "Fri", "Sat", "Sun"];
  heatChart
    .rowsLabel(function (d) {
      return d3.format("02d")(d) + ":00";
    })
    .colsLabel(function (d) {
      return ["M", "T", "W", "Th", "F", "Sat", "Sun"][+d];
    })
    .width(35 * 7 + 50)
    .height(1000)
    .dimension(dayhourDim)
    .group(dayhourGroup)
    .rowOrdering(d3.descending)
    .margins({ top: 10, right: 0, bottom: 30, left: 45 })
    .keyAccessor(function (d) {
      return +d.key[0];
    })
    .valueAccessor(function (d) {
      return +d.key[1];
    })
    .colorAccessor(function (d) {
      return +d.value;
    })
    .useViewBoxResizing(true)
    .on("filtered", function (chart) {
      // Update reset flags
      showResetAllButton.value = getShowResetButton();
      resetFlags[chart.anchorName()] = chart.hasFilter();

      // Update map hex layer
      addHexLayer(allDim.top(Infinity));
    })
    .title(function (d) {
      return (
        "Day:   " +
        daysOfWeek[+d.key[0]] +
        "\n" +
        "Hour:  " +
        d3.format("02d")(d.key[1]) +
        ":00" +
        "\n" +
        "Total: " +
        d.value
      );
    })
    .colors([
      "#0d0a29",
      "#271258",
      "#491078",
      "#671b80",
      "#862781",
      "#a6317d",
      "#c53c74",
      "#e34e65",
      "#f66c5c",
      "#fc9065",
      "#feb67c",
      "#fdda9c",
    ])
    .calculateColorDomain()
    .on("preRedraw", function () {
      heatChart.calculateColorDomain();
    });

  // Row chart showing type of agency
  agencyChart
    .width(250)
    .height(400)
    .dimension(agencyDim)
    .group(agencyGroup)
    .colors("#6baed6")
    .elasticX(false)
    .margins({ top: 10, right: 50, bottom: 50, left: 30 })
    .useViewBoxResizing(true)
    .on("postRender", save_first_order())
    .useViewBoxResizing(true)
    .on("filtered", function (chart) {
      // Update reset flags
      showResetAllButton.value = getShowResetButton();
      resetFlags[chart.anchorName()] = chart.hasFilter();

      // Update map hex layer
      addHexLayer(allDim.top(Infinity));
    });

  // set a log scale
  agencyChart.x(
    d3
      .scaleLog()
      .range([0, agencyChart.width() - 50])
      .nice()
      .clamp(true)
      .domain([0.5, 10 * ndx.size()])
  );
  agencyChart.xAxis().scale(agencyChart.x());

  // Row chart showing violation description
  descChart
    .width(250)
    .height(400)
    .dimension(descDim)
    .group(descGroup)
    .colors("#6baed6")
    .elasticX(true)
    .margins({ top: 10, right: 50, bottom: 50, left: 30 })
    .useViewBoxResizing(true)
    .on("postRender", save_first_order())
    .on("filtered", function (chart) {
      // Update reset flags
      showResetAllButton.value = getShowResetButton();
      resetFlags[chart.anchorName()] = chart.hasFilter();

      // Update map hex layer
      addHexLayer(allDim.top(Infinity));
      //toggleReset(chart, "desc-chart-reset");
    })
    .xAxis()
    .ticks(4);

  // Initialize the zip code json
  let geojson;

  // Style the map when selecting specific zip codes
  let highlightedStyle = {
    weight: 5,
    color: "#666",
    dashArray: "",
    opacity: 1,
    fillOpacity: 0,
  };
  let unhighlightedStyle = {
    weight: 1,
    opacity: 0.5,
    color: "#666",
    dashArray: "",
    fillOpacity: 0,
  };

  // create geo JSON from zip code data
  geojson = L.geoJson(zipCodes, {
    style: function (feature) {
      return unhighlightedStyle;
    },
  });

  // Set events
  geojson
    .addTo(map)
    .on("mouseover", function (event) {
      event.layer.setStyle(highlightedStyle);
      info.update(event.layer.feature.properties);
    })
    .on("mouseout", function (event) {
      event.layer.setStyle(unhighlightedStyle);
      info.update();
    });

  // Add map listener to highlight zip code
  map.on("mousemove", function (event) {
    let latlng = event.latlng;

    geojson.fireEvent("mouseout", {
      latlng: latlng,
      layerPoint: event.layerPoint,
      containerPoint: event.containerPoint,
      originalEvent: event.originalEvent,
      layer: geojson,
    });

    // Use Mapbox Leaflet PIP (point in polygon) library.
    let layers = leafletPip.pointInLayer(latlng, geojson);
    layers.forEach(function (layer) {
      geojson.fireEvent("mouseover", {
        latlng: latlng,
        layerPoint: event.layerPoint,
        containerPoint: event.containerPoint,
        originalEvent: event.originalEvent,
        layer: layer,
      });
    });
  });

  // Add map listener to filter based on clicked zip code on map
  map.on("click", function (event) {
    let clickedLayers = leafletPip.pointInLayer(event.latlng, geojson);
    clickedLayers.map((layer, i) => {
      let code = +layer.feature.properties.CODE;
      let filters = zipcodeChart.filters();
      if (filters.length == 0) {
        zipcodeChart.replaceFilter([[code]]);
      } else {
        let index = filters.indexOf(code);
        if (index == -1) {
          filters.push(code);
        } else {
          filters.splice(index, 1);
        }
        zipcodeChart.replaceFilter([filters]);
      }
      dc.redrawAll();
    });
  });

  // Track leaflet layer ID for each zip code
  let zipcodeToLayerID = {};
  geojson.eachLayer(function (layer) {
    zipcodeToLayerID[+layer.feature.properties.CODE] = layer._leaflet_id;
  });

  // Highlight map when mouse over zip code chart
  zipcodeChart.on("renderlet", function (chart) {
    chart
      .selectAll(`g.row`)
      .on("mouseover.highlighted-zip", function (event, d) {
        let layer = geojson.getLayer(zipcodeToLayerID[d.key]);
        layer.setStyle(highlightedStyle);
        info.update(layer.feature.properties);
      })
      .on("mouseout.highlighted-zip", function (event, d) {
        let layer = geojson.getLayer(zipcodeToLayerID[d.key]);
        layer.setStyle(unhighlightedStyle);
        info.update();
      });
  });

  // Add the hex bin layer to the map with currently filtered data
  addHexLayer(allDim.top(Infinity));

  // Render all charts
  dc.renderAll();

  function addXAxis(chartToUpdate, displayText, fs, dy) {
    chartToUpdate
      .svg()
      .append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", chartToUpdate.width() / 2)
      .attr("y", chartToUpdate.height() - chartToUpdate.margins().bottom + dy)
      .style("font-size", fs)
      .text(displayText);
  }

  // Add x axis labels
  addXAxis(zipcodeChart, "Number of Tickets", "1rem", 50);
  addXAxis(descChart, "Number of Tickets", "0.8rem", 40);
  addXAxis(agencyChart, "Number of Tickets", "0.8rem", 40);
}

export { updateDashboard, showResetAllButton, resetChart, resetFlags };
