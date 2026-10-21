import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import CadastroProjeto from "./pages/CadastroProjeto";
import Galeria from "./pages/Galeria";
import DetalhesProjeto from "./pages/DetalhesProjeto";
import Home from "./pages/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/cadastro-projeto" element={<CadastroProjeto />} />
        <Route path="/galeria" element={<Galeria />} />
        <Route path="/home" element={<Home />} />
        <Route path="/desenvolvedores" element={<Galeria />} />
        <Route path="/projetos" element={<Galeria />} />
        <Route path="/projetos/:id" element={<DetalhesProjeto />} />
        <Route path="/projetos/:id/editar" element={<CadastroProjeto />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
