import { useMemo } from "react";
import { materialColor, projectPieces } from "./projectUtils";

function bounds3d(piece) {
  const values = piece.geometry?.mesh?.positions;
  if (!Array.isArray(values) || values.length < 3) return null;
  const result = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity };
  for (let i=0;i<values.length;i+=3) {
    result.minX=Math.min(result.minX,+values[i]); result.maxX=Math.max(result.maxX,+values[i]);
    result.minY=Math.min(result.minY,+values[i+1]); result.maxY=Math.max(result.maxY,+values[i+1]);
    result.minZ=Math.min(result.minZ,+values[i+2]); result.maxZ=Math.max(result.maxZ,+values[i+2]);
  }
  return result;
}
const iso = ([x,y,z]) => [x-y, (x+y)*.45-z];
function IsometricElevation({ project }) {
  const drawing = useMemo(() => projectPieces(project).map((piece) => ({ piece, bounds: bounds3d(piece) })).filter((item)=>item.bounds), [project]);
  if (!drawing.length) return <div className="detail-empty">Sem geometria para gerar isométrica.</div>;
  const polygons=[]; const points=[];
  drawing.forEach(({piece,bounds:b},index)=>{
    const v=[[b.minX,b.minY,b.minZ],[b.maxX,b.minY,b.minZ],[b.maxX,b.maxY,b.minZ],[b.minX,b.maxY,b.minZ],
      [b.minX,b.minY,b.maxZ],[b.maxX,b.minY,b.maxZ],[b.maxX,b.maxY,b.maxZ],[b.minX,b.maxY,b.maxZ]].map(iso);
    v.forEach((p)=>points.push(p));
    [[4,5,6,7],[0,1,5,4],[1,2,6,5]].forEach((face,faceIndex)=>polygons.push({ key:`${piece.id||index}-${faceIndex}`, piece, pts:face.map((i)=>v[i]) }));
  });
  const xs=points.map((p)=>p[0]), ys=points.map((p)=>p[1]); const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const measure=Math.max(maxX-minX,maxY-minY),pad=measure*.12;
  return <svg className="detail-elevation isometric-sheet" viewBox={`${minX-pad} ${minY-pad} ${maxX-minX+pad*2} ${maxY-minY+pad*2}`}>
    {polygons.map((face)=><polygon key={face.key} points={face.pts.map((p)=>p.join(",")).join(" ")}
      fill={materialColor(project,face.piece)} className="technical-outline" />)}
  </svg>;
}
export default IsometricElevation;
