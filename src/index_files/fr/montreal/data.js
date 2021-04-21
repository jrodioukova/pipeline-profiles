import canadaMap from "../../../conditions/base_maps/base_map.json";
import conditionsData from "../../../conditions/company_data/fr/MontrealPipeLineLimited.json";
import incidentData from "../../../incidents/company_data/fr/MontrealPipeLineLimited.json";
import trafficData from "../../../traffic/company_data/MontrealPipeLineLimited.json";
import apportionData from "../../../apportionment/company_data/MontrealPipeLineLimited.json";
import { loadAllCharts } from "../../loadDashboards_fr";

const data = {
  canadaMap,
  conditionsData,
  incidentData,
  trafficData,
  apportionData,
};

loadAllCharts(data);
