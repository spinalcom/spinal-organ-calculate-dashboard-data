"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _spinalEnvViewerGraphService = require("spinal-env-viewer-graph-service");

var _constants = require("./constants");

var _SpinalCalEndpoint = require("./SpinalCalEndpoint");

var _SpinalCalEndpoint2 = _interopRequireDefault(_SpinalCalEndpoint);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const {
  dashboardVariables
} = require("spinal-env-viewer-dashboard-standard-service");

class SpinalCalNode {

  constructor(node) {
    this.node = node;
    this.binded = null;
    this.maped = new Map();
  }

  isBimObject() {
    return this.node.getType().get() === _constants.BIMOBJECT;
  }

  getParents() {
    let relationRefPromises = [];

    _constants.GEOGRAPHIC_RELATIONS.forEach(relation => {
      let relationList = this.node.parents[relation];

      if (relationList) {

        for (let i = 0; i < relationList.length; i++) {
          const ref = relationList[i];
          relationRefPromises.push(ref.load());
        }
      }
    });

    return Promise.all(relationRefPromises).then(refs => {

      let promises = [];

      refs.forEach(node => {
        promises.push(node.parent.load());
      });

      return Promise.all(promises).then(parents => {
        let p = [];
        parents.forEach(el => {
          if (el && !(el instanceof _spinalEnvViewerGraphService.SpinalContext)) {
            p.push(new SpinalCalNode(el));
          }
        });

        return p;
      });
    });
  }

  getEndpointNodeByType(endpointType) {

    let refId = this.getRef(endpointType);
    if (refId) {

      // Si la node a une reference
      let node = _spinalEnvViewerGraphService.SpinalGraphService.getRealNode(refId);

      if (node) {

        return Promise.resolve(new _SpinalCalEndpoint2.default(node));
      } else {

        return this.node.find(_constants.BIMOBJECT_ENDPOINTS, node => {
          return node.info.id.get() === refId;
        }).then(el => {
          if (el && el.length > 0) {
            return new _SpinalCalEndpoint2.default(el[0]);
          }
          return undefined;
        });
      }
    } else {

      // si la node n'a pas de reference
      if (this.isBimObject()) {
        //si le node est un bimObject

        return this.node.find(_constants.BIMOBJECT_ENDPOINTS, node => {
          return node.getType().get() === _constants.SpinalBmsEndpoint.nodeTypeName;
        }).then(spinalNodes => {

          let nodeElements = spinalNodes.map((() => {
            var _ref = _asyncToGenerator(function* (node) {
              return {
                node: node,
                element: yield node.getElement()
              };
            });

            return function (_x) {
              return _ref.apply(this, arguments);
            };
          })());

          return Promise.all(nodeElements).then(el => {
            for (let i = 0; i < el.length; i++) {
              const element = el[i];
              if (element.element.type.get() === endpointType) {
                this.setRef(endpointType, element.node.info.id.get());
                return new _SpinalCalEndpoint2.default(element.node);
              }
            }
            return undefined;
          });
        });
      } else {
        // si la node n'est pas un bimObject
        return this.node.getChildren([_constants.DASHBOARD_STANDARD_RELATION]).then(children => {

          let nodeElements = children.map((() => {
            var _ref2 = _asyncToGenerator(function* (node) {

              return {
                node: node,
                element: yield node.getElement()
              };
            });

            return function (_x2) {
              return _ref2.apply(this, arguments);
            };
          })());

          return Promise.all(nodeElements).then(el => {
            for (let i = 0; i < el.length; i++) {
              const element = el[i];
              if (element.element.type.get() === endpointType) {
                return new _SpinalCalEndpoint2.default(element.node);
              }
            }
            return undefined;
          });
        });
      }
    }
  }

  getRef(endpointType) {
    return this.node.info.reference && this.node.info.reference[endpointType] ? this.node.info.reference[endpointType].get() : undefined;
  }

  setRef(endpointType, value) {

    if (!this.node.info.reference) {
      this.node.info.add_attr({
        reference: {}
      });
    }

    if (!this.node.info.reference[endpointType]) {
      this.node.info.reference.add_attr(endpointType, value);
      return;
    }

    this.node.info.reference[endpointType].set(value);
    return;
  }

  bindChild(type, callback) {
    this.getEndpointNodeByType(type).then(endpointNode => {
      if (endpointNode) {
        let mapped = this.maped.get(type);

        if (mapped && mapped.node.info.id.get() !== endpointNode.node.info.id.get()) {
          mapped.unbindEndpoint();
        }

        this.maped.set(type, endpointNode);
        endpointNode.bindEndpoint(callback);
      }
    });
  }

  bind() {
    this.binded = this.node.info.bind(() => {
      for (let type in _constants.InputDataEndpointType) {
        if (isNaN(type) && type !== "Other") {
          this.bindChild(type, () => {
            this.calculateParent(type);
          });
        }
      }
    });
  }

  unbind() {
    this.node.info.unbind(this.binded);
  }

  getChildren() {
    return this.node.getChildren(_constants.GEOGRAPHIC_RELATIONS).then(res => {
      let children = [];
      res.forEach(child => {
        children.push(new SpinalCalNode(child));
      });
      return children;
    });
  }

  getChildrenEndpoints(type) {

    return this.getChildren().then(children => {
      let promises = [];
      children.forEach(element => {
        promises.push(element.getEndpointNodeByType(type));
      });

      return Promise.all(promises).then(childEndpoint => {

        let pro = childEndpoint.map(el => {
          if (el) {

            return el.getCurrentValue();
          }
          return;
        });

        return Promise.all(pro).then(values => {
          return values.filter(el => el !== undefined);
        });
      });
    });
  }

  getUnit(type) {
    return this.getChildren().then(children => {
      let promises = [];
      children.forEach(element => {
        promises.push(element.getEndpointNodeByType(type));
      });

      return Promise.all(promises).then(childEndpoint => {

        let pro = childEndpoint.map(el => {
          if (el) {
            return el.node.element.load();
          }
          return;
        });

        return Promise.all(pro).then(endpoints => {
          endpoints = endpoints.filter(el => typeof el !== "undefined");

          return endpoints.map(el => {
            return el.unit ? el.unit.get() : undefined;
          })[0];
        });
      });
    });
  }

  calculateParent(type) {

    this.getParents().then(parents => {
      parents.forEach(parent => {

        parent.getEndpointNodeByType(type).then((() => {
          var _ref3 = _asyncToGenerator(function* (parentEndpoint) {
            if (parentEndpoint) {

              let rule = parentEndpoint.getRule();

              if (rule !== dashboardVariables.CALCULATION_RULES.reference) {
                let values = yield parent.getChildrenEndpoints(type); // getChildren EndpointsValue and unit

                let unit = yield parent.getUnit(type);

                switch (rule) {
                  case dashboardVariables.CALCULATION_RULES.sum:
                    (function () {
                      let sum = values.reduce(function (a, b) {
                        return a + b;
                      }, 0);
                      parentEndpoint.setEndpoint(sum, unit).then(function () {
                        parent.calculateParent(type);
                      });
                    })();
                    break;
                  case dashboardVariables.CALCULATION_RULES.average:
                    (function () {
                      let sum = values.reduce(function (a, b) {
                        return a + b;
                      }, 0);
                      parentEndpoint.setEndpoint(sum / values.length, unit).then(function () {
                        parent.calculateParent(type);
                      });
                    })();
                    break;
                  case dashboardVariables.CALCULATION_RULES.max:
                    parentEndpoint.setEndpoint(Math.max(...values), unit).then(function () {
                      parent.calculateParent(type);
                    });
                    break;
                  case dashboardVariables.CALCULATION_RULES.min:
                    parentEndpoint.setEndpoint(Math.min(...values), unit).then(function () {
                      parent.calculateParent(type);
                    });
                    break;
                }
              } else {
                let id = parentEndpoint.getReference();
                parent.getChildren().then(function (el) {
                  let ref;
                  for (let i = 0; i < el.length; i++) {
                    const element = el[i];
                    if (element.node.info.id.get() == id) ref = element;
                  }

                  if (ref) {
                    ref.getEndpointNodeByType(type).then(function (endpointCalNode) {
                      if (endpointCalNode) {
                        endpointCalNode.getCurrentValue().then((() => {
                          var _ref4 = _asyncToGenerator(function* (value) {
                            let endpoint = yield endpointCalNode.node.element.load();
                            let unit = endpoint.unit ? endpoint.unit.get() : undefined;
                            parentEndpoint.setEndpoint(value, unit);
                          });

                          return function (_x4) {
                            return _ref4.apply(this, arguments);
                          };
                        })());
                      }
                    });
                  }
                });
              }
            }
          });

          return function (_x3) {
            return _ref3.apply(this, arguments);
          };
        })());
      });
    });
  }

}
exports.default = SpinalCalNode;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TcGluYWxDYWxOb2RlLmpzIl0sIm5hbWVzIjpbImRhc2hib2FyZFZhcmlhYmxlcyIsInJlcXVpcmUiLCJTcGluYWxDYWxOb2RlIiwiY29uc3RydWN0b3IiLCJub2RlIiwiYmluZGVkIiwibWFwZWQiLCJNYXAiLCJpc0JpbU9iamVjdCIsImdldFR5cGUiLCJnZXQiLCJCSU1PQkpFQ1QiLCJnZXRQYXJlbnRzIiwicmVsYXRpb25SZWZQcm9taXNlcyIsIkdFT0dSQVBISUNfUkVMQVRJT05TIiwiZm9yRWFjaCIsInJlbGF0aW9uIiwicmVsYXRpb25MaXN0IiwicGFyZW50cyIsImkiLCJsZW5ndGgiLCJyZWYiLCJwdXNoIiwibG9hZCIsIlByb21pc2UiLCJhbGwiLCJ0aGVuIiwicmVmcyIsInByb21pc2VzIiwicGFyZW50IiwicCIsImVsIiwiU3BpbmFsQ29udGV4dCIsImdldEVuZHBvaW50Tm9kZUJ5VHlwZSIsImVuZHBvaW50VHlwZSIsInJlZklkIiwiZ2V0UmVmIiwiU3BpbmFsR3JhcGhTZXJ2aWNlIiwiZ2V0UmVhbE5vZGUiLCJyZXNvbHZlIiwiU3BpbmFsQ2FsRW5kcG9pbnQiLCJmaW5kIiwiQklNT0JKRUNUX0VORFBPSU5UUyIsImluZm8iLCJpZCIsInVuZGVmaW5lZCIsIlNwaW5hbEJtc0VuZHBvaW50Iiwibm9kZVR5cGVOYW1lIiwic3BpbmFsTm9kZXMiLCJub2RlRWxlbWVudHMiLCJtYXAiLCJlbGVtZW50IiwiZ2V0RWxlbWVudCIsInR5cGUiLCJzZXRSZWYiLCJnZXRDaGlsZHJlbiIsIkRBU0hCT0FSRF9TVEFOREFSRF9SRUxBVElPTiIsImNoaWxkcmVuIiwicmVmZXJlbmNlIiwidmFsdWUiLCJhZGRfYXR0ciIsInNldCIsImJpbmRDaGlsZCIsImNhbGxiYWNrIiwiZW5kcG9pbnROb2RlIiwibWFwcGVkIiwidW5iaW5kRW5kcG9pbnQiLCJiaW5kRW5kcG9pbnQiLCJiaW5kIiwiSW5wdXREYXRhRW5kcG9pbnRUeXBlIiwiaXNOYU4iLCJjYWxjdWxhdGVQYXJlbnQiLCJ1bmJpbmQiLCJyZXMiLCJjaGlsZCIsImdldENoaWxkcmVuRW5kcG9pbnRzIiwiY2hpbGRFbmRwb2ludCIsInBybyIsImdldEN1cnJlbnRWYWx1ZSIsInZhbHVlcyIsImZpbHRlciIsImdldFVuaXQiLCJlbmRwb2ludHMiLCJ1bml0IiwicGFyZW50RW5kcG9pbnQiLCJydWxlIiwiZ2V0UnVsZSIsIkNBTENVTEFUSU9OX1JVTEVTIiwic3VtIiwicmVkdWNlIiwiYSIsImIiLCJzZXRFbmRwb2ludCIsImF2ZXJhZ2UiLCJtYXgiLCJNYXRoIiwibWluIiwiZ2V0UmVmZXJlbmNlIiwiZW5kcG9pbnRDYWxOb2RlIiwiZW5kcG9pbnQiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOztBQVNBOztBQVFBOzs7Ozs7OztBQVpBLE1BQU07QUFDSkE7QUFESSxJQUVGQyxRQUFRLDhDQUFSLENBRko7O0FBZ0JlLE1BQU1DLGFBQU4sQ0FBb0I7O0FBRWpDQyxjQUFZQyxJQUFaLEVBQWtCO0FBQ2hCLFNBQUtBLElBQUwsR0FBWUEsSUFBWjtBQUNBLFNBQUtDLE1BQUwsR0FBYyxJQUFkO0FBQ0EsU0FBS0MsS0FBTCxHQUFhLElBQUlDLEdBQUosRUFBYjtBQUNEOztBQUVEQyxnQkFBYztBQUNaLFdBQU8sS0FBS0osSUFBTCxDQUFVSyxPQUFWLEdBQW9CQyxHQUFwQixPQUE4QkMsb0JBQXJDO0FBQ0Q7O0FBRURDLGVBQWE7QUFDWCxRQUFJQyxzQkFBc0IsRUFBMUI7O0FBRUFDLG9DQUFxQkMsT0FBckIsQ0FBNkJDLFlBQVk7QUFDdkMsVUFBSUMsZUFBZSxLQUFLYixJQUFMLENBQVVjLE9BQVYsQ0FBa0JGLFFBQWxCLENBQW5COztBQUVBLFVBQUlDLFlBQUosRUFBa0I7O0FBRWhCLGFBQUssSUFBSUUsSUFBSSxDQUFiLEVBQWdCQSxJQUFJRixhQUFhRyxNQUFqQyxFQUF5Q0QsR0FBekMsRUFBOEM7QUFDNUMsZ0JBQU1FLE1BQU1KLGFBQWFFLENBQWIsQ0FBWjtBQUNBTiw4QkFBb0JTLElBQXBCLENB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LElBQWIsQ0FBa0JDLEVBQWxCLENBQXFCbEMsR0FBckIsTUFBOEJrQyxFQUFsQyxFQUNFdkIsTUFDQThCLE9BREE7QUFFSDs7QUFFRCxzQkFBSTlCLEdBQUosRUFBUztBQUNQQSx3QkFBSVkscUJBQUosQ0FBMEJvQixJQUExQixFQUFnQzNCLElBQWhDLENBQ0UsMkJBQW1CO0FBQ2pCLDBCQUFJd0UsZUFBSixFQUFxQjtBQUNuQkEsd0NBQWdCcEIsZUFBaEIsR0FDR3BELElBREg7QUFBQSx3REFFSSxXQUFNaUMsS0FBTixFQUFlO0FBQ2IsZ0NBQUl3QyxXQUNGLE1BQU1ELGdCQUNMOUYsSUFESyxDQUNBK0MsT0FEQSxDQUNRNUIsSUFEUixFQURSO0FBR0EsZ0NBQUk0RCxPQUFPZ0IsU0FBU2hCLElBQVQsR0FDVGdCLFNBQVNoQixJQUFULENBQWN6RSxHQUFkLEVBRFMsR0FFVG1DLFNBRkY7QUFHQXVDLDJDQUNHUSxXQURILENBRUlqQyxLQUZKLEVBRVd3QixJQUZYO0FBR0QsMkJBWkw7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFhRDtBQUNGLHFCQWpCSDtBQWtCRDtBQUVGLGlCQTlCRDtBQStCRDtBQUVGO0FBQ0YsV0E5Rkg7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFnR0QsT0FsR0Q7QUFtR0QsS0FwR0Q7QUFxR0Q7O0FBalhnQztrQkFBZGpGLGEiLCJmaWxlIjoiU3BpbmFsQ2FsTm9kZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFNwaW5hbEdyYXBoU2VydmljZSxcbiAgU3BpbmFsQ29udGV4dFxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItZ3JhcGgtc2VydmljZVwiO1xuXG5jb25zdCB7XG4gIGRhc2hib2FyZFZhcmlhYmxlc1xufSA9IHJlcXVpcmUoXCJzcGluYWwtZW52LXZpZXdlci1kYXNoYm9hcmQtc3RhbmRhcmQtc2VydmljZVwiKTtcblxuaW1wb3J0IHtcbiAgU3BpbmFsQm1zRW5kcG9pbnQsXG4gIEJJTU9CSkVDVCxcbiAgR0VPR1JBUEhJQ19SRUxBVElPTlMsXG4gIERBU0hCT0FSRF9TVEFOREFSRF9SRUxBVElPTixcbiAgQklNT0JKRUNUX0VORFBPSU5UUyxcbiAgSW5wdXREYXRhRW5kcG9pbnRUeXBlXG59IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IFNwaW5hbENhbEVuZHBvaW50IGZyb20gXCIuL1NwaW5hbENhbEVuZHBvaW50XCI7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGluYWxDYWxOb2RlIHtcblxuICBjb25zdHJ1Y3Rvcihub2RlKSB7XG4gICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICB0aGlzLmJpbmRlZCA9IG51bGw7XG4gICAgdGhpcy5tYXBlZCA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIGlzQmltT2JqZWN0KCkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0VHlwZSgpLmdldCgpID09PSBCSU1PQkpFQ1Q7XG4gIH1cblxuICBnZXRQYXJlbnRzKCkge1xuICAgIGxldCByZWxhdGlvblJlZlByb21pc2VzID0gW107XG5cbiAgICBHRU9HUkFQSElDX1JFTEFUSU9OUy5mb3JFYWNoKHJlbGF0aW9uID0+IHtcbiAgICAgIGxldCByZWxhdGlvbkxpc3QgPSB0aGlzLm5vZGUucGFyZW50c1tyZWxhdGlvbl07XG5cbiAgICAgIGlmIChyZWxhdGlvbkxpc3QpIHtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbGF0aW9uTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHJlZiA9IHJlbGF0aW9uTGlzdFtpXTtcbiAgICAgICAgICByZWxhdGlvblJlZlByb21pc2VzLnB1c2gocmVmLmxvYWQoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHJlbGF0aW9uUmVmUHJvbWlzZXMpLnRoZW4ocmVmcyA9PiB7XG5cbiAgICAgIGxldCBwcm9taXNlcyA9IFtdO1xuXG4gICAgICByZWZzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIHByb21pc2VzLnB1c2gobm9kZS5wYXJlbnQubG9hZCgpKTtcbiAgICAgIH0pXG5cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHBhcmVudHMgPT4ge1xuICAgICAgICBsZXQgcCA9IFtdO1xuICAgICAgICBwYXJlbnRzLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgIGlmIChlbCAmJiAhKGVsIGluc3RhbmNlb2YgU3BpbmFsQ29udGV4dCkpIHtcbiAgICAgICAgICAgIHAucHVzaChuZXcgU3BpbmFsQ2FsTm9kZShlbCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gcDtcbiAgICAgIH0pO1xuXG4gICAgfSlcblxuICB9XG5cbiAgZ2V0RW5kcG9pbnROb2RlQnlUeXBlKGVuZHBvaW50VHlwZSkge1xuXG4gICAgbGV0IHJlZklkID0gdGhpcy5nZXRSZWYoZW5kcG9pbnRUeXBlKTtcbiAgICBpZiAocmVmSWQpIHtcblxuICAgICAgLy8gU2kgbGEgbm9kZSBhIHVuZSByZWZlcmVuY2VcbiAgICAgIGxldCBub2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKHJlZklkKTtcblxuICAgICAgaWYgKG5vZGUpIHtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBTcGluYWxDYWxFbmRwb2ludChub2RlKSk7XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuZmluZChCSU1PQkpFQ1RfRU5EUE9JTlRTLCAobm9kZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBub2RlLmluZm8uaWQuZ2V0KCkgPT09IHJlZklkO1xuICAgICAgICB9KS50aGVuKGVsID0+IHtcbiAgICAgICAgICBpZiAoZWwgJiYgZWwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTcGluYWxDYWxFbmRwb2ludChlbFswXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICAgICAgfSlcblxuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gc2kgbGEgbm9kZSBuJ2EgcGFzIGRlIHJlZmVyZW5jZVxuICAgICAgaWYgKHRoaXMuaXNCaW1PYmplY3QoKSkge1xuICAgICAgICAvL3NpIGxlIG5vZGUgZXN0IHVuIGJpbU9iamVjdFxuXG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuZmluZChCSU1PQkpFQ1RfRU5EUE9JTlRTLCAobm9kZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBub2RlLmdldFR5cGUoKS5nZXQoKSA9PT0gU3BpbmFsQm1zRW5kcG9pbnQubm9kZVR5cGVOYW1lO1xuICAgICAgICB9KS50aGVuKHNwaW5hbE5vZGVzID0+IHtcblxuICAgICAgICAgIGxldCBub2RlRWxlbWVudHMgPSBzcGluYWxOb2Rlcy5tYXAoYXN5bmMgKG5vZGUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICAgIGVsZW1lbnQ6IGF3YWl0IG5vZGUuZ2V0RWxlbWVudCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKG5vZGVFbGVtZW50cykudGhlbihlbCA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBlbFtpXTtcbiAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuZWxlbWVudC50eXBlLmdldCgpID09PSBlbmRwb2ludFR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFJlZihlbmRwb2ludFR5cGUsIGVsZW1lbnQubm9kZS5pbmZvLmlkLmdldCgpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNwaW5hbENhbEVuZHBvaW50KGVsZW1lbnQubm9kZSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzaSBsYSBub2RlIG4nZXN0IHBhcyB1biBiaW1PYmplY3RcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5nZXRDaGlsZHJlbihbREFTSEJPQVJEX1NUQU5EQVJEX1JFTEFUSU9OXSkudGhlbihcbiAgICAgICAgICBjaGlsZHJlbiA9PiB7XG5cbiAgICAgICAgICAgIGxldCBub2RlRWxlbWVudHMgPSBjaGlsZHJlbi5tYXAoYXN5bmMgKG5vZGUpID0+IHtcblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogYXdhaXQgbm9kZS5nZXRFbGVtZW50KClcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKG5vZGVFbGVtZW50cykudGhlbihlbCA9PiB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gZWxbaV07XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuZWxlbWVudC50eXBlLmdldCgpID09PSBlbmRwb2ludFR5cGUpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3BpbmFsQ2FsRW5kcG9pbnQoZWxlbWVudC5ub2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0UmVmKGVuZHBvaW50VHlwZSkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuaW5mby5yZWZlcmVuY2UgJiYgdGhpcy5ub2RlLmluZm8ucmVmZXJlbmNlW1xuICAgICAgICBlbmRwb2ludFR5cGVdID9cbiAgICAgIHRoaXMubm9kZS5pbmZvLnJlZmVyZW5jZVtlbmRwb2ludFR5cGVdLmdldCgpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHNldFJlZihlbmRwb2ludFR5cGUsIHZhbHVlKSB7XG5cbiAgICBpZiAoIXRoaXMubm9kZS5pbmZvLnJlZmVyZW5jZSkge1xuICAgICAgdGhpcy5ub2RlLmluZm8uYWRkX2F0dHIoe1xuICAgICAgICByZWZlcmVuY2U6IHt9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMubm9kZS5pbmZvLnJlZmVyZW5jZVtlbmRwb2ludFR5cGVdKSB7XG4gICAgICB0aGlzLm5vZGUuaW5mby5yZWZlcmVuY2UuYWRkX2F0dHIoZW5kcG9pbnRUeXBlLCB2YWx1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5ub2RlLmluZm8ucmVmZXJlbmNlW2VuZHBvaW50VHlwZV0uc2V0KHZhbHVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBiaW5kQ2hpbGQodHlwZSwgY2FsbGJhY2spIHtcbiAgICB0aGlzLmdldEVuZHBvaW50Tm9kZUJ5VHlwZSh0eXBlKS50aGVuKGVuZHBvaW50Tm9kZSA9PiB7XG4gICAgICBpZiAoZW5kcG9pbnROb2RlKSB7XG4gICAgICAgIGxldCBtYXBwZWQgPSB0aGlzLm1hcGVkLmdldCh0eXBlKTtcblxuICAgICAgICBpZiAobWFwcGVkICYmIG1hcHBlZC5ub2RlLmluZm8uaWQuZ2V0KCkgIT09IGVuZHBvaW50Tm9kZS5ub2RlXG4gICAgICAgICAgLmluZm8uaWQuZ2V0KCkpIHtcbiAgICAgICAgICBtYXBwZWQudW5iaW5kRW5kcG9pbnQoKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdGhpcy5tYXBlZC5zZXQodHlwZSwgZW5kcG9pbnROb2RlKTtcbiAgICAgICAgZW5kcG9pbnROb2RlLmJpbmRFbmRwb2ludChjYWxsYmFjayk7XG4gICAgICB9XG5cbiAgICB9KVxuICB9XG5cbiAgYmluZCgpIHtcbiAgICB0aGlzLmJpbmRlZCA9IHRoaXMubm9kZS5pbmZvLmJpbmQoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgdHlwZSBpbiBJbnB1dERhdGFFbmRwb2ludFR5cGUpIHtcbiAgICAgICAgaWYgKGlzTmFOKHR5cGUpICYmIHR5cGUgIT09IFwiT3RoZXJcIikge1xuICAgICAgICAgIHRoaXMuYmluZENoaWxkKHR5cGUsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlUGFyZW50KHR5cGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cblxuICB1bmJpbmQoKSB7XG4gICAgdGhpcy5ub2RlLmluZm8udW5iaW5kKHRoaXMuYmluZGVkKTtcbiAgfVxuXG4gIGdldENoaWxkcmVuKCkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0Q2hpbGRyZW4oR0VPR1JBUEhJQ19SRUxBVElPTlMpLnRoZW4ocmVzID0+IHtcbiAgICAgIGxldCBjaGlsZHJlbiA9IFtdO1xuICAgICAgcmVzLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBTcGluYWxDYWxOb2RlKGNoaWxkKSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjaGlsZHJlbjtcbiAgICB9KVxuICB9XG5cbiAgZ2V0Q2hpbGRyZW5FbmRwb2ludHModHlwZSkge1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2hpbGRyZW4oKS50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgIGxldCBwcm9taXNlcyA9IFtdO1xuICAgICAgY2hpbGRyZW4uZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChlbGVtZW50LmdldEVuZHBvaW50Tm9kZUJ5VHlwZSh0eXBlKSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGNoaWxkRW5kcG9pbnQgPT4ge1xuXG4gICAgICAgIGxldCBwcm8gPSBjaGlsZEVuZHBvaW50Lm1hcChlbCA9PiB7XG4gICAgICAgICAgaWYgKGVsKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBlbC5nZXRDdXJyZW50VmFsdWUoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvKS50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlcy5maWx0ZXIoZWwgPT4gZWwgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIH0pXG5cbiAgICAgIH0pXG5cbiAgICB9KVxuICB9XG5cblxuICBnZXRVbml0KHR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDaGlsZHJlbigpLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgbGV0IHByb21pc2VzID0gW107XG4gICAgICBjaGlsZHJlbi5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBwcm9taXNlcy5wdXNoKGVsZW1lbnQuZ2V0RW5kcG9pbnROb2RlQnlUeXBlKHR5cGUpKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oY2hpbGRFbmRwb2ludCA9PiB7XG5cbiAgICAgICAgbGV0IHBybyA9IGNoaWxkRW5kcG9pbnQubWFwKGVsID0+IHtcbiAgICAgICAgICBpZiAoZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBlbC5ub2RlLmVsZW1lbnQubG9hZCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm8pLnRoZW4oZW5kcG9pbnRzID0+IHtcbiAgICAgICAgICBlbmRwb2ludHMgPSBlbmRwb2ludHMuZmlsdGVyKGVsID0+IHR5cGVvZiBlbCAhPT1cbiAgICAgICAgICAgIFwidW5kZWZpbmVkXCIpXG5cbiAgICAgICAgICByZXR1cm4gZW5kcG9pbnRzLm1hcChlbCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gZWwudW5pdCA/IGVsLnVuaXQuZ2V0KCkgOiB1bmRlZmluZWRcbiAgICAgICAgICB9KVswXTtcbiAgICAgICAgfSlcblxuICAgICAgfSlcblxuICAgIH0pXG4gIH1cblxuXG4gIGNhbGN1bGF0ZVBhcmVudCh0eXBlKSB7XG5cbiAgICB0aGlzLmdldFBhcmVudHMoKS50aGVuKHBhcmVudHMgPT4ge1xuICAgICAgcGFyZW50cy5mb3JFYWNoKHBhcmVudCA9PiB7XG5cbiAgICAgICAgcGFyZW50LmdldEVuZHBvaW50Tm9kZUJ5VHlwZSh0eXBlKS50aGVuKFxuICAgICAgICAgIGFzeW5jIHBhcmVudEVuZHBvaW50ID0+IHtcbiAgICAgICAgICAgIGlmIChwYXJlbnRFbmRwb2ludCkge1xuXG4gICAgICAgICAgICAgIGxldCBydWxlID0gcGFyZW50RW5kcG9pbnQuZ2V0UnVsZSgpO1xuXG4gICAgICAgICAgICAgIGlmIChydWxlICE9PSBkYXNoYm9hcmRWYXJpYWJsZXMuQ0FMQ1VMQVRJT05fUlVMRVNcbiAgICAgICAgICAgICAgICAucmVmZXJlbmNlKSB7XG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlcyA9IGF3YWl0IHBhcmVudC5nZXRDaGlsZHJlbkVuZHBvaW50cyhcbiAgICAgICAgICAgICAgICAgIHR5cGUpOyAvLyBnZXRDaGlsZHJlbiBFbmRwb2ludHNWYWx1ZSBhbmQgdW5pdFxuXG4gICAgICAgICAgICAgICAgbGV0IHVuaXQgPSBhd2FpdCBwYXJlbnQuZ2V0VW5pdCh0eXBlKVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChydWxlKSB7XG4gICAgICAgICAgICAgICAgICBjYXNlIGRhc2hib2FyZFZhcmlhYmxlcy5DQUxDVUxBVElPTl9SVUxFUy5zdW06XG4gICAgICAgICAgICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgbGV0IHN1bSA9IHZhbHVlcy5yZWR1Y2UoKGEsXG4gICAgICAgICAgICAgICAgICAgICAgICBiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYSArIGI7XG4gICAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgICAgICAgcGFyZW50RW5kcG9pbnQuc2V0RW5kcG9pbnQoc3VtLCB1bml0KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuY2FsY3VsYXRlUGFyZW50KHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgY2FzZSBkYXNoYm9hcmRWYXJpYWJsZXMuQ0FMQ1VMQVRJT05fUlVMRVNcbiAgICAgICAgICAgICAgICAgIC5hdmVyYWdlOlxuICAgICAgICAgICAgICAgICAgICAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGxldCBzdW0gPSB2YWx1ZXMucmVkdWNlKChhLFxuICAgICAgICAgICAgICAgICAgICAgICAgYikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEgKyBiO1xuICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudEVuZHBvaW50LnNldEVuZHBvaW50KHN1bSAvIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAubGVuZ3RoLCB1bml0KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuY2FsY3VsYXRlUGFyZW50KHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIGNhc2UgZGFzaGJvYXJkVmFyaWFibGVzLkNBTENVTEFUSU9OX1JVTEVTLm1heDpcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50RW5kcG9pbnQuc2V0RW5kcG9pbnQoTWF0aC5tYXgoLi4uXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXMpLCB1bml0KVxuICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5jYWxjdWxhdGVQYXJlbnQodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICBjYXNlIGRhc2hib2FyZFZhcmlhYmxlcy5DQUxDVUxBVElPTl9SVUxFUy5taW46XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudEVuZHBvaW50LnNldEVuZHBvaW50KE1hdGgubWluKC4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzKSwgdW5pdClcbiAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuY2FsY3VsYXRlUGFyZW50KHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgaWQgPSBwYXJlbnRFbmRwb2ludC5nZXRSZWZlcmVuY2UoKTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuZ2V0Q2hpbGRyZW4oKS50aGVuKGVsID0+IHtcbiAgICAgICAgICAgICAgICAgIGxldCByZWY7XG4gICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBlbFtpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQubm9kZS5pbmZvLmlkLmdldCgpID09IGlkKVxuICAgICAgICAgICAgICAgICAgICAgIHJlZiA9XG4gICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKHJlZikge1xuICAgICAgICAgICAgICAgICAgICByZWYuZ2V0RW5kcG9pbnROb2RlQnlUeXBlKHR5cGUpLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnRDYWxOb2RlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRwb2ludENhbE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnRDYWxOb2RlLmdldEN1cnJlbnRWYWx1ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luYyB2YWx1ZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbmRwb2ludCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgZW5kcG9pbnRDYWxOb2RlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm5vZGUuZWxlbWVudC5sb2FkKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB1bml0ID0gZW5kcG9pbnQudW5pdCA/XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnQudW5pdC5nZXQoKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudEVuZHBvaW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldEVuZHBvaW50KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUsIHVuaXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcblxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cblxufSJdfQ==