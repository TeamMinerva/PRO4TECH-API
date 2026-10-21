## Definition of Ready (DoR)

Uma User Story é considerada **Ready** quando possui informações suficientes para que a equipe consiga iniciar seu desenvolvimento sem impedimentos ou dúvidas relevantes.

Para entrar em uma Sprint, a User Story deve atender aos seguintes critérios:

* [ ] A User Story está descrita de forma clara e compreensível.
* [ ] O objetivo e o valor para o usuário estão definidos.
* [ ] Os critérios de aceitação estão definidos.
* [ ] Os requisitos necessários para implementação estão identificados.
* [ ] As dependências com outras User Stories ou funcionalidades foram identificadas.
* [ ] Não existem ambiguidades ou dúvidas que impeçam o início do desenvolvimento.
* [ ] A prioridade foi definida.
* [ ] A User Story foi estimada pela equipe.
* [ ] A User Story possui tamanho adequado para ser desenvolvida dentro da Sprint.
* [ ] Os dados, ferramentas e acessos necessários estão disponíveis.
* [ ] A equipe compreende o que precisa ser desenvolvido.
* [ ] A User Story foi validada pelo Product Owner.

### Aplicação da DoR no MVP

A Definition of Ready é aplicada a todas as Sprints. Entretanto, os critérios podem exigir atenção específica de acordo com a etapa do MVP:

**Sprint 1 — Base de Conhecimento**

* [ ] Campos e informações que devem ser cadastrados estão definidos.
* [ ] Relacionamentos entre projeto, épico, feature, PBI e desenvolvedor estão definidos.
* [ ] Regras de validação dos dados estão estabelecidas.

**Sprint 2 — Reutilização do Conhecimento**

* [ ] As informações que devem ser apresentadas nos detalhes de projetos e desenvolvedores estão definidas.
* [ ] O contexto que será disponibilizado para os chats de IA está definido.
* [ ] Os critérios para identificar projetos semelhantes estão definidos.
* [ ] Estrutura para registro de problemas e soluções está definida.

**Sprint 3 — Assistente de IA**

* [ ] O comportamento esperado da IA está definido.
* [ ] As informações que a IA pode consultar estão estabelecidas.
* [ ] Os tipos de inconsistências e ambiguidades que devem ser identificados estão definidos.
* [ ] Os limites da atuação da IA como ferramenta de apoio ao PO estão estabelecidos.

---

## Definition of Done (DoD)

Uma User Story é considerada **Done** quando sua implementação está concluída, validada e integrada ao sistema, atendendo aos critérios de aceitação definidos.

Para ser considerada concluída, a User Story deve atender aos seguintes critérios:

* [ ] Todos os requisitos definidos na User Story foram implementados.
* [ ] Todos os critérios de aceitação foram atendidos.
* [ ] A funcionalidade está integrada ao sistema.
* [ ] Os dados são armazenados e recuperados corretamente, quando aplicável.
* [ ] As validações necessárias foram implementadas.
* [ ] Os principais cenários de uso foram testados.
* [ ] Os principais cenários de erro foram tratados.
* [ ] Não existem erros conhecidos que impeçam o funcionamento da funcionalidade.
* [ ] O código segue os padrões e tecnologias definidos para o projeto.
* [ ] A interface está consistente com os padrões visuais do sistema, quando aplicável.
* [ ] A documentação necessária foi atualizada.
* [ ] As alterações foram versionadas no Git.
* [ ] A funcionalidade foi validada pelo Product Owner.
* [ ] A User Story está pronta para ser apresentada e utilizada.

### Aplicação da DoD no MVP

**Sprint 1 — Base de Conhecimento**

Ao final da Sprint, o usuário deve conseguir acessar o sistema, cadastrar desenvolvedores e projetos e estruturar seus backlogs por meio de épicos, features e PBIs, além de consultar os registros existentes.

**Sprint 2 — Reutilização do Conhecimento**

Ao final da Sprint, o usuário deve conseguir consultar os detalhes de projetos e desenvolvedores, registrar problemas e soluções e utilizar a IA para consultar informações contextualizadas e identificar projetos semelhantes.

**Sprint 3 — Assistente de IA**

Ao final da Sprint, o usuário deve conseguir interagir com a IA durante o cadastro de projetos, solicitar análises, esclarecer dúvidas e receber informações baseadas na base de conhecimento, incluindo identificação de inconsistências, ambiguidades e conhecimentos relevantes para auxiliar sua tomada de decisão.

### Critério geral de conclusão do MVP

O MVP é considerado concluído quando as funcionalidades planejadas para as três Sprints estiverem implementadas, integradas e validadas, permitindo o fluxo completo de:

**Registrar conhecimento → Organizar projetos → Consultar conhecimento → Reutilizar experiências anteriores → Receber auxílio da IA durante o trabalho do PO.**
