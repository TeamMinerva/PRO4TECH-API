import { useEffect, useState } from "react";
import CadastroProjeto from "./pages/CadastroProjeto";
import Galeria from "./pages/Galeria";

function App() {
  const [message, setMessage] = useState("Conectando ao backend...");

  const caminho = window.location.pathname;

  useEffect(() => {
    fetch("http://localhost:3000/api/test")
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch(() => {
        setMessage("Não foi possível conectar ao backend.");
      });
  }, []);

  
  if (caminho === "/cadastro-projeto") {
    return <CadastroProjeto />;
  }

 
  return <Galeria />;
}

export default App;