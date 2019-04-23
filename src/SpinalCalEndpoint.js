import {
  Model
} from "spinal-core-connectorjs_type";

const {
  dashboardVariables
} = require("spinal-env-viewer-dashboard-standard-service");

import {
  SpinalServiceTimeseries
} from 'spinal-model-timeseries';
import {
  SpinalGraphService
} from "spinal-env-viewer-graph-service";

let spinalServiceTimeseries = new SpinalServiceTimeseries();

export default class SpinalCalEndpoint {
  constructor(node) {
    this.node = node;

    this.modelToBind = null;
    this.bindProcess = null;
  }

  bindEndpoint(callback) {
    this.node.element.load().then(element => {

      this.modelToBind = new Model({
        info: this.node.info,
        value: element.currentValue
      });

      this.bindProcess = this.modelToBind.bind(callback);
    }).catch(() => {
      console.log(this.node);
    });
  }

  getCurrentValue() {
    return this.node.element.load().then(element => {
      return element.currentValue.get();
    });
  }

  getRule() {
    return this.node.info.dash_cal_rule ?
      this.node.info.dash_cal_rule.rule.get() :
      dashboardVariables.CALCULATION_RULES.average;
  }

  getReference() {
    return this.node.info.dash_cal_rule.ref.get();
  }

  setEndpoint(value, unit) {
    return this.node.element.load().then(element => {
      SpinalGraphService._addNode(this.node)
      spinalServiceTimeseries.pushFromEndpoint(this.node.info.id.get(),
        value);
      element.currentValue.set(value);

      if (unit && element.unit) element.unit.set(unit)
    });
  }

  unbindEndpoint() {
    this.modelToBind.unbind(this.bindProcess);
  }
}