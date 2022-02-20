class Node {
  constructor(index, x, y) {
    this.index = index;
    this.x = x;
    this.y = y;
    ctx.beginPath();
    ctx.strokeStyle = "#FF0000";
    ctx.rect(x, y, 1, 1);
    ctx.stroke();
  }
}

class Rectangle {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.rect(x - w, y - h, 2 * w, 2 * h);
    ctx.stroke();
  }

  bound(node) {
    if (this.x + this.w == WIDTH) {
      return (
        node.x >= this.x - this.w &&
        node.x <= this.x + this.w &&
        node.y >= this.y - this.h &&
        node.y < this.y + this.h
      );
    }

    if (this.y + this.h == HEIGHT) {
      return (
        node.x >= this.x - this.w &&
        node.x < this.x + this.w &&
        node.y >= this.y - this.h &&
        node.y <= this.y + this.h
      );
    } else {
      return (
        node.x >= this.x - this.w &&
        node.x < this.x + this.w &&
        node.y >= this.y - this.h &&
        node.y < this.y + this.h
      );
    }
  }
}

class Quadtree {
  constructor(boundary) {
    this.boundary = boundary;
    this.CoM = {
      x: null,
      y: null,
    };
    this.mass = 0;
    this.NE = null;
    this.NW = null;
    this.SE = null;
    this.SW = null;

    this.isDivided = false;
    this.nodes = [];
  }

  partition() {
    let x = this.boundary.x;
    let y = this.boundary.y;
    let w = this.boundary.w;
    let h = this.boundary.h;

    let se = new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2);
    let sw = new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2);
    let ne = new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2);
    let nw = new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2);

    this.NW = new Quadtree(nw);
    this.NE = new Quadtree(ne);
    this.SW = new Quadtree(sw);
    this.SE = new Quadtree(se);
    this.isDivided = true;
  }

  insert(node) {
    if (!this.boundary.bound(node)) {
      return false;
    }

    if (this.nodes.length < 1 && !this.isDivided) {
      //update center of mass
      //update mass of the tree node
      this.mass++;
      this.CoM = {
        x: node.x,
        y: node.y,
      };
      this.nodes.push(node);
      return true;
    } else {
      if (!this.isDivided) {
        this.partition();
        this.isDivided = true;
        let existingNode = this.nodes[0];
        this.nodes = [];
        this.mass = 0;
        this.NW.insert(existingNode) ||
          this.NE.insert(existingNode) ||
          this.SW.insert(existingNode) ||
          this.SE.insert(existingNode);
      }
      let totalX = this.mass * this.CoM.x + node.x;
      let totalY = this.mass * this.CoM.y + node.y;
      this.mass++;
      this.CoM.x = totalX / this.mass;
      this.CoM.y = totalY / this.mass;

      return (
        this.NW.insert(node) ||
        this.NE.insert(node) ||
        this.SW.insert(node) ||
        this.SE.insert(node)
      );
    }
  }
}

//we dont need to find max because we are limmiting the position in force calculation
function findMaxRange(nodes) {
  let maxX = -Infinity,
    maxY = -Infinity,
    minX = Infinity,
    minY = Infinity;

  let x, y;
  for (let i = 0; i < nodes.length; i++) {
    if (!(isNaN((x = +nodes[i].x)) && isNaN((y = +nodes[i].y)))) {
      if (x > maxX) maxX = x;
      if (x < minX) minX = x;
      if (y > maxY) maxY = y;
      if (y < minY) minY = y;
    }
    //create a rectangle with this width and height and create a tree likewise
    else {
      console.warn(`position of point at index ${i} is not valid number`);
    }
  }
}

function distance(point1, point2) {
  return Math.sqrt(
    Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
  );
}

function calRepDisplacement(node1, CoM, mass) {
  let displacement = {};
  let d = distance(node1, CoM);
  let forceRepulsive = kSquare / d;
  displacement.x = ((node1.x - CoM.x) / d) * forceRepulsive * mass;
  displacement.y = ((node1.y - CoM.y) / d) * forceRepulsive * mass;
  return displacement;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let myCanvas = document.getElementById("draw");
let ctx = myCanvas.getContext("2d");

const WIDTH = 1024;
const HEIGHT = 900;
let boundary = new Rectangle(WIDTH / 2, HEIGHT / 2, WIDTH / 2, HEIGHT / 2);
let qt = new Quadtree(boundary);
let nodes = [];
let nodes2 = [];

function initializeNodesRandomly(n) {
  nodes = [];
  nodes2 = [];
  for (let i = 0; i < n; i++) {
    let node = new Node(
      i,
      Math.floor(Math.random() * WIDTH),
      Math.floor(Math.random() * HEIGHT)
    );
    nodes.push(node);
    nodes2.push(node);
  }
}

//calculating the force on each body
const theta = 0.45;
const k = 50;
const kSquare = Math.pow(k, 2);
let iterationCount = 2;
const count = async () => {
  while (iterationCount > 0) {
    await sleep(1000);
    iterationCount--;
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
    let boundary = new Rectangle(WIDTH / 2, HEIGHT / 2, WIDTH / 2, HEIGHT / 2);
    qt = new Quadtree(boundary);
    initializeNodesRandomly(1000);
    console.time("brute force time " + iterationCount);
    for (let i = 0; i < nodes2.length; i++) {
      nodes2[i].displacement = {
        x: 0,
        y: 0,
      };
      for (let j = 0; j < nodes2.length; j++) {
        //check for if these two are connected or not with adjajency matrix
        if (i != j) {
          let displacement2 = calRepDisplacement(nodes2[i], nodes2[j], 1);
          nodes2[i].displacement.x += displacement2.x;
          nodes2[i].displacement.y += displacement2.y;
        }
      }
    }
    console.timeEnd("brute force time " + iterationCount);

    const BH = () => {
      for (let i = 0; i < nodes.length; i++) {
        qt.insert(nodes[i]);
      }
      console.log(qt);
      for (let i = 0; i < nodes.length; i++) {
        let node1 = nodes[i];
        node1.displacement = {
          x: 0,
          y: 0,
        };
        let toVisit = [];
        toVisit.push(qt);
        while (toVisit.length > 0) {
          let qd = toVisit.pop();
          let mass = qd.mass;
          //if it is empty box
          if (mass == 0) continue;

          let nodes = qd.nodes;
          let CoM = qd.CoM;

          if (mass == 1) {
            // console.log(nodes[0]);
            //calculate the force if it is not node1
            let isNotSame = true;
            if (nodes.length > 0) {
              isNotSame = nodes[0].index != node1.index;
            }
            if (isNotSame && distance(node1, CoM) > 0.0001) {
              let displacement = calRepDisplacement(node1, CoM, mass);
              node1.displacement.x += displacement.x;
              node1.displacement.y += displacement.y;
            }
            continue;
          }
          let boundary = qd.boundary;
          let s = 2 * boundary.w;
          let d = distance(node1, CoM);

          //treat it as a single body
          if (s / d < theta) {
            let displacement = calRepDisplacement(node1, CoM, mass);
            node1.displacement.x += displacement.x;
            node1.displacement.y += displacement.y;
            continue;
          }

          //otherwise
          let NE = qd.NE;
          let NW = qd.NW;
          let SW = qd.SW;
          let SE = qd.SE;

          toVisit.push(NE, NW, SW, SE);
        }
      }
    };

    console.time("BH time" + iterationCount);
    BH();
    console.timeEnd("BH time" + iterationCount);
  }
};

console.log("hi");
count();