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
          return new _SpinalCalEndpoint2.default(el[0]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TcGluYWxDYWxOb2RlLmpzIl0sIm5hbWVzIjpbImRhc2hib2FyZFZhcmlhYmxlcyIsInJlcXVpcmUiLCJTcGluYWxDYWxOb2RlIiwiY29uc3RydWN0b3IiLCJub2RlIiwiYmluZGVkIiwibWFwZWQiLCJNYXAiLCJpc0JpbU9iamVjdCIsImdldFR5cGUiLCJnZXQiLCJCSU1PQkpFQ1QiLCJnZXRQYXJlbnRzIiwicmVsYXRpb25SZWZQcm9taXNlcyIsIkdFT0dSQVBISUNfUkVMQVRJT05TIiwiZm9yRWFjaCIsInJlbGF0aW9uIiwicmVsYXRpb25MaXN0IiwicGFyZW50cyIsImkiLCJsZW5ndGgiLCJyZWYiLCJwdXNoIiwibG9hZCIsIlByb21pc2UiLCJhbGwiLCJ0aGVuIiwicmVmcyIsInByb21pc2VzIiwicGFyZW50IiwicCIsImVsIiwiU3BpbmFsQ29udGV4dCIsImdldEVuZHBvaW50Tm9kZUJ5VHlwZSIsImVuZHBvaW50VHlwZSIsInJlZklkIiwiZ2V0UmVmIiwiU3BpbmFsR3JhcGhTZXJ2aWNlIiwiZ2V0UmVhbE5vZGUiLCJyZXNvbHZlIiwiU3BpbmFsQ2FsRW5kcG9pbnQiLCJmaW5kIiwiQklNT0JKRUNUX0VORFBPSU5UUyIsImluZm8iLCJpZCIsIlNwaW5hbEJtc0VuZHBvaW50Iiwibm9kZVR5cGVOYW1lIiwic3BpbmFsTm9kZXMiLCJub2RlRWxlbWVudHMiLCJtYXAiLCJlbGVtZW50IiwiZ2V0RWxlbWVudCIsInR5cGUiLCJzZXRSZWYiLCJ1bmRlZmluZWQiLCJnZXRDaGlsZHJlbiIsIkRBU0hCT0FSRF9TVEFOREFSRF9SRUxBVElPTiIsImNoaWxkcmVuIiwicmVmZXJlbmNlIiwidmFsdWUiLCJhZGRfYXR0ciIsInNldCIsImJpbmRDaGlsZCIsImNhbGxiYWNrIiwiZW5kcG9pbnROb2RlIiwibWFwcGVkIiwidW5iaW5kRW5kcG9pbnQiLCJiaW5kRW5kcG9pbnQiLCJiaW5kIiwiSW5wdXREYXRhRW5kcG9pbnRUeXBlIiwiaXNOYU4iLCJjYWxjdWxhdGVQYXJlbnQiLCJ1bmJpbmQiLCJyZXMiLCJjaGlsZCIsImdldENoaWxkcmVuRW5kcG9pbnRzIiwiY2hpbGRFbmRwb2ludCIsInBybyIsImdldEN1cnJlbnRWYWx1ZSIsInZhbHVlcyIsImZpbHRlciIsInBhcmVudEVuZHBvaW50IiwicnVsZSIsImdldFJ1bGUiLCJDQUxDVUxBVElPTl9SVUxFUyIsInN1bSIsInJlZHVjZSIsImEiLCJiIiwic2V0RW5kcG9pbnQiLCJhdmVyYWdlIiwibWF4IiwiTWF0aCIsIm1pbiIsImdldFJlZmVyZW5jZSIsImVuZHBvaW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQTs7QUFTQTs7QUFRQTs7Ozs7Ozs7QUFaQSxNQUFNO0FBQ0pBO0FBREksSUFFRkMsUUFBUSw4Q0FBUixDQUZKOztBQWdCZSxNQUFNQyxhQUFOLENBQW9COztBQUVqQ0MsY0FBWUMsSUFBWixFQUFrQjtBQUNoQixTQUFLQSxJQUFMLEdBQVlBLElBQVo7QUFDQSxTQUFLQyxNQUFMLEdBQWMsSUFBZDtBQUNBLFNBQUtDLEtBQUwsR0FBYSxJQUFJQyxHQUFKLEVBQWI7QUFDRDs7QUFFREMsZ0JBQWM7QUFDWixXQUFPLEtBQUtKLElBQUwsQ0FBVUssT0FBVixHQUFvQkMsR0FBcEIsT0FBOEJDLG9CQUFyQztBQUNEOztBQUVEQyxlQUFhO0FBQ1gsUUFBSUMsc0JBQXNCLEVBQTFCOztBQUVBQyxvQ0FBcUJDLE9BQXJCLENBQTZCQyxZQUFZO0FBQ3ZDLFVBQUlDLGVBQWUsS0FBS2IsSUFBTCxDQUFVYyxPQUFWLENBQWtCRixRQUFsQixDQUFuQjs7QUFFQSxVQUFJQyxZQUFKLEVBQWtCOztBQUVoQixhQUFLLElBQUlFLElBQUksQ0FBYixFQUFnQkEsSUFBSUYsYUFBYUcsTUFBakMsRUFBeUNELEdBQXpDLEVBQThDO0FBQzVDLGdCQUFNRSxNQUFNSixhQUFhRSxDQUFiLENBQVo7QUFDQU4sOEJBQW9CUyxJQUFwQixDQUF5QkQsSUFBSUUsSUFBSixFQUF6QjtBQUNEO0FBQ0Y7QUFFRixLQVhEOztBQWFB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LE1BQ3BDNkIsT0FEb0M7QUFFdkM7O0FBRUQsc0JBQUk3QixHQUFKLEVBQVM7QUFDUEEsd0JBQUlZLHFCQUFKLENBQTBCbUIsSUFBMUIsRUFBZ0MxQixJQUFoQyxDQUNFLG9CQUFZO0FBQ1YsMEJBQUlxRSxRQUFKLEVBQWM7QUFDWkEsaUNBQVNqQixlQUFULEdBQTJCcEQsSUFBM0IsQ0FDRSxpQkFBUztBQUNQdUQseUNBQWVRLFdBQWYsQ0FDRTlCLEtBREY7QUFFRCx5QkFKSDtBQUtEO0FBQ0YscUJBVEg7QUFVRDtBQUVGLGlCQXJCRDtBQXNCRDtBQUVGO0FBQ0YsV0F6RUQ7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUEyRUQsT0E3RUQ7QUE4RUQsS0EvRUQ7QUFnRkQ7O0FBelRnQztrQkFBZHpELGEiLCJmaWxlIjoiU3BpbmFsQ2FsTm9kZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIFNwaW5hbEdyYXBoU2VydmljZSxcbiAgU3BpbmFsQ29udGV4dFxufSBmcm9tIFwic3BpbmFsLWVudi12aWV3ZXItZ3JhcGgtc2VydmljZVwiO1xuXG5jb25zdCB7XG4gIGRhc2hib2FyZFZhcmlhYmxlc1xufSA9IHJlcXVpcmUoXCJzcGluYWwtZW52LXZpZXdlci1kYXNoYm9hcmQtc3RhbmRhcmQtc2VydmljZVwiKTtcblxuaW1wb3J0IHtcbiAgU3BpbmFsQm1zRW5kcG9pbnQsXG4gIEJJTU9CSkVDVCxcbiAgR0VPR1JBUEhJQ19SRUxBVElPTlMsXG4gIERBU0hCT0FSRF9TVEFOREFSRF9SRUxBVElPTixcbiAgQklNT0JKRUNUX0VORFBPSU5UUyxcbiAgSW5wdXREYXRhRW5kcG9pbnRUeXBlXG59IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IFNwaW5hbENhbEVuZHBvaW50IGZyb20gXCIuL1NwaW5hbENhbEVuZHBvaW50XCI7XG5cblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTcGluYWxDYWxOb2RlIHtcblxuICBjb25zdHJ1Y3Rvcihub2RlKSB7XG4gICAgdGhpcy5ub2RlID0gbm9kZTtcbiAgICB0aGlzLmJpbmRlZCA9IG51bGw7XG4gICAgdGhpcy5tYXBlZCA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIGlzQmltT2JqZWN0KCkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuZ2V0VHlwZSgpLmdldCgpID09PSBCSU1PQkpFQ1Q7XG4gIH1cblxuICBnZXRQYXJlbnRzKCkge1xuICAgIGxldCByZWxhdGlvblJlZlByb21pc2VzID0gW107XG5cbiAgICBHRU9HUkFQSElDX1JFTEFUSU9OUy5mb3JFYWNoKHJlbGF0aW9uID0+IHtcbiAgICAgIGxldCByZWxhdGlvbkxpc3QgPSB0aGlzLm5vZGUucGFyZW50c1tyZWxhdGlvbl07XG5cbiAgICAgIGlmIChyZWxhdGlvbkxpc3QpIHtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlbGF0aW9uTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNvbnN0IHJlZiA9IHJlbGF0aW9uTGlzdFtpXTtcbiAgICAgICAgICByZWxhdGlvblJlZlByb21pc2VzLnB1c2gocmVmLmxvYWQoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHJlbGF0aW9uUmVmUHJvbWlzZXMpLnRoZW4ocmVmcyA9PiB7XG5cbiAgICAgIGxldCBwcm9taXNlcyA9IFtdO1xuXG4gICAgICByZWZzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICAgIHByb21pc2VzLnB1c2gobm9kZS5wYXJlbnQubG9hZCgpKTtcbiAgICAgIH0pXG5cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKHBhcmVudHMgPT4ge1xuICAgICAgICBsZXQgcCA9IFtdO1xuICAgICAgICBwYXJlbnRzLmZvckVhY2goZWwgPT4ge1xuICAgICAgICAgIGlmIChlbCAmJiAhKGVsIGluc3RhbmNlb2YgU3BpbmFsQ29udGV4dCkpIHtcbiAgICAgICAgICAgIHAucHVzaChuZXcgU3BpbmFsQ2FsTm9kZShlbCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gcDtcbiAgICAgIH0pO1xuXG4gICAgfSlcblxuICB9XG5cbiAgZ2V0RW5kcG9pbnROb2RlQnlUeXBlKGVuZHBvaW50VHlwZSkge1xuXG4gICAgbGV0IHJlZklkID0gdGhpcy5nZXRSZWYoZW5kcG9pbnRUeXBlKTtcbiAgICBpZiAocmVmSWQpIHtcblxuXG4gICAgICAvLyBTaSBsYSBub2RlIGEgdW5lIHJlZmVyZW5jZVxuICAgICAgbGV0IG5vZGUgPSBTcGluYWxHcmFwaFNlcnZpY2UuZ2V0UmVhbE5vZGUocmVmSWQpO1xuXG4gICAgICBpZiAobm9kZSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBTcGluYWxDYWxFbmRwb2ludChub2RlKSk7XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuZmluZChCSU1PQkpFQ1RfRU5EUE9JTlRTLCAobm9kZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBub2RlLmluZm8uaWQuZ2V0KCkgPT09IHJlZklkO1xuICAgICAgICB9KS50aGVuKGVsID0+IHtcbiAgICAgICAgICByZXR1cm4gbmV3IFNwaW5hbENhbEVuZHBvaW50KGVsWzBdKTtcbiAgICAgICAgfSlcblxuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gc2kgbGEgbm9kZSBuJ2EgcGFzIGRlIHJlZmVyZW5jZVxuICAgICAgaWYgKHRoaXMuaXNCaW1PYmplY3QoKSkge1xuICAgICAgICAvL3NpIGxlIG5vZGUgZXN0IHVuIGJpbU9iamVjdFxuXG4gICAgICAgIHJldHVybiB0aGlzLm5vZGUuZmluZChCSU1PQkpFQ1RfRU5EUE9JTlRTLCAobm9kZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBub2RlLmdldFR5cGUoKS5nZXQoKSA9PT0gU3BpbmFsQm1zRW5kcG9pbnQubm9kZVR5cGVOYW1lO1xuICAgICAgICB9KS50aGVuKHNwaW5hbE5vZGVzID0+IHtcblxuICAgICAgICAgIGxldCBub2RlRWxlbWVudHMgPSBzcGluYWxOb2Rlcy5tYXAoYXN5bmMgKG5vZGUpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICAgIGVsZW1lbnQ6IGF3YWl0IG5vZGUuZ2V0RWxlbWVudCgpXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKG5vZGVFbGVtZW50cykudGhlbihlbCA9PiB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSBlbFtpXTtcbiAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuZWxlbWVudC50eXBlLmdldCgpID09PSBlbmRwb2ludFR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldFJlZihlbmRwb2ludFR5cGUsIGVsZW1lbnQubm9kZS5pbmZvLmlkLmdldCgpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFNwaW5hbENhbEVuZHBvaW50KGVsZW1lbnQubm9kZSk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9KVxuXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzaSBsYSBub2RlIG4nZXN0IHBhcyB1biBiaW1PYmplY3RcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZS5nZXRDaGlsZHJlbihbREFTSEJPQVJEX1NUQU5EQVJEX1JFTEFUSU9OXSkudGhlbihcbiAgICAgICAgICBjaGlsZHJlbiA9PiB7XG5cbiAgICAgICAgICAgIGxldCBub2RlRWxlbWVudHMgPSBjaGlsZHJlbi5tYXAoYXN5bmMgKG5vZGUpID0+IHtcblxuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIG5vZGU6IG5vZGUsXG4gICAgICAgICAgICAgICAgZWxlbWVudDogYXdhaXQgbm9kZS5nZXRFbGVtZW50KClcbiAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKG5vZGVFbGVtZW50cykudGhlbihlbCA9PiB7XG4gICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZWwubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gZWxbaV07XG4gICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQuZWxlbWVudC50eXBlLmdldCgpID09PSBlbmRwb2ludFR5cGUpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgU3BpbmFsQ2FsRW5kcG9pbnQoZWxlbWVudC5ub2RlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0UmVmKGVuZHBvaW50VHlwZSkge1xuICAgIHJldHVybiB0aGlzLm5vZGUuaW5mby5yZWZlcmVuY2UgJiYgdGhpcy5ub2RlLmluZm8ucmVmZXJlbmNlW1xuICAgICAgICBlbmRwb2ludFR5cGVdID9cbiAgICAgIHRoaXMubm9kZS5pbmZvLnJlZmVyZW5jZVtlbmRwb2ludFR5cGVdLmdldCgpIDpcbiAgICAgIHVuZGVmaW5lZDtcbiAgfVxuXG4gIHNldFJlZihlbmRwb2ludFR5cGUsIHZhbHVlKSB7XG5cbiAgICBpZiAoIXRoaXMubm9kZS5pbmZvLnJlZmVyZW5jZSkge1xuICAgICAgdGhpcy5ub2RlLmluZm8uYWRkX2F0dHIoe1xuICAgICAgICByZWZlcmVuY2U6IHt9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMubm9kZS5pbmZvLnJlZmVyZW5jZVtlbmRwb2ludFR5cGVdKSB7XG4gICAgICB0aGlzLm5vZGUuaW5mby5yZWZlcmVuY2UuYWRkX2F0dHIoZW5kcG9pbnRUeXBlLCB2YWx1ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5ub2RlLmluZm8ucmVmZXJlbmNlW2VuZHBvaW50VHlwZV0uc2V0KHZhbHVlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBiaW5kQ2hpbGQodHlwZSwgY2FsbGJhY2spIHtcbiAgICB0aGlzLmdldEVuZHBvaW50Tm9kZUJ5VHlwZSh0eXBlKS50aGVuKGVuZHBvaW50Tm9kZSA9PiB7XG4gICAgICBpZiAoZW5kcG9pbnROb2RlKSB7XG4gICAgICAgIGxldCBtYXBwZWQgPSB0aGlzLm1hcGVkLmdldCh0eXBlKTtcblxuICAgICAgICBpZiAobWFwcGVkICYmIG1hcHBlZC5ub2RlLmluZm8uaWQuZ2V0KCkgIT09IGVuZHBvaW50Tm9kZS5ub2RlXG4gICAgICAgICAgLmluZm8uaWQuZ2V0KCkpIHtcblxuICAgICAgICAgIG1hcHBlZC51bmJpbmRFbmRwb2ludCgpO1xuICAgICAgICB9XG5cblxuICAgICAgICB0aGlzLm1hcGVkLnNldCh0eXBlLCBlbmRwb2ludE5vZGUpO1xuICAgICAgICBlbmRwb2ludE5vZGUuYmluZEVuZHBvaW50KGNhbGxiYWNrKTtcbiAgICAgIH1cblxuICAgIH0pXG4gIH1cblxuICBiaW5kKCkge1xuICAgIHRoaXMuYmluZGVkID0gdGhpcy5ub2RlLmluZm8uYmluZCgoKSA9PiB7XG4gICAgICBmb3IgKGxldCB0eXBlIGluIElucHV0RGF0YUVuZHBvaW50VHlwZSkge1xuICAgICAgICBpZiAoaXNOYU4odHlwZSkgJiYgdHlwZSAhPT0gXCJPdGhlclwiKSB7XG4gICAgICAgICAgdGhpcy5iaW5kQ2hpbGQodHlwZSwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jYWxjdWxhdGVQYXJlbnQodHlwZSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuXG4gIHVuYmluZCgpIHtcbiAgICB0aGlzLm5vZGUuaW5mby51bmJpbmQodGhpcy5iaW5kZWQpO1xuICB9XG5cbiAgZ2V0Q2hpbGRyZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMubm9kZS5nZXRDaGlsZHJlbihHRU9HUkFQSElDX1JFTEFUSU9OUykudGhlbihyZXMgPT4ge1xuICAgICAgbGV0IGNoaWxkcmVuID0gW107XG4gICAgICByZXMuZm9yRWFjaChjaGlsZCA9PiB7XG4gICAgICAgIGNoaWxkcmVuLnB1c2gobmV3IFNwaW5hbENhbE5vZGUoY2hpbGQpKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNoaWxkcmVuO1xuICAgIH0pXG4gIH1cblxuICBnZXRDaGlsZHJlbkVuZHBvaW50cyh0eXBlKSB7XG5cbiAgICByZXR1cm4gdGhpcy5nZXRDaGlsZHJlbigpLnRoZW4oY2hpbGRyZW4gPT4ge1xuICAgICAgbGV0IHByb21pc2VzID0gW107XG4gICAgICBjaGlsZHJlbi5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICBwcm9taXNlcy5wdXNoKGVsZW1lbnQuZ2V0RW5kcG9pbnROb2RlQnlUeXBlKHR5cGUpKTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oY2hpbGRFbmRwb2ludCA9PiB7XG5cbiAgICAgICAgbGV0IHBybyA9IGNoaWxkRW5kcG9pbnQubWFwKGVsID0+IHtcbiAgICAgICAgICBpZiAoZWwpIHtcblxuICAgICAgICAgICAgcmV0dXJuIGVsLmdldEN1cnJlbnRWYWx1ZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm8pLnRoZW4odmFsdWVzID0+IHtcbiAgICAgICAgICByZXR1cm4gdmFsdWVzLmZpbHRlcihlbCA9PiBlbCAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgfSlcblxuICAgICAgfSlcblxuICAgIH0pXG4gIH1cblxuICBjYWxjdWxhdGVQYXJlbnQodHlwZSkge1xuXG4gICAgdGhpcy5nZXRQYXJlbnRzKCkudGhlbihwYXJlbnRzID0+IHtcbiAgICAgIHBhcmVudHMuZm9yRWFjaChwYXJlbnQgPT4ge1xuXG4gICAgICAgIHBhcmVudC5nZXRFbmRwb2ludE5vZGVCeVR5cGUodHlwZSkudGhlbihhc3luYyBwYXJlbnRFbmRwb2ludCA9PiB7XG4gICAgICAgICAgaWYgKHBhcmVudEVuZHBvaW50KSB7XG5cbiAgICAgICAgICAgIGxldCBydWxlID0gcGFyZW50RW5kcG9pbnQuZ2V0UnVsZSgpO1xuXG4gICAgICAgICAgICBpZiAocnVsZSAhPT0gZGFzaGJvYXJkVmFyaWFibGVzLkNBTENVTEFUSU9OX1JVTEVTXG4gICAgICAgICAgICAgIC5yZWZlcmVuY2UpIHtcbiAgICAgICAgICAgICAgbGV0IHZhbHVlcyA9IGF3YWl0IHBhcmVudC5nZXRDaGlsZHJlbkVuZHBvaW50cyhcbiAgICAgICAgICAgICAgICB0eXBlKTtcbiAgICAgICAgICAgICAgc3dpdGNoIChydWxlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBkYXNoYm9hcmRWYXJpYWJsZXMuQ0FMQ1VMQVRJT05fUlVMRVMuc3VtOlxuICAgICAgICAgICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN1bSA9IHZhbHVlcy5yZWR1Y2UoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYSArIGI7XG4gICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRFbmRwb2ludC5zZXRFbmRwb2ludChzdW0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5jYWxjdWxhdGVQYXJlbnQodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgIH0pKCk7XG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIGRhc2hib2FyZFZhcmlhYmxlcy5DQUxDVUxBVElPTl9SVUxFUy5hdmVyYWdlOlxuICAgICAgICAgICAgICAgICAgKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN1bSA9IHZhbHVlcy5yZWR1Y2UoKGEsIGIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYSArIGI7XG4gICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnRFbmRwb2ludC5zZXRFbmRwb2ludChzdW0gLyB2YWx1ZXMubGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5jYWxjdWxhdGVQYXJlbnQodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgZGFzaGJvYXJkVmFyaWFibGVzLkNBTENVTEFUSU9OX1JVTEVTLm1heDpcbiAgICAgICAgICAgICAgICAgIHBhcmVudEVuZHBvaW50LnNldEVuZHBvaW50KE1hdGgubWF4KC4uLnZhbHVlcykpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuY2FsY3VsYXRlUGFyZW50KHR5cGUpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBkYXNoYm9hcmRWYXJpYWJsZXMuQ0FMQ1VMQVRJT05fUlVMRVMubWluOlxuICAgICAgICAgICAgICAgICAgcGFyZW50RW5kcG9pbnQuc2V0RW5kcG9pbnQoTWF0aC5taW4oLi4udmFsdWVzKSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5jYWxjdWxhdGVQYXJlbnQodHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IGlkID0gcGFyZW50RW5kcG9pbnQuZ2V0UmVmZXJlbmNlKCk7XG4gICAgICAgICAgICAgIHBhcmVudC5nZXRDaGlsZHJlbigpLnRoZW4oZWwgPT4ge1xuICAgICAgICAgICAgICAgIGxldCByZWY7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudCA9IGVsW2ldO1xuICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnQubm9kZS5pbmZvLmlkLmdldCgpID09IGlkKSByZWYgPVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZWYpIHtcbiAgICAgICAgICAgICAgICAgIHJlZi5nZXRFbmRwb2ludE5vZGVCeVR5cGUodHlwZSkudGhlbihcbiAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIGlmIChlbmRwb2ludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnQuZ2V0Q3VycmVudFZhbHVlKCkudGhlbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudEVuZHBvaW50LnNldEVuZHBvaW50KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgfSlcbiAgICB9KVxuICB9XG5cblxufSJdfQ==