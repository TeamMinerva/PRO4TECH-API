import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Cadastro() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isPasswordTooShort = password.length > 0 && password.length < 6;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await registerUser(email.trim(), password);
      setSuccessMessage("Cadastro realizado com sucesso!");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao realizar cadastro.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="bg-[#191b1c] w-full h-screen overflow-hidden flex items-center p-6 lg:py-10 lg:pl-[50px] lg:pr-[50px]"
      data-node-id="17:44"
      data-name="cadastro"
    >
      <div className="mx-auto w-full max-w-[1280px] lg:h-auto lg:max-h-[calc(100vh-80px)] lg:aspect-[1280/732] flex flex-col-reverse lg:flex-row items-center lg:items-start justify-center lg:justify-between gap-8 sm:gap-10 lg:gap-[50px]">
        <div
          className="hidden lg:block relative h-full max-w-[790px] shrink-0 rounded-[15px] bg-[#141617]"
          style={{ aspectRatio: "790 / 732" }}
          data-node-id="17:45"
        >
          <div
            className="absolute left-[22%] top-[33%] w-[32%] aspect-square"
            style={{ transform: "scaleY(-1)" }}
            data-node-id="17:77"
          >
            <svg viewBox="0 0 250 250" className="absolute inset-0 w-full h-full">
              <defs>
                <clipPath id="sunBottom">
                  <rect x="0" y="0" width="250" height="125" />
                </clipPath>
              </defs>
              <circle cx="125" cy="125" r="85" fill="#ED6A32" clipPath="url(#sunBottom)" />
            </svg>
            <div
              className="absolute left-[6%] top-[6%] w-[88%] h-[88%] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(237,106,50,0.55) 0%, rgba(237,106,50,0) 70%)",
                filter: "blur(20px)",
              }}
              data-node-id="17:57"
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 flex flex-col gap-6 sm:gap-8 lg:gap-10 lg:h-full lg:justify-between"
        >
          <div className="flex flex-col gap-16 sm:gap-24 md:gap-32 lg:gap-40">
            <div className="w-full max-w-[370px] mt-3 lg:mt-4 self-end text-right">
              <p
                className="font-normal leading-none text-[14px] sm:text-[17px] md:text-[19px] lg:text-[22px] text-white whitespace-nowrap"
                style={{ fontFamily: "Outfit, sans-serif" }}
                data-node-id="17:46"
              >
                pro<span style={{ fontFamily: "Actor, sans-serif" }}>4</span>tech
              </p>
            </div>

            <div className="flex flex-col gap-10 sm:gap-16 md:gap-20 lg:gap-25">
              <p
                className="w-full text-center font-normal leading-none text-[22px] sm:text-[30px] md:text-[38px] lg:text-[44px] text-white whitespace-nowrap"
                style={{ fontFamily: "Outfit, sans-serif" }}
                data-node-id="17:47"
              >
                começar.
              </p>

              <div className="w-full flex flex-col gap-6 sm:gap-8 lg:gap-10">
                <div className="w-full flex flex-col gap-2 transition-transform duration-200 focus-within:-translate-y-1">
                  <div className="w-full max-w-[370px]">
                    <input
                      id="email"
                      type="email"
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      className="peer w-full bg-transparent border-0 p-0 m-0 text-[14px] sm:text-[16px] lg:text-[17px] text-white placeholder-[#3d3f40] outline-none"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      data-node-id="17:48"
                      disabled={loading}
                    />
                  </div>
                  <div
                    className="h-px bg-[#3d3f40] transition-colors duration-200 peer-focus:bg-[#ED6A32]"
                    style={{ width: "calc(100% - 62.5px)" }}
                    data-node-id="17:49"
                  />
                </div>
                <div className="w-full flex flex-col gap-2 transition-transform duration-200 focus-within:-translate-y-1">
                  <div className="w-full max-w-[370px]">
                    <input
                      id="password"
                      type="password"
                      placeholder="Senha"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      className="peer w-full bg-transparent border-0 p-0 m-0 text-[14px] sm:text-[16px] lg:text-[17px] text-white placeholder-[#3d3f40] outline-none"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      data-node-id="17:50"
                      disabled={loading}
                    />
                  </div>
                  <div
                    className={`h-px transition-colors duration-200 ${
                      isPasswordTooShort
                        ? "bg-[#ED6A32]"
                        : "bg-[#3d3f40] peer-focus:bg-[#ED6A32]"
                    }`}
                    style={{ width: "calc(100% - 62.5px)" }}
                    data-node-id="17:51"
                  />
                </div>

                {(error || isPasswordTooShort || successMessage) && (
                  <div className="w-full max-w-[370px] -mt-5 transition-opacity duration-200">
                    <p
                      className={`text-[13px] sm:text-[14px] lg:text-[15px] font-normal leading-tight ${
                        successMessage ? "text-[#4ade80]" : "text-[#ED6A32]"
                      }`}
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {successMessage ||
                        (isPasswordTooShort
                          ? "A senha deve ter no mínimo 6 caracteres."
                          : error)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col gap-6 sm:gap-8 lg:gap-10">
            <button
              type="submit"
              disabled={loading || isPasswordTooShort}
              className="self-end px-3 sm:px-4 lg:px-5 h-[34px] sm:h-[38px] lg:h-[40px] min-w-[90px] sm:min-w-[100px] lg:min-w-[110px] bg-[#141617] rounded-[10px] sm:rounded-[12px] text-white text-[13px] sm:text-[14px] lg:text-[15px] transition-transform duration-200 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              style={{ fontFamily: "Poppins, sans-serif" }}
              data-node-id="23:85"
            >
              {loading ? "Cadastrando..." : "Registrar"}
            </button>
            <Link
              to="/"
              className="block text-right text-[#3d3f40] text-[14px] sm:text-[16px] lg:text-[17px] whitespace-nowrap transition-colors hover:text-[#ED6A32]"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Já possui acesso? Entrar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
