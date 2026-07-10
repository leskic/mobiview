import Project from "../core/Project";
import Module from "../core/Module";
import Piece from "../core/Piece";
import Material from "../core/Material";

const branco = new Material({
  id: "MAT001",
  name: "BP Branco",
  color: "#f3f4f6",
  thickness: 18,
});

const freijo = new Material({
  id: "MAT002",
  name: "Freijó",
  color: "#d97706",
  thickness: 18,
});

const moduloTeste = new Module({
  id: "MOD001",
  name: "Módulo Aéreo Teste",
  type: "AEREO",
  pieces: [
    new Piece({
      id: "P001",
      name: "Lateral Esquerda",
      type: "LATERAL",
      moduleId: "MOD001",
      dimensions: { width: 800, height: 700, thickness: 18 },
      materialId: "MAT001",
      edges: { top: 1, bottom: 1, left: 1, right: 1 },
      position: [-0.56, 0.5, 0],
      explode: { direction: [-1.2, 0, 0], distance: 1 },
    }),

    new Piece({
      id: "P002",
      name: "Lateral Direita",
      type: "LATERAL",
      moduleId: "MOD001",
      dimensions: { width: 800, height: 700, thickness: 18 },
      materialId: "MAT001",
      edges: { top: 1, bottom: 1, left: 1, right: 1 },
      position: [0.56, 0.5, 0],
      explode: { direction: [1.2, 0, 0], distance: 1 },
    }),

    new Piece({
      id: "P003",
      name: "Porta",
      type: "PORTA",
      moduleId: "MOD001",
      dimensions: { width: 700, height: 680, thickness: 18 },
      materialId: "MAT002",
      edges: { top: 1, bottom: 1, left: 1, right: 1 },
      position: [0, 0.5, 0.44],
      explode: { direction: [0, 0, 1.4], distance: 1 },
    }),
  ],
});

const demoProject = new Project({
  id: "PRJ001",
  name: "Projeto Demonstração",
  clientName: "Cliente Teste",
  modules: [moduloTeste],
  materials: [branco, freijo],
});

export default demoProject;