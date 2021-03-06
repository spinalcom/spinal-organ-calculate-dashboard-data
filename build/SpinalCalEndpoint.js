"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _spinalCoreConnectorjs_type = require("spinal-core-connectorjs_type");

var _spinalModelTimeseries = require("spinal-model-timeseries");

var _spinalEnvViewerGraphService = require("spinal-env-viewer-graph-service");

const {
  dashboardVariables
} = require("spinal-env-viewer-dashboard-standard-service");

let spinalServiceTimeseries = new _spinalModelTimeseries.SpinalServiceTimeseries();

class SpinalCalEndpoint {
  constructor(node) {
    this.node = node;

    this.modelToBind = null;
    this.bindProcess = null;
  }

  bindEndpoint(callback) {
    this.node.element.load().then(element => {

      this.modelToBind = new _spinalCoreConnectorjs_type.Model({
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
    return this.node.info.dash_cal_rule ? this.node.info.dash_cal_rule.rule.get() : dashboardVariables.CALCULATION_RULES.average;
  }

  getReference() {
    return this.node.info.dash_cal_rule.ref.get();
  }

  setEndpoint(value, unit) {
    return this.node.element.load().then(element => {
      _spinalEnvViewerGraphService.SpinalGraphService._addNode(this.node);
      spinalServiceTimeseries.pushFromEndpoint(this.node.info.id.get(), value);
      element.currentValue.set(value);

      if (unit && element.unit) element.unit.set(unit);
    });
  }

  unbindEndpoint() {
    this.modelToBind.unbind(this.bindProcess);
  }
}
exports.default = SpinalCalEndpoint;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TcGluYWxDYWxFbmRwb2ludC5qcyJdLCJuYW1lcyI6WyJkYXNoYm9hcmRWYXJpYWJsZXMiLCJyZXF1aXJlIiwic3BpbmFsU2VydmljZVRpbWVzZXJpZXMiLCJTcGluYWxTZXJ2aWNlVGltZXNlcmllcyIsIlNwaW5hbENhbEVuZHBvaW50IiwiY29uc3RydWN0b3IiLCJub2RlIiwibW9kZWxUb0JpbmQiLCJiaW5kUHJvY2VzcyIsImJpbmRFbmRwb2ludCIsImNhbGxiYWNrIiwiZWxlbWVudCIsImxvYWQiLCJ0aGVuIiwiTW9kZWwiLCJpbmZvIiwidmFsdWUiLCJjdXJyZW50VmFsdWUiLCJiaW5kIiwiY2F0Y2giLCJjb25zb2xlIiwibG9nIiwiZ2V0Q3VycmVudFZhbHVlIiwiZ2V0IiwiZ2V0UnVsZSIsImRhc2hfY2FsX3J1bGUiLCJydWxlIiwiQ0FMQ1VMQVRJT05fUlVMRVMiLCJhdmVyYWdlIiwiZ2V0UmVmZXJlbmNlIiwicmVmIiwic2V0RW5kcG9pbnQiLCJ1bml0IiwiU3BpbmFsR3JhcGhTZXJ2aWNlIiwiX2FkZE5vZGUiLCJwdXNoRnJvbUVuZHBvaW50IiwiaWQiLCJzZXQiLCJ1bmJpbmRFbmRwb2ludCIsInVuYmluZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBUUE7O0FBR0E7O0FBUEEsTUFBTTtBQUNKQTtBQURJLElBRUZDLFFBQVEsOENBQVIsQ0FGSjs7QUFXQSxJQUFJQywwQkFBMEIsSUFBSUMsOENBQUosRUFBOUI7O0FBRWUsTUFBTUMsaUJBQU4sQ0FBd0I7QUFDckNDLGNBQVlDLElBQVosRUFBa0I7QUFDaEIsU0FBS0EsSUFBTCxHQUFZQSxJQUFaOztBQUVBLFNBQUtDLFdBQUwsR0FBbUIsSUFBbkI7QUFDQSxTQUFLQyxXQUFMLEdBQW1CLElBQW5CO0FBQ0Q7O0FBRURDLGVBQWFDLFFBQWIsRUFBdUI7QUFDckIsU0FBS0osSUFBTCxDQUFVSyxPQUFWLENBQWtCQyxJQUFsQixHQUF5QkMsSUFBekIsQ0FBOEJGLFdBQVc7O0FBRXZDLFdBQUtKLFdBQUwsR0FBbUIsSUFBSU8saUNBQUosQ0FBVTtBQUMzQkMsY0FBTSxLQUFLVCxJQUFMLENBQVVTLElBRFc7QUFFM0JDLGVBQU9MLFFBQVFNO0FBRlksT0FBVixDQUFuQjs7QUFLQSxXQUFLVCxXQUFMLEdBQW1CLEtBQUtELFdBQUwsQ0FBaUJXLElBQWpCLENBQXNCUixRQUF0QixDQUFuQjtBQUNELEtBUkQsRUFRR1MsS0FSSCxDQVFTLE1BQU07QUFDYkMsY0FBUUMsR0FBUixDQUFZLEtBQUtmLElBQWpCO0FBQ0QsS0FWRDtBQVdEOztBQUVEZ0Isb0JBQWtCO0FBQ2hCLFdBQU8sS0FBS2hCLElBQUwsQ0FBVUssT0FBVixDQUFrQkMsSUFBbEIsR0FBeUJDLElBQXpCLENBQThCRixXQUFXO0FBQzlDLGFBQU9BLFFBQVFNLFlBQVIsQ0FBcUJNLEdBQXJCLEVBQVA7QUFDRCxLQUZNLENBQVA7QUFHRDs7QUFFREMsWUFBVTtBQUNSLFdBQU8sS0FBS2xCLElBQUwsQ0FBVVMsSUFBVixDQUFlVSxhQUFmLEdBQ0wsS0FBS25CLElBQUwsQ0FBVVMsSUFBVixDQUFlVSxhQUFmLENBQTZCQyxJQUE3QixDQUFrQ0gsR0FBbEMsRUFESyxHQUVMdkIsbUJBQW1CMkIsaUJBQW5CLENBQXFDQyxPQUZ2QztBQUdEOztBQUVEQyxpQkFBZTtBQUNiLFdBQU8sS0FBS3ZCLElBQUwsQ0FBVVMsSUFBVixDQUFlVSxhQUFmLENBQTZCSyxHQUE3QixDQUFpQ1AsR0FBakMsRUFBUDtBQUNEOztBQUVEUSxjQUFZZixLQUFaLEVBQW1CZ0IsSUFBbkIsRUFBeUI7QUFDdkIsV0FBTyxLQUFLMUIsSUFBTCxDQUFVSyxPQUFWLENBQWtCQyxJQUFsQixHQUF5QkMsSUFBekIsQ0FBOEJGLFdBQVc7QUFDOUNzQixzREFBbUJDLFFBQW5CLENBQTRCLEtBQUs1QixJQUFqQztBQUNBSiw4QkFBd0JpQyxnQkFBeEIsQ0FBeUMsS0FBSzdCLElBQUwsQ0FBVVMsSUFBVixDQUFlcUIsRUFBZixDQUFrQmIsR0FBbEIsRUFBekMsRUFDRVAsS0FERjtBQUVBTCxjQUFRTSxZQUFSLENBQXFCb0IsR0FBckIsQ0FBeUJyQixLQUF6Qjs7QUFFQSxVQUFJZ0IsUUFBUXJCLFFBQVFxQixJQUFwQixFQUEwQnJCLFFBQVFxQixJQUFSLENBQWFLLEdBQWIsQ0FBaUJMLElBQWpCO0FBQzNCLEtBUE0sQ0FBUDtBQVFEOztBQUVETSxtQkFBaUI7QUFDZixTQUFLL0IsV0FBTCxDQUFpQmdDLE1BQWpCLENBQXdCLEtBQUsvQixXQUE3QjtBQUNEO0FBbkRvQztrQkFBbEJKLGlCIiwiZmlsZSI6IlNwaW5hbENhbEVuZHBvaW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgTW9kZWxcbn0gZnJvbSBcInNwaW5hbC1jb3JlLWNvbm5lY3RvcmpzX3R5cGVcIjtcblxuY29uc3Qge1xuICBkYXNoYm9hcmRWYXJpYWJsZXNcbn0gPSByZXF1aXJlKFwic3BpbmFsLWVudi12aWV3ZXItZGFzaGJvYXJkLXN0YW5kYXJkLXNlcnZpY2VcIik7XG5cbmltcG9ydCB7XG4gIFNwaW5hbFNlcnZpY2VUaW1lc2VyaWVzXG59IGZyb20gJ3NwaW5hbC1tb2RlbC10aW1lc2VyaWVzJztcbmltcG9ydCB7XG4gIFNwaW5hbEdyYXBoU2VydmljZVxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItZ3JhcGgtc2VydmljZVwiO1xuXG5sZXQgc3BpbmFsU2VydmljZVRpbWVzZXJpZXMgPSBuZXcgU3BpbmFsU2VydmljZVRpbWVzZXJpZXMoKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3BpbmFsQ2FsRW5kcG9pbnQge1xuICBjb25zdHJ1Y3Rvcihub2RlKSB7XG4gICAgdGhpcy5ub2RlID0gbm9kZTtcblxuICAgIHRoaXMubW9kZWxUb0JpbmQgPSBudWxsO1xuICAgIHRoaXMuYmluZFByb2Nlc3MgPSBudWxsO1xuICB9XG5cbiAgYmluZEVuZHBvaW50KGNhbGxiYWNrKSB7XG4gICAgdGhpcy5ub2RlLmVsZW1lbnQubG9hZCgpLnRoZW4oZWxlbWVudCA9PiB7XG5cbiAgICAgIHRoaXMubW9kZWxUb0JpbmQgPSBuZXcgTW9kZWwoe1xuICAgICAgICBpbmZvOiB0aGlzLm5vZGUuaW5mbyxcbiAgICAgICAgdmFsdWU6IGVsZW1lbnQuY3VycmVudFZhbHVlXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5iaW5kUHJvY2VzcyA9IHRoaXMubW9kZWxUb0JpbmQuYmluZChjYWxsYmFjayk7XG4gICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2codGhpcy5ub2RlKTtcbiAgICB9KTtcbiAgfVxuXG4gIGdldEN1cnJlbnRWYWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlLmVsZW1lbnQubG9hZCgpLnRoZW4oZWxlbWVudCA9PiB7XG4gICAgICByZXR1cm4gZWxlbWVudC5jdXJyZW50VmFsdWUuZ2V0KCk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRSdWxlKCkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuaW5mby5kYXNoX2NhbF9ydWxlID9cbiAgICAgIHRoaXMubm9kZS5pbmZvLmRhc2hfY2FsX3J1bGUucnVsZS5nZXQoKSA6XG4gICAgICBkYXNoYm9hcmRWYXJpYWJsZXMuQ0FMQ1VMQVRJT05fUlVMRVMuYXZlcmFnZTtcbiAgfVxuXG4gIGdldFJlZmVyZW5jZSgpIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlLmluZm8uZGFzaF9jYWxfcnVsZS5yZWYuZ2V0KCk7XG4gIH1cblxuICBzZXRFbmRwb2ludCh2YWx1ZSwgdW5pdCkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuZWxlbWVudC5sb2FkKCkudGhlbihlbGVtZW50ID0+IHtcbiAgICAgIFNwaW5hbEdyYXBoU2VydmljZS5fYWRkTm9kZSh0aGlzLm5vZGUpXG4gICAgICBzcGluYWxTZXJ2aWNlVGltZXNlcmllcy5wdXNoRnJvbUVuZHBvaW50KHRoaXMubm9kZS5pbmZvLmlkLmdldCgpLFxuICAgICAgICB2YWx1ZSk7XG4gICAgICBlbGVtZW50LmN1cnJlbnRWYWx1ZS5zZXQodmFsdWUpO1xuXG4gICAgICBpZiAodW5pdCAmJiBlbGVtZW50LnVuaXQpIGVsZW1lbnQudW5pdC5zZXQodW5pdClcbiAgICB9KTtcbiAgfVxuXG4gIHVuYmluZEVuZHBvaW50KCkge1xuICAgIHRoaXMubW9kZWxUb0JpbmQudW5iaW5kKHRoaXMuYmluZFByb2Nlc3MpO1xuICB9XG59Il19