"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _spinalEnvViewerGraphService = require("spinal-env-viewer-graph-service");

var _constants = require("./constants");

var _SpinalCalEndpoint = require("./SpinalCalEndpoint");

var _SpinalCalEndpoint2 = _interopRequireDefault(_SpinalCalEndpoint);

var _assert = require("assert");

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

  calculateParent(type) {

    this.getParents().then(parents => {
      parents.forEach(parent => {

        parent.getEndpointNodeByType(type).then((() => {
          var _ref3 = _asyncToGenerator(function* (parentEndpoint) {
            if (parentEndpoint) {

              let rule = parentEndpoint.getRule();

              if (rule !== dashboardVariables.CALCULATION_RULES.reference) {
                let values = yield parent.getChildrenEndpoints(type);
                switch (rule) {
                  case dashboardVariables.CALCULATION_RULES.sum:
                    (function () {
                      let sum = values.reduce(function (a, b) {
                        return a + b;
                      }, 0);
                      parentEndpoint.setEndpoint(sum).then(function () {
                        parent.calculateParent(type);
                      });
                    })();
                    break;
                  case dashboardVariables.CALCULATION_RULES.average:
                    (function () {
                      let sum = values.reduce(function (a, b) {
                        return a + b;
                      }, 0);
                      parentEndpoint.setEndpoint(sum / values.length).then(function () {
                        parent.calculateParent(type);
                      });
                    })();
                    break;
                  case dashboardVariables.CALCULATION_RULES.max:
                    parentEndpoint.setEndpoint(Math.max(...values)).then(function () {
                      parent.calculateParent(type);
                    });
                    break;
                  case dashboardVariables.CALCULATION_RULES.min:
                    parentEndpoint.setEndpoint(Math.min(...values)).then(function () {
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
                    ref.getEndpointNodeByType(type).then(function (endpoint) {
                      if (endpoint) {
                        endpoint.getCurrentValue().then(function (value) {
                          parentEndpoint.setEndpoint(value);
                        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TcGluYWxDYWxOb2RlLmpzIl0sIm5hbWVzIjpbImRhc2hib2FyZFZhcmlhYmxlcyIsInJlcXVpcmUiLCJTcGluYWxDYWxOb2RlIiwiY29uc3RydWN0b3IiLCJub2RlIiwiYmluZGVkIiwibWFwZWQiLCJNYXAiLCJpc0JpbU9iamVjdCIsImdldFR5cGUiLCJnZXQiLCJCSU1PQkpFQ1QiLCJnZXRQYXJlbnRzIiwicmVsYXRpb25SZWZQcm9taXNlcyIsIkdFT0dSQVBISUNfUkVMQVRJT05TIiwiZm9yRWFjaCIsInJlbGF0aW9uIiwicmVsYXRpb25MaXN0IiwicGFyZW50cyIsImkiLCJsZW5ndGgiLCJyZWYiLCJwdXNoIiwibG9hZCIsIlByb21pc2UiLCJhbGwiLCJ0aGVuIiwicmVmcyIsInByb21pc2VzIiwicGFyZW50IiwicCIsImVsIiwiU3BpbmFsQ29udGV4dCIsImdldEVuZHBvaW50Tm9kZUJ5VHlwZSIsImVuZHBvaW50VHlwZSIsInJlZklkIiwiZ2V0UmVmIiwiU3BpbmFsR3JhcGhTZXJ2aWNlIiwiZ2V0UmVhbE5vZGUiLCJyZXNvbHZlIiwiU3BpbmFsQ2FsRW5kcG9pbnQiLCJmaW5kIiwiQklNT0JKRUNUX0VORFBPSU5UUyIsImluZm8iLCJpZCIsInVuZGVmaW5lZCIsIlNwaW5hbEJtc0VuZHBvaW50Iiwibm9kZVR5cGVOYW1lIiwic3BpbmFsTm9kZXMiLCJub2RlRWxlbWVudHMiLCJtYXAiLCJlbGVtZW50IiwiZ2V0RWxlbWVudCIsInR5cGUiLCJzZXRSZWYiLCJnZXRDaGlsZHJlbiIsIkRBU0hCT0FSRF9TVEFOREFSRF9SRUxBVElPTiIsImNoaWxkcmVuIiwicmVmZXJlbmNlIiwidmFsdWUiLCJhZGRfYXR0ciIsInNldCIsImJpbmRDaGlsZCIsImNhbGxiYWNrIiwiZW5kcG9pbnROb2RlIiwibWFwcGVkIiwidW5iaW5kRW5kcG9pbnQiLCJiaW5kRW5kcG9pbnQiLCJiaW5kIiwiSW5wdXREYXRhRW5kcG9pbnRUeXBlIiwiaXNOYU4iLCJjYWxjdWxhdGVQYXJlbnQiLCJ1bmJpbmQiLCJyZXMiLCJjaGlsZCIsImdldENoaWxkcmVuRW5kcG9pbnRzIiwiY2hpbGRFbmRwb2ludCIsInBybyIsImdldEN1cnJlbnRWYWx1ZSIsInZhbHVlcyIsImZpbHRlciIsInBhcmVudEVuZHBvaW50IiwicnVsZSIsImdldFJ1bGUiLCJDQUxDVUxBVElPTl9SVUxFUyIsInN1bSIsInJlZHVjZSIsImEiLCJiIiwic2V0RW5kcG9pbnQiLCJhdmVyYWdlIiwibWF4IiwiTWF0aCIsIm1pbiIsImdldFJlZmVyZW5jZSIsImVuZHBvaW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFTQTs7QUFRQTs7OztBQUNBOzs7Ozs7QUFiQSxNQUFNO0FBQ0pBO0FBREksSUFFRkMsUUFBUSw4Q0FBUixDQUZKOztBQW1CZSxNQUFNQyxhQUFOLENBQW9COztBQUVqQ0MsY0FBWUMsSUFBWixFQUFrQjtBQUNoQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxNQUFMLEdBQWMsSUFBZDtBQUNBLFNBQUtDLEtBQUwsR0FBYSxJQUFJQyxHQUFKLEVBQWI7QUFDRDs7QUFFREMsZ0JBQWM7QUFDWixXQUFPLEtBQUtKLElBQUwsQ0FBVUssT0FBVixHQUFvQkMsR0FBcEIsT0FBOEJDLG9CQUFyQztBQUNEOztBQUVEQyxlQUFhO0FBQ1gsUUFBSUMsc0JBQXNCLEVBQTFCOztBQUVBQyxvQ0FBcUJDLE9BQXJCLENBQTZCQyxZQUFZO0FBQ3ZDLFVBQUlDLGVBQWUsS0FBS2IsSUFBTCxDQUFVYyxPQUFWLENBQWtCRixRQUFsQixDQUFuQjs7QUFFQSxVQUFJQyxZQUFKLEVBQWtCOztBQUVoQixhQUFLLElBQUlFLElBQUksQ0FBYixFQUFnQkEsSUFBSUYsYUFBYUcsTUFBakMsRUFBeUNELEdBQXpDLEVBQThDO0FBQzVDLGdCQUFNRSxNQUFNSixhQUFhRSxDQUFiLENBQVo7QUFDQU4sOEJBQW9CUyxJQUFwQixDQUF5QkQsSUFBSUUsSUFBSixFQUF6QjtBQUNEO0FBQ0Y7QUFFRixLQVhE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QUFRL0MsSUFBUixDQUFhdUMsSUFBYixDQUFrQkMsRUFBbEIsQ0FBcUJsQyxHQUFyQixNQUE4QmtDLEVBQWxDLEVBQXNDdkIsTUFDcEM4QixPQURvQztBQUV2Qzs7QUFFRCxzQkFBSTlCLEdBQUosRUFBUztBQUNQQSx3QkFBSVkscUJBQUosQ0FBMEJvQixJQUExQixFQUFnQzNCLElBQWhDLENBQ0Usb0JBQVk7QUFDViwwQkFBSXFFLFFBQUosRUFBYztBQUNaQSxpQ0FBU2pCLGVBQVQsR0FBMkJwRCxJQUEzQixDQUNFLGlCQUFTO0FBQ1B1RCx5Q0FBZVEsV0FBZixDQUNFOUIsS0FERjtBQUVELHlCQUpIO0FBS0Q7QUFDRixxQkFUSDtBQVVEO0FBRUYsaUJBckJEO0FBc0JEO0FBRUY7QUFDRixXQXpFRDs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQTJFRCxPQTdFRDtBQThFRCxLQS9FRDtBQWdGRDs7QUE1VGdDO2tCQUFkekQsYSIsImZpbGUiOiJTcGluYWxDYWxOb2RlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgU3BpbmFsR3JhcGhTZXJ2aWNlLFxuICBTcGluYWxDb250ZXh0XG59IGZyb20gXCJzcGluYWwtZW52LXZpZXdlci1ncmFwaC1zZXJ2aWNlXCI7XG5cbmNvbnN0IHtcbiAgZGFzaGJvYXJkVmFyaWFibGVzXG59ID0gcmVxdWlyZShcInNwaW5hbC1lbnYtdmlld2VyLWRhc2hib2FyZC1zdGFuZGFyZC1zZXJ2aWNlXCIpO1xuXG5pbXBvcnQge1xuICBTcGluYWxCbXNFbmRwb2ludCxcbiAgQklNT0JKRUNULFxuICBHRU9HUkFQSElDX1JFTEFUSU9OUyxcbiAgREFTSEJPQVJEX1NUQU5EQVJEX1JFTEFUSU9OLFxuICBCSU1PQkpFQ1RfRU5EUE9JTlRTLFxuICBJbnB1dERhdGFFbmRwb2ludFR5cGVcbn0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQgU3BpbmFsQ2FsRW5kcG9pbnQgZnJvbSBcIi4vU3BpbmFsQ2FsRW5kcG9pbnRcIjtcbmltcG9ydCB7XG4gIGRlZXBFcXVhbFxufSBmcm9tIFwiYXNzZXJ0XCI7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGluYWxDYWxOb2RlIHtcblxuICBjb25zdHJ1Y3Rvcihub2RlKSB7XG4gICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICB0aGlzLmJpbmRlZCA9IG51bGw7XG4gICAgdGhpcy5tYXBlZCA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIGlzQmltT2JqZWN0KCkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0VHlwZSgpLmdldCgpID09PSBCSU1PQkpFQ1Q7XG4gIH1cblxuICBnZXRQYXJlbnRzKCkge1xuICAgIGxldCByZWxhdGlvblJlZlByb21pc2VzID0gW107XG5cbiAgICBHRU9HUkFQSElDX1JFTEFUSU9OUy5mb3JFYWNoKHJlbGF0aW9uID0+IHtcbiAgICAgIGxldCByZWxhdGlvbkxpc3QgPSB0aGlzLm5vZGUucGFyZW50c1tyZWxhdGlvbl07XG5cbiAgICAgIGlmIChyZWxhdGlvbkxpc3QpIHtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbGF0aW9uTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHJlZiA9IHJlbGF0aW9uTGlzdFtpXTtcbiAgICAgICAgICByZWxhdGlvblJlZlByb21pc2VzLnB1c2gocmVmLmxvYWQoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHJlbGF0aW9uUmVmUHJvbWlzZXMpLnRoZW4ocmVmcyA9PiB7XG5cbiAgICAgIGxldCBwcm9taXNlcyA9IFtdO1xuXG4gICAgICByZWZzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIHByb21pc2VzLnB1c2gobm9kZS5wYXJlbnQubG9hZCgpKTtcbiAgICAgIH0pXG5cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHBhcmVudHMgPT4ge1xuICAgICAgICBsZXQgcCA9IFtdO1xuICAgICAgICBwYXJlbnRzLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgIGlmIChlbCAmJiAhKGVsIGluc3RhbmNlb2YgU3BpbmFsQ29udGV4dCkpIHtcbiAgICAgICAgICAgIHAucHVzaChuZXcgU3BpbmFsQ2FsTm9kZShlbCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gcDtcbiAgICAgIH0pO1xuXG4gICAgfSlcblxuICB9XG5cbiAgZ2V0RW5kcG9pbnROb2RlQnlUeXBlKGVuZHBvaW50VHlwZSkge1xuXG4gICAgbGV0IHJlZklkID0gdGhpcy5nZXRSZWYoZW5kcG9pbnRUeXBlKTtcbiAgICBpZiAocmVmSWQpIHtcblxuICAgICAgLy8gU2kgbGEgbm9kZSBhIHVuZSByZWZlcmVuY2VcbiAgICAgIGxldCBub2RlID0gU3BpbmFsR3JhcGhTZXJ2aWNlLmdldFJlYWxOb2RlKHJlZklkKTtcblxuICAgICAgaWYgKG5vZGUpIHtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBTcGluYWxDYWxFbmRwb2ludChub2RlKSk7XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuZmluZChCSU1PQkpFQ1RfRU5EUE9JTlRTLCAobm9kZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBub2RlLmluZm8uaWQuZ2V0KCkgPT09IHJlZklkO1xuICAgICAgICB9KS50aGVuKGVsID0+IHtcbiAgICAgICAgICBpZiAoZWwgJiYgZWwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBTcGluYWxDYWxFbmRwb2ludChlbFswXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICAgICAgfSlcblxuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gc2kgbGEgbm9kZSBuJ2EgcGFzIGRlIHJlZmVyZW5jZVxuICAgICAgaWYgKHRoaXMuaXNCaW1PYmplY3QoKSkge1xuICAgICAgICAvL3NpIGxlIG5vZGUgZXN0IHVuIGJpbU9iamVjdFxuXG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuZmluZChCSU1PQkpFQ1RfRU5EUE9JTlRTLCAobm9kZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBub2RlLmdldFR5cGUoKS5nZXQoKSA9PT0gU3BpbmFsQm1zRW5kcG9pbnQubm9kZVR5cGVOYW1lO1xuICAgICAgICB9KS50aGVuKHNwaW5hbE5vZGVzID0+IHtcblxuICAgICAgICAgIGxldCBub2RlRWxlbWVudHMgPSBzcGluYWxOb2Rlcy5tYXAoYXN5bmMgKG5vZGUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICAgIGVsZW1lbnQ6IGF3YWl0IG5vZGUuZ2V0RWxlbWVudCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKG5vZGVFbGVtZW50cykudGhlbihlbCA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBlbFtpXTtcbiAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuZWxlbWVudC50eXBlLmdldCgpID09PSBlbmRwb2ludFR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFJlZihlbmRwb2ludFR5cGUsIGVsZW1lbnQubm9kZS5pbmZvLmlkLmdldCgpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNwaW5hbENhbEVuZHBvaW50KGVsZW1lbnQubm9kZSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzaSBsYSBub2RlIG4nZXN0IHBhcyB1biBiaW1PYmplY3RcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5nZXRDaGlsZHJlbihbREFTSEJPQVJEX1NUQU5EQVJEX1JFTEFUSU9OXSkudGhlbihcbiAgICAgICAgICBjaGlsZHJlbiA9PiB7XG5cbiAgICAgICAgICAgIGxldCBub2RlRWxlbWVudHMgPSBjaGlsZHJlbi5tYXAoYXN5bmMgKG5vZGUpID0+IHtcblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogYXdhaXQgbm9kZS5nZXRFbGVtZW50KClcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKG5vZGVFbGVtZW50cykudGhlbihlbCA9PiB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gZWxbaV07XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuZWxlbWVudC50eXBlLmdldCgpID09PSBlbmRwb2ludFR5cGUpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3BpbmFsQ2FsRW5kcG9pbnQoZWxlbWVudC5ub2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0UmVmKGVuZHBvaW50VHlwZSkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuaW5mby5yZWZlcmVuY2UgJiYgdGhpcy5ub2RlLmluZm8ucmVmZXJlbmNlW1xuICAgICAgICBlbmRwb2ludFR5cGVdID9cbiAgICAgIHRoaXMubm9kZS5pbmZvLnJlZmVyZW5jZVtlbmRwb2ludFR5cGVdLmdldCgpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHNldFJlZihlbmRwb2ludFR5cGUsIHZhbHVlKSB7XG5cbiAgICBpZiAoIXRoaXMubm9kZS5pbmZvLnJlZmVyZW5jZSkge1xuICAgICAgdGhpcy5ub2RlLmluZm8uYWRkX2F0dHIoe1xuICAgICAgICByZWZlcmVuY2U6IHt9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMubm9kZS5pbmZvLnJlZmVyZW5jZVtlbmRwb2ludFR5cGVdKSB7XG4gICAgICB0aGlzLm5vZGUuaW5mby5yZWZlcmVuY2UuYWRkX2F0dHIoZW5kcG9pbnRUeXBlLCB2YWx1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5ub2RlLmluZm8ucmVmZXJlbmNlW2VuZHBvaW50VHlwZV0uc2V0KHZhbHVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBiaW5kQ2hpbGQodHlwZSwgY2FsbGJhY2spIHtcbiAgICB0aGlzLmdldEVuZHBvaW50Tm9kZUJ5VHlwZSh0eXBlKS50aGVuKGVuZHBvaW50Tm9kZSA9PiB7XG4gICAgICBpZiAoZW5kcG9pbnROb2RlKSB7XG4gICAgICAgIGxldCBtYXBwZWQgPSB0aGlzLm1hcGVkLmdldCh0eXBlKTtcblxuICAgICAgICBpZiAobWFwcGVkICYmIG1hcHBlZC5ub2RlLmluZm8uaWQuZ2V0KCkgIT09IGVuZHBvaW50Tm9kZS5ub2RlXG4gICAgICAgICAgLmluZm8uaWQuZ2V0KCkpIHtcbiAgICAgICAgICBtYXBwZWQudW5iaW5kRW5kcG9pbnQoKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdGhpcy5tYXBlZC5zZXQodHlwZSwgZW5kcG9pbnROb2RlKTtcbiAgICAgICAgZW5kcG9pbnROb2RlLmJpbmRFbmRwb2ludChjYWxsYmFjayk7XG4gICAgICB9XG5cbiAgICB9KVxuICB9XG5cbiAgYmluZCgpIHtcbiAgICB0aGlzLmJpbmRlZCA9IHRoaXMubm9kZS5pbmZvLmJpbmQoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgdHlwZSBpbiBJbnB1dERhdGFFbmRwb2ludFR5cGUpIHtcbiAgICAgICAgaWYgKGlzTmFOKHR5cGUpICYmIHR5cGUgIT09IFwiT3RoZXJcIikge1xuICAgICAgICAgIHRoaXMuYmluZENoaWxkKHR5cGUsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2FsY3VsYXRlUGFyZW50KHR5cGUpO1xuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cblxuICB1bmJpbmQoKSB7XG4gICAgdGhpcy5ub2RlLmluZm8udW5iaW5kKHRoaXMuYmluZGVkKTtcbiAgfVxuXG4gIGdldENoaWxkcmVuKCkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0Q2hpbGRyZW4oR0VPR1JBUEhJQ19SRUxBVElPTlMpLnRoZW4ocmVzID0+IHtcbiAgICAgIGxldCBjaGlsZHJlbiA9IFtdO1xuICAgICAgcmVzLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICBjaGlsZHJlbi5wdXNoKG5ldyBTcGluYWxDYWxOb2RlKGNoaWxkKSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBjaGlsZHJlbjtcbiAgICB9KVxuICB9XG5cbiAgZ2V0Q2hpbGRyZW5FbmRwb2ludHModHlwZSkge1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0Q2hpbGRyZW4oKS50aGVuKGNoaWxkcmVuID0+IHtcbiAgICAgIGxldCBwcm9taXNlcyA9IFtdO1xuICAgICAgY2hpbGRyZW4uZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChlbGVtZW50LmdldEVuZHBvaW50Tm9kZUJ5VHlwZSh0eXBlKSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGNoaWxkRW5kcG9pbnQgPT4ge1xuXG4gICAgICAgIGxldCBwcm8gPSBjaGlsZEVuZHBvaW50Lm1hcChlbCA9PiB7XG4gICAgICAgICAgaWYgKGVsKSB7XG5cbiAgICAgICAgICAgIHJldHVybiBlbC5nZXRDdXJyZW50VmFsdWUoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvKS50aGVuKHZhbHVlcyA9PiB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlcy5maWx0ZXIoZWwgPT4gZWwgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIH0pXG5cbiAgICAgIH0pXG5cbiAgICB9KVxuICB9XG5cbiAgY2FsY3VsYXRlUGFyZW50KHR5cGUpIHtcblxuICAgIHRoaXMuZ2V0UGFyZW50cygpLnRoZW4ocGFyZW50cyA9PiB7XG4gICAgICBwYXJlbnRzLmZvckVhY2gocGFyZW50ID0+IHtcblxuICAgICAgICBwYXJlbnQuZ2V0RW5kcG9pbnROb2RlQnlUeXBlKHR5cGUpLnRoZW4oYXN5bmMgcGFyZW50RW5kcG9pbnQgPT4ge1xuICAgICAgICAgIGlmIChwYXJlbnRFbmRwb2ludCkge1xuXG4gICAgICAgICAgICBsZXQgcnVsZSA9IHBhcmVudEVuZHBvaW50LmdldFJ1bGUoKTtcblxuICAgICAgICAgICAgaWYgKHJ1bGUgIT09IGRhc2hib2FyZFZhcmlhYmxlcy5DQUxDVUxBVElPTl9SVUxFU1xuICAgICAgICAgICAgICAucmVmZXJlbmNlKSB7XG4gICAgICAgICAgICAgIGxldCB2YWx1ZXMgPSBhd2FpdCBwYXJlbnQuZ2V0Q2hpbGRyZW5FbmRwb2ludHMoXG4gICAgICAgICAgICAgICAgdHlwZSk7XG4gICAgICAgICAgICAgIHN3aXRjaCAocnVsZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgZGFzaGJvYXJkVmFyaWFibGVzLkNBTENVTEFUSU9OX1JVTEVTLnN1bTpcbiAgICAgICAgICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzdW0gPSB2YWx1ZXMucmVkdWNlKChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEgKyBiO1xuICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50RW5kcG9pbnQuc2V0RW5kcG9pbnQoc3VtKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuY2FsY3VsYXRlUGFyZW50KHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICB9KSgpO1xuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBkYXNoYm9hcmRWYXJpYWJsZXMuQ0FMQ1VMQVRJT05fUlVMRVMuYXZlcmFnZTpcbiAgICAgICAgICAgICAgICAgICgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBzdW0gPSB2YWx1ZXMucmVkdWNlKChhLCBiKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGEgKyBiO1xuICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50RW5kcG9pbnQuc2V0RW5kcG9pbnQoc3VtIC8gdmFsdWVzLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuY2FsY3VsYXRlUGFyZW50KHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIGRhc2hib2FyZFZhcmlhYmxlcy5DQUxDVUxBVElPTl9SVUxFUy5tYXg6XG4gICAgICAgICAgICAgICAgICBwYXJlbnRFbmRwb2ludC5zZXRFbmRwb2ludChNYXRoLm1heCguLi52YWx1ZXMpKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgcGFyZW50LmNhbGN1bGF0ZVBhcmVudCh0eXBlKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgZGFzaGJvYXJkVmFyaWFibGVzLkNBTENVTEFUSU9OX1JVTEVTLm1pbjpcbiAgICAgICAgICAgICAgICAgIHBhcmVudEVuZHBvaW50LnNldEVuZHBvaW50KE1hdGgubWluKC4uLnZhbHVlcykpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuY2FsY3VsYXRlUGFyZW50KHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGxldCBpZCA9IHBhcmVudEVuZHBvaW50LmdldFJlZmVyZW5jZSgpO1xuICAgICAgICAgICAgICBwYXJlbnQuZ2V0Q2hpbGRyZW4oKS50aGVuKGVsID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgcmVmO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBlbFtpXTtcbiAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50Lm5vZGUuaW5mby5pZC5nZXQoKSA9PSBpZCkgcmVmID1cbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAocmVmKSB7XG4gICAgICAgICAgICAgICAgICByZWYuZ2V0RW5kcG9pbnROb2RlQnlUeXBlKHR5cGUpLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgIGVuZHBvaW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBpZiAoZW5kcG9pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuZHBvaW50LmdldEN1cnJlbnRWYWx1ZSgpLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRFbmRwb2ludC5zZXRFbmRwb2ludChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG5cbn0iXX0=