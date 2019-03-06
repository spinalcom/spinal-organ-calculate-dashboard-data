"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _spinalCoreConnectorjs_type = require("spinal-core-connectorjs_type");

const {
  dashboardVariables
} = require("spinal-env-viewer-dashboard-standard-service");

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

  setEndpoint(value) {
    return this.node.element.load().then(element => {
      element.currentValue.set(value);
    });
  }

  unbindEndpoint() {
    this.modelToBind.unbind(this.bindProcess);
  }
}
exports.default = SpinalCalEndpoint;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TcGluYWxDYWxFbmRwb2ludC5qcyJdLCJuYW1lcyI6WyJkYXNoYm9hcmRWYXJpYWJsZXMiLCJyZXF1aXJlIiwiU3BpbmFsQ2FsRW5kcG9pbnQiLCJjb25zdHJ1Y3RvciIsIm5vZGUiLCJtb2RlbFRvQmluZCIsImJpbmRQcm9jZXNzIiwiYmluZEVuZHBvaW50IiwiY2FsbGJhY2siLCJlbGVtZW50IiwibG9hZCIsInRoZW4iLCJNb2RlbCIsImluZm8iLCJ2YWx1ZSIsImN1cnJlbnRWYWx1ZSIsImJpbmQiLCJnZXRDdXJyZW50VmFsdWUiLCJnZXQiLCJnZXRSdWxlIiwiZGFzaF9jYWxfcnVsZSIsInJ1bGUiLCJDQUxDVUxBVElPTl9SVUxFUyIsImF2ZXJhZ2UiLCJnZXRSZWZlcmVuY2UiLCJyZWYiLCJzZXRFbmRwb2ludCIsInNldCIsInVuYmluZEVuZHBvaW50IiwidW5iaW5kIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFJQSxNQUFNO0FBQ0pBO0FBREksSUFFRkMsUUFBUSw4Q0FBUixDQUZKOztBQUllLE1BQU1DLGlCQUFOLENBQXdCO0FBQ3JDQyxjQUFZQyxJQUFaLEVBQWtCO0FBQ2hCLFNBQUtBLElBQUwsR0FBWUEsSUFBWjs7QUFFQSxTQUFLQyxXQUFMLEdBQW1CLElBQW5CO0FBQ0EsU0FBS0MsV0FBTCxHQUFtQixJQUFuQjtBQUNEOztBQUVEQyxlQUFhQyxRQUFiLEVBQXVCO0FBQ3JCLFNBQUtKLElBQUwsQ0FBVUssT0FBVixDQUFrQkMsSUFBbEIsR0FBeUJDLElBQXpCLENBQThCRixXQUFXOztBQUV2QyxXQUFLSixXQUFMLEdBQW1CLElBQUlPLGlDQUFKLENBQVU7QUFDM0JDLGNBQU0sS0FBS1QsSUFBTCxDQUFVUyxJQURXO0FBRTNCQyxlQUFPTCxRQUFRTTtBQUZZLE9BQVYsQ0FBbkI7O0FBS0EsV0FBS1QsV0FBTCxHQUFtQixLQUFLRCxXQUFMLENBQWlCVyxJQUFqQixDQUFzQlIsUUFBdEIsQ0FBbkI7QUFDRCxLQVJEO0FBU0Q7O0FBRURTLG9CQUFrQjtBQUNoQixXQUFPLEtBQUtiLElBQUwsQ0FBVUssT0FBVixDQUFrQkMsSUFBbEIsR0FBeUJDLElBQXpCLENBQThCRixXQUFXO0FBQzlDLGFBQU9BLFFBQVFNLFlBQVIsQ0FBcUJHLEdBQXJCLEVBQVA7QUFDRCxLQUZNLENBQVA7QUFHRDs7QUFFREMsWUFBVTtBQUNSLFdBQU8sS0FBS2YsSUFBTCxDQUFVUyxJQUFWLENBQWVPLGFBQWYsR0FDTCxLQUFLaEIsSUFBTCxDQUFVUyxJQUFWLENBQWVPLGFBQWYsQ0FBNkJDLElBQTdCLENBQWtDSCxHQUFsQyxFQURLLEdBRUxsQixtQkFBbUJzQixpQkFBbkIsQ0FBcUNDLE9BRnZDO0FBR0Q7O0FBRURDLGlCQUFlO0FBQ2IsV0FBTyxLQUFLcEIsSUFBTCxDQUFVUyxJQUFWLENBQWVPLGFBQWYsQ0FBNkJLLEdBQTdCLENBQWlDUCxHQUFqQyxFQUFQO0FBQ0Q7O0FBRURRLGNBQVlaLEtBQVosRUFBbUI7QUFDakIsV0FBTyxLQUFLVixJQUFMLENBQVVLLE9BQVYsQ0FBa0JDLElBQWxCLEdBQXlCQyxJQUF6QixDQUE4QkYsV0FBVztBQUM5Q0EsY0FBUU0sWUFBUixDQUFxQlksR0FBckIsQ0FBeUJiLEtBQXpCO0FBQ0QsS0FGTSxDQUFQO0FBR0Q7O0FBRURjLG1CQUFpQjtBQUNmLFNBQUt2QixXQUFMLENBQWlCd0IsTUFBakIsQ0FBd0IsS0FBS3ZCLFdBQTdCO0FBQ0Q7QUE1Q29DO2tCQUFsQkosaUIiLCJmaWxlIjoiU3BpbmFsQ2FsRW5kcG9pbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBNb2RlbFxufSBmcm9tIFwic3BpbmFsLWNvcmUtY29ubmVjdG9yanNfdHlwZVwiO1xuXG5jb25zdCB7XG4gIGRhc2hib2FyZFZhcmlhYmxlc1xufSA9IHJlcXVpcmUoXCJzcGluYWwtZW52LXZpZXdlci1kYXNoYm9hcmQtc3RhbmRhcmQtc2VydmljZVwiKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3BpbmFsQ2FsRW5kcG9pbnQge1xuICBjb25zdHJ1Y3Rvcihub2RlKSB7XG4gICAgdGhpcy5ub2RlID0gbm9kZTtcblxuICAgIHRoaXMubW9kZWxUb0JpbmQgPSBudWxsO1xuICAgIHRoaXMuYmluZFByb2Nlc3MgPSBudWxsO1xuICB9XG5cbiAgYmluZEVuZHBvaW50KGNhbGxiYWNrKSB7XG4gICAgdGhpcy5ub2RlLmVsZW1lbnQubG9hZCgpLnRoZW4oZWxlbWVudCA9PiB7XG5cbiAgICAgIHRoaXMubW9kZWxUb0JpbmQgPSBuZXcgTW9kZWwoe1xuICAgICAgICBpbmZvOiB0aGlzLm5vZGUuaW5mbyxcbiAgICAgICAgdmFsdWU6IGVsZW1lbnQuY3VycmVudFZhbHVlXG4gICAgICB9KTtcblxuICAgICAgdGhpcy5iaW5kUHJvY2VzcyA9IHRoaXMubW9kZWxUb0JpbmQuYmluZChjYWxsYmFjayk7XG4gICAgfSk7XG4gIH1cblxuICBnZXRDdXJyZW50VmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZS5lbGVtZW50LmxvYWQoKS50aGVuKGVsZW1lbnQgPT4ge1xuICAgICAgcmV0dXJuIGVsZW1lbnQuY3VycmVudFZhbHVlLmdldCgpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0UnVsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlLmluZm8uZGFzaF9jYWxfcnVsZSA/XG4gICAgICB0aGlzLm5vZGUuaW5mby5kYXNoX2NhbF9ydWxlLnJ1bGUuZ2V0KCkgOlxuICAgICAgZGFzaGJvYXJkVmFyaWFibGVzLkNBTENVTEFUSU9OX1JVTEVTLmF2ZXJhZ2U7XG4gIH1cblxuICBnZXRSZWZlcmVuY2UoKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZS5pbmZvLmRhc2hfY2FsX3J1bGUucmVmLmdldCgpO1xuICB9XG5cbiAgc2V0RW5kcG9pbnQodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5ub2RlLmVsZW1lbnQubG9hZCgpLnRoZW4oZWxlbWVudCA9PiB7XG4gICAgICBlbGVtZW50LmN1cnJlbnRWYWx1ZS5zZXQodmFsdWUpO1xuICAgIH0pO1xuICB9XG5cbiAgdW5iaW5kRW5kcG9pbnQoKSB7XG4gICAgdGhpcy5tb2RlbFRvQmluZC51bmJpbmQodGhpcy5iaW5kUHJvY2Vzcyk7XG4gIH1cbn0iXX0=