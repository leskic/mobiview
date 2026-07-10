function DimensionVertical({ y1, y2, sourceX, x, color, fontSize, label }) {
  const tick = fontSize * 0.55;
  const middle = (y1 + y2) / 2;
  return (
    <g className="detail-dimension" stroke={color} fill={color}>
      <line x1={sourceX} y1={y1} x2={x - tick} y2={y1} />
      <line x1={sourceX} y1={y2} x2={x - tick} y2={y2} />
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - tick} y1={y1} x2={x + tick} y2={y1} />
      <line x1={x - tick} y1={y2} x2={x + tick} y2={y2} />
      <text
        x={x - fontSize * 0.45}
        y={middle}
        fontSize={fontSize}
        textAnchor="middle"
        stroke="#ffffff"
        strokeWidth={fontSize * 0.34}
        strokeLinejoin="round"
        paintOrder="stroke"
        transform={`rotate(-90 ${x - fontSize * 0.45} ${middle})`}
      >
        {label}
      </text>
    </g>
  );
}


export default DimensionVertical;
