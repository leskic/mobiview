class Module {
  constructor({ id, name, type, pieces = [] }) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.pieces = pieces;
  }

  addPiece(piece) {
    this.pieces.push(piece);
  }
}

export default Module;