class Wall {
  constructor({ id, name, length, height, thickness = 150 }) {
    this.id = id;
    this.name = name;
    this.length = length;
    this.height = height;
    this.thickness = thickness;
  }
}

export default Wall;