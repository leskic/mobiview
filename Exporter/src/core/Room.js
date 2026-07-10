class Room {
  constructor({ id, name, walls = [], utilityPoints = [] }) {
    this.id = id;
    this.name = name;
    this.walls = walls;
    this.utilityPoints = utilityPoints;
  }

  addWall(wall) {
    this.walls.push(wall);
  }

  addUtilityPoint(point) {
    this.utilityPoints.push(point);
  }
}

export default Room;