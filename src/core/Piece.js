class Piece {
  constructor({
    id,
    name,
    type,
    moduleId,
    dimensions,
    materialId,
    edges,
    position = [0, 0, 0],
    explode,
  }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.moduleId = moduleId;
    this.dimensions = dimensions;
    this.materialId = materialId;
    this.edges = edges;
    this.position = position;
    this.explode = explode;
  }

  getLabel() {
    return `${this.name} - ${this.dimensions.width} x ${this.dimensions.height} x ${this.dimensions.thickness}`;
  }

  getExplodedPosition(explodeAmount) {
    const factor = explodeAmount / 100;
    const direction = this.explode?.direction || [0, 0, 0];
    const distance = this.explode?.distance || 1;

    return [
      this.position[0] + direction[0] * distance * factor,
      this.position[1] + direction[1] * distance * factor,
      this.position[2] + direction[2] * distance * factor,
    ];
  }
}

export default Piece;