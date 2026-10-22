import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { createBug } from "../services/bugService";
import {
  getDevelopersGallery,
  getProjectsForBug,
  updateDeveloperBug,
  type Developer,
  type DeveloperBug,
  type DeveloperProject,
} from "../services/developerService";

interface Props {
  developer: Developer;
  bug: DeveloperBug | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ModalBugDesenvolvedor({
  developer,
  bug,
  onClose,
  onSaved,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  const [editing, setEditing] = useState(bug === null);
  const [title, setTitle] = useState(bug?.title ?? "");
  const [description, setDescription] = useState(bug?.description ?? "");
  const [solution, setSolution] = useState(bug?.solution ?? "");
  const [projectId, setProjectId] = useState(
    bug ? String(bug.projectId) : "",
  );
  const [developerId, setDeveloperId] = useState(String(developer.id));

  const [developers, setDevelopers] = useState<Developer[]>([developer]);
  const [projects, setProjects] = useState<DeveloperProject[]>([]);
  const [optionsReady, setOptionsReady] = useState(false);
  const [optionsError, setOptionsError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();

    return () => element?.close();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getDevelopersGallery(controller.signal),
      getProjectsForBug(controller.signal),
    ])
      .then(([loadedDevelopers, loadedProjects]) => {
        if (controller.signal.aborted) return;

        setDevelopers(loadedDevelopers);
        setProjects(loadedProjects);
        setOptionsReady(true);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setOptionsError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar projetos e desenvolvedores.",
          );
        }
      });

    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing || saving || !optionsReady) return;

    setError("");

    if (!title.trim() || !description.trim() || !solution.trim()) {
      setError("Preencha o título, a descrição do problema e a solução.");
      return;
    }

    if (!projectId || !developerId) {
      setError("Selecione o projeto e o desenvolvedor responsável.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      solution: solution.trim(),
      projectId: Number(projectId),
      developerId: Number(developerId),
    };

    setSaving(true);

    try {
      if (bug) {
        await updateDeveloperBug(bug.id, payload);
      } else {
        await createBug(payload);
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar o bug.",
      );
    } finally {
      setSaving(false);
    }
  }

  const modalTitle = !bug
    ? "Cadastrar bug"
    : editing
      ? "Editar bug"
      : "Visualizar bug";

  return (
    <dialog
      ref={dialog}
      className="dev-dialog"
      aria-labelledby="developer-bug-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <form className="dev-form" onSubmit={submit}>
        <header className="dev-dialog-header">
          <h2 id="developer-bug-title">{modalTitle}</h2>
          <button
            type="button"
            className="dev-icon"
            onClick={onClose}
            disabled={saving}
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="dev-form-row">
          <label className="dev-field">
            Título
            <input
              required
              value={title}
              readOnly={!editing}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título"
            />
          </label>

          <label className="dev-field">
            Dev. responsável
            <select
              required
              value={developerId}
              disabled={!editing || saving}
              onChange={(event) => setDeveloperId(event.target.value)}
            >
              <option value="">Selecione</option>
              {developers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="dev-field">
          Projeto
          <select
            required
            value={projectId}
            disabled={!editing || saving}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Selecione o projeto</option>

            {bug && !projects.some((item) => item.id === bug.projectId) && (
              <option value={bug.projectId}>{bug.projectName}</option>
            )}

            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="dev-field">
          Descrição do problema
          <textarea
            required
            value={description}
            readOnly={!editing}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descrição do problema"
          />
        </label>

        <label className="dev-field">
          Solução
          <textarea
            required
            value={solution}
            readOnly={!editing}
            onChange={(event) => setSolution(event.target.value)}
            placeholder="Solução"
          />
        </label>

        {optionsError && (
          <p className="dev-error" role="alert">{optionsError}</p>
        )}

        {error && <p className="dev-error" role="alert">{error}</p>}

        <footer className="dev-dialog-footer">
          <button
            type="button"
            className="dev-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Voltar
          </button>

          {!editing ? (
            <button
              key="editar-bug"
              type="button"
              className="dev-primary"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setEditing(true);
              }}
            >
              Editar
            </button>
          ) : (
            <button
              key="salvar-bug"
              type="submit"
              className="dev-primary"
              disabled={saving || !optionsReady}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          )}
        </footer>
      </form>
    </dialog>
  );
}