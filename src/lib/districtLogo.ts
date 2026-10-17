import { ExtrudeGeometry, Path, Shape } from "three";
import contours from "@/assets/district-logo-contours.json";

type Point = number[];
function contains(points: Point[], point: Point) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i], b = points[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

export function createDistrictLogoGeometry() {
  const outlines = contours.map((points) => ({ points, parents: contours.filter((other) => other !== points && contains(other, points[0])).length }));
  const shapes = outlines.filter((outline) => outline.parents % 2 === 0).map((outline) => {
    const shape = new Shape();
    outline.points.forEach(([x, y], i) => i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
    shape.closePath();
    outlines.filter((hole) => hole.parents === outline.parents + 1 && contains(outline.points, hole.points[0])).forEach((hole) => {
      const path = new Path();
      hole.points.forEach(([x, y], i) => i === 0 ? path.moveTo(x, y) : path.lineTo(x, y));
      path.closePath();
      shape.holes.push(path);
    });
    return shape;
  });
  const geometry = new ExtrudeGeometry(shapes, { depth: 0.16, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.008, bevelSegments: 2, steps: 1, curveSegments: 1 });
  const positions = geometry.getAttribute("position"), uv = geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) uv.setXY(i, positions.getX(i) / 4 + 0.5, positions.getY(i) / 4 + 0.5);
  uv.needsUpdate = true;
  geometry.center();
  return geometry;
}