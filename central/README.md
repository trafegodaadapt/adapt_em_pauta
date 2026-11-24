# Central Adapt em Pauta — V5

Revisão de 24/11/2026. [Abrir a Central](https://trafegodaadapt.github.io/adapt_em_pauta/central/).

A consulta é pública, sem e-mail. Quem tiver o link pode ler sugestões e resultados. As alterações exigem a chave dos organizadores. As três sugestões recebidas antes desta revisão foram preservadas sem mudanças editoriais.

## Como usar

1. Clicar em **Entrar no modo de edição** e digitar a chave ou carregar seu arquivo .txt. Se a entrada for aberta ao tentar salvar uma pauta, o preenchimento fica mantido e a ação continua depois da validação.
2. Em **Nova edição**, informar número, tema e data prevista. A próxima identificação é sugerida a partir do arquivo. Uma edição histórica pode manter a data desconhecida em branco.
3. Em **Sugestões**, revisar a contribuição, selecionar o status e vincular à edição. O planejamento agrupa as pautas selecionadas por edição e permite exportar CSV com texto, links e situação do mural.
4. Em **Mural dos leitores**, liberar ou retirar uma indicação. A liberação depende do consentimento do leitor. A seleção da pauta e a exibição no mural são decisões separadas. A área **Mural no jornal** mostra a prévia do que já está liberado.
5. Usar notas privadas para as observações da redação; criar ou encerrar enquetes; abrir ou fechar avaliações por edição.

Editar o cadastro de uma edição atualiza o planejamento e o arquivo. Isso não publica automaticamente o HTML do jornal: ao cadastrar uma edição já publicada, informar seu endereço disponível na web.

## Acesso dos organizadores

Não há login por e-mail. Com “Manter o acesso nesta aba”, a chave fica em sessionStorage por até oito horas desde a entrada, inclusive após atualizar a página. Não é salva em localStorage. Fechar a aba ou usar Bloquear edição encerra o acesso. Sem essa opção, recarregar também apaga o acesso.

A chave deve circular separadamente entre os organizadores. Não está no HTML, no repositório ou no ZIP público. O servidor a confere em cada alteração. A validação de acesso não depende apenas de esconder botões na interface.

## Quatro temas

Arte vetorial original e padrões inspirados nas referências enviadas: **Verão retrô** (creme, azul, vermelho, sol, palmeira e xadrez), **Dark emo** (roxo, preto, lilás, caveira e coração xadrez), **Revista retrô** (papel, azul envelhecido e tipografia de pôster) e **Jornal P&B** (serifas, filetes e composição em preto e branco). O tema fica salvo neste navegador.

O CSS está limitado à Central. A revisão não alterou o jornal publicado nem as edições anteriores.

## Banco e participação

Projeto Supabase `tumkwdobixtleqwhvdpu`, organização `trafego da adapt`. `config.js` contém apenas URL e chave publicável. Nenhuma chave secret/service_role está no cliente.

O schema privado `aep_hub` tem RLS em todas as tabelas e acesso direto revogado. Operações públicas usam wrappers SECURITY INVOKER e funções específicas no schema privado, com permissões explícitas e search_path fixo. As funções de edição exigem a chave. Notas internas não entram na consulta pública. O schema privado deve continuar fora dos schemas expostos pela Data API.

O aviso informativo [RLS sem políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) é esperado nessa configuração privada: tabelas negam acesso direto e as operações autorizadas passam pelas RPCs.

O leitor pode sugerir título, texto e link HTTPS, autorizar a exibição no mural, avaliar uma edição aberta e responder enquetes. Votos usam um identificador aleatório de navegador, armazenado como hash no servidor. Reenviar atualiza a escolha. Limpar os dados ou trocar de navegador permite uma nova identificação: isso não garante uma pessoa por voto.

Os resultados não aparecem na tela de votação do jornal; podem ser consultados por quem tem o link da Central, conforme a opção pública escolhida. Comentários de avaliações não incluem identidade do avaliador.

Migrações da revisão: `database/007_editor_editions.sql` e `008_edition_optional_date.sql`. Já aplicadas no projeto ativo. As migrações 001/002 e o antigo teste de banco preservam um modelo histórico com e-mail, que não deve ser aplicado neste projeto ativo. Não reaplicar migrações já registradas.

## Compilação e verificações

`node scripts/build.mjs` compila JS/CSS e copia as quatro artes de tema. A pasta de publicação é `public/`, hospedada em `central/` no GitHub Pages.

As verificações da revisão estão no workspace, em `revisao/v4`:

- Leitura do banco real e entrada com a chave real, sem modificar sugestões.
- 168 combinações: quatro temas, sete áreas e seis larguras de tela.
- Fluxos editoriais em uma simulação HTTP isolada: retomada após entrada, edição criada dentro da pauta, vínculo, mural, consentimento, notas, concorrência, CSV e enquetes.
- Falha de conexão com nova tentativa, sem formulário de e-mail; clique durante o carregamento inicial.
- Criação e edição no PostgreSQL real, chave incorreta, duplicidade, link obrigatório e data histórica opcional testados em transação com rollback. Nenhum registro de teste permaneceu.

O relatório `qa.json` corresponde aos testes locais; a confirmação da versão efetivamente publicada fica em `publicacao-confirmada.json`.

## Layout V4.1 · 23/11/2026

Composição mais aberta: cabeçalho sem moldura, indicadores em faixa, sugestões em lista e separadores discretos. Menu com cantos suaves, botões arredondados e destaque orgânico para a próxima edição. Os quatro temas e os fluxos editoriais foram preservados. O acabamento fica em `src/layout.css`, carregado após os estilos de tema.


## Participação e fechamento · V5

A área do leitor tem indicação rápida, história completa, votação, mural e Meus envios. A consulta de envios usa o identificador deste navegador; limpar os dados ou trocar de navegador muda a lista. O setor é opcional. A publicação no jornal continua exigindo consentimento e liberação editorial.

A Central oferece três ações iniciais: revisar entradas, montar a próxima edição e conferir o fechamento. Em Planejamento, o checklist reúne edição, vínculo, autorização, mural e enquete; os indicadores mostram contribuições, publicações, autores informados e setores representados, sem ranking individual. A contagem de autores usa nome e setor, sem garantia de identidade única.

Ao revisar uma contribuição, “Versão para o jornal” permite editar título, texto, link e capa. O texto original fica preservado. Sugestões arquivadas ficam fora do mural. O status Publicada exige uma edição já publicada e com link HTTPS válido. O cadastro da edição não envia o HTML ao GitHub automaticamente.

“Organizar quadros” define chamada, até três destaques, quadros ativos e a pergunta que continua na próxima edição. Os quadros disponíveis são Vocês indicaram, No repeat do time, Fora do expediente, Valeu por essa, A pergunta da semana e Missão secundária. Para alternar quadros semanais e quinzenais, selecione os que entram em cada edição.

Enquetes podem ter resultados públicos na Central ou reservados aos editores. No modo reservado, os totais são removidos da resposta pública do servidor, inclusive de cada opção. A chave permite consultar. Depois de encerrar, a redação pode divulgar o resultado no jornal ou recolher a divulgação.

A edição 004 está cadastrada como rascunho previsto para 27/11/2026. As duas indicações autorizadas de Eduarda estão vinculadas a ela, com versões editoriais e imagens oficiais de divulgação. Uma pergunta real sobre os quadros está aberta. Nenhuma sugestão foi marcada como publicada nesta prévia.

A prévia GTA está em /previas/gta-vi.html. A missão é opcional e salva o progresso apenas neste navegador; a lembrança é gerada localmente. As fotos originais do álbum não têm títulos individuais.

Migrações desta revisão: supabase/migrations/20261124140216_participacao_editorial.sql e 20261124141800_fechar_ciclo_publicacao.sql. Já aplicadas no projeto conectado; não reaplicar. Os testes de gravação no PostgreSQL rodam em transação com rollback. Os testes de envio e votação no navegador usam respostas HTTP isoladas e não registram contribuições falsas no banco real.

Imagens de divulgação: Disney+ (https://www.disneyplus.com/whats-on/entity-f1c31566-ec05-4d30-b23f-3177442233f4) e site oficial de Jogos Vorazes (https://hungergames.movie/), consultados em 24/11/2026. As artes GTA da equipe permanecem separadas dos registros fotográficos reais.
