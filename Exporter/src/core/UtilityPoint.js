class UtilityPoint {
  constructor({
    id,
    type,
    wallId,
    x,
    y,
    radius = 80,
    description = "",
  }) {
    this.id = id;
    this.type = type;
    this.wallId = wallId;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.description = description;
  }
}

export default UtilityPoint;