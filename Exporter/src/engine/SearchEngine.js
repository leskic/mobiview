class SearchEngine {
  constructor(project) {
    this.project = project;
  }

  search(query) {
    if (!query) return null;

    query = query.toLowerCase();

    // Peças
    for (const module of this.project.modules) {
      for (const piece of module.pieces) {

        if (
          piece.id.toLowerCase() === query ||
          piece.name.toLowerCase().includes(query)
        ) {
          return {
            type: "piece",
            object: piece,
          };
        }

      }
    }

    // Módulos
    for (const module of this.project.modules) {

      if (
        module.id.toLowerCase() === query ||
        module.name.toLowerCase().includes(query)
      ) {
        return {
          type: "module",
          object: module,
        };
      }

    }

    return null;
  }
}

export default SearchEngine;