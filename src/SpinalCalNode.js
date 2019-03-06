import {
  SpinalGraphService,
  SpinalContext
} from "spinal-env-viewer-graph-service";

const {
  dashboardVariables
} = require("spinal-env-viewer-dashboard-standard-service");

import {
  SpinalBmsEndpoint,
  BIMOBJECT,
  GEOGRAPHIC_RELATIONS,
  DASHBOARD_STANDARD_RELATION,
  BIMOBJECT_ENDPOINTS,
  InputDataEndpointType
} from "./constants";
import SpinalCalEndpoint from "./SpinalCalEndpoint";



export default class SpinalCalNode {

  constructor(node) {
    this.node = node;
    this.binded = null;
    this.maped = new Map();
  }

  isBimObject() {
    return this.node.getType().get() === BIMOBJECT;
  }

  getParents() {
    let relationRefPromises = [];

    GEOGRAPHIC_RELATIONS.forEach(relation => {
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
      })


      return Promise.all(promises).then(parents => {
        let p = [];
        parents.forEach(el => {
          if (el && !(el instanceof SpinalContext)) {
            p.push(new SpinalCalNode(el));
          }
        })

        return p;
      });

    })

  }

  getEndpointNodeByType(endpointType) {

    let refId = this.getRef(endpointType);
    if (refId) {


      // Si la node a une reference
      let node = SpinalGraphService.getRealNode(refId);

      if (node) {
        return Promise.resolve(new SpinalCalEndpoint(node));
      } else {

        return this.node.find(BIMOBJECT_ENDPOINTS, (node) => {
          return node.info.id.get() === refId;
        }).then(el => {
          return new SpinalCalEndpoint(el[0]);
        })

      }

    } else {

      // si la node n'a pas de reference
      if (this.isBimObject()) {
        //si le node est un bimObject

        return this.node.find(BIMOBJECT_ENDPOINTS, (node) => {
          return node.getType().get() === SpinalBmsEndpoint.nodeTypeName;
        }).then(spinalNodes => {

          let nodeElements = spinalNodes.map(async (node) => {
            return {
              node: node,
              element: await node.getElement()
            };
          });

          return Promise.all(nodeElements).then(el => {
            for (let i = 0; i < el.length; i++) {
              const element = el[i];
              if (element.element.type.get() === endpointType) {
                this.setRef(endpointType, element.node.info.id.get());
                return new SpinalCalEndpoint(element.node);
              }

            }
            return undefined;
          })

        })
      } else {
        // si la node n'est pas un bimObject
        return this.node.getChildren([DASHBOARD_STANDARD_RELATION]).then(
          children => {

            let nodeElements = children.map(async (node) => {

              return {
                node: node,
                element: await node.getElement()
              };

            });


            return Promise.all(nodeElements).then(el => {
              for (let i = 0; i < el.length; i++) {
                const element = el[i];
                if (element.element.type.get() === endpointType) {
                  return new SpinalCalEndpoint(element.node);
                }

              }
              return undefined;
            })

          })
      }
    }
  }

  getRef(endpointType) {
    return this.node.info.reference && this.node.info.reference[
        endpointType] ?
      this.node.info.reference[endpointType].get() :
      undefined;
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

        if (mapped && mapped.node.info.id.get() !== endpointNode.node
          .info.id.get()) {

          mapped.unbindEndpoint();
        }


        this.maped.set(type, endpointNode);
        endpointNode.bindEndpoint(callback);
      }

    })
  }

  bind() {
    this.binded = this.node.info.bind(() => {
      for (let type in InputDataEndpointType) {
        if (isNaN(type) && type !== "Other") {
          this.bindChild(type, () => {
            this.calculateParent(type);
          })
        }
      }
    })
  }


  unbind() {
    this.node.info.unbind(this.binded);
  }

  getChildren() {
    return this.node.getChildren(GEOGRAPHIC_RELATIONS).then(res => {
      let children = [];
      res.forEach(child => {
        children.push(new SpinalCalNode(child));
      });
      return children;
    })
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
        })

      })

    })
  }

  calculateParent(type) {

    this.getParents().then(parents => {
      parents.forEach(parent => {

        parent.getEndpointNodeByType(type).then(async parentEndpoint => {
          if (parentEndpoint) {

            let rule = parentEndpoint.getRule();

            if (rule !== dashboardVariables.CALCULATION_RULES
              .reference) {
              let values = await parent.getChildrenEndpoints(
                type);
              switch (rule) {
                case dashboardVariables.CALCULATION_RULES.sum:
                  (() => {
                    let sum = values.reduce((a, b) => {
                      return a + b;
                    }, 0);
                    parentEndpoint.setEndpoint(sum).then(() => {
                      parent.calculateParent(type);
                    })

                  })();
                  break;
                case dashboardVariables.CALCULATION_RULES.average:
                  (() => {
                    let sum = values.reduce((a, b) => {
                      return a + b;
                    }, 0);
                    parentEndpoint.setEndpoint(sum / values.length)
                      .then(() => {
                        parent.calculateParent(type);
                      })

                  })();
                  break;
                case dashboardVariables.CALCULATION_RULES.max:
                  parentEndpoint.setEndpoint(Math.max(...values))
                    .then(() => {
                      parent.calculateParent(type);
                    })
                  break;
                case dashboardVariables.CALCULATION_RULES.min:
                  parentEndpoint.setEndpoint(Math.min(...values))
                    .then(() => {
                      parent.calculateParent(type);
                    })
                  break;
              }
            } else {
              let id = parentEndpoint.getReference();
              parent.getChildren().then(el => {
                let ref;
                for (let i = 0; i < el.length; i++) {
                  const element = el[i];
                  if (element.node.info.id.get() == id) ref =
                    element;
                }

                if (ref) {
                  ref.getEndpointNodeByType(type).then(
                    endpoint => {
                      if (endpoint) {
                        endpoint.getCurrentValue().then(
                          value => {
                            parentEndpoint.setEndpoint(
                              value);
                          })
                      }
                    })
                }

              })
            }

          }
        })

      })
    })
  }


}