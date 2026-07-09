import { createContext, useContext, useState } from "react";
import demoProject from "../data/demoProject";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [project, setProject] = useState(demoProject);

  return (
    <ProjectContext.Provider
      value={{
        project,
        setProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}