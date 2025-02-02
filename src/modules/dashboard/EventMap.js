/**
 * @file Contains class definition for leaflet map portion of an event dashboard. Commonly used with an EventNavigator to update the map.
 *
 * The leaflet map has the following functionality:
 * - Locate events near the user.
 * - Switch between event frequency (same size bubbles) and "volume" (different bubble size).
 * - Switch between data "columns" when paired with an EventNavigator.
 * - Reset zoom.
 * - Dynamic tooltip displaying the currently selected, or default data column value.
 */

import { cerPalette, conversions, leafletBaseMap } from "../util";

const haversine = require("haversine");

const substanceState = {
  pro: "gas",
  ngsweet: "gas",
  fgas: "liquid",
  loil: "liquid",
  cosweet: "liquid",
  cosour: "liquid",
  sco: "liquid",
  diesel: "liquid",
  gas: "liquid",
  ngl: "gas",
  co: "liquid",
  Other: "other",
  Autre: "other",
};

/**
 * Class defining functionality for a leaflet map that can update colors, tooltip, show events close to user location, etc.
 */
export class EventMap {
  /**
   *
   * @param {Object} constr - EventMap constructor.
   * @param {string} constr.eventType - Short name for the dataset, eg: incidents (lowercase).
   * @param {(string|undefined)} [constr.field=undefined] - The initial data column to display on the map.
   * @param {(Object|undefined)} [constr.filters=undefined] - Initial data "values" to show eg: {type: "frequency"} or {type: "volume" }
   * @param {(number|undefined)} [constr.minRadius=undefined] - Minimum radius for leaflet map circles.
   * @param {string} [constr.divId="map"] - HTML div id where map will be loaded.
   * @param {number[]} [constr.initZoomTo=[55, -119]] - Set to the middle of Canada, just North of Winnipeg.
   * @param {Object} constr.lang - En/Fr language object from ./langEnglish.js or ./langFrench.js
   */
  constructor({
    eventType,
    field = undefined,
    filters = undefined,
    minRadius = undefined,
    divId = "map",
    initZoomTo = [55, -119],
    lang = {},
  }) {
    this.eventType = eventType;
    this.filters = filters;
    this.minRadius = minRadius;
    this.colors = lang.EVENTCOLORS;
    this.substanceState = substanceState;
    this.field = field;
    this.initZoomTo = initZoomTo;
    this.user = { latitude: undefined, longitude: undefined };
    this.divId = divId;
    this.lang = lang;
    this.mapDisclaimer = undefined;
    this.findPlotHeight();
  }

  findPlotHeight() {
    try {
      this.plotHeight = document.getElementById(this.divId).clientHeight;
    } catch (err) {
      this.plotHeight = 0;
    }
  }

  /**
   * Generate a blank leaflet base map using src/modules/util/leafletBaseMap() method.
   */
  addBaseMap() {
    this.map = leafletBaseMap({
      div: this.divId,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      zoomControl: true,
      initZoomTo: this.initZoomTo,
      initZoomLevel: 5,
      minZoom: 4,
    });
  }

  getState(substance) {
    const shortSubstance = substance.split("-")[0].trim();
    return this.substanceState[shortSubstance];
  }

  volumeText(m3, substance, gas = false, liquid = false, other = false) {
    const convLiquid = conversions["m3 to bbl"];
    const convGas = conversions["m3 to cf"];
    let state = "other";
    if (!gas && !liquid && !other) {
      state = this.getState(substance);
    } else if (!gas && liquid && !other) {
      state = "liquid";
    } else if (gas && !liquid && !other) {
      state = "gas";
    }

    if (state !== "other") {
      let imperial;
      if (state === "gas") {
        imperial = `${this.lang.numberFormat(m3 * convGas, 2)} ${this.lang.cf}`;
      } else {
        imperial = `${this.lang.numberFormat(m3 * convLiquid, 2)} ${
          this.lang.cf
        }`;
      }

      return `${imperial} (${Highcharts.numberFormat(
        m3,
        2,
        this.lang.decimal
      )} m3)`;
    }
    return `${Highcharts.numberFormat(m3, 2, this.lang.decimal)} m3`;
  }

  /**
   *
   * @param {string} type - Can be either "volume" or "location".
   * volume disclaimer toggles text explaining that bubble size doesnt correspond to event area.
   * location disclaimer toggles text indicating that location services are pending.
   */
  addMapDisclaimer(type = "volume") {
    const disclaimerL = (map, position, alertStyle, text) => {
      const info = L.control({ position });
      info.onAdd = function () {
        const disclaimerDiv = L.DomUtil.create("div", "map-disclaimer");
        disclaimerDiv.innerHTML = `<div class="alert ${alertStyle}" style="padding:3px; max-width:670px"><p>${text}</p></div>`;
        return disclaimerDiv;
      };
      info.addTo(map);
      return info;
    };
    if (type === "volume") {
      if (!this.mapVolumeDisclaimer) {
        this.mapVolumeDisclaimer = disclaimerL(
          this.map,
          "topright",
          "alert-warning",
          this.lang.volumeDisclaimer
        );
      }
    } else if (type === "location") {
      if (!this.mapLocationDisclaimer) {
        this.mapLocationDisclaimer = disclaimerL(
          this.map,
          "bottomleft",
          "alert-info",
          this.lang.locationDisclaimer
        );
      }
    }
  }

  removeMapDisclaimer(type = "volume") {
    if (type === "volume") {
      if (this.mapVolumeDisclaimer) {
        this.mapVolumeDisclaimer.remove();
        this.mapVolumeDisclaimer = undefined;
      }
    } else if (type === "location") {
      if (this.mapLocationDisclaimer) {
        this.mapLocationDisclaimer.remove();
        this.mapVolumeDisclaimer = undefined;
      }
    }
  }

  toolTip(incidentParams, fillColor) {
    const formatCommaList = (text, names) => {
      if (text.length > 1) {
        const itemList = text;
        let brokenText = ``;
        for (let i = 0; i < itemList.length; i += 1) {
          brokenText += `&nbsp- ${names[itemList[i]].n}<br>`;
        }
        return brokenText;
      }
      return `&nbsp${names[text].n}`;
    };

    const bubbleName = this.colors[this.field][incidentParams[this.field]].n;
    let toolTipText = `<div id="incident-tooltip"><p style="font-size:15px; font-family:Arial; text-align:center"><strong>${incidentParams.id}</strong></p>`;
    toolTipText += `<table>`;
    toolTipText += `<tr><td>${this.field}:</td><td style="color:${fillColor}">&nbsp<strong>${bubbleName}</strong></td></tr>`;
    toolTipText += `<tr><td>${
      this.lang.estRelease
    }</td><td>&nbsp<strong>${this.volumeText(
      incidentParams.vol,
      incidentParams.Substance
    )}</strong></td></tr>`;
    toolTipText += `<tr><td>${
      this.lang.what
    }?</td><td><strong>${formatCommaList(
      incidentParams.what,
      this.colors.what
    )}</strong></td></tr>`;
    toolTipText += `<tr><td>${this.lang.why}?</td><td><strong>${formatCommaList(
      incidentParams.why,
      this.colors.why
    )}</strong></td></tr>`;
    toolTipText += `</table></div>`;
    return toolTipText;
  }

  addCircle(x, y, color, fillColor, r, incidentParams = {}) {
    return L.circle([x, y], {
      color,
      fillColor,
      fillOpacity: 0.7,
      radius: this.minRadius,
      volRadius: r,
      weight: 1,
      incidentParams,
    });
  }

  /**
   * Looks at the current map zoom and divides or multiplies the circle radius to accomodate.
   * If this.filters.type is set to "volume", radius is set to "area".
   */
  updateRadius() {
    if (this.filters.type === "volume") {
      this.circles.eachLayer((layer) => {
        try {
          layer.setRadius(layer.options.volRadius);
        } catch (err) {
          layer.setRadius(0);
          console.log("Error setting new radius");
        }
      });
    } else {
      const currZoom = this.map.getZoom();
      const { minRadius } = this;
      if (currZoom >= 5 && currZoom <= 6.5) {
        this.circles.eachLayer((layer) => {
          layer.setRadius(minRadius);
        });
      } else if (currZoom <= 4.5) {
        this.circles.eachLayer((layer) => {
          layer.setRadius(minRadius * 2);
        });
      } else if (currZoom > 6.5) {
        let zoomFactor = currZoom - 6;
        if (currZoom > 11.5) {
          zoomFactor += 8;
        }
        if (zoomFactor < 2) {
          zoomFactor = 2;
        }
        this.circles.eachLayer((layer) => {
          layer.setRadius(minRadius / zoomFactor);
        });
      }
    }
  }

  applyColor(rowValue, field) {
    try {
      return this.colors[field][rowValue].c;
    } catch (err) {
      return undefined;
    }
  }

  /**
   *
   * @param {Object[]} data - JSON style array containing georeferenced "event" data.
   * Input data should have a format that follows this pattern:
   * [{
   *  id: string,
   *  Variable1: string,
   *  VariableN: string,
   *  Year: number
   *  lat long: [number, number]
   * }]
   */
  processEventsData(data) {
    const radiusCalc = (maxVolume) => {
      if (maxVolume > 500) {
        return 150000;
      }
      return 100000;
    };

    let years = []; // piggyback on data processing pass to get the year colors
    const colors = [
      cerPalette.Sun,
      "#022034",
      "#043454",
      "#043a5e",
      cerPalette["Night Sky"],
      "#1d5478",
      "#366687",
      "#507a96",
      "#698da5",
      "#82a0b4",
      "#9bb3c3",
      "#b4c6d2",
      "#cdd9e1",
      "#e6ecf0",
      "#ffffff",
    ];
    const volumes = data.map((row) => row.vol);
    const [maxVol, minVol] = [Math.max(...volumes), Math.min(...volumes)];
    const maxRad = radiusCalc(maxVol);
    const allCircles = data.map((row) => {
      years.push(row.Year);
      let radiusVol = (row.vol - minVol) / (maxVol - minVol);

      radiusVol = Math.sqrt(radiusVol / Math.PI) * maxRad + 1000;
      return this.addCircle(
        row["lat long"][0],
        row["lat long"][1],
        cerPalette["Cool Grey"],
        this.applyColor(row[this.field], this.field), // fillColor
        radiusVol,
        row
      );
    });
    years = years.filter((v, i, a) => a.indexOf(v) === i); // get unique years
    years = years.sort((a, b) => b - a);
    const yearColors = {};
    years.forEach((yr, i) => {
      yearColors[yr] = { c: colors[i], n: yr };
    });
    this.colors.Year = yearColors;
    this.circles = L.featureGroup(allCircles).addTo(this.map);
    const currentDashboard = this;
    this.map.on("zoom", () => {
      currentDashboard.updateRadius();
    });
  }

  async findUser() {
    return new Promise((resolve, reject) => {
      const currentDashboard = this;
      this.map
        .locate({
          // setView: true,
          watch: false,
        }) /* This will return map so you can do chaining */
        .on("locationfound", (e) => {
          const marker = L.marker([e.latitude, e.longitude], {
            draggable: true,
          }).bindPopup(currentDashboard.lang.userPopUp);
          marker.on("drag", (d) => {
            const position = d.target.getLatLng();
            currentDashboard.user.latitude = position.lat;
            currentDashboard.user.longitude = position.lng;
          });
          marker.id = "userLocation";
          currentDashboard.map.addLayer(marker);
          currentDashboard.user.latitude = e.latitude;
          currentDashboard.user.longitude = e.longitude;
          currentDashboard.user.layer = marker;
          resolve(currentDashboard);
        })
        .on("locationerror", (err) => {
          console.log("locationerror in findUser method");
          reject(err);
        });
    });
  }

  /**
   * Request user latitude and longitude prior to nearby analysis.
   * @returns {Promise} - Promise object resolved if user location is accepted. User lat/long is stored in EventMap.user.latitude & EventMap.user.longitude
   */
  async waitOnUser() {
    // this promise is handled one level above in ../indidents/incidentDashboard.js
    return this.findUser();
  }

  /**
   *
   * @param {number} range - User input range in kilometers (from range slider) to compare with distance between user and all events.
   */
  nearbyIncidents(range) {
    const [nearbyCircles, allCircles] = [[], []];
    const currentDashboard = this;
    this.circles.eachLayer((layer) => {
      allCircles.push(layer);
      const incLoc = layer._latlng;
      const distance = haversine(currentDashboard.user, {
        latitude: incLoc.lat,
        longitude: incLoc.lng,
      });
      if (distance > range) {
        layer.setStyle({ fillOpacity: 0 });
      } else {
        nearbyCircles.push(layer);
        layer.setStyle({ fillOpacity: 0.7 });
      }
    });
    const incidentFlag = document.getElementById("nearby-flag");

    const userDummy = L.circle([this.user.latitude, this.user.longitude], {
      color: undefined,
      fillColor: undefined,
      fillOpacity: 0,
      radius: 1,
      weight: 1,
    });
    userDummy.addTo(this.map);

    if (nearbyCircles.length > 0) {
      this.nearby = L.featureGroup(nearbyCircles);
      const bounds = this.nearby.getBounds();
      bounds.extend(userDummy.getBounds());
      this.map.fitBounds(bounds, { maxZoom: 15 });
      // loop through the nearbyCircles and get some summary stats:
      let [nearbyGas, nearbyLiquid, nearbyOther] = [0, 0, 0];
      // const currentDashboard = this;
      this.nearby.eachLayer((layer) => {
        const layerState = currentDashboard.getState(
          layer.options.incidentParams.Substance
        );
        if (layerState === "gas") {
          nearbyGas += layer.options.incidentParams.vol;
        } else if (layerState === "liquid") {
          nearbyLiquid += layer.options.incidentParams.vol;
        } else {
          nearbyOther += layer.options.incidentParams.vol;
        }
      });
      let nearbyText = `<section class="alert alert-info"><h4>${this.lang.nearbyHeader(
        nearbyCircles.length,
        range
      )}</h4><table>`;
      nearbyText += `<tr><td>
          ${this.lang.gasRelease}&nbsp&nbsp</td><td>${this.volumeText(
        nearbyGas,
        undefined,
        true
      )}`;
      nearbyText += `<tr><td>
        ${this.lang.liquidRelease}&nbsp&nbsp</td><td>${this.volumeText(
        nearbyLiquid,
        undefined,
        false,
        true
      )}`;
      nearbyText += `<tr><td>
        ${this.lang.otherRelease}&nbsp&nbsp</td><td>${this.volumeText(
        nearbyOther,
        undefined,
        false,
        true
      )}`;
      nearbyText += `</table><br><small>${this.lang.exploreOther}</small>
          </section>`;
      incidentFlag.innerHTML = nearbyText;
    } else {
      const userZoom = L.featureGroup(allCircles);
      const bounds = userZoom.getBounds();
      bounds.extend(userDummy.getBounds());
      this.map.fitBounds(bounds, { maxZoom: 15 });
      incidentFlag.innerHTML = `<section class="alert alert-warning">${this.lang.noNearby(
        this.eventType
      )}</section>`;
    }
  }

  reZoom() {
    const bounds = this.circles.getBounds();
    this.map.fitBounds(bounds);
  }

  /**
   * Reset bubble opacity to 0.7 and call this.reZoom()
   */
  resetMap() {
    this.circles.eachLayer((layer) => {
      layer.setStyle({ fillOpacity: 0.7 });
    });
    this.reZoom();
  }

  fieldChange(newField) {
    const newColors = this.colors[newField];

    this.field = newField;
    const currentDashboard = this;
    this.circles.eachLayer((layer) => {
      const newFill = newColors[layer.options.incidentParams[newField]].c;
      layer.setStyle({
        fillColor: newFill,
      });
      layer.bindTooltip(
        currentDashboard.toolTip(layer.options.incidentParams, newFill)
      );
    });
  }

  /**
   * Listens for a Window resize event, or top button navigation event so that invalidateSize() and reZoom() are called to ensure proper sizing.
   */
  lookForSize() {
    const currentDashboard = this;
    let resize = false;
    window.addEventListener("resize", () => {
      resize = true;
    });
    document
      .getElementById("safety-env-navigation")
      .addEventListener("click", () => {
        if (resize) {
          currentDashboard.map.invalidateSize(true);
          resize = false;
        } else {
          currentDashboard.map.invalidateSize(false);
        }
        currentDashboard.reZoom();
      });
  }
}
