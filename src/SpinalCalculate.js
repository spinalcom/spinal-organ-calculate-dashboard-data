export default class SpinalCalculate {
  constructor(bimObjects) {
    this.allBims = bimObjects;
    this.bindBimObjects();
  }

  bindBimObjects() {
    this.allBims.forEach(element => {
      element.bind();
    });
  }

}