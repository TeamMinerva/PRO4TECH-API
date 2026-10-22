import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  createDeveloper,
  getDevelopersGallery,
  type Developer,
} from "../services/developerService";
import { useDropdown } from "../hooks/useDropdown";
import { useTecnologias } from "../hooks/useTecnologias";
import { PainelTecnologias } from "../components/PainelTecnologias";
import { TagRemovivel } from "../components/TagRemovivel";
import "./DesenvolvedorDetalhes.css";

export default function GaleriaDesenvolvedor() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    getDevelopersGallery(controller.signal)
      .then(setDevelopers)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar os desenvolvedores.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [reload]);

  return (
    <section className="dev-gallery">
      <button
        type="button"
        className="dev-new-developer"
        onClick={() => setModalOpen(true)}
      >
        Novo desenvolvedor
      </button>

      {loading && <p className="dev-muted">Carregando desenvolvedores...</p>}

      {error && (
        <div className="dev-feedback">
          <p className="dev-error" role="alert">{error}</p>
          <button
            type="button"
            className="dev-secondary"
            onClick={() => setReload((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && developers.length === 0 && (
        <p className="dev-muted">Nenhum desenvolvedor cadastrado.</p>
      )}

      {!error && (
        <div className="dev-cards">
          {developers.map((developer) => (
            <Link
              key={developer.id}
              to={`/desenvolvedores/${developer.id}`}
              className="dev-card"
              aria-label={`Ver detalhes de ${developer.name}`}
            >
              <ArrowUpRight
                className="dev-card-arrow"
                size={18}
                aria-hidden="true"
              />
              <span className="dev-card-name">{developer.name}</span>
              <span className="dev-card-status">
                {developer.active ? "Ativo" : "Inativo"}
              </span>
            </Link>
          ))}
        </div>
      )}

      {modalOpen && (
        <ModalNovoDesenvolvedor
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            setReload((value) => value + 1);
          }}
        />
      )}
    </section>
  );
}

interface ModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function ModalNovoDesenvolvedor({ onClose, onCreated }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [technologyIds, setTechnologyIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const technologies = useTecnologias();
  const dropdown = useDropdown();

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();

    return () => element?.close();
  }, []);

  function toggleTechnology(id: number) {
    setTechnologyIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setError("");

    if (!status) {
      setError("Selecione um status.");
      return;
    }

    const validIds = technologyIds.filter((id) =>
      technologies.tecnologias.some((technology) => technology.id === id),
    );

    if (validIds.length === 0) {
      setError("Selecione ao menos uma tecnologia.");
      return;
    }

    setSaving(true);

    try {
      await createDeveloper({
        name: name.trim(),
        active: status === "active",
        technologyIds: validIds,
      });

      onCreated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível cadastrar o desenvolvedor.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="dev-dialog"
      aria-labelledby="new-developer-title"
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
          <h2 id="new-developer-title">Novo desenvolvedor</h2>
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

        <label className="dev-field">
          Nome
          <input
            required
            minLength={2}
            maxLength={120}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do desenvolvedor"
          />
        </label>

        <label className="dev-field">
          Status
          <select
            required
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Selecione</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>

        <div className="dev-field">
          <span>Tecnologias</span>

          <div className="relative" ref={dropdown.ref}>
            <button
              type="button"
              className="dev-select-button"
              onClick={() => dropdown.setAberto(!dropdown.aberto)}
              aria-expanded={dropdown.aberto}
            >
              {technologies.carregando
                ? "Carregando tecnologias..."
                : "Selecione ou crie tecnologias"}
            </button>

            {dropdown.aberto && (
              <div className="dev-technology-dropdown">
                <PainelTecnologias
                  gerenciador={technologies}
                  selecionadas={technologyIds}
                  onAlternar={toggleTechnology}
                />
              </div>
            )}
          </div>

          <div className="dev-tags">
            {technologyIds.map((id) => (
              <TagRemovivel
                key={id}
                label={
                  technologies.tecnologias.find((item) => item.id === id)?.name
                  ?? String(id)
                }
                onRemove={() => toggleTechnology(id)}
              />
            ))}
          </div>
        </div>

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

          <button type="submit" className="dev-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}