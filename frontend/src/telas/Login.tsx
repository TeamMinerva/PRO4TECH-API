import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div
      className="bg-[#191b1c] w-full h-screen overflow-hidden flex items-center p-6 lg:py-10 lg:pl-[50px] lg:pr-[50px] animate-slide-in-left"
      data-node-id="1:2"
      data-name="login"
    >
      <div className="w-full lg:h-full lg:max-h-[732px] flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-between gap-12 lg:gap-[50px]">
        <form className="flex-1 flex flex-col gap-10 lg:h-full lg:justify-between">
          <div className="flex flex-col gap-40">
            <div className="w-full max-w-[370px] mt-3 lg:mt-4">
              <p
                className="font-normal leading-none text-[28px] lg:text-[32px] text-white whitespace-nowrap"
                style={{ fontFamily: "Outfit, sans-serif" }}
                data-node-id="16:5"
              >
                pro<span style={{ fontFamily: "Actor, sans-serif" }}>4</span>tech
              </p>
            </div>

            <div className="flex flex-col gap-25">
              <p
                className="w-full text-center font-normal leading-none text-[48px] lg:text-[64px] text-white whitespace-nowrap"
                style={{ fontFamily: "Outfit, sans-serif" }}
                data-node-id="16:16"
              >
                retomar.
              </p>

              <div className="w-full flex flex-col gap-10">
                <div className="w-full flex flex-col gap-2 transition-transform duration-200 focus-within:-translate-y-1">
                  <div className="w-full max-w-[370px]">
                    <input
                      id="email"
                      type="email"
                      placeholder="E-mail"
                      className="peer w-full bg-transparent border-0 p-0 m-0 text-[20px] text-white placeholder-[#3d3f40] outline-none"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      data-node-id="17:19"
                    />
                  </div>
                  <div
                    className="h-px bg-[#3d3f40] transition-colors duration-200 peer-focus:bg-[#ED6A32]"
                    style={{ width: "calc(100% - 62.5px)" }}
                    data-node-id="17:21"
                  />
                </div>
                <div className="w-full flex flex-col gap-2 transition-transform duration-200 focus-within:-translate-y-1">
                  <div className="w-full max-w-[370px]">
                    <input
                      id="password"
                      type="password"
                      placeholder="Senha"
                      className="peer w-full bg-transparent border-0 p-0 m-0 text-[20px] text-white placeholder-[#3d3f40] outline-none"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                      data-node-id="17:22"
                    />
                  </div>
                  <div
                    className="h-px bg-[#3d3f40] transition-colors duration-200 peer-focus:bg-[#ED6A32]"
                    style={{ width: "calc(100% - 62.5px)" }}
                    data-node-id="17:23"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col gap-10">
            <button
              type="submit"
              className="self-end w-[125px] h-[50px] bg-[#141617] rounded-[10px] text-white text-[20px] transition-transform duration-200 hover:-translate-y-1"
              style={{ fontFamily: "Poppins, sans-serif" }}
              data-node-id="23:84"
            >
              Acessar
            </button>
            <Link
              to="/cadastro"
              className="block text-right text-[#3d3f40] text-[20px] whitespace-nowrap transition-colors hover:text-[#ED6A32]"
              style={{ fontFamily: "Poppins, sans-serif" }}
              data-node-id="48:61"
            >
              Ainda não possui acesso?
            </Link>
          </div>
        </form>
        <div
          className="hidden lg:block relative h-full max-w-[790px] shrink-0 rounded-[15px] bg-[#141617]"
          style={{ aspectRatio: "790 / 732" }}
          data-node-id="16:12"
        >
          <div
            className="absolute left-[29%] top-[33%] w-[42%] aspect-square"
            data-node-id="17:78"
          >
            <svg viewBox="0 0 250 250" className="absolute inset-0 w-full h-full">
              <defs>
                <clipPath id="sunTop">
                  <rect x="0" y="0" width="250" height="125" />
                </clipPath>
              </defs>
              <circle cx="125" cy="125" r="85" fill="#ED6A32" clipPath="url(#sunTop)" />
            </svg>
            <div
              className="absolute left-[6%] top-[6%] w-[88%] h-[88%] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(237,106,50,0.55) 0%, rgba(237,106,50,0) 70%)",
                filter: "blur(20px)",
              }}
              data-node-id="17:33"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
