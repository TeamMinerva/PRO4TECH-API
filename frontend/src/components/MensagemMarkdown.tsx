import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Estilos de cada elemento (sem plugin typography). O react-markdown não
// interpreta HTML cru, então a resposta da IA não consegue injetar HTML/JS.
const componentes: Components = {
  h1: (p) => <h1 className="mt-3 mb-2 text-[18px] font-semibold first:mt-0" {...omitirNo(p)} />,
  h2: (p) => <h2 className="mt-3 mb-2 text-[16px] font-semibold first:mt-0" {...omitirNo(p)} />,
  h3: (p) => <h3 className="mt-3 mb-1.5 text-[15px] font-semibold first:mt-0" {...omitirNo(p)} />,
  h4: (p) => <h4 className="mt-2 mb-1 text-[14px] font-semibold first:mt-0" {...omitirNo(p)} />,
  p: (p) => <p className="my-2 first:mt-0 last:mb-0" {...omitirNo(p)} />,
  ul: (p) => <ul className="my-2 list-disc space-y-1 pl-5" {...omitirNo(p)} />,
  ol: (p) => <ol className="my-2 list-decimal space-y-1 pl-5" {...omitirNo(p)} />,
  li: (p) => <li className="pl-0.5" {...omitirNo(p)} />,
  strong: (p) => <strong className="font-semibold text-white" {...omitirNo(p)} />,
  em: (p) => <em className="italic" {...omitirNo(p)} />,
  hr: () => <hr className="my-3 border-[#3f3f3f]" />,
  blockquote: (p) => (
    <blockquote className="my-2 border-l-2 border-[#ED6A32] pl-3 text-[#d6d6d6]" {...omitirNo(p)} />
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#ED6A32] underline hover:text-[#ff8555]"
    >
      {children}
    </a>
  ),
  pre: (p) => (
    <pre className="my-2 overflow-x-auto rounded-[8px] bg-[#1b1d1e] p-3 text-[13px]" {...omitirNo(p)} />
  ),
  code: ({ className, children }) => {
    const bloco = /language-/.test(className ?? '') || String(children).includes('\n');
    return bloco ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-[#1b1d1e] px-1.5 py-0.5 text-[13px]">{children}</code>
    );
  },
  table: (p) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" {...omitirNo(p)} />
    </div>
  ),
  th: (p) => (
    <th className="border border-[#3f3f3f] bg-[#1b1d1e] px-2 py-1 text-left font-semibold" {...omitirNo(p)} />
  ),
  td: (p) => <td className="border border-[#3f3f3f] px-2 py-1" {...omitirNo(p)} />,
};

// O react-markdown passa a prop `node` (AST) para cada componente; ela não deve ir para o DOM.
function omitirNo<T extends { node?: unknown }>(props: T): Omit<T, 'node'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { node, ...resto } = props;
  return resto;
}

export function MensagemMarkdown({ conteudo }: { conteudo: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
      {conteudo}
    </ReactMarkdown>
  );
}
