import geographicService from "spinal-env-viewer-context-geographic-service";
import {
  dashboardVariables
} from "spinal-env-viewer-dashboard-standard-service";
import {
  SpinalBmsEndpoint,
  SpinalBmsDevice,
  SpinalBmsEndpointGroup,
  InputDataEndpointType
} from "spinal-model-bmsnetwork";
import {
  Ptr,
  Lst,
  spinalCore
} from "spinal-core-connectorjs_type";


const BIMOBJECT = geographicService.constants.EQUIPMENT_TYPE
const GEOGRAPHIC_RELATIONS = geographicService.constants.GEOGRAPHIC_RELATIONS;
const DASHBOARD_STANDARD_RELATION = dashboardVariables.ENDPOINT_RELATION_NAME;
const BIMOBJECT_ENDPOINTS = [
  "hasEndPoint",
  SpinalBmsDevice.relationName,
  SpinalBmsEndpoint.relationName,
  SpinalBmsEndpointGroup.relationName
];



export {
  BIMOBJECT,
  GEOGRAPHIC_RELATIONS,
  DASHBOARD_STANDARD_RELATION,
  BIMOBJECT_ENDPOINTS,
  SpinalBmsEndpoint,
  InputDataEndpointType,
  Ptr,
  spinalCore,
  Lst
}