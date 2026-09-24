import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./telas/Login";
import Cadastro from "./telas/Cadastro";
import CadastroProjeto from "./telas/CadastroProjeto";
import Galeria from "./telas/Galeria";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/cadastro-projeto" element={<CadastroProjeto />} />
        <Route path="/galeria" element={<Galeria />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
