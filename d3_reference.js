let data = [[0.1, 0.2], [0.3, 0.4], [0.8, 0.9]];

const quadtree = (nodes, x0, y0, x1, x2)=>{
    let tree = new Quadtree(x0, y0, x1, y1);
    return nodes == null? tree:tree.addAll(nodes);
}

const Quadtree = (x0, y0, x1, x2)=>{
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this._root = undefined;

    this.cover()

}

const add_nodes = (tree, x, y, d)=>{
    let parent, node = tree,_root;
}

const addAll = (data)=>{
    //make this data array if it is in another iterable form, now it is array in test case
    let n = data.length;
    //const xz and yz to put all x and y value of n points
    let xz = new Float64Array(n);
    let yz = new Float64Array(n);
    let x0 = 1.0, y0=1.0, x1 = 0.0, y1 = 0.0;

    //find the max of the tree
    for(let i=0; i<n; i++){
        let x = +data[i][0];
        let y = +data[i][1];
        xz[i] = x;
        yz[i] = y;

        if(x<x0) x0=x;
        if(x>x1) x1 = x;
        if(y<y0) y0 = y;
        if(y>y1) y1 = y; 
    } 

    //once you have found the max boundary point make tree of that range    
     this.cover(x0, y0).cover(x1, y1);

     //now we made a tree of that range, let's add our data

     for(let i=0; i<n; i++){
         add_nodes(this, xz[i], yz[i], data[i]);
     }

}




