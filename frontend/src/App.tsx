import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Conectando ao backend...");

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

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          Pro4Tech
        </h1>

        <p className="mt-4">
          {message}
        </p>
      </div>
    </div>
  );
}

export default App;