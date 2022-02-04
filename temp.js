class Node {
    constructor(index, x, y) {
        this.index = index;
        this.x = x;
        this.y = y;
    }
}

class Rectangle {
    constructor(x, y, w, h) { 
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    contains(node) {
        return (node.x > this.x - this.w &&
            node.x < this.x + this.w &&
            node.y > this.y - this.h &&
            node.y < this.y + this.h);
    }
}


class Quadtree {
    constructor(boundary) {
        this.boundary = boundary;
        this.CoM = {x:null, y:null};
        this.NE = null;
        this.NW = null;
        this.SE = null;
        this.SW = null;
        this.mass = 0;
        this.divided = false;
        this.nodes = [];
    }


    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w;
        let h = this.boundary.h;

        let ne = new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2);
        let nw = new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2);
        let se = new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2);
        let sw = new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2);

        this.NW = new Quadtree(nw);
        this.NE = new Quadtree(ne);
        this.SW = new Quadtree(sw);
        this.SE = new Quadtree(se);
        this.divided = true;
    }

    insert(node) {

        if (!this.boundary.contains(node)) {
            return false;
        }
        //update center of mass
        //update mass of the tree node

        if (this.nodes.length < 1 && !this.divided) {
            this.mass++;
            this.CoM = {x: node.x, y: node.y};
            this.nodes.push(node);
            return true;

        } else {
            if (!this.divided) {
                this.subdivide();
                this.divided = true;
                let existingNode = this.nodes[0];
                this.nodes = [];
                this.mass = 0;
                this.insert(existingNode);
            }
            let totalX = this.mass * this.CoM.x + node.x;
            let totalY = this.mass * this.CoM.y + node.y;
                //update mass of tree
            this.mass++;
            this.CoM.x = totalX/this.mass;
            this.CoM.y = totalY/this.mass;

            return (this.NW.insert(node)||
            this.NE.insert(node) ||
            this.SW.insert(node) ||
            this.SE.insert(node));

        }
    }
}


//we dont need to find max because we are limmiting the position in force calculation
function findMaxRange(nodes) {
    let maxX = -Infinity, maxY = -Infinity, minX = Infinity, minY = Infinity;
    let x,y;
    for(let i=0; i<nodes.length; i++){
        
        if(!(isNaN(x = +nodes[i].x) && isNaN(y = +nodes[i].y))){
            if(x>maxX) maxX = x;
            if(x<minX) minX = x;
            if(y>maxY) maxY = y;
            if(y<minY) minY = y;
        }
        //create a rectangle with this width and height and create a tree likewise

        else{
            console.warn(`position of point at index ${i} is not valid number`);
        }
    }
}


let boundary = new Rectangle(200, 200, 200, 200);
let qt = new Quadtree(boundary);
{

// {NE, NW, SW, SE, mass, CoM, boundary} = qt;
// console.log(NE, NW, SW, SE, mass, CoM, boundary);    
}
let nodes = [];
let nodes2 = [];
for(let i=0; i<100; i++){
    let node = new Node(i, Math.random()*400, Math.random()*400);
    nodes.push(node);
    nodes2.push(node);
    if(!qt.insert(node)){
        console.log(`point ${node} lies outside the boundary`)
    }
}

function distance(point1, point2){
    return Math.sqrt(Math.pow((point1.x - point2.x), 2) + Math.pow((point1.y - point2.y), 2));
}

function calRepDisplacement(node1, CoM, mass) {
     let displacement = {};
     let d = distance(node1, CoM);
     let forceRepulsive = kSquare/d;
     displacement.x = ((node1.x-CoM.x)/d)*forceRepulsive*mass;
     displacement.y = ((node1.y-CoM.y)/d)*forceRepulsive*mass;
     return displacement;
}

//calculating the force on each body
const theta = 0.5;
const k = 50;
const kSquare = Math.pow(k, 2);
let iterationCount = 3;
let temperature = 400;
while (iterationCount>0) {
    iterationCount--;
    temperature *= 0.95;
    console.log(temperature)

    //apply brute force
    console.time("function1");
    for(let i=0; i<nodes2.length; i++){
        nodes2[i].displacement = {x:0, y:0};
        for(let j=0; j<nodes2.length; j++){
            if(i!=j){
                nodes2[i].displacement += calRepDisplacement(nodes2[i], nodes2[j], 1);
            }
        }
    }
    console.timeEnd("function1");


    console.time("function2");
    for(let i =0; i< nodes.length; i++){
        let node1 = nodes[i];
        node1.displacement = {x: 0, y:0};
        let toVisit = [];
        toVisit.push(qt);
        while (toVisit.length>0) {
                let qt = toVisit.pop();
                let NE = qt.NE;
                let NW = qt.NW;
                let SW = qt.SW;
                let SE = qt.SE;
                let nodes = qt.nodes;
                let mass = qt.mass;
                let CoM = qt.CoM;
                let boundary = qt.boundary;

                //if it is empty rectangle
                if(mass == 0)
                    continue;

                if(mass == 1){
                    //calculate the force if it is not node1
                    if((nodes[0].index != node1.index) && (distance(node1, CoM)>0.0001)){
                        let displacement = calRepDisplacement(node1, CoM, mass);
                        node1.displacement.x += displacement.x; 
                        node1.displacement.y += displacement.y;
                    }
                    continue;
                }

                let s = 2*boundary.width;
                let d = distance(node1, CoM);
                //treat it as a single body
                if((s/d)<theta){
                    let displacement = calRepDisplacement(node1, CoM, mass);
                    node1.displacement.x += displacement.x; 
                    node1.displacement.y += displacement.y;
                    continue;
                }
                toVisit.push(NE, NW, SW, SE);
        }
    }
    console.timeEnd("function2")
    

    // for(let i=0; i<nodes.length; i++){
    //     let disMag = distance(nodes[i].displacement, {x:0, y:0}); 
    //     if(disMag>0.001){
    //         nodes[i].x += (nodes[i].displacement.x/disMag)*Math.min(disMag, temperature);
    //         nodes[i].y += (nodes[i].displacement.y/disMag)*Math.min(disMag, temperature);
    //         nodes[i].x = Math.min(400, Math.max(0, nodes[i].x));
    //         nodes[i].y = Math.min(400, Math.max(0, nodes[i].y));
    //     }

    // }
}



















class Node {
    constructor(index, x, y) {
        this.index = index;
        this.x = x;
        this.y = y;
        ctx.beginPath();
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
      
    }

    contains(node) {
        if (this.x + this.w == WIDTH) {
            return (node.x >= this.x - this.w &&
                node.x <= this.x + this.w &&
                node.y >= this.y - this.h &&
                node.y < this.y + this.h);
        }

        if (this.y + this.h == HEIGHT) {
            return (node.x >= this.x - this.w &&
                node.x < this.x + this.w &&
                node.y >= this.y - this.h &&
                node.y <= this.y + this.h);
        } else {
            return (node.x >= this.x - this.w &&
                node.x < this.x + this.w &&
                node.y >= this.y - this.h &&
                node.y < this.y + this.h);
        }
    }

}


class Quadtree {
    constructor(boundary) {
        this.boundary = boundary;
        this.CoM = {
            x: null,
            y: null
        };
        this.NE = null;
        this.NW = null;
        this.SE = null;
        this.SW = null;
        this.mass = 0;
        this.divided = false;
        this.nodes = [];
    }


    subdivide() {
        let x = this.boundary.x;
        let y = this.boundary.y;
        let w = this.boundary.w;
        let h = this.boundary.h;

        let ne = new Rectangle(x + w / 2, y - h / 2, w / 2, h / 2);
        let nw = new Rectangle(x - w / 2, y - h / 2, w / 2, h / 2);
        let se = new Rectangle(x + w / 2, y + h / 2, w / 2, h / 2);
        let sw = new Rectangle(x - w / 2, y + h / 2, w / 2, h / 2);

        this.NW = new Quadtree(nw);
        this.NE = new Quadtree(ne);
        this.SW = new Quadtree(sw);
        this.SE = new Quadtree(se);
        this.divided = true;
    }

    insert(node) {

        if (!this.boundary.contains(node)) {
            return false;
        }
        //update center of mass
        //update mass of the tree node

        if (this.nodes.length < 1 && !this.divided) {
            this.mass++;
            this.CoM = {
                x: node.x,
                y: node.y
            };
            this.nodes.push(node);
            return true;

        } else {
            if (!this.divided) {
                this.subdivide();
                this.divided = true;
                let existingNode = this.nodes[0];
                this.nodes = [];
                this.mass = 0;
                this.insert(existingNode);
            }
            let totalX = this.mass * this.CoM.x + node.x;
            let totalY = this.mass * this.CoM.y + node.y;
            //update mass of tree
            this.mass++;
            this.CoM.x = totalX / this.mass;
            this.CoM.y = totalY / this.mass;

            return (this.NW.insert(node) ||
                this.NE.insert(node) ||
                this.SW.insert(node) ||
                this.SE.insert(node));

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

        if (!(isNaN(x = +nodes[i].x) && isNaN(y = +nodes[i].y))) {
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
    return Math.sqrt(Math.pow((point1.x - point2.x), 2) + Math.pow((point1.y - point2.y), 2));
}

function calRepDisplacement(node1, CoM, mass) {
    let displacement = {};
    let d = distance(node1, CoM);
    let forceRepulsive = kSquare / d;
    displacement.x = ((node1.x - CoM.x) / d) * forceRepulsive * mass;
    displacement.y = ((node1.y - CoM.y) / d) * forceRepulsive * mass;
    return displacement;
}



let myCanvas = document.getElementById("draw");
let ctx = myCanvas.getContext("2d");
const WIDTH = 400;
const HEIGHT = 400;
let boundary = new Rectangle(200, 200, 200, 200);
let qt = new Quadtree(boundary);
let nodes = [];
let nodes2 = [];

for (let i = 0; i < 1000; i++) {
    let node = new Node(i, Math.floor(Math.random() * 400), Math.floor(Math.random() * 400));
    nodes.push(node);
    nodes2.push(node);
}

//calculating the force on each body
const theta = 0.5;
const k = 50;
const kSquare = Math.pow(k, 2);
let iterationCount = 5;
while (iterationCount > 0) {
    iterationCount--;
    console.time('brute force time' + iterationCount);
    for (let i = 0; i < nodes2.length; i++) {
        nodes2[i].displacement = {
            x: 0,
            y: 0
        };
        for (let j = 0; j < nodes2.length; j++) {
            if (i != j) {
                let displacement2 = calRepDisplacement(nodes2[i], nodes2[j], 1);
                nodes2[i].displacement.x += displacement2.x;
                nodes2[i].displacement.y += displacement2.y;
            }
        }
    }
    console.timeEnd('brute force time' + iterationCount);


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const BH = async () => {
        let nodes2 = [];
        qt = new Quadtree(boundary);
        for (let i = 0; i < nodes.length; i++) {
            qt.insert(nodes[i]);
        }
        for (let i = 0; i < nodes.length; i++) {
            let node1 = nodes[i];
            node1.displacement = {
                x: 0,
                y: 0
            };
            let toVisit = [];
            toVisit.push(qt);
            while (toVisit.length>0) {
                let qd = toVisit.pop()
                let mass = qd.mass;
                //if it is empty rectangle
                if (mass == 0)
                    continue;

                let nodes = qd.nodes;
                let CoM = qd.CoM;

                if (mass == 1) {
                    //calculate the force if it is not node1
                    if ((nodes[0].index != node1.index) && (distance(node1, CoM) > 0.0001)) {
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
                if ((s / d) < theta) {
                    let displacement = calRepDisplacement(node1, CoM, mass);
                    node1.displacement.x += displacement.x;
                    node1.displacement.y += displacement.y;
                    continue;
                }
                
                let NE = qd.NE;
                let NW = qd.NW;
                let SW = qd.SW;
                let SE = qd.SE;

                toVisit.push(NE, NW, SW, SE);
            }
        }
    }

    console.time('BH time' + iterationCount );
    BH();
    console.timeEnd('BH time' + iterationCount);

}