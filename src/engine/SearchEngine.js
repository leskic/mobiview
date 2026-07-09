class SearchEngine {
  static searchPiece(project, query) {
    if (!query) return [];

    const q = query.toLowerCase();

    const result = [];

    for (const module of project.modules) {
      for (const piece of module.pieces) {
        if (
          piece.id.toLowerCase().includes(q) ||
          piece.name.toLowerCase().includes(q)
        ) {
          result.push({
            module,
            piece,
          });
        }
      }
    }

    return result;
  }

  static searchModule(project, query) {
    if (!query) return [];

    const q = query.toLowerCase();

    return project.modules.filter((module) =>
      module.name.toLowerCase().includes(q)
    );
  }
}

export default SearchEngine;