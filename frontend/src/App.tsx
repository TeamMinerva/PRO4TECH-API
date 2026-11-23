import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { PrivateRoute, PublicOnlyRoute } from "./components/PrivateRoute";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import CadastroProjeto from "./pages/CadastroProjeto";
import Galeria from "./pages/Galeria";
import DetalhesProjeto from "./pages/DetalhesProjeto";
import DesenvolvedorDetalhes from "./pages/DesenvolvedorDetalhes";
import Home from "./pages/Home";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/galeria" element={<Galeria />} />
          <Route path="/cadastro-projeto" element={<CadastroProjeto />} />
          <Route path="/desenvolvedores" element={<Galeria />} />
          <Route path="/desenvolvedores/:id" element={<DesenvolvedorDetalhes />} />
          <Route path="/projetos" element={<Galeria />} />
          <Route path="/projetos/:id" element={<DetalhesProjeto />} />
          <Route path="/projetos/:id/editar" element={<CadastroProjeto />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
