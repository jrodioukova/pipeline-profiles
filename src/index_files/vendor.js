import "leaflet/dist/leaflet.css";
import "leaflet/dist/images/marker-shadow.png"; // TODO: is this needed?
import * as L from "leaflet";
import Highcharts from "highcharts";
import MapModule from "highcharts/modules/map";
import HighchartsMore from "highcharts/highcharts-more";
import NoDataToDisplay from "highcharts/modules/no-data-to-display";

require("../css/main.css");

export function bindToWindow() {
  HighchartsMore(Highcharts);
  NoDataToDisplay(Highcharts);
  MapModule(Highcharts);
  window.L = L;
  window.Highcharts = Highcharts;
}
