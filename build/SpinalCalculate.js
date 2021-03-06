"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
class SpinalCalculate {
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
exports.default = SpinalCalculate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9TcGluYWxDYWxjdWxhdGUuanMiXSwibmFtZXMiOlsiU3BpbmFsQ2FsY3VsYXRlIiwiY29uc3RydWN0b3IiLCJiaW1PYmplY3RzIiwiYWxsQmltcyIsImJpbmRCaW1PYmplY3RzIiwiZm9yRWFjaCIsImVsZW1lbnQiLCJiaW5kIl0sIm1hcHBpbmdzIjoiOzs7OztBQUFlLE1BQU1BLGVBQU4sQ0FBc0I7QUFDbkNDLGNBQVlDLFVBQVosRUFBd0I7QUFDdEIsU0FBS0MsT0FBTCxHQUFlRCxVQUFmO0FBQ0EsU0FBS0UsY0FBTDtBQUNEOztBQUVEQSxtQkFBaUI7QUFDZixTQUFLRCxPQUFMLENBQWFFLE9BQWIsQ0FBcUJDLFdBQVc7QUFDOUJBLGNBQVFDLElBQVI7QUFDRCxLQUZEO0FBR0Q7O0FBVmtDO2tCQUFoQlAsZSIsImZpbGUiOiJTcGluYWxDYWxjdWxhdGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBjbGFzcyBTcGluYWxDYWxjdWxhdGUge1xuICBjb25zdHJ1Y3RvcihiaW1PYmplY3RzKSB7XG4gICAgdGhpcy5hbGxCaW1zID0gYmltT2JqZWN0cztcbiAgICB0aGlzLmJpbmRCaW1PYmplY3RzKCk7XG4gIH1cblxuICBiaW5kQmltT2JqZWN0cygpIHtcbiAgICB0aGlzLmFsbEJpbXMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgIGVsZW1lbnQuYmluZCgpO1xuICAgIH0pO1xuICB9XG5cbn0iXX0=