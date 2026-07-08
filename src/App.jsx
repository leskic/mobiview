import "./App.css";

import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Viewer from "./components/viewer/Viewer";
import Toolbar from "./components/layout/Toolbar";

function App() {
  return (
    <div className="app">
      <Header />

      <Sidebar />

      <Viewer />

      <Toolbar />
    </div>
  );
}

export default App;