import canadaMap from "../../../conditions/base_maps/base_map.json";
import conditionsData from "../../../conditions/company_data/fr/ManyIslandsPipeLines(Canada)Limited.json";
import incidentData from "../../../incidents/company_data/fr/ManyIslandsPipeLines(Canada)Limited.json";
import trafficData from "../../../traffic/company_data/ManyIslandsPipeLines(Canada)Limited.json";
import apportionData from "../../../apportionment/company_data/ManyIslandsPipeLines(Canada)Limited.json";
import { loadAllCharts } from "../../loadDashboards_fr";

const data = {
  canadaMap,
  conditionsData,
  incidentData,
  trafficData,
  apportionData,
};

loadAllCharts(data);
