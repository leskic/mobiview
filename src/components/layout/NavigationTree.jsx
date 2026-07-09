import demoProject from "../../data/demoProject";

function NavigationTree({
  selectedPiece,
  onSelectPiece
}) {

  return (
    <div className="navigation-tree">

      <h3>
        📁 Projeto
      </h3>


      {demoProject.modules.map((module) => (

        <div
          key={module.id}
          className="tree-module"
        >

          <div className="tree-module-title">
            📦 {module.name}
          </div>


          <div className="tree-pieces">

            {module.pieces.map((piece)=>(

              <button
                key={piece.id}
                className={
                  selectedPiece?.id === piece.id
                  ? "tree-piece selected"
                  : "tree-piece"
                }
                onClick={() =>
                  onSelectPiece(piece)
                }
              >

                📄 {piece.name}

              </button>

            ))}

          </div>

        </div>

      ))}


    </div>
  );
}


export default NavigationTree;