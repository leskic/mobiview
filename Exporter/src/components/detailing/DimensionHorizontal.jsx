function DimensionHorizontal({
  x1,
  x2,
  sourceY,
  y,
  color,
  fontSize,
  label,
  name,
}) {
  const tick = fontSize * 0.55;
  return (
    <g className="detail-dimension" stroke={color} fill={color}>
      <line x1={x1} y1={sourceY} x2={x1} y2={y + tick} />
      <line x1={x2} y1={sourceY} x2={x2} y2={y + tick} />
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1} y1={y - tick} x2={x1} y2={y + tick} />
      <line x1={x2} y1={y - tick} x2={x2} y2={y + tick} />
      <text
        x={(x1 + x2) / 2}
        y={y - fontSize * 0.35}
        fontSize={fontSize}
        textAnchor="middle"
        stroke="#ffffff"
        strokeWidth={fontSize * 0.34}
        strokeLinejoin="round"
        paintOrder="stroke"
      >
        {label}
      </text>
      {name && (
        <text
          x={(x1 + x2) / 2}
          y={y + fontSize * 1.25}
          fontSize={Math.min(
            fontSize * 0.72,
            (x2 - x1) / Math.max(name.length * 0.72, 1)
          )}
          textAnchor="middle"
          stroke="#ffffff"
          strokeWidth={fontSize * 0.3}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {name}
        </text>
      )}
    </g>
  );
}


export default DimensionHorizontal;
