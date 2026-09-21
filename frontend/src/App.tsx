import { useEffect, useState } from "react";
import CadastroProjeto from "./pages/CadastroProjeto";

function App() {
  const [message, setMessage] = useState("Conectando ao backend...");

  const [mostrarCadastro, setMostrarCadastro] = useState(false);

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

  if (mostrarCadastro) {
    return <CadastroProjeto />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1c1c1c] text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          Pro4Tech
        </h1>

        <p className="mt-4 mb-8 text-gray-400">
          Status: {message}
        </p>

        <button
          onClick={() => setMostrarCadastro(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          Acessar Cadastro de Projetos
        </button>
      </div>
    </div>
  );
}

export default App;