function DetailCallout({
  x,
  y,
  targetX,
  targetY,
  title,
  subtitle,
  fontSize,
  swatch,
  elbowOffset = 150,
}) {
  const textWidth = Math.max(title.length * fontSize * 0.58, 560);
  const boxX = x - fontSize * 0.35;
  const boxY = y - fontSize * 1.05;
  const elbowX = x - elbowOffset;
  return (
    <g className="mounting-callout">
      <polyline
        points={`${boxX},${y} ${elbowX},${y} ${elbowX},${targetY} ${targetX},${targetY}`}
        markerEnd="url(#detail-arrow)"
      />
      <rect
        className="callout-background"
        x={boxX}
        y={boxY}
        width={textWidth + fontSize * 0.9}
        height={fontSize * 2.05}
        rx={fontSize * 0.12}
      />
      {swatch && (
        <rect
          x={x}
          y={y - fontSize * 0.72}
          width={fontSize * 0.72}
          height={fontSize * 0.72}
          fill={swatch}
          stroke="#111827"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <text
        x={x + (swatch ? fontSize : 0)}
        y={y - fontSize * 0.2}
        fontSize={fontSize}
        fontWeight="700"
      >
        {title}
      </text>
      <text
        x={x + (swatch ? fontSize : 0)}
        y={y + fontSize * 0.72}
        fontSize={fontSize * 0.76}
      >
        {subtitle}
      </text>
    </g>
  );
}


export default DetailCallout;
