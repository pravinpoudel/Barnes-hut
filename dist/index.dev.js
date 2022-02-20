"use strict";

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Node = function Node(index, x, y) {
  _classCallCheck(this, Node);

  this.index = index;
  this.x = x;
  this.y = y;
  ctx.beginPath();
  ctx.strokeStyle = "#FF0000";
  ctx.rect(x, y, 1, 1);
  ctx.stroke();
};

var Rectangle =
/*#__PURE__*/
function () {
  function Rectangle(x, y, w, h) {
    _classCallCheck(this, Rectangle);

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.rect(x - w, y - h, 2 * w, 2 * h);
    ctx.stroke();
  }

  _createClass(Rectangle, [{
    key: "bound",
    value: function bound(node) {
      if (this.x + this.w == WIDTH) {
        return node.x >= this.x - this.w && node.x <= this.x + this.w && node.y >= this.y - this.h && node.y < this.y + this.h;
      }

      if (this.y + this.h == HEIGHT) {
        return node.x >= this.x - this.w && node.x < this.x + this.w && node.y >= this.y - this.h && node.y <= this.y + this.h;
      } else {
        return node.x >= this.x - this.w && node.x < this.x + this.w && node.y >= this.y - this.h && node.y < this.y + this.h;
      }
    }
  }]);

  return Rectangle;
}();

var Quadtree =
/*#__PURE__*/
function () {
  function Quadtree(boundary) {
    _classCallCheck(this, Quadtree);

    this.boundary = boundary;
    this.CoM = {
      x: null,
      y: null
    };
    this.mass = 0;
    this.NE = null;
    this.NW = null;
    this.SE = null;
    this.SW = null;
    this.isDivided = false;
    this.nodes = [];
  }

  _createClass(Quadtree, [{
    key: "partition",
    value: function partition() {
      var x = this.boundary.x;
      var y = this.boundary.y;
      var w = this.boundary.w;
      var h = this.boundary.h;
      var se = new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2);
      var sw = new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2);
      var ne = new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2);
      var nw = new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2);
      this.NW = new Quadtree(nw);
      this.NE = new Quadtree(ne);
      this.SW = new Quadtree(sw);
      this.SE = new Quadtree(se);
      this.isDivided = true;
    }
  }, {
    key: "insert",
    value: function insert(node) {
      if (!this.boundary.bound(node)) {
        return false;
      }

      if (this.nodes.length < 1 && !this.isDivided) {
        //update center of mass
        //update mass of the tree node
        this.mass++;
        this.CoM = {
          x: node.x,
          y: node.y
        };
        this.nodes.push(node);
        return true;
      } else {
        if (!this.isDivided) {
          this.partition();
          this.isDivided = true;
          var existingNode = this.nodes[0];
          this.nodes = [];
          this.mass = 0;
          this.NW.insert(existingNode) || this.NE.insert(existingNode) || this.SW.insert(existingNode) || this.SE.insert(existingNode);
        }

        var totalX = this.mass * this.CoM.x + node.x;
        var totalY = this.mass * this.CoM.y + node.y;
        this.mass++;
        this.CoM.x = totalX / this.mass;
        this.CoM.y = totalY / this.mass;
        return this.NW.insert(node) || this.NE.insert(node) || this.SW.insert(node) || this.SE.insert(node);
      }
    }
  }]);

  return Quadtree;
}(); //we dont need to find max because we are limmiting the position in force calculation


function findMaxRange(nodes) {
  var maxX = -Infinity,
      maxY = -Infinity,
      minX = Infinity,
      minY = Infinity;
  var x, y;

  for (var i = 0; i < nodes.length; i++) {
    if (!(isNaN(x = +nodes[i].x) && isNaN(y = +nodes[i].y))) {
      if (x > maxX) maxX = x;
      if (x < minX) minX = x;
      if (y > maxY) maxY = y;
      if (y < minY) minY = y;
    } //create a rectangle with this width and height and create a tree likewise
    else {
        console.warn("position of point at index ".concat(i, " is not valid number"));
      }
  }
}

function distance(point1, point2) {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function calRepDisplacement(node1, CoM, mass) {
  var displacement = {};
  var d = distance(node1, CoM);
  var forceRepulsive = kSquare / d;
  displacement.x = (node1.x - CoM.x) / d * forceRepulsive * mass;
  displacement.y = (node1.y - CoM.y) / d * forceRepulsive * mass;
  return displacement;
}

function sleep(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}

var myCanvas = document.getElementById("draw");
var ctx = myCanvas.getContext("2d");
var WIDTH = 1024;
var HEIGHT = 900;
var boundary = new Rectangle(WIDTH / 2, HEIGHT / 2, WIDTH / 2, HEIGHT / 2);
var qt = new Quadtree(boundary);
var nodes = [];
var nodes2 = [];

function initializeNodesRandomly(n) {
  nodes = [];
  nodes2 = [];

  for (var i = 0; i < n; i++) {
    var node = new Node(i, Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT));
    nodes.push(node);
    nodes2.push(node);
  }
} //calculating the force on each body


var theta = 0.45;
var k = 50;
var kSquare = Math.pow(k, 2);
var iterationCount = 2;

var count = function count() {
  var _boundary, i, j, displacement2, BH;

  return regeneratorRuntime.async(function count$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (!(iterationCount > 0)) {
            _context.next = 17;
            break;
          }

          _context.next = 3;
          return regeneratorRuntime.awrap(sleep(1000));

        case 3:
          iterationCount--;
          ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
          _boundary = new Rectangle(WIDTH / 2, HEIGHT / 2, WIDTH / 2, HEIGHT / 2);
          qt = new Quadtree(_boundary);
          initializeNodesRandomly(1000);
          console.time("brute force time " + iterationCount);

          for (i = 0; i < nodes2.length; i++) {
            nodes2[i].displacement = {
              x: 0,
              y: 0
            };

            for (j = 0; j < nodes2.length; j++) {
              //check for if these two are connected or not with adjajency matrix
              if (i != j) {
                displacement2 = calRepDisplacement(nodes2[i], nodes2[j], 1);
                nodes2[i].displacement.x += displacement2.x;
                nodes2[i].displacement.y += displacement2.y;
              }
            }
          }

          console.timeEnd("brute force time " + iterationCount);

          BH = function BH() {
            for (var _i = 0; _i < nodes.length; _i++) {
              qt.insert(nodes[_i]);
            }

            console.log(qt);

            for (var _i2 = 0; _i2 < nodes.length; _i2++) {
              var node1 = nodes[_i2];
              node1.displacement = {
                x: 0,
                y: 0
              };
              var toVisit = [];
              toVisit.push(qt);

              while (toVisit.length > 0) {
                var qd = toVisit.pop();
                var mass = qd.mass; //if it is empty box

                if (mass == 0) continue;
                var _nodes = qd.nodes;
                var CoM = qd.CoM;

                if (mass == 1) {
                  // console.log(nodes[0]);
                  //calculate the force if it is not node1
                  var isNotSame = true;

                  if (_nodes.length > 0) {
                    isNotSame = _nodes[0].index != node1.index;
                  }

                  if (isNotSame && distance(node1, CoM) > 0.0001) {
                    var displacement = calRepDisplacement(node1, CoM, mass);
                    node1.displacement.x += displacement.x;
                    node1.displacement.y += displacement.y;
                  }

                  continue;
                }

                var _boundary2 = qd.boundary;
                var s = 2 * _boundary2.w;
                var d = distance(node1, CoM); //treat it as a single body

                if (s / d < theta) {
                  var _displacement = calRepDisplacement(node1, CoM, mass);

                  node1.displacement.x += _displacement.x;
                  node1.displacement.y += _displacement.y;
                  continue;
                } //otherwise


                var NE = qd.NE;
                var NW = qd.NW;
                var SW = qd.SW;
                var SE = qd.SE;
                toVisit.push(NE, NW, SW, SE);
              }
            }
          };

          console.time("BH time" + iterationCount);
          BH();
          console.timeEnd("BH time" + iterationCount);
          _context.next = 0;
          break;

        case 17:
        case "end":
          return _context.stop();
      }
    }
  });
};

console.log("hi");
count();
//# sourceMappingURL=index.dev.js.map
