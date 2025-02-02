import canadaMap from "../../../conditions/base_maps/base_map.json";
import conditionsData from "../../../conditions/company_data/fr/EnbridgePipelinesInc.json";
import incidentData from "../../../incidents/company_data/EnbridgePipelinesInc.json";
import trafficData from "../../../traffic/company_data/EnbridgePipelinesInc.json";
import apportionData from "../../../apportionment/company_data/EnbridgePipelinesInc.json";
import oandmData from "../../../oandm/company_data/EnbridgePipelinesInc.json";
import { loadAllCharts } from "../../loadDashboards_fr";

const data = {
  canadaMap,
  conditionsData,
  incidentData,
  oandmData,
  trafficData,
  apportionData,
};

loadAllCharts(data);
