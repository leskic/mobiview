export async function loadProject(file) {
  const text = await file.text();

  const project = JSON.parse(text);

  const hasPieces =
    Array.isArray(project.pieces) ||
    project.modules?.some?.((module) => Array.isArray(module.pieces));

  if (!project.version || !hasPieces) {
    throw new Error("Arquivo inválido.");
  }

  return project;
}
