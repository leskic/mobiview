class Project {
  constructor({
    id,
    name,
    clientName,
    rooms = [],
    modules = [],
    materials = [],
  }) {
    this.id = id;
    this.name = name;
    this.clientName = clientName;
    this.rooms = rooms;
    this.modules = modules;
    this.materials = materials;
  }

  addRoom(room) {
    this.rooms.push(room);
  }

  findPieceById(pieceId) {
    for (const module of this.modules) {
      const foundPiece = module.pieces.find((piece) => piece.id === pieceId);

      if (foundPiece) return foundPiece;
    }

    return null;
  }
}

export default Project;