/**
 * QuadTree implementation for efficient spatial partitioning
 * Used for label collision detection in network visualizations
 */
export class QuadTree {
    constructor(bounds, capacity = 4) {
      this.bounds = bounds; // {x, y, width, height}
      this.capacity = capacity;
      this.labels = [];
      this.divided = false;
    }
  
    subdivide() {
      const x = this.bounds.x;
      const y = this.bounds.y;
      const w = this.bounds.width / 2;
      const h = this.bounds.height / 2;
  
      const ne = { x: x + w, y: y, width: w, height: h };
      const nw = { x: x, y: y, width: w, height: h };
      const se = { x: x + w, y: y + h, width: w, height: h };
      const sw = { x: x, y: y + h, width: w, height: h };
  
      this.northeast = new QuadTree(ne, this.capacity);
      this.northwest = new QuadTree(nw, this.capacity);
      this.southeast = new QuadTree(se, this.capacity);
      this.southwest = new QuadTree(sw, this.capacity);
  
      this.divided = true;
  
      // Redistribute existing labels
      for (const label of this.labels) {
        this.insertIntoSubdivisions(label);
      }
      this.labels = [];
    }
  
    insertIntoSubdivisions(label) {
      if (this.northeast.containsLabel(label)) this.northeast.insert(label);
      if (this.northwest.containsLabel(label)) this.northwest.insert(label);
      if (this.southeast.containsLabel(label)) this.southeast.insert(label);
      if (this.southwest.containsLabel(label)) this.southwest.insert(label);
    }
  
    containsLabel(label) {
      return !(label.x > this.bounds.x + this.bounds.width ||
               label.x + label.width < this.bounds.x ||
               label.y > this.bounds.y + this.bounds.height ||
               label.y + label.height < this.bounds.y);
    }
  
    insert(label) {
      if (!this.containsLabel(label)) {
        return false;
      }
  
      if (this.labels.length < this.capacity && !this.divided) {
        this.labels.push(label);
        return true;
      }
  
      if (!this.divided) {
        this.subdivide();
      }
  
      return this.insertIntoSubdivisions(label);
    }
  
    query(range, found = []) {
      if (!this.containsLabel(range)) {
        return found;
      }
  
      if (!this.divided) {
        for (const label of this.labels) {
          if (this.checkCollision(range, label)) {
            found.push(label);
          }
        }
      } else {
        this.northeast.query(range, found);
        this.northwest.query(range, found);
        this.southeast.query(range, found);
        this.southwest.query(range, found);
      }
  
      return found;
    }
  
    checkCollision(label1, label2) {
      return !(label1.x + label1.width < label2.x ||
               label1.x > label2.x + label2.width ||
               label1.y + label1.height < label2.y ||
               label1.y > label2.y + label2.height);
    }
  }