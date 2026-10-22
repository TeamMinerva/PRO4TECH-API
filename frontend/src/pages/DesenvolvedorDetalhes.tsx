import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, PanelRightOpen, Plus } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import {
  getDeveloperById,
  type DeveloperBug,
  type DeveloperDetails,
} from "../services/developerService";
import { ChatDesenvolvedor } from "../components/ChatDesenvolvedor";
import { ModalBugDesenvolvedor } from "../components/ModalBugDesenvolvedor";
import "./DesenvolvedorDetalhes.css";

const PROJECT_STATUS: Record<string, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em andamento",
  DONE: "Concluído",
};

export default function DesenvolvedorDetalhes() {
  const { id } = useParams();
  const developerId = Number(id);

  if (!Number.isSafeInteger(developerId) || developerId <= 0) {
    return (
      <main className="dev-page dev-feedback">
        <p className="dev-error">Identificador de desenvolvedor inválido.</p>
        <Link to="/desenvolvedores" className="dev-back">
          Voltar para desenvolvedores
        </Link>
      </main>
    );
  }

  return <ConteudoDesenvolvedor key={developerId} developerId={developerId} />;
}

function ConteudoDesenvolvedor({
  developerId,
}: {
  developerId: number;
}) {
  const [developer, setDeveloper] = useState<DeveloperDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [tab, setTab] = useState<"projects" | "bugs">("projects");
  const [chatOpen, setChatOpen] = useState(true);

  // undefined: modal fechado; null: novo bug; objeto: bug existente.
  const [selectedBug, setSelectedBug] =
    useState<DeveloperBug | null | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    getDeveloperById(developerId, controller.signal)
      .then(setDeveloper)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar o desenvolvedor.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [developerId, reload]);

  if (!developer) {
    return (
      <main className="dev-page dev-feedback">
        <Link to="/desenvolvedores" className="dev-back">
          <ArrowLeft size={20} /> Voltar
        </Link>

        {loading && <p className="dev-muted">Carregando desenvolvedor...</p>}

        {error && (
          <>
            <p className="dev-error" role="alert">{error}</p>
            <button
              type="button"
              className="dev-secondary"
              onClick={() => setReload((value) => value + 1)}
            >
              Tentar novamente
            </button>
          </>
        )}
      </main>
    );
  }

  return (
    <main className={`dev-page dev-layout ${chatOpen ? "dev-layout--chat" : ""}`}>
      <section className="dev-profile">
        <div className="dev-topbar">
          <Link
            to="/desenvolvedores"
            className="dev-back"
            aria-label="Voltar para desenvolvedores"
          >
            <ArrowLeft size={22} />
          </Link>

          {!chatOpen && (
            <button
              type="button"
              className="dev-icon"
              onClick={() => setChatOpen(true)}
              aria-label="Abrir chat"
              title="Abrir chat"
            >
              <PanelRightOpen size={24} />
            </button>
          )}
        </div>

        <div className="dev-profile-content">
          <h1>{developer.name}</h1>

          <p className="dev-status-line">
            <span className="dev-muted">Status</span>
            <span>{developer.active ? "Ativo" : "Inativo"}</span>
          </p>

          <div className="dev-competencies">
            <p className="dev-muted">Competências</p>

            <div className="dev-tags">
              {developer.technologies.map((technology) => (
                <span className="dev-tag" key={technology.id}>
                  {technology.name}
                </span>
              ))}

              {developer.technologies.length === 0 && (
                <span className="dev-muted">
                  Nenhuma competência cadastrada.
                </span>
              )}
            </div>
          </div>

          {error && <p className="dev-error" role="alert">{error}</p>}
          {loading && <p className="dev-muted">Atualizando informações...</p>}

          <div className="dev-section-toolbar">
            <nav className="dev-tabs" aria-label="Informações do desenvolvedor">
              <button
                type="button"
                className={tab === "projects" ? "is-active" : ""}
                aria-pressed={tab === "projects"}
                onClick={() => setTab("projects")}
              >
                Projetos
              </button>
              <button
                type="button"
                className={tab === "bugs" ? "is-active" : ""}
                aria-pressed={tab === "bugs"}
                onClick={() => setTab("bugs")}
              >
                Bugs
              </button>
            </nav>

            {tab === "bugs" && (
              <button
                type="button"
                className="dev-new-bug"
                onClick={() => setSelectedBug(null)}
              >
                <Plus size={16} /> Novo bug
              </button>
            )}
          </div>

          {tab === "projects" && (
            <section aria-label="Projetos do desenvolvedor">
              {developer.projects.length === 0 ? (
                <p className="dev-muted">
                  Nenhum projeto vinculado por PBIs ou bugs.
                </p>
              ) : (
                <div className="dev-cards">
                  {developer.projects.map((project) => (
                    <Link
                      key={project.id}
                      to={`/projetos/${project.id}`}
                      className="dev-card"
                      aria-label={`Abrir projeto ${project.name}`}
                    >
                      <ArrowUpRight
                        className="dev-card-arrow"
                        size={18}
                        aria-hidden="true"
                      />
                      <span className="dev-card-name">{project.name}</span>
                      <span className="dev-card-status">
                        {PROJECT_STATUS[project.status] || project.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "bugs" && (
            <section className="dev-bugs" aria-label="Problemas solucionados">
              {developer.bugs.length === 0 ? (
                <p className="dev-muted">
                  Nenhum problema solucionado registrado.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Título</th>
                      {!chatOpen && <th>Descrição</th>}
                      <th>Solução</th>
                    </tr>
                  </thead>
                  <tbody>
                    {developer.bugs.map((bug) => (
                      <tr
                        key={bug.id}
                        onClick={() => setSelectedBug(bug)}
                        title="Visualizar bug"
                      >
                        <td>
                          <button
                            type="button"
                            className="dev-bug-link"
                            aria-label={`Visualizar bug ${bug.title}`}
                          >
                            {bug.title}
                          </button>
                        </td>
                        {!chatOpen && <td>{bug.description}</td>}
                        <td>{bug.solution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
        </div>
      </section>

      <ChatDesenvolvedor
        developerId={developer.id}
        developerName={developer.name}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      {selectedBug !== undefined && (
        <ModalBugDesenvolvedor
          developer={developer}
          bug={selectedBug}
          onClose={() => setSelectedBug(undefined)}
          onSaved={() => {
            setSelectedBug(undefined);
            setReload((value) => value + 1);
          }}
        />
      )}
    </main>
  );
}