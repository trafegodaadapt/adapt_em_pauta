# Central Adapt em Pauta — V3

Dashboard dos organizadores com consulta pública, sem login por e-mail, conforme escolha do usuário. Qualquer pessoa com o link pode ler sugestões e resultados. Alterações editoriais exigem uma chave separada, verificada no banco e guardada apenas em memória na aba.

## Uso

- `public/index.html`: dashboard para hospedagem HTTP/GitHub Pages.
- `public/participar.html`: envio de ideias, avaliações, votos e mural.
- `revisao/conectada/index.html`: HTML autônomo conectado ao banco real, para abrir localmente. Precisa de internet.
- `revisao/previa/index.html`: demonstração explícita com dados fictícios, sem envios reais.

O dashboard reúne visão geral, sugestões, planejamento, arquivo, avaliações e enquetes. Temas: Verão, Dark emo, Jornal P&B e Revista. O tema é salvo no navegador; os dados reais ficam no Supabase.

## Participação e publicação

O leitor informa primeiro nome, setor, tipo, título, texto e link HTTPS opcional. A tela avisa que a Central é pública. Uma autorização adicional permite que a redação exiba a indicação no mural do jornal. O envio gera protocolo somente após confirmação do banco. Repetir o mesmo envio não cria outra sugestão.

Para liberar uma indicação, abrir seu detalhe na Central e clicar em Liberar no mural do jornal. Somente sugestões com consentimento podem aparecer. É possível retirar a indicação depois. Selecionar uma pauta para uma edição é uma decisão independente da liberação no mural.

Avaliações e enquetes aceitam uma resposta por identificador aleatório de navegador. Reenviar atualiza a escolha. Limpar os dados ou usar outro navegador permite outra identificação: isso não garante uma pessoa por voto. O identificador é armazenado como hash no servidor e não aparece na consulta pública. A tela do jornal não exibe totais das votações; eles podem ser vistos por qualquer pessoa com o link da Central. Comentários das avaliações também são públicos e não incluem identidade do avaliador.

## Edição

Clicar em Liberar edição e informar a chave entregue separadamente aos organizadores. Ela permite mudar status e edição, gerenciar o mural, adicionar notas internas e abrir/fechar votações. Recarregar ou Bloquear edição apaga a chave da aba. Não colocar essa chave em config.js, HTML, GitHub, prints ou ZIP. Não há requisito de e-mail.

O servidor confere a chave em cada alteração. Notas da redação só são retornadas com a chave. Revisões de status usam versão para detectar alterações simultâneas.

## Banco ativo

Projeto `adapt-em-pauta-central`, referência `tumkwdobixtleqwhvdpu`, organização `trafego da adapt`, região São Paulo. `public/config.js` contém apenas URL e chave publicável. Não contém chave secret/service_role nem a chave editorial.

Schema privado `aep_hub`, RLS ativo em todas as tabelas e acesso direto revogado. As funções públicas usam SECURITY INVOKER e chamam operações específicas no schema privado com search_path fixo. O schema `aep_hub` deve permanecer fora dos schemas expostos pela Data API. O aviso informativo [RLS sem políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) é esperado: as tabelas privadas negam acesso direto, e as operações autorizadas usam RPCs.

Implementação ativa: `database/003_central_publica.sql`, `004_comentarios.sql`, `005_arquivo_especial.sql`, `006_settings_singleton.sql`. Os arquivos 001/002 e `tests/database.mjs` preservam o modelo anterior com e-mail e não devem ser aplicados neste projeto. Não reaplicar 003 em um projeto já criado.

`publico-template.sql` e `scripts/preparar-banco-publico.py` servem para um novo projeto. O preparador gera a chave fora da pasta pública e coloca somente o hash na migração. Não rotacionar uma chave existente sem coordenar a alteração do hash no banco.

O arquivo reúne as edições 001, 002 e especial Vamo di Pagodin. A edição 003 está em preparação, com avaliações fechadas. Nenhuma resposta fictícia foi mantida em produção.

## Jornal

`adapt-em-pauta-ED003-19nov-v15-central-conectada.html` incorpora o formulário e o botão Ver sugestões dos leitores. O mural abre sobre o jornal, com primeiro nome, indicação, comentário e link. `scripts/integrar-mural-v15.py` parte da V14 e preserva as fotos sem títulos, enquadramento do Giro, foto integral da Expovale, sete capítulos e horóscopo oficial sem a função de linguagem da firma.

O HTML exportado mantém a integração e omite os campos digitados e o modo de teste. Escape fecha o diálogo e devolve o foco ao botão. A edição 003 não substituiu o jornal em circulação.

## Compilação e testes

`node scripts/build.mjs` compila JS e CSS. `scripts/preview-autonoma.py` gera a demonstração. Após os testes, `scripts/entregar-v3.py` gera HTMLs conectados, pacotes e manifesto; confere que a chave editorial não entrou em nenhum ZIP.

- `tests/dashboard.cjs`: 36 combinações de área e largura, navegação, triagem, estados vazios e exportação.
- `tests/browser.cjs`: regressões da área do time, notas, filtros, CSV e demonstração.
- `tests/public.cjs`: leitura no Supabase real, consulta sem e-mail, arquivo, chave correta/incorreta, bloqueio de alterações sem chave e 96 combinações dos quatro temas.
- `tests/jornal-public.cjs`: mural real no HTML local, quatro larguras, pré-seleção, formulário simulado e exportação.
- Banco remoto: envio, idempotência, consentimento, moderação, chave, concorrência, URL, votos, avaliações e comentários foram testados em transação com rollback. Nenhum dado de teste permaneceu.

As versões antigas dos scripts de entrega empacotam prévias históricas. Para V3, usar apenas entregar-v3.py. Os relatórios atuais ficam em revisao/publico e revisao/estado-implementacao.json.
