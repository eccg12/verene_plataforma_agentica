/**
 * KEPLER — plataforma agêntica de dados da Monoda Consulting Group.
 * Protótipo clicável apresentado à Verene Energia.
 *
 * VERSÃO ARTIFACT — arquivo único. O repositório do projeto continua sendo a
 * fonte de verdade; este arquivo é o recorte que cabe num artifact do Claude.
 *
 * O que muda em relação ao projeto: Tailwind sem compilador (a paleta vive em
 * custom properties no bloco <style> abaixo), roteamento em memória, animação em
 * CSS, tipografia na stack do sistema e as fixtures reduzidas — 24 fornecedores,
 * 12 contratos e 14 materiais, com TODOS os defeitos plantados preservados.
 *
 * O que NÃO muda: a esteira de nove passos, o guarda de KANON, os quatro
 * checkpoints humanos, a trilha de assinatura com versão de playbook, os dois
 * momentos coreografados, a taxonomia de defeito por origem e o determinismo —
 * mesma entrada + mesma versão de playbook = mesma saída, sem Math.random e sem
 * Date.now em runtime.
 *
 * Sem localStorage, sem sessionStorage, sem <form>. Uma única chamada de rede,
 * na tela da regra candidata, com resposta de referência pré-gravada.
 */
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Boxes, Check, ChevronDown, ChevronRight, CircleDot,
  ClipboardCheck, Copy, Database, FileText, Fingerprint, Flag, GitBranch, Layers, Lock,
  LogIn, Minus, Network, Package, PenLine, Play, RefreshCw, Scale, Search, Shield, SplitSquareHorizontal,
  Compass, Pause, Table2, Target, Users, X, Zap,
} from 'lucide-react'

/* ========================================================================== */
/* 1. DESIGN SYSTEM — a paleta do deck Galaxy, centralizada                   */
/* ========================================================================== */

/**
 * Duas superfícies, uma regra de uso. `k-ink` é cockpit/operação; `k-paper` é
 * documento/evidência. Componentes nunca tocam a paleta base: usam o token
 * semântico, porque só o token resolve por superfície.
 *
 * Duas cores do deck não passam em contraste nas duas superfícies —
 * verene-violet reprova sobre a escura e signal-green sobre a clara. Por isso o
 * token troca de valor conforme a superfície; a regra de uso é a mesma.
 */
const CSS = `
.k-root {
  --k-violet: #7030A0; --k-violet-lt: #A56FD0; --k-ink: #111111;
  --k-navy: #002B49; --k-slate: #2C3E50; --k-green: #00C771;
  --k-paper: #F7F7F7; --k-line-base: #EAEAEA; --k-mute: #D2D2D2;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px; line-height: 18px;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}
.k-ink {
  --k-surface: #111111; --k-raised: #1E1E1E; --k-sunken: #050505;
  --k-fg: #F7F7F7; --k-muted: #D2D2D2; --k-subtle: #8A8A8A;
  --k-border: #292929; --k-border-strong: #424242;
  --k-accent: #A56FD0; --k-accent-hover: #BF88F2;
  --k-accent-fill: #7030A0; --k-accent-fill-hover: #993CDB; --k-on-accent: #F7F7F7;
  --k-signed: #00C771; --k-signed-bg: #16261B;
  --k-held: #D1881C; --k-held-bg: #2B2115;
  --k-exception: #FA4547; --k-exception-bg: #391917;
  --k-gate: #778EA3; --k-gate-bg: #1F2326;
  --k-def-source: #24BAB8; --k-def-source-bg: #162524;
  --k-def-transformation: #1C96D8; --k-def-transformation-bg: #15242E;
  --k-def-target-config: #958DFA; --k-def-target-config-bg: #211D44;
  --k-def-load: #FB45D4; --k-def-load-bg: #35192D;
  background-color: var(--k-surface); color: var(--k-fg);
}
.k-paper {
  --k-surface: #F7F7F7; --k-raised: #FFFFFF; --k-sunken: #F0F0F0;
  --k-fg: #111111; --k-muted: #505050; --k-subtle: #6A6A6A;
  --k-border: #EAEAEA; --k-border-strong: #D2D2D2;
  --k-accent: #7030A0; --k-accent-hover: #621793;
  --k-accent-fill: #7030A0; --k-accent-fill-hover: #621793; --k-on-accent: #F7F7F7;
  --k-signed: #0E6639; --k-signed-bg: #DEF1E4;
  --k-held: #7C4F0C; --k-held-bg: #F2EBE4;
  --k-exception: #C81726; --k-exception-bg: #F2EAEA;
  --k-gate: #556676; --k-gate-bg: #EBECED;
  --k-def-source: #0B5655; --k-def-source-bg: #D9F1F0;
  --k-def-transformation: #106797; --k-def-transformation-bg: #E7EDF1;
  --k-def-target-config: #611AF0; --k-def-target-config-bg: #EBEBF1;
  --k-def-load: #A8148D; --k-def-load-bg: #F2EAF0;
  background-color: var(--k-surface); color: var(--k-fg);
}
.k-bg { background-color: var(--k-surface); }
.k-bg-raised { background-color: var(--k-raised); }
.k-bg-sunken { background-color: var(--k-sunken); }
.k-text { color: var(--k-fg); }
.k-text-muted { color: var(--k-muted); }
.k-text-subtle { color: var(--k-subtle); }
.k-text-accent { color: var(--k-accent); }
.k-bd { border-color: var(--k-border); }
.k-bd-strong { border-color: var(--k-border-strong); }
/* Especificidade acima da do reset de button abaixo: sem isto o botão herda a
   cor do bloco em que está, e um botão preenchido dentro de um aviso colorido
   perde contraste sem que nada na tela indique. */
.k-root .k-fill { background-color: var(--k-accent-fill); color: var(--k-on-accent); }
.k-root .k-fill:hover:not(:disabled) { background-color: var(--k-accent-fill-hover); }
.k-root .k-ghost { border: 1px solid var(--k-border-strong); color: var(--k-fg); background: transparent; }
.k-root .k-ghost:hover:not(:disabled) { border-color: var(--k-accent); color: var(--k-accent); }
.k-root .k-ghost:disabled, .k-root .k-fill:disabled { opacity: .45; cursor: not-allowed; }
.k-s-signed { color: var(--k-signed); background-color: var(--k-signed-bg); }
.k-s-held { color: var(--k-held); background-color: var(--k-held-bg); }
.k-s-exception { color: var(--k-exception); background-color: var(--k-exception-bg); }
.k-s-gate { color: var(--k-gate); background-color: var(--k-gate-bg); }
.k-fg-signed { color: var(--k-signed); }
.k-fg-held { color: var(--k-held); }
.k-fg-exception { color: var(--k-exception); }
.k-fg-gate { color: var(--k-gate); }
.k-o-source { color: var(--k-def-source); background-color: var(--k-def-source-bg); }
.k-o-transformation { color: var(--k-def-transformation); background-color: var(--k-def-transformation-bg); }
.k-o-target-config { color: var(--k-def-target-config); background-color: var(--k-def-target-config-bg); }
.k-o-load { color: var(--k-def-load); background-color: var(--k-def-load-bg); }
.k-sq-source { background-color: var(--k-def-source); }
.k-sq-transformation { background-color: var(--k-def-transformation); }
.k-sq-target-config { background-color: var(--k-def-target-config); }
.k-sq-load { background-color: var(--k-def-load); }
.k-mono { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
.tnum { font-variant-numeric: tabular-nums; }
.k-root table { border-collapse: collapse; font-variant-numeric: tabular-nums; }
.k-root :focus-visible { outline: 2px solid var(--k-accent); outline-offset: 1px; }
.k-root button { font: inherit; color: inherit; }
.k-row { border-bottom: 1px solid var(--k-border); }
.k-row:hover { background-color: var(--k-raised); }
.k-th { color: var(--k-subtle); font-weight: 500; text-align: left;
  font-size: 10px; letter-spacing: .06em; text-transform: uppercase;
  padding: 6px 8px; border-bottom: 1px solid var(--k-border-strong); white-space: nowrap; }
.k-td { padding: 5px 8px; vertical-align: top; }
.k-link { color: var(--k-accent); text-decoration: none; cursor: pointer; }
.k-link:hover { text-decoration: underline; }
.k-scroll { overflow-x: auto; }
/* Caixa alta com espaçamento suficiente para o ç, o ã e o õ não colarem. */
.k-caps { text-transform: uppercase; letter-spacing: .07em; }
/* Transições sóbrias, todas abaixo de 200ms. */
.k-t { transition: background-color 140ms ease, color 140ms ease, border-color 140ms ease, opacity 140ms ease; }
/* A ÚNICA animação do protótipo: a propagação do Momento 1. */
@keyframes k-prop { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.k-prop { animation: k-prop 220ms ease-out both; }
@keyframes k-pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
.k-pulse { animation: k-pulse 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .k-prop, .k-pulse { animation: none !important; }
  .k-t { transition: none !important; }
}
`


/* ========================================================================== */
/* 2. GLOSSÁRIO E COPY — todo texto visível vive aqui                         */
/* ========================================================================== */

/**
 * Termos preservados. A UI é integralmente em português do Brasil; esta lista é
 * a exceção. Nada dela é traduzido, aportuguesado ou flexionado — e nome de
 * agente nunca é traduzido em lugar nenhum.
 */
const GLOSSARIO = {
  sap: ['Business Partner', 'Outline agreement', 'Migration Cockpit', 'Product master',
    'Service master', 'Purchase order', 'Purchase requisition', 'Incoterms', 'tenant',
    'Value domain', 'Fiori', 'XML'],
  modelo: ['Anthropic', 'Claude', 'API'],
  contrato: ['Gate', 'Gates', 'Wave', 'Mission Control', 'data owner', 'fingerprint',
    'playbook', 'manifest', 'checksum', 'cutover'],
  passos: ['RECEIVE', 'PROFILE', 'MAP', 'TRANSFORM', 'DEDUPLICATE', 'ENRICH', 'VALIDATE',
    'PACKAGE', 'RECONCILE'],
  agentes: ['VEGA', 'LYRA', 'ATLAS', 'NOVA', 'ORION', 'SIRIUS', 'KANON'],
}

/* ---------- formato brasileiro: data DD/MM/AAAA, número com ponto e vírgula -- */

const BR = 'pt-BR'
const fmtData = new Intl.DateTimeFormat(BR, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
const fmtHora = new Intl.DateTimeFormat(BR, { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
const fmtMoeda = new Intl.NumberFormat(BR, { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

/** Data em DD/MM/AAAA. Aceita ISO e DD/MM/AAAA (o legado mistura os dois). */
function dataBr(valor) {
  if (!valor) return '—'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return valor
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? valor : fmtData.format(d)
}
function dataHoraBr(valor) {
  if (!valor) return '—'
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? valor : `${fmtData.format(d)} ${fmtHora.format(d)}`
}
/** Número com separador brasileiro: 1.120, 2.080, 57,7. */
function numeroBr(valor, casas = 0) {
  return new Intl.NumberFormat(BR, { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(valor)
}
function moedaBr(valor) { return fmtMoeda.format(valor) }
function percentualBr(valor, casas = 1) { return `${numeroBr(valor, casas)}%` }

/**
 * Todo texto visível ao usuário. Nenhum componente inventa string: se não está
 * aqui, não aparece na tela.
 */
const T = {
  produto: {
    nome: 'KEPLER',
    fornecedor: 'Monoda Consulting Group',
    cliente: 'Verene Energia',
    subtitulo: 'Plataforma agêntica de dados',
    programa: 'GALAXY data playbook',
  },
  demo: {
    selo: 'Ambiente de demonstração — dados sintéticos',
    seloDetalhe: 'Nenhum dado desta tela vem de sistema produtivo. Nada aqui é escrito em nenhum tenant.',
    subconjunto: 'Subconjunto demonstrado',
    escopoReal: 'Escopo declarado do projeto',
    explicacaoSubconjunto:
      'O escopo do projeto é de {escopo} registros em {pacotes} pacotes de carga. Esta demonstração roda sobre um subconjunto navegável de {amostra} registros, escolhido para conter todos os defeitos que a esteira precisa mostrar.',
  },
  entrada: {
    titulo: 'Acesso à demonstração',
    usuario: 'Usuário',
    senha: 'Senha',
    entrar: 'Entrar',
    // Mensagem única, sem contador e sem dizer qual dos dois campos errou.
    erro: 'Credencial inválida',
    // O portão sinaliza; não protege. Dizer isso na própria tela evita que
    // alguém leia a senha como controle de segurança.
    nota: 'O acesso identifica quem recebeu o link. Não protege dado: o ambiente é de demonstração e os dados são sintéticos.',
  },
  shell: {
    versaoPlaybook: 'Playbook',
    ciclo: 'Ciclo',
    spe: 'SPE',
    todasSpes: 'Todas as SPEs',
    onda: 'Wave 1',
    navegacao: 'Navegação',
    reiniciar: 'Reiniciar demonstração',
    apresentar: 'Modo de apresentação',
  },
  nav: {
    missionControl: 'Mission Control',
    playbook: 'Playbook',
    mapping: 'Dicionário de mapeamento',
    record: 'Rastreabilidade',
    duplicates: 'Revisão de duplicatas',
    exceptions: 'Fila de exceções',
    candidate: 'Regra candidata',
    packages: 'Pacotes de carga',
    reconciliation: 'Reconciliação',
    gates: 'Gates',
    payment: 'Gates e pagamento',
    grupoOperacao: 'Operação',
    grupoEvidencia: 'Evidência',
    grupoDecisao: 'Decisão',
  },
  comum: {
    sim: 'sim',
    nao: 'não',
    de: 'de',
    total: 'Total',
    origem: 'Origem',
    destino: 'Destino',
    diferenca: 'Diferença',
    explicacao: 'Explicação',
    registros: 'registros',
    registro: 'registro',
    regra: 'Regra',
    regras: 'Regras',
    versao: 'Versão',
    campo: 'Campo',
    valor: 'Valor',
    estado: 'Estado',
    dono: 'Dono',
    prazo: 'Prazo',
    acao: 'Ação',
    acoes: 'Ações',
    agente: 'Agente',
    objeto: 'Objeto',
    tipo: 'Tipo',
    nenhum: 'Nenhum',
    naoIniciado: 'não iniciado',
    naoMensuravel: 'ainda não mensurável',
    voltar: 'Voltar',
    fechar: 'Fechar',
    aprovar: 'Aprovar',
    rejeitar: 'Rejeitar',
    assinar: 'Assinar',
    assinado: 'Assinado',
    pendente: 'Pendente',
    codigo: 'Código',
    quantidade: 'Quantidade',
    severidade: 'Severidade',
    critico: 'crítico',
    naoCritico: 'não crítico',
    fecha: 'Fecha',
    naoFecha: 'Não fecha',
    dias: 'dias úteis',
    porQue: 'Por quê',
    evidencia: 'Evidência',
    defeito: 'Defeito',
    criterio: 'Critério',
    marco: 'Marco',
    limite: 'Limite',
    razaoSocial: 'Razão social',
    businessPartner: 'Business Partner',
    aplicadaA: 'Aplicada a {n} registros nesta onda',
    semAplicacao: 'Não executou nesta onda',
  },
  estado: {
    migrated: 'migrado',
    reused: 'reusado',
    merged: 'fundido',
    held: 'retido',
    completed: 'concluído',
    blocked: 'bloqueado',
    'not-reached': 'não alcançado',
    aprovado: 'aprovado',
    rejeitado: 'rejeitado',
  },
  missionControl: {
    titulo: 'Mission Control',
    resumo: 'O que existe hoje no Nasajon das quatro SPEs, medido — não estimado.',
    escopo: 'Escopo declarado',
    escopoNota: 'Seis objetos × quatro SPEs × dois ciclos. Os 48 pacotes são derivados do escopo, não digitados.',
    pacotes: 'pacotes de carga',
    volumeReferencia: 'registros de referência',
    grade: 'Grade de pacotes',
    recebimento: 'Recebimento do extrato',
    recebimentoNota:
      'A contagem e o fingerprint são calculados do conteúdo entregue. Repetir o número que o fornecedor declarou não serviria de recibo.',
    arquivo: 'Arquivo',
    declarados: 'Declarados',
    lidos: 'Lidos',
    layout: 'Layout',
    recibo: 'Recibo',
    comRessalva: 'com ressalva',
    validado: 'validado',
    divergente: 'divergente',
    mapaDefeitos: 'Mapa de defeitos',
    mapaNota: 'Perfilado sobre o que já foi recebido — não sobre o que a fixture tem.',
    porObjeto: 'Por objeto',
    porDimensao: 'Por dimensão de qualidade',
    taxa: 'Taxa',
    defeitos: 'Defeitos',
    criticos: 'Críticos',
    perfilados: 'Registros perfilados',
    agentes: 'Agentes',
    agentesNota: 'O estado de atividade sai do run corrente da esteira, não de um contador.',
    revisor: 'Revisor',
    esteira: 'Esteira',
    esteiraNota: 'Nenhum passo escreve em registro diretamente: toda mutação passa por KANON.',
    semExtrato: 'Sem extrato recebido. Declarar estado de dado que não existe seria inventar.',
  },
  playbook: {
    titulo: 'GALAXY data playbook',
    subtitulo: 'A regra vive num lugar só, versionada. Os agentes a executam — não a interpretam.',
    selado: 'Versão selada',
    checksum: 'Checksum',
    totalRegras: 'regras vigentes',
    ativas: 'ativas',
    candidatas: 'candidatas',
    filtroAgente: 'Agente',
    filtroObjeto: 'Objeto',
    filtroTipo: 'Tipo',
    todos: 'Todos',
    expressao: 'Expressão',
    justificativa: 'Justificativa',
    dono: 'Dono',
    entrouEm: 'Entrou na versão',
    historico: 'Histórico de alterações',
    gerarDoc: 'Gerar documentação',
    docTitulo: 'Documentação gerada do playbook',
    docNota: 'Montada a partir das próprias regras, na hora. Documentação escrita à mão diverge do que rodou.',
    natureza: { deterministic: 'determinística', generative: 'generativa' },
    status: { active: 'ativa', candidate: 'candidata', deprecated: 'aposentada' },
    candidataNota: 'Proposta de regra. Não executa: KANON recusa regra não promovida por um humano.',
    correcaoTitulo: 'Correção disponível',
    correcaoNota:
      'A redação corrigida já está selada na versão {versao}. Adotá-la é decisão de quem revisa, não efeito colateral de publicar.',
    parametroDe: 'de',
    parametroPara: 'para',
    publicar: 'Corrigir e publicar {versao}',
    registrosAfetados: 'Registros que a redação corrente produz com defeito',
    semRegistro: 'Nenhum registro nesta onda.',
  },
  mapping: {
    titulo: 'Dicionário de mapeamento',
    subtitulo: 'Campo a campo, contra a configuração que está ligada no tenant hoje — não contra o SAP padrão.',
    campoOrigem: 'Campo de origem',
    campoDestino: 'Campo de destino',
    valueDomain: 'Value domain (live tenant)',
    regra: 'Regra do playbook',
    divergencia: 'Divergência do padrão SAP',
    naoPadraoSap: 'Tenant Verene, não padrão SAP',
    obrigatorio: 'Obrigatório',
    divergenciasTitulo: 'Divergências do padrão SAP no tenant da Verene',
    divergenciaNota:
      'Mapear contra o padrão em vez do tenant é o erro que só aparece na carga, quando já custa caro.',
    avisoTitulo: 'A esteira está parada no passo 3',
    aviso:
      'Nenhuma transformação roda sobre mapeamento não aprovado. O checkpoint exige duas assinaturas distintas: a aprovação técnica do SAP SME e a assinatura do data owner no Gate 1.',
    aprovarSme: 'Aprovar tecnicamente (SAP SME)',
    aprovarOwner: 'Assinar como data owner (Gate 1)',
    aprovadoPor: 'Aprovado por',
    liberado: 'Mapeamento aprovado. A esteira seguiu para o passo 4.',
  },
  record: {
    titulo: 'Rastreabilidade em nível de campo',
    subtitulo: 'De onde veio o valor, que regra o mudou, em que versão do playbook, e o valor final.',
    valorOrigem: 'Valor de origem',
    valorFinal: 'Valor final',
    trilha: 'Trilha de aplicação',
    passo: 'Passo',
    instante: 'Instante',
    antes: 'Antes',
    depois: 'Depois',
    nota: 'Nota',
    retido: 'Registro retido. Não há valor final enquanto a exceção não for decidida.',
    excecoes: 'Exceções abertas',
    casos: 'Casos navegáveis',
    casoFornecedor: 'Fornecedor',
    casoContrato: 'Linha de contrato',
    campos: { codigo: 'Código', spe: 'SPE', razaoSocial: 'Razão social',
      nomeFantasia: 'Nome fantasia', documento: 'CNPJ/CPF', cnae: 'CNAE', municipio: 'Município',
      codigoIbge: 'Código IBGE', cep: 'CEP', condicaoPagamento: 'Condição de pagamento',
      dataCadastro: 'Data de cadastro', contrato: 'Contrato', fornecedor: 'Fornecedor', objeto: 'Objeto',
      item: 'Item', descricao: 'Descrição', unidade: 'Unidade', quantidade: 'Quantidade',
      precoUnitario: 'Preço unitário', valorTotal: 'Valor total', centroCusto: 'Centro de custo',
      faseFiscal: 'Fase fiscal' },
    contratoNota: 'A linha de contrato roda pela MESMA esteira, com o mesmo guarda de KANON.',
    naoEncontrado: 'Registro fora do recorte corrente.',
  },
  duplicates: {
    titulo: 'Revisão de duplicatas',
    subtitulo: 'A máquina propõe o match e mostra o porquê, sinal a sinal. Quem funde dois cadastros é uma pessoa.',
    fila: 'Clusters em revisão',
    cluster: 'Cluster',
    documento: 'Documento',
    membros: 'Membros',
    score: 'Score',
    scoreNota: 'O score é a soma dos pesos dos sinais que conferem, não um número solto.',
    sinal: 'Sinal',
    peso: 'Peso',
    confere: 'Confere',
    sobrevivente: 'Sobrevivente proposto',
    razaoProposta: 'Razão social proposta',
    motivo: 'Motivo da proposta',
    divergentes: 'Campos divergentes',
    iguais: 'Campos idênticos',
    confirmar: 'Confirmar merge',
    rejeitarM: 'Rejeitar',
    dividir: 'Dividir cluster',
    decidido: 'Decidido por',
    crossReference: 'Cross-reference',
    aposentado: 'Código aposentado',
    jaExistem: 'Já cadastrados no tenant',
    jaExistemNota:
      'Derivado do cruzamento por documento contra a base viva — não do resultado da esteira, senão sumiriam justamente enquanto o checkpoint segura.',
    reusar: 'Reusar, não recriar',
    razaoNasajon: 'Razão social (Nasajon)',
    razaoTenant: 'Razão social (tenant)',
    semCluster: 'Nenhum cluster de duplicata neste recorte.',
  },
  exceptions: {
    titulo: 'Fila de exceções',
    subtitulo: 'Toda exceção tem dono nomeado, prazo e decisão humana. Nada é defaultado para o lote passar.',
    semValorPadrao: 'Não existe "aplicar valor padrão" nesta tela, de propósito.',
    fila: 'Exceções abertas',
    tecnica: 'Técnica',
    negocio: 'Negócio',
    classe: 'Classe',
    roteadoPara: 'Roteado para',
    mensagem: 'Mensagem',
    liberar: 'Liberar com decisão registrada',
    manterRetido: 'Manter retido',
    decidida: 'Decidida',
    enriquecimento: 'Enriquecimento do NOVA',
    enriquecimentoNota: 'Cada valor proposto mostra a fonte que o sustenta. Onde não há fonte, não há proposta.',
    proposta: 'Proposta',
    fonte: 'Fonte',
    semProposta: 'sem proposta',
    motivoSemProposta:
      'Não há tabela de referência que derive CNAE de razão social. Propor um valor aqui seria chute com aparência de derivação — e erro de CNAE tem efeito fiscal.',
    corrigirRegra: 'Este defeito não se resolve aprovando o registro',
    corrigirRegraNota:
      'O corte caiu no meio da palavra porque a REGRA está errada. Aprovar carimbaria o corte errado. O tratamento é corrigir a regra e republicar o playbook.',
    irParaRegra: 'Abrir a regra no playbook',
    semExcecao: 'Nenhuma exceção aberta neste recorte.',
  },
  candidate: {
    titulo: 'Regra candidata — aguardando confirmação da Verene',
    subtitulo: 'O agente encontrou um padrão que só existe na prática de uma das empresas adquiridas. Ele evidencia e para.',
    limite: 'Um agente consegue evidenciar que uma regra provavelmente existe. Ele não consegue confirmar que a regra está correta.',
    caso: 'O caso',
    evidencia: 'A evidência',
    evidenciaNota: 'Os registros, lado a lado, com o campo divergente destacado.',
    frequencia: 'A frequência',
    frequenciaNota: 'Derivada das fixtures, não escolhida.',
    duplas: 'duplas divergentes',
    duplasSobrePossiveis: 'Divergentes sobre possíveis',
    registrosEnvolvidos: 'registros envolvidos',
    spesEnvolvidas: 'SPEs envolvidas',
    dePf: 'de {total} pessoas físicas com o mesmo documento em mais de uma SPE',
    inferencia: 'A inferência',
    regraCandidata: 'Regra candidata',
    hipotese: 'Hipótese em linguagem natural',
    naoConfirmavel: 'O que não é possível confirmar a partir do dado',
    procedenciaViva: 'gerado ao vivo',
    procedenciaReferencia: 'resposta de referência',
    modelo: 'Modelo',
    consultando: 'consultando…',
    contencao: 'Contenção',
    roteadaPara: 'Roteada para',
    confirmar: 'Confirmar',
    rejeitarC: 'Rejeitar',
    reformular: 'Reformular',
    decisao: {
      confirmada: 'Regra confirmada pelo dono do processo',
      rejeitada: 'Regra rejeitada pelo dono do processo',
      reformular: 'Devolvida para reformulação',
    },
    confirmarNaoExecuta:
      'Confirmar NÃO executa a regra. KANON recusa regra candidata; promover é ato de governança, numa nova versão selada do playbook.',
    campoDivergente: 'Campo divergente',
    identico: 'Idêntico nos dois cadastros',
  },
  packages: {
    titulo: 'Pacotes de carga',
    subtitulo: 'O XML do Migration Cockpit é gerado dos registros de fato, com versão e checksum do playbook no cabeçalho.',
    manifestTitulo: 'Manifest',
    playbookVersion: 'Versão do playbook',
    playbookChecksum: 'Checksum do playbook',
    datasetChecksum: 'Checksum do conteúdo',
    geradoEm: 'Gerado em',
    totalRegistros: 'Registros no pacote',
    xml: 'XML gerado',
    tamanho: 'Tamanho',
    tamanhoPorRegistro: 'Tamanho médio por registro',
    divisao: 'Divisão em partes',
    divisaoNota: 'Aritmética sobre o tamanho medido, contra os dois tetos: 100 MB por arquivo e 500 registros por lote.',
    parte: 'Parte',
    conformidade: 'Conformidade',
    conformidadeNota: 'Liberar uma exceção não lava o dado: o campo obrigatório vazio continua sendo pego aqui.',
    verificacao: 'Verificação',
    resultado: 'Resultado',
    aprovadaC: 'aprovada',
    reprovadaC: 'reprovada',
    simulacao: 'Simulação no Migration Cockpit',
    entrega: 'Entrega formal',
    destinatario: 'Destinatário',
    escopoEntrega: 'Escopo declarado',
    excecoesConhecidas: 'Exceções conhecidas',
    calendario: 'Calendário',
    liberar: 'Liberar pacote para carga',
    liberado: 'Pacote liberado por',
    semPacote: 'A esteira não chegou ao passo 8. Não há pacote a mostrar.',
  },
  reconciliation: {
    titulo: 'Reconciliação origem × destino',
    subtitulo: 'Origem e destino fecham em contagem e em valor, e toda diferença vem explicada.',
    porContagem: 'Por contagem',
    porValor: 'Por valor',
    valorNota:
      'Valor só aparece onde há montante: contratos. Fornecedor é cadastro — inventar um valor para preencher a tela seria número que não sobrevive a uma pergunta.',
    registroDefeitos: 'Registro de defeitos por origem',
    responsabilidadeMonoda: 'Responsabilidade Monoda',
    responsabilidadeTerceiros: 'Responsabilidade de terceiros',
    donoContratual: 'Dono contratual',
    entregaMonoda: 'O que a Monoda entrega nesta origem',
    criterioAtribuicao: 'Critério de atribuição',
    placar: 'Critérios de aceite',
    placarNota: 'Cada critério com o Gate onde é medido e a frase de como o número foi obtido.',
    medido: 'Medido',
    alvo: 'Alvo',
    atende: 'Atende',
    naoAtende: 'Não atende',
    comoMedido: 'Como foi medido',
    fiori: 'Verificação guiada nos apps Fiori',
    fioriNota:
      'Contagem prova que o número fecha; não prova que o registro está certo. A verificação no app fecha essa lacuna e é registrada como evidência de Gate.',
    app: 'App',
    oQueConferir: 'O que conferir',
    registrar: 'Registrar verificação',
    registrada: 'Verificada por',
    assinarRecon: 'Assinar reconciliação (Gate 6)',
  },
  gates: {
    titulo: 'Gates',
    subtitulo: 'Ponto de decisão contratual, não reunião de status. Cada Gate aprova um artefato nomeado.',
    oitoGates: 'Os oito Gates, em ordem',
    quandoOcorre: 'Quando ocorre',
    oQueEAprovado: 'O que é aprovado',
    artefato: 'Artefato',
    evidencias: 'Evidência entregue',
    aprovador: 'Aprovador',
    trilha: 'Trilha de assinatura',
    quem: 'Quem',
    quando: 'Quando',
    sobreVersao: 'Sobre a versão',
    revalidada: 'revalidada em',
    status: {
      aprovado: 'aprovado',
      'em-avaliacao': 'em avaliação',
      'evidencia-pendente': 'evidência pendente',
      'entrada-recusada': 'entrada recusada',
    },
    recusaTitulo: 'Entrada RECUSADA',
    recusa: 'O artefato {artefato} não está assinado. Ele é assinado no {gate}.',
    irParaGate: 'Ir para o {gate}',
    pendencia: {
      assinatura: 'Falta a assinatura de {detalhe}.',
      clusters: 'Faltam {quantidade} cluster(s) a decidir por {detalhe}.',
      excecoes: 'Faltam {quantidade} exceção(ões) a decidir por {detalhe}.',
      evidencia: 'A evidência "{detalhe}" ainda não foi produzida pela esteira.',
      versao: 'A assinatura foi dada sobre a versão {detalhe} e não cobre a corrente.',
    },
    assinaturaNaTela: 'Assinar {gate}',
    assinaturaNoutraTela: 'Assinado onde a evidência é revisada',
    verEvidencia: 'Abrir evidência',
    placarGates: '{aprovados} de {total} Gates aprovados',
    disponivel: 'disponível',
    indisponivel: 'ainda não produzida',
  },
  payment: {
    titulo: 'Gates e liberação de pagamento',
    subtitulo: 'Cada Gate assinado libera uma parcela. Só percentual: o valor do contrato não vive no protótipo.',
    porGate: 'Parcela por Gate',
    parcela: 'Parcela',
    liberado: 'Liberado',
    retido: 'Retido',
    semParcela: 'sem parcela',
    semParcelaNota: 'Nem todo ponto de decisão é ponto de faturamento — e um Gate sem dinheiro atrás continua bloqueante.',
    totalLiberado: 'Total liberado',
    somaNota: 'A soma das parcelas fecha em 100%.',
    flagNota: 'Painel comercial, atrás da flag. Não abre sem ser pedido.',
  },
  apresentacao: {
    titulo: 'Modo de apresentação',
    passo: 'Passo',
    de: 'de',
    fraseChave: 'Frase-chave',
    acoes: 'Na tela',
    notas: 'Notas do apresentador',
    notasAviso: 'Visível só para quem apresenta. Feche antes de projetar.',
    decorrido: 'Decorrido',
    duracao: 'Duração prevista',
    anterior: 'Anterior',
    proximo: 'Próximo',
    sair: 'Sair',
    atalhos: 'Atalhos',
    atalhoLista: 'P entra e sai · ← → navega · N abre as notas · R reinicia · Esc fecha',
    iniciar: 'Iniciar roteiro',
  },
  /**
   * A camada narrada. Conduz quem ASSISTE, sem alguém falando por cima — é a
   * diferença para `apresentacao`, que conduz quem apresenta.
   */
  narrativa: {
    tituloDoModo: 'Apresentação guiada',
    cena: 'Cena',
    de: 'de',
    proxima: 'Próxima cena',
    anterior: 'Cena anterior',
    reiniciar: 'Voltar ao início',
    explorar: 'Explorar livremente',
    verApresentacao: 'Ver apresentação',
    dicaEntrar: 'Assista à apresentação guiada de 15 cenas. O roteiro do apresentador continua na tecla P.',
    dicaSair: 'Fecha a apresentação e libera as telas para você clicar.',
    tocar: 'Reproduzir sozinho',
    pausar: 'Pausar',
    automatico: 'Modo automático',
    notas: 'Nota do apresentador',
    avancarDica: 'Clique, seta ou barra de espaço para avançar',
    telaAoFundo: 'A tela ao fundo é real e está funcionando.',
    encerrar: 'Terminar e explorar',
    fim: 'Fim da apresentação',
    fimNota:
      'Você viu o problema, os sete agentes, a esteira, os dois momentos e como o aceite é medido. A partir daqui a ferramenta é sua.',
    agente: {
      especialidade: 'Especialidade',
      oQueFaz: 'O que faz',
      recebe: 'Recebe',
      entrega: 'Entrega',
      assina: 'Quem responde por ele',
    },
  },
  momento1: {
    titulo: 'Propagação da correção',
    subtitulo: 'Defeito encontrado na sexta, ressubmetido na sexta.',
    nos: {
      regra: 'Regra corrigida',
      selo: 'Playbook selado',
      onda: 'Onda regerada',
      pacote: 'Pacote refeito',
      manifest: 'Manifest novo',
    },
    detalhe: {
      regra: '{regra} · corte: {de} → {para}',
      selo: '{versao} · checksum {checksum}',
      onda: '{fechadas} exceções fechadas · {retocados} registros retocados',
      pacote: '{id} · {total} registros',
      manifest: 'aguardando reassinatura no Gate 4',
    },
    verNo: 'Abrir',
    reassinar: 'O pacote e a reconciliação perderam a assinatura: o artefato mudou de checksum.',
    revalidadas: 'Assinaturas carregadas para a nova versão, marcadas como revalidadas: {n}.',
  },
}

/** Substitui {chave} pelos valores. Copy com número nunca é concatenada na tela. */
function fmt(molde, valores) {
  return Object.entries(valores).reduce(
    (texto, [chave, valor]) => texto.split(`{${chave}}`).join(String(valor)),
    molde,
  )
}


/* ========================================================================== */
/* 3. FIXTURES — a única fonte de dado da UI                                  */
/* ========================================================================== */

const speIds = ['SPE-1', 'SPE-2', 'SPE-3', 'SPE-4']

/* ---------- os sete agentes ------------------------------------------------ */
/**
 * Seis agentes ocupam passos da esteira. KANON é transversal: não executa passo
 * nenhum — versiona o playbook e gera a documentação a partir dele. Todo agente
 * responde a uma pessoa com nome, e é essa pessoa que assina: nenhum agente é
 * accountable.
 */
const agents = [
  { name: 'VEGA', papel: 'Recepção e perfilagem', transversal: false,
    revisor: { nome: 'Marina Dantas', papel: 'Monoda · Data Engineering' },
    descricao: 'Recebe o extrato e mede o que chegou. Não corrige nada — só registra o que existe, o que falta e em que formato veio.' },
  { name: 'LYRA', papel: 'Mapeamento contra o tenant', transversal: false,
    revisor: { nome: 'Rafael Queiroz', papel: 'Monoda · Arquitetura S/4HANA' },
    descricao: 'Lê a configuração viva do tenant S/4HANA e mapeia valor do legado para domínio do destino. Onde o tenant diverge do padrão SAP, é aqui que a divergência aparece.' },
  { name: 'ATLAS', papel: 'Transformação e deduplicação', transversal: false,
    revisor: { nome: 'Bruno Salgado', papel: 'Monoda · Data Engineering' },
    descricao: 'Aplica as regras de conversão e monta os clusters de duplicata. Não decide sobrevivente sozinho: propõe e espera confirmação.' },
  { name: 'NOVA', papel: 'Enriquecimento e validação', transversal: false,
    revisor: { nome: 'Carlos Menezes', papel: 'Verene · Fiscal' },
    descricao: 'Deriva o que dá para derivar de fonte de referência e valida contra as regras de negócio e os campos obrigatórios do tenant.' },
  { name: 'ORION', papel: 'Empacotamento', transversal: false,
    revisor: { nome: 'Helena Duarte', papel: 'Verene · Data owner' },
    descricao: 'Monta o pacote de carga com manifest e checksum. Só empacota registro aprovado.' },
  { name: 'SIRIUS', papel: 'Reconciliação', transversal: false,
    revisor: { nome: 'Ana Ribeiro', papel: 'Verene · Suprimentos' },
    descricao: 'Fecha a conta: o que entrou tem que ser igual ao que saiu mais o que ficou retido. Sem fechar, não há assinatura.' },
  { name: 'KANON', papel: 'Governança do playbook', transversal: true,
    revisor: { nome: 'Patrícia Lemos', papel: 'Monoda · Governança' },
    descricao: 'Versiona o playbook, sela a versão com checksum e gera a documentação a partir das regras. Nenhum outro agente escreve regra: eles executam a que KANON publicou.' },
]

/* ---------- donos nomeados ------------------------------------------------- */
/** Exceção sem pessoa não é exceção, é registro perdido. */
const owners = [
  { area: 'Verene · Suprimentos', nome: 'Ana Ribeiro', papel: 'Gerente de suprimentos' },
  { area: 'Verene · Fiscal', nome: 'Carlos Menezes', papel: 'Coordenador fiscal' },
  { area: 'Verene · Data owner', nome: 'Helena Duarte', papel: 'Data owner do projeto' },
  { area: 'Verene · Arquitetura S/4HANA', nome: 'Rafael Queiroz', papel: 'SAP SME' },
  { area: 'Verene · Basis', nome: 'Tiago Fontes', papel: 'Coordenador Basis' },
  { area: 'Monoda · Data Engineering', nome: 'Marina Dantas', papel: 'Líder de data engineering' },
  { area: 'Monoda · Arquitetura S/4HANA', nome: 'Rafael Queiroz', papel: 'SAP SME' },
  { area: 'Monoda · Governança', nome: 'Patrícia Lemos', papel: 'Governança do playbook' },
]
const ownerDaArea = (area) => owners.find((o) => o.area === area) ?? null

/* ---------- escopo declarado ----------------------------------------------- */
/**
 * O escopo comercial do projeto. Os 48 pacotes são DERIVADOS de 6 objetos × 4
 * SPEs × 2 ciclos, não digitados — e continuam na tela como referência do
 * projeto real, claramente separados do subconjunto que esta demonstração roda.
 */
const cycles = ['ciclo-1', 'ciclo-2']
const cycleSpecs = [
  { id: 'ciclo-1', nome: 'Ciclo de teste', descricao: 'Carga de ensaio, com reconciliação completa e sem efeito em produção.' },
  { id: 'ciclo-2', nome: 'Cutover de produção', descricao: 'Carga definitiva, na janela acordada, com o mesmo playbook aprovado no ciclo de teste.' },
]
const scopeObjects = [
  { id: 'fornecedores', nome: 'Fornecedores', objetosTenant: ['business-partner'], volume: 1120 },
  { id: 'materiais-servicos', nome: 'Materiais e serviços', objetosTenant: ['product-master', 'service-master'], volume: 320 },
  { id: 'contratos', nome: 'Contratos', objetosTenant: ['outline-agreement'], volume: 200 },
  { id: 'pedidos', nome: 'Pedidos', objetosTenant: ['purchase-order'], volume: 200 },
  { id: 'requisicoes', nome: 'Requisições', objetosTenant: ['purchase-requisition'], volume: 120 },
  { id: 'posicoes-estoque', nome: 'Posições de estoque', objetosTenant: ['stock'], volume: 120 },
]
const loadPackages = scopeObjects.flatMap((objeto) =>
  speIds.flatMap((spe) => cycles.map((ciclo) => ({ id: `${objeto.id}/${spe}/${ciclo}`, objetoId: objeto.id, spe, ciclo }))),
)
const totalVolume = scopeObjects.reduce((acc, o) => acc + o.volume, 0)
const scopeSummary = {
  objetos: scopeObjects.length, spes: speIds.length, ciclos: cycles.length,
  pacotes: loadPackages.length, volumeTotal: totalVolume,
}

/* ---------- taxonomia de defeito por origem -------------------------------- */
/**
 * A estrutura mais importante comercialmente. Numa migração com vários
 * fornecedores, a discussão que consome o projeto não é "tem defeito?" — é "de
 * quem é este defeito?". As quatro origens são mutuamente exclusivas, cada uma
 * com dono contratual declarado, e só `transformation` é da Monoda.
 */
const defectOriginIds = ['source-extract', 'transformation', 'target-config', 'load-execution']
const qualityDimensions = ['completude', 'validade', 'unicidade', 'consistencia', 'conformidade', 'precisao']
const rotuloDimensao = {
  completude: 'Completude', validade: 'Validade', unicidade: 'Unicidade',
  consistencia: 'Consistência', conformidade: 'Conformidade', precisao: 'Precisão',
}

const defectOrigins = [
  {
    id: 'source-extract', nome: 'Origem do extrato', token: 'source', monodaResponsavel: false,
    descricao: 'O dado chegou errado do legado. Documento com dígito verificador inválido, campo obrigatório em branco, valor que não bate com o cabeçalho, cadastro duplicado entre SPEs.',
    donoContratual: { parte: 'Verene Energia', papel: 'Proprietária do dado, com apoio do fornecedor do Nasajon',
      descricao: 'O dado é da Verene e foi produzido nos sistemas dela. A Monoda não corrige dado de origem sem autorização escrita — corrigir calado é assumir a autoria do número.' },
    criterioDeAtribuicao: 'O defeito é reproduzível lendo apenas o extrato, sem consultar o tenant nem executar regra de transformação.',
    entregaDaMonoda: 'Detectar, quantificar, evidenciar registro a registro e rotear para o dono. A correção volta para a origem ou vira decisão registrada.',
  },
  {
    id: 'transformation', nome: 'Transformação', token: 'transformation', monodaResponsavel: true,
    descricao: 'A regra do playbook foi aplicada errado, ou faltou regra para um caso que o dado apresenta. Conversão que perde informação, chave de deduplicação que agrupa o que não devia, derivação que produz valor errado.',
    donoContratual: { parte: 'Monoda Consulting Group', papel: 'Responsável pela regra e pela sua execução',
      descricao: 'Este é o trabalho da Monoda. Defeito aqui é defeito da Monoda, sem discussão: corrige-se a regra, sobe-se a versão do playbook e reprocessa-se.' },
    criterioDeAtribuicao: 'O dado de origem estava correto e a configuração do destino aceitaria o valor certo, mas a saída da esteira está errada.',
    entregaDaMonoda: 'Correção da regra, nova versão do playbook e reprocessamento, sem custo adicional para a Verene.',
  },
  {
    id: 'target-config', nome: 'Configuração do destino', token: 'target-config', monodaResponsavel: false,
    descricao: 'O tenant S/4HANA exige, rejeita ou nomeia algo de um jeito que o escopo não previa. Campo obrigatório fora do padrão SAP, domínio de valor sem entrada correspondente, faixa de numeração incompatível.',
    donoContratual: { parte: 'Verene Energia e o integrador do S/4HANA', papel: 'Donos da configuração do tenant',
      descricao: 'A configuração do tenant é decisão da Verene, tomada com o integrador, antes e fora deste projeto. A Monoda evidencia a divergência e propõe tratamento; mudar configuração não é escopo dela.' },
    criterioDeAtribuicao: 'O dado de origem está correto e a regra foi aplicada corretamente, mas o tenant recusa ou exige algo que o padrão SAP não exigiria.',
    entregaDaMonoda: 'Leitura da configuração viva do tenant, relatório de divergência contra o padrão SAP e proposta de tratamento para decisão da Verene.',
  },
  {
    id: 'load-execution', nome: 'Execução da carga', token: 'load', monodaResponsavel: false,
    descricao: 'A carga em si falhou. Lote rejeitado pelo Migration Cockpit, timeout, bloqueio de objeto, faixa de numeração esgotada, indisponibilidade do ambiente.',
    donoContratual: { parte: 'Compartilhado — Monoda e Verene', papel: 'Monoda pela mecânica do lote; Verene pelo ambiente',
      descricao: 'Formato do lote, tamanho, ordem e conteúdo do manifest são da Monoda. Disponibilidade do ambiente, janela de carga, faixa de numeração e autorização são da Verene e do time Basis. O manifest com checksum é o que separa um do outro sem discussão.' },
    criterioDeAtribuicao: 'O pacote foi aprovado e estava íntegro no checksum, mas a execução no destino não completou.',
    entregaDaMonoda: 'Pacote íntegro e reexecutável, com manifest e checksum que provam o que foi enviado, e reenvio após o ambiente normalizar.',
  },
]

const defectTypes = [
  { id: 'DEF-SRC-01', origin: 'source-extract', nome: 'CNPJ com dígito verificador inválido', severidade: 'critical', dimensao: 'validade', classe: 'negocio', prazoDias: 3,
    descricao: 'O número não fecha na aritmética do dígito verificador. Não é erro de máscara — é número errado.',
    acao: 'Reter o registro. Não há correção automática possível.', roteadoPara: 'Verene · Suprimentos', plantedKind: 'cnpj-dv-invalido' },
  { id: 'DEF-SRC-02', origin: 'source-extract', nome: 'Cadastro duplicado entre SPEs', severidade: 'critical', dimensao: 'unicidade', classe: 'negocio', prazoDias: 5,
    descricao: 'Mesmo documento cadastrado em mais de uma SPE, com grafia divergente da razão social.',
    acao: 'Formar cluster e reter até confirmação humana, um cluster por vez.', roteadoPara: 'Verene · Suprimentos', plantedKind: 'duplicata-grafia' },
  { id: 'DEF-SRC-03', origin: 'source-extract', nome: 'CNAE ausente', severidade: 'critical', dimensao: 'completude', classe: 'negocio', prazoDias: 5,
    descricao: 'Campo em branco no extrato, exigido pelo tenant.',
    acao: 'Reter. A derivação de CNAE é regra candidata, não executa.', roteadoPara: 'Verene · Fiscal', plantedKind: 'cnae-ausente' },
  { id: 'DEF-SRC-04', origin: 'source-extract', nome: 'Contrato com fase fiscal pendente', severidade: 'critical', dimensao: 'validade', classe: 'negocio', prazoDias: 10,
    descricao: 'Contrato ainda não encerrou a fase fiscal no legado.',
    acao: 'Reter. Migrar criaria compromisso sem lastro fiscal.', roteadoPara: 'Verene · Fiscal', plantedKind: 'fase-fiscal-pendente' },
  { id: 'DEF-SRC-05', origin: 'source-extract', nome: 'Cabeçalho não reconcilia com as linhas', severidade: 'critical', dimensao: 'precisao', classe: 'negocio', prazoDias: 5,
    descricao: 'A soma das linhas difere do valor original do contrato.',
    acao: 'Reter até a origem explicar a diferença.', roteadoPara: 'Verene · Suprimentos', plantedKind: 'saldo-diverge-do-original' },
  { id: 'DEF-SRC-06', origin: 'source-extract', nome: 'NCM ausente', severidade: 'critical', dimensao: 'completude', classe: 'negocio', prazoDias: 5,
    descricao: 'Material sem classificação fiscal.',
    acao: 'Reter. Sem NCM não há cálculo de imposto no destino.', roteadoPara: 'Verene · Fiscal', plantedKind: 'ncm-ausente' },
  { id: 'DEF-SRC-07', origin: 'source-extract', nome: 'Descrição fora de padrão', severidade: 'non-critical', dimensao: 'conformidade', classe: 'negocio', prazoDias: 15,
    descricao: 'Recado de comprador, marcação de urgência ou status do item escritos na descrição.',
    acao: 'Registrar e seguir. A reescrita é regra candidata.', roteadoPara: 'Verene · Suprimentos', plantedKind: 'descricao-fora-de-padrao' },
  { id: 'DEF-SRC-08', origin: 'source-extract', nome: 'Município sem código IBGE', severidade: 'non-critical', dimensao: 'completude', classe: 'tecnica', prazoDias: 2,
    descricao: 'O extrato trouxe município e UF, mas não o código.',
    acao: 'Enriquecer pela tabela de referência do IBGE. Só retém se o município não existir na tabela.', roteadoPara: 'Monoda · Data Engineering', plantedKind: 'municipio-sem-ibge' },
  { id: 'DEF-SRC-09', origin: 'source-extract', nome: 'Data em formato divergente', severidade: 'non-critical', dimensao: 'conformidade', classe: 'tecnica', prazoDias: 2,
    descricao: 'Parte do extrato em DD/MM/AAAA, parte em AAAA-MM-DD.',
    acao: 'Normalizar por regra de conversão. Não retém.', roteadoPara: 'Monoda · Data Engineering', plantedKind: 'data-formato-divergente' },
  { id: 'DEF-TRF-01', origin: 'transformation', nome: 'Unidade de medida divergente entre SPEs', severidade: 'critical', dimensao: 'consistencia', classe: 'tecnica', prazoDias: 2,
    descricao: 'O mesmo metro linear escrito como M, MT e METRO. Sem normalizar, o volume contratado muda de ordem de grandeza.',
    acao: 'Converter pelo domínio do tenant, mantendo a quantidade.', roteadoPara: 'Monoda · Data Engineering', plantedKind: 'unidade-medida-divergente' },
  { id: 'DEF-TRF-02', origin: 'transformation', nome: 'Razão social cortada no meio da palavra', severidade: 'critical', dimensao: 'conformidade', classe: 'tecnica', prazoDias: 2,
    descricao: 'NAME_ORG1 tem 40 caracteres; razão social maior precisa quebrar em NAME_ORG2 no espaço, não na letra. O nome é o que identifica o Business Partner no documento fiscal.',
    acao: 'Corrigir a REGRA de quebra e republicar o playbook. Aprovar o registro assim só carimba o corte errado — o defeito é da regra, não do dado.',
    roteadoPara: 'Monoda · Data Engineering', plantedKind: null },
  { id: 'DEF-TRF-03', origin: 'transformation', nome: 'Falta regra para um caso presente no dado', severidade: 'critical', dimensao: 'consistencia', classe: 'tecnica', prazoDias: 3,
    descricao: 'O dado apresenta uma situação que o playbook não cobre em nenhuma regra ativa.',
    acao: 'Reter e abrir regra candidata para promoção.', roteadoPara: 'Monoda · Data Engineering', plantedKind: null },
  { id: 'DEF-TGT-01', origin: 'target-config', nome: 'Fornecedor já cadastrado no destino', severidade: 'critical', dimensao: 'unicidade', classe: 'negocio', prazoDias: 3,
    descricao: 'O documento já existe como Business Partner no tenant. Recriar gera duplicata que só aparece no fechamento fiscal.',
    acao: 'Reusar o Business Partner existente em vez de criar.', roteadoPara: 'Verene · Suprimentos', plantedKind: 'ja-existe-no-destino' },
  { id: 'DEF-TGT-02', origin: 'target-config', nome: 'Campo obrigatório fora do padrão SAP', severidade: 'critical', dimensao: 'completude', classe: 'tecnica', prazoDias: 3,
    descricao: 'O tenant exige um campo que o SAP de fábrica deixa opcional, e o legado não tem esse dado.',
    acao: 'Reter e evidenciar a divergência para decisão da Verene.', roteadoPara: 'Verene · Arquitetura S/4HANA', plantedKind: null },
  { id: 'DEF-TGT-03', origin: 'target-config', nome: 'Valor sem entrada no domínio do tenant', severidade: 'critical', dimensao: 'validade', classe: 'tecnica', prazoDias: 3,
    descricao: 'O valor do legado não tem correspondente no domínio configurado.',
    acao: 'Reter. Criar entrada de domínio é decisão de configuração, não de migração.', roteadoPara: 'Verene · Arquitetura S/4HANA', plantedKind: null },
  { id: 'DEF-TGT-04', origin: 'target-config', nome: 'Regra de negócio não escrita em lugar nenhum', severidade: 'critical', dimensao: 'consistencia', classe: 'negocio', prazoDias: 5,
    descricao: 'Duas SPEs tratam o mesmo caso de forma diferente e nenhuma configuração do tenant decide qual está certa.',
    acao: 'Reter os dois lados e escalar para o dono do processo. É decisão, não engenharia.', roteadoPara: 'Verene · Fiscal', plantedKind: 'retencao-pf-divergente' },
  { id: 'DEF-LOD-01', origin: 'load-execution', nome: 'Lote rejeitado pelo Migration Cockpit', severidade: 'critical', dimensao: 'validade', classe: 'tecnica', prazoDias: 1,
    descricao: 'O pacote foi recusado na execução, apesar de íntegro no checksum.',
    acao: 'Reenviar após tratar a causa apontada pelo destino.', roteadoPara: 'Monoda · Data Engineering', plantedKind: null },
  { id: 'DEF-LOD-02', origin: 'load-execution', nome: 'Faixa de numeração esgotada', severidade: 'critical', dimensao: 'validade', classe: 'tecnica', prazoDias: 1,
    descricao: 'A faixa externa do grupo de contas acabou durante a carga.',
    acao: 'Parar a carga. Estender a faixa é ação do time Basis da Verene.', roteadoPara: 'Verene · Basis', plantedKind: null },
  { id: 'DEF-LOD-03', origin: 'load-execution', nome: 'Ambiente indisponível na janela de carga', severidade: 'non-critical', dimensao: 'precisao', classe: 'tecnica', prazoDias: 1,
    descricao: 'O tenant não respondeu na janela acordada.',
    acao: 'Reagendar. O pacote continua válido — o checksum prova.', roteadoPara: 'Verene · Basis', plantedKind: null },
]

const defectOriginById = Object.fromEntries(defectOrigins.map((o) => [o.id, o]))
const defectTypeById = new Map(defectTypes.map((t) => [t.id, t]))
const defectTypeByPlantedKind = new Map(
  defectTypes.filter((t) => t.plantedKind !== null).map((t) => [t.plantedKind, t]),
)
/** Token de cor da origem. Cor nunca é o único portador: todo badge leva rótulo. */
const tokenDaOrigem = (origin) => defectOriginById[origin].token


/* ---------- extrato do Nasajon: fornecedores ------------------------------- */
/**
 * Sujo de propósito. Os defeitos são plantados e etiquetados em
 * `_plantedDefect`, com o campo afetado, a nota que a tela deve mostrar e a
 * origem na escala de cor do design system — nenhuma tela precisa redescobrir
 * defeito por heurística.
 *
 * Subconjunto de 24 dos 42 registros do projeto, com TODOS os tipos de defeito
 * preservados: 3 CNPJ inválidos, 4 pares duplicados entre SPEs, 2 já cadastrados
 * no tenant, CNAE ausente, município sem IBGE, data em formato divergente e as
 * 2 duplas de pessoa física com retenção divergente — o insumo do Momento 2.
 *
 * Dados inventados nunca levam nome de empresa real: CNPJ fictício em razão
 * social real afirmaria como verdadeiro um cadastro que não existe.
 */
const nasajonSuppliers = [
  {
    codigo: 'F1001',
    spe: 'SPE-1',
    razaoSocial: 'ELETROSUL MANUTENCAO DE LINHAS LTDA',
    nomeFantasia: 'ELETROSUL',
    naturezaPessoa: 'J',
    cnpjCpf: '04812336000100',
    inscricaoEstadual: '0623418907',
    inscricaoMunicipal: '114820',
    cnae: '4221-9/02',
    logradouro: 'Rodovia BR-050 KM 78',
    numero: 's/n',
    complemento: 'Galpao 3',
    bairro: 'Distrito Industrial',
    cep: '38402-359',
    municipio: 'Uberlândia',
    codigoIbge: '3170206',
    uf: 'MG',
    banco: '341',
    agencia: '2871',
    conta: '18402-6',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: true, aliquotaIss: 5 },
    dataCadastro: '14/03/2019',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'duplicata-grafia',
        origin: 'defect-source',
        field: 'razaoSocial',
        note: 'Mesmo CNPJ da SPE-3 com grafia divergente: caixa alta, sem acento e sem o sufixo ME.',
        relatedCode: 'F3001',
      },
    ],
  },
  {
    codigo: 'F1002',
    spe: 'SPE-1',
    razaoSocial: 'GUINDALTA LOCACAO DE EQUIPAMENTOS LTDA',
    nomeFantasia: 'GUINDALTA',
    naturezaPessoa: 'J',
    cnpjCpf: '11.428.760/0001-10',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '203877',
    cnae: '7732-2/01',
    logradouro: 'Avenida Amazonas',
    numero: '4120',
    complemento: null,
    bairro: 'Gutierrez',
    cep: '30431-045',
    municipio: 'Belo Horizonte',
    codigoIbge: '3106200',
    uf: 'MG',
    banco: '237',
    agencia: '1188',
    conta: '44029-1',
    tipoConta: 'CC',
    condicaoPagamento: '28 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: false, irrf: true, inss: false, pisCofinsCsll: true, aliquotaIss: null },
    dataCadastro: '02/08/2018',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'duplicata-grafia',
        origin: 'defect-source',
        field: 'razaoSocial',
        note: 'Mesmo CNPJ da SPE-2 com grafia divergente: sem acento e sem o sufixo EPP.',
        relatedCode: 'F2002',
      },
    ],
  },
  {
    codigo: 'F1003',
    spe: 'SPE-1',
    razaoSocial: 'ALTA TENSAO SERVICOS ELETRICOS LTDA',
    nomeFantasia: 'ALTA TENSÃO',
    naturezaPessoa: 'J',
    cnpjCpf: '18.630.492/0001-65',
    inscricaoEstadual: '0011947256',
    inscricaoMunicipal: '309114',
    cnae: '4321-5/00',
    logradouro: 'Rua Padre Eustáquio',
    numero: '1877',
    complemento: 'Sala 12',
    bairro: 'Padre Eustáquio',
    cep: '30720-540',
    municipio: 'Belo Horizonte',
    codigoIbge: '3106200',
    uf: 'MG',
    banco: '001',
    agencia: '3055',
    conta: '9847-2',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'simples-nacional',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: true, aliquotaIss: 5 },
    dataCadastro: '21/11/2020',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'cnpj-dv-invalido',
        origin: 'defect-source',
        field: 'cnpjCpf',
        note: 'Dígito verificador não fecha. O número foi digitado à mão no extrato e nunca passou por validação.',
      },
    ],
  },
  {
    codigo: 'F1004',
    spe: 'SPE-1',
    razaoSocial: 'CONDULINK COMERCIO DE CABOS E CONDUTORES LTDA',
    nomeFantasia: 'CONDULINK',
    naturezaPessoa: 'J',
    cnpjCpf: '09175283000187',
    inscricaoEstadual: '7043112856',
    inscricaoMunicipal: '88120',
    cnae: '4673-7/00',
    logradouro: 'Rua Barão de Jaguara',
    numero: '2210',
    complemento: 'Conj 806',
    bairro: 'Centro',
    cep: '13015-002',
    municipio: 'Campinas',
    codigoIbge: '3509502',
    uf: 'SP',
    banco: '033',
    agencia: '0447',
    conta: '13077-9',
    tipoConta: 'CC',
    condicaoPagamento: '28/56 DD',
    regimeTributario: 'lucro-real',
    retencoes: { iss: false, irrf: false, inss: false, pisCofinsCsll: false, aliquotaIss: null },
    dataCadastro: '09/05/2017',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'ja-existe-no-destino',
        origin: 'defect-target-config',
        field: 'cnpjCpf',
        note: 'CNPJ já cadastrado na base da Verene como Business Partner. Deve ser reusado, não recriado.',
        relatedCode: '1000004472',
      },
    ],
  },
  {
    codigo: 'F1009',
    spe: 'SPE-1',
    razaoSocial: 'APARECIDO NUNES DE OLIVEIRA',
    nomeFantasia: 'APARECIDO TOPOGRAFIA',
    naturezaPessoa: 'F',
    cnpjCpf: '128.459.376-28',
    inscricaoEstadual: null,
    inscricaoMunicipal: '772041',
    cnae: '7119-7/01',
    logradouro: 'Rua dos Andradas',
    numero: '215',
    complemento: 'Fundos',
    bairro: 'São Jorge',
    cep: '38401-146',
    municipio: 'Uberlândia',
    codigoIbge: '3170206',
    uf: 'MG',
    banco: '001',
    agencia: '3055',
    conta: '12045-7',
    tipoConta: 'CC',
    condicaoPagamento: '15 DD',
    regimeTributario: 'pessoa-fisica',
    retencoes: { iss: false, irrf: true, inss: true, pisCofinsCsll: false, aliquotaIss: null },
    dataCadastro: '08/04/2021',
    ativo: true,
    _plantedDefect: [],
  },
  {
    codigo: 'F1010',
    spe: 'SPE-1',
    razaoSocial: 'SIGMA ENGENHARIA DE SUBESTACOES LTDA',
    nomeFantasia: 'SIGMA SUBESTAÇÕES',
    naturezaPessoa: 'J',
    cnpjCpf: '08.935.620/0001-24',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '990214',
    cnae: '7112-0/00',
    logradouro: 'Rua Marechal Deodoro',
    numero: '1200',
    complemento: 'Sala 45',
    bairro: 'Centro',
    cep: '36013-130',
    municipio: 'Juiz de Fora',
    codigoIbge: '3136702',
    uf: 'MG',
    banco: '033',
    agencia: '3390',
    conta: '41077-2',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: true, irrf: true, inss: false, pisCofinsCsll: true, aliquotaIss: 3 },
    dataCadastro: '11/10/2018',
    ativo: true,
    _plantedDefect: [],
  },
  {
    codigo: 'F2001',
    spe: 'SPE-2',
    razaoSocial: 'ENGELET PROJETOS E ENGENHARIA ELETRICA LTDA',
    nomeFantasia: 'ENGELET',
    naturezaPessoa: 'J',
    cnpjCpf: '07319554000103',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '330871',
    cnae: '7112-0/00',
    logradouro: 'Rua Comendador Araújo',
    numero: '731',
    complemento: 'Cj 1502',
    bairro: 'Batel',
    cep: '80420-000',
    municipio: 'Curitiba',
    codigoIbge: '4106902',
    uf: 'PR',
    banco: '341',
    agencia: '1622',
    conta: '30977-4',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: true, irrf: true, inss: false, pisCofinsCsll: true, aliquotaIss: 3 },
    dataCadastro: '06/02/2018',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'duplicata-grafia',
        origin: 'defect-source',
        field: 'razaoSocial',
        note: 'Mesmo CNPJ da SPE-4 com grafia divergente: caixa alta e sem acento.',
        relatedCode: 'F4001',
      },
    ],
  },
  {
    codigo: 'F2002',
    spe: 'SPE-2',
    razaoSocial: 'Guindalta Locação de Equipamentos Ltda - EPP',
    nomeFantasia: 'GUINDALTA EPP',
    naturezaPessoa: 'J',
    cnpjCpf: '11428760000110',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '203877',
    cnae: '7732-2/01',
    logradouro: 'Avenida Amazonas',
    numero: '4120',
    complemento: null,
    bairro: 'Gutierrez',
    cep: '30431-045',
    municipio: 'Belo Horizonte',
    codigoIbge: '3106200',
    uf: 'MG',
    banco: '237',
    agencia: '1188',
    conta: '44029-1',
    tipoConta: 'CC',
    condicaoPagamento: '28 DD',
    regimeTributario: 'simples-nacional',
    retencoes: { iss: false, irrf: true, inss: false, pisCofinsCsll: true, aliquotaIss: null },
    dataCadastro: '15/03/2020',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'duplicata-grafia',
        origin: 'defect-source',
        field: 'razaoSocial',
        note: 'Mesmo CNPJ da SPE-1 com grafia divergente e regime tributário diferente no cadastro.',
        relatedCode: 'F1002',
      },
    ],
  },
  {
    codigo: 'F2003',
    spe: 'SPE-2',
    razaoSocial: 'LINHATIVA MANUTENCAO DE TRANSMISSAO LTDA',
    nomeFantasia: 'LINHATIVA',
    naturezaPessoa: 'J',
    cnpjCpf: '19506273000131',
    inscricaoEstadual: '9051762230',
    inscricaoMunicipal: '771204',
    cnae: '4221-9/02',
    logradouro: 'Rodovia PR-445 KM 30',
    numero: 's/n',
    complemento: null,
    bairro: 'Distrito Industrial',
    cep: '86072-000',
    municipio: 'Londrina',
    codigoIbge: '4113700',
    uf: 'PR',
    banco: '756',
    agencia: '0812',
    conta: '61120-8',
    tipoConta: 'CC',
    condicaoPagamento: '28 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: true, aliquotaIss: 5 },
    dataCadastro: '13/07/2019',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'cnpj-dv-invalido',
        origin: 'defect-source',
        field: 'cnpjCpf',
        note: 'Dígito verificador não fecha. Número provavelmente transcrito de nota fiscal com erro.',
      },
    ],
  },
  {
    codigo: 'F2004',
    spe: 'SPE-2',
    razaoSocial: 'LOCAVOLT MAQUINAS E EQUIPAMENTOS LTDA',
    nomeFantasia: 'LOCAVOLT',
    naturezaPessoa: 'J',
    cnpjCpf: '12.085.347/0001-63',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '445120',
    cnae: null,
    logradouro: 'Avenida Colombo',
    numero: '9200',
    complemento: null,
    bairro: 'Zona 07',
    cep: '87020-900',
    municipio: 'Maringá',
    codigoIbge: '4115200',
    uf: 'PR',
    banco: '001',
    agencia: '3155',
    conta: '77410-2',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'simples-nacional',
    retencoes: { iss: false, irrf: true, inss: false, pisCofinsCsll: true, aliquotaIss: null },
    dataCadastro: '28/05/2021',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'cnae-ausente',
        origin: 'defect-source',
        field: 'cnae',
        note: 'CNAE em branco no extrato.',
      },
    ],
  },
  {
    codigo: 'F2007',
    spe: 'SPE-2',
    razaoSocial: 'PRECISAO GEORREFERENCIAMENTO LTDA',
    nomeFantasia: 'PRECISÃO GEO',
    naturezaPessoa: 'J',
    cnpjCpf: '10592764000177',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '704411',
    cnae: '7119-7/01',
    logradouro: 'Rua Blumenau',
    numero: '340',
    complemento: null,
    bairro: 'América',
    cep: '89204-250',
    municipio: 'Joinville',
    codigoIbge: '4209102',
    uf: 'SC',
    banco: '748',
    agencia: '0710',
    conta: '33780-6',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'simples-nacional',
    retencoes: { iss: true, irrf: true, inss: false, pisCofinsCsll: true, aliquotaIss: 2 },
    dataCadastro: '2020-11-09',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'data-formato-divergente',
        origin: 'defect-transformation',
        field: 'dataCadastro',
        note: 'Data em AAAA-MM-DD enquanto o resto do extrato usa DD/MM/AAAA.',
      },
    ],
  },
  {
    codigo: 'F2008',
    spe: 'SPE-2',
    razaoSocial: 'MARCOS VINICIUS PRADO SALGADO',
    nomeFantasia: 'M. V. P. SALGADO',
    naturezaPessoa: 'F',
    cnpjCpf: '24709361525',
    inscricaoEstadual: null,
    inscricaoMunicipal: '118207',
    cnae: '4321-5/00',
    logradouro: 'Rua Almirante Barroso',
    numero: '88',
    complemento: null,
    bairro: 'Velha',
    cep: '89046-100',
    municipio: 'Blumenau',
    codigoIbge: '4202404',
    uf: 'SC',
    banco: '756',
    agencia: '4088',
    conta: '9021-3',
    tipoConta: 'CC',
    condicaoPagamento: '15 DD',
    regimeTributario: 'pessoa-fisica',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: false, aliquotaIss: 5 },
    dataCadastro: '12/06/2020',
    ativo: true,
    _plantedDefect: [],
  },
  {
    codigo: 'F3001',
    spe: 'SPE-3',
    razaoSocial: 'Eletrosul Manutençao de Linhas Ltda ME',
    nomeFantasia: 'Eletrosul ME',
    naturezaPessoa: 'J',
    cnpjCpf: '04.812.336/0001-00',
    inscricaoEstadual: '0623418907',
    inscricaoMunicipal: '114820',
    cnae: '4221-9/02',
    logradouro: 'Rod BR-050 Km 78',
    numero: 'SN',
    complemento: null,
    bairro: 'Distrito Industrial',
    cep: '38402-359',
    municipio: 'Uberlândia',
    codigoIbge: '3170206',
    uf: 'MG',
    banco: '341',
    agencia: '2871',
    conta: '18402-6',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'simples-nacional',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: true, aliquotaIss: 5 },
    dataCadastro: '27/05/2021',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'duplicata-grafia',
        origin: 'defect-source',
        field: 'razaoSocial',
        note: 'Mesmo CNPJ da SPE-1 com grafia divergente: caixa mista, acento faltando em "Manutençao" e sufixo ME.',
        relatedCode: 'F1001',
      },
    ],
  },
  {
    codigo: 'F3002',
    spe: 'SPE-3',
    razaoSocial: 'PROTEGE EPI COM DE EQUIP LTDA',
    nomeFantasia: 'PROTEGE EPI',
    naturezaPessoa: 'J',
    cnpjCpf: '02947105000188',
    inscricaoEstadual: '0961204471',
    inscricaoMunicipal: '770231',
    cnae: '4642-7/02',
    logradouro: 'Rua Vinte de Setembro',
    numero: '1420',
    complemento: null,
    bairro: 'Centro',
    cep: '95020-450',
    municipio: 'Caxias do Sul',
    codigoIbge: '4305108',
    uf: 'RS',
    banco: '237',
    agencia: '0311',
    conta: '52204-8',
    tipoConta: 'CC',
    condicaoPagamento: '45 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: false, irrf: false, inss: false, pisCofinsCsll: false, aliquotaIss: null },
    dataCadastro: '23/04/2018',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'duplicata-grafia',
        origin: 'defect-source',
        field: 'razaoSocial',
        note: 'Mesmo CNPJ da SPE-4 com razão social abreviada ("COM DE EQUIP").',
        relatedCode: 'F4002',
      },
    ],
  },
  {
    codigo: 'F3003',
    spe: 'SPE-3',
    razaoSocial: 'INSPETEC ENSAIOS E INSPECOES TECNICAS LTDA',
    nomeFantasia: 'INSPETEC',
    naturezaPessoa: 'J',
    cnpjCpf: '07.048.362/0001-00',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '448190',
    cnae: '7120-1/00',
    logradouro: 'Avenida Ipiranga',
    numero: '6681',
    complemento: 'Prédio 30',
    bairro: 'Partenon',
    cep: '90619-900',
    municipio: 'Porto Alegre',
    codigoIbge: '4314902',
    uf: 'RS',
    banco: '001',
    agencia: '1899',
    conta: '30447-1',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: true, irrf: true, inss: false, pisCofinsCsll: true, aliquotaIss: 3 },
    dataCadastro: '14/08/2017',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'ja-existe-no-destino',
        origin: 'defect-target-config',
        field: 'cnpjCpf',
        note: 'CNPJ já cadastrado na base da Verene como Business Partner. Deve ser reusado, não recriado.',
        relatedCode: '1000004488',
      },
    ],
  },
  {
    codigo: 'F3004',
    spe: 'SPE-3',
    razaoSocial: 'TOPOLINE SERVICOS DE TOPOGRAFIA LTDA',
    nomeFantasia: 'TOPOLINE',
    naturezaPessoa: 'J',
    cnpjCpf: '14957203000185',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '661200',
    cnae: null,
    logradouro: 'Rua Venâncio Aires',
    numero: '380',
    complemento: null,
    bairro: 'Centro',
    cep: '97010-001',
    municipio: 'Santa Maria',
    codigoIbge: '4316907',
    uf: 'RS',
    banco: '748',
    agencia: '0331',
    conta: '8871-4',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'simples-nacional',
    retencoes: { iss: true, irrf: true, inss: false, pisCofinsCsll: true, aliquotaIss: 2 },
    dataCadastro: '19/10/2020',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'cnae-ausente',
        origin: 'defect-source',
        field: 'cnae',
        note: 'CNAE em branco no extrato.',
      },
    ],
  },
  {
    codigo: 'F3005',
    spe: 'SPE-3',
    razaoSocial: 'CONDUTEC SERVICOS EM LINHAS VIVAS LTDA',
    nomeFantasia: 'CONDUTEC',
    naturezaPessoa: 'J',
    cnpjCpf: '20.386.514/0001-34',
    inscricaoEstadual: '0330911274',
    inscricaoMunicipal: '229044',
    cnae: '4221-9/02',
    logradouro: 'Rodovia RS-135 Km 8',
    numero: 's/n',
    complemento: 'Barracão 2',
    bairro: 'Zona Industrial',
    cep: '99050-000',
    municipio: 'Passo Fundo',
    codigoIbge: null,
    uf: 'RS',
    banco: '033',
    agencia: '1477',
    conta: '66120-3',
    tipoConta: 'CC',
    condicaoPagamento: '28/56 DD',
    regimeTributario: 'lucro-real',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: true, aliquotaIss: 5 },
    dataCadastro: '07/03/2019',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'municipio-sem-ibge',
        origin: 'defect-transformation',
        field: 'codigoIbge',
        note: 'Município sem código IBGE no extrato.',
      },
    ],
  },
  {
    codigo: 'F3007',
    spe: 'SPE-3',
    razaoSocial: 'APARECIDO NUNES DE OLIVEIRA',
    nomeFantasia: 'APARECIDO TOPOGRAFIA',
    naturezaPessoa: 'F',
    cnpjCpf: '12845937628',
    inscricaoEstadual: null,
    inscricaoMunicipal: '772041',
    cnae: '7119-7/01',
    logradouro: 'Rua dos Andradas',
    numero: '215',
    complemento: 'Fundos',
    bairro: 'São Jorge',
    cep: '38401-146',
    municipio: 'Uberlândia',
    codigoIbge: '3170206',
    uf: 'MG',
    banco: '001',
    agencia: '3055',
    conta: '12045-7',
    tipoConta: 'CC',
    condicaoPagamento: '15 DD',
    regimeTributario: 'pessoa-fisica',
    retencoes: { iss: false, irrf: true, inss: false, pisCofinsCsll: false, aliquotaIss: null },
    dataCadastro: '30/07/2021',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'retencao-pf-divergente',
        origin: 'defect-transformation',
        field: 'retencoes',
        note: 'Mesmo CPF da SPE-1, mas aqui sem retenção de INSS. Duas SPEs tratam o mesmo prestador de forma diferente — a regra correta não está escrita em lugar nenhum.',
        relatedCode: 'F1009',
      },
    ],
  },
  {
    codigo: 'F4001',
    spe: 'SPE-4',
    razaoSocial: 'Engelet Projetos e Engenharia Elétrica Ltda.',
    nomeFantasia: 'Engelet',
    naturezaPessoa: 'J',
    cnpjCpf: '07.319.554/0001-03',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '330871',
    cnae: '7112-0/00',
    logradouro: 'Rua Comendador Araújo',
    numero: '731',
    complemento: 'Conjunto 1502',
    bairro: 'Batel',
    cep: '80420-000',
    municipio: 'Curitiba',
    codigoIbge: '4106902',
    uf: 'PR',
    banco: '341',
    agencia: '1622',
    conta: '30977-4',
    tipoConta: 'CC',
    condicaoPagamento: '30 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: true, irrf: true, inss: false, pisCofinsCsll: true, aliquotaIss: 3 },
    dataCadastro: '11/09/2020',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'duplicata-grafia',
        origin: 'defect-source',
        field: 'razaoSocial',
        note: 'Mesmo CNPJ da SPE-2 com grafia divergente: caixa mista, acentuada e com ponto final.',
        relatedCode: 'F2001',
      },
    ],
  },
  {
    codigo: 'F4002',
    spe: 'SPE-4',
    razaoSocial: 'Protege EPI Comércio de Equipamentos Ltda',
    nomeFantasia: 'Protege EPI',
    naturezaPessoa: 'J',
    cnpjCpf: '02.947.105/0001-88',
    inscricaoEstadual: '0961204471',
    inscricaoMunicipal: '770231',
    cnae: '4642-7/02',
    logradouro: 'Rua Vinte de Setembro',
    numero: '1420',
    complemento: 'Loja 2',
    bairro: 'Centro',
    cep: '95020-450',
    municipio: 'Caxias do Sul',
    codigoIbge: '4305108',
    uf: 'RS',
    banco: '237',
    agencia: '0311',
    conta: '52204-8',
    tipoConta: 'CC',
    condicaoPagamento: '45 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: false, irrf: false, inss: false, pisCofinsCsll: false, aliquotaIss: null },
    dataCadastro: '08/10/2021',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'duplicata-grafia',
        origin: 'defect-source',
        field: 'razaoSocial',
        note: 'Mesmo CNPJ da SPE-3 com razão social por extenso.',
        relatedCode: 'F3002',
      },
    ],
  },
  {
    codigo: 'F4003',
    spe: 'SPE-4',
    razaoSocial: 'TENSAO NORTE MANUTENCAO ELETRICA LTDA',
    nomeFantasia: 'TENSÃO NORTE',
    naturezaPessoa: 'J',
    cnpjCpf: '11.736.420/0001-58',
    inscricaoEstadual: '1047711209',
    inscricaoMunicipal: '220188',
    cnae: '4221-9/02',
    logradouro: 'Avenida Perimetral Norte',
    numero: '4129',
    complemento: 'Galpão 5',
    bairro: 'Fazenda Retiro',
    cep: '74675-090',
    municipio: 'Goiânia',
    codigoIbge: '5208707',
    uf: 'GO',
    banco: '001',
    agencia: '2801',
    conta: '61044-7',
    tipoConta: 'CC',
    condicaoPagamento: '28 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: true, aliquotaIss: 5 },
    dataCadastro: '26/02/2020',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'cnpj-dv-invalido',
        origin: 'defect-source',
        field: 'cnpjCpf',
        note: 'Dígito verificador não fecha.',
      },
    ],
  },
  {
    codigo: 'F4007',
    spe: 'SPE-4',
    razaoSocial: 'MARCOS VINICIUS PRADO SALGADO',
    nomeFantasia: 'M. V. P. SALGADO',
    naturezaPessoa: 'F',
    cnpjCpf: '247.093.615-25',
    inscricaoEstadual: null,
    inscricaoMunicipal: '118207',
    cnae: '4321-5/00',
    logradouro: 'Rua Almirante Barroso',
    numero: '88',
    complemento: null,
    bairro: 'Velha',
    cep: '89046-100',
    municipio: 'Blumenau',
    codigoIbge: '4202404',
    uf: 'SC',
    banco: '756',
    agencia: '4088',
    conta: '9021-3',
    tipoConta: 'CC',
    condicaoPagamento: '15 DD',
    regimeTributario: 'pessoa-fisica',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: false, aliquotaIss: 2 },
    dataCadastro: '19/02/2021',
    ativo: true,
    _plantedDefect: [
      {
        kind: 'retencao-pf-divergente',
        origin: 'defect-transformation',
        field: 'retencoes',
        note: 'Mesmo CPF da SPE-2, mas com ISS a 2% em vez de 5%. Duas SPEs retêm alíquotas diferentes do mesmo prestador, no mesmo serviço.',
        relatedCode: 'F2008',
      },
    ],
  },
  {
    codigo: 'F4009',
    spe: 'SPE-4',
    razaoSocial: 'VIGILANCIA LINHA VIVA LTDA',
    nomeFantasia: 'LINHA VIVA SEGURANÇA',
    naturezaPessoa: 'J',
    cnpjCpf: '25037164000114',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '770144',
    cnae: '8011-1/01',
    logradouro: 'Quadra 302 Conjunto B',
    numero: 'Lote 5',
    complemento: null,
    bairro: 'Asa Norte',
    cep: '70720-620',
    municipio: 'Brasília',
    codigoIbge: '5300108',
    uf: 'DF',
    banco: '104',
    agencia: '1288',
    conta: '66021-9',
    tipoConta: 'CC',
    condicaoPagamento: '28 DD',
    regimeTributario: 'lucro-presumido',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: true, aliquotaIss: 5 },
    dataCadastro: '13/03/2019',
    ativo: true,
    _plantedDefect: [],
  },
  {
    codigo: 'F4010',
    spe: 'SPE-4',
    razaoSocial: 'LIMPA FAIXA SERVICOS DE ROCADA LTDA',
    nomeFantasia: 'LIMPA FAIXA',
    naturezaPessoa: 'J',
    cnpjCpf: '16.918.532/0001-42',
    inscricaoEstadual: 'ISENTO',
    inscricaoMunicipal: '330277',
    cnae: '8130-3/00',
    logradouro: 'Rodovia TO-050 Km 15',
    numero: 's/n',
    complemento: null,
    bairro: 'Zona Rural',
    cep: '77270-000',
    municipio: 'Palmas',
    codigoIbge: '1721000',
    uf: 'TO',
    banco: '756',
    agencia: '2011',
    conta: '8890-1',
    tipoConta: 'CP',
    condicaoPagamento: '28 DD',
    regimeTributario: 'simples-nacional',
    retencoes: { iss: true, irrf: true, inss: true, pisCofinsCsll: true, aliquotaIss: 5 },
    dataCadastro: '29/08/2020',
    ativo: true,
    _plantedDefect: [],
  },
]

/* ---------- extrato do Nasajon: contratos ---------------------------------- */
/**
 * O mesmo metro linear aparece como `M` na SPE-1, `MT` na SPE-2 e `METRO` nas
 * SPE-3 e SPE-4. Nenhuma delas é o código que o tenant espera. Dois contratos
 * ainda não fecharam a fase fiscal e não podem virar Outline agreement; num
 * deles a soma das linhas não bate com o cabeçalho — isso é defeito, não
 * execução parcial.
 */
const UOM_DIVERGENTE = (unidade, esperado) => ({
  kind: 'unidade-medida-divergente',
  origin: 'defect-transformation',
  field: 'linhas[].unidadeMedida',
  note: `Metro linear registrado como "${unidade}". Outras SPEs usam "${esperado}". O tenant não aceita nenhuma das duas sem conversão.`,
})

const nasajonContracts = [
  {
    numero: 'CTR-2023-101', spe: 'SPE-1', fornecedorCodigo: 'F1001',
    objeto: 'Manutenção preventiva de linha de transmissão 230 kV — trecho Uberlândia/Araguari',
    tipo: 'servico', dataInicio: '01/03/2023', dataFim: '28/02/2025', moeda: 'BRL',
    valorOriginal: 884800.0, saldoAberto: 331800.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Manutenção preventiva de LT 230 kV', unidadeMedida: 'M', quantidade: 48000, precoUnitario: 12.5, valorTotal: 600000.0, centroCusto: 'CC-LT-230' },
      { item: 20, descricao: 'Substituição de cadeia de isoladores de suspensão', unidadeMedida: 'UN', quantidade: 320, precoUnitario: 890.0, valorTotal: 284800.0, centroCusto: 'CC-LT-230' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-102', spe: 'SPE-1', fornecedorCodigo: 'F1002',
    objeto: 'Locação de guindaste com operador para montagem de estruturas',
    tipo: 'locacao', dataInicio: '15/04/2023', dataFim: '14/04/2025', moeda: 'BRL',
    valorOriginal: 756000.0, saldoAberto: 189000.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Locação de guindaste 60 t com operador', unidadeMedida: 'DIA', quantidade: 180, precoUnitario: 4200.0, valorTotal: 756000.0, centroCusto: 'CC-OBRA-01' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-104', spe: 'SPE-1', fornecedorCodigo: 'F1004',
    objeto: 'Fornecimento de cabo condutor e cabo para-raios',
    tipo: 'fornecimento', dataInicio: '10/01/2023', dataFim: '09/01/2025', moeda: 'BRL',
    valorOriginal: 2238600.0, saldoAberto: 745200.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Cabo condutor CAA 336,4 MCM Linnet', unidadeMedida: 'M', quantidade: 26000, precoUnitario: 38.9, valorTotal: 1011400.0, centroCusto: 'CC-SUP-01' },
      { item: 20, descricao: 'Cabo para-raios OPGW 24 fibras', unidadeMedida: 'M', quantidade: 26000, precoUnitario: 47.2, valorTotal: 1227200.0, centroCusto: 'CC-SUP-01' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-105', spe: 'SPE-1', fornecedorCodigo: 'F1010',
    objeto: 'Projeto executivo de recapacitação de LT 138 kV',
    tipo: 'servico', dataInicio: '01/09/2023', dataFim: '31/08/2024', moeda: 'BRL',
    valorOriginal: 486000.0, saldoAberto: 486000.0, faseFiscal: 'pendente',
    linhas: [
      { item: 10, descricao: 'Projeto executivo de recapacitação de LT 138 kV', unidadeMedida: 'VB', quantidade: 1, precoUnitario: 486000.0, valorTotal: 486000.0, centroCusto: 'CC-ENG-01' },
    ],
    _plantedDefect: [
      {
        kind: 'fase-fiscal-pendente', origin: 'defect-source', field: 'faseFiscal',
        note: 'Fase fiscal não encerrada no Nasajon. Não pode virar Outline agreement enquanto não fechar — migrar agora cria compromisso sem lastro fiscal.',
      },
    ],
  },
  {
    numero: 'CTR-2023-201', spe: 'SPE-2', fornecedorCodigo: 'F2001',
    objeto: 'Projeto básico de subestação 230/69 kV e acompanhamento de comissionamento',
    tipo: 'servico', dataInicio: '01/02/2023', dataFim: '31/01/2025', moeda: 'BRL',
    valorOriginal: 1062000.0, saldoAberto: 318600.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Projeto básico de subestação 230/69 kV', unidadeMedida: 'VB', quantidade: 1, precoUnitario: 720000.0, valorTotal: 720000.0, centroCusto: 'CC-SE-01' },
      { item: 20, descricao: 'Acompanhamento de comissionamento', unidadeMedida: 'H', quantidade: 1200, precoUnitario: 285.0, valorTotal: 342000.0, centroCusto: 'CC-SE-01' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-203', spe: 'SPE-2', fornecedorCodigo: 'F2003',
    objeto: 'Manutenção corretiva de linha de transmissão 138 kV',
    tipo: 'servico', dataInicio: '05/06/2023', dataFim: '04/06/2025', moeda: 'BRL',
    valorOriginal: 637200.0, saldoAberto: 254880.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Manutenção corretiva de LT 138 kV', unidadeMedida: 'MT', quantidade: 54000, precoUnitario: 11.8, valorTotal: 637200.0, centroCusto: 'CC-LT-138' },
    ],
    _plantedDefect: [UOM_DIVERGENTE('MT', 'M')],
  },
  {
    numero: 'CTR-2023-204', spe: 'SPE-2', fornecedorCodigo: 'F2007',
    objeto: 'Georreferenciamento de faixa de servidão',
    tipo: 'servico', dataInicio: '11/07/2023', dataFim: '10/07/2024', moeda: 'BRL',
    valorOriginal: 172200.0, saldoAberto: 68880.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Georreferenciamento de faixa de servidão', unidadeMedida: 'MT', quantidade: 41000, precoUnitario: 4.2, valorTotal: 172200.0, centroCusto: 'CC-ENG-02' },
    ],
    _plantedDefect: [UOM_DIVERGENTE('MT', 'M')],
  },
  {
    numero: 'CTR-2023-301', spe: 'SPE-3', fornecedorCodigo: 'F3001',
    objeto: 'Manutenção preventiva de linha de transmissão 500 kV',
    tipo: 'servico', dataInicio: '01/04/2023', dataFim: '31/03/2026', moeda: 'BRL',
    valorOriginal: 866200.0, saldoAberto: 433100.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Manutenção preventiva de LT 500 kV', unidadeMedida: 'METRO', quantidade: 61000, precoUnitario: 14.2, valorTotal: 866200.0, centroCusto: 'CC-LT-500' },
    ],
    _plantedDefect: [UOM_DIVERGENTE('METRO', 'M')],
  },
  {
    numero: 'CTR-2023-303', spe: 'SPE-3', fornecedorCodigo: 'F3003',
    objeto: 'Inspeção termográfica e ensaios de aterramento',
    tipo: 'servico', dataInicio: '01/06/2023', dataFim: '31/05/2025', moeda: 'BRL',
    valorOriginal: 680200.0, saldoAberto: 204060.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Inspeção termográfica de subestação', unidadeMedida: 'UN', quantidade: 48, precoUnitario: 8900.0, valorTotal: 427200.0, centroCusto: 'CC-SE-02' },
      { item: 20, descricao: 'Ensaio de resistência de aterramento', unidadeMedida: 'UN', quantidade: 220, precoUnitario: 1150.0, valorTotal: 253000.0, centroCusto: 'CC-SE-02' },
    ],
    _plantedDefect: [],
  },
  {
    numero: 'CTR-2023-401', spe: 'SPE-4', fornecedorCodigo: 'F4003',
    objeto: 'Manutenção preventiva de linha de transmissão 345 kV',
    tipo: 'servico', dataInicio: '01/05/2023', dataFim: '30/04/2025', moeda: 'BRL',
    valorOriginal: 598400.0, saldoAberto: 239360.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Manutenção preventiva de LT 345 kV', unidadeMedida: 'METRO', quantidade: 44000, precoUnitario: 13.6, valorTotal: 598400.0, centroCusto: 'CC-LT-345' },
    ],
    _plantedDefect: [UOM_DIVERGENTE('METRO', 'M')],
  },
  {
    numero: 'CTR-2023-403', spe: 'SPE-4', fornecedorCodigo: 'F4009',
    objeto: 'Vigilância patrimonial de subestações',
    tipo: 'servico', dataInicio: '01/10/2023', dataFim: '30/09/2025', moeda: 'BRL',
    valorOriginal: 924000.0, saldoAberto: 924000.0, faseFiscal: 'pendente',
    linhas: [
      { item: 10, descricao: 'Vigilância patrimonial de subestação', unidadeMedida: 'MES', quantidade: 24, precoUnitario: 38500.0, valorTotal: 924000.0, centroCusto: 'CC-SEG-01' },
    ],
    _plantedDefect: [
      {
        kind: 'fase-fiscal-pendente', origin: 'defect-source', field: 'faseFiscal',
        note: 'Fase fiscal não encerrada no Nasajon. Não pode virar Outline agreement enquanto não fechar.',
      },
    ],
  },
  {
    numero: 'CTR-2023-404', spe: 'SPE-4', fornecedorCodigo: 'F4010',
    objeto: 'Roçada mecanizada e destoca da faixa de servidão',
    tipo: 'servico', dataInicio: '01/07/2023', dataFim: '30/06/2025', moeda: 'BRL',
    valorOriginal: 445000.0, saldoAberto: 178000.0, faseFiscal: 'concluida',
    linhas: [
      { item: 10, descricao: 'Roçada mecanizada de faixa de servidão', unidadeMedida: 'METRO', quantidade: 96000, precoUnitario: 2.85, valorTotal: 273600.0, centroCusto: 'CC-AMB-02' },
      { item: 20, descricao: 'Destoca e limpeza pontual', unidadeMedida: 'UN', quantidade: 480, precoUnitario: 320.0, valorTotal: 153600.0, centroCusto: 'CC-AMB-02' },
    ],
    _plantedDefect: [
      UOM_DIVERGENTE('METRO', 'M'),
      {
        kind: 'saldo-diverge-do-original', origin: 'defect-source', field: 'valorOriginal',
        note: 'A soma das linhas dá 427.200,00 e o cabeçalho diz 445.000,00. Diferença de 17.800,00 sem lançamento correspondente.',
      },
    ],
  },
]

/* ---------- extrato do Nasajon: materiais ---------------------------------- */
/**
 * Quatro materiais sem NCM — sem ele não há classificação fiscal nem cálculo de
 * imposto — e sete com descrição fora de padrão, com recado de comprador
 * embutido no cadastro. Três acumulam os dois defeitos.
 */
const SEM_NCM = {
  kind: 'ncm-ausente', origin: 'defect-source', field: 'ncm',
  note: 'NCM em branco. Sem classificação fiscal o material não fecha cálculo de imposto no destino.',
}
const FORA_PADRAO = (motivo) => ({
  kind: 'descricao-fora-de-padrao', origin: 'defect-source', field: 'descricao',
  note: `Descrição fora do padrão do tenant: ${motivo}`,
})

const nasajonMaterials = [
  { codigo: 'MAT-1001', spe: 'SPE-1', descricao: 'CABO CAA 336,4 MCM LINNET', grupoMercadoria: 'CONDUTOR', unidadeMedida: 'M', ncm: '7614.10.00', origemMercadoria: '0', precoMedio: 38.9, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-1003', spe: 'SPE-1', descricao: 'ISOLADOR POLIMERICO 230 KV', grupoMercadoria: 'ISOLADOR', unidadeMedida: 'UN', ncm: '8546.90.00', origemMercadoria: '0', precoMedio: 890.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-1004', spe: 'SPE-1', descricao: 'isolador vidro', grupoMercadoria: 'ISOLADOR', unidadeMedida: 'UN', ncm: '8546.10.00', origemMercadoria: '0', precoMedio: 142.5, ativo: true,
    _plantedDefect: [FORA_PADRAO('caixa baixa e sem especificação de classe ou tensão.')] },
  { codigo: 'MAT-1007', spe: 'SPE-1', descricao: 'CABO 336 MCM - VER COM JOSE', grupoMercadoria: 'CONDUTOR', unidadeMedida: 'M', ncm: null, origemMercadoria: '0', precoMedio: 38.9, ativo: true,
    _plantedDefect: [FORA_PADRAO('recado de comprador embutido na descrição ("VER COM JOSE").'), SEM_NCM] },
  { codigo: 'MAT-2002', spe: 'SPE-2', descricao: 'CHAVE SECCIONADORA 245 KV', grupoMercadoria: 'EQUIP-SE', unidadeMedida: 'UN', ncm: '8535.30.00', origemMercadoria: '1', precoMedio: 68400.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-2003', spe: 'SPE-2', descricao: 'PARAFUSO M16X50 (COMPRA URGENTE)', grupoMercadoria: 'FERRAGEM', unidadeMedida: 'UN', ncm: '7318.15.00', origemMercadoria: '0', precoMedio: 4.2, ativo: true,
    _plantedDefect: [FORA_PADRAO('marcação de urgência de compra embutida na descrição.')] },
  { codigo: 'MAT-2004', spe: 'SPE-2', descricao: 'CONECTOR CUNHA - NAO USAR - SUBSTITUIDO', grupoMercadoria: 'FERRAGEM', unidadeMedida: 'UN', ncm: null, origemMercadoria: '0', precoMedio: 58.0, ativo: false,
    _plantedDefect: [FORA_PADRAO('status do item escrito na descrição em vez de no campo de bloqueio.'), SEM_NCM] },
  { codigo: 'MAT-3001', spe: 'SPE-3', descricao: 'CAPACETE CLASSE B ABNT NBR 8221', grupoMercadoria: 'EPI', unidadeMedida: 'UN', ncm: '6506.10.00', origemMercadoria: '0', precoMedio: 78.9, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-3002', spe: 'SPE-3', descricao: 'LUVA ISOLANTE CLASSE 2 *** ESTOQUE MINIMO ***', grupoMercadoria: 'EPI', unidadeMedida: 'PAR', ncm: '4015.19.00', origemMercadoria: '2', precoMedio: 412.0, ativo: true,
    _plantedDefect: [FORA_PADRAO('aviso de estoque mínimo embutido na descrição.')] },
  { codigo: 'MAT-3005', spe: 'SPE-3', descricao: 'graxa', grupoMercadoria: 'CONSUMIVEL', unidadeMedida: 'KG', ncm: null, origemMercadoria: '0', precoMedio: 32.8, ativo: true,
    _plantedDefect: [FORA_PADRAO('descrição de uma palavra, sem tipo, aplicação ou norma.'), SEM_NCM] },
  { codigo: 'MAT-3006', spe: 'SPE-3', descricao: 'DETECTOR DE TENSAO 15 KV', grupoMercadoria: 'FERRAMENTA', unidadeMedida: 'UN', ncm: '9030.31.00', origemMercadoria: '2', precoMedio: 2340.0, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-4001', spe: 'SPE-4', descricao: 'kit aterramento temporario 15kv obs: falta NF', grupoMercadoria: 'FERRAMENTA', unidadeMedida: 'CJ', ncm: '8535.90.00', origemMercadoria: '0', precoMedio: 3120.0, ativo: true,
    _plantedDefect: [FORA_PADRAO('caixa baixa e pendência documental ("falta NF") escrita na descrição.')] },
  { codigo: 'MAT-4003', spe: 'SPE-4', descricao: 'OLEO ISOLANTE MINERAL TIPO A', grupoMercadoria: 'CONSUMIVEL', unidadeMedida: 'L', ncm: '2710.19.32', origemMercadoria: '0', precoMedio: 24.6, ativo: true, _plantedDefect: [] },
  { codigo: 'MAT-4004', spe: 'SPE-4', descricao: 'ESCADA DIELETRICA 7 M', grupoMercadoria: 'FERRAMENTA', unidadeMedida: 'UN', ncm: null, origemMercadoria: '0', precoMedio: 1480.0, ativo: true,
    _plantedDefect: [SEM_NCM] },
]


/* ---------- tabela de referência do IBGE ----------------------------------- */
/**
 * NOVA usa esta tabela para derivar o código de município dos registros que
 * vieram só com município e UF. Derivar de fonte de referência é determinístico
 * e auditável — é o que separa enriquecimento de chute. Município fora da tabela
 * não é enriquecido: o registro é retido, e é isso que se quer.
 *
 * Cobre os municípios presentes nas fixtures deste subconjunto.
 */
const municipios = [
  { nome: 'Uberlandia', uf: 'MG', codigoIbge: '3170206' },
  { nome: 'Belo Horizonte', uf: 'MG', codigoIbge: '3106200' },
  { nome: 'Juiz de Fora', uf: 'MG', codigoIbge: '3136702' },
  { nome: 'Itajuba', uf: 'MG', codigoIbge: '3132404' },
  { nome: 'Sao Paulo', uf: 'SP', codigoIbge: '3550308' },
  { nome: 'Campinas', uf: 'SP', codigoIbge: '3509502' },
  { nome: 'Jundiai', uf: 'SP', codigoIbge: '3525904' },
  { nome: 'Mogi Mirim', uf: 'SP', codigoIbge: '3530607' },
  { nome: 'Curitiba', uf: 'PR', codigoIbge: '4106902' },
  { nome: 'Londrina', uf: 'PR', codigoIbge: '4113700' },
  { nome: 'Maringa', uf: 'PR', codigoIbge: '4115200' },
  { nome: 'Mandaguari', uf: 'PR', codigoIbge: '4114302' },
  { nome: 'Quatro Barras', uf: 'PR', codigoIbge: '4121307' },
  { nome: 'Joinville', uf: 'SC', codigoIbge: '4209102' },
  { nome: 'Blumenau', uf: 'SC', codigoIbge: '4202404' },
  { nome: 'Florianopolis', uf: 'SC', codigoIbge: '4205407' },
  { nome: 'Timbo', uf: 'SC', codigoIbge: '4218004' },
  { nome: 'Porto Alegre', uf: 'RS', codigoIbge: '4314902' },
  { nome: 'Caxias do Sul', uf: 'RS', codigoIbge: '4305108' },
  { nome: 'Passo Fundo', uf: 'RS', codigoIbge: '4314100' },
  { nome: 'Santa Maria', uf: 'RS', codigoIbge: '4316907' },
  { nome: 'Canoas', uf: 'RS', codigoIbge: '4304606' },
  { nome: 'Goiania', uf: 'GO', codigoIbge: '5208707' },
  { nome: 'Brasilia', uf: 'DF', codigoIbge: '5300108' },
  { nome: 'Palmas', uf: 'TO', codigoIbge: '1721000' },
]

const normalizarNome = (nome) =>
  nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
const chaveMunicipio = (nome, uf) => `${normalizarNome(nome)}|${uf}`
const municipioPorChave = new Map(municipios.map((m) => [chaveMunicipio(m.nome, m.uf), m]))
const buscarMunicipio = (nome, uf) => municipioPorChave.get(chaveMunicipio(nome, uf)) ?? null

/* ---------- o tenant S/4HANA vivo da Verene -------------------------------- */
const tenantId = 'VRN-S4-PRD'
const tenantRelease = 'S/4HANA 2023 FPS02'

/** Domínios de valor lidos da configuração ATIVA — não do SAP de fábrica. */
const valueDomains = [
  {
    id: 'BP_GROUPING', nome: 'Grupo de contas de Business Partner', divergeDoPadraoSap: true,
    entradas: [
      { codigo: 'ZFOR', texto: 'Fornecedor nacional pessoa jurídica' },
      { codigo: 'ZFPF', texto: 'Fornecedor nacional pessoa física' },
      { codigo: 'ZFOI', texto: 'Fornecedor internacional' },
    ],
  },
  {
    id: 'PAYMENT_TERMS', nome: 'Condições de pagamento', divergeDoPadraoSap: true,
    entradas: [
      { codigo: 'ZAVI', texto: 'À vista' },
      { codigo: 'Z015', texto: '15 dias da data' },
      { codigo: 'Z028', texto: '28 dias da data' },
      { codigo: 'Z030', texto: '30 dias da data' },
      { codigo: 'Z045', texto: '45 dias da data' },
      { codigo: 'Z2856', texto: '28/56 dias da data' },
      { codigo: 'Z3060', texto: '30/60 dias da data' },
      { codigo: 'Z306090', texto: '30/60/90 dias da data' },
    ],
  },
  {
    id: 'UOM', nome: 'Unidades de medida', divergeDoPadraoSap: false,
    entradas: [
      { codigo: 'M', texto: 'Metro' },
      { codigo: 'KM', texto: 'Quilômetro' },
      { codigo: 'KG', texto: 'Quilograma' },
      { codigo: 'L', texto: 'Litro' },
      { codigo: 'ST', texto: 'Unidade' },
      { codigo: 'PAA', texto: 'Par' },
      { codigo: 'H', texto: 'Hora' },
      { codigo: 'DAY', texto: 'Dia' },
      { codigo: 'MON', texto: 'Mês' },
      { codigo: 'LE', texto: 'Verba' },
    ],
  },
  {
    id: 'MATERIAL_TYPE', nome: 'Tipo de material', divergeDoPadraoSap: true,
    entradas: [
      { codigo: 'ZMAN', texto: 'Material de manutenção de linha' },
      { codigo: 'ERSA', texto: 'Peça de reposição' },
      { codigo: 'HIBE', texto: 'Material auxiliar de consumo' },
      { codigo: 'ZEPI', texto: 'Equipamento de proteção individual' },
    ],
  },
  {
    id: 'SERVICE_GROUP', nome: 'Grupo de serviço', divergeDoPadraoSap: true,
    entradas: [
      { codigo: 'ZLT', texto: 'Serviço em linha de transmissão' },
      { codigo: 'ZSE', texto: 'Serviço em subestação' },
      { codigo: 'ZENG', texto: 'Engenharia e projeto' },
      { codigo: 'ZAMB', texto: 'Serviço ambiental e de faixa' },
      { codigo: 'ZLOC', texto: 'Locação de equipamento' },
    ],
  },
  {
    id: 'WITHHOLDING_TAX', nome: 'Tipos de retenção', divergeDoPadraoSap: false,
    entradas: [
      { codigo: 'I1', texto: 'IRRF sobre serviço' },
      { codigo: 'N1', texto: 'INSS sobre cessão de mão de obra' },
      { codigo: 'S1', texto: 'ISS retido na fonte' },
      { codigo: 'C1', texto: 'CSLL/PIS/COFINS' },
    ],
  },
  {
    id: 'INCOTERMS', nome: 'Incoterms', divergeDoPadraoSap: false,
    entradas: [
      { codigo: 'EXW', texto: 'Ex Works' },
      { codigo: 'FCA', texto: 'Free Carrier' },
      { codigo: 'CIF', texto: 'Cost, Insurance and Freight' },
      { codigo: 'DAP', texto: 'Delivered at Place' },
    ],
  },
]

const numberRanges = [
  { objeto: 'business-partner', grupo: 'ZFOR', intervalo: 'Z1', de: '1000000000', ate: '1499999999', tipo: 'externo', divergeDoPadraoSap: true },
  { objeto: 'business-partner', grupo: 'ZFPF', intervalo: 'Z2', de: '1500000000', ate: '1799999999', tipo: 'externo', divergeDoPadraoSap: true },
  { objeto: 'business-partner', grupo: 'ZFOI', intervalo: 'Z3', de: '1800000000', ate: '1999999999', tipo: 'externo', divergeDoPadraoSap: true },
  { objeto: 'product-master', grupo: 'ZMAN', intervalo: '01', de: '100000', ate: '199999', tipo: 'interno', divergeDoPadraoSap: false },
  { objeto: 'product-master', grupo: 'ZEPI', intervalo: '02', de: '200000', ate: '249999', tipo: 'interno', divergeDoPadraoSap: false },
  { objeto: 'service-master', grupo: 'ZLT', intervalo: 'SV', de: 'SV00000001', ate: 'SV00099999', tipo: 'externo', divergeDoPadraoSap: true },
  { objeto: 'outline-agreement', grupo: 'ZK01', intervalo: '46', de: '4600000000', ate: '4699999999', tipo: 'interno', divergeDoPadraoSap: false },
  { objeto: 'purchase-order', grupo: 'ZNB', intervalo: '45', de: '4500000000', ate: '4599999999', tipo: 'interno', divergeDoPadraoSap: false },
  { objeto: 'purchase-requisition', grupo: 'ZNB', intervalo: '10', de: '1000000000', ate: '1099999999', tipo: 'interno', divergeDoPadraoSap: false },
]

const requiredFields = [
  { objeto: 'business-partner', campo: 'BP_GROUPING', descricao: 'Grupo de contas', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'NAME_ORG1', descricao: 'Razão social', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'TAX_NUMBER_BR1', descricao: 'CNPJ', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'TAX_NUMBER_BR2', descricao: 'CPF', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'REGION', descricao: 'UF', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'TAXJURCODE', descricao: 'Código de município (domicílio fiscal)', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'INDUSTRY', descricao: 'CNAE', obrigatorio: true, padraoSap: false },
  { objeto: 'business-partner', campo: 'WITHHOLDING_TAX_TYPE', descricao: 'Tipo de retenção', obrigatorio: true, padraoSap: false },
  { objeto: 'business-partner', campo: 'PAYMENT_TERMS', descricao: 'Condição de pagamento', obrigatorio: true, padraoSap: true },
  { objeto: 'business-partner', campo: 'BANK_ACCOUNT', descricao: 'Conta bancária', obrigatorio: true, padraoSap: false },
  { objeto: 'product-master', campo: 'MATERIAL_TYPE', descricao: 'Tipo de material', obrigatorio: true, padraoSap: true },
  { objeto: 'product-master', campo: 'MATERIAL_DESCRIPTION', descricao: 'Descrição', obrigatorio: true, padraoSap: true },
  { objeto: 'product-master', campo: 'BASE_UOM', descricao: 'Unidade de medida base', obrigatorio: true, padraoSap: true },
  { objeto: 'product-master', campo: 'NCM_CODE', descricao: 'NCM', obrigatorio: true, padraoSap: false },
  { objeto: 'product-master', campo: 'ORIGIN_MATERIAL', descricao: 'Origem da mercadoria', obrigatorio: true, padraoSap: true },
  { objeto: 'product-master', campo: 'MATERIAL_GROUP', descricao: 'Grupo de mercadoria', obrigatorio: true, padraoSap: true },
  { objeto: 'service-master', campo: 'SERVICE_NUMBER', descricao: 'Número do serviço', obrigatorio: true, padraoSap: true },
  { objeto: 'service-master', campo: 'SERVICE_GROUP', descricao: 'Grupo de serviço', obrigatorio: true, padraoSap: false },
  { objeto: 'service-master', campo: 'BASE_UOM', descricao: 'Unidade de medida base', obrigatorio: true, padraoSap: true },
  { objeto: 'service-master', campo: 'SHORT_TEXT', descricao: 'Texto breve', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'VENDOR', descricao: 'Fornecedor (Business Partner)', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'AGREEMENT_TYPE', descricao: 'Tipo de contrato', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'VALIDITY_START', descricao: 'Início da validade', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'VALIDITY_END', descricao: 'Fim da validade', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'TARGET_VALUE', descricao: 'Valor previsto', obrigatorio: true, padraoSap: true },
  { objeto: 'outline-agreement', campo: 'INCOTERMS', descricao: 'Incoterms', obrigatorio: true, padraoSap: false },
  { objeto: 'outline-agreement', campo: 'PURCHASING_GROUP', descricao: 'Grupo de compradores', obrigatorio: true, padraoSap: true },
]

/** Onde este tenant sai do padrão SAP. É o que transforma de-para em decisão. */
const divergenciasDoPadraoSap = [
  {
    id: 'DIV-01',
    titulo: 'Business Partner de fornecedor com numeração externa',
    descricao:
      'Os três grupos de contas de fornecedor (ZFOR, ZFPF, ZFOI) usam faixa externa. O número do Business Partner tem que ser fornecido na carga, não é gerado pelo sistema.',
    padraoSap: 'Grupo de contas de fornecedor com numeração interna, gerada no momento da criação.',
    configuracaoVerene: 'Faixas Z1/Z2/Z3 externas, de 1000000000 a 1999999999.',
    objetos: ['business-partner'],
    impacto:
      'A carga precisa decidir e carregar o número de cada Business Partner. Errar aqui não dá erro na hora — dá fornecedor duplicado depois.',
  },
  {
    id: 'DIV-02',
    titulo: 'Condições de pagamento inteiramente customizadas',
    descricao:
      'Nenhuma condição de pagamento padrão do SAP está ativa. Todas são Z-customizadas, e o Nasajon guarda a condição como texto livre ("28/56 DD", "A VISTA", "30 DD").',
    padraoSap: 'Condições padrão (NT30, NT60 e afins) disponíveis de fábrica.',
    configuracaoVerene: 'Oito condições Z, de ZAVI a Z306090.',
    objetos: ['business-partner', 'outline-agreement', 'purchase-order'],
    impacto:
      'O de-para de condição de pagamento é texto livre para código. Toda variação de grafia no legado precisa de regra — e o legado tem mais variação do que o domínio tem código.',
  },
  {
    id: 'DIV-03',
    titulo: 'Tipo de material ZMAN sem regra de decisão escrita',
    descricao:
      'A Verene criou ZMAN para material de manutenção de linha, além de ZEPI para equipamento de proteção. O legado não tem campo que diga qual material é qual.',
    padraoSap: 'Tipos padrão ERSA (peça de reposição) e HIBE (material auxiliar) cobrem o caso.',
    configuracaoVerene: 'ZMAN e ZEPI convivendo com ERSA e HIBE, sem critério documentado.',
    objetos: ['product-master'],
    impacto:
      'A classificação depende de conhecimento que só existe na cabeça do time de suprimentos. É candidata a virar regra explícita.',
  },
  {
    id: 'DIV-04',
    titulo: 'Incoterms obrigatório no Outline agreement',
    descricao:
      'O tenant exige Incoterms em todo contrato, inclusive em contrato de serviço. Contrato de serviço do Nasajon não tem esse dado.',
    padraoSap: 'Incoterms é opcional em contrato de serviço.',
    configuracaoVerene: 'Campo marcado como obrigatório para todos os tipos de contrato.',
    objetos: ['outline-agreement'],
    impacto:
      'Todo contrato de serviço do escopo entra sem Incoterms. Ou se define um valor padrão, ou a carga para.',
  },
  {
    id: 'DIV-05',
    titulo: 'Tipo de retenção obrigatório no Business Partner',
    descricao:
      'O cadastro de fornecedor exige tipo e código de retenção preenchidos. No Nasajon a retenção está espalhada em quatro campos booleanos por SPE, e as SPEs divergem entre si para o mesmo prestador.',
    padraoSap: 'Retenção é opcional no Business Partner; pode ser resolvida no lançamento.',
    configuracaoVerene: 'WITHHOLDING_TAX_TYPE obrigatório em ZFOR e ZFPF.',
    objetos: ['business-partner'],
    impacto:
      'Sem uma regra única de retenção não há carga de fornecedor. É a divergência que obriga a decisão a subir para o cliente.',
  },
]

const padraoDescricaoMaterial = {
  formato: 'TIPO + ESPECIFICAÇÃO + NORMA/CLASSE',
  exemplo: 'CABO CAA 336,4 MCM LINNET',
  proibido: ['texto em caixa baixa', 'recado de comprador ou nome de pessoa',
    'marcação de urgência ou de estoque', 'status do item (use o campo de bloqueio)',
    'pendência documental'],
}
const valueDomainById = Object.fromEntries(valueDomains.map((d) => [d.id, d]))
const divergenciaById = Object.fromEntries(divergenciasDoPadraoSap.map((d) => [d.id, d]))

/* ---------- fornecedores já cadastrados no tenant -------------------------- */
/**
 * Amostra da base viva do tenant. Dois destes têm o mesmo CNPJ que aparece no
 * extrato das SPEs (F1004 e F3003):
 * devem ser REUSADOS, não recriados. Recriar gera Business Partner duplicado com
 * o mesmo CNPJ — o erro que só aparece meses depois, no fechamento fiscal.
 *
 * Razões sociais fictícias de propósito: CNPJ inventado em nome de empresa real
 * afirmaria como verdadeiro um cadastro que não existe.
 */
const existingSuppliers = [
  { businessPartner: '1000004472', grupoContas: 'ZFOR', razaoSocial: 'CONDULINK COMERCIO DE CABOS E CONDUTORES LTDA', cnpjCpf: '09175283000187', municipio: 'Campinas', codigoIbge: '3509502', uf: 'SP', condicaoPagamento: 'Z2856', bloqueado: false, criadoEm: '2021-06-14', duplicadoDoNasajon: 'F1004' },
  { businessPartner: '1000004488', grupoContas: 'ZFOR', razaoSocial: 'INSPETEC ENSAIOS E INSPECOES TECNICAS LTDA', cnpjCpf: '07048362000100', municipio: 'Porto Alegre', codigoIbge: '4314902', uf: 'RS', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2021-09-02', duplicadoDoNasajon: 'F3003' },
  { businessPartner: '1000003011', grupoContas: 'ZFOR', razaoSocial: 'VOLTERA ENERGIA EQUIPAMENTOS LTDA', cnpjCpf: '27418036000146', municipio: 'Jundiaí', codigoIbge: '3525904', uf: 'SP', condicaoPagamento: 'Z045', bloqueado: false, criadoEm: '2020-02-11', duplicadoDoNasajon: null },
  { businessPartner: '1000003024', grupoContas: 'ZFOR', razaoSocial: 'TERMINALIX INDUSTRIA DE CONECTORES LTDA', cnpjCpf: '31570492000184', municipio: 'Itajubá', codigoIbge: '3132404', uf: 'MG', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2020-03-05', duplicadoDoNasajon: null },
  { businessPartner: '1000003058', grupoContas: 'ZFOR', razaoSocial: 'FERROLINHA PRODUTOS ELETRICOS SA', cnpjCpf: '19284637000185', municipio: 'Mandaguari', codigoIbge: '4114302', uf: 'PR', condicaoPagamento: 'Z3060', bloqueado: false, criadoEm: '2020-04-22', duplicadoDoNasajon: null },
  { businessPartner: '1000003077', grupoContas: 'ZFOR', razaoSocial: 'PORCELINHA ISOLADORES CERAMICOS SA', cnpjCpf: '26095183000160', municipio: 'Timbó', codigoIbge: '4218004', uf: 'SC', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2020-05-18', duplicadoDoNasajon: null },
  { businessPartner: '1000003102', grupoContas: 'ZFOR', razaoSocial: 'MONTELET ENGENHARIA E MONTAGENS LTDA', cnpjCpf: '33741620000130', municipio: 'Belo Horizonte', codigoIbge: '3106200', uf: 'MG', condicaoPagamento: 'Z2856', bloqueado: false, criadoEm: '2020-07-09', duplicadoDoNasajon: null },
  { businessPartner: '1000003119', grupoContas: 'ZFOR', razaoSocial: 'MANTENSUL SERVICOS DE MANUTENCAO LTDA', cnpjCpf: '21860497000198', municipio: 'Florianópolis', codigoIbge: '4205407', uf: 'SC', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2020-08-27', duplicadoDoNasajon: null },
  { businessPartner: '1000003143', grupoContas: 'ZFOR', razaoSocial: 'ALVORADA ENGENHARIA DE TRANSMISSAO SA', cnpjCpf: '29013758000146', municipio: 'São Paulo', codigoIbge: '3550308', uf: 'SP', condicaoPagamento: 'Z306090', bloqueado: false, criadoEm: '2020-09-14', duplicadoDoNasajon: null },
  { businessPartner: '1000003166', grupoContas: 'ZFOR', razaoSocial: 'CABOPAR CONDUTORES ELETRICOS LTDA', cnpjCpf: '35472109000106', municipio: 'Quatro Barras', codigoIbge: '4121307', uf: 'PR', condicaoPagamento: 'Z045', bloqueado: false, criadoEm: '2020-10-30', duplicadoDoNasajon: null },
  { businessPartner: '1000003188', grupoContas: 'ZFOR', razaoSocial: 'VITRALUX INDUSTRIA E COMERCIO LTDA', cnpjCpf: '24689031000160', municipio: 'Mogi Mirim', codigoIbge: '3530607', uf: 'SP', condicaoPagamento: 'Z030', bloqueado: false, criadoEm: '2020-11-11', duplicadoDoNasajon: null },
  { businessPartner: '1000003205', grupoContas: 'ZFOR', razaoSocial: 'FORJANORTE COMPONENTES FORJADOS SA', cnpjCpf: '30157842000112', municipio: 'Canoas', codigoIbge: '4304606', uf: 'RS', condicaoPagamento: 'Z3060', bloqueado: false, criadoEm: '2021-01-19', duplicadoDoNasajon: null},
]

/* ---------- dicionário de mapeamento --------------------------------------- */
const mappingDictionary = [
  {
    id: 'MAP-BP-01', objeto: 'business-partner',
    campoOrigem: 'CODIGO', campoOrigemDescricao: 'Código do fornecedor no Nasajon',
    campoAlvo: 'BUSINESS_PARTNER', campoAlvoDescricao: 'Número do Business Partner',
    regraConversao: 'Número atribuído na carga, dentro da faixa externa do grupo de contas.',
    ruleId: 'R-PKG-003', valorPadrao: null,
    dependencia: 'Depende de BP_GROUPING, que define a faixa.',
    tratamentoExcecao: 'Fora da faixa, o Migration Cockpit rejeita o lote inteiro. Reter antes de empacotar.',
    valueDomainId: null, obrigatorio: true, divergenciaId: 'DIV-01',
  },
  {
    id: 'MAP-BP-02', objeto: 'business-partner',
    campoOrigem: 'NATUREZA_PESSOA', campoOrigemDescricao: 'J para jurídica, F para física',
    campoAlvo: 'BP_GROUPING', campoAlvoDescricao: 'Grupo de contas do Business Partner',
    regraConversao: 'J para ZFOR, F para ZFPF.',
    ruleId: 'R-SUP-011', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Natureza ausente retém o registro: sem grupo de contas não há faixa de numeração.',
    valueDomainId: 'BP_GROUPING', obrigatorio: true, divergenciaId: 'DIV-01',
  },
  {
    id: 'MAP-BP-03', objeto: 'business-partner',
    campoOrigem: 'RAZAO_SOCIAL', campoOrigemDescricao: 'Razão social como está no legado',
    campoAlvo: 'NAME_ORG1 + NAME_ORG2', campoAlvoDescricao: 'Nome da organização, duas linhas de 40',
    regraConversao: 'Quebra na última palavra inteira antes do caractere 40; o resto vai para NAME_ORG2.',
    ruleId: 'R-SUP-023', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Acima de 80 caracteres, o excedente é truncado e registrado na trilha.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-04', objeto: 'business-partner',
    campoOrigem: 'CNPJ', campoOrigemDescricao: 'CNPJ com ou sem máscara',
    campoAlvo: 'TAX_NUMBER_BR1', campoAlvoDescricao: 'CNPJ',
    regraConversao: 'Remove a máscara. O dígito verificador é conferido na validação.',
    ruleId: 'R-SUP-020', valorPadrao: null,
    dependencia: 'Só se aplica a BP_GROUPING = ZFOR ou ZFOI.',
    tratamentoExcecao: 'Dígito verificador inválido retém o registro e volta para a origem. Não há correção por regra.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-05', objeto: 'business-partner',
    campoOrigem: 'CPF', campoOrigemDescricao: 'CPF com ou sem máscara',
    campoAlvo: 'TAX_NUMBER_BR2', campoAlvoDescricao: 'CPF',
    regraConversao: 'Remove a máscara. Dígito verificador conferido na validação.',
    ruleId: 'R-SUP-020', valorPadrao: null,
    dependencia: 'Só se aplica a BP_GROUPING = ZFPF.',
    tratamentoExcecao: 'Dígito verificador inválido retém o registro.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-06', objeto: 'business-partner',
    campoOrigem: 'COND_PAGAMENTO', campoOrigemDescricao: 'Texto livre: "30 DD", "28/56 DD", "A VISTA"',
    campoAlvo: 'PAYMENT_TERMS', campoAlvoDescricao: 'Condição de pagamento',
    regraConversao: 'De-para fechado contra o domínio do tenant.',
    ruleId: 'R-SUP-010', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Texto sem entrada no domínio retém o registro. Criar entrada é decisão de configuração, não de migração.',
    valueDomainId: 'PAYMENT_TERMS', obrigatorio: true, divergenciaId: 'DIV-02',
  },
  {
    id: 'MAP-BP-07', objeto: 'business-partner',
    campoOrigem: 'RETENCOES', campoOrigemDescricao: 'Quatro booleanos: ISS, IRRF, INSS, PIS/COFINS/CSLL',
    campoAlvo: 'WITHHOLDING_TAX_TYPE', campoAlvoDescricao: 'Tipo de retenção',
    regraConversao: 'Cada booleano vira um código: IRRF I1, INSS N1, ISS S1, PIS/COFINS/CSLL C1.',
    ruleId: 'R-SUP-013', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Mesmo CPF com retenção divergente entre SPEs retém os dois lados e escala para o fiscal da Verene.',
    valueDomainId: 'WITHHOLDING_TAX', obrigatorio: true, divergenciaId: 'DIV-05',
  },
  {
    id: 'MAP-BP-08', objeto: 'business-partner',
    campoOrigem: 'CNAE', campoOrigemDescricao: 'CNAE de sete dígitos',
    campoAlvo: 'INDUSTRY', campoAlvoDescricao: 'Setor industrial',
    regraConversao: 'Atravessa sem tradução: o tenant usa o próprio código da CNAE.',
    ruleId: 'R-SUP-014', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'CNAE em branco retém o registro. A derivação a partir do ramo é regra candidata e não executa.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-09', objeto: 'business-partner',
    campoOrigem: 'MUNICIPIO + UF', campoOrigemDescricao: 'Nome do município e a UF',
    campoAlvo: 'TAXJURCODE', campoAlvoDescricao: 'Domicílio fiscal (código IBGE)',
    regraConversao: 'Usa o código IBGE do extrato; se vier vazio, deriva por nome e UF na tabela do IBGE.',
    ruleId: 'R-SUP-040', valorPadrao: null,
    dependencia: 'Depende de REGION estar preenchida.',
    tratamentoExcecao: 'Município fora da tabela de referência retém o registro. A esteira não inventa código.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-10', objeto: 'business-partner',
    campoOrigem: 'UF', campoOrigemDescricao: 'Sigla da unidade federativa',
    campoAlvo: 'REGION', campoAlvoDescricao: 'Região',
    regraConversao: 'Atravessa direto; conferido contra a lista de UF do IBGE.',
    ruleId: 'R-SUP-012', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'UF inexistente retém o registro.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-BP-11', objeto: 'business-partner',
    campoOrigem: 'CEP', campoOrigemDescricao: 'CEP com ou sem hífen',
    campoAlvo: 'POSTAL_CODE', campoAlvoDescricao: 'CEP',
    regraConversao: 'Remove a pontuação.',
    ruleId: 'R-SUP-024', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Fora de oito dígitos, registra achado na perfilagem e segue: não bloqueia a carga.',
    valueDomainId: null, obrigatorio: false, divergenciaId: null,
  },
  {
    id: 'MAP-BP-12', objeto: 'business-partner',
    campoOrigem: 'DT_CADASTRO', campoOrigemDescricao: 'Data em DD/MM/AAAA ou AAAA-MM-DD',
    campoAlvo: 'CREATED_ON', campoAlvoDescricao: 'Data de criação',
    regraConversao: 'Normaliza os dois formatos para AAAA-MM-DD.',
    ruleId: 'R-SUP-021', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Data ilegível assume a data da carga e registra o desvio na trilha.',
    valueDomainId: null, obrigatorio: false, divergenciaId: null,
  },
  {
    id: 'MAP-BP-13', objeto: 'business-partner',
    campoOrigem: 'BANCO / AGENCIA / CONTA', campoOrigemDescricao: 'Dados bancários em três campos',
    campoAlvo: 'BANK_KEY / BANK_ACCOUNT', campoAlvoDescricao: 'Conta bancária do parceiro',
    regraConversao: 'Banco vira BANK_KEY pelo código FEBRABAN; agência e conta concatenam em BANK_ACCOUNT.',
    ruleId: null, valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Conta ausente retém o registro: o tenant exige conta bancária no cadastro.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-PM-01', objeto: 'product-master',
    campoOrigem: 'CODIGO', campoOrigemDescricao: 'Código do material no Nasajon',
    campoAlvo: 'MATERIAL', campoAlvoDescricao: 'Número do material',
    regraConversao: 'Numeração interna do tenant; o código legado vai para o texto de busca.',
    ruleId: null, valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Faixa esgotada para a carga. Estender é ação do Basis da Verene.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-PM-02', objeto: 'product-master',
    campoOrigem: 'GRUPO_MERCADORIA', campoOrigemDescricao: 'Grupo interno do Nasajon',
    campoAlvo: 'MATERIAL_TYPE', campoAlvoDescricao: 'Tipo de material',
    regraConversao: 'EPI para ZEPI; condutor, isolador, ferragem e estrutura para ZMAN; o resto para HIBE.',
    ruleId: 'R-MAT-010', valorPadrao: 'HIBE',
    dependencia: null,
    tratamentoExcecao: 'Grupo desconhecido cai no padrão HIBE e registra achado; o critério é proxy, não regra do cliente.',
    valueDomainId: 'MATERIAL_TYPE', obrigatorio: true, divergenciaId: 'DIV-03',
  },
  {
    id: 'MAP-PM-03', objeto: 'product-master',
    campoOrigem: 'DESCRICAO', campoOrigemDescricao: 'Descrição livre do legado',
    campoAlvo: 'MATERIAL_DESCRIPTION', campoAlvoDescricao: 'Descrição do material',
    regraConversao: 'Atravessa como está. A padronização em TIPO + ESPECIFICAÇÃO + NORMA é regra candidata.',
    ruleId: null, valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Descrição fora de padrão é registrada como achado não crítico e segue.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-PM-04', objeto: 'product-master',
    campoOrigem: 'NCM', campoOrigemDescricao: 'NCM de oito dígitos',
    campoAlvo: 'NCM_CODE', campoAlvoDescricao: 'Classificação fiscal',
    regraConversao: 'Remove a máscara e confere o comprimento.',
    ruleId: 'R-MAT-020', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'NCM ausente retém: sem classificação fiscal não há cálculo de imposto no destino.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-PM-05', objeto: 'product-master',
    campoOrigem: 'UNIDADE_MEDIDA', campoOrigemDescricao: 'Unidade do legado',
    campoAlvo: 'BASE_UOM', campoAlvoDescricao: 'Unidade de medida base',
    regraConversao: 'De-para contra o domínio de unidades do tenant.',
    ruleId: 'R-CTR-010', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Unidade sem correspondente retém o registro.',
    valueDomainId: 'UOM', obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-PM-06', objeto: 'product-master',
    campoOrigem: 'ORIGEM_MERCADORIA', campoOrigemDescricao: 'Origem no padrão SPED: 0, 1 ou 2',
    campoAlvo: 'ORIGIN_MATERIAL', campoAlvoDescricao: 'Origem da mercadoria',
    regraConversao: 'Atravessa direto: os dois lados usam a codificação do SPED.',
    ruleId: null, valorPadrao: '0', dependencia: null,
    tratamentoExcecao: 'Origem ausente assume 0 (nacional) e registra o desvio.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-SM-01', objeto: 'service-master',
    campoOrigem: 'CODIGO', campoOrigemDescricao: 'Código do serviço no Nasajon',
    campoAlvo: 'SERVICE_NUMBER', campoAlvoDescricao: 'Número do serviço',
    regraConversao: 'Faixa externa alfanumérica SV: o número vai na carga.',
    ruleId: 'R-PKG-003', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Fora da faixa, o lote é rejeitado.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-SM-02', objeto: 'service-master',
    campoOrigem: 'DESCRICAO_SERVICO', campoOrigemDescricao: 'Descrição da linha de serviço do contrato',
    campoAlvo: 'SHORT_TEXT', campoAlvoDescricao: 'Texto breve do serviço',
    regraConversao: 'Atravessa truncado em 40 caracteres.',
    ruleId: null, valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Descrição vazia retém o registro.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-SM-03', objeto: 'service-master',
    campoOrigem: 'CENTRO_CUSTO', campoOrigemDescricao: 'Centro de custo da linha',
    campoAlvo: 'SERVICE_GROUP', campoAlvoDescricao: 'Grupo de serviço',
    regraConversao: 'De-para do centro de custo para o grupo de serviço do tenant.',
    ruleId: null, valorPadrao: 'ZLT',
    dependencia: 'Depende do objeto do contrato para desambiguar linha de transmissão de subestação.',
    tratamentoExcecao: 'Centro de custo sem correspondente cai em ZLT e registra achado.',
    valueDomainId: 'SERVICE_GROUP', obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-SM-04', objeto: 'service-master',
    campoOrigem: 'UNIDADE_MEDIDA', campoOrigemDescricao: 'Unidade da linha de serviço',
    campoAlvo: 'BASE_UOM', campoAlvoDescricao: 'Unidade de medida base',
    regraConversao: 'M, MT e METRO convergem para M; as demais pelo domínio do tenant.',
    ruleId: 'R-CTR-010', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Unidade sem correspondente retém o registro.',
    valueDomainId: 'UOM', obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-01', objeto: 'outline-agreement',
    campoOrigem: 'FORNECEDOR_CODIGO', campoOrigemDescricao: 'Código do fornecedor no contrato',
    campoAlvo: 'VENDOR', campoAlvoDescricao: 'Fornecedor (Business Partner)',
    regraConversao: 'Resolve para o Business Partner criado ou reusado na onda 1.',
    ruleId: 'R-SUP-044', valorPadrao: null,
    dependencia: 'Depende da onda 1 concluída. Contrato não carrega antes do fornecedor.',
    tratamentoExcecao: 'Fornecedor retido na onda 1 retém o contrato junto.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-02', objeto: 'outline-agreement',
    campoOrigem: 'TIPO', campoOrigemDescricao: 'Serviço, fornecimento ou locação',
    campoAlvo: 'AGREEMENT_TYPE', campoAlvoDescricao: 'Tipo de contrato',
    regraConversao: 'Serviço e locação para ZK01; fornecimento para ZK02.',
    ruleId: null, valorPadrao: 'ZK01', dependencia: null,
    tratamentoExcecao: 'Tipo ausente cai em ZK01 e registra achado.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-03', objeto: 'outline-agreement',
    campoOrigem: 'DATA_INICIO / DATA_FIM', campoOrigemDescricao: 'Vigência do contrato',
    campoAlvo: 'VALIDITY_START / VALIDITY_END', campoAlvoDescricao: 'Início e fim da validade',
    regraConversao: 'Normaliza para AAAA-MM-DD.',
    ruleId: 'R-SUP-021', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Fim anterior ao início retém o contrato.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-04', objeto: 'outline-agreement',
    campoOrigem: 'VALOR_ORIGINAL', campoOrigemDescricao: 'Valor do cabeçalho do contrato',
    campoAlvo: 'TARGET_VALUE', campoAlvoDescricao: 'Valor previsto',
    regraConversao: 'Atravessa em BRL, conferido contra a soma das linhas.',
    ruleId: 'R-CTR-031', valorPadrao: null,
    dependencia: 'Depende das linhas estarem completas.',
    tratamentoExcecao: 'Cabeçalho que não bate com as linhas retém o contrato até a origem explicar.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-05', objeto: 'outline-agreement',
    campoOrigem: 'UNIDADE_MEDIDA', campoOrigemDescricao: 'Unidade da linha: M, MT ou METRO',
    campoAlvo: 'BASE_UOM', campoAlvoDescricao: 'Unidade de medida da linha',
    regraConversao: 'As três grafias significam metro e convergem para M, com a quantidade inalterada.',
    ruleId: 'R-CTR-020', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Converter a quantidade junto seria inventar volume. A conversão é só de código.',
    valueDomainId: 'UOM', obrigatorio: true, divergenciaId: null,
  },
  {
    id: 'MAP-OA-06', objeto: 'outline-agreement',
    campoOrigem: '—', campoOrigemDescricao: 'Não existe no extrato do Nasajon',
    campoAlvo: 'INCOTERMS', campoAlvoDescricao: 'Incoterms',
    regraConversao: 'Sem regra ativa. O tenant exige o campo e o legado não tem o dado.',
    ruleId: 'R-CTR-011', valorPadrao: null, dependencia: null,
    tratamentoExcecao: 'Retém todos os contratos de serviço até a Verene definir um valor padrão ou liberar o campo.',
    valueDomainId: 'INCOTERMS', obrigatorio: true, divergenciaId: 'DIV-04',
  },
  {
    id: 'MAP-OA-07', objeto: 'outline-agreement',
    campoOrigem: '—', campoOrigemDescricao: 'Não existe no extrato do Nasajon',
    campoAlvo: 'PURCHASING_GROUP', campoAlvoDescricao: 'Grupo de compradores',
    regraConversao: 'Valor padrão único acordado para toda a carga.',
    ruleId: null, valorPadrao: 'V01', dependencia: null,
    tratamentoExcecao: 'Padrão aplicado a todos; a redistribuição por comprador é ajuste pós-carga da Verene.',
    valueDomainId: null, obrigatorio: true, divergenciaId: null,
  },
]
const mappedObjects = [...new Set(mappingDictionary.map((m) => m.objeto))]

/* ========================================================================== */
/* 4. O PLAYBOOK — as regras como estrutura de dados                          */
/* ========================================================================== */

/**
 * A tese da plataforma em forma executável: a regra vive num lugar só,
 * versionada, e os agentes a executam. `deterministic` vira código e executa;
 * `generative` é PROPOSTA de regra candidata, e não executa até que um humano a
 * promova numa versão nova.
 */
const PLAYBOOK_VERSION = 'v1.0.0'
/** Já selada por KANON e ainda NÃO adotada pela onda. Adotar é decisão de quem revisa. */
const PROXIMA_VERSAO = 'v1.4.0'
const V1 = PLAYBOOK_VERSION
const V14 = PROXIMA_VERSAO
const D = '2026-01-08'

const playbookRules = [
  { id: 'R-SUP-001', agent: 'VEGA', object: 'fornecedores', field: 'codigo', type: 'format',
    expression: 'codigo ≠ vazio ∧ único dentro da SPE',
    rationale: 'Sem chave estável no legado não há como rastrear o registro da origem até a carga.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-002', agent: 'VEGA', object: 'fornecedores', field: 'cnpjCpf', type: 'format',
    expression: 'naturezaPessoa = "J" → length(digitos(cnpjCpf)) = 14',
    rationale: 'O extrato traz CNPJ com e sem máscara. A perfilagem mede o comprimento em dígitos, não o texto.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-003', agent: 'VEGA', object: 'fornecedores', field: 'cnpjCpf', type: 'format',
    expression: 'naturezaPessoa = "F" → length(digitos(cnpjCpf)) = 11',
    rationale: 'Mesma medida para pessoa física.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-004', agent: 'VEGA', object: 'fornecedores', field: 'dataCadastro', type: 'format',
    expression: 'dataCadastro ∈ {DD/MM/AAAA, AAAA-MM-DD}',
    rationale: 'As SPEs foram cadastradas em épocas diferentes e o extrato mistura os dois formatos. Perfilar antes de converter evita parser único quebrando no meio da carga.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-005', agent: 'VEGA', object: 'fornecedores', field: 'cep', type: 'format',
    expression: 'length(digitos(cep)) = 8',
    rationale: 'CEP fora de oito dígitos não resolve domicílio fiscal no destino.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-006', agent: 'VEGA', object: 'fornecedores', field: 'cnae', type: 'format',
    expression: 'cnae ≠ vazio',
    rationale: 'CNAE é obrigatório neste tenant (customização da Verene). A perfilagem conta quantos vieram em branco antes de qualquer tentativa de correção.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-007', agent: 'VEGA', object: 'fornecedores', field: 'codigoIbge', type: 'format',
    expression: 'codigoIbge ≠ vazio ∧ length(codigoIbge) = 7',
    rationale: 'Município sem código IBGE não fecha domicílio fiscal. Medir aqui separa "faltou" de "veio errado".',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-MAT-001', agent: 'VEGA', object: 'materiais-servicos', field: 'ncm', type: 'format',
    expression: 'length(digitos(ncm)) = 8',
    rationale: 'NCM é a classificação fiscal do material. Oito dígitos ou nada.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-002', agent: 'VEGA', object: 'contratos', field: 'linhas[].unidadeMedida', type: 'format',
    expression: 'unidadeMedida ≠ vazio ∧ reconhecida no conjunto do legado',
    rationale: 'Perfilar a unidade antes de converter: é o campo em que as SPEs mais divergem e o que muda ordem de grandeza quando passa batido.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-001', agent: 'VEGA', object: 'contratos', field: 'linhas', type: 'format',
    expression: 'para toda linha: quantidade × precoUnitario = valorTotal (± 0,01)',
    rationale: 'Linha que não fecha na origem não vai fechar no destino. Detectar na recepção é mais barato que descobrir na reconciliação.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-010', agent: 'LYRA', object: 'fornecedores', field: 'condicaoPagamento', type: 'domain',
    expression: 'condicaoPagamento → PAYMENT_TERMS(tenant); "30 DD"→Z030, "28 DD"→Z028, "28/56 DD"→Z2856, "45 DD"→Z045, "30/60 DD"→Z3060, "30/60/90 DD"→Z306090, "15 DD"→Z015, "A VISTA"→ZAVI',
    rationale: 'O tenant não tem nenhuma condição de pagamento padrão do SAP ativa — só Z-customizadas. O legado guarda a condição como texto livre, então o de-para é explícito e fechado.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-011', agent: 'LYRA', object: 'fornecedores', field: 'bpGrouping', type: 'domain',
    expression: 'naturezaPessoa = "J" → ZFOR ; naturezaPessoa = "F" → ZFPF',
    rationale: 'Grupo de contas define a faixa de numeração externa. Errar aqui gera Business Partner na faixa errada, e a faixa não se corrige depois.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-012', agent: 'LYRA', object: 'fornecedores', field: 'uf', type: 'referential',
    expression: 'uf ∈ UF do IBGE',
    rationale: 'Região do Business Partner tem que existir antes de resolver domicílio fiscal.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-013', agent: 'LYRA', object: 'fornecedores', field: 'withholdingTaxType', type: 'domain',
    expression: 'retencoes.irrf → I1 ; retencoes.inss → N1 ; retencoes.iss → S1 ; retencoes.pisCofinsCsll → C1',
    rationale: 'O tenant exige tipo de retenção preenchido no cadastro (customização). No legado a retenção está em quatro booleanos por SPE.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-014', agent: 'LYRA', object: 'fornecedores', field: 'industry', type: 'domain',
    expression: 'cnae → INDUSTRY(tenant), preservando o código de sete dígitos',
    rationale: 'CNAE atravessa sem tradução: o tenant usa o próprio código da CNAE como setor industrial.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-MAT-010', agent: 'LYRA', object: 'materiais-servicos', field: 'materialType', type: 'domain',
    expression: 'grupoMercadoria = "EPI" → ZEPI ; grupoMercadoria ∈ {CONDUTOR, ISOLADOR, FERRAGEM, ESTRUTURA} → ZMAN ; demais → HIBE',
    rationale: 'A Verene criou ZMAN e ZEPI além dos tipos padrão. O legado não tem campo que diga qual é qual — o grupo de mercadoria é o melhor proxy disponível.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-010', agent: 'LYRA', object: 'contratos', field: 'unidadeMedida', type: 'domain',
    expression: 'unidadeMedida ∈ {M, MT, METRO} → "M" ; UN → ST ; H → H ; DIA → DAY ; MES → MON ; VB → LE ; KM → KM',
    rationale: 'O mesmo metro linear aparece de três jeitos conforme a SPE. Nenhum dos três é o código do tenant. Sem normalizar, o volume contratado muda de ordem de grandeza.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.8.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-011', agent: 'LYRA', object: 'contratos', field: 'incoterms', type: 'domain',
    expression: 'tipo = "servico" → Incoterms = ?',
    rationale: 'O tenant tornou Incoterms obrigatório em todo contrato, inclusive de serviço, onde o padrão SAP deixa opcional. Nenhum contrato de serviço do legado tem esse dado. Precisa de decisão, não de regra automática.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'candidate', nature: 'generative' },
  { id: 'R-SUP-020', agent: 'ATLAS', object: 'fornecedores', field: 'cnpjCpf', type: 'conversion',
    expression: 'cnpjCpf → digitos(cnpjCpf)',
    rationale: 'O destino guarda o documento sem máscara. Remover pontuação é conversão, não correção: o número não muda.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-021', agent: 'ATLAS', object: 'fornecedores', field: 'dataCadastro', type: 'conversion',
    expression: 'DD/MM/AAAA → AAAA-MM-DD ; AAAA-MM-DD → inalterado',
    rationale: 'Normaliza os dois formatos que a perfilagem encontrou para a forma única do destino.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-022', agent: 'ATLAS', object: 'fornecedores', field: 'chaveNormalizada', type: 'derivation',
    expression: 'chaveNormalizada = maiúsculas(semAcento(razaoSocial)) sem pontuação e sem sufixo societário',
    rationale: 'Chave de comparação para deduplicação. Não vai para o destino — existe só para o cluster.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-023', agent: 'ATLAS', object: 'fornecedores', field: 'razaoSocial', type: 'length',
    expression: 'nameOrg1 = primeiros 40 caracteres de razaoSocial ; nameOrg2 = resto (até 40)',
    rationale: 'NAME_ORG1 do Business Partner tem 40 caracteres. O que passar disso vai para NAME_ORG2, na ordem em que veio.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v0.9.0', vigenteAte: V14,
    parametros: { limite: 40, corte: 'caractere' }, createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-023', agent: 'ATLAS', object: 'fornecedores', field: 'razaoSocial', type: 'length',
    expression: 'nameOrg1 = razaoSocial até o último espaço antes de 40 ; nameOrg2 = resto (até 40)',
    rationale: 'Cortar no caractere 40 parte palavra ao meio: "…INDUSTRIA E COMERCIO L" + "TDA". O nome é o que identifica o Business Partner no documento fiscal — a quebra tem que cair no espaço, não na letra.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V14, introducedIn: V14,
    parametros: { limite: 40, corte: 'palavra' }, createdAt: '2026-01-23', status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-024', agent: 'ATLAS', object: 'fornecedores', field: 'cep', type: 'conversion',
    expression: 'cep → digitos(cep)',
    rationale: 'O destino guarda o CEP sem hífen.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-030', agent: 'ATLAS', object: 'fornecedores', field: '*', type: 'business',
    expression: 'cluster de duplicata = registros com o mesmo digitos(cnpjCpf)',
    rationale: 'Documento é a única chave confiável entre SPEs: a razão social diverge em grafia, a razão fantasia diverge mais ainda.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-031', agent: 'ATLAS', object: 'fornecedores', field: '*', type: 'survivorship',
    expression: 'sobrevivente = registro do cluster com mais campos preenchidos ; empate → menor SPE ; empate → menor codigo',
    rationale: 'Critério de sobrevivência precisa ser total e estável, senão a mesma entrada gera saída diferente entre execuções. O desempate por SPE e código garante isso.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-032', agent: 'ATLAS', object: 'fornecedores', field: 'razaoSocial', type: 'survivorship',
    expression: 'razão social do sobrevivente = a mais longa do cluster',
    rationale: 'Entre "PROTEGE EPI COM DE EQUIP LTDA" e "Protege EPI Comércio de Equipamentos Ltda", a forma por extenso é a que o cadastro do destino deve guardar.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-033', agent: 'ATLAS', object: 'fornecedores', field: 'retencoes', type: 'survivorship',
    expression: 'retenções do sobrevivente = ?',
    rationale: 'Quando as SPEs do cluster divergem na retenção do mesmo prestador, não existe critério no dado que diga qual está certa. É decisão fiscal, não de engenharia.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'candidate', nature: 'generative' },
  { id: 'R-CTR-021', agent: 'ATLAS', object: 'contratos', field: 'linhas[].descricao', type: 'length',
    expression: 'shortText = primeiros 40 de descricao, quebrando na última palavra inteira',
    rationale: 'O texto breve do Service master tem 40 caracteres. Mesma regra de quebra da razão social — cortar no meio da palavra é o defeito clássico.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-020', agent: 'ATLAS', object: 'contratos', field: 'quantidade', type: 'conversion',
    expression: 'unidadeMedida ∈ {M, MT, METRO} → quantidade inalterada (fator 1)',
    rationale: 'As três grafias significam metro. A conversão é só de código de unidade; mexer na quantidade seria inventar volume.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-040', agent: 'NOVA', object: 'fornecedores', field: 'codigoIbge', type: 'derivation',
    expression: 'codigoIbge vazio → busca(municipio, uf) na tabela de municípios do IBGE',
    rationale: 'Município e UF vieram no extrato; o código não. Derivar de fonte de referência é determinístico e auditável — diferente de adivinhar.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-041', agent: 'NOVA', object: 'fornecedores', field: 'taxJurCode', type: 'derivation',
    expression: 'taxJurCode = codigoIbge',
    rationale: 'O domicílio fiscal do Business Partner no Brasil é o código de município do IBGE.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-042', agent: 'NOVA', object: 'fornecedores', field: 'cnpjCpf', type: 'business',
    expression: 'naturezaPessoa = "J" → digito verificador de CNPJ confere ; senão RETER',
    rationale: 'CNPJ com dígito verificador inválido é dado errado na origem, não problema de formato. Não se corrige por regra: volta para quem cadastrou.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-043', agent: 'NOVA', object: 'fornecedores', field: 'cpf', type: 'business',
    expression: 'naturezaPessoa = "F" → digito verificador de CPF confere ; senão RETER',
    rationale: 'Mesma verificação para pessoa física.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-044', agent: 'NOVA', object: 'fornecedores', field: 'businessPartner', type: 'referential',
    expression: 'digitos(cnpjCpf) ∈ base existente → REUSAR o Business Partner, não criar',
    rationale: 'Criar de novo gera Business Partner duplicado com o mesmo CNPJ. Não dá erro na carga — aparece meses depois, no fechamento fiscal.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-045', agent: 'NOVA', object: 'fornecedores', field: '*', type: 'business',
    expression: 'todo campo obrigatório do tenant preenchido ; senão RETER',
    rationale: 'Os campos obrigatórios saem de tenant-config.ts, incluindo os que a Verene tornou obrigatórios fora do padrão SAP. Validar contra o tenant vivo, não contra o SAP de fábrica.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-046', agent: 'NOVA', object: 'fornecedores', field: 'cnae', type: 'derivation',
    expression: 'cnae vazio → derivar de razaoSocial + objeto contratado?',
    rationale: 'Fornecedores vieram sem CNAE e o tenant exige. Dá para propor um CNAE a partir do ramo do nome e do que a empresa fornece — mas é proposta, não derivação: erro de CNAE tem efeito fiscal.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'candidate', nature: 'generative' },
  { id: 'R-SUP-047', agent: 'NOVA', object: 'fornecedores', field: 'retencoes', type: 'business',
    expression: 'mesmo CPF em SPEs diferentes com retenção diferente → RETER ambos e escalar',
    rationale: 'Duas SPEs tratam o mesmo prestador de forma diferente e a regra correta não está escrita em lugar nenhum. É o caso que obriga a decisão a subir para o cliente em vez de ser resolvida no código.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-SUP-048', agent: 'NOVA', object: 'fornecedores', field: 'nameOrg1', type: 'length',
    expression: 'nameOrg1 termina no meio de palavra → RETER',
    rationale: 'A validação do nome quebrado é independente da regra que quebra: se as duas viessem do mesmo raciocínio, o defeito passaria pelas duas. É por isso que quem encontra o corte errado é NOVA, e não ATLAS.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-MAT-020', agent: 'NOVA', object: 'materiais-servicos', field: 'ncm', type: 'business',
    expression: 'ncm vazio → RETER',
    rationale: 'Sem NCM não há cálculo de imposto no destino. Não é campo que se preenche por padrão.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-MAT-021', agent: 'NOVA', object: 'materiais-servicos', field: 'descricao', type: 'derivation',
    expression: 'descricao → TIPO + ESPECIFICAÇÃO + NORMA/CLASSE, removendo recado e status',
    rationale: 'Sete descrições trazem recado de comprador, marcação de urgência ou status do item. Reescrever é proposta: quem confere é quem compra.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'candidate', nature: 'generative' },
  { id: 'R-CTR-040', agent: 'NOVA', object: 'contratos', field: 'serviceGroup', type: 'derivation',
    expression: 'centroCusto → SERVICE_GROUP(tenant) pelo prefixo do centro de custo',
    rationale: 'O centro de custo do legado carrega o tipo de ativo (LT, SE, OBRA, AMB) e é a única evidência disponível para o grupo de serviço.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-041', agent: 'NOVA', object: 'contratos', field: 'codigoLc116', type: 'derivation',
    expression: 'descricao da linha → item da lista de serviços da LC 116/2003',
    rationale: 'O código da LC 116 define a incidência de ISS. Deriva de tabela de referência, com o item citado junto ao valor — sem a citação, não há proposta.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-030', agent: 'NOVA', object: 'contratos', field: 'faseFiscal', type: 'business',
    expression: 'faseFiscal ≠ "concluida" → RETER',
    rationale: 'Contrato com fase fiscal aberta não pode virar Outline agreement: migrar agora cria compromisso sem lastro fiscal.',
    owner: 'Verene · Fiscal', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-CTR-031', agent: 'NOVA', object: 'contratos', field: 'valorOriginal', type: 'business',
    expression: '|Σ linhas.valorTotal − valorOriginal| ≤ 0,01 ; senão RETER',
    rationale: 'Cabeçalho que não bate com as linhas é aditivo lançado pela metade. Migrar o cabeçalho errado propaga o erro para o compromisso.',
    owner: 'Verene · Suprimentos', playbookVersion: V1, introducedIn: 'v0.9.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-PKG-001', agent: 'ORION', object: 'transversal', field: '*', type: 'business',
    expression: 'empacota apenas registro com outcome ∈ {migrated, reused} e checkpoint assinado',
    rationale: 'Registro retido ou pendente de assinatura não entra no pacote. É o que faz o Gate valer alguma coisa.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-PKG-002', agent: 'ORION', object: 'transversal', field: 'manifest', type: 'format',
    expression: 'manifest carrega { versão do playbook, checksum do playbook, contagem, checksum do conteúdo }',
    rationale: 'O manifest é o que permite provar, depois da carga, qual regra gerou qual registro. Sem ele a trilha morre no empacotamento.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-PKG-003', agent: 'ORION', object: 'transversal', field: 'businessPartner', type: 'referential',
    expression: 'businessPartner ∈ faixa externa do grupo de contas do tenant',
    rationale: 'As faixas de fornecedor são externas neste tenant: o número vai na carga. Fora da faixa, o Migration Cockpit rejeita o lote inteiro.',
    owner: 'Monoda · Arquitetura S/4HANA', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-PKG-004', agent: 'ORION', object: 'transversal', field: '*', type: 'length',
    expression: 'tamanho do pacote ≤ 500 registros',
    rationale: 'Lote grande demais no Migration Cockpit falha por timeout e não diz qual registro quebrou.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-REC-001', agent: 'SIRIUS', object: 'transversal', field: '*', type: 'business',
    expression: 'recebidos = migrated + reused + merged + held',
    rationale: 'A conta tem que fechar por construção. Registro que some entre a recepção e o pacote é o defeito mais caro de achar depois.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-REC-002', agent: 'SIRIUS', object: 'transversal', field: '*', type: 'business',
    expression: 'todo registro tem trilha não vazia',
    rationale: 'Registro que atravessou a esteira sem nenhuma regra aplicada não foi processado — passou batido.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-REC-003', agent: 'SIRIUS', object: 'transversal', field: '*', type: 'business',
    expression: 'todo registro retido tem exceção com origem, severidade e dono',
    rationale: 'Retenção sem dono não é exceção, é registro perdido. A taxonomia de origem é o que roteia.',
    owner: 'Monoda · Data Engineering', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-GOV-001', agent: 'KANON', object: 'transversal', field: '*', type: 'business',
    expression: 'toda regra tem owner, rationale e createdAt preenchidos',
    rationale: 'Regra sem dono e sem justificativa não é regra, é comportamento escondido no código.',
    owner: 'Monoda · Governança', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-GOV-002', agent: 'KANON', object: 'transversal', field: '*', type: 'referential',
    expression: 'agente só executa regra publicada na versão do playbook em uso',
    rationale: 'É o que torna a tese literal: o agente não interpreta, ele resolve no playbook e aplica. Regra fora da versão não executa.',
    owner: 'Monoda · Governança', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-GOV-003', agent: 'KANON', object: 'transversal', field: '*', type: 'business',
    expression: 'versão selada é imutável ; mudança de regra → nova versão',
    rationale: 'Mesma versão de playbook tem que dar a mesma saída, sempre. Sem imutabilidade não há reprodutibilidade nem auditoria.',
    owner: 'Monoda · Governança', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
  { id: 'R-GOV-004', agent: 'KANON', object: 'transversal', field: '*', type: 'business',
    expression: 'regra generativa não executa antes de promovida a active por humano',
    rationale: 'Proposta de regra é proposta. A distinção entre o que a máquina decide e o que ela sugere é o que se está comprando.',
    owner: 'Monoda · Governança', playbookVersion: V1, introducedIn: 'v1.0.0', createdAt: D, status: 'active', nature: 'deterministic' },
]

const ruleById = new Map(playbookRules.map((r) => [r.id, r]))
const ruleIds = [...new Set(playbookRules.map((r) => r.id))]
const ruleTypes = ['format', 'domain', 'length', 'referential', 'conversion', 'derivation', 'business', 'survivorship']
const rotuloTipoRegra = {
  format: 'Formato', domain: 'Domínio', length: 'Comprimento', referential: 'Referencial',
  conversion: 'Conversão', derivation: 'Derivação', business: 'Negócio', survivorship: 'Sobrevivência',
}
const rotuloObjetoRegra = {
  fornecedores: 'Fornecedores', 'materiais-servicos': 'Materiais e serviços',
  contratos: 'Contratos', transversal: 'Transversal',
}

/* ---------- histórico de versões ------------------------------------------- */
/** Regra selada não muda: mudança de regra sobe versão (R-GOV-003). */
const versoesPlaybook = [
  {
    versao: 'v0.8.0',
    data: '2025-11-14',
    autor: 'Patrícia Lemos · Monoda · Governança',
    resumo:
      'Primeira publicação. Recepção e perfilagem (VEGA) e o de-para contra o tenant (LYRA), depois da leitura da configuração viva.',
    selada: true,
  },
  {
    versao: 'v0.9.0',
    data: '2025-12-09',
    autor: 'Patrícia Lemos · Monoda · Governança',
    resumo:
      'Transformação, deduplicação, enriquecimento e validação (ATLAS e NOVA). Entra o critério de sobrevivência e a validação contra os campos obrigatórios do tenant.',
    selada: true,
  },
  {
    versao: 'v1.0.0',
    data: '2026-01-08',
    autor: 'Patrícia Lemos · Monoda · Governança',
    resumo:
      'Empacotamento, reconciliação e governança (ORION, SIRIUS, KANON). Quatro regras entram como candidatas: são os casos em que o dado não decide sozinho.',
    selada: true,
  },
  {
    versao: 'v1.4.0',
    data: '2026-01-23',
    autor: 'Patrícia Lemos · Monoda · Governança',
    resumo:
      'Correção da quebra de NAME_ORG1: o corte passa a cair no último espaço antes do limite, e não no caractere 40. As versões v1.1.0 a v1.3.0 correram em outras ondas do programa e não tocam o escopo desta.',
    selada: true,
  },
]
/** A ordem das versões é a relação de ordem do playbook: KANON usa este índice. */
const ordemDasVersoes = versoesPlaybook.map((v) => v.versao)
const ordemDaVersao = (versao) => ordemDasVersoes.indexOf(versao)

const alteracoesRegra = [
  { ruleId: 'R-SUP-002', versao: 'v0.8.0', data: '2025-11-14', tipo: 'criada', autor: 'Marina Dantas',
    nota: 'Medida em dígitos, não em texto: o extrato mistura CNPJ com e sem máscara.' },
  { ruleId: 'R-SUP-004', versao: 'v0.8.0', data: '2025-11-14', tipo: 'criada', autor: 'Marina Dantas',
    nota: 'Perfilar os dois formatos de data antes de converter, em vez de assumir um.' },
  { ruleId: 'R-SUP-010', versao: 'v0.8.0', data: '2025-11-18', tipo: 'criada', autor: 'Rafael Queiroz',
    nota: 'De-para fechado contra PAYMENT_TERMS do tenant. Nenhuma condição padrão do SAP está ativa.' },
  { ruleId: 'R-SUP-011', versao: 'v0.8.0', data: '2025-11-18', tipo: 'criada', autor: 'Rafael Queiroz',
    nota: 'Grupo de contas define a faixa externa; errar aqui não se corrige depois.' },
  { ruleId: 'R-SUP-010', versao: 'v0.9.0', data: '2025-12-02', tipo: 'alterada', autor: 'Rafael Queiroz',
    nota: 'Incluídas as variações "30/60 DD" e "30/60/90 DD", encontradas na perfilagem da SPE-1.' },
  { ruleId: 'R-SUP-023', versao: 'v0.9.0', data: '2025-12-04', tipo: 'criada', autor: 'Bruno Salgado',
    nota: 'NAME_ORG1 tem 40 caracteres. O que passa disso vai para NAME_ORG2.' },
  { ruleId: 'R-SUP-031', versao: 'v0.9.0', data: '2025-12-05', tipo: 'criada', autor: 'Ana Ribeiro',
    nota: 'Critério de sobrevivência por completude, com desempate por SPE e código.' },
  { ruleId: 'R-SUP-031', versao: 'v0.9.0', data: '2025-12-06', tipo: 'alterada', autor: 'Bruno Salgado',
    nota: 'Desempate acrescentado depois de a mesma entrada gerar sobrevivente diferente entre execuções.' },
  { ruleId: 'R-SUP-044', versao: 'v0.9.0', data: '2025-12-08', tipo: 'criada', autor: 'Carlos Menezes',
    nota: 'Reuso de Business Partner existente. Recriar gera duplicata que só aparece no fechamento fiscal.' },
  { ruleId: 'R-SUP-007', versao: 'v1.0.0', data: '2026-01-05', tipo: 'criada', autor: 'Marina Dantas',
    nota: 'Separar "município sem código" de "código errado" na perfilagem.' },
  { ruleId: 'R-SUP-047', versao: 'v1.0.0', data: '2026-01-06', tipo: 'criada', autor: 'Carlos Menezes',
    nota: 'Retenção divergente do mesmo CPF entre SPEs passa a reter os dois lados e escalar.' },
  { ruleId: 'R-CTR-011', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Rafael Queiroz',
    nota: 'Entra como candidata: o tenant exige Incoterms em contrato de serviço e o legado não tem o dado.' },
  { ruleId: 'R-SUP-033', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Carlos Menezes',
    nota: 'Candidata. Qual retenção sobrevive no cluster é decisão fiscal, não critério de dado.' },
  { ruleId: 'R-SUP-046', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Carlos Menezes',
    nota: 'Candidata. Derivar CNAE do ramo é proposta; erro de CNAE tem efeito fiscal.' },
  { ruleId: 'R-MAT-021', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Ana Ribeiro',
    nota: 'Candidata. Reescrever descrição é proposta: quem confere é quem compra.' },
  { ruleId: 'R-SUP-048', versao: 'v1.0.0', data: '2026-01-07', tipo: 'criada', autor: 'Rafael Queiroz',
    nota: 'Validação do nome quebrado, independente da regra que quebra. Se as duas viessem do mesmo raciocínio, o defeito passaria pelas duas.' },
  { ruleId: 'R-GOV-002', versao: 'v1.0.0', data: '2026-01-08', tipo: 'criada', autor: 'Patrícia Lemos',
    nota: 'Agente só executa regra publicada na versão em uso. É o que torna a tese verificável.' },
  { ruleId: 'R-PKG-002', versao: 'v1.0.0', data: '2026-01-08', tipo: 'criada', autor: 'Bruno Salgado',
    nota: 'O manifest passa a carregar versão e checksum do playbook, para a trilha sobreviver ao empacotamento.' },
  { ruleId: 'R-SUP-023', versao: 'v1.4.0', data: '2026-01-23', tipo: 'alterada', autor: 'Rafael Queiroz',
    nota: 'O corte passa do caractere 40 para o último espaço antes dele. As razões sociais mais longas quebravam no meio da palavra, achadas pela R-SUP-048 na onda 1.' },
]
const historicoDaRegra = (ruleId) =>
  alteracoesRegra.filter((a) => a.ruleId === ruleId)
    .slice().sort((a, b) => (a.versao + a.data < b.versao + b.data ? -1 : 1))

/* ========================================================================== */
/* 5. GATES, CRITÉRIOS E PARCELAS                                             */
/* ========================================================================== */

const gateIds = ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7']

const gates = [
  {
    id: 'G0', n: 0, nome: 'Linha de base da onda', checkpoint: null, assinaturaNoGate: false,
    descricao:
      'A onda só abre com escopo declarado, extrato recebido e conferido, e playbook selado. Sem os três, não há contra o que medir nada depois.',
    quandoOcorre: 'Na abertura da onda, antes da primeira execução da esteira.',
    oQueEAprovado:
      'O escopo declarado em pacotes e volumes, o recibo do extrato recebido do Nasajon e a versão selada do playbook que vai reger a onda.',
    artefato: { id: 'A0', nome: 'Escopo declarado, recibo de recepção e playbook selado', gate: 'G0' },
    exigeArtefato: null,
    evidencias: [
      {
        id: 'E0-1', titulo: 'Escopo declarado', path: '/mission-control', produzidaPor: null,
        descricao: 'Objetos, SPEs, ciclos e volume de referência. É o denominador de todo percentual medido nos Gates seguintes.',
      },
      {
        id: 'E0-2', titulo: 'Recibo de recepção do extrato', path: '/mission-control', produzidaPor: 'receive',
        descricao: 'Contagem e fingerprint calculados do conteúdo recebido, não repetidos do que o fornecedor declarou.',
      },
      {
        id: 'E0-3', titulo: 'Playbook selado com checksum', path: '/playbook', produzidaPor: null,
        descricao: 'A versão que os agentes vão executar, com checksum. Mudança de regra sobe versão e reabre este Gate.',
      },
    ],
    assinantes: [
      { area: 'Verene · Data owner', oQueAssina: 'Escopo e recibo do extrato' },
      { area: 'Monoda · Governança', oQueAssina: 'Selo da versão do playbook' },
    ],
  },
  {
    id: 'G1', n: 1, nome: 'Mapeamento aprovado', checkpoint: 'mapeamento', assinaturaNoGate: false,
    descricao:
      'O de-para contra o tenant vivo está aprovado tecnicamente e assinado. Nenhuma transformação roda antes disto.',
    quandoOcorre: 'Depois do passo 3 (MAP), antes de qualquer transformação.',
    oQueEAprovado:
      'O dicionário campo a campo contra a configuração ativa do tenant, com as divergências do padrão SAP declaradas uma a uma.',
    artefato: { id: 'A1', nome: 'Dicionário de mapeamento aprovado', gate: 'G1' },
    exigeArtefato: 'A0',
    evidencias: [
      {
        id: 'E1-1', titulo: 'Dicionário de mapeamento', path: '/mapping', produzidaPor: 'map',
        descricao: 'Campo de origem, campo de destino, domínio de valor lido do tenant e a regra do playbook que faz a conversão.',
      },
      {
        id: 'E1-2', titulo: 'Divergências do padrão SAP', path: '/mapping', produzidaPor: null,
        descricao: 'O que no tenant da Verene não é SAP padrão. Mapear contra o padrão em vez do tenant é o erro que só aparece na carga.',
      },
    ],
    assinantes: [
      { area: 'Monoda · Arquitetura S/4HANA', oQueAssina: 'Aprovação técnica do de-para' },
      { area: 'Verene · Data owner', oQueAssina: 'Assinatura do de-para no Gate' },
    ],
  },
  {
    id: 'G2', n: 2, nome: 'Transformação concluída', checkpoint: 'duplicatas', assinaturaNoGate: false,
    descricao:
      'Todos os registros do escopo atravessaram os passos de transformação e deduplicação, com cada cluster confirmado individualmente.',
    quandoOcorre: 'Depois do passo 5 (DEDUPLICATE), com cada cluster de duplicata decidido um a um.',
    oQueEAprovado:
      'O resultado da deduplicação: quais cadastros são a mesma entidade, qual sobrevive e qual código é aposentado com cross-reference.',
    artefato: { id: 'A2', nome: 'Registro de deduplicação decidido', gate: 'G2' },
    exigeArtefato: 'A1',
    evidencias: [
      {
        id: 'E2-1', titulo: 'Fila de duplicatas com racional do match', path: '/review/duplicates', produzidaPor: 'deduplicate',
        descricao: 'Sinal a sinal, com o peso de cada um. O score é a soma dos pesos que conferem, não um número solto.',
      },
      {
        id: 'E2-2', titulo: 'Rastreabilidade em nível de campo', path: '/record/F1001', produzidaPor: 'transform',
        descricao: 'Valor de origem, cada regra aplicada com id e versão, e o valor final. É o que sustenta "100% transformados".',
      },
    ],
    assinantes: [{ area: 'Verene · Suprimentos', oQueAssina: 'Cada cluster de duplicata, um a um' }],
  },
  {
    id: 'G3', n: 3, nome: 'Validação concluída', checkpoint: 'excecoes', assinaturaNoGate: false,
    descricao: 'Toda exceção aberta recebeu decisão humana. Não há registro pendente sem dono.',
    quandoOcorre: 'Depois do passo 7 (VALIDATE), com decisão humana em cada exceção aberta.',
    oQueEAprovado:
      'A decisão de cada exceção: liberada com evidência anexada, ou mantida retida com dono nomeado e prazo. Nada é defaultado para o lote passar.',
    artefato: { id: 'A3', nome: 'Registro de exceções decididas', gate: 'G3' },
    exigeArtefato: 'A2',
    evidencias: [
      {
        id: 'E3-1', titulo: 'Fila de exceções com dono e prazo', path: '/review/exceptions', produzidaPor: 'validate',
        descricao: 'Exceção técnica roteada ao SAP SME, exceção de negócio ao data owner. Cada uma com pessoa, prazo e estado.',
      },
      {
        id: 'E3-2', titulo: 'Enriquecimento com evidência anexada', path: '/review/exceptions', produzidaPor: 'enrich',
        descricao: 'Cada valor proposto mostra a fonte que o sustenta. Onde não há fonte, não há proposta.',
      },
    ],
    assinantes: [{ area: 'Verene · Fiscal', oQueAssina: 'Cada exceção aberta, uma a uma' }],
  },
  {
    id: 'G4', n: 4, nome: 'Pacote aprovado', checkpoint: 'pacote-reconciliacao', assinaturaNoGate: true,
    descricao:
      'O pacote está íntegro, dentro do limite de tamanho, com manifest e checksum, e a simulação no Migration Cockpit passou.',
    quandoOcorre: 'Depois do passo 8 (PACKAGE), antes da entrega formal ao time de carga.',
    oQueEAprovado:
      'O pacote que vai para a carga: o XML gerado, a divisão em partes, o manifest com versão e checksum do playbook, e a simulação aprovada.',
    artefato: { id: 'A4', nome: 'Pacote, manifest e checksum', gate: 'G4' },
    exigeArtefato: 'A3',
    evidencias: [
      {
        id: 'E4-1', titulo: 'Manifest com versão e checksum do playbook', path: '/packages', produzidaPor: 'package',
        descricao: 'É por aqui que se prova, depois da carga, qual versão de regra gerou qual registro.',
      },
      {
        id: 'E4-2', titulo: 'Conformidade e divisão do pacote', path: '/packages', produzidaPor: 'package',
        descricao: 'Tamanho de campo, formato, integridade referencial e obrigatoriedade do tenant, contra os dois tetos de arquivo.',
      },
      {
        id: 'E4-3', titulo: 'Simulação no Migration Cockpit', path: '/packages', produzidaPor: null,
        descricao: 'Pacote que não passou na simulação não é entregue. O estado por objeto está declarado.',
      },
    ],
    assinantes: [{ area: 'Verene · Data owner', oQueAssina: 'Liberação do pacote para carga' }],
  },
  {
    id: 'G5', n: 5, nome: 'Carga executada', checkpoint: null, assinaturaNoGate: true,
    descricao:
      'A carga rodou no tenant, na janela acordada. Fora da esteira: quem executa é o time de carga da Verene.',
    quandoOcorre: 'Na janela de carga acordada, depois da entrega formal do pacote.',
    oQueEAprovado:
      'O registro da execução: qual pacote entrou, em que janela, e o resultado devolvido pelo Migration Cockpit.',
    artefato: { id: 'A5', nome: 'Registro de execução da carga', gate: 'G5' },
    exigeArtefato: 'A4',
    evidencias: [
      {
        id: 'E5-1', titulo: 'Entrega formal e calendário acordado', path: '/packages', produzidaPor: null,
        descricao: 'Destinatário, escopo declarado, exceções conhecidas e janela. É o documento que responde depois a "isto foi combinado?".',
      },
    ],
    assinantes: [{ area: 'Verene · Basis', oQueAssina: 'Execução da carga no tenant' }],
  },
  {
    id: 'G6', n: 6, nome: 'Reconciliação assinada', checkpoint: null, assinaturaNoGate: true,
    descricao:
      'Origem e destino fecham em contagem e em valor, com toda diferença explicada e verificada nos apps Fiori.',
    quandoOcorre: 'Depois da carga, com origem e destino conferidos no tenant.',
    oQueEAprovado:
      'A reconciliação origem × destino, com cada diferença explicada, e o registro de defeitos separado por origem e dono contratual.',
    artefato: { id: 'A6', nome: 'Reconciliação origem × destino', gate: 'G6' },
    exigeArtefato: 'A5',
    evidencias: [
      {
        id: 'E6-1', titulo: 'Reconciliação por contagem e por valor', path: '/reconciliation', produzidaPor: 'reconcile',
        descricao: 'Quebrada por objeto e por SPE. Diferença sem causa nomeada é registro perdido que ninguém procurou.',
      },
      {
        id: 'E6-2', titulo: 'Verificação guiada nos apps Fiori', path: '/reconciliation', produzidaPor: null,
        descricao: 'Contagem prova que o número fecha; não prova que o registro está certo. A verificação no app fecha essa lacuna.',
      },
    ],
    assinantes: [{ area: 'Verene · Data owner', oQueAssina: 'Reconciliação e registro de defeitos' }],
  },
  {
    id: 'G7', n: 7, nome: 'Aceite da onda', checkpoint: null, assinaturaNoGate: true,
    descricao:
      'O aceite formal da onda, medido contra os critérios contratados — não contra a impressão de que correu bem.',
    quandoOcorre: 'No encerramento da onda, depois da reconciliação assinada.',
    oQueEAprovado:
      'Os quatro critérios de aceite com o número medido em cada Gate, a documentação do playbook na versão da entrega e os defeitos remanescentes com dono.',
    artefato: { id: 'A7', nome: 'Termo de aceite da onda', gate: 'G7' },
    exigeArtefato: 'A6',
    evidencias: [
      {
        id: 'E7-1', titulo: 'Placar dos critérios de aceite', path: '/reconciliation', produzidaPor: 'reconcile',
        descricao: 'Cada critério com o Gate onde é medido e a frase de como o número foi obtido.',
      },
      {
        id: 'E7-2', titulo: 'Documentação gerada do playbook', path: '/playbook', produzidaPor: null,
        descricao: 'Montada a partir das próprias regras na versão da entrega. Documentação escrita à mão diverge do que rodou.',
      },
    ],
    assinantes: [
      { area: 'Verene · Data owner', oQueAssina: 'Aceite da onda' },
      { area: 'Monoda · Governança', oQueAssina: 'Encerramento e versão entregue' },
    ],
  },
]
const gateById = Object.fromEntries(gates.map((g) => [g.id, g]))
const gateDoArtefato = Object.fromEntries(gates.map((g) => [g.artefato.id, g.id]))

/**
 * Assinatura do G0, anterior à primeira execução da esteira. O extrato foi
 * recebido em 05/01 e o playbook selado em 08/01; a linha de base foi assinada
 * em 09/01, três dias antes do epoch da simulação.
 */
const assinaturaDeBaseline = [
  {
    by: 'Helena Duarte',
    role: 'Verene · Data owner',
    decision: 'approved',
    at: '2026-01-09T13:40:00.000Z',
    playbookVersion: PLAYBOOK_VERSION,
    note: 'Escopo e recibos de recepção conferidos contra o conteúdo dos arquivos.',
  },
  {
    by: 'Patrícia Lemos',
    role: 'Monoda · Governança',
    decision: 'approved',
    at: '2026-01-09T14:05:00.000Z',
    playbookVersion: PLAYBOOK_VERSION,
    note: 'Playbook selado. Alteração de regra a partir daqui sobe versão e reabre o Gate.',
  },
]

const criteriosDeAceite = [
  {
    id: 'CA-01', nome: '100% dos registros transformados', gate: 'G2',
    descricao: 'Todo registro do escopo atravessou a transformação e a deduplicação. Registro que some entre a recepção e o pacote é o defeito mais caro de achar depois.',
    tipo: 'percentual-minimo', alvo: 100, unidade: '%', escopo: 'todos-os-registros',
  },
  {
    id: 'CA-02', nome: '100% dos registros validados', gate: 'G3',
    descricao: 'Todo registro passou pela validação contra as regras de negócio e os campos obrigatórios do tenant, com decisão humana em cada exceção.',
    tipo: 'percentual-minimo', alvo: 100, unidade: '%', escopo: 'todos-os-registros',
  },
  {
    id: 'CA-03', nome: 'Zero defeito crítico de transformação', gate: 'G4',
    descricao: 'Defeito crítico de origem "transformation" é responsabilidade da Monoda e o teto é zero. Defeito das outras três origens não conta aqui — conta na conversa com o dono dele.',
    tipo: 'contagem-maxima', alvo: 0, unidade: 'defeitos', escopo: 'defeitos-de-transformacao',
  },
  {
    id: 'CA-04', nome: 'Até 5% de defeito não crítico de transformação', gate: 'G6',
    descricao: 'Teto de 5% sobre os registros processados, medido só sobre a origem "transformation". É o único bucket pelo qual a Monoda responde.',
    tipo: 'percentual-maximo', alvo: 5, unidade: '%', escopo: 'defeitos-de-transformacao',
  },
]

/**
 * Gate × parcela. Só percentual: o valor do contrato não vive no protótipo, e
 * número inventado ao lado de percentual real seria pior do que não mostrar
 * valor. G0, G3 e G5 aparecem sem parcela — nem todo ponto de decisão é ponto de
 * faturamento, e um Gate sem dinheiro atrás continua bloqueante.
 */
const parcelasPorGate = [
  { gate: 'G1', percentual: 20, marco: 'Dicionário de mapeamento aprovado' },
  { gate: 'G2', percentual: 20, marco: 'Registro de deduplicação decidido' },
  { gate: 'G4', percentual: 20, marco: 'Pacote, manifest e checksum aprovados' },
  { gate: 'G6', percentual: 25, marco: 'Reconciliação origem × destino assinada' },
  { gate: 'G7', percentual: 15, marco: 'Termo de aceite da onda' },
]
const PERCENTUAL_TOTAL = parcelasPorGate.reduce((acc, p) => acc + p.percentual, 0)

/* ========================================================================== */
/* 6. RECEPÇÃO, ENTREGA E VERIFICAÇÃO                                         */
/* ========================================================================== */

/**
 * Metadado da entrega: o que o fornecedor de extração declarou. A contagem real
 * e o fingerprint são CALCULADOS do conteúdo — um recibo que repete o número do
 * vendor em vez de conferir não serve de recibo.
 */
const VENDOR = 'Verene · TI Corporativa (extração Nasajon)'
const arquivosRecebidos = [
  { id: 'ARQ-001', nomeArquivo: 'NASAJON_FORNECEDORES_SPE1_20260105.XLSX', formato: 'XLSX',
    objetoId: 'fornecedores', spe: 'SPE-1', ciclo: 'ciclo-1', recebidoEm: '2026-01-05',
    layoutEsperado: 'LAY-FOR-v3', divergenciasLayout: [], registrosDeclarados: 6,
    recibo: { numero: 'REC-2026-0001', emitidoEm: '2026-01-05', emitidoPara: VENDOR, aceito: true, observacao: null } },
  { id: 'ARQ-002', nomeArquivo: 'NASAJON_FORNECEDORES_SPE2_20260105.XLSX', formato: 'XLSX',
    objetoId: 'fornecedores', spe: 'SPE-2', ciclo: 'ciclo-1', recebidoEm: '2026-01-05',
    layoutEsperado: 'LAY-FOR-v3', divergenciasLayout: [], registrosDeclarados: 6,
    recibo: { numero: 'REC-2026-0002', emitidoEm: '2026-01-05', emitidoPara: VENDOR, aceito: true, observacao: null } },
  // o vendor declarou 7; a leitura encontra 6
  { id: 'ARQ-003', nomeArquivo: 'NASAJON_FORNECEDORES_SPE3_20260106.XLSX', formato: 'XLSX',
    objetoId: 'fornecedores', spe: 'SPE-3', ciclo: 'ciclo-1', recebidoEm: '2026-01-06',
    layoutEsperado: 'LAY-FOR-v3', divergenciasLayout: [], registrosDeclarados: 7,
    recibo: { numero: 'REC-2026-0003', emitidoEm: '2026-01-06', emitidoPara: VENDOR, aceito: false,
      observacao: 'Contagem declarada não confere com a leitura. Recibo emitido com ressalva.' } },
  { id: 'ARQ-004', nomeArquivo: 'NASAJON_FORNECEDORES_SPE4_20260106.CSV', formato: 'CSV',
    objetoId: 'fornecedores', spe: 'SPE-4', ciclo: 'ciclo-1', recebidoEm: '2026-01-06',
    layoutEsperado: 'LAY-FOR-v3',
    divergenciasLayout: [
      { campo: 'INSCRICAO_MUNICIPAL', problema: 'Coluna ausente no arquivo; o layout v3 a exige.' },
      { campo: 'DT_CADASTRO', problema: 'Entregue como texto livre, não como data.' },
    ],
    registrosDeclarados: 6,
    recibo: { numero: 'REC-2026-0004', emitidoEm: '2026-01-06', emitidoPara: VENDOR, aceito: false,
      observacao: 'Duas divergências de layout. Arquivo aceito para perfilagem, não para carga.' } },
  { id: 'ARQ-005', nomeArquivo: 'NASAJON_MATERIAIS_SPE1_20260108.XLSX', formato: 'XLSX',
    objetoId: 'materiais-servicos', spe: 'SPE-1', ciclo: 'ciclo-1', recebidoEm: '2026-01-08',
    layoutEsperado: 'LAY-MAT-v2', divergenciasLayout: [], registrosDeclarados: 4,
    recibo: { numero: 'REC-2026-0005', emitidoEm: '2026-01-08', emitidoPara: VENDOR, aceito: true, observacao: null } },
  { id: 'ARQ-006', nomeArquivo: 'NASAJON_MATERIAIS_SPE2_20260108.XLSX', formato: 'XLSX',
    objetoId: 'materiais-servicos', spe: 'SPE-2', ciclo: 'ciclo-1', recebidoEm: '2026-01-08',
    layoutEsperado: 'LAY-MAT-v2', divergenciasLayout: [], registrosDeclarados: 3,
    recibo: { numero: 'REC-2026-0006', emitidoEm: '2026-01-08', emitidoPara: VENDOR, aceito: true, observacao: null } },
  { id: 'ARQ-007', nomeArquivo: 'NASAJON_MATERIAIS_SPE3_20260109.XLSX', formato: 'XLSX',
    objetoId: 'materiais-servicos', spe: 'SPE-3', ciclo: 'ciclo-1', recebidoEm: '2026-01-09',
    layoutEsperado: 'LAY-MAT-v2',
    divergenciasLayout: [{ campo: 'NCM', problema: 'Coluna presente, mas entregue sem máscara em parte das linhas.' }],
    registrosDeclarados: 4,
    recibo: { numero: 'REC-2026-0007', emitidoEm: '2026-01-09', emitidoPara: VENDOR, aceito: true,
      observacao: 'Divergência de máscara tratada na transformação. Não bloqueia.' } },
  { id: 'ARQ-008', nomeArquivo: 'NASAJON_CONTRATOS_SPE1_20260112.XML', formato: 'XML',
    objetoId: 'contratos', spe: 'SPE-1', ciclo: 'ciclo-1', recebidoEm: '2026-01-12',
    layoutEsperado: 'LAY-CTR-v1', divergenciasLayout: [], registrosDeclarados: 4,
    recibo: { numero: 'REC-2026-0008', emitidoEm: '2026-01-12', emitidoPara: VENDOR, aceito: true, observacao: null } },
  { id: 'ARQ-009', nomeArquivo: 'NASAJON_CONTRATOS_SPE2_20260112.XML', formato: 'XML',
    objetoId: 'contratos', spe: 'SPE-2', ciclo: 'ciclo-1', recebidoEm: '2026-01-12',
    layoutEsperado: 'LAY-CTR-v1',
    divergenciasLayout: [{ campo: 'UNIDADE_MEDIDA', problema: 'Domínio livre: metro linear vem como "MT" e não como "M".' }],
    registrosDeclarados: 3,
    recibo: { numero: 'REC-2026-0009', emitidoEm: '2026-01-12', emitidoPara: VENDOR, aceito: true,
      observacao: 'Divergência de unidade tratada por regra do playbook. Não bloqueia.' } },
]

/* ---------- as três Waves --------------------------------------------------- */
const waves = [
  { id: 'wave-1', n: 1, nome: 'Wave 1 · Fornecedores', objetos: ['fornecedores'],
    inicio: '2026-01-05', fim: '2026-02-09', estado: 'em-execucao',
    descricao: 'Cadastro de fornecedor das quatro SPEs. É a onda com mais regra por registro e a que abre os quatro checkpoints.' },
  { id: 'wave-2', n: 2, nome: 'Wave 2 · Materiais e serviços', objetos: ['materiais-servicos'],
    inicio: '2026-02-16', fim: '2026-03-20', estado: 'planejada',
    descricao: 'Product master e Service master. Depende do de-para de grupo de mercadoria aprovado na Wave 1.' },
  { id: 'wave-3', n: 3, nome: 'Wave 3 · Contratos e movimento', objetos: ['contratos', 'pedidos', 'requisicoes', 'posicoes-estoque'],
    inicio: '2026-03-23', fim: '2026-05-08', estado: 'planejada',
    descricao: 'Outline agreement e os objetos de movimento. Só abre com fornecedor e material já carregados.' },
]

/* ---------- entrega formal e simulação ------------------------------------- */
const destinatarioDaCarga = {
  parte: 'Verene · Basis', responsavel: 'Tiago Fontes',
  papel: 'Coordenador Basis — executa a carga no tenant',
}
const calendarioAcordado = [
  {
    ciclo: 'ciclo-1',
    nome: 'Janela do ciclo de teste',
    inicio: '2026-02-07',
    fim: '2026-02-09',
    observacao: 'Fim de semana, com o tenant de qualidade reservado. Reprocessamento permitido sem novo Gate.',
  },
  {
    ciclo: 'ciclo-2',
    nome: 'Janela do cutover de produção',
    inicio: '2026-03-13',
    fim: '2026-03-16',
    observacao: 'Cutover. Congelamento do Nasajon a partir de 12/03 às 18h. Reprocessamento exige novo Gate.',
  },
]
/** Tetos do Migration Cockpit. A divisão em partes é aritmética sobre eles. */
const LIMITE_ARQUIVO_MB = 100
const LIMITE_REGISTROS_POR_PARTE = 500
const simulacoesCockpit = [
  {
    objetoId: 'fornecedores',
    estado: 'aprovada',
    executadaEm: '2026-01-19',
    registrosSimulados: 340,
    mensagens: [
      'Simulação sem erro de estrutura em 340 registros.',
      'Três avisos de campo opcional vazio (INSCRICAO_MUNICIPAL). Não bloqueiam.',
    ],
  },
  {
    objetoId: 'materiais-servicos',
    estado: 'reprovada',
    executadaEm: '2026-01-21',
    registrosSimulados: 95,
    mensagens: [
      'Quatro registros sem NCM rejeitados na simulação: campo obrigatório no tenant.',
      'Pacote não liberado. Reexecutar após a fila de exceções decidir os quatro.',
    ],
  },
  {
    objetoId: 'contratos',
    estado: 'nao-executada',
    executadaEm: null,
    registrosSimulados: 0,
    mensagens: ['A onda 3 depende das ondas 1 e 2 concluídas. Simulação ainda não faz sentido.'],
  },
]
const simulacaoPorObjeto = new Map(simulacoesCockpit.map((s) => [s.objeto, s]))

/**
 * Verificação guiada nos apps Fiori. Contagem prova que o número fecha; não
 * prova que o registro está certo. É esta verificação que fecha a lacuna, e ela
 * é registrada como evidência de Gate.
 */
const verificacoesFiori = [
  {
    id: 'VF-BP', objeto: 'business-partner', app: 'Manage Business Partner Master Data',
    appId: 'F0850A', gate: 'G6', registroExemplo: 'F1001',
    passos: [
      { ordem: 1, instrucao: 'Abrir o Business Partner pelo CNPJ e conferir que existe um só cadastro para o documento.', campo: 'TAX_NUMBER_BR1' },
      { ordem: 2, instrucao: 'Conferir a razão social nas duas linhas de nome, sem palavra cortada ao meio.', campo: 'NAME_ORG1 / NAME_ORG2' },
      { ordem: 3, instrucao: 'Conferir grupo de contas e faixa de numeração externa.', campo: 'BP_GROUPING' },
      { ordem: 4, instrucao: 'Conferir domicílio fiscal contra o município do extrato.', campo: 'TAXJURCODE' },
      { ordem: 5, instrucao: 'Conferir o tipo de retenção configurado.', campo: 'WITHHOLDING_TAX_TYPE' },
    ],
  },
  {
    id: 'VF-PM', objeto: 'product-master', app: 'Manage Product Master Data',
    appId: 'F1602', gate: 'G6', registroExemplo: 'MAT-1001',
    passos: [
      { ordem: 1, instrucao: 'Abrir o material e conferir o tipo de material atribuído.', campo: 'MATERIAL_TYPE' },
      { ordem: 2, instrucao: 'Conferir a classificação fiscal e a origem da mercadoria.', campo: 'NCM_CODE' },
      { ordem: 3, instrucao: 'Conferir a unidade de medida base contra a do extrato.', campo: 'BASE_UOM' },
    ],
  },
  {
    id: 'VF-SM', objeto: 'service-master', app: 'Manage Service Master',
    appId: 'F4072', gate: 'G6', registroExemplo: 'CTR-2023-404~10',
    passos: [
      { ordem: 1, instrucao: 'Abrir o serviço e conferir o grupo de serviço derivado do centro de custo.', campo: 'SERVICE_GROUP' },
      { ordem: 2, instrucao: 'Conferir o texto breve, truncado em 40 sem cortar palavra.', campo: 'SHORT_TEXT' },
    ],
  },
  {
    id: 'VF-OA', objeto: 'outline-agreement', app: 'Manage Purchase Contracts',
    appId: 'F1600', gate: 'G6', registroExemplo: 'CTR-2023-101',
    passos: [
      { ordem: 1, instrucao: 'Abrir o contrato e conferir o fornecedor contra o Business Partner da onda 1.', campo: 'VENDOR' },
      { ordem: 2, instrucao: 'Conferir o valor previsto contra a soma das linhas.', campo: 'TARGET_VALUE' },
      { ordem: 3, instrucao: 'Conferir a unidade de medida da linha, normalizada para M.', campo: 'BASE_UOM' },
      { ordem: 4, instrucao: 'Conferir a vigência.', campo: 'VALIDITY_START / VALIDITY_END' },
    ],
  },
]

/* ========================================================================== */
/* 7. O ROTEIRO DA PRIMEIRA SALA                                              */
/* ========================================================================== */

/** O defeito que NÃO se resolve aprovando o registro: aprovar carimba o corte errado. */
const DEFEITO_QUE_SE_CORRIGE_NA_REGRA = 'DEF-TRF-02'
/** A regra que o passo 6 abre e corrige. O roteiro chega nela, não perto dela. */
const REGRA_DA_CORRECAO = 'R-SUP-023'
/** Os dois casos navegáveis de rastreabilidade. O `~` evita virar fragmento de URL. */
const CASO_FORNECEDOR = 'F1001'
const CASO_LINHA_CONTRATO = 'CTR-2023-404~10'

const NIVEIS = { nada: 0, mapeamento: 1, duplicatas: 2, excecoes: 3, corrigido: 4, carga: 5 }

const passosDoRoteiro = [
  {
    n: 1,
    id: 'mission-control',
    nome: 'O que existe e em que estado',
    path: '/mission-control',
    nivel: NIVEIS.nada,
    duracao: 55,
    fraseChave:
      'Antes de qualquer promessa: isto é o que existe hoje no Nasajon das quatro SPEs, medido, não estimado.',
    acoes: [
      'Aponte a grade de 48 pacotes — 6 objetos × 4 SPEs × 2 ciclos.',
      'Aponte o recebimento: a contagem e o fingerprint são do conteúdo, não do que o fornecedor declarou.',
      'Aponte que pedidos, requisições e estoque estão como "não iniciado".',
    ],
    notas: [
      'Os 2.080 registros do escopo são derivados, não digitados: há teste que reprova se a grade contradisser o escopo.',
      'O "não iniciado" é de propósito. Não há extrato desses três objetos, e declarar estado de dado que não existe seria inventar.',
      'Cada agente tem um revisor humano com nome. Nenhum agente é accountable.',
    ],
  },
  {
    n: 2,
    id: 'mapping',
    nome: 'O de-para é contra o tenant vivo',
    path: '/mapping',
    nivel: NIVEIS.nada,
    duracao: 55,
    fraseChave:
      'O de-para não é contra o SAP padrão. É contra a configuração que está ligada no tenant de vocês hoje.',
    acoes: [
      'Aponte a coluna Value domain (live tenant).',
      'Abra uma divergência marcada como "Tenant Verene, não padrão SAP".',
      'Aponte o aviso: nenhuma transformação roda sobre mapeamento não aprovado.',
    ],
    notas: [
      'Mapear contra o padrão em vez do tenant é o erro que só aparece na carga, quando já custa caro.',
      'O checkpoint exige duas assinaturas distintas: o SAP SME aprova tecnicamente, o data owner assina no Gate 1.',
      'O aviso não é decorativo — é o motor. Sem as duas, a esteira para no passo 3.',
    ],
  },
  {
    n: 3,
    id: 'record',
    nome: 'Rastreabilidade em nível de campo',
    path: `/record/${CASO_FORNECEDOR}`,
    nivel: NIVEIS.mapeamento,
    duracao: 55,
    fraseChave:
      'Para qualquer registro, em qualquer momento: de onde veio o valor, que regra o mudou, em que versão do playbook.',
    acoes: [
      'Percorra a trilha campo a campo: valor de origem, regra aplicada, valor final.',
      'Clique num id de regra e mostre que ele abre a regra no playbook.',
      'Aponte onde a esteira PARA: o próximo checkpoint é a fila de duplicatas.',
    ],
    notas: [
      'A trilha carrega o id da regra E a versão. Sem a versão, "foi transformado pela regra X" não diz qual redação da regra X.',
      'A linha de contrato roda pela mesma esteira, com o mesmo guarda. É o objeto de maior densidade de regra do escopo.',
      'A esteira parada aqui é o argumento do próximo passo, não um defeito da tela.',
    ],
  },
  {
    n: 4,
    id: 'duplicates',
    nome: 'O merge nunca é automático',
    path: '/review/duplicates',
    nivel: NIVEIS.mapeamento,
    duracao: 50,
    fraseChave:
      'A máquina propõe o match e mostra o porquê, sinal a sinal. Quem funde dois cadastros é uma pessoa.',
    acoes: [
      'Abra o racional de um cluster: cada sinal com o peso que ele vale.',
      'Confirme um cluster na tela, para o cliente ver a decisão sendo tomada.',
      'Aponte a seção dos já cadastrados no tenant: reusar, não recriar.',
    ],
    notas: [
      'O score é a soma dos pesos que conferem, não um número solto.',
      'O código aposentado mantém cross-reference visível depois do merge.',
      'Os dois já existentes saem do cruzamento por documento, não do resultado da esteira — senão sumiriam justo enquanto o checkpoint segura.',
    ],
  },
  {
    n: 5,
    id: 'exceptions',
    nome: 'Nada é defaultado para o lote passar',
    path: '/review/exceptions',
    nivel: NIVEIS.duplicatas,
    duracao: 50,
    fraseChave:
      'Não existe "aplicar valor padrão" nesta tela. Preencher por padrão é o que produz base suja com aparência de limpa.',
    acoes: [
      'Mostre uma exceção técnica e uma de negócio, com dono nomeado e prazo.',
      'Mostre o enriquecimento com a evidência anexada — a tabela do IBGE, o item da LC 116.',
      'Mostre o CNAE: sem fonte que sustente, não há proposta, e a tela diz por quê.',
    ],
    notas: [
      'As opções são liberar com decisão registrada ou manter retido. Só isso.',
      'Exceção técnica vai para o SAP SME; exceção de negócio, para o data owner.',
      'O caso do CNAE é o que prova a regra: onde não há evidência, o agente não propõe.',
    ],
  },
  {
    n: 6,
    id: 'velocidade',
    nome: 'Momento 1 — defeito achado e ressubmetido no mesmo dia',
    path: `/playbook?regra=${REGRA_DA_CORRECAO}`,
    nivel: NIVEIS.excecoes,
    duracao: 85,
    fraseChave:
      'As razões sociais mais longas quebraram no meio da palavra. O defeito não é do dado: é da nossa regra — e é por isso que ele se corrige em minutos, não em uma nova rodada de extração.',
    acoes: [
      'A R-SUP-023 já abre selecionada. Mostre a correção proposta: corte: caractere → palavra.',
      'Clique em "Corrigir e publicar v1.4.0".',
      'Deixe a propagação rodar e leia os cinco nós em voz alta.',
    ],
    notas: [
      'Quem encontrou o corte errado foi a R-SUP-048, uma validação independente da regra que quebra. Se as duas viessem do mesmo raciocínio, o defeito passaria pelas duas.',
      'A regra não foi editada no lugar: uma redação nova foi publicada numa versão nova. É o que mantém a trilha válida.',
      'O que muda entre as duas redações é um parâmetro, e o agente o lê pelo mesmo guarda que lê a regra.',
      'As assinaturas que o artefato não invalidou foram carregadas, marcadas como revalidadas. Pacote e reconciliação caem sempre: o checksum mudou.',
      'A recomputação é instantânea. A animação mostra o caminho, não a duração — o ganho está em não haver ninguém no meio dele.',
    ],
  },
  {
    n: 7,
    id: 'contencao',
    nome: 'Momento 2 — o limite honesto',
    path: '/review/candidate',
    nivel: NIVEIS.excecoes,
    duracao: 95,
    fraseChave:
      'Um agente consegue evidenciar que uma regra provavelmente existe. Ele não consegue confirmar que a regra está correta.',
    acoes: [
      'Mostre as duas duplas e o que é idêntico nos dois lados.',
      'Aponte a frequência e diga que ela é derivada do dado, não escolhida.',
      'Leia a hipótese e, principalmente, o bloco do que o modelo não consegue confirmar.',
      'Deixe a decisão em aberto ou confirme, e diga que confirmar não executa a regra.',
    ],
    notas: [
      'Esta é a única tela do protótipo que faz chamada de rede. A hipótese é gerada dos mesmos quatro registros, ao vivo.',
      'Se a chamada não completar, entra uma resposta de referência e a tela não muda de forma. Não há risco de tela em branco.',
      'A regra candidata não executa: KANON recusa regra não promovida. Promover é ato de governança, numa versão nova.',
      'São 4 pessoas físicas no extrato, todas nas duas duplas. Se perguntarem "100% de quantos?", a resposta é dois pares.',
      'Este é o momento que mais compra confiança. Não corra.',
    ],
  },
  {
    n: 8,
    id: 'reconciliacao',
    nome: 'De quem é cada defeito',
    path: '/reconciliation',
    nivel: NIVEIS.corrigido,
    duracao: 65,
    fraseChave:
      'Origem e destino fecham, e toda diferença tem causa nomeada. E os defeitos estão separados por dono contratual.',
    acoes: [
      'Mostre a reconciliação por contagem e por valor, com a explicação de cada diferença.',
      'Vá ao registro de defeitos e leia a linha de responsabilidade Monoda.',
      'Aponte que os critérios de defeito medem apenas a origem transformation.',
    ],
    notas: [
      'Depois da correção do passo 6, a origem transformation está zerada. Antes dela, não estava.',
      'Valor só aparece onde há montante: contratos. Fornecedor é cadastro — inventar um valor para preencher a tela seria número que não sobrevive a uma pergunta.',
      'As outras três origens não somem: elas têm dono, e o dono está nomeado na tela.',
      'Há teste que reprova uma diferença sem explicação.',
    ],
  },
  {
    n: 9,
    id: 'gate',
    nome: 'A assinatura que libera',
    path: '/gates',
    nivel: NIVEIS.carga,
    duracao: 40,
    fraseChave:
      'Cada Gate aprova um artefato nomeado, e o Gate seguinte não abre enquanto ele não estiver assinado. Não abre com ressalva.',
    acoes: [
      'Abra o G6 e mostre a evidência entregue e o aprovador nomeado.',
      'Assine o G6 na tela.',
      'Aponte a trilha: quem, quando, e sobre qual versão de playbook.',
    ],
    notas: [
      'No estado inicial, seis dos oito Gates aparecem com entrada recusada. A recusa nomeia o artefato que falta.',
      'Assinar fora de ordem não contorna: o motor só considera assinado o artefato de um Gate cuja entrada foi admitida.',
      'A coluna da versão é o que sustenta o argumento de governança. Sem ela, "revisado e assinado" é slogan.',
      'Se o painel comercial for pedido, ele existe atrás de flag — não abra sem ser perguntado.',
    ],
  },
]
const TOTAL_DE_PASSOS = passosDoRoteiro.length
const DURACAO_DO_ROTEIRO = passosDoRoteiro.reduce((acc, p) => acc + p.duracao, 0)
const decorridoAte = (n) => passosDoRoteiro.filter((p) => p.n < n).reduce((acc, p) => acc + p.duracao, 0)
const passoPorNumero = (n) => passosDoRoteiro.find((p) => p.n === n) ?? passosDoRoteiro[0]

/* ========================================================================== */
/* 8. A REGRA CANDIDATA E A RESPOSTA DE REFERÊNCIA                            */
/* ========================================================================== */

const REGRA_CANDIDATA = 'R-SUP-033'
const TIPO_DE_DEFEITO = 'DEF-TGT-04'
/** A ÚNICA chamada de rede do protótipo. */
const ENDPOINT_HIPOTESE = 'https://api.anthropic.com/v1/messages'
const MODELO = 'claude-sonnet-4-6'
const TIMEOUT_HIPOTESE_MS = 8000

/**
 * Resposta de referência. Escrita à mão, no mesmo formato que a chamada ao vivo
 * devolve, a partir dos mesmos quatro registros. O fallback não é conforto: é
 * requisito — a tela de contenção é a que mais sustenta a confiança na
 * demonstração e nunca pode aparecer vazia porque a rede caiu.
 */
const hipoteseDeReferencia = {
  enunciado:
    'Os quatro cadastros sugerem que a retenção do mesmo prestador pessoa física está sendo decidida por SPE, e não pelo prestador: a SPE-1 e a SPE-2 retêm mais do que a SPE-3 e a SPE-4 sobre exatamente os mesmos CPF, atividade e condição de pagamento. A hipótese é que exista uma prática de retenção por empresa adquirida que nunca foi escrita.',
  evidencia: [
    'F1009 (SPE-1) e F3007 (SPE-3) têm o mesmo CPF 128.459.376-28, o mesmo CNAE 7119-7/01 e a mesma condição 15 DD; a SPE-1 retém INSS e a SPE-3 não.',
    'F2008 (SPE-2) e F4007 (SPE-4) têm o mesmo CPF 247.093.615-25 e o mesmo CNAE 4321-5/00; o ISS é retido a 5% na SPE-2 e a 2% na SPE-4.',
    'Nos dois pares a divergência acompanha a SPE, não o prestador: as SPEs de origem mais antiga retêm mais.',
    'Nenhum dos quatro cadastros registra município de prestação diferente, o que descartaria a hipótese mais óbvia de alíquota municipal distinta.',
  ],
  naoConfirmavel:
    'Não é possível determinar, a partir do dado, qual dos dois tratamentos é o correto. As duas leituras cabem: pode ser prática divergente de uma das adquiridas, a ser uniformizada, ou pode ser tratamento legítimo por município de prestação que o extrato não carrega. A escolha é fiscal e tem efeito retroativo — precisa vir da Verene.',
  origem: 'referencia',
}

/* ---------- quadro dos 48 pacotes de carga ---------------------------------- */
/**
 * O estado de cada pacote é DECLARADO, não calculado: só fornecedores,
 * materiais e contratos têm extrato. Declarar o quadro inteiro e marcar o que
 * não começou é honesto; derivar estado de dado que não existe não seria.
 *
 * Os volumes por SPE somam exatamente o volume de referência do objeto no
 * escopo — o quadro não pode contradizer o escopo declarado.
 */
const packageStates = ['nao-iniciado', 'em-processamento', 'retido', 'aguardando-gate', 'aprovado']
const rotuloEstadoPacote = {
  'nao-iniciado': 'não iniciado', 'em-processamento': 'em processamento', retido: 'retido',
  'aguardando-gate': 'aguardando Gate', aprovado: 'aprovado',
}
const VOLUME_POR_SPE = {
  fornecedores: [340, 300, 250, 230],
  'materiais-servicos': [95, 85, 75, 65],
  contratos: [62, 54, 46, 38],
  pedidos: [58, 52, 48, 42],
  requisicoes: [36, 32, 28, 24],
  'posicoes-estoque': [34, 32, 28, 26],
}
const ESTADOS_PACOTE = {
  fornecedores: {
    'ciclo-1': ['aprovado', 'aguardando-gate', 'retido', 'em-processamento'],
    'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
  },
  'materiais-servicos': {
    'ciclo-1': ['aguardando-gate', 'em-processamento', 'em-processamento', 'nao-iniciado'],
    'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
  },
  contratos: {
    'ciclo-1': ['em-processamento', 'retido', 'nao-iniciado', 'nao-iniciado'],
    'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'],
  },
  pedidos: { 'ciclo-1': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'], 'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'] },
  requisicoes: { 'ciclo-1': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'], 'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'] },
  'posicoes-estoque': { 'ciclo-1': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'], 'ciclo-2': ['nao-iniciado', 'nao-iniciado', 'nao-iniciado', 'nao-iniciado'] },
}
const loadPackageBoard = scopeObjects.flatMap((objeto) =>
  speIds.flatMap((spe, indiceSpe) =>
    cycles.map((ciclo) => ({
      id: `${objeto.id}/${spe}/${ciclo}`,
      objetoId: objeto.id, spe, ciclo,
      estado: ESTADOS_PACOTE[objeto.id]?.[ciclo][indiceSpe] ?? 'nao-iniciado',
      registros: VOLUME_POR_SPE[objeto.id]?.[indiceSpe] ?? 0,
    })),
  ),
)
const contarPorEstado = (pacotes) =>
  Object.fromEntries(packageStates.map((estado) => [estado, pacotes.filter((p) => p.estado === estado).length]))


/* ========================================================================== */
/* 8b. A CAMADA NARRADA — quinze cenas em cinco atos                          */
/* ========================================================================== */

/**
 * O modo de apresentação conduz QUEM APRESENTA. Esta camada conduz QUEM
 * ASSISTE, sem intermediário: numa apresentação o espectador não sabe o que
 * procurar e se perde, e um protótipo que funciona como produto não se explica
 * sozinho.
 *
 * REGRA DE ESCRITA DOS BULLETS. Frase curta. Nada de jargão de SAP sem
 * explicação junto, nada de palavra inventada. "Lê os arquivos que chegaram e
 * mede o estado de cada campo" — não "executa profiling multidimensional".
 *
 * A camada não reconstrói nada: navega pelas rotas que já existem, lê o roteiro
 * e ilumina um elemento pelo atributo `data-cena` que as telas carregam.
 */
const atos = ['abertura', 'agentes', 'esteira', 'momentos', 'fechamento']
const rotuloDoAto = {
  abertura: 'O problema',
  agentes: 'Os agentes',
  esteira: 'A esteira',
  momentos: 'Os dois momentos',
  fechamento: 'O aceite',
}

const cenas = [

  // ============================================================ ABERTURA
  {
    n: 1,
    id: 'problema',
    ato: 'abertura',
    titulo: 'Quatro empresas, quatro cadastros, um sistema só',
    bullets: [
      'A Verene comprou quatro empresas. Cada uma tem o próprio sistema antigo e o próprio jeito de cadastrar fornecedor, material e contrato.',
      'Tudo isso precisa entrar no sistema novo da Verene — e duas vezes: uma de ensaio, outra pra valer, na virada.',
      'São 2.080 registros em 48 pacotes de carga. Registro errado não dá erro na hora: aparece meses depois, no fechamento fiscal.',
    ],
    path: '/mission-control',
    destaque: '[data-cena="grade-pacotes"]',
    notaDoApresentador:
      'A grade é derivada do escopo, não digitada: seis objetos × quatro empresas × dois ciclos. Se perguntarem por que pedidos, requisições e estoque estão como "não iniciado": não há extrato desses três ainda, e declarar estado de dado que não existe seria inventar.',
    nivel: NIVEIS.nada,
    duracao: 34,
  },
  {
    n: 2,
    id: 'cadeia',
    ato: 'abertura',
    titulo: 'Três partes, e onde a Monoda está',
    bullets: [
      'Quem produziu o dado é a Verene, nos sistemas das empresas compradas. Dado que chega errado de lá continua sendo dela.',
      'Quem recebe o dado é o sistema novo, configurado pela Verene junto com o integrador. O que ele exige fora do padrão é decisão dela.',
      'A Monoda fica no meio e responde pela travessia: a regra que move o dado de um lado para o outro. Nos outros três casos ela detecta, evidencia e encaminha — não responde pelo defeito.',
    ],
    path: '/reconciliation',
    destaque: '[data-cena="defeitos-por-origem"]',
    notaDoApresentador:
      'Esta é a conversa que consome projeto de migração: não "tem defeito?", mas "de quem é este defeito?". A taxonomia é acordada antes, e por isso a tela separa visualmente o que é da Monoda do que é de terceiros.',
    nivel: NIVEIS.duplicatas,
    duracao: 36,
  },
  {
    n: 3,
    id: 'kepler',
    ato: 'abertura',
    titulo: 'O que é a KEPLER',
    bullets: [
      'A regra de negócio vive num lugar só, versionada, e os agentes a executam — nenhum agente decide por conta própria.',
      'Toda decisão que a máquina não pode tomar sozinha para numa fila, com uma pessoa de nome e sobrenome do lado.',
      'No fim, cada campo de cada registro tem a trilha inteira: de onde veio o valor, que regra o mudou, em que versão da regra.',
    ],
    path: `/record/${CASO_FORNECEDOR}`,
    destaque: '[data-cena="trilha"]',
    notaDoApresentador:
      'Uma frase só, se precisar resumir: a KEPLER é a esteira que leva o dado do sistema antigo ao novo com a regra escrita fora do código e a decisão humana onde ela é obrigatória.',
    nivel: NIVEIS.excecoes,
    duracao: 32,
  },

  // ============================================================ AGENTES
  {
    n: 4,
    id: 'vega',
    ato: 'agentes',
    agente: 'VEGA',
    titulo: 'VEGA recebe e mede',
    cartao: {
      especialidade: 'Recepção e perfilagem',
      oQueFaz: 'Lê os arquivos que chegaram e mede o estado de cada campo.',
      recebe: 'Os arquivos de extração das quatro empresas.',
      entrega: 'O recibo do que chegou de fato e o mapa do que está errado.',
    },
    bullets: [
      'Conta os registros do arquivo e compara com o número que o fornecedor da extração declarou. Quando não bate, o recibo sai com ressalva.',
      'Mede campo a campo: quantos vieram em branco, quantos vieram num formato diferente do resto, quantos têm número que não fecha.',
      'Não corrige nada. Só registra o que existe — corrigir calado aqui seria assumir a autoria do número.',
    ],
    path: '/mission-control',
    destaque: '[data-cena="recebimento"]',
    notaDoApresentador:
      'A contagem e a impressão digital do arquivo são calculadas do conteúdo, não repetidas do que o vendor disse. É isso que faz o recibo valer alguma coisa.',
    nivel: NIVEIS.nada,
    duracao: 34,
  },
  {
    n: 5,
    id: 'lyra',
    ato: 'agentes',
    agente: 'LYRA',
    titulo: 'LYRA lê o sistema de destino',
    cartao: {
      especialidade: 'Mapeamento contra o tenant',
      oQueFaz: 'Monta o de-para campo a campo contra a configuração que está ligada hoje no sistema novo.',
      recebe: 'Os campos do sistema antigo e a configuração ativa do sistema novo.',
      entrega: 'O dicionário de mapeamento e a lista de onde a Verene fez diferente do padrão.',
    },
    bullets: [
      'Não mapeia contra o SAP de fábrica: mapeia contra o que está ativo no sistema da Verene hoje.',
      'Onde a Verene configurou algo fora do padrão, a divergência aparece nomeada. É aí que a carga costuma quebrar — e sempre tarde.',
      'Nenhuma conversão roda antes de o de-para ser aprovado por duas pessoas.',
    ],
    path: '/mapping',
    destaque: '[data-cena="dicionario"]',
    notaDoApresentador:
      'A coluna do domínio de valor é lida da configuração viva. Não existe tabela paralela mantida à mão — há teste garantindo que toda regra, todo domínio e toda divergência citados existem de fato.',
    nivel: NIVEIS.nada,
    duracao: 34,
  },
  {
    n: 6,
    id: 'atlas',
    ato: 'agentes',
    agente: 'ATLAS',
    titulo: 'ATLAS converte e agrupa',
    cartao: {
      especialidade: 'Transformação e deduplicação',
      oQueFaz: 'Converte cada valor para o formato do destino e agrupa os cadastros que são a mesma empresa.',
      recebe: 'Os registros mapeados e as regras de conversão publicadas.',
      entrega: 'Os valores convertidos e os grupos de duplicata, com o racional de cada um.',
    },
    bullets: [
      'Acha o mesmo fornecedor cadastrado em mais de uma das empresas compradas, com a razão social escrita de jeitos diferentes.',
      'Propõe qual dos cadastros sobrevive e mostra os sinais que sustentam a proposta, um a um, com o peso de cada um.',
      'Não funde nada sozinho. Quem junta dois cadastros é uma pessoa, e o código aposentado continua visível depois.',
    ],
    path: '/review/duplicates',
    destaque: '[data-cena="clusters"]',
    notaDoApresentador:
      'O número que aparece como score é a soma dos pesos dos sinais que conferem — não um número solto de um modelo. Abrir um cluster mostra os sinais somando.',
    nivel: NIVEIS.mapeamento,
    duracao: 36,
  },
  {
    n: 7,
    id: 'nova',
    ato: 'agentes',
    agente: 'NOVA',
    titulo: 'NOVA preenche o que tem como preencher',
    cartao: {
      especialidade: 'Enriquecimento e validação',
      oQueFaz: 'Completa o que dá para completar com fonte de referência e valida o resto contra as regras do negócio.',
      recebe: 'Os registros convertidos e as tabelas de referência.',
      entrega: 'Os valores propostos com a fonte anexada, e a fila de exceções com dono e prazo.',
    },
    bullets: [
      'Quando falta o código do município, busca na tabela do IBGE e anexa a linha que sustenta o valor.',
      'Onde não há fonte que sustente o valor, não propõe nada — e escreve na tela por quê. É o caso do CNAE.',
      'O que não passa na validação fica retido, com o motivo e a pessoa a quem foi encaminhado.',
    ],
    path: '/review/exceptions',
    destaque: '[data-cena="enriquecimento"]',
    notaDoApresentador:
      'Não existe "aplicar valor padrão" em lugar nenhum desta tela, de propósito. Preencher por padrão é exatamente o que produz base suja com aparência de limpa.',
    nivel: NIVEIS.duplicatas,
    duracao: 36,
  },
  {
    n: 8,
    id: 'orion',
    ato: 'agentes',
    agente: 'ORION',
    titulo: 'ORION monta o pacote',
    cartao: {
      especialidade: 'Empacotamento',
      oQueFaz: 'Gera o arquivo de carga a partir dos registros aprovados, e só deles.',
      recebe: 'Os registros com decisão humana registrada.',
      entrega: 'O arquivo, a divisão em partes e o cabeçalho que identifica o conteúdo.',
    },
    bullets: [
      'Carimba no cabeçalho a versão da regra e uma impressão digital do conteúdo. É isso que prova, depois da carga, qual regra gerou qual registro.',
      'Divide o pacote pelos dois limites da ferramenta de carga: tamanho do arquivo e número de registros por lote.',
      'Confere tamanho de campo, formato e obrigatoriedade antes de entregar. Liberar uma exceção não lava o dado.',
    ],
    path: '/packages',
    destaque: '[data-cena="manifest"]',
    notaDoApresentador:
      'O arquivo é gerado dos registros de fato, não é texto de exemplo. O tamanho por registro é medido nele, e a divisão em partes é aritmética sobre esse número.',
    nivel: NIVEIS.excecoes,
    duracao: 34,
  },
  {
    n: 9,
    id: 'sirius',
    ato: 'agentes',
    agente: 'SIRIUS',
    titulo: 'SIRIUS fecha a conta',
    cartao: {
      especialidade: 'Reconciliação',
      oQueFaz: 'Confere que o que entrou é igual ao que saiu, mais o que ficou retido.',
      recebe: 'A contagem da origem e o resultado do destino.',
      entrega: 'A reconciliação com toda diferença explicada e o registro de defeitos por origem.',
    },
    bullets: [
      'Reconcilia por contagem e, onde há dinheiro envolvido, também por valor.',
      'Toda diferença vem com a causa nomeada. Diferença sem explicação é registro perdido que ninguém procurou.',
      'Separa os defeitos por origem, para a conversa de responsabilidade não virar negociação no fim do projeto.',
    ],
    path: '/reconciliation',
    destaque: '[data-cena="contagem"]',
    notaDoApresentador:
      'Valor só aparece onde há montante: contratos. Fornecedor é cadastro e não tem valor — inventar um para preencher a tela seria número que não sobrevive a uma pergunta.',
    nivel: NIVEIS.excecoes,
    duracao: 34,
  },
  {
    n: 10,
    id: 'kanon',
    ato: 'agentes',
    agente: 'KANON',
    titulo: 'KANON guarda a regra',
    cartao: {
      especialidade: 'Governança do playbook',
      oQueFaz: 'Publica e sela a versão das regras, e é o único caminho por onde um agente chega a uma regra.',
      recebe: 'As regras escritas, com dono e justificativa.',
      entrega: 'A versão selada, a documentação gerada dela e a recusa de tudo que não estiver publicado.',
    },
    bullets: [
      'Não ocupa passo nenhum da esteira. Cuida da regra, o tempo todo.',
      'Recusa três coisas: regra que não está publicada naquela versão, regra ainda não aprovada por um humano, e regra de um agente pedida por outro.',
      'Corrigir uma regra não é editar código: é publicar uma redação nova numa versão nova, e a trilha antiga continua válida.',
    ],
    path: '/playbook',
    destaque: '[data-cena="selo"]',
    notaDoApresentador:
      'É por construção, não por disciplina: a esteira inteira só altera registro através de um único ponto, e esse ponto passa por aqui. Sem isso, "os agentes seguem o playbook" seria promessa.',
    nivel: NIVEIS.nada,
    duracao: 36,
  },

  // ============================================================ ESTEIRA
  {
    n: 11,
    id: 'esteira',
    ato: 'esteira',
    titulo: 'Um registro atravessando os nove passos',
    bullets: [
      'Este fornecedor chegou, foi medido, mapeado, convertido, comparado com os outros, completado, validado, empacotado e conferido.',
      'Cada linha da trilha diz qual regra tocou o campo, em que versão e em que instante. O identificador da regra abre a regra.',
      'É isso que permite responder, seis meses depois da carga: por que este campo está com este valor?',
    ],
    path: `/record/${CASO_FORNECEDOR}`,
    destaque: '[data-cena="trilha"]',
    notaDoApresentador:
      'A linha de contrato roda pela mesma esteira, com o mesmo guarda — é o objeto com mais regra por registro do escopo. Se a esteira atende esse, atende os fáceis.',
    nivel: NIVEIS.excecoes,
    duracao: 34,
  },
  {
    n: 12,
    id: 'checkpoints',
    ato: 'esteira',
    titulo: 'Quatro vezes em que a máquina para e espera',
    bullets: [
      'Depois do mapeamento: duas assinaturas distintas, a aprovação técnica e a do dono do dado. Uma não substitui a outra.',
      'Depois da deduplicação: cada grupo de duplicata é confirmado um a um. Não existe aprovação em lote.',
      'Depois da validação: cada exceção recebe decisão humana. E, no fim, o pacote e a conta final.',
    ],
    path: '/gates',
    destaque: '[data-cena="gates-rail"]',
    notaDoApresentador:
      'Não é atrito de interface: sem a assinatura o passo seguinte nem roda, e a tela mostra a esteira parada. É o mesmo motor que move o resto.',
    nivel: NIVEIS.excecoes,
    duracao: 34,
  },

  // ============================================================ MOMENTOS
  {
    n: 13,
    id: 'velocidade',
    ato: 'momentos',
    titulo: 'Defeito achado na sexta, reenviado na sexta',
    bullets: [
      'A regra que encurta o nome longo do fornecedor estava cortando no meio da palavra.',
      'O defeito não é do dado: é da regra. Aprovar o registro assim só carimbaria o corte errado.',
      'Corrige-se a regra, publica-se uma versão nova, e a onda inteira é refeita — em minutos, não numa nova rodada de extração.',
    ],
    path: `${'/playbook'}?regra=${REGRA_DA_CORRECAO}`,
    destaque: '[data-cena="correcao"]',
    notaDoApresentador:
      'Quem encontrou o corte errado foi outra regra, de outro agente, independente da que quebra. Se as duas viessem do mesmo raciocínio, o defeito passaria pelas duas.',
    nivel: NIVEIS.excecoes,
    duracao: 38,
  },
  {
    n: 14,
    id: 'contencao',
    ato: 'momentos',
    titulo: 'O limite honesto da tecnologia',
    bullets: [
      'Duas pessoas prestam serviço para mais de uma das empresas compradas, com o mesmo documento — e o imposto retido é diferente em cada uma.',
      'O agente mostra os registros, a frequência e a hipótese do que explicaria isso. E para.',
      'Um agente consegue evidenciar que uma regra provavelmente existe. Ele não consegue confirmar que a regra está correta.',
    ],
    path: '/review/candidate',
    destaque: '[data-cena="evidencia-candidata"]',
    notaDoApresentador: `Confirmar não executa a regra: ${REGRA_CANDIDATA} continua sendo proposta, e promover é ato de governança numa versão nova. Este é o momento que mais compra confiança — não corra.`,
    nivel: NIVEIS.excecoes,
    duracao: 38,
  },

  // ============================================================ FECHAMENTO
  {
    n: 15,
    id: 'aceite',
    ato: 'fechamento',
    titulo: 'O que foi combinado, medido',
    bullets: [
      'Quatro critérios de aceite, cada um medido num ponto definido do projeto, com a frase de como o número foi obtido ao lado.',
      'Oito pontos de decisão. Cada um aprova um documento nomeado, e o seguinte não abre enquanto o anterior não estiver assinado.',
      'Cada assinatura registra quem, quando e sobre qual versão de regra. Sem a versão, "revisado e aprovado" não diz o que foi revisado.',
    ],
    path: '/reconciliation',
    destaque: '[data-cena="placar"]',
    notaDoApresentador:
      'Os dois critérios de defeito medem apenas a origem pela qual a Monoda responde. Defeito das outras três origens tem dono nomeado e conta na conversa com esse dono, não aqui.',
    nivel: NIVEIS.carga,
    duracao: 34,
  },
]

const TOTAL_DE_CENAS = cenas.length
const cenaPorNumero = (n) => cenas.find((c) => c.n === n) ?? cenas[0]


/* ========================================================================== */
/* 9. NÚCLEO DETERMINÍSTICO                                                   */
/* ========================================================================== */

/**
 * Tempo determinístico. `Date.now()` quebraria a reprodutibilidade: a mesma
 * execução renderizaria instantes diferentes a cada carregamento. Todo instante
 * exibido na UI é derivado deste epoch fixo.
 */
const SIM_EPOCH_MS = Date.UTC(2026, 0, 12, 9, 0, 0)
const simInstant = (offsetMs = 0) => new Date(SIM_EPOCH_MS + offsetMs)
const MINUTE_MS = 60000

/**
 * Aleatoriedade determinística. `Math.random` não existe em runtime: toda
 * variação aparente sai daqui, derivada de uma seed estável. Mesma seed, mesma
 * sequência, sempre.
 */
function hashSeed(input) {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}
const hex8 = (n) => n.toString(16).padStart(8, '0')

/* ---------- documentos fiscais brasileiros --------------------------------- */
const onlyDigits = (v) => v.replace(/\D/g, '')
const allSameDigit = (d) => /^(\d)\1*$/.test(d)

function checkDigit(digits, weights) {
  const sum = digits.reduce((acc, d, i) => acc + d * (weights[i] ?? 0), 0)
  const rest = sum % 11
  return rest < 2 ? 0 : 11 - rest
}
const CNPJ_W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const CNPJ_W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

function isValidCnpj(value) {
  const d = onlyDigits(value)
  if (d.length !== 14 || allSameDigit(d)) return false
  const base = [...d.slice(0, 12)].map(Number)
  const first = checkDigit(base, CNPJ_W1)
  const second = checkDigit([...base, first], CNPJ_W2)
  return `${first}${second}` === d.slice(12)
}
function isValidCpf(value) {
  const d = onlyDigits(value)
  if (d.length !== 11 || allSameDigit(d)) return false
  const base = [...d.slice(0, 9)].map(Number)
  const calc = (src, start) => {
    const sum = src.reduce((acc, dig, i) => acc + dig * (start - i), 0)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  const first = calc(base, 10)
  const second = calc([...base, first], 11)
  return `${first}${second}` === d.slice(9)
}
function formatCnpj(v) {
  const d = onlyDigits(v)
  if (d.length !== 14) return v
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}
function formatCpf(v) {
  const d = onlyDigits(v)
  if (d.length !== 11) return v
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}
const formatDoc = (v) => (onlyDigits(v).length === 11 ? formatCpf(v) : formatCnpj(v))

/* ========================================================================== */
/* 10. KANON — governança do playbook                                         */
/* ========================================================================== */

/**
 * KANON não ocupa passo da esteira. Ele sela a versão do playbook com checksum,
 * gera a documentação a partir das regras e é o ÚNICO caminho pelo qual um
 * agente chega a uma regra.
 *
 * `resolveRule` recusa: regra que não existe na versão pedida, regra candidata
 * (generativa não promovida por um humano) e regra cujo agente não é o agente do
 * passo que está executando. Como a esteira inteira só muta registro através de
 * `apply`, e `apply` passa por aqui, um agente não consegue — por construção,
 * não por disciplina — aplicar regra que não esteja publicada para ele.
 */
class PlaybookViolation extends Error {
  constructor(message) {
    super(message)
    this.name = 'PlaybookViolation'
  }
}

const canonicalDaRegraSelo = (r) =>
  [r.id, r.agent, r.object, r.field, r.type, r.expression, r.status, r.nature,
    // O parâmetro entra no checksum: duas redações que só diferem no parâmetro
    // produzem saídas diferentes, então não podem selar igual.
    JSON.stringify(r.parametros ?? {})].join('')

const seloCache = new Map()

/**
 * Vigência, não igualdade: a regra vale da versão em que entrou até a versão em
 * que foi substituída (exclusive). É o que permite uma regra ter mais de uma
 * redação sem duplicar o playbook a cada publicação — e é o que faz "corrigir
 * uma regra" ser operação de versão, não edição no lugar.
 */
function vigenteEm(rule, ordem) {
  const entrou = ordemDaVersao(rule.introducedIn)
  if (entrou < 0 || entrou > ordem) return false
  if (rule.vigenteAte === undefined) return true
  const saiu = ordemDaVersao(rule.vigenteAte)
  return saiu < 0 ? true : ordem < saiu
}

/** Publica e sela uma versão do playbook. Selada, é imutável. */
function sealPlaybook(version = PLAYBOOK_VERSION) {
  const cached = seloCache.get(version)
  if (cached) return cached
  const ordem = ordemDaVersao(version)
  if (ordem < 0) throw new PlaybookViolation(`Versão ${version} não está declarada no histórico do playbook.`)
  const rules = playbookRules.filter((r) => vigenteEm(r, ordem)).slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  if (rules.length === 0) throw new PlaybookViolation(`Nenhuma regra vigente na versão ${version} do playbook.`)
  const sealed = {
    version, rules,
    checksum: hex8(hashSeed(rules.map(canonicalDaRegraSelo).join(''))),
    totalRegras: rules.length,
    regrasAtivas: rules.filter((r) => r.status === 'active').length,
    regrasCandidatas: rules.filter((r) => r.status === 'candidate').length,
  }
  seloCache.set(version, sealed)
  return sealed
}

/** O guarda. Resolve UMA regra para UM agente numa versão, e recusa o resto. */
function resolveRule(ruleId, agent, version) {
  const sealed = sealPlaybook(version)
  const rule = sealed.rules.find((r) => r.id === ruleId)
  if (!rule) throw new PlaybookViolation(`Regra ${ruleId} não está publicada na versão ${version} do playbook.`)
  if (rule.status !== 'active') {
    throw new PlaybookViolation(
      `Regra ${ruleId} está com status "${rule.status}" e não executa. Regra generativa precisa ser promovida por um humano antes.`)
  }
  if (rule.agent !== agent) {
    throw new PlaybookViolation(
      `Regra ${ruleId} pertence a ${rule.agent} e foi invocada por ${agent}. Agente não executa regra de outro agente.`)
  }
  return rule
}

/**
 * Parâmetro de uma regra, lido pelo MESMO caminho que a regra. Um agente não
 * alcança um parâmetro sem passar pelo guarda — se pudesse, corrigir uma regra
 * viraria editar o código do agente, que é exatamente o que este projeto afirma
 * não fazer.
 */
function parametroDaRegra(ruleId, agent, version, nome) {
  const rule = resolveRule(ruleId, agent, version)
  const valor = rule.parametros?.[nome]
  if (valor === undefined) {
    throw new PlaybookViolation(
      `Regra ${ruleId} não declara o parâmetro "${nome}" na versão ${version}. Agente não inventa parâmetro.`)
  }
  return valor
}

const regraVigente = (id, versao) => sealPlaybook(versao).rules.find((r) => r.id === id) ?? null

/**
 * Documentação gerada A PARTIR do playbook, nunca escrita à mão. Se a regra muda
 * e a documentação não muda junto, é porque alguém escreveu documentação fora
 * daqui — que é exatamente o que este projeto não faz.
 */
function generateDocumentation(version = PLAYBOOK_VERSION) {
  const sealed = sealPlaybook(version)
  const agentes = [...new Set(sealed.rules.map((r) => r.agent))].sort()
  return agentes.map((agent) => ({
    agent,
    regras: sealed.rules.filter((r) => r.agent === agent).map((r) => ({
      id: r.id, titulo: `${rotuloObjetoRegra[r.object]} / ${r.field}`, expressao: r.expression,
      porque: r.rationale, dono: r.owner, natureza: r.nature, status: r.status,
    })),
  }))
}

/* ========================================================================== */
/* 11. A ESTEIRA DE NOVE PASSOS                                               */
/* ========================================================================== */

/**
 * Recebe (registros, versão do playbook) e devolve, POR REGISTRO, a trilha
 * completa: valor de origem, cada regra aplicada com id e versão do playbook, e
 * o valor final — ou o estado retido, com a exceção e o dono a quem foi roteada.
 *
 * DETERMINISMO. Nada aqui usa Math.random nem Date.now. Toda ordenação é total
 * (desempate por código, que é único) e o instante vem do epoch fixo. Mesma
 * entrada e mesma versão de playbook produzem saída idêntica byte a byte.
 *
 * A TESE, LITERAL. Nenhum passo escreve em registro diretamente: toda mutação
 * passa por `apply`, que resolve a regra em KANON.
 */
const pipelineSteps = [
  { n: 1, id: 'receive', nome: 'RECEIVE', agent: 'VEGA' },
  { n: 2, id: 'profile', nome: 'PROFILE', agent: 'VEGA' },
  { n: 3, id: 'map', nome: 'MAP', agent: 'LYRA' },
  { n: 4, id: 'transform', nome: 'TRANSFORM', agent: 'ATLAS' },
  { n: 5, id: 'deduplicate', nome: 'DEDUPLICATE', agent: 'ATLAS' },
  { n: 6, id: 'enrich', nome: 'ENRICH', agent: 'NOVA' },
  { n: 7, id: 'validate', nome: 'VALIDATE', agent: 'NOVA' },
  { n: 8, id: 'package', nome: 'PACKAGE', agent: 'ORION' },
  { n: 9, id: 'reconcile', nome: 'RECONCILE', agent: 'SIRIUS' },
]
const stepOf = (id) => pipelineSteps.find((s) => s.id === id)

const checkpointIds = ['mapeamento', 'duplicatas', 'excecoes', 'pacote-reconciliacao']

const emptyApprovals = {
  mapeamentoSme: null, mapeamento: null, clusters: {}, excecoes: {}, pacote: null, reconciliacao: null,
}

const EMPTY_TARGET = {
  businessPartner: null, bpGrouping: null, nameOrg1: null, nameOrg2: null,
  taxNumberBr1: null, taxNumberBr2: null, industry: null, region: null,
  taxJurCode: null, postalCode: null, city: null, paymentTerms: null,
  withholdingTaxType: [], createdOn: null,
}

const byCodigo = (a, b) => (a.codigo < b.codigo ? -1 : a.codigo > b.codigo ? 1 : 0)
const str = (v) => (v === null || v === undefined ? null : String(v))

/**
 * Única porta de mutação da esteira. Resolve a regra em KANON — que recusa regra
 * fora da versão, candidata ou de outro agente —, aplica a mudança e registra na
 * trilha com id da regra e versão do playbook.
 */
function apply(rec, step, ruleId, version, field, before, after, patch, note = null) {
  const rule = resolveRule(ruleId, step.agent, version)
  if (patch) rec.draft = { ...rec.draft, ...patch }
  const seq = rec.trail.length + 1
  rec.trail.push({
    seq,
    // Cada passo avança 15 minutos e cada aplicação dentro do passo, 3 segundos.
    at: simInstant(step.n * 15 * MINUTE_MS + seq * 3000).toISOString(),
    step: step.id, agent: rule.agent, ruleId: rule.id, playbookVersion: version,
    field, before: str(before), after: str(after), note,
  })
}

/** Abre exceção classificada pela taxonomia, com origem, severidade e dono. */
function raise(rec, defectTypeId, ruleId, version, mensagem) {
  const tipo = defectTypeById.get(defectTypeId)
  if (!tipo) throw new Error(`Tipo de defeito desconhecido: ${defectTypeId}`)
  rec.exceptions.push({
    id: `${rec.source.codigo}:${defectTypeId}`,
    recordCode: rec.source.codigo, defectTypeId: tipo.id, nome: tipo.nome,
    origin: tipo.origin, severidade: tipo.severidade, classe: tipo.classe, prazoDias: tipo.prazoDias,
    ruleId, playbookVersion: version, mensagem, roteadoPara: tipo.roteadoPara,
    monodaResponsavel: tipo.origin === 'transformation',
  })
}

/**
 * O estado final do registro é DERIVADO, nunca acumulado por mutação ao longo dos
 * passos. Acumular dava ordem-dependência: uma exceção crítica levantada depois
 * de marcar "reused" apagava o reuso, e o registro voltava como "migrated" na
 * liberação — recriando o Business Partner que a R-SUP-044 mandou reusar.
 */
function resolverOutcome(rec, approvals) {
  if (rec.mergedInto !== null) return 'merged'
  const criticas = rec.exceptions.filter((e) => e.severidade === 'critical')
  const naoLiberada = criticas.some((e) => approvals.excecoes[e.id]?.decision !== 'approved')
  if (naoLiberada) return 'held'
  return rec.reuseTarget !== null ? 'reused' : 'migrated'
}
const resolverTodos = (work, approvals) => {
  for (const rec of work) rec.outcome = resolverOutcome(rec, approvals)
}

/* ---------- de-para e quebra de nome --------------------------------------- */

const PAYMENT_TERMS = {
  'A VISTA': 'ZAVI', '15 DD': 'Z015', '28 DD': 'Z028', '30 DD': 'Z030',
  '45 DD': 'Z045', '28/56 DD': 'Z2856', '30/60 DD': 'Z3060', '30/60/90 DD': 'Z306090',
}
const SUFIXOS = /\b(LTDA|ME|EPP|SA|S\/A|EIRELI)\b\.?/g
const chaveDedup = (razaoSocial) =>
  normalizarNome(razaoSocial).replace(SUFIXOS, '').replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

/**
 * Quebra a razão social no limite do NAME_ORG1.
 *
 * O MODO vem do parâmetro da R-SUP-023, lido em KANON — não é escolha do agente.
 * `caractere` corta no limite exato e pode partir palavra ao meio; `palavra`
 * recua até o último espaço. É a diferença entre as duas redações da regra, e é
 * o que a correção da v1.4.0 muda.
 */
function splitNome(nome, limite = 40, modo = 'palavra') {
  if (nome.length <= limite) return [nome, null]
  const espaco = nome.lastIndexOf(' ', limite)
  const at = modo === 'palavra' && espaco > 0 ? espaco : limite
  return [nome.slice(0, at).trim(), nome.slice(at).trim().slice(0, limite) || null]
}

/** `true` quando a quebra partiu uma palavra ao meio. É o que a R-SUP-048 procura. */
function cortouPalavra(nome, org1) {
  if (org1.length >= nome.length) return false
  return nome[org1.length] !== ' ' && org1.at(-1) !== ' '
}

/**
 * Contraparte com o mesmo documento em outra SPE e retenção diferente.
 *
 * Derivado do dado, não da etiqueta: `_plantedDefect` marca só um lado da dupla,
 * e a R-SUP-047 diz para reter os dois. Cruzar por documento é o que faz a
 * implementação dizer o mesmo que a regra publicada.
 */
function divergenciaDeRetencao(s) {
  const doc = onlyDigits(s.cnpjCpf)
  return nasajonSuppliers
    .filter((o) => o.codigo !== s.codigo && onlyDigits(o.cnpjCpf) === doc)
    .filter((o) => o.spe !== s.spe)
    .filter((o) => JSON.stringify(o.retencoes) !== JSON.stringify(s.retencoes))
    .sort((a, b) => (a.codigo < b.codigo ? -1 : 1))[0] ?? null
}

const camposPreenchidos = (s) =>
  [s.nomeFantasia, s.inscricaoEstadual, s.inscricaoMunicipal, s.cnae, s.codigoIbge, s.complemento]
    .filter((v) => v !== null && v !== '').length

/* ---------- a esteira ------------------------------------------------------- */

function runPipeline(input) {
  const version = input.playbookVersion ?? PLAYBOOK_VERSION
  const sealed = sealPlaybook(version)
  const approvals = input.approvals ?? emptyApprovals

  const registros = input.records.slice().sort(byCodigo)
  const work = registros.map((source) => ({
    source, trail: [], exceptions: [], draft: EMPTY_TARGET, outcome: 'migrated',
    clusterId: null, mergedInto: null, reuseTarget: null, chaveNormalizada: '', nomeQuebrado: '',
  }))

  const stepResults = []
  const regrasDoPasso = new Map()
  const marcar = (id, ruleId) => {
    const set = regrasDoPasso.get(id) ?? new Set()
    set.add(ruleId)
    regrasDoPasso.set(id, set)
  }
  const fechar = (id, tocados) => {
    const spec = stepOf(id)
    stepResults.push({ ...spec, status: 'completed', registrosTocados: tocados,
      regrasAplicadas: [...(regrasDoPasso.get(id) ?? new Set())].sort() })
  }
  const naoAlcancados = (apartirDe, motivo) => {
    const from = stepOf(apartirDe).n
    for (const spec of pipelineSteps.filter((s) => s.n >= from)) {
      stepResults.push({ ...spec, status: spec.n === from ? motivo : 'not-reached',
        registrosTocados: 0, regrasAplicadas: [] })
    }
  }

  // ---------- 1 RECEIVE (VEGA) ----------
  const s1 = stepOf('receive')
  for (const rec of work) {
    apply(rec, s1, 'R-SUP-001', version, 'codigo', null, rec.source.codigo, null, 'Registro recebido do extrato.')
    marcar('receive', 'R-SUP-001')
  }
  fechar('receive', work.length)

  // ---------- 2 PROFILE (VEGA) ----------
  const s2 = stepOf('profile')
  const profile = []
  const contarPerfil = (campo, achado, quantidade, ruleId) => {
    if (quantidade > 0) profile.push({ campo, achado, quantidade, ruleId })
  }
  for (const rec of work) {
    const s = rec.source
    const digitos = onlyDigits(s.cnpjCpf)
    const regraDoc = s.naturezaPessoa === 'J' ? 'R-SUP-002' : 'R-SUP-003'
    apply(rec, s2, regraDoc, version, 'cnpjCpf', s.cnpjCpf, `${digitos.length} dígitos`, null,
      s.cnpjCpf === digitos ? 'Veio sem máscara.' : 'Veio com máscara.')
    marcar('profile', regraDoc)
    const formato = /^\d{4}-\d{2}-\d{2}$/.test(s.dataCadastro) ? 'AAAA-MM-DD' : 'DD/MM/AAAA'
    apply(rec, s2, 'R-SUP-004', version, 'dataCadastro', s.dataCadastro, formato, null, null)
    marcar('profile', 'R-SUP-004')
    apply(rec, s2, 'R-SUP-005', version, 'cep', s.cep, `${onlyDigits(s.cep).length} dígitos`, null, null)
    marcar('profile', 'R-SUP-005')
    apply(rec, s2, 'R-SUP-006', version, 'cnae', s.cnae, s.cnae === null ? 'ausente' : 'presente', null, null)
    marcar('profile', 'R-SUP-006')
    apply(rec, s2, 'R-SUP-007', version, 'codigoIbge', s.codigoIbge, s.codigoIbge === null ? 'ausente' : 'presente', null, null)
    marcar('profile', 'R-SUP-007')
  }
  // VEGA classifica todo defeito do extrato pela taxonomia, antes de qualquer correção.
  const classified = work.flatMap((rec) =>
    rec.source._plantedDefect.map((d) => {
      const tipo = defectTypeByPlantedKind.get(d.kind)
      if (!tipo) throw new Error(`Defeito "${d.kind}" sem tipo correspondente na taxonomia de origem.`)
      return {
        recordCode: rec.source.codigo, spe: rec.source.spe, kind: d.kind, defectTypeId: tipo.id,
        nome: tipo.nome, origin: tipo.origin, severidade: tipo.severidade, campo: d.field,
        nota: d.note, roteadoPara: tipo.roteadoPara, monodaResponsavel: tipo.origin === 'transformation',
      }
    }),
  ).sort((a, b) => (a.recordCode + a.defectTypeId < b.recordCode + b.defectTypeId ? -1 : 1))

  contarPerfil('cnae', 'ausente no extrato', registros.filter((s) => s.cnae === null).length, 'R-SUP-006')
  contarPerfil('codigoIbge', 'ausente no extrato', registros.filter((s) => s.codigoIbge === null).length, 'R-SUP-007')
  contarPerfil('dataCadastro', 'em AAAA-MM-DD, divergente do restante',
    registros.filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s.dataCadastro)).length, 'R-SUP-004')
  contarPerfil('cnpjCpf', 'veio com máscara',
    registros.filter((s) => s.cnpjCpf !== onlyDigits(s.cnpjCpf)).length, 'R-SUP-002')
  fechar('profile', work.length)

  // ---------- 3 MAP (LYRA) ----------
  const s3 = stepOf('map')
  for (const rec of work) {
    const s = rec.source
    const grouping = s.naturezaPessoa === 'J' ? 'ZFOR' : 'ZFPF'
    apply(rec, s3, 'R-SUP-011', version, 'bpGrouping', s.naturezaPessoa, grouping, { bpGrouping: grouping })
    marcar('map', 'R-SUP-011')
    const termo = PAYMENT_TERMS[s.condicaoPagamento] ?? null
    apply(rec, s3, 'R-SUP-010', version, 'paymentTerms', s.condicaoPagamento, termo, { paymentTerms: termo })
    marcar('map', 'R-SUP-010')
    if (termo === null) {
      raise(rec, 'DEF-TGT-03', 'R-SUP-010', version,
        `Condição de pagamento "${s.condicaoPagamento}" não tem entrada no domínio PAYMENT_TERMS do tenant.`)
    }
    apply(rec, s3, 'R-SUP-012', version, 'region', s.uf, s.uf, { region: s.uf })
    marcar('map', 'R-SUP-012')
    const ret = s.retencoes
    const codigos = [ret.irrf ? 'I1' : null, ret.inss ? 'N1' : null, ret.iss ? 'S1' : null,
      ret.pisCofinsCsll ? 'C1' : null].filter((c) => c !== null)
    apply(rec, s3, 'R-SUP-013', version, 'withholdingTaxType', null, codigos.join('+') || 'nenhuma',
      { withholdingTaxType: codigos })
    marcar('map', 'R-SUP-013')
    apply(rec, s3, 'R-SUP-014', version, 'industry', s.cnae, s.cnae, { industry: s.cnae })
    marcar('map', 'R-SUP-014')
  }
  fechar('map', work.length)

  // ===== CHECKPOINT 1 — mapeamento aprovado =====
  const pendentesMapeamento = [approvals.mapeamentoSme ? null : 'sme', approvals.mapeamento ? null : 'data-owner']
    .filter((v) => v !== null)
  const cp1 = {
    id: 'mapeamento', titulo: 'Mapeamento aprovado', apos: 'map',
    descricao: 'O de-para contra o tenant precisa da aprovação técnica do SAP SME e da assinatura do data owner da Verene no Gate 1. Nenhuma transformação roda sobre mapeamento não aprovado.',
    requeridas: 2, assinadas: 2 - pendentesMapeamento.length, pendentes: pendentesMapeamento,
    liberado: approvals.mapeamentoSme?.decision === 'approved' && approvals.mapeamento?.decision === 'approved',
  }
  if (!cp1.liberado) {
    resolverTodos(work, approvals)
    naoAlcancados('transform', 'blocked')
    return montar(work, [cp1], 'transform', null, null, [], profile, classified, sealed, version, input.spe ?? 'todas', stepResults)
  }

  // ---------- 4 TRANSFORM (ATLAS) ----------
  const s4 = stepOf('transform')
  // Os parâmetros da quebra do nome vêm da regra publicada, resolvida em KANON.
  // O agente não os escolhe, não os adivinha e não os traz do próprio código.
  const limiteNome = Number(parametroDaRegra('R-SUP-023', 'ATLAS', version, 'limite'))
  const modoDeCorte = String(parametroDaRegra('R-SUP-023', 'ATLAS', version, 'corte'))
  for (const rec of work) {
    const s = rec.source
    const digitos = onlyDigits(s.cnpjCpf)
    const isPj = s.naturezaPessoa === 'J'
    apply(rec, s4, 'R-SUP-020', version, isPj ? 'taxNumberBr1' : 'taxNumberBr2', s.cnpjCpf, digitos,
      isPj ? { taxNumberBr1: digitos } : { taxNumberBr2: digitos })
    marcar('transform', 'R-SUP-020')
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(s.dataCadastro)
      ? s.dataCadastro
      : (() => { const [d, m, a] = s.dataCadastro.split('/'); return `${a}-${m}-${d}` })()
    apply(rec, s4, 'R-SUP-021', version, 'createdOn', s.dataCadastro, iso, { createdOn: iso })
    marcar('transform', 'R-SUP-021')
    rec.chaveNormalizada = chaveDedup(s.razaoSocial)
    apply(rec, s4, 'R-SUP-022', version, 'chaveNormalizada', s.razaoSocial, rec.chaveNormalizada, null,
      'Chave de comparação; não vai para o destino.')
    marcar('transform', 'R-SUP-022')
    rec.nomeQuebrado = s.razaoSocial
    const [org1, org2] = splitNome(s.razaoSocial, limiteNome, modoDeCorte)
    apply(rec, s4, 'R-SUP-023', version, 'nameOrg1', s.razaoSocial, org1, { nameOrg1: org1, nameOrg2: org2 },
      org2 === null ? null : `Excedeu ${limiteNome} caracteres; quebrado em NAME_ORG2: "${org2}".`)
    marcar('transform', 'R-SUP-023')
    const cep = onlyDigits(s.cep)
    apply(rec, s4, 'R-SUP-024', version, 'postalCode', s.cep, cep, { postalCode: cep, city: s.municipio })
    marcar('transform', 'R-SUP-024')
  }
  fechar('transform', work.length)

  // ---------- 5 DEDUPLICATE (ATLAS) ----------
  const s5 = stepOf('deduplicate')
  const porDocumento = new Map()
  for (const rec of work) {
    const doc = onlyDigits(rec.source.cnpjCpf)
    porDocumento.set(doc, [...(porDocumento.get(doc) ?? []), rec])
  }
  const clusters = []
  for (const doc of [...porDocumento.keys()].sort()) {
    const membros = (porDocumento.get(doc) ?? []).slice().sort((a, b) => byCodigo(a.source, b.source))
    if (membros.length < 2) continue
    const clusterId = `CL-${doc}`
    const sobrevivente = membros.slice().sort((a, b) => {
      const d = camposPreenchidos(b.source) - camposPreenchidos(a.source)
      if (d !== 0) return d
      if (a.source.spe !== b.source.spe) return a.source.spe < b.source.spe ? -1 : 1
      return byCodigo(a.source, b.source)
    })[0]
    const razaoProposta = membros.map((m) => m.source.razaoSocial).slice()
      .sort((a, b) => b.length - a.length || (a < b ? -1 : 1))[0]

    for (const m of membros) {
      m.clusterId = clusterId
      apply(m, s5, 'R-SUP-030', version, 'clusterId', null, clusterId, null,
        `Cluster por documento ${doc}, ${membros.length} membros.`)
      marcar('deduplicate', 'R-SUP-030')
      const plantado = m.source._plantedDefect.find((d) => d.kind === 'duplicata-grafia')
      const grafiasDivergem = new Set(membros.map((x) => x.source.razaoSocial)).size > 1
      raise(m, 'DEF-SRC-02', 'R-SUP-030', version,
        plantado?.note ?? (grafiasDivergem
          ? `Mesmo documento em ${membros.length} SPEs, com grafia divergente da razão social.`
          : `Mesmo documento cadastrado em ${membros.length} SPEs, com a mesma grafia.`))
    }
    apply(sobrevivente, s5, 'R-SUP-031', version, 'sobrevivente', null, sobrevivente.source.codigo, null,
      'Mais campos preenchidos no cluster; desempate por SPE e código.')
    marcar('deduplicate', 'R-SUP-031')
    apply(sobrevivente, s5, 'R-SUP-032', version, 'nameOrg1', sobrevivente.source.razaoSocial, razaoProposta,
      null, 'Razão social mais longa do cluster.')
    marcar('deduplicate', 'R-SUP-032')

    const assinatura = approvals.clusters[clusterId]
    clusters.push({
      id: clusterId, documento: doc, membros: membros.map((m) => m.source.codigo),
      spes: [...new Set(membros.map((m) => m.source.spe))].sort(),
      sobreviventePropostoCodigo: sobrevivente.source.codigo,
      razaoSocialProposta: razaoProposta,
      motivoDaProposta: 'Registro com mais campos preenchidos; razão social por extenso.',
      confirmado: assinatura !== undefined, decisao: assinatura?.decision ?? null,
    })
  }
  for (const rec of work) {
    const divergencia = rec.source._plantedDefect.find((d) => d.kind === 'retencao-pf-divergente')
    if (!divergencia) continue
    apply(rec, s5, 'R-SUP-030', version, 'retencoes', null, 'divergência entre SPEs', null, divergencia.note)
    marcar('deduplicate', 'R-SUP-030')
  }
  fechar('deduplicate', work.filter((r) => r.clusterId !== null).length)

  // ===== CHECKPOINT 2 — cada cluster confirmado um a um =====
  const pendentesCluster = clusters.filter((c) => !c.confirmado).map((c) => c.id)
  const cp2 = {
    id: 'duplicatas', titulo: 'Duplicatas confirmadas', apos: 'deduplicate',
    descricao: 'Cada cluster de duplicata é confirmado individualmente. Não há aprovação em lote.',
    requeridas: clusters.length, assinadas: clusters.length - pendentesCluster.length,
    pendentes: pendentesCluster, liberado: pendentesCluster.length === 0,
  }
  if (!cp2.liberado) {
    resolverTodos(work, approvals)
    naoAlcancados('enrich', 'blocked')
    return montar(work, [cp1, cp2], 'enrich', null, null, clusters, profile, classified, sealed, version, input.spe ?? 'todas', stepResults)
  }

  for (const cluster of clusters) {
    if (approvals.clusters[cluster.id]?.decision !== 'approved') continue
    for (const rec of work.filter((r) => r.clusterId === cluster.id)) {
      if (rec.source.codigo === cluster.sobreviventePropostoCodigo) {
        rec.nomeQuebrado = cluster.razaoSocialProposta
        rec.draft = { ...rec.draft, nameOrg1: splitNome(cluster.razaoSocialProposta, limiteNome, modoDeCorte)[0] }
      } else {
        rec.mergedInto = cluster.sobreviventePropostoCodigo
      }
    }
  }

  // ---------- 6 ENRICH (NOVA) ----------
  const s6 = stepOf('enrich')
  let enriquecidos = 0
  for (const rec of work) {
    const s = rec.source
    let ibge = s.codigoIbge
    if (ibge === null) {
      const encontrado = buscarMunicipio(s.municipio, s.uf)
      ibge = encontrado?.codigoIbge ?? null
      apply(rec, s6, 'R-SUP-040', version, 'codigoIbge', null, ibge, null,
        ibge === null
          ? `Município "${s.municipio}/${s.uf}" não está na tabela de referência.`
          : `Derivado de ${s.municipio}/${s.uf} pela tabela do IBGE.`)
      marcar('enrich', 'R-SUP-040')
      enriquecidos += 1
      if (ibge === null) {
        raise(rec, 'DEF-SRC-08', 'R-SUP-040', version,
          `Município "${s.municipio}/${s.uf}" sem código IBGE e ausente da tabela de referência.`)
      }
    }
    apply(rec, s6, 'R-SUP-041', version, 'taxJurCode', rec.draft.taxJurCode, ibge, { taxJurCode: ibge })
    marcar('enrich', 'R-SUP-041')
  }
  fechar('enrich', enriquecidos)

  // ---------- 7 VALIDATE (NOVA) ----------
  const s7 = stepOf('validate')
  const obrigatorios = requiredFields.filter((f) => f.objeto === 'business-partner' && f.obrigatorio)
  const baseExistente = new Map(existingSuppliers.map((e) => [onlyDigits(e.cnpjCpf), e]))
  for (const rec of work) {
    const s = rec.source
    const digitos = onlyDigits(s.cnpjCpf)

    if (s.naturezaPessoa === 'J') {
      const ok = isValidCnpj(s.cnpjCpf)
      apply(rec, s7, 'R-SUP-042', version, 'taxNumberBr1', digitos, ok ? 'válido' : 'inválido', null, null)
      marcar('validate', 'R-SUP-042')
      if (!ok) raise(rec, 'DEF-SRC-01', 'R-SUP-042', version, `CNPJ ${digitos} não fecha o dígito verificador.`)
    } else {
      const ok = isValidCpf(s.cnpjCpf)
      apply(rec, s7, 'R-SUP-043', version, 'taxNumberBr2', digitos, ok ? 'válido' : 'inválido', null, null)
      marcar('validate', 'R-SUP-043')
      if (!ok) raise(rec, 'DEF-SRC-01', 'R-SUP-043', version, `CPF ${digitos} não fecha o dígito verificador.`)
    }

    const existente = baseExistente.get(digitos)
    apply(rec, s7, 'R-SUP-044', version, 'businessPartner', null, existente?.businessPartner ?? 'novo',
      existente ? { businessPartner: existente.businessPartner } : null,
      existente ? `Já cadastrado como Business Partner ${existente.businessPartner}.` : null)
    marcar('validate', 'R-SUP-044')
    if (existente) {
      rec.reuseTarget = existente.businessPartner
      raise(rec, 'DEF-TGT-01', 'R-SUP-044', version,
        `CNPJ já existe no tenant como ${existente.businessPartner}. Reusar, não recriar.`)
    }

    if (s.cnae === null) {
      apply(rec, s7, 'R-SUP-045', version, 'industry', null, 'ausente', null, 'CNAE é obrigatório neste tenant.')
      marcar('validate', 'R-SUP-045')
      raise(rec, 'DEF-SRC-03', 'R-SUP-045', version,
        'CNAE em branco e obrigatório no tenant. A derivação de CNAE é regra candidata e não executa.')
    } else {
      const faltando = obrigatorios.map((f) => f.campo).filter((campo) => {
        if (campo === 'TAX_NUMBER_BR1') return s.naturezaPessoa === 'J' && rec.draft.taxNumberBr1 === null
        if (campo === 'TAX_NUMBER_BR2') return s.naturezaPessoa === 'F' && rec.draft.taxNumberBr2 === null
        if (campo === 'INDUSTRY') return rec.draft.industry === null
        if (campo === 'TAXJURCODE') return rec.draft.taxJurCode === null
        if (campo === 'PAYMENT_TERMS') return rec.draft.paymentTerms === null
        if (campo === 'WITHHOLDING_TAX_TYPE') return rec.draft.withholdingTaxType.length === 0
        if (campo === 'REGION') return rec.draft.region === null
        if (campo === 'BP_GROUPING') return rec.draft.bpGrouping === null
        if (campo === 'NAME_ORG1') return rec.draft.nameOrg1 === null
        return false
      })
      apply(rec, s7, 'R-SUP-045', version, 'campos obrigatórios', null,
        faltando.length === 0 ? 'completos' : faltando.join(', '), null, null)
      marcar('validate', 'R-SUP-045')
      if (faltando.length > 0) {
        raise(rec, 'DEF-TGT-02', 'R-SUP-045', version,
          `Campos obrigatórios do tenant sem valor: ${faltando.join(', ')}.`)
      }
    }

    // A regra diz "RETER AMBOS": a retenção não pode depender de qual lado da
    // dupla foi marcado no extrato. Deriva-se do cruzamento por documento.
    const contraparte = divergenciaDeRetencao(rec.source)
    if (contraparte) {
      const nota = rec.source._plantedDefect.find((d) => d.kind === 'retencao-pf-divergente')?.note
        ?? `Mesmo CPF de ${contraparte.codigo} (${contraparte.spe}), com retenção diferente. Nenhuma configuração do tenant decide qual está certa.`
      apply(rec, s7, 'R-SUP-047', version, 'retencoes', null, 'divergente', null, nota)
      marcar('validate', 'R-SUP-047')
      raise(rec, 'DEF-TGT-04', 'R-SUP-047', version, nota)
    }

    // R-SUP-048 — a validação da quebra do nome. É de NOVA, não de ATLAS: se a
    // validação viesse do mesmo raciocínio que quebrou, o defeito passaria pelas
    // duas. Na v1.4.0 ela não encontra nenhum.
    const org1 = rec.draft.nameOrg1
    if (org1 !== null && cortouPalavra(rec.nomeQuebrado, org1)) {
      const org2 = rec.draft.nameOrg2 ?? ''
      const nota = `"${rec.nomeQuebrado}" quebrou em "${org1}" + "${org2}": o corte caiu no meio da palavra.`
      apply(rec, s7, 'R-SUP-048', version, 'nameOrg1', rec.nomeQuebrado, org1, null, nota)
      marcar('validate', 'R-SUP-048')
      raise(rec, 'DEF-TRF-02', 'R-SUP-048', version, nota)
    }
  }
  fechar('validate', work.length)

  const excecoesAbertas = work.flatMap((r) => r.exceptions).slice().sort((a, b) => (a.id < b.id ? -1 : 1))

  // ===== CHECKPOINT 3 — cada exceção decidida =====
  const pendentesExcecao = excecoesAbertas.filter((e) => approvals.excecoes[e.id] === undefined).map((e) => e.id)
  const cp3 = {
    id: 'excecoes', titulo: 'Exceções liberadas', apos: 'validate',
    descricao: 'Toda exceção aberta precisa de uma decisão humana: liberar ou manter retido.',
    requeridas: excecoesAbertas.length, assinadas: excecoesAbertas.length - pendentesExcecao.length,
    pendentes: pendentesExcecao, liberado: pendentesExcecao.length === 0,
  }
  if (!cp3.liberado) {
    resolverTodos(work, approvals)
    naoAlcancados('package', 'blocked')
    return montar(work, [cp1, cp2, cp3], 'package', null, null, clusters, profile, classified, sealed, version, input.spe ?? 'todas', stepResults)
  }

  resolverTodos(work, approvals)

  // ---------- 8 PACKAGE (ORION) ----------
  const s8 = stepOf('package')
  const empacotaveis = work.filter((r) => r.outcome === 'migrated' || r.outcome === 'reused')
    .sort((a, b) => byCodigo(a.source, b.source))
  for (const rec of empacotaveis) {
    apply(rec, s8, 'R-PKG-001', version, 'pacote', null, 'incluído', null, `Outcome ${rec.outcome}.`)
    marcar('package', 'R-PKG-001')
    apply(rec, s8, 'R-PKG-003', version, 'businessPartner', rec.draft.businessPartner,
      rec.draft.businessPartner ?? 'a atribuir na faixa externa', null, null)
    marcar('package', 'R-PKG-003')
  }
  const datasetChecksum = hex8(hashSeed(empacotaveis
    .map((r) => `${r.source.codigo}${r.draft.taxNumberBr1 ?? r.draft.taxNumberBr2 ?? ''}${r.draft.nameOrg1 ?? ''}`)
    .join('|')))
  const loadPackage = {
    id: `PKG-${input.spe ?? 'todas'}-${version}`,
    registros: empacotaveis.map((r) => r.source.codigo),
    total: empacotaveis.length,
    manifest: {
      playbookVersion: version, playbookChecksum: sealed.checksum, datasetChecksum,
      total: empacotaveis.length, geradoEm: simInstant().toISOString(),
    },
  }
  marcar('package', 'R-PKG-002')
  marcar('package', 'R-PKG-004')
  fechar('package', empacotaveis.length)

  // ---------- 9 RECONCILE (SIRIUS) ----------
  const conta = (o) => work.filter((r) => r.outcome === o).length
  const reconciliation = {
    recebidos: work.length, migrated: conta('migrated'), reused: conta('reused'),
    merged: conta('merged'), held: conta('held'),
    fecha: conta('migrated') + conta('reused') + conta('merged') + conta('held') === work.length,
    semTrilha: work.filter((r) => r.trail.length === 0).map((r) => r.source.codigo).sort(),
    retidosSemExcecao: work.filter((r) => r.outcome === 'held' && r.exceptions.length === 0)
      .map((r) => r.source.codigo).sort(),
  }
  marcar('reconcile', 'R-REC-001')
  marcar('reconcile', 'R-REC-002')
  marcar('reconcile', 'R-REC-003')
  fechar('reconcile', work.length)

  // ===== CHECKPOINT 4 — pacote e reconciliação assinados pelo data owner =====
  const pendentes4 = [approvals.pacote ? null : 'pacote', approvals.reconciliacao ? null : 'reconciliacao']
    .filter((v) => v !== null)
  const cp4 = {
    id: 'pacote-reconciliacao', titulo: 'Pacote e reconciliação aprovados', apos: 'reconcile',
    descricao: 'O data owner assina o pacote e a reconciliação. Sem as duas assinaturas, nada é liberado para carga.',
    requeridas: 2, assinadas: 2 - pendentes4.length, pendentes: pendentes4,
    liberado: approvals.pacote?.decision === 'approved' && approvals.reconciliacao?.decision === 'approved',
  }

  return montar(work, [cp1, cp2, cp3, cp4], null, loadPackage, reconciliation, clusters, profile,
    classified, sealed, version, input.spe ?? 'todas', stepResults)
}

function tallyByOrigin(defeitos) {
  return defectOriginIds.map((origin) => {
    const doGrupo = defeitos.filter((d) => d.origin === origin)
    return {
      origin, total: doGrupo.length,
      critical: doGrupo.filter((d) => d.severidade === 'critical').length,
      nonCritical: doGrupo.filter((d) => d.severidade === 'non-critical').length,
      monodaResponsavel: origin === 'transformation',
    }
  })
}

function montar(work, checkpoints, blockedAt, loadPackage, reconciliation, clusters, profile,
  classified, sealed, version, spe, steps) {
  const records = work.map((r) => ({
    codigo: r.source.codigo, spe: r.source.spe, source: r.source, trail: r.trail,
    target: r.outcome === 'held' ? null : r.draft, outcome: r.outcome,
    exceptions: r.exceptions.slice().sort((a, b) => (a.id < b.id ? -1 : 1)),
    clusterId: r.clusterId, resolvidoPara: r.mergedInto ?? r.reuseTarget,
  })).sort(byCodigo)

  return {
    playbookVersion: version, playbookChecksum: sealed.checksum, spe,
    steps: steps.slice().sort((a, b) => a.n - b.n),
    records, profile, classifiedDefects: classified, defectsByOrigin: tallyByOrigin(classified),
    clusters, exceptions: records.flatMap((r) => r.exceptions), checkpoints, blockedAt,
    loadPackage, reconciliation,
  }
}


/* ========================================================================== */
/* 12. A MESMA ESTEIRA, EM LINHA DE CONTRATO                                  */
/* ========================================================================== */

/**
 * Os nove passos, os mesmos agentes, a mesma trilha e — o que importa — o mesmo
 * guarda: toda mutação passa por `resolveRule`. Nada aqui é caminho paralelo com
 * regras próprias. Linha de contrato é o objeto de maior densidade de regra do
 * escopo: se a esteira atende este, atende os fáceis.
 */
const itensLc116 = [
  { item: '7.02', descricao: 'Execução de obras de construção civil, hidráulica ou elétrica e congêneres',
    indicadores: ['montagem', 'construcao', 'implantacao'] },
  { item: '7.03', descricao: 'Elaboração de planos, estudos, projetos básicos e executivos de engenharia',
    indicadores: ['projeto', 'estudo', 'engenharia', 'comissionamento'] },
  { item: '7.05', descricao: 'Reparação, conservação e reforma de edifícios, estradas, pontes e congêneres',
    indicadores: ['manutencao', 'reparo', 'corretiva', 'preventiva', 'linha viva'] },
  { item: '7.10', descricao: 'Limpeza, manutenção e conservação de vias, imóveis, parques e jardins',
    indicadores: ['limpeza', 'conservacao'] },
  { item: '7.16', descricao: 'Florestamento, reflorestamento, corte e descascamento de árvores e congêneres',
    indicadores: ['rocada', 'destoca', 'poda', 'faixa de servidao'] },
  { item: '7.20', descricao: 'Cartografia, mapeamento, levantamentos topográficos e geodésicos',
    indicadores: ['topografico', 'topografia', 'georreferenciamento', 'levantamento'] },
  { item: '8.02', descricao: 'Instrução, treinamento e orientação pedagógica de qualquer natureza',
    indicadores: ['treinamento', 'capacitacao'] },
  { item: '11.02', descricao: 'Vigilância, segurança ou monitoramento de bens e pessoas',
    indicadores: ['vigilancia', 'seguranca patrimonial'] },
  { item: '17.09', descricao: 'Perícias, laudos, exames técnicos e análises técnicas',
    indicadores: ['inspecao', 'ensaio', 'termografica', 'analise'] },
]
/**
 * Locação de bem móvel sem operador não é serviço para fins de ISS. Não é lacuna
 * da tabela: é o enquadramento correto, e a proposta tem que dizer isso em vez
 * de forçar um item.
 */
const NAO_INCIDE_ISS = {
  motivo: 'Locação de bem móvel não constitui prestação de serviço para fins de ISS.',
  fundamento: 'Súmula Vinculante 31 do STF',
  indicadores: ['locacao', 'aluguel'],
}
const semAcento = (v) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function classificarLc116(descricao) {
  const alvo = semAcento(descricao)
  if (NAO_INCIDE_ISS.indicadores.some((i) => alvo.includes(i))) {
    return { item: null, descricao: NAO_INCIDE_ISS.motivo, fundamento: NAO_INCIDE_ISS.fundamento, incide: false }
  }
  const encontrado = itensLc116.find((i) => i.indicadores.some((ind) => alvo.includes(ind)))
  if (!encontrado) return null
  return { item: encontrado.item, descricao: encontrado.descricao,
    fundamento: `Lista de serviços da LC 116/2003, item ${encontrado.item}`, incide: true }
}

const UOM_TENANT = { M: 'M', MT: 'M', METRO: 'M', KM: 'KM', UN: 'ST', H: 'H', DIA: 'DAY', MES: 'MON', VB: 'LE' }
const SERVICE_GROUP = [
  { prefixo: 'CC-LT', grupo: 'ZLT' }, { prefixo: 'CC-SE', grupo: 'ZSE' },
  { prefixo: 'CC-ENG', grupo: 'ZENG' }, { prefixo: 'CC-AMB', grupo: 'ZAMB' },
  { prefixo: 'CC-OBRA', grupo: 'ZLOC' }, { prefixo: 'CC-LOG', grupo: 'ZLOC' },
  { prefixo: 'CC-SEG', grupo: 'ZSE' }, { prefixo: 'CC-SUP', grupo: 'ZLOC' },
]
const EMPTY_LINE = {
  agreementItem: null, shortText: null, baseUom: null, quantity: null, netPrice: null,
  netValue: null, serviceGroup: null, codigoLc116: null, incoterms: null, costCenter: null,
}

function applyLinha(rec, step, ruleId, version, field, before, after, patch, note = null) {
  const rule = resolveRule(ruleId, step.agent, version)
  if (patch) rec.draft = { ...rec.draft, ...patch }
  const seq = rec.trail.length + 1
  rec.trail.push({
    seq, at: simInstant(step.n * 15 * MINUTE_MS + seq * 3000).toISOString(),
    step: step.id, agent: rule.agent, ruleId: rule.id, playbookVersion: version,
    field, before: str(before), after: str(after), note,
  })
}
function raiseLinha(rec, id, defectTypeId, ruleId, version, mensagem) {
  const tipo = defectTypeById.get(defectTypeId)
  if (!tipo) throw new Error(`Tipo de defeito desconhecido: ${defectTypeId}`)
  rec.exceptions.push({
    id: `${id}:${defectTypeId}`, recordCode: id, defectTypeId: tipo.id, nome: tipo.nome,
    origin: tipo.origin, severidade: tipo.severidade, classe: tipo.classe, prazoDias: tipo.prazoDias,
    ruleId, playbookVersion: version, mensagem, roteadoPara: tipo.roteadoPara,
    monodaResponsavel: tipo.origin === 'transformation',
  })
}

function runContractLine(contrato, linha, playbookVersion = PLAYBOOK_VERSION) {
  const version = playbookVersion
  sealPlaybook(version)
  // '#' viraria fragmento de URL e sumiria do path; '~' atravessa a rota inteiro.
  const id = `${contrato.numero}~${linha.item}`
  const rec = { trail: [], exceptions: [], draft: EMPTY_LINE }

  const calculado = Number((linha.quantidade * linha.precoUnitario).toFixed(2))
  const fecha = Math.abs(calculado - linha.valorTotal) <= 0.01
  applyLinha(rec, stepOf('receive'), 'R-CTR-001', version, 'linhas[].valorTotal', linha.valorTotal, calculado, null,
    fecha ? 'Quantidade × preço fecha com o total da linha.' : 'Quantidade × preço NÃO fecha com o total da linha.')

  const reconhecida = linha.unidadeMedida in UOM_TENANT
  applyLinha(rec, stepOf('profile'), 'R-CTR-002', version, 'linhas[].unidadeMedida', linha.unidadeMedida,
    reconhecida ? 'reconhecida' : 'desconhecida', null,
    ['MT', 'METRO'].includes(linha.unidadeMedida)
      ? `Grafia divergente: esta SPE escreve metro como "${linha.unidadeMedida}".` : null)

  const uom = UOM_TENANT[linha.unidadeMedida] ?? null
  applyLinha(rec, stepOf('map'), 'R-CTR-010', version, 'baseUom', linha.unidadeMedida, uom, { baseUom: uom },
    uom !== null && uom !== linha.unidadeMedida ? 'Normalizada para o domínio UOM do tenant.' : null)
  if (uom === null) {
    raiseLinha(rec, id, 'DEF-TGT-03', 'R-CTR-010', version,
      `Unidade "${linha.unidadeMedida}" não tem correspondente no domínio UOM do tenant.`)
  }
  // Incoterms: regra candidata. Não executa — abre exceção.
  if (contrato.tipo === 'servico') {
    raiseLinha(rec, id, 'DEF-TGT-02', 'R-CTR-011', version,
      'O tenant exige Incoterms em contrato de serviço e o extrato não traz o dado. A regra que preencheria é candidata e não executa.')
  }

  const [shortText] = splitNome(linha.descricao, 40)
  applyLinha(rec, stepOf('transform'), 'R-CTR-021', version, 'shortText', linha.descricao, shortText,
    { shortText, agreementItem: String(linha.item).padStart(5, '0'), costCenter: linha.centroCusto },
    linha.descricao.length > 40 ? 'Excedeu 40 caracteres; quebrado na última palavra inteira.' : null)
  applyLinha(rec, stepOf('transform'), 'R-CTR-020', version, 'quantity', linha.quantidade, linha.quantidade,
    { quantity: linha.quantidade, netPrice: linha.precoUnitario, netValue: linha.valorTotal },
    'Só o código da unidade muda; a quantidade permanece.')

  // O passo 5 roda sem aplicar regra: linha de contrato não deduplica — a chave
  // é o par contrato + item, único por construção. A trilha registra pela ausência.

  const grupo = SERVICE_GROUP.find((g) => linha.centroCusto.startsWith(g.prefixo))?.grupo ?? null
  applyLinha(rec, stepOf('enrich'), 'R-CTR-040', version, 'serviceGroup', linha.centroCusto, grupo,
    { serviceGroup: grupo },
    grupo === null ? 'Centro de custo sem prefixo conhecido.' : 'Derivado do prefixo do centro de custo.')
  const lc = classificarLc116(linha.descricao)
  applyLinha(rec, stepOf('enrich'), 'R-CTR-041', version, 'codigoLc116', null, lc?.item ?? null,
    { codigoLc116: lc?.item ?? null },
    lc === null ? 'Sem correspondência na tabela da LC 116. Nenhuma proposta é feita.'
      : lc.incide ? `${lc.fundamento}.` : `${lc.descricao} ${lc.fundamento}.`)

  applyLinha(rec, stepOf('validate'), 'R-CTR-030', version, 'faseFiscal', contrato.faseFiscal,
    contrato.faseFiscal === 'concluida' ? 'aprovada' : 'reprovada', null, null)
  if (contrato.faseFiscal !== 'concluida') {
    raiseLinha(rec, id, 'DEF-SRC-04', 'R-CTR-030', version,
      'Contrato com fase fiscal aberta no Nasajon. Não pode virar Outline agreement.')
  }
  const somaLinhas = contrato.linhas.reduce((acc, l) => acc + l.valorTotal, 0)
  const reconcilia = Math.abs(somaLinhas - contrato.valorOriginal) <= 0.01
  applyLinha(rec, stepOf('validate'), 'R-CTR-031', version, 'valorOriginal', contrato.valorOriginal,
    Number(somaLinhas.toFixed(2)), null,
    reconcilia ? 'Soma das linhas bate com o cabeçalho.' : 'Soma das linhas NÃO bate com o cabeçalho do contrato.')
  if (!reconcilia) {
    raiseLinha(rec, id, 'DEF-SRC-05', 'R-CTR-031', version,
      `A soma das linhas dá ${somaLinhas.toFixed(2)} e o cabeçalho diz ${contrato.valorOriginal.toFixed(2)}.`)
  }

  const criticas = rec.exceptions.filter((e) => e.severidade === 'critical')
  const outcome = criticas.length > 0 ? 'held' : 'migrated'
  if (outcome !== 'held') {
    applyLinha(rec, stepOf('package'), 'R-PKG-001', version, 'pacote', null, 'incluído', null, null)
  }
  applyLinha(rec, stepOf('reconcile'), 'R-REC-002', version, 'trilha', null, `${rec.trail.length + 1} entradas`, null,
    'Toda linha atravessa a esteira com trilha não vazia.')

  return { id, contrato, linha, trail: rec.trail, target: outcome === 'held' ? null : rec.draft,
    outcome, exceptions: rec.exceptions.slice().sort((a, b) => (a.id < b.id ? -1 : 1)) }
}

const dominioUom = valueDomains.find((d) => d.id === 'UOM')

/** Resolve o caso da rota `/record/:id` — fornecedor ou linha de contrato. */
function linhaDeContratoPorId(id) {
  const [numero, item] = id.split('~')
  const contrato = nasajonContracts.find((c) => c.numero === numero)
  const linha = contrato?.linhas.find((l) => String(l.item) === item)
  return contrato && linha ? { contrato, linha } : null
}

/* ========================================================================== */
/* 13. ENRIQUECIMENTO COM EVIDÊNCIA ANEXADA                                   */
/* ========================================================================== */

/**
 * A regra da fila é dura: SEM EVIDÊNCIA, SEM PROPOSTA. Quando não há fonte de
 * referência que sustente um valor, o campo fica sem proposta e a tela diz por
 * quê. Não existe "aplicar valor padrão" em lugar nenhum.
 */
function proporIbge(s) {
  if (s.codigoIbge !== null) return null
  const municipio = buscarMunicipio(s.municipio, s.uf)
  const base = { id: `${s.codigo}:codigoIbge`, recordCode: s.codigo, campo: 'codigoIbge',
    rotuloCampo: 'Código IBGE do município', ruleId: 'R-SUP-040' }
  if (!municipio) {
    return { ...base, valorProposto: null, evidencia: null,
      motivoSemProposta: `"${s.municipio}/${s.uf}" não está na tabela de municípios do IBGE carregada. Sem entrada na tabela, não há proposta.` }
  }
  return { ...base, valorProposto: municipio.codigoIbge,
    evidencia: { fonte: 'Tabela de municípios do IBGE', referencia: `${municipio.nome} / ${municipio.uf}`,
      detalhe: `Busca por nome e UF, ignorando acento e caixa. O prefixo ${municipio.codigoIbge.slice(0, 2)} confere com a UF ${municipio.uf}.` },
    motivoSemProposta: null }
}

/**
 * CNAE. Não há fonte de referência que ligue razão social a CNAE, e a regra que
 * faria isso é candidata. Portanto: nenhuma proposta. É o caso que prova a regra.
 */
function proporCnae(s) {
  if (s.cnae !== null) return null
  return { id: `${s.codigo}:cnae`, recordCode: s.codigo, campo: 'cnae', rotuloCampo: 'CNAE',
    ruleId: 'R-SUP-046', valorProposto: null, evidencia: null,
    motivoSemProposta: 'Não há fonte de referência que derive CNAE de razão social. A regra que proporia é candidata e não executa. Erro de CNAE tem efeito fiscal — o campo volta para a origem.' }
}

/** NCM a partir de material equivalente já classificado no mesmo grupo. */
function proporNcm(codigoMaterial) {
  const material = nasajonMaterials.find((m) => m.codigo === codigoMaterial)
  if (!material || material.ncm !== null) return null
  const base = { id: `${material.codigo}:ncm`, recordCode: material.codigo, campo: 'ncm',
    rotuloCampo: 'NCM', ruleId: 'R-MAT-020' }
  const equivalentes = nasajonMaterials.filter((m) => m.ncm !== null && m.grupoMercadoria === material.grupoMercadoria)
  const distintos = new Set(equivalentes.map((m) => m.ncm))
  const termos = (v) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    .split(/[^A-Z0-9]+/).filter((t) => t.length >= 3)
  const meus = new Set(termos(material.descricao))
  const porTermos = equivalentes
    .map((m) => ({ m, comuns: termos(m.descricao).filter((t) => meus.has(t)) }))
    .filter((x) => x.comuns.length >= 2)
    .sort((a, b) => b.comuns.length - a.comuns.length || (a.m.codigo < b.m.codigo ? -1 : 1))
  const melhor = porTermos[0]
  const empatado = porTermos.length > 1 && porTermos[1]?.comuns.length === melhor?.comuns.length
  if (melhor && !empatado && melhor.m.ncm !== null) {
    return { ...base, valorProposto: melhor.m.ncm,
      evidencia: { fonte: 'Material equivalente já classificado no escopo',
        referencia: `${melhor.m.codigo} — ${melhor.m.descricao}`,
        detalhe: `Descrições compartilham os termos ${melhor.comuns.join(', ')}. Mesmo grupo de mercadoria (${material.grupoMercadoria}).` },
      motivoSemProposta: null }
  }
  if (equivalentes.length === 0) {
    return { ...base, valorProposto: null, evidencia: null,
      motivoSemProposta: `Nenhum material do grupo ${material.grupoMercadoria} tem NCM classificado.` }
  }
  if (distintos.size > 1) {
    return { ...base, valorProposto: null, evidencia: null,
      motivoSemProposta: `O grupo ${material.grupoMercadoria} tem ${distintos.size} NCM diferentes entre os materiais já classificados, e a descrição não bate com nenhum deles. Não há valor único a propor — escolher um seria chutar.` }
  }
  const fonte = equivalentes[0]
  if (!fonte || fonte.ncm === null) return null
  return { ...base, valorProposto: fonte.ncm,
    evidencia: { fonte: 'Material equivalente já classificado no escopo',
      referencia: `${fonte.codigo} — ${fonte.descricao}`,
      detalhe: `Único NCM em uso no grupo ${material.grupoMercadoria} entre os ${equivalentes.length} materiais já classificados.` },
    motivoSemProposta: null }
}

/** Enquadramento de ISS da linha de serviço, pela lista da LC 116. */
function proporLc116(numeroContrato, item) {
  const contrato = nasajonContracts.find((c) => c.numero === numeroContrato)
  const linha = contrato?.linhas.find((l) => l.item === item)
  if (!contrato || !linha) return null
  const base = { id: `${contrato.numero}~${linha.item}:lc116`, recordCode: `${contrato.numero}~${linha.item}`,
    campo: 'codigoLc116', rotuloCampo: 'Código de serviço LC 116', ruleId: 'R-CTR-041' }
  const resultado = classificarLc116(linha.descricao)
  if (resultado === null) {
    return { ...base, valorProposto: null, evidencia: null,
      motivoSemProposta: `"${linha.descricao}" não casa com nenhum item da lista de serviços carregada. Enquadramento fiscal não se adivinha.` }
  }
  if (!resultado.incide) {
    return { ...base, valorProposto: null, evidencia: null,
      motivoSemProposta: `${resultado.descricao} ${resultado.fundamento}.` }
  }
  return { ...base, valorProposto: resultado.item,
    evidencia: { fonte: 'Lista de serviços da LC 116/2003', referencia: `Item ${resultado.item}`, detalhe: resultado.descricao },
    motivoSemProposta: null }
}

const propostasParaFornecedor = (codigo) => {
  const s = nasajonSuppliers.find((x) => x.codigo === codigo)
  return s ? [proporIbge(s), proporCnae(s)].filter((p) => p !== null) : []
}
const propostasDeMaterial = () =>
  nasajonMaterials.filter((m) => m.ncm === null).map((m) => proporNcm(m.codigo)).filter((p) => p !== null)
const propostasDeServico = () =>
  nasajonContracts.filter((c) => c.tipo === 'servico')
    .flatMap((c) => c.linhas.map((l) => proporLc116(c.numero, l.item))).filter((p) => p !== null)

/* ========================================================================== */
/* 14. RACIONAL DO MATCH DE DUPLICATA                                         */
/* ========================================================================== */

/**
 * O score não é opinião do modelo: é a soma de sinais verificáveis, cada um com
 * peso declarado, e a tela mostra sinal por sinal. Um score sem os sinais que o
 * compõem é número para impressionar, não para decidir.
 */
const norm = (v) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  .replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

function similaridade(a, b) {
  const ta = new Set(norm(a).split(' ').filter(Boolean))
  const tb = new Set(norm(b).split(' ').filter(Boolean))
  if (ta.size === 0 || tb.size === 0) return 0
  const comuns = [...ta].filter((t) => tb.has(t)).length
  return comuns / new Set([...ta, ...tb]).size
}

const CAMPOS_COMPARADOS = [
  { campo: 'razaoSocial', rotulo: 'Razão social' }, { campo: 'nomeFantasia', rotulo: 'Nome fantasia' },
  { campo: 'cnpjCpf', rotulo: 'Documento' }, { campo: 'inscricaoEstadual', rotulo: 'Inscrição estadual' },
  { campo: 'inscricaoMunicipal', rotulo: 'Inscrição municipal' }, { campo: 'cnae', rotulo: 'CNAE' },
  { campo: 'logradouro', rotulo: 'Logradouro' }, { campo: 'numero', rotulo: 'Número' },
  { campo: 'municipio', rotulo: 'Município' }, { campo: 'uf', rotulo: 'UF' }, { campo: 'cep', rotulo: 'CEP' },
  { campo: 'banco', rotulo: 'Banco' }, { campo: 'agencia', rotulo: 'Agência' }, { campo: 'conta', rotulo: 'Conta' },
  { campo: 'condicaoPagamento', rotulo: 'Condição de pagamento' },
  { campo: 'regimeTributario', rotulo: 'Regime tributário' }, { campo: 'dataCadastro', rotulo: 'Data de cadastro' },
]
const valorDe = (s, campo) => (s[campo] === null || s[campo] === undefined ? '' : String(s[campo]))

function analisarCluster(cluster, registros) {
  const membros = cluster.membros.map((c) => registros.find((r) => r.codigo === c)).filter(Boolean)
  const [a, b] = membros
  const sinais = []
  if (a && b) {
    const docIgual = onlyDigits(a.cnpjCpf) === onlyDigits(b.cnpjCpf)
    sinais.push({ id: 'documento', rotulo: 'Mesmo CNPJ/CPF', peso: 60, bate: docIgual,
      detalhe: docIgual ? `Documento idêntico nos dois cadastros: ${formatDoc(a.cnpjCpf)}.` : 'Documentos diferentes.' })
    const sim = similaridade(a.razaoSocial, b.razaoSocial)
    sinais.push({ id: 'razao', rotulo: 'Razão social semelhante', peso: 15, bate: sim >= 0.5,
      detalhe: `Sobreposição de ${percentualBr(sim * 100, 0)} dos termos, ignorando acento, caixa e sufixo societário.` })
    const mesmoEndereco = norm(a.logradouro) === norm(b.logradouro) && a.numero === b.numero
    sinais.push({ id: 'endereco', rotulo: 'Mesmo endereço', peso: 10, bate: mesmoEndereco,
      detalhe: mesmoEndereco ? `${a.logradouro}, ${a.numero} nos dois cadastros.` : 'Endereços diferentes entre as SPEs.' })
    const mesmaConta = a.banco === b.banco && a.agencia === b.agencia && a.conta === b.conta
    sinais.push({ id: 'banco', rotulo: 'Mesma conta bancária', peso: 10, bate: mesmaConta,
      detalhe: mesmaConta ? `Banco ${a.banco}, agência ${a.agencia}, conta ${a.conta}.` : 'Contas diferentes.' })
    const ieIgual = a.inscricaoEstadual !== null && a.inscricaoEstadual === b.inscricaoEstadual
    sinais.push({ id: 'ie', rotulo: 'Mesma inscrição estadual', peso: 5, bate: ieIgual,
      detalhe: ieIgual ? `Inscrição ${a.inscricaoEstadual}.` : 'Inscrição estadual diferente ou ausente.' })
  }
  const score = sinais.filter((s) => s.bate).reduce((acc, s) => acc + s.peso, 0)
  const divergentes = []
  const iguais = []
  for (const { campo, rotulo } of CAMPOS_COMPARADOS) {
    const valores = membros.map((m) => ({ codigo: m.codigo, valor: valorDe(m, campo) }))
    if (new Set(valores.map((v) => v.valor)).size > 1) divergentes.push({ campo, rotulo, valores })
    else iguais.push(rotulo)
  }
  return { clusterId: cluster.id, score, sinais, divergentes, iguais }
}

/**
 * Os fornecedores que já existem no tenant, derivados do CRUZAMENTO POR
 * DOCUMENTO contra a base viva — não do resultado da esteira. Se viessem do
 * resultado, sumiriam justamente enquanto o checkpoint segura, que é quando a
 * tela mais precisa mostrá-los.
 */
function jaCadastradosNoTenant(registros) {
  const porDoc = new Map(existingSuppliers.map((e) => [onlyDigits(e.cnpjCpf), e]))
  return registros
    .map((s) => ({ origem: s, existente: porDoc.get(onlyDigits(s.cnpjCpf)) ?? null }))
    .filter((x) => x.existente !== null)
    .sort((a, b) => byCodigo(a.origem, b.origem))
}

/* ========================================================================== */
/* 15. MISSION CONTROL — todo número derivado das fixtures                    */
/* ========================================================================== */

/**
 * Fingerprint do conteúdo entregue. Não é criptográfico: serve para provar que
 * dois recebimentos do mesmo arquivo têm o mesmo conteúdo. Duas passadas em
 * sentidos opostos, 16 caracteres hexadecimais.
 */
function fingerprint(conteudo) {
  const direto = conteudo.join('')
  const inverso = [...conteudo].reverse().join('')
  return (hex8(hashSeed(direto)) + hex8(hashSeed(inverso))).toUpperCase()
}

function conteudoDoArquivo(arquivo) {
  if (arquivo.objetoId === 'fornecedores') {
    return nasajonSuppliers.filter((s) => s.spe === arquivo.spe)
      .map((s) => `${s.codigo}|${s.razaoSocial}|${s.cnpjCpf}|${s.municipio}|${s.dataCadastro}`)
  }
  if (arquivo.objetoId === 'materiais-servicos') {
    return nasajonMaterials.filter((m) => m.spe === arquivo.spe)
      .map((m) => `${m.codigo}|${m.descricao}|${m.ncm ?? ''}|${m.unidadeMedida}|${m.precoMedio}`)
  }
  if (arquivo.objetoId === 'contratos') {
    return nasajonContracts.filter((c) => c.spe === arquivo.spe)
      .map((c) => `${c.numero}|${c.fornecedorCodigo}|${c.valorOriginal}|${c.linhas.length}`)
  }
  return []
}

/** Confere cada arquivo recebido contra o conteúdo de fato lido. */
const recebimentos = arquivosRecebidos.map((arquivo) => {
  const conteudo = conteudoDoArquivo(arquivo)
  return {
    arquivo, registrosLidos: conteudo.length,
    contagemConfere: conteudo.length === arquivo.registrosDeclarados,
    diferenca: conteudo.length - arquivo.registrosDeclarados,
    layoutValidado: arquivo.divergenciasLayout.length === 0,
    fingerprint: fingerprint(conteudo),
  }
})
const resumoRecebimento = {
  arquivos: recebimentos.length,
  layoutValidado: recebimentos.filter((r) => r.layoutValidado).length,
  contagemDivergente: recebimentos.filter((r) => !r.contagemConfere).length,
  recibosComRessalva: recebimentos.filter((r) => !r.arquivo.recibo.aceito).length,
  registrosLidos: recebimentos.reduce((acc, r) => acc + r.registrosLidos, 0),
}

/**
 * O mapa de defeitos perfila O QUE CHEGOU, não o que a fixture tem. Sem este
 * recorte, a tela diria "42 registros lidos" num painel e outro número no painel
 * ao lado — dois números da mesma tela se contradizendo.
 */
const spesRecebidas = (objetoId) =>
  new Set(arquivosRecebidos.filter((a) => a.objetoId === objetoId).map((a) => a.spe))

function fonteDeDefeitos(id, registros) {
  const recebidas = spesRecebidas(id)
  const perfilados = registros.filter((r) => recebidas.has(r.spe))
  return { id, registros: perfilados.length,
    defeitos: perfilados.flatMap((r) => r._plantedDefect.map((d) => ({ spe: r.spe, defeito: d }))) }
}
const FONTES_DEFEITO = [
  fonteDeDefeitos('fornecedores', nasajonSuppliers),
  fonteDeDefeitos('materiais-servicos', nasajonMaterials),
  fonteDeDefeitos('contratos', nasajonContracts),
]
const tipoDe = (defeito) => defectTypeByPlantedKind.get(defeito.kind)
const taxa = (defeitos, registros) => (registros === 0 ? 0 : Number(((defeitos / registros) * 100).toFixed(1)))

const taxaPorObjeto = FONTES_DEFEITO.map((f) => ({
  chave: f.id, registros: f.registros, defeitos: f.defeitos.length,
  taxa: taxa(f.defeitos.length, f.registros),
  criticos: f.defeitos.filter((d) => tipoDe(d.defeito)?.severidade === 'critical').length,
}))
const taxaPorDimensao = qualityDimensions.map((dimensao) => {
  const registros = FONTES_DEFEITO.reduce((acc, f) => acc + f.registros, 0)
  const daDimensao = FONTES_DEFEITO.flatMap((f) => f.defeitos).filter((d) => tipoDe(d.defeito)?.dimensao === dimensao)
  return { chave: dimensao, registros, defeitos: daDimensao.length, taxa: taxa(daDimensao.length, registros),
    criticos: daDimensao.filter((d) => tipoDe(d.defeito)?.severidade === 'critical').length }
}).filter((t) => t.defeitos > 0)
const matrizObjetoDimensao = FONTES_DEFEITO.flatMap((f) =>
  qualityDimensions.map((dimensao) => ({ objetoId: f.id, dimensao,
    defeitos: f.defeitos.filter((d) => tipoDe(d.defeito)?.dimensao === dimensao).length })))
const resumoDefeitos = {
  registrosPerfilados: FONTES_DEFEITO.reduce((acc, f) => acc + f.registros, 0),
  defeitos: FONTES_DEFEITO.reduce((acc, f) => acc + f.defeitos.length, 0),
  criticos: taxaPorObjeto.reduce((acc, t) => acc + t.criticos, 0),
  taxaGeral: taxa(FONTES_DEFEITO.reduce((acc, f) => acc + f.defeitos.length, 0),
    FONTES_DEFEITO.reduce((acc, f) => acc + f.registros, 0)),
}
/** Volume do subconjunto demonstrado, para a tela separá-lo do escopo declarado. */
const volumeDemonstrado = {
  fornecedores: nasajonSuppliers.length,
  contratos: nasajonContracts.length,
  materiais: nasajonMaterials.length,
  total: nasajonSuppliers.length + nasajonContracts.length + nasajonMaterials.length,
}

/** Estado de atividade de cada agente, derivado do run corrente. */
function estadoDosAgentes(run) {
  return agents.map((agent) => {
    if (agent.transversal) return { agent, atividade: 'continuo', passos: [], regrasAplicadas: 0 }
    const meus = pipelineSteps.filter((s) => s.agent === agent.name)
    const resultados = meus.map((spec) => ({
      nome: spec.nome, status: run.steps.find((s) => s.id === spec.id)?.status ?? 'not-reached',
    }))
    const regras = meus.reduce((acc, spec) =>
      acc + (run.steps.find((s) => s.id === spec.id)?.regrasAplicadas.length ?? 0), 0)
    const atividade = resultados.some((r) => r.status === 'blocked') ? 'bloqueado'
      : resultados.every((r) => r.status === 'completed') ? 'concluido'
        : resultados.some((r) => r.status === 'completed') ? 'em-execucao' : 'aguardando'
    return { agent, atividade, passos: resultados, regrasAplicadas: regras }
  })
}
const rotuloAtividade = {
  concluido: 'concluído', 'em-execucao': 'em execução', bloqueado: 'bloqueado',
  aguardando: 'aguardando', continuo: 'contínuo',
}

/* ========================================================================== */
/* 16. USO DAS REGRAS NA ONDA                                                 */
/* ========================================================================== */

/**
 * "Aplicada a N registros nesta onda", contado da trilha do run — não de um
 * contador à parte. Regra que não rodou mostra zero, e regra candidata mostra
 * zero sempre, porque proposta não executa.
 */
function usoDasRegras(run) {
  const porRegra = new Map()
  for (const registro of run.records) {
    for (const entrada of registro.trail) {
      if (entrada.playbookVersion !== run.playbookVersion) continue
      const atual = porRegra.get(entrada.ruleId) ?? new Set()
      atual.add(registro.codigo)
      porRegra.set(entrada.ruleId, atual)
    }
  }
  return new Map([...porRegra].map(([id, set]) => [id, [...set].sort()]))
}

/* ========================================================================== */
/* 17. PACOTE DE CARGA — XML, conformidade e divisão                          */
/* ========================================================================== */

const escaparXml = (v) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Campos do Business Partner na ordem em que o Migration Cockpit os espera. */
const CAMPOS_BP = [
  { tag: 'BUSINESS_PARTNER', ler: (t) => t.businessPartner },
  { tag: 'BP_GROUPING', ler: (t) => t.bpGrouping },
  { tag: 'NAME_ORG1', ler: (t) => t.nameOrg1 },
  { tag: 'NAME_ORG2', ler: (t) => t.nameOrg2 },
  { tag: 'TAX_NUMBER_BR1', ler: (t) => t.taxNumberBr1 },
  { tag: 'TAX_NUMBER_BR2', ler: (t) => t.taxNumberBr2 },
  { tag: 'INDUSTRY', ler: (t) => t.industry },
  { tag: 'REGION', ler: (t) => t.region },
  { tag: 'TAXJURCODE', ler: (t) => t.taxJurCode },
  { tag: 'POSTAL_CODE', ler: (t) => t.postalCode },
  { tag: 'CITY', ler: (t) => t.city },
  { tag: 'PAYMENT_TERMS', ler: (t) => t.paymentTerms },
  { tag: 'WITHHOLDING_TAX_TYPE', ler: (t) => t.withholdingTaxType.join(',') || null },
  { tag: 'CREATED_ON', ler: (t) => t.createdOn },
]
function registroXml(registro) {
  const alvo = registro.target
  if (!alvo) return ''
  const campos = CAMPOS_BP.map(({ tag, ler }) => {
    const valor = ler(alvo)
    return valor === null ? `      <${tag}/>` : `      <${tag}>${escaparXml(valor)}</${tag}>`
  })
  return `    <BusinessPartner sourceKey="${escaparXml(registro.codigo)}">\n${campos.join('\n')}\n    </BusinessPartner>`
}
const bytesDe = (texto) => new TextEncoder().encode(texto).length

/** O XML é gerado dos registros de fato, não é texto de exemplo colado. */
function gerarXml(run, limiteRegistros = Number.POSITIVE_INFINITY) {
  const selado = sealPlaybook(run.playbookVersion)
  const empacotaveis = run.records.filter((r) => r.outcome === 'migrated' || r.outcome === 'reused')
  const amostra = empacotaveis.slice(0, Number.isFinite(limiteRegistros) ? limiteRegistros : undefined)
  const cabecalho = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<MigrationObject name="Business Partner" release="${escaparXml(tenantRelease)}">`,
    '  <Header>',
    `    <PlaybookVersion>${escaparXml(run.playbookVersion)}</PlaybookVersion>`,
    `    <PlaybookChecksum>${escaparXml(selado.checksum)}</PlaybookChecksum>`,
    `    <RecordCount>${empacotaveis.length}</RecordCount>`,
    `    <GeneratedAt>${simInstant().toISOString()}</GeneratedAt>`,
    '  </Header>', '  <Records>',
  ].join('\n')
  const corpo = amostra.map(registroXml).filter(Boolean).join('\n')
  const texto = `${cabecalho}\n${corpo}\n  </Records>\n</MigrationObject>`
  // bytes por registro medidos no XML de fato, não estimados
  const bytesPorRegistro = amostra.length === 0 ? 0
    : Math.round(bytesDe(amostra.map(registroXml).join('\n')) / amostra.length)
  return { texto, bytes: bytesDe(texto), registros: empacotaveis.length, bytesPorRegistro }
}

const LIMITES_CAMPO = {
  NAME_ORG1: 40, NAME_ORG2: 40, TAX_NUMBER_BR1: 14, TAX_NUMBER_BR2: 11, POSTAL_CODE: 8, BUSINESS_PARTNER: 10,
}

function conferirConformidade(run) {
  const empacotaveis = run.records.filter((r) => r.outcome === 'migrated' || r.outcome === 'reused')
  const excedidos = []
  const formatoRuim = []
  const semObrigatorio = []
  for (const r of empacotaveis) {
    const alvo = r.target
    if (!alvo) continue
    for (const { tag, ler } of CAMPOS_BP) {
      const limite = LIMITES_CAMPO[tag]
      const valor = ler(alvo)
      if (limite !== undefined && valor !== null && valor.length > limite) excedidos.push(`${r.codigo}/${tag}`)
    }
    if (alvo.taxNumberBr1 !== null && !/^\d{14}$/.test(alvo.taxNumberBr1)) formatoRuim.push(`${r.codigo}/TAX_NUMBER_BR1`)
    if (alvo.taxNumberBr2 !== null && !/^\d{11}$/.test(alvo.taxNumberBr2)) formatoRuim.push(`${r.codigo}/TAX_NUMBER_BR2`)
    if (alvo.createdOn !== null && !/^\d{4}-\d{2}-\d{2}$/.test(alvo.createdOn)) formatoRuim.push(`${r.codigo}/CREATED_ON`)
    if (alvo.taxJurCode !== null && !/^\d{7}$/.test(alvo.taxJurCode)) formatoRuim.push(`${r.codigo}/TAXJURCODE`)
    if (alvo.bpGrouping === null) semObrigatorio.push(`${r.codigo}/BP_GROUPING`)
    if (alvo.nameOrg1 === null) semObrigatorio.push(`${r.codigo}/NAME_ORG1`)
    if (alvo.region === null) semObrigatorio.push(`${r.codigo}/REGION`)
    if (alvo.taxJurCode === null) semObrigatorio.push(`${r.codigo}/TAXJURCODE`)
    if (alvo.paymentTerms === null) semObrigatorio.push(`${r.codigo}/PAYMENT_TERMS`)
    if (alvo.industry === null) semObrigatorio.push(`${r.codigo}/INDUSTRY`)
  }
  const foraDaFaixa = empacotaveis
    .filter((r) => r.target !== null && r.target.businessPartner !== null)
    .filter((r) => { const bp = r.target?.businessPartner ?? ''; return !(bp >= '1000000000' && bp <= '1999999999') })
    .map((r) => r.codigo)
  const obrigatorios = requiredFields.filter((f) => f.objeto === 'business-partner' && f.obrigatorio)
  const temPacote = run.steps.find((s) => s.id === 'package')?.status === 'completed'
  const montarCheck = (id, nome, descricao, falhas, okDetalhe) => ({
    id, nome, descricao,
    resultado: !temPacote ? 'nao-verificado' : falhas.length === 0 ? 'ok' : 'falha',
    detalhe: !temPacote ? 'Nada empacotado ainda: a esteira não chegou ao passo 8.'
      : falhas.length === 0 ? okDetalhe : `${numeroBr(falhas.length)} ocorrência(s).`,
    registrosAfetados: falhas.slice().sort(),
  })
  return [
    montarCheck('CONF-01', 'Tamanho de campo',
      'Nenhum valor excede o limite do campo no tenant (NAME_ORG1 e NAME_ORG2 em 40, TAX_NUMBER_BR1 em 14).',
      excedidos, `${numeroBr(empacotaveis.length)} registros dentro dos limites.`),
    montarCheck('CONF-02', 'Formato',
      'CNPJ e CPF só com dígitos, data em AAAA-MM-DD, domicílio fiscal com sete dígitos.',
      formatoRuim, 'Todos os campos no formato do destino.'),
    montarCheck('CONF-03', 'Integridade referencial',
      `Todo campo obrigatório do tenant preenchido (${numeroBr(obrigatorios.length)} campos declarados na configuração).`,
      semObrigatorio, 'Nenhum campo obrigatório vazio.'),
    montarCheck('CONF-04', 'Faixa de numeração externa',
      'Business Partner dentro da faixa externa do grupo de contas. Fora da faixa, o Migration Cockpit rejeita o lote inteiro.',
      foraDaFaixa, 'Todos os números dentro das faixas Z1/Z2/Z3.'),
  ]
}

/** Divide o pacote pelos dois tetos. Vale o menor dos dois. */
function dividirPacote(objetoId, registrosTotais, bytesPorRegistro) {
  const bytesTotais = registrosTotais * bytesPorRegistro
  const limiteBytes = LIMITE_ARQUIVO_MB * 1024 * 1024
  const porTamanho = bytesPorRegistro === 0 ? registrosTotais : Math.floor(limiteBytes / bytesPorRegistro)
  const registrosPorParte = Math.max(1, Math.min(porTamanho, LIMITE_REGISTROS_POR_PARTE))
  const limitante = registrosTotais <= registrosPorParte ? 'nenhum'
    : porTamanho < LIMITE_REGISTROS_POR_PARTE ? 'tamanho' : 'registros'
  const quantidade = Math.max(1, Math.ceil(registrosTotais / registrosPorParte))
  const partes = []
  let restantes = registrosTotais
  for (let i = 0; i < quantidade; i += 1) {
    const nesta = Math.min(registrosPorParte, restantes)
    restantes -= nesta
    const bytes = nesta * bytesPorRegistro
    partes.push({
      indice: i + 1,
      nomeArquivo: `KEPLER_${objetoId.toUpperCase()}_${String(i + 1).padStart(2, '0')}de${String(quantidade).padStart(2, '0')}.XML`,
      registros: nesta, bytes, megabytes: Number((bytes / (1024 * 1024)).toFixed(2)),
      checksum: hex8(hashSeed(`${objetoId}|${i + 1}|${nesta}|${bytes}`)).toUpperCase(),
    })
  }
  return { objetoId, registrosTotais, bytesPorRegistro, bytesTotais,
    megabytesTotais: Number((bytesTotais / (1024 * 1024)).toFixed(2)),
    limiteMb: LIMITE_ARQUIVO_MB, limiteRegistros: LIMITE_REGISTROS_POR_PARTE, limitante, partes }
}

/* ========================================================================== */
/* 18. RECONCILIAÇÃO                                                          */
/* ========================================================================== */

/**
 * Duas regras governam esta tela: toda diferença é EXPLICADA, nunca só numerada;
 * e o registro de defeitos é cortado pelas quatro origens, com `transformation`
 * destacada porque é a única pela qual a Monoda responde.
 */
const contarOutcome = (run, filtro, outcome) =>
  run.records.filter((r) => filtro(r.spe) && r.outcome === outcome).length

function explicarDiferenca(run, filtro) {
  return [
    { causa: 'fundidos em outro cadastro (duplicata confirmada)', quantidade: contarOutcome(run, filtro, 'merged') },
    { causa: 'reusados de Business Partner já existente no tenant', quantidade: contarOutcome(run, filtro, 'reused') },
    { causa: 'retidos, com exceção aberta e dono definido', quantidade: contarOutcome(run, filtro, 'held') },
  ].filter((e) => e.quantidade > 0)
}
const reconciliou = (run) => run.steps.find((s) => s.id === 'reconcile')?.status === 'completed'

function contagemPorSpe(run) {
  const mensuravel = reconciliou(run)
  return speIds.map((spe) => {
    const filtro = (s) => s === spe
    const origem = run.records.filter((r) => filtro(r.spe)).length
    const destino = contarOutcome(run, filtro, 'migrated') + contarOutcome(run, filtro, 'reused')
    const explicacao = explicarDiferenca(run, filtro)
    const somaExplicada = explicacao.reduce((acc, e) => acc + e.quantidade, 0)
    // `reused` está nos dois lados: entrou e saiu. Só merged e held reduzem o destino.
    const reduzem = explicacao.filter((e) => !e.causa.startsWith('reusados')).reduce((a, e) => a + e.quantidade, 0)
    return { chave: spe, mensuravel, rotulo: spe, origem, destino, diferenca: destino - origem,
      explicacao, fecha: origem - reduzem === destino && somaExplicada >= reduzem }
  })
}
function contagemTotal(run) {
  const filtro = () => true
  const origem = run.records.length
  const destino = contarOutcome(run, filtro, 'migrated') + contarOutcome(run, filtro, 'reused')
  const explicacao = explicarDiferenca(run, filtro)
  const reduzem = explicacao.filter((e) => !e.causa.startsWith('reusados')).reduce((a, e) => a + e.quantidade, 0)
  return { chave: 'total', mensuravel: reconciliou(run), rotulo: 'Fornecedores', origem, destino,
    diferenca: destino - origem, explicacao, fecha: origem - reduzem === destino }
}

/**
 * Reconciliação por valor. Só faz sentido onde há valor: contratos. Fornecedor é
 * cadastro, não tem montante — inventar um para preencher a tela seria
 * exatamente o tipo de número que não sobrevive a uma pergunta.
 */
function valorPorSpe() {
  return speIds.map((spe) => {
    const daSpe = nasajonContracts.filter((c) => c.spe === spe)
    const soma = (lista) => Number(lista.reduce((acc, c) => acc + c.valorOriginal, 0).toFixed(2))
    const naoFecha = (c) => Math.abs(c.linhas.reduce((a, l) => a + l.valorTotal, 0) - c.valorOriginal) > 0.01
    const origem = soma(daSpe)
    const pendentes = daSpe.filter((c) => c.faseFiscal !== 'concluida')
    const divergentes = daSpe.filter((c) => c.faseFiscal === 'concluida' && naoFecha(c))
    const valorBloqueado = Number((soma(pendentes) + soma(divergentes)).toFixed(2))
    const destino = Number((origem - valorBloqueado).toFixed(2))
    const explicacao = [
      { causa: `fase fiscal pendente em ${numeroBr(pendentes.length)} contrato(s)`, valor: soma(pendentes) },
      { causa: `cabeçalho que não reconcilia com as linhas em ${numeroBr(divergentes.length)} contrato(s)`, valor: soma(divergentes) },
    ].filter((e) => e.valor > 0)
    return { chave: spe, rotulo: spe, origem, destino, diferenca: Number((destino - origem).toFixed(2)),
      explicacao, fecha: Math.abs(origem - valorBloqueado - destino) <= 0.01 }
  })
}

function registroDeDefeitos(run) {
  const base = run.records.length || 1
  return defectOrigins.map((origem) => {
    const doGrupo = run.exceptions.filter((e) => e.origin === origem.id)
    const criticos = doGrupo.filter((e) => e.severidade === 'critical').length
    return { origin: origem.id, nome: origem.nome, token: origem.token,
      monodaResponsavel: origem.monodaResponsavel, donoContratual: origem.donoContratual.parte,
      total: doGrupo.length, criticos, naoCriticos: doGrupo.length - criticos,
      percentual: Number(((doGrupo.length / base) * 100).toFixed(1)) }
  })
}
function detalhePorOrigem(run, origin) {
  const porTipo = new Map()
  for (const e of run.exceptions.filter((x) => x.origin === origin)) {
    porTipo.set(e.defectTypeId, (porTipo.get(e.defectTypeId) ?? 0) + 1)
  }
  return [...porTipo.entries()].map(([id, quantidade]) => ({
    defectTypeId: id, nome: defectTypeById.get(id)?.nome ?? id,
    severidade: defectTypeById.get(id)?.severidade ?? 'non-critical',
    roteadoPara: defectTypeById.get(id)?.roteadoPara ?? '', quantidade,
  })).sort((a, b) => b.quantidade - a.quantidade || (a.defectTypeId < b.defectTypeId ? -1 : 1))
}

const contaSeveridade = (run, origin, severidade) =>
  run.exceptions.filter((e) => e.origin === origin && e.severidade === severidade).length

/** O placar dos quatro critérios de aceite. Os dois de defeito medem SÓ `transformation`. */
function placarDeAceite(run) {
  const total = run.records.length
  const passoConcluido = (id) => run.steps.find((s) => s.id === id)?.status === 'completed'
  const transformados = passoConcluido('transform') && passoConcluido('deduplicate')
    ? run.records.filter((r) => r.trail.some((t) => t.step === 'transform')).length : 0
  const validados = passoConcluido('validate')
    ? run.records.filter((r) => r.trail.some((t) => t.step === 'validate')).length : 0
  const criticosTransformacao = contaSeveridade(run, 'transformation', 'critical')
  const naoCriticosTransformacao = contaSeveridade(run, 'transformation', 'non-critical')
  const percentualNaoCritico = total === 0 ? 0 : Number(((naoCriticosTransformacao / total) * 100).toFixed(1))
  const medidas = {
    'CA-01': { valor: total === 0 ? 0 : Number(((transformados / total) * 100).toFixed(1)),
      como: `${numeroBr(transformados)} de ${numeroBr(total)} registros com passo TRANSFORM na trilha.`,
      mensuravel: passoConcluido('transform') },
    'CA-02': { valor: total === 0 ? 0 : Number(((validados / total) * 100).toFixed(1)),
      como: `${numeroBr(validados)} de ${numeroBr(total)} registros com passo VALIDATE na trilha.`,
      mensuravel: passoConcluido('validate') },
    'CA-03': { valor: criticosTransformacao,
      como: 'Exceções de origem "transformation" com severidade crítica no run corrente.',
      mensuravel: passoConcluido('validate') },
    'CA-04': { valor: percentualNaoCritico,
      como: `${numeroBr(naoCriticosTransformacao)} defeito(s) não crítico(s) de transformação sobre ${numeroBr(total)} registros.`,
      mensuravel: passoConcluido('validate') },
  }
  return criteriosDeAceite.map((criterio) => {
    const m = medidas[criterio.id] ?? { valor: 0, como: '', mensuravel: false }
    const atende = criterio.tipo === 'percentual-minimo' ? m.valor >= criterio.alvo : m.valor <= criterio.alvo
    return { criterio, gate: criterio.gate, medido: m.valor, alvo: criterio.alvo,
      atende: m.mensuravel && atende, comoMedido: m.como, mensuravel: m.mensuravel }
  })
}

/* ========================================================================== */
/* 19. ESTADO DOS GATES                                                       */
/* ========================================================================== */

/**
 * O que faz um Gate ser ponto de decisão e não reunião de status:
 *
 * - A ENTRADA É RECUSADA. Um Gate só abre se o artefato do Gate anterior estiver
 *   assinado. Não "abre com ressalva", não "abre em paralelo": não abre.
 * - A TRILHA CARREGA A VERSÃO. Assinatura dada sobre outra versão não vale para
 *   a corrente — a regra mudou, a aprovação anterior não cobre a nova.
 * - NADA AQUI É ESCRITO À MÃO. Estado, pendência e disponibilidade de evidência
 *   saem do run e das assinaturas. Gate verde por decreto é o oposto do que a
 *   tela precisa provar.
 */
function assinaturaVale(assinatura, versao) {
  if (assinatura?.decision !== 'approved') return false
  // Vale na versão em que foi dada, ou naquela para a qual foi revalidada porque
  // o artefato que ela cobre não mudou.
  return assinatura.playbookVersion === versao || assinatura.revalidadaEm === versao
}

/**
 * O artefato do G0 é escopo, recibo do extrato e playbook selado. Corrigir uma
 * regra de transformação não muda nenhum dos três — então a assinatura continua
 * cobrindo o que cobria, e isso fica registrado como revalidação em vez de a
 * cascata inteira desabar a cada correção.
 */
function baselineNaVersao(assinatura, versao) {
  if (assinatura.playbookVersion === versao) return assinatura
  const daAssinatura = ordemDaVersao(assinatura.playbookVersion)
  const corrente = ordemDaVersao(versao)
  if (daAssinatura < 0 || corrente < 0 || daAssinatura > corrente) return assinatura
  const passosDoBaseline = new Set(
    gates.find((g) => g.exigeArtefato === null).evidencias.map((e) => e.produzidaPor).filter((p) => p !== null))
  const tocada = regrasAlteradasEntre(assinatura.playbookVersion, versao)
    .some((r) => r.passos.some((passo) => passosDoBaseline.has(passo)))
  return tocada ? assinatura : { ...assinatura, revalidadaEm: versao }
}

const comResponsavel = (assinante, assinatura) => ({
  oQueAssina: assinante.oQueAssina, area: assinante.area, responsavel: ownerDaArea(assinante.area),
  assinatura, requeridas: 1, assinadas: assinatura === null ? 0 : 1,
})

/** Trilha de um Gate assinado item a item: o que varia é quantas de quantas já existem. */
function trilhaEmLote(assinante, itens, registro, versao) {
  const dadas = itens.map((id) => registro[id]).filter((s) => s !== undefined)
  const representativa = dadas.length === itens.length && dadas.length > 0 ? dadas[dadas.length - 1] ?? null : null
  return { oQueAssina: assinante.oQueAssina, area: assinante.area, responsavel: ownerDaArea(assinante.area),
    assinatura: representativa !== null && assinaturaVale(representativa, versao) ? representativa : null,
    requeridas: itens.length, assinadas: dadas.length }
}

function trilhaDoGate(gate, entrada) {
  const { approvals, playbookVersion: versao, run, assinaturasDeGate } = entrada
  const [primeiro, segundo] = gate.assinantes
  switch (gate.id) {
    case 'G0':
      return gate.assinantes.map((a, i) => {
        const baseline = assinaturaDeBaseline[i]
        return comResponsavel(a, baseline ? baselineNaVersao(baseline, versao) : null)
      })
    case 'G1':
      return [comResponsavel(primeiro, approvals.mapeamentoSme), comResponsavel(segundo, approvals.mapeamento)]
    case 'G2':
      return [trilhaEmLote(primeiro, run.clusters.map((c) => c.id), approvals.clusters, versao)]
    case 'G3':
      return [trilhaEmLote(primeiro, run.exceptions.map((e) => e.id), approvals.excecoes, versao)]
    case 'G4':
      return [comResponsavel(primeiro, approvals.pacote)]
    case 'G6':
      return [comResponsavel(primeiro, approvals.reconciliacao)]
    default:
      // G5 e G7: assinados na própria tela de Gates.
      return gate.assinantes.map((a) => comResponsavel(a, assinaturasDeGate[gate.id] ?? null))
  }
}

function artefatoAssinado(trilha, versao) {
  if (trilha.length === 0) return false
  return trilha.every((item) => {
    if (item.requeridas === 0) return false
    if (item.requeridas > 1 && item.assinadas < item.requeridas) return false
    return assinaturaVale(item.assinatura, versao)
  })
}

function pendenciasDoGate(gate, trilha, evidencias, entrada) {
  const pendencias = []
  for (const evidencia of evidencias) {
    if (!evidencia.disponivel) pendencias.push({ tipo: 'evidencia', detalhe: evidencia.titulo, quantidade: 1 })
  }
  for (const item of trilha) {
    if (item.requeridas > 1 && item.assinadas < item.requeridas) {
      pendencias.push({ tipo: gate.id === 'G3' ? 'excecoes' : 'clusters', detalhe: item.area,
        quantidade: item.requeridas - item.assinadas })
      continue
    }
    if (item.assinatura === null) { pendencias.push({ tipo: 'assinatura', detalhe: item.area, quantidade: 1 }); continue }
    if (!assinaturaVale(item.assinatura, entrada.playbookVersion)) {
      pendencias.push({ tipo: 'versao', detalhe: item.assinatura.playbookVersion, quantidade: 1 })
    }
  }
  return pendencias
}

const avaliarEvidencias = (gate, run) => gate.evidencias.map((e) => ({
  ...e,
  // Evidência fora da esteira já existe; a que a esteira produz só existe depois
  // de o passo rodar. Passo bloqueado não entrega evidência nenhuma.
  disponivel: e.produzidaPor === null || run.steps.find((s) => s.id === e.produzidaPor)?.status === 'completed',
}))

/**
 * Estado dos oito Gates, em ordem. A recusa de entrada PROPAGA: basta o artefato
 * de um Gate não estar assinado para todos os seguintes ficarem sem entrada.
 */
function estadoDosGates(entrada) {
  const assinados = new Map()
  const resultado = []
  for (const gate of gates) {
    const evidencias = avaliarEvidencias(gate, entrada.run)
    const trilha = trilhaDoGate(gate, entrada)
    const exigido = gate.exigeArtefato
    const entradaAdmitida = exigido === null || assinados.get(exigido) === true
    // Assinatura dada num Gate que não abriu não assina artefato nenhum. Sem
    // isto, bastaria assinar fora de ordem para a cascata de recusa evaporar.
    const assinado = entradaAdmitida && artefatoAssinado(trilha, entrada.playbookVersion)
    assinados.set(gate.artefato.id, assinado)
    const recusa = entradaAdmitida || exigido === null ? null : {
      artefato: exigido,
      artefatoNome: gates.find((g) => g.artefato.id === exigido)?.artefato.nome ?? exigido,
      gate: gateDoArtefato[exigido],
    }
    const pendencias = pendenciasDoGate(gate, trilha, evidencias, entrada)
    const status = !entradaAdmitida ? 'entrada-recusada'
      : assinado ? 'aprovado'
        : evidencias.some((e) => !e.disponivel) ? 'evidencia-pendente' : 'em-avaliacao'
    resultado.push({ gate, status, entradaAdmitida, recusa, artefatoAssinado: assinado, trilha, pendencias, evidencias })
  }
  return resultado
}
const gateAprovado = (estados, id) => estados.find((e) => e.gate.id === id)?.artefatoAssinado === true

/** Liberação de pagamento, derivada do estado dos Gates. */
function liberacaoDePagamento(estados) {
  const linhas = gates.map((gate) => {
    const parcela = parcelasPorGate.find((p) => p.gate === gate.id) ?? null
    const aprovado = gateAprovado(estados, gate.id)
    return { gate, parcela, aprovado, percentual: parcela === null ? 0 : parcela.percentual,
      liberado: aprovado && parcela !== null }
  })
  const liberado = linhas.filter((l) => l.liberado).reduce((acc, l) => acc + l.percentual, 0)
  return { linhas, liberado, retido: PERCENTUAL_TOTAL - liberado, total: PERCENTUAL_TOTAL }
}

/* ========================================================================== */
/* 20. REGENERAÇÃO — o que muda quando o playbook sobe de versão              */
/* ========================================================================== */

/**
 * Serve a duas coisas, e as duas precisam do mesmo cálculo: a propagação na tela
 * (cada número do painel sai daqui, nenhum é escrito à mão) e quais assinaturas
 * sobrevivem. Aprovação vale para o artefato que ela cobre: se o artefato não
 * mudou, a aprovação continua valendo e isso fica registrado; se mudou, ela cai.
 * Zerar tudo seria conservador demais, manter tudo seria mentira.
 */
const canonicalDaRegra = (r) =>
  [r.expression, r.type, r.field, r.status, r.nature, JSON.stringify(r.parametros ?? {})].join('|')
const passosDoAgente = (agent) => pipelineSteps.filter((p) => p.agent === agent).map((p) => p.id)

function regrasAlteradasEntre(de, para) {
  const antes = new Map(sealPlaybook(de).rules.map((r) => [r.id, r]))
  const depois = new Map(sealPlaybook(para).rules.map((r) => [r.id, r]))
  const ids = [...new Set([...antes.keys(), ...depois.keys()])].sort()
  return ids.filter((id) => {
    const a = antes.get(id); const b = depois.get(id)
    if (!a || !b) return true
    return canonicalDaRegra(a) !== canonicalDaRegra(b)
  }).map((id) => {
    const a = antes.get(id) ?? null; const b = depois.get(id) ?? null
    const viva = b ?? a
    return { id, agent: viva.agent, passos: passosDoAgente(viva.agent),
      expressaoDe: a?.expression ?? null, expressaoPara: b?.expression ?? null,
      parametrosDe: a?.parametros ?? null, parametrosPara: b?.parametros ?? null }
  })
}

const pacoteResumo = (run) => run.loadPackage === null ? null
  : { id: run.loadPackage.id, total: run.loadPackage.total, datasetChecksum: run.loadPackage.manifest.datasetChecksum }

function diffDeRegeneracao(antes, depois) {
  const alvosAntes = new Map(antes.records.map((r) => [r.codigo, r.target]))
  const alvosDepois = new Map(depois.records.map((r) => [r.codigo, r.target]))
  const retocados = []
  let camposRetocados = 0
  for (const [codigo, alvoDepois] of alvosDepois) {
    const alvoAntes = alvosAntes.get(codigo) ?? null
    const campos = new Set([...Object.keys(alvoAntes ?? {}), ...Object.keys(alvoDepois ?? {})])
    let mudou = 0
    for (const campo of campos) {
      if (JSON.stringify(alvoAntes?.[campo] ?? null) !== JSON.stringify(alvoDepois?.[campo] ?? null)) mudou += 1
    }
    if (mudou > 0) { retocados.push(codigo); camposRetocados += mudou }
  }
  const idsAntes = new Set(antes.exceptions.map((e) => e.id))
  const idsDepois = new Set(depois.exceptions.map((e) => e.id))
  return {
    de: antes.playbookVersion, para: depois.playbookVersion,
    checksumDe: antes.playbookChecksum, checksumPara: depois.playbookChecksum,
    regrasAlteradas: regrasAlteradasEntre(antes.playbookVersion, depois.playbookVersion),
    registrosRetocados: retocados.sort(), camposRetocados,
    excecoesFechadas: antes.exceptions.filter((e) => !idsDepois.has(e.id)),
    excecoesNovas: depois.exceptions.filter((e) => !idsAntes.has(e.id)),
    retidosDe: antes.records.filter((r) => r.outcome === 'held').length,
    retidosPara: depois.records.filter((r) => r.outcome === 'held').length,
    pacoteDe: pacoteResumo(antes), pacotePara: pacoteResumo(depois),
  }
}

/**
 * O checkpoint 1 sobrevive quando nenhuma regra do passo que ele aprova mudou: o
 * de-para é evidência de LYRA, e corrigir uma regra de ATLAS não mexe nele.
 */
const mapeamentoSobrevive = (regras) => !regras.some((r) => r.passos.includes('map'))

function carregarAssinaturas(approvals, de, para, depois) {
  const revalidar = (a) => ({ ...a, revalidadaEm: para })
  const sobrevive = (registro, vivos) => Object.fromEntries(
    Object.entries(registro).filter(([id]) => vivos.has(id)).map(([id, a]) => [id, revalidar(a)]))
  const mapeamentoVale = mapeamentoSobrevive(regrasAlteradasEntre(de, para))
  return {
    mapeamentoSme: mapeamentoVale && approvals.mapeamentoSme ? revalidar(approvals.mapeamentoSme) : null,
    mapeamento: mapeamentoVale && approvals.mapeamento ? revalidar(approvals.mapeamento) : null,
    clusters: sobrevive(approvals.clusters, new Set(depois.clusters.map((c) => c.id))),
    excecoes: sobrevive(approvals.excecoes, new Set(depois.exceptions.map((e) => e.id))),
    // Pacote e reconciliação caem SEMPRE: o artefato mudou de checksum, e
    // assinatura dada sobre outro conteúdo não vale.
    pacote: null, reconciliacao: null,
  }
}

/**
 * A próxima versão em que ESTA regra tem redação diferente, se houver. É o que a
 * tela do playbook usa para oferecer "corrigir e publicar": a correção já existe,
 * selada, numa versão adiante — adotá-la é decisão de quem revisa.
 */
function regraCorrigida(ruleId, versaoAtual) {
  const atual = sealPlaybook(versaoAtual).rules.find((r) => r.id === ruleId)
  if (!atual) return null
  for (const versao of ordemDasVersoes.slice(ordemDaVersao(versaoAtual) + 1)) {
    const candidata = sealPlaybook(versao).rules.find((r) => r.id === ruleId)
    if (candidata && canonicalDaRegra(candidata) !== canonicalDaRegra(atual)) return { versao, regra: candidata }
  }
  return null
}

/* ========================================================================== */
/* 21. O CASO DA REGRA CANDIDATA — Momento 2                                  */
/* ========================================================================== */

/**
 * Tudo aqui é DERIVADO das fixtures. A evidência, a frequência e a regra
 * candidata não dependem da chamada de rede: se ela não completar, só o texto em
 * linguagem natural troca de procedência — a tela não muda de forma.
 */
const pessoasFisicas = () => nasajonSuppliers.filter((s) => s.naturezaPessoa === 'F')

function duplasDivergentes() {
  const vistas = new Set()
  const duplas = []
  for (const s of pessoasFisicas().slice().sort(byCodigo)) {
    const contraparte = divergenciaDeRetencao(s)
    if (!contraparte) continue
    const chave = [s.codigo, contraparte.codigo].sort().join('|')
    if (vistas.has(chave)) continue
    vistas.add(chave)
    const [a, b] = [s, contraparte].sort(byCodigo)
    const campos = ['iss', 'irrf', 'inss', 'pisCofinsCsll', 'aliquotaIss']
      .filter((c) => JSON.stringify(a.retencoes[c]) !== JSON.stringify(b.retencoes[c]))
    const iguais = [
      { rotulo: 'Documento', valor: formatDoc(a.cnpjCpf) },
      { rotulo: 'CNAE', valor: a.cnae === b.cnae ? (a.cnae ?? '—') : null },
      { rotulo: 'Condição de pagamento', valor: a.condicaoPagamento === b.condicaoPagamento ? a.condicaoPagamento : null },
      { rotulo: 'Município', valor: a.municipio === b.municipio ? `${a.municipio}/${a.uf}` : null },
    ].filter((x) => x.valor !== null)
    duplas.push({ a, b, camposDivergentes: campos, iguais })
  }
  return duplas
}

/** A frequência é derivada do dado, não escolhida. */
function frequenciaDoPadrao() {
  const duplas = duplasDivergentes()
  const registros = duplas.flatMap((d) => [d.a.codigo, d.b.codigo])
  const pfComDocumentoRepetido = pessoasFisicas().filter((s) =>
    nasajonSuppliers.some((o) => o.codigo !== s.codigo && onlyDigits(o.cnpjCpf) === onlyDigits(s.cnpjCpf)))
  return {
    duplas: duplas.length, registros: registros.length,
    spes: [...new Set(duplas.flatMap((d) => [d.a.spe, d.b.spe]))].sort().length,
    pfTotais: pessoasFisicas().length,
    pfComDocumentoRepetido: pfComDocumentoRepetido.length,
    // Duplas divergentes sobre duplas possíveis: é este o denominador honesto.
    duplasPossiveis: pfComDocumentoRepetido.length / 2,
  }
}

function casoDaRegraCandidata(versao = PLAYBOOK_VERSION) {
  const duplas = duplasDivergentes()
  return {
    duplas, frequencia: frequenciaDoPadrao(),
    regra: regraVigente(REGRA_CANDIDATA, versao) ?? ruleById.get(REGRA_CANDIDATA) ?? null,
    tipoDeDefeito: defectTypeById.get(TIPO_DE_DEFEITO) ?? null,
    dono: ownerDaArea(defectTypeById.get(TIPO_DE_DEFEITO)?.roteadoPara ?? ''),
  }
}

/** O que vai para o modelo. Só os registros divergentes — nada além deles. */
function entradaParaOModelo() {
  return duplasDivergentes().map(({ a, b }) => ({
    documento: onlyDigits(a.cnpjCpf),
    registros: [a, b].map((s) => ({
      codigo: s.codigo, spe: s.spe, nome: s.razaoSocial, cnae: s.cnae,
      municipio: `${s.municipio}/${s.uf}`, condicaoPagamento: s.condicaoPagamento, retencoes: s.retencoes,
    })),
  }))
}


/* ========================================================================== */
/* 22. A CHAMADA DE REDE AUTORIZADA                                           */
/* ========================================================================== */

/**
 * A ÚNICA chamada de rede do protótipo, na tela da regra candidata. Recebe os
 * registros divergentes e devolve a hipótese em linguagem natural com a
 * evidência citada.
 *
 * O fallback é requisito, não conforto: se a chamada falhar, demorar mais de 8
 * segundos, voltar sem conteúdo utilizável ou o ambiente não permitir a
 * requisição, entra a resposta de referência — sem erro visível na tela. Nunca
 * se demonstra com risco de tela em branco.
 *
 * CONTENÇÃO DO NÃO-DETERMINISMO: o texto do modelo é apresentação e só. A
 * evidência, a frequência e a regra candidata são derivadas das fixtures; nada
 * do que o modelo devolve entra na esteira, no checksum ou no pacote.
 */
function promptDaHipotese(entrada) {
  return [
    'Você analisa dados de cadastro de fornecedores de quatro SPEs de uma transmissora de energia, em migração de um ERP legado para SAP S/4HANA.',
    '',
    'Abaixo estão pares de cadastros de pessoa física que compartilham o MESMO CPF em SPEs diferentes, com tratamento de retenção tributária divergente:',
    '',
    JSON.stringify(entrada, null, 2),
    '',
    'Responda em português do Brasil, em JSON puro, sem cercas de código, com exatamente estas chaves:',
    '{"enunciado": "...", "evidencia": ["...", "..."], "naoConfirmavel": "..."}',
    '',
    '- "enunciado": a hipótese de regra que explicaria o padrão, em uma ou duas frases.',
    '- "evidencia": lista de observações que sustentam a hipótese. CADA ITEM PRECISA CITAR os códigos dos registros.',
    '- "naoConfirmavel": o que NÃO é possível determinar a partir do dado. Esta é a parte mais importante: seja explícito sobre o limite.',
  ].join('\n')
}

function interpretarResposta(dados) {
  // A resposta vem como array de blocos de conteúdo.
  const blocos = Array.isArray(dados?.content) ? dados.content : []
  const texto = blocos.map((b) => (typeof b?.text === 'string' ? b.text : '')).join('\n').trim()
  if (!texto) return null
  const inicio = texto.indexOf('{')
  const fim = texto.lastIndexOf('}')
  if (inicio < 0 || fim <= inicio) return null
  const parsed = JSON.parse(texto.slice(inicio, fim + 1))
  if (typeof parsed?.enunciado !== 'string' || !Array.isArray(parsed?.evidencia)) return null
  return {
    enunciado: parsed.enunciado,
    evidencia: parsed.evidencia.filter((e) => typeof e === 'string'),
    naoConfirmavel: typeof parsed.naoConfirmavel === 'string' ? parsed.naoConfirmavel : hipoteseDeReferencia.naoConfirmavel,
    origem: 'ao-vivo',
  }
}

async function pedirHipotese(entrada) {
  const controlador = new AbortController()
  const relogio = setTimeout(() => controlador.abort(), TIMEOUT_HIPOTESE_MS)
  try {
    const resposta = await fetch(ENDPOINT_HIPOTESE, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      signal: controlador.signal,
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1000,
        messages: [{ role: 'user', content: promptDaHipotese(entrada) }],
      }),
    })
    if (!resposta.ok) return hipoteseDeReferencia
    const dados = await resposta.json()
    return interpretarResposta(dados) ?? hipoteseDeReferencia
  } catch {
    // Ausência de resposta não é erro de tela: é o caso previsto.
    return hipoteseDeReferencia
  } finally {
    clearTimeout(relogio)
  }
}

/* ========================================================================== */
/* 23. ESTADO DA SIMULAÇÃO — em memória, sem persistência                     */
/* ========================================================================== */

/**
 * Sem localStorage e sem sessionStorage. Recarregar volta ao estado inicial, e
 * `reset` faz o mesmo sem recarregar — é o que permite repetir a demonstração do
 * zero na frente do cliente.
 *
 * O estado guardado é só o que um humano decidiu: o recorte e as assinaturas. O
 * resultado da esteira NÃO é estado — é derivado a cada mudança. Como a esteira
 * é determinística, derivar sempre dá o mesmo que guardar, sem o risco de o
 * guardado divergir do que as regras produziriam.
 */
const signatories = {
  mapeamentoSme: { by: 'Rafael Queiroz', role: 'Monoda · SAP SME' },
  mapeamento: { by: 'Helena Duarte', role: 'Verene · Data owner' },
  duplicatas: { by: 'Ana Ribeiro', role: 'Verene · Suprimentos' },
  excecoes: { by: 'Carlos Menezes', role: 'Verene · Fiscal' },
  pacote: { by: 'Helena Duarte', role: 'Verene · Data owner' },
  carga: { by: 'Tiago Fontes', role: 'Verene · Basis' },
  aceite: { by: 'Helena Duarte', role: 'Verene · Data owner' },
}

/** Assinatura com instante determinístico. `Date.now()` quebraria a reprodutibilidade. */
const sign = (quem, playbookVersion, decision, note) => ({
  by: quem.by, role: quem.role, decision, at: simInstant().toISOString(),
  playbookVersion, note: note ?? null,
})

const selecionarRegistros = (spe) =>
  spe === 'todas' ? nasajonSuppliers : nasajonSuppliers.filter((s) => s.spe === spe)
const derivarRun = (spe, playbookVersion, approvals) =>
  runPipeline({ records: selecionarRegistros(spe), playbookVersion, approvals, spe })
/**
 * Run sobre as quatro SPEs. As filas de revisão são cross-SPE por natureza:
 * duplicata só existe entre SPEs, e a fila de exceção precisa ver o escopo
 * inteiro.
 */
const runDeTodasSpes = (playbookVersion, approvals) =>
  runPipeline({ records: nasajonSuppliers, playbookVersion, approvals, spe: 'todas' })

/**
 * O estado da onda em cada nível do roteiro. Não é atalho de fachada: assina
 * exatamente o que um humano assinaria, com os mesmos papéis e o mesmo instante
 * determinístico. O que o roteiro poupa é o tempo de clicar, não a decisão.
 */
function estadoDoNivel(nivel) {
  const v0 = PLAYBOOK_VERSION
  let approvals = emptyApprovals
  let playbookVersion = v0

  if (nivel >= NIVEIS.mapeamento) {
    approvals = { ...approvals,
      mapeamentoSme: sign(signatories.mapeamentoSme, v0, 'approved'),
      mapeamento: sign(signatories.mapeamento, v0, 'approved') }
  }
  if (nivel >= NIVEIS.duplicatas) {
    const run = runDeTodasSpes(v0, approvals)
    approvals = { ...approvals,
      clusters: Object.fromEntries(run.clusters.map((c) => [c.id, sign(signatories.duplicatas, v0, 'approved')])) }
  }
  if (nivel >= NIVEIS.excecoes) {
    const run = runDeTodasSpes(v0, approvals)
    approvals = { ...approvals,
      excecoes: Object.fromEntries(run.exceptions.map((e) => [e.id,
        // O corte no meio da palavra fica RETIDO: aprovar o registro só
        // carimbaria o corte errado. Ele sai da fila no passo 6, corrigindo a
        // regra — que é justamente o argumento do Momento 1.
        sign(signatories.excecoes, v0, e.defectTypeId === DEFEITO_QUE_SE_CORRIGE_NA_REGRA ? 'rejected' : 'approved')])) }
  }
  if (nivel >= NIVEIS.corrigido) {
    const depois = runDeTodasSpes(PROXIMA_VERSAO, approvals)
    approvals = carregarAssinaturas(approvals, v0, PROXIMA_VERSAO, depois)
    playbookVersion = PROXIMA_VERSAO
  }
  const assinaturasDeGate = {}
  if (nivel >= NIVEIS.carga) {
    approvals = { ...approvals, pacote: sign(signatories.pacote, playbookVersion, 'approved') }
    assinaturasDeGate.G5 = sign(signatories.carga, playbookVersion, 'approved')
  }
  return { playbookVersion, approvals, assinaturasDeGate }
}

/**
 * Até onde a onda já foi, derivado do estado — não de um contador. É o que
 * permite andar para a frente sem desfazer o que o apresentador fez ao vivo.
 */
function nivelAtual(estado) {
  const { approvals, playbookVersion, assinaturasDeGate } = estado
  if (approvals.mapeamentoSme === null || approvals.mapeamento === null) return NIVEIS.nada
  const run = runDeTodasSpes(playbookVersion, approvals)
  if (run.clusters.length === 0 || !run.clusters.every((c) => approvals.clusters[c.id])) return NIVEIS.mapeamento
  if (!run.exceptions.every((e) => approvals.excecoes[e.id])) return NIVEIS.duplicatas
  if (playbookVersion !== PROXIMA_VERSAO) return NIVEIS.excecoes
  if (approvals.pacote === null || assinaturasDeGate.G5 === undefined) return NIVEIS.corrigido
  return NIVEIS.carga
}

const ROTA_INICIAL = '/mission-control'
const ESTADO_INICIAL = {
  rota: ROTA_INICIAL,
  // O recorte abre em "todas": o subconjunto demonstrado cabe inteiro numa tela,
  // e assim Mission Control, reconciliação e as filas de revisão falam dos
  // mesmos registros. No projeto, com o volume cheio, o padrão é uma SPE.
  spe: 'todas',
  ciclo: 'ciclo-1',
  playbookVersion: PLAYBOOK_VERSION,
  approvals: emptyApprovals,
  assinaturasDeGate: {},
  verificacoesFiori: {},
  candidatas: {},
  regeneracao: null,
  flags: { comercial: false },
  apresentacao: { ativa: false, passo: 1, notas: false },
  /**
   * O portão da demonstração. É SINALIZAÇÃO, não segurança: a credencial está
   * aqui no arquivo e quem abrir o inspetor a lê. O que ele faz é dar uma porta
   * ao link enviado ao cliente, em vez de cair direto na tela.
   *
   * Por isso não há bloqueio por tentativa, captcha nem expiração: nada disso
   * protegeria nada e só atrapalharia quem recebeu o link legitimamente.
   */
  entrada: { liberado: false, saindo: false },
  /**
   * A camada narrada é o estado INICIAL: o protótipo abre explicando-se. Sair é
   * uma escolha ("Explorar livremente"), e retomar volta na cena onde parou.
   */
  narrativa: { ativa: true, cena: 1, automatico: false, pausado: false, cenaAoSair: 1, encerrada: false },
}

const comRun = (estado) => ({ ...estado, run: derivarRun(estado.spe, estado.playbookVersion, estado.approvals) })
const estadoInicial = () => comRun(ESTADO_INICIAL)

function reducer(estado, acao) {
  const versao = estado.playbookVersion
  const comAprovacoes = (approvals) => comRun({ ...estado, approvals })

  switch (acao.tipo) {
    case 'navegar':
      return { ...estado, rota: acao.rota }
    // Trocar de SPE ou de versão zera as assinaturas: assinatura vale para um
    // recorte e uma versão, e não atravessa nenhum dos dois.
    case 'spe':
      return comRun({ ...estado, spe: acao.spe, approvals: emptyApprovals })
    case 'ciclo':
      return { ...estado, ciclo: acao.ciclo }
    case 'versao':
      return comRun({ ...estado, playbookVersion: acao.versao, approvals: emptyApprovals, regeneracao: null })
    /**
     * Adota uma versão já selada por KANON — o que a tela chama de "corrigir e
     * publicar". Diferente de trocar de versão: aqui as assinaturas cujo
     * artefato NÃO mudou são carregadas, marcadas como revalidadas.
     */
    case 'publicar': {
      if (acao.versao === versao) return estado
      const depois = runDeTodasSpes(acao.versao, estado.approvals)
      const novas = carregarAssinaturas(estado.approvals, versao, acao.versao, depois)
      return comRun({ ...estado, playbookVersion: acao.versao, approvals: novas,
        // As assinaturas de ANTES ficam guardadas: o painel de propagação compara
        // os dois runs que existiram de fato, não um run vazio contra um assinado.
        regeneracao: { de: versao, para: acao.versao, approvalsDe: estado.approvals } })
    }
    case 'aprovar-mapeamento-sme':
      return comAprovacoes({ ...estado.approvals,
        mapeamentoSme: sign(signatories.mapeamentoSme, versao, acao.decisao, acao.nota) })
    case 'aprovar-mapeamento':
      return comAprovacoes({ ...estado.approvals,
        mapeamento: sign(signatories.mapeamento, versao, acao.decisao, acao.nota) })
    case 'decidir-cluster':
      return comAprovacoes({ ...estado.approvals,
        clusters: { ...estado.approvals.clusters,
          [acao.clusterId]: sign(signatories.duplicatas, versao, acao.decisao, acao.nota) } })
    case 'decidir-excecao':
      return comAprovacoes({ ...estado.approvals,
        excecoes: { ...estado.approvals.excecoes,
          [acao.excecaoId]: sign(signatories.excecoes, versao, acao.decisao, acao.nota) } })
    case 'assinar-pacote':
      return comAprovacoes({ ...estado.approvals, pacote: sign(signatories.pacote, versao, acao.decisao, acao.nota) })
    case 'assinar-reconciliacao':
      return comAprovacoes({ ...estado.approvals, reconciliacao: sign(signatories.pacote, versao, acao.decisao, acao.nota) })
    case 'assinar-gate': {
      if (acao.gate === 'G4') {
        return comAprovacoes({ ...estado.approvals, pacote: sign(signatories.pacote, versao, acao.decisao, acao.nota) })
      }
      if (acao.gate === 'G6') {
        return comAprovacoes({ ...estado.approvals, reconciliacao: sign(signatories.pacote, versao, acao.decisao, acao.nota) })
      }
      // Gate assinado em outra tela é no-op aqui: a decisão pertence a quem
      // revisa a evidência.
      if (acao.gate !== 'G5' && acao.gate !== 'G7') return estado
      const quem = acao.gate === 'G5' ? signatories.carga : signatories.aceite
      return { ...estado, assinaturasDeGate: { ...estado.assinaturasDeGate,
        [acao.gate]: sign(quem, versao, acao.decisao, acao.nota) } }
    }
    case 'verificacao-fiori':
      return { ...estado, verificacoesFiori: { ...estado.verificacoesFiori,
        [acao.id]: sign(signatories.pacote, versao, 'approved', acao.nota) } }
    case 'decidir-candidata':
      return { ...estado, candidatas: { ...estado.candidatas, [acao.ruleId]: {
        decisao: acao.decisao,
        // Quem decide é o dono do processo, não a engenharia. A assinatura
        // registra a decisão; ela não promove a regra — promover é ato de
        // KANON, numa nova versão selada.
        assinatura: sign(signatories.excecoes, versao, acao.decisao === 'rejeitada' ? 'rejected' : 'approved', acao.nota),
        nota: acao.nota ?? null } } }
    case 'ligar-flag':
      return { ...estado, flags: { ...estado.flags, [acao.flag]: true } }
    case 'alternar-apresentacao': {
      if (estado.apresentacao.ativa) return { ...estado, apresentacao: ESTADO_INICIAL.apresentacao }
      return reducer({ ...estado, apresentacao: { ativa: true, passo: 1, notas: false } },
        { tipo: 'ir-para-passo', n: 1 })
    }
    case 'sair-apresentacao':
      return { ...estado, apresentacao: ESTADO_INICIAL.apresentacao }
    case 'alternar-notas':
      return { ...estado, apresentacao: { ...estado.apresentacao, notas: !estado.apresentacao.notas } }
    /**
     * Leva ao passo `n` e deixa a onda no estado que ele precisa encontrar. Para
     * a frente, garante ao MENOS o nível do passo — o que o apresentador fez ao
     * vivo não é desfeito. Para trás, rebobina EXATAMENTE até ele, que é o que
     * permite remostrar um passo depois de uma pergunta.
     */
    case 'ir-para-passo': {
      const alvo = Math.min(Math.max(acao.n, 1), TOTAL_DE_PASSOS)
      const passo = passoPorNumero(alvo)
      const avancando = alvo >= estado.apresentacao.passo
      const nivel = avancando ? Math.max(passo.nivel, nivelAtual(estado)) : passo.nivel
      const preparado = estadoDoNivel(nivel)
      return comRun({
        ...estado,
        rota: passo.path,
        apresentacao: { ...estado.apresentacao, passo: alvo },
        playbookVersion: preparado.playbookVersion,
        approvals: preparado.approvals,
        assinaturasDeGate: avancando
          ? { ...estado.assinaturasDeGate, ...preparado.assinaturasDeGate }
          : preparado.assinaturasDeGate,
        regeneracao: nivel >= NIVEIS.corrigido
          ? { de: PLAYBOOK_VERSION, para: PROXIMA_VERSAO,
              approvalsDe: estadoDoNivel(NIVEIS.excecoes).approvals }
          : null,
      })
    }
    // Reiniciar a demonstração NÃO derruba o roteiro: na sala, a tecla de reset
    // serve justamente para reapresentar sem recarregar. Volta ao passo 1.
    case 'reset':
      return comRun({ ...ESTADO_INICIAL,
        apresentacao: { ...estado.apresentacao, passo: 1, notas: false },
        // Reiniciar a onda não derruba a narração: quem está assistindo continua
        // na cena em que estava. E não tranca a porta de novo: quem já entrou
        // não é mandado de volta para a tela de senha no meio da sala.
        narrativa: estado.narrativa,
        entrada: estado.entrada })

    /* ---------- portão da demonstração ---------- */
    // `liberar` entra na transição; `concluir` tira a tela de cena ~300ms depois.
    case 'entrada-liberar':
      return { ...estado, entrada: { liberado: false, saindo: true } }
    case 'entrada-concluir':
      return { ...estado, entrada: { liberado: true, saindo: false } }

    /* ---------- camada narrada ---------- */
    /**
     * Leva à cena `n` e deixa a onda no estado que ela precisa encontrar.
     *
     * Preparar não é fachada: `estadoDoNivel` assina exatamente o que um humano
     * assinaria, com os mesmos papéis e o mesmo instante determinístico. A cena
     * 11 afirma que um registro atravessou os nove passos — com a esteira parada
     * no passo 3 a trilha está pela metade e a cena mentiria.
     */
    case 'cena': {
      const alvo = Math.min(Math.max(acao.n, 1), TOTAL_DE_CENAS)
      const cena = cenaPorNumero(alvo)
      const preparado = estadoDoNivel(cena.nivel)
      return comRun({
        ...estado,
        rota: cena.path,
        // O recorte abre em "todas" e a narrativa fala das quatro SPEs o tempo
        // todo; as filas de revisão são cross-SPE por natureza.
        spe: 'todas',
        playbookVersion: preparado.playbookVersion,
        approvals: preparado.approvals,
        assinaturasDeGate: preparado.assinaturasDeGate,
        regeneracao: cena.nivel >= NIVEIS.corrigido
          ? { de: PLAYBOOK_VERSION, para: PROXIMA_VERSAO, approvalsDe: estadoDoNivel(NIVEIS.excecoes).approvals }
          : null,
        narrativa: { ...estado.narrativa, cena: alvo, encerrada: false },
      })
    }
    // Passar da última cena não sai à força: abre o encerramento, com a escolha
    // de rever ou explorar.
    case 'cena-proxima': {
      const { cena } = estado.narrativa
      if (cena >= TOTAL_DE_CENAS) {
        return { ...estado, narrativa: { ...estado.narrativa, encerrada: true, pausado: true } }
      }
      return reducer(estado, { tipo: 'cena', n: cena + 1 })
    }
    case 'cena-anterior': {
      if (estado.narrativa.encerrada) {
        return { ...estado, narrativa: { ...estado.narrativa, encerrada: false } }
      }
      return reducer(estado, { tipo: 'cena', n: estado.narrativa.cena - 1 })
    }
    case 'narrativa-explorar':
      return { ...estado, narrativa: { ...estado.narrativa, ativa: false, automatico: false,
        cenaAoSair: estado.narrativa.cena } }
    case 'narrativa-retomar':
      return reducer(
        { ...estado, narrativa: { ...estado.narrativa, ativa: true, pausado: false, encerrada: false } },
        { tipo: 'cena', n: estado.narrativa.cenaAoSair },
      )
    case 'narrativa-automatico':
      return { ...estado, narrativa: { ...estado.narrativa,
        automatico: !estado.narrativa.automatico, pausado: false } }
    case 'narrativa-pausa':
      return { ...estado, narrativa: { ...estado.narrativa, pausado: !estado.narrativa.pausado } }
    default:
      return estado
  }
}

/* ========================================================================== */
/* 24. PRIMITIVAS DE UI                                                       */
/* ========================================================================== */

/**
 * Densidade alta: software de analista, não landing page. Linha de tabela de
 * 28px, corpo de 13px, controles de 28px. Sem hero, sem card gigante, sem
 * gradiente decorativo. Ícones em 14px.
 */
const IC = 14

/** Define o contexto de superfície. Todos os tokens seguem. */
function Surface({ tipo = 'ink', className = '', children }) {
  return <div className={`${tipo === 'paper' ? 'k-paper' : 'k-ink'} ${className}`}>{children}</div>
}

function Section({ titulo, nota, acao, children, className = '', cena }) {
  // `cena` é a âncora da camada narrada: um atributo, nenhuma mudança de layout.
  return (
    <section data-cena={cena} className={`mb-5 ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="min-w-0">
          <h2 className="k-caps k-text text-[11px] font-semibold">{titulo}</h2>
          {nota ? <p className="k-text-subtle text-[11px] mt-1 max-w-3xl leading-relaxed">{nota}</p> : null}
        </div>
        {acao ? <div className="shrink-0">{acao}</div> : null}
      </div>
      {children}
    </section>
  )
}

function Card({ children, className = '', cena }) {
  return <div data-cena={cena} className={`k-bg-raised border k-bd ${className}`}>{children}</div>
}

function Botao({ children, onClick, variante = 'ghost', disabled = false, titulo, icone: Icone }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={titulo}
      className={`k-t inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium
        ${variante === 'fill' ? 'k-fill' : 'k-ghost'}`}>
      {Icone ? <Icone size={IC} strokeWidth={1.75} /> : null}
      {children}
    </button>
  )
}

/** Estado sempre com rótulo: cor nunca é o único portador de significado. */
function StateBadge({ estado, rotulo }) {
  const classe = { signed: 'k-s-signed', held: 'k-s-held', exception: 'k-s-exception', gate: 'k-s-gate' }[estado]
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 h-[18px] rounded-full text-[10px] font-medium ${classe}`}>
      <CircleDot size={9} strokeWidth={2.5} />{rotulo}
    </span>
  )
}

/** Origem de defeito: quadrado + rótulo. Forma diferente da pílula de estado. */
function DefectOrigin({ token, rotulo, compacto = false }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] k-text-muted">
      <span className={`inline-block w-2.5 h-2.5 shrink-0 k-sq-${token}`} aria-hidden="true" />
      {compacto ? null : rotulo}
    </span>
  )
}

function Kpi({ rotulo, valor, sufixo, nota, destaque = false }) {
  return (
    <div className="k-bg-raised border k-bd px-3 py-2">
      <div className="k-text-subtle text-[10px] k-caps">{rotulo}</div>
      <div className={`tnum mt-0.5 ${destaque ? 'text-xl' : 'text-lg'} k-text font-medium leading-tight`}>
        {valor}{sufixo ? <span className="text-[11px] k-text-subtle ml-1">{sufixo}</span> : null}
      </div>
      {nota ? <div className="k-text-subtle text-[10px] mt-0.5 leading-snug">{nota}</div> : null}
    </div>
  )
}

function Tabela({ colunas, children, className = '', cena }) {
  return (
    <div data-cena={cena} className={`k-scroll border k-bd ${className}`}>
      {/* Piso de largura: com o painel narrado ocupando parte da tela, sem ele a
          tabela esmaga a coluna mais longa em uma palavra por linha. Rolar dentro
          do próprio contêiner é o comportamento certo — o corpo da página nunca
          rola de lado. */}
      <table className="w-full min-w-[900px] text-[12px]">
        <thead><tr>{colunas.map((c) => <th key={c} className="k-th">{c}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function Vazio({ texto }) {
  return <div className="border k-bd k-text-subtle text-[11px] px-3 py-4 text-center">{texto}</div>
}

function Aviso({ tom = 'held', titulo, children, acao }) {
  const classe = { held: 'k-s-held', exception: 'k-s-exception', signed: 'k-s-signed', gate: 'k-s-gate' }[tom]
  return (
    <div className={`border k-bd px-3 py-2.5 mb-4 ${classe}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle size={IC} strokeWidth={1.75} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold k-caps">{titulo}</div>
          <div className="text-[11.5px] mt-1 leading-relaxed">{children}</div>
          {acao ? <div className="mt-2 flex flex-wrap gap-2">{acao}</div> : null}
        </div>
      </div>
    </div>
  )
}

/** Link interno. O roteamento é em memória: não há navegação de página. */
function Link({ para, children, className = '', ir }) {
  return (
    <button type="button" onClick={() => ir(para)} className={`k-link text-left ${className}`}>{children}</button>
  )
}

const Mono = ({ children, className = '' }) => (
  <span className={`k-mono text-[11px] ${className}`}>{children}</span>
)


/* ========================================================================== */
/* 25. TELAS — operação                                                       */
/* ========================================================================== */

/* ---------- /mission-control ------------------------------------------------ */
/**
 * A tela de operação. TODO número dela sai das fixtures: nenhum componente
 * calcula ou digita número. Onde não há extrato — pedidos, requisições e
 * posições de estoque —, o quadro mostra "não iniciado": declarar estado de dado
 * que não existe seria inventar.
 */
function MissionControlScreen({ estado, ir }) {
  const { run, ciclo } = estado
  const pacotesDoCiclo = loadPackageBoard.filter((p) => p.ciclo === ciclo)
  const porEstado = contarPorEstado(pacotesDoCiclo)
  const agentes = estadoDosAgentes(run)

  return (
    <div>
      <Section titulo={T.missionControl.escopo} nota={T.missionControl.escopoNota} cena="grade-pacotes">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <Kpi rotulo={T.demo.escopoReal} valor={numeroBr(scopeSummary.volumeTotal)} sufixo={T.missionControl.volumeReferencia} destaque />
          <Kpi rotulo={T.nav.packages} valor={numeroBr(scopeSummary.pacotes)} sufixo={T.missionControl.pacotes} destaque />
          <Kpi rotulo={T.demo.subconjunto} valor={numeroBr(volumeDemonstrado.total)} sufixo={T.comum.registros}
            nota={`${numeroBr(volumeDemonstrado.fornecedores)} fornecedores · ${numeroBr(volumeDemonstrado.contratos)} contratos · ${numeroBr(volumeDemonstrado.materiais)} materiais`} />
          <Kpi rotulo={T.missionControl.perfilados} valor={numeroBr(resumoDefeitos.registrosPerfilados)}
            sufixo={T.comum.registros} nota={T.missionControl.mapaNota} />
        </div>
        <p className="k-text-subtle text-[11px] mb-3 max-w-4xl leading-relaxed">
          {fmt(T.demo.explicacaoSubconjunto, {
            escopo: numeroBr(scopeSummary.volumeTotal), pacotes: numeroBr(scopeSummary.pacotes),
            amostra: numeroBr(volumeDemonstrado.total),
          })}
        </p>
        <div className="k-scroll">
          <div className="min-w-[720px]">
            <div className="flex items-center gap-3 mb-1.5 text-[10px] k-text-subtle">
              {packageStates.map((e) => (
                <span key={e} className="inline-flex items-center gap-1">
                  <span className={`inline-block w-2.5 h-2.5 border k-bd-strong ${
                    e === 'aprovado' ? 'k-s-signed' : e === 'retido' ? 'k-s-exception'
                      : e === 'aguardando-gate' ? 'k-s-gate' : e === 'em-processamento' ? 'k-s-held' : ''}`} />
                  {rotuloEstadoPacote[e]} <span className="tnum">({numeroBr(porEstado[e])})</span>
                </span>
              ))}
            </div>
            <table className="w-full text-[11.5px]">
              <thead><tr>
                <th className="k-th">{T.comum.objeto}</th>
                {speIds.map((s) => <th key={s} className="k-th">{s}</th>)}
                <th className="k-th">{T.comum.total}</th>
              </tr></thead>
              <tbody>
                {scopeObjects.map((objeto) => {
                  const linha = pacotesDoCiclo.filter((p) => p.objetoId === objeto.id)
                  return (
                    <tr key={objeto.id} className="k-row">
                      <td className="k-td k-text">{objeto.nome}</td>
                      {speIds.map((spe) => {
                        const p = linha.find((x) => x.spe === spe)
                        const classe = p?.estado === 'aprovado' ? 'k-s-signed' : p?.estado === 'retido' ? 'k-s-exception'
                          : p?.estado === 'aguardando-gate' ? 'k-s-gate' : p?.estado === 'em-processamento' ? 'k-s-held' : ''
                        return (
                          <td key={spe} className="k-td">
                            <div className={`px-1.5 py-1 ${classe}`}>
                              <div className="tnum text-[12px]">{numeroBr(p?.registros ?? 0)}</div>
                              <div className="text-[9.5px] opacity-80">{rotuloEstadoPacote[p?.estado ?? 'nao-iniciado']}</div>
                            </div>
                          </td>
                        )
                      })}
                      <td className="k-td tnum k-text">{numeroBr(linha.reduce((a, p) => a + p.registros, 0))}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section titulo={T.missionControl.recebimento} nota={T.missionControl.recebimentoNota} cena="recebimento">
        <Tabela colunas={[T.missionControl.arquivo, T.missionControl.declarados, T.missionControl.lidos,
          T.missionControl.layout, 'fingerprint', T.missionControl.recibo]}>
          {recebimentos.map((r) => (
            <tr key={r.arquivo.id} className="k-row">
              <td className="k-td">
                <div className="k-text">{r.arquivo.nomeArquivo}</div>
                <div className="k-text-subtle text-[10px]">{r.arquivo.spe} · {r.arquivo.formato} · {dataBr(r.arquivo.recebidoEm)}</div>
              </td>
              <td className="k-td tnum">{numeroBr(r.arquivo.registrosDeclarados)}</td>
              <td className="k-td tnum">
                <span className={r.contagemConfere ? '' : 'k-fg-exception font-medium'}>{numeroBr(r.registrosLidos)}</span>
                {r.contagemConfere ? null : <span className="k-fg-exception text-[10px] ml-1">({numeroBr(r.diferenca)})</span>}
              </td>
              <td className="k-td">
                {r.layoutValidado
                  ? <StateBadge estado="signed" rotulo={T.missionControl.validado} />
                  : <div>
                      <StateBadge estado="held" rotulo={T.missionControl.divergente} />
                      <ul className="mt-1 space-y-0.5">
                        {r.arquivo.divergenciasLayout.map((d) => (
                          <li key={d.campo} className="k-text-subtle text-[10px]"><Mono>{d.campo}</Mono> — {d.problema}</li>
                        ))}
                      </ul>
                    </div>}
              </td>
              <td className="k-td"><Mono className="k-text-muted">{r.fingerprint}</Mono></td>
              <td className="k-td">
                <div className="k-text"><Mono>{r.arquivo.recibo.numero}</Mono></div>
                {r.arquivo.recibo.aceito
                  ? null
                  : <div className="k-fg-held text-[10px] mt-0.5">{T.missionControl.comRessalva}: {r.arquivo.recibo.observacao}</div>}
              </td>
            </tr>
          ))}
        </Tabela>
      </Section>

      <Section titulo={T.missionControl.mapaDefeitos} nota={T.missionControl.mapaNota}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <div className="k-text-subtle text-[10px] k-caps mb-1">{T.missionControl.porObjeto}</div>
            <Tabela colunas={[T.comum.objeto, T.comum.registros, T.missionControl.defeitos, T.missionControl.criticos, T.missionControl.taxa]}>
              {taxaPorObjeto.map((t) => (
                <tr key={t.chave} className="k-row">
                  <td className="k-td k-text">{scopeObjects.find((o) => o.id === t.chave)?.nome ?? t.chave}</td>
                  <td className="k-td tnum">{numeroBr(t.registros)}</td>
                  <td className="k-td tnum">{numeroBr(t.defeitos)}</td>
                  <td className="k-td tnum k-fg-exception">{numeroBr(t.criticos)}</td>
                  <td className="k-td tnum">{percentualBr(t.taxa)}</td>
                </tr>
              ))}
              <tr className="k-row">
                <td className="k-td k-text font-medium">{T.comum.total}</td>
                <td className="k-td tnum font-medium">{numeroBr(resumoDefeitos.registrosPerfilados)}</td>
                <td className="k-td tnum font-medium">{numeroBr(resumoDefeitos.defeitos)}</td>
                <td className="k-td tnum font-medium k-fg-exception">{numeroBr(resumoDefeitos.criticos)}</td>
                <td className="k-td tnum font-medium">{percentualBr(resumoDefeitos.taxaGeral)}</td>
              </tr>
            </Tabela>
          </div>
          <div>
            <div className="k-text-subtle text-[10px] k-caps mb-1">{T.missionControl.porDimensao}</div>
            <Tabela colunas={[T.missionControl.porDimensao, T.missionControl.defeitos, T.missionControl.criticos, T.missionControl.taxa]}>
              {taxaPorDimensao.map((t) => (
                <tr key={t.chave} className="k-row">
                  <td className="k-td k-text">{rotuloDimensao[t.chave]}</td>
                  <td className="k-td tnum">{numeroBr(t.defeitos)}</td>
                  <td className="k-td tnum k-fg-exception">{numeroBr(t.criticos)}</td>
                  <td className="k-td tnum">{percentualBr(t.taxa)}</td>
                </tr>
              ))}
              <tr className="k-row">
                <td className="k-td k-text font-medium">{T.comum.total}</td>
                <td className="k-td tnum font-medium">
                  {numeroBr(taxaPorDimensao.reduce((a, t) => a + t.defeitos, 0))}
                </td>
                <td className="k-td tnum font-medium k-fg-exception">
                  {numeroBr(taxaPorDimensao.reduce((a, t) => a + t.criticos, 0))}
                </td>
                <td className="k-td" />
              </tr>
            </Tabela>
          </div>
        </div>
      </Section>

      <Section titulo={T.missionControl.agentes} nota={T.missionControl.agentesNota}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
          {agentes.map(({ agent, atividade, passos, regrasAplicadas }) => (
            <Card key={agent.name} className="px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="k-text font-semibold text-[12px] tracking-wide">{agent.name}</span>
                <StateBadge
                  estado={atividade === 'concluido' ? 'signed' : atividade === 'bloqueado' ? 'exception'
                    : atividade === 'em-execucao' ? 'held' : 'gate'}
                  rotulo={rotuloAtividade[atividade]} />
              </div>
              <div className="k-text-muted text-[11px] mt-0.5">{agent.papel}</div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {passos.map((p) => (
                  <span key={p.nome} className={`text-[9.5px] px-1 py-0.5 border k-bd ${
                    p.status === 'completed' ? 'k-s-signed' : p.status === 'blocked' ? 'k-s-exception' : 'k-text-subtle'}`}>
                    {p.nome}
                  </span>
                ))}
                {agent.transversal ? <span className="text-[9.5px] k-text-subtle">{T.missionControl.esteiraNota}</span> : null}
              </div>
              <div className="k-text-subtle text-[10px] mt-1.5">
                {T.missionControl.revisor}: {agent.revisor.nome} · {agent.revisor.papel}
              </div>
              {agent.transversal ? null : (
                <div className="k-text-subtle text-[10px] tnum">{numeroBr(regrasAplicadas)} {T.comum.regras.toLowerCase()}</div>
              )}
            </Card>
          ))}
        </div>
      </Section>

      <Section titulo={T.missionControl.esteira} nota={T.missionControl.esteiraNota}>
        <Tabela colunas={['#', T.missionControl.esteira, T.comum.agente, T.comum.estado, T.comum.registros, T.comum.regras]}>
          {run.steps.map((s) => (
            <tr key={s.id} className="k-row">
              <td className="k-td tnum k-text-subtle">{s.n}</td>
              <td className="k-td"><Mono className="k-text">{s.nome}</Mono></td>
              <td className="k-td k-text-muted">{s.agent}</td>
              <td className="k-td">
                <StateBadge estado={s.status === 'completed' ? 'signed' : s.status === 'blocked' ? 'exception' : 'gate'}
                  rotulo={T.estado[s.status]} />
              </td>
              <td className="k-td tnum">{numeroBr(s.registrosTocados)}</td>
              <td className="k-td">
                <div className="flex flex-wrap gap-1">
                  {s.regrasAplicadas.map((r) => (
                    <Link key={r} para={`/playbook?regra=${r}`} ir={ir}><Mono>{r}</Mono></Link>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </Tabela>
      </Section>
    </div>
  )
}

/* ---------- /playbook (documento) ------------------------------------------- */
/**
 * Tela de documento: superfície clara dentro do shell escuro. É evidência, não
 * operação. O detalhe traz "aplicada a N registros nesta onda", contado da
 * trilha do run — regra que não rodou mostra zero, e regra candidata mostra zero
 * sempre, porque proposta não executa.
 */
function PlaybookScreen({ estado, dispatch, ir, regraSelecionada }) {
  const { run, playbookVersion } = estado
  const selado = sealPlaybook(playbookVersion)
  const uso = useMemo(() => usoDasRegras(run), [run])
  const [filtroAgente, setFiltroAgente] = useState('todos')
  const [filtroObjeto, setFiltroObjeto] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [aberta, setAberta] = useState(regraSelecionada ?? null)
  const [doc, setDoc] = useState(false)

  useEffect(() => { if (regraSelecionada) setAberta(regraSelecionada) }, [regraSelecionada])

  const regras = selado.rules.filter((r) =>
    (filtroAgente === 'todos' || r.agent === filtroAgente)
    && (filtroObjeto === 'todos' || r.object === filtroObjeto)
    && (filtroTipo === 'todos' || r.type === filtroTipo))

  const detalhe = aberta ? selado.rules.find((r) => r.id === aberta) ?? null : null
  const correcao = detalhe ? regraCorrigida(detalhe.id, playbookVersion) : null

  const Select = ({ valor, onChange, opcoes, rotulo }) => (
    <label className="inline-flex items-center gap-1.5 text-[11px] k-text-subtle">
      {rotulo}
      <select value={valor} onChange={(e) => onChange(e.target.value)}
        className="k-t h-7 px-1.5 text-[11px] border k-bd-strong k-bg k-text">
        <option value="todos">{T.playbook.todos}</option>
        {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
      </select>
    </label>
  )

  return (
    <Surface tipo="paper" className="p-4 border k-bd">
      <header className="mb-4" data-cena="selo">
        <h1 className="text-[17px] k-text font-semibold">{T.playbook.titulo}</h1>
        <p className="k-text-muted text-[12px] mt-1 max-w-3xl">{T.playbook.subtitulo}</p>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px]">
          <span className="k-text-subtle">{T.playbook.selado}: <Mono className="k-text">{selado.version}</Mono></span>
          <span className="k-text-subtle">{T.playbook.checksum}: <Mono className="k-text">{selado.checksum}</Mono></span>
          <span className="k-text-subtle tnum">{numeroBr(selado.totalRegras)} {T.playbook.totalRegras}</span>
          <span className="k-text-subtle tnum">{numeroBr(selado.regrasAtivas)} {T.playbook.ativas}</span>
          <span className="k-text-subtle tnum">{numeroBr(selado.regrasCandidatas)} {T.playbook.candidatas}</span>
          <Botao onClick={() => setDoc(!doc)} icone={FileText}>{T.playbook.gerarDoc}</Botao>
        </div>
      </header>

      {doc ? (
        <Section titulo={T.playbook.docTitulo} nota={T.playbook.docNota}>
          <div className="border k-bd k-bg-raised p-3 max-h-80 overflow-auto">
            {generateDocumentation(playbookVersion).map((secao) => (
              <div key={secao.agent} className="mb-3">
                <div className="k-text font-semibold text-[12px] tracking-wide">{secao.agent}</div>
                {secao.regras.map((r) => (
                  <div key={r.id} className="mt-1.5 pl-2 border-l-2 k-bd-strong">
                    <div className="k-text text-[11.5px]"><Mono>{r.id}</Mono> — {r.titulo}</div>
                    <div className="k-text-muted text-[11px]">{r.expressao}</div>
                    <div className="k-text-subtle text-[10.5px]">{r.porque}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <div className="flex flex-wrap gap-3 mb-2">
        <Select rotulo={T.playbook.filtroAgente} valor={filtroAgente} onChange={setFiltroAgente}
          opcoes={GLOSSARIO.agentes.map((a) => ({ valor: a, rotulo: a }))} />
        <Select rotulo={T.playbook.filtroObjeto} valor={filtroObjeto} onChange={setFiltroObjeto}
          opcoes={Object.entries(rotuloObjetoRegra).map(([valor, rotulo]) => ({ valor, rotulo }))} />
        <Select rotulo={T.playbook.filtroTipo} valor={filtroTipo} onChange={setFiltroTipo}
          opcoes={ruleTypes.map((t) => ({ valor: t, rotulo: rotuloTipoRegra[t] }))} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
        <Tabela colunas={[T.comum.regra, T.comum.agente, T.comum.campo, T.comum.tipo, T.comum.estado]}>
          {regras.map((r) => (
            <tr key={`${r.id}-${r.introducedIn}`} className={`k-row cursor-pointer ${aberta === r.id ? 'k-bg-sunken' : ''}`}
              onClick={() => setAberta(r.id)}>
              <td className="k-td"><Mono className="k-text-accent">{r.id}</Mono></td>
              <td className="k-td k-text-muted">{r.agent}</td>
              <td className="k-td k-text"><Mono>{r.field}</Mono></td>
              <td className="k-td k-text-muted">{rotuloTipoRegra[r.type]}</td>
              <td className="k-td">
                <StateBadge estado={r.status === 'active' ? 'signed' : 'held'} rotulo={T.playbook.status[r.status]} />
              </td>
            </tr>
          ))}
        </Tabela>

        <div>
          {detalhe === null ? <Vazio texto={T.playbook.semRegistro} /> : (
            <Card className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Mono className="k-text-accent text-[12px]">{detalhe.id}</Mono>
                  <div className="k-text text-[12px] mt-0.5">
                    {rotuloObjetoRegra[detalhe.object]} / <Mono>{detalhe.field}</Mono>
                  </div>
                </div>
                <StateBadge estado={detalhe.status === 'active' ? 'signed' : 'held'}
                  rotulo={T.playbook.status[detalhe.status]} />
              </div>

              <dl className="mt-3 space-y-2 text-[11.5px]">
                <div>
                  <dt className="k-text-subtle text-[10px] k-caps">{T.playbook.expressao}</dt>
                  <dd className="k-text k-mono text-[11px] leading-relaxed">{detalhe.expression}</dd>
                </div>
                <div>
                  <dt className="k-text-subtle text-[10px] k-caps">{T.playbook.justificativa}</dt>
                  <dd className="k-text-muted leading-relaxed">{detalhe.rationale}</dd>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <dt className="k-text-subtle text-[10px] k-caps">{T.playbook.dono}</dt>
                    <dd className="k-text">{detalhe.owner}</dd>
                  </div>
                  <div>
                    <dt className="k-text-subtle text-[10px] k-caps">{T.playbook.entrouEm}</dt>
                    <dd className="k-text"><Mono>{detalhe.introducedIn}</Mono></dd>
                  </div>
                </div>
                {detalhe.parametros ? (
                  <div>
                    <dt className="k-text-subtle text-[10px] k-caps">{T.comum.valor}</dt>
                    <dd className="k-text">
                      {Object.entries(detalhe.parametros).map(([k, v]) => (
                        <Mono key={k} className="mr-3">{k}: {String(v)}</Mono>
                      ))}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="k-text-subtle text-[10px] k-caps">{T.comum.aplicadaA.split('{')[0].trim()}</dt>
                  <dd className="k-text">
                    {detalhe.nature === 'generative'
                      ? <span className="k-text-muted">{T.playbook.candidataNota}</span>
                      : (uso.get(detalhe.id) ?? []).length === 0
                        ? <span className="k-text-muted">{T.comum.semAplicacao}</span>
                        : (
                          <>
                            <div className="tnum">{fmt(T.comum.aplicadaA, { n: numeroBr((uso.get(detalhe.id) ?? []).length) })}</div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {(uso.get(detalhe.id) ?? []).map((c) => (
                                <Link key={c} para={`/record/${c}`} ir={ir}><Mono>{c}</Mono></Link>
                              ))}
                            </div>
                          </>
                        )}
                  </dd>
                </div>
                <div>
                  <dt className="k-text-subtle text-[10px] k-caps">{T.playbook.historico}</dt>
                  <dd>
                    {historicoDaRegra(detalhe.id).map((h, i) => (
                      <div key={`${h.versao}-${i}`} className="k-text-muted text-[11px] leading-snug mt-1">
                        <Mono className="k-text">{h.versao}</Mono> · {dataBr(h.data)} · {h.autor} · {h.tipo}
                        <div className="k-text-subtle text-[10.5px]">{h.nota}</div>
                      </div>
                    ))}
                  </dd>
                </div>
              </dl>

              {correcao ? (
                <div className="mt-3 border k-bd-strong p-2.5 k-s-held" data-cena="correcao">
                  <div className="text-[11px] font-semibold k-caps">{T.playbook.correcaoTitulo}</div>
                  <p className="text-[11.5px] mt-1 leading-relaxed">
                    {fmt(T.playbook.correcaoNota, { versao: correcao.versao })}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <div className="text-[10px] k-caps opacity-80">{T.playbook.parametroDe}</div>
                      <Mono>{Object.entries(detalhe.parametros ?? {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}</Mono>
                    </div>
                    <div>
                      <div className="text-[10px] k-caps opacity-80">{T.playbook.parametroPara}</div>
                      <Mono>{Object.entries(correcao.regra.parametros ?? {}).map(([k, v]) => `${k}: ${v}`).join(' · ')}</Mono>
                    </div>
                  </div>
                  <p className="text-[11px] mt-2 leading-relaxed opacity-90">{correcao.regra.rationale}</p>
                  <div className="mt-2">
                    <Botao variante="fill" icone={Zap}
                      onClick={() => dispatch({ tipo: 'publicar', versao: correcao.versao })}>
                      {fmt(T.playbook.publicar, { versao: correcao.versao })}
                    </Botao>
                  </div>
                </div>
              ) : null}
            </Card>
          )}
        </div>
      </div>
    </Surface>
  )
}

/* ---------- /mapping (documento) -------------------------------------------- */
/**
 * O dicionário campo a campo. A coluna Value domain (live tenant) lê os domínios
 * da configuração ATIVA, e cada linha aponta para a regra do playbook e para a
 * divergência do padrão SAP que a afeta. Não há tabela paralela mantida à mão.
 */
function MappingScreen({ estado, dispatch, ir }) {
  const { approvals, run, playbookVersion } = estado
  const [objeto, setObjeto] = useState('business-partner')
  const linhas = mappingDictionary.filter((m) => m.objeto === objeto)
  const liberado = approvals.mapeamentoSme?.decision === 'approved' && approvals.mapeamento?.decision === 'approved'
  const bloqueado = run.steps.find((s) => s.id === 'transform')?.status === 'blocked'

  return (
    <Surface tipo="paper" className="p-4 border k-bd">
      <header className="mb-4">
        <h1 className="text-[17px] k-text font-semibold">{T.mapping.titulo}</h1>
        <p className="k-text-muted text-[12px] mt-1 max-w-3xl">{T.mapping.subtitulo}</p>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] k-text-subtle">
          <span>tenant: <Mono className="k-text">{tenantId}</Mono></span>
          <span>{tenantRelease}</span>
          <span>{T.shell.versaoPlaybook}: <Mono className="k-text">{playbookVersion}</Mono></span>
        </div>
      </header>

      {bloqueado ? (
        <Aviso tom="held" titulo={T.mapping.avisoTitulo}
          acao={
            <>
              <Botao variante={approvals.mapeamentoSme ? 'ghost' : 'fill'} icone={ClipboardCheck}
                disabled={Boolean(approvals.mapeamentoSme)}
                onClick={() => dispatch({ tipo: 'aprovar-mapeamento-sme', decisao: 'approved' })}>
                {T.mapping.aprovarSme}
              </Botao>
              <Botao variante={approvals.mapeamento ? 'ghost' : 'fill'} icone={PenLine}
                disabled={Boolean(approvals.mapeamento)}
                onClick={() => dispatch({ tipo: 'aprovar-mapeamento', decisao: 'approved' })}>
                {T.mapping.aprovarOwner}
              </Botao>
            </>
          }>
          {T.mapping.aviso}
        </Aviso>
      ) : liberado ? (
        <div className="border k-bd k-s-signed px-3 py-2 mb-4 text-[11.5px]">
          <div className="font-semibold text-[11px] k-caps">{T.mapping.liberado}</div>
          {[approvals.mapeamentoSme, approvals.mapeamento].filter(Boolean).map((a, i) => (
            <div key={i} className="mt-0.5">
              {T.mapping.aprovadoPor} {a.by} · {a.role} · {dataHoraBr(a.at)} · {T.gates.sobreVersao} <Mono>{a.playbookVersion}</Mono>
              {a.revalidadaEm ? <> · {T.gates.revalidada} <Mono>{a.revalidadaEm}</Mono></> : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5 mb-2">
        {mappedObjects.map((o) => (
          <button key={o} type="button" onClick={() => setObjeto(o)}
            className={`k-t h-7 px-2.5 text-[11px] border ${objeto === o ? 'k-fill' : 'k-ghost'}`}>
            {o}
          </button>
        ))}
      </div>

      <Tabela cena="dicionario" colunas={[T.mapping.campoOrigem, T.mapping.campoDestino, T.mapping.valueDomain,
        T.mapping.regra, T.mapping.divergencia, T.mapping.obrigatorio]}>
        {linhas.map((m) => {
          const dominio = m.valueDomainId ? valueDomainById[m.valueDomainId] : null
          const div = m.divergenciaId ? divergenciaById[m.divergenciaId] : null
          return (
            <tr key={m.id} className="k-row align-top">
              <td className="k-td">
                <Mono className="k-text">{m.campoOrigem}</Mono>
                <div className="k-text-subtle text-[10px]">{m.campoOrigemDescricao}</div>
              </td>
              <td className="k-td">
                <Mono className="k-text">{m.campoAlvo}</Mono>
                <div className="k-text-subtle text-[10px]">{m.campoAlvoDescricao}</div>
                <div className="k-text-muted text-[10.5px] mt-1">{m.regraConversao}</div>
              </td>
              <td className="k-td">
                {dominio === null ? <span className="k-text-subtle text-[11px]">—</span> : (
                  <div>
                    <Mono className="k-text">{dominio.id}</Mono>
                    {dominio.divergeDoPadraoSap
                      ? <div className="mt-0.5"><StateBadge estado="held" rotulo={T.mapping.naoPadraoSap} /></div> : null}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dominio.entradas.map((e) => (
                        <span key={e.codigo} className="text-[10px] border k-bd px-1 k-text-muted" title={e.texto}>
                          {e.codigo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </td>
              <td className="k-td">
                {m.ruleId ? <Link para={`/playbook?regra=${m.ruleId}`} ir={ir}><Mono>{m.ruleId}</Mono></Link>
                  : <span className="k-text-subtle text-[11px]">—</span>}
                <div className="k-text-subtle text-[10px] mt-1">{m.tratamentoExcecao}</div>
              </td>
              <td className="k-td">
                {div === null ? <span className="k-text-subtle text-[11px]">—</span> : (
                  <div>
                    <Mono className="k-text-accent">{div.id}</Mono>
                    <div className="k-text text-[10.5px]">{div.titulo}</div>
                  </div>
                )}
              </td>
              <td className="k-td k-text-muted text-[11px]">{m.obrigatorio ? T.comum.sim : T.comum.nao}</td>
            </tr>
          )
        })}
      </Tabela>

      <Section className="mt-5" titulo={T.mapping.divergenciasTitulo} nota={T.mapping.divergenciaNota}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {divergenciasDoPadraoSap.map((d) => (
            <Card key={d.id} className="p-2.5">
              <div className="flex items-center gap-2">
                <Mono className="k-text-accent">{d.id}</Mono>
                <span className="k-text text-[12px] font-medium">{d.titulo}</span>
              </div>
              <p className="k-text-muted text-[11px] mt-1 leading-relaxed">{d.descricao}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-[10.5px]">
                <div>
                  <div className="k-text-subtle k-caps text-[9.5px]">padrão SAP</div>
                  <div className="k-text-muted">{d.padraoSap}</div>
                </div>
                <div>
                  <div className="k-text-subtle k-caps text-[9.5px]">tenant Verene</div>
                  <div className="k-text-muted">{d.configuracaoVerene}</div>
                </div>
              </div>
              <p className="k-text text-[11px] mt-2 leading-relaxed">{d.impacto}</p>
            </Card>
          ))}
        </div>
      </Section>
    </Surface>
  )
}

/* ---------- /record/:id ------------------------------------------------------ */
/**
 * Rastreabilidade em nível de campo. Dois casos navegáveis: um fornecedor e uma
 * LINHA DE CONTRATO, que roda pela mesma esteira, com o mesmo guarda de KANON.
 */
function TrilhaTabela({ trail, ir }) {
  return (
    <Tabela cena="trilha" colunas={['#', T.record.passo, T.comum.agente, T.comum.regra, T.shell.versaoPlaybook,
      T.comum.campo, T.record.antes, T.record.depois, T.record.instante]}>
      {trail.map((t) => (
        <tr key={t.seq} className="k-row align-top">
          <td className="k-td tnum k-text-subtle">{t.seq}</td>
          <td className="k-td"><Mono className="k-text">{pipelineSteps.find((s) => s.id === t.step)?.nome}</Mono></td>
          <td className="k-td k-text-muted">{t.agent}</td>
          <td className="k-td"><Link para={`/playbook?regra=${t.ruleId}`} ir={ir}><Mono>{t.ruleId}</Mono></Link></td>
          <td className="k-td"><Mono className="k-text-muted">{t.playbookVersion}</Mono></td>
          <td className="k-td"><Mono className="k-text">{t.field}</Mono></td>
          <td className="k-td k-text-muted break-all">{t.before ?? '—'}</td>
          <td className="k-td k-text break-all">{t.after ?? '—'}</td>
          <td className="k-td k-text-subtle text-[10.5px] whitespace-nowrap">
            {dataHoraBr(t.at)}
            {t.note ? <div className="k-text-subtle text-[10px] mt-0.5 max-w-[280px] whitespace-normal">{t.note}</div> : null}
          </td>
        </tr>
      ))}
    </Tabela>
  )
}

function RecordScreen({ estado, ir, id }) {
  const { run, playbookVersion } = estado
  const registro = run.records.find((r) => r.codigo === id) ?? null
  const linha = registro === null ? linhaDeContratoPorId(id) : null
  const resultadoLinha = linha ? runContractLine(linha.contrato, linha.linha, playbookVersion) : null

  const casos = (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="k-text-subtle text-[10px] k-caps">{T.record.casos}</span>
      <Botao icone={Users} onClick={() => ir(`/record/${CASO_FORNECEDOR}`)}
        variante={id === CASO_FORNECEDOR ? 'fill' : 'ghost'}>
        {T.record.casoFornecedor} {CASO_FORNECEDOR}
      </Botao>
      <Botao icone={FileText} onClick={() => ir(`/record/${CASO_LINHA_CONTRATO}`)}
        variante={id === CASO_LINHA_CONTRATO ? 'fill' : 'ghost'}>
        {T.record.casoContrato} {CASO_LINHA_CONTRATO}
      </Botao>
      <span className="k-text-subtle text-[10.5px]">{T.record.contratoNota}</span>
    </div>
  )

  if (registro === null && resultadoLinha === null) {
    return <div>{casos}<Vazio texto={T.record.naoEncontrado} /></div>
  }

  if (resultadoLinha) {
    const { contrato, linha: l } = linha
    const alvo = resultadoLinha.target
    return (
      <div>
        {casos}
        <Section titulo={`${T.record.titulo} · ${resultadoLinha.id}`} nota={T.record.subtitulo}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
            <Card className="p-3">
              <div className="k-text-subtle text-[10px] k-caps mb-1.5">{T.record.valorOrigem}</div>
              <dl className="text-[11.5px] space-y-1">
                {[[T.record.campos.contrato, contrato.numero], [T.record.campos.spe, contrato.spe], [T.record.campos.fornecedor, contrato.fornecedorCodigo],
                  [T.record.campos.objeto, contrato.objeto], [T.record.campos.item, String(l.item)], [T.record.campos.descricao, l.descricao],
                  [T.record.campos.unidade, l.unidadeMedida], [T.record.campos.quantidade, numeroBr(l.quantidade)],
                  [T.record.campos.precoUnitario, moedaBr(l.precoUnitario)], [T.record.campos.valorTotal, moedaBr(l.valorTotal)],
                  [T.record.campos.centroCusto, l.centroCusto], [T.record.campos.faseFiscal, contrato.faseFiscal]].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="k-text-subtle w-36 shrink-0">{k}</dt><dd className="k-text">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
            <Card className="p-3">
              <div className="k-text-subtle text-[10px] k-caps mb-1.5">{T.record.valorFinal}</div>
              {alvo === null ? <div className="k-fg-exception text-[11.5px]">{T.record.retido}</div> : (
                <dl className="text-[11.5px] space-y-1">
                  {Object.entries(alvo).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="k-text-subtle w-36 shrink-0"><Mono>{k}</Mono></dt>
                      <dd className="k-text">{v === null ? '—' : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {dominioUom ? (
                <div className="k-text-subtle text-[10px] mt-2">
                  {T.mapping.valueDomain}: {dominioUom.entradas.map((e) => e.codigo).join(' · ')}
                </div>
              ) : null}
            </Card>
          </div>
          <TrilhaTabela trail={resultadoLinha.trail} ir={ir} />
          {resultadoLinha.exceptions.length > 0 ? (
            <div className="mt-3">
              <div className="k-text-subtle text-[10px] k-caps mb-1">{T.record.excecoes}</div>
              {resultadoLinha.exceptions.map((e) => (
                <div key={e.id} className="border k-bd px-2.5 py-2 mb-1 text-[11.5px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <DefectOrigin token={tokenDaOrigem(e.origin)} rotulo={defectOriginById[e.origin].nome} />
                    <Mono className="k-text-accent">{e.defectTypeId}</Mono>
                    <span className="k-text">{e.nome}</span>
                    <StateBadge estado={e.severidade === 'critical' ? 'exception' : 'held'}
                      rotulo={e.severidade === 'critical' ? T.comum.critico : T.comum.naoCritico} />
                  </div>
                  <div className="k-text-muted mt-1">{e.mensagem}</div>
                  <div className="k-text-subtle text-[10.5px] mt-0.5">{T.exceptions.roteadoPara}: {e.roteadoPara}</div>
                </div>
              ))}
            </div>
          ) : null}
        </Section>
      </div>
    )
  }

  const s = registro.source
  return (
    <div>
      {casos}
      <Section titulo={`${T.record.titulo} · ${registro.codigo}`} nota={T.record.subtitulo}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          <Card className="p-3">
            <div className="k-text-subtle text-[10px] k-caps mb-1.5">{T.record.valorOrigem}</div>
            <dl className="text-[11.5px] space-y-1">
              {[[T.record.campos.codigo, s.codigo], [T.record.campos.spe, s.spe], [T.record.campos.razaoSocial, s.razaoSocial],
                [T.record.campos.nomeFantasia, s.nomeFantasia ?? '—'], [T.record.campos.documento, formatDoc(s.cnpjCpf)],
                [T.record.campos.cnae, s.cnae ?? '—'], [T.record.campos.municipio, `${s.municipio}/${s.uf}`],
                [T.record.campos.codigoIbge, s.codigoIbge ?? '—'], [T.record.campos.cep, s.cep],
                [T.record.campos.condicaoPagamento, s.condicaoPagamento], [T.record.campos.dataCadastro, dataBr(s.dataCadastro)]].map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="k-text-subtle w-36 shrink-0">{k}</dt><dd className="k-text break-words">{v}</dd>
                </div>
              ))}
            </dl>
            {s._plantedDefect.length > 0 ? (
              <div className="mt-2 space-y-1">
                {s._plantedDefect.map((d, i) => (
                  <div key={i} className="text-[10.5px] k-text-muted flex items-start gap-1.5">
                    <span className={`inline-block w-2.5 h-2.5 mt-0.5 shrink-0 k-sq-${d.origin.replace('defect-', '')}`} />
                    <span><Mono>{d.field}</Mono> — {d.note}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div className="k-text-subtle text-[10px] k-caps mb-1.5">{T.record.valorFinal}</div>
              <StateBadge
                estado={registro.outcome === 'held' ? 'exception' : registro.outcome === 'merged' ? 'gate' : 'signed'}
                rotulo={T.estado[registro.outcome]} />
            </div>
            {registro.target === null ? <div className="k-fg-exception text-[11.5px]">{T.record.retido}</div> : (
              <dl className="text-[11.5px] space-y-1">
                {Object.entries(registro.target).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="k-text-subtle w-36 shrink-0"><Mono>{k}</Mono></dt>
                    <dd className="k-text break-words">
                      {v === null ? '—' : Array.isArray(v) ? (v.join(', ') || '—') : String(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {registro.resolvidoPara ? (
              <div className="k-text-subtle text-[10.5px] mt-2">
                {T.duplicates.crossReference}: <Mono className="k-text">{registro.resolvidoPara}</Mono>
              </div>
            ) : null}
          </Card>
        </div>
        <TrilhaTabela trail={registro.trail} ir={ir} />
        {registro.exceptions.length > 0 ? (
          <div className="mt-3">
            <div className="k-text-subtle text-[10px] k-caps mb-1">{T.record.excecoes}</div>
            {registro.exceptions.map((e) => (
              <div key={e.id} className="border k-bd px-2.5 py-2 mb-1 text-[11.5px]">
                <div className="flex flex-wrap items-center gap-2">
                  <DefectOrigin token={tokenDaOrigem(e.origin)} rotulo={defectOriginById[e.origin].nome} />
                  <Mono className="k-text-accent">{e.defectTypeId}</Mono>
                  <span className="k-text">{e.nome}</span>
                  <StateBadge estado={e.severidade === 'critical' ? 'exception' : 'held'}
                    rotulo={e.severidade === 'critical' ? T.comum.critico : T.comum.naoCritico} />
                </div>
                <div className="k-text-muted mt-1">{e.mensagem}</div>
                <div className="k-text-subtle text-[10.5px] mt-0.5">{T.exceptions.roteadoPara}: {e.roteadoPara}</div>
              </div>
            ))}
          </div>
        ) : null}
      </Section>
    </div>
  )
}


/* ========================================================================== */
/* 26. TELAS — revisão e decisão                                              */
/* ========================================================================== */

/* ---------- /review/duplicates ---------------------------------------------- */
/**
 * O merge NUNCA é automático: as ações são confirmar, rejeitar ou dividir, uma a
 * uma, e o código aposentado mantém cross-reference visível depois do merge.
 */
function DuplicatesScreen({ estado, dispatch, ir }) {
  const { approvals, playbookVersion } = estado
  // As filas de revisão são cross-SPE por natureza: duplicata só existe entre SPEs.
  const run = useMemo(() => runDeTodasSpes(playbookVersion, approvals), [playbookVersion, approvals])
  const existentes = useMemo(() => jaCadastradosNoTenant(nasajonSuppliers), [])
  const [aberto, setAberto] = useState(null)

  return (
    <div>
      <Section titulo={T.duplicates.fila} nota={T.duplicates.scoreNota} cena="clusters">
        {run.clusters.length === 0 ? <Vazio texto={T.duplicates.semCluster} /> : (
          <div className="space-y-2">
            {run.clusters.map((c) => {
              const analise = analisarCluster(c, nasajonSuppliers)
              const assinatura = approvals.clusters[c.id] ?? null
              const expandido = aberto === c.id
              return (
                <Card key={c.id} className="p-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setAberto(expandido ? null : c.id)}
                        className="k-t k-text inline-flex items-center gap-1 text-[12px]">
                        {expandido ? <ChevronDown size={IC} /> : <ChevronRight size={IC} />}
                        <Mono className="k-text-accent">{c.id}</Mono>
                      </button>
                      <span className="k-text-subtle text-[11px]">{T.duplicates.documento}: <Mono className="k-text">{formatDoc(c.documento)}</Mono></span>
                      <span className="k-text-subtle text-[11px]">{c.spes.join(' · ')}</span>
                      <span className="k-text tnum text-[12px]">{T.duplicates.score} {numeroBr(analise.score)}/100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {assinatura
                        ? <StateBadge estado={assinatura.decision === 'approved' ? 'signed' : 'held'}
                            rotulo={`${T.duplicates.decidido} ${assinatura.by}`} />
                        : (
                          <>
                            <Botao variante="fill" icone={Check}
                              onClick={() => dispatch({ tipo: 'decidir-cluster', clusterId: c.id, decisao: 'approved' })}>
                              {T.duplicates.confirmar}
                            </Botao>
                            <Botao icone={X}
                              onClick={() => dispatch({ tipo: 'decidir-cluster', clusterId: c.id, decisao: 'rejected' })}>
                              {T.duplicates.rejeitarM}
                            </Botao>
                            <Botao icone={SplitSquareHorizontal}
                              onClick={() => dispatch({ tipo: 'decidir-cluster', clusterId: c.id, decisao: 'rejected',
                                nota: 'Cluster dividido: os cadastros seguem separados.' })}>
                              {T.duplicates.dividir}
                            </Botao>
                          </>
                        )}
                    </div>
                  </div>
                  <div className="mt-1.5 text-[11px] k-text-muted">
                    {T.duplicates.sobrevivente}: <Mono className="k-text">{c.sobreviventePropostoCodigo}</Mono>
                    {' · '}{T.duplicates.razaoProposta}: <span className="k-text">{c.razaoSocialProposta}</span>
                  </div>
                  {assinatura?.decision === 'approved' ? (
                    <div className="mt-1 text-[10.5px] k-text-subtle">
                      {T.duplicates.aposentado}: {c.membros.filter((m) => m !== c.sobreviventePropostoCodigo)
                        .map((m) => `${m} → ${c.sobreviventePropostoCodigo}`).join(' · ')}
                    </div>
                  ) : null}

                  {expandido ? (
                    <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div>
                        <div className="k-text-subtle text-[10px] k-caps mb-1">{T.duplicates.sinal}</div>
                        <Tabela colunas={[T.duplicates.sinal, T.duplicates.peso, T.duplicates.confere, T.comum.evidencia]}>
                          {analise.sinais.map((s) => (
                            <tr key={s.id} className="k-row align-top">
                              <td className="k-td k-text">{s.rotulo}</td>
                              <td className="k-td tnum">{numeroBr(s.peso)}</td>
                              <td className="k-td">
                                {s.bate ? <Check size={IC} className="k-fg-signed" /> : <Minus size={IC} className="k-text-subtle" />}
                              </td>
                              <td className="k-td k-text-muted text-[11px]">{s.detalhe}</td>
                            </tr>
                          ))}
                        </Tabela>
                        <div className="k-text-subtle text-[10.5px] mt-1">{c.motivoDaProposta}</div>
                      </div>
                      <div>
                        <div className="k-text-subtle text-[10px] k-caps mb-1">{T.duplicates.divergentes}</div>
                        <Tabela colunas={[T.comum.campo, ...c.membros]}>
                          {analise.divergentes.map((d) => (
                            <tr key={d.campo} className="k-row">
                              <td className="k-td k-text">{d.rotulo}</td>
                              {c.membros.map((m) => (
                                <td key={m} className="k-td k-text-muted break-all">
                                  {d.valores.find((v) => v.codigo === m)?.valor || '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </Tabela>
                        <div className="k-text-subtle text-[10.5px] mt-1">
                          {T.duplicates.iguais}: {analise.iguais.join(', ')}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {c.membros.map((m) => (
                            <Link key={m} para={`/record/${m}`} ir={ir}><Mono>{m}</Mono></Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </Card>
              )
            })}
          </div>
        )}
      </Section>

      <Section titulo={T.duplicates.jaExistem} nota={T.duplicates.jaExistemNota}>
        <Tabela colunas={[T.comum.codigo, T.duplicates.razaoNasajon, T.comum.businessPartner, T.duplicates.razaoTenant, T.comum.acao]}>
          {existentes.map(({ origem, existente }) => (
            <tr key={origem.codigo} className="k-row">
              <td className="k-td"><Link para={`/record/${origem.codigo}`} ir={ir}><Mono>{origem.codigo}</Mono></Link></td>
              <td className="k-td k-text">{origem.razaoSocial}</td>
              <td className="k-td"><Mono className="k-text">{existente.businessPartner}</Mono></td>
              <td className="k-td k-text-muted">{existente.razaoSocial}</td>
              <td className="k-td"><StateBadge estado="gate" rotulo={T.duplicates.reusar} /></td>
            </tr>
          ))}
        </Tabela>
        <div className="k-text-subtle text-[10.5px] mt-1 tnum">
          {numeroBr(existentes.length)} {T.comum.de} {numeroBr(existingSuppliers.length)} — {tenantId}
        </div>
      </Section>
    </div>
  )
}

/* ---------- /review/exceptions ----------------------------------------------- */
/**
 * Classifica cada retenção em técnica (SAP SME) ou de negócio (data owner), com
 * dono nomeado, prazo e estado. NÃO EXISTE "aplicar valor padrão" em lugar
 * nenhum da tela, de propósito.
 */
function ExceptionsScreen({ estado, dispatch, ir }) {
  const { approvals, playbookVersion } = estado
  const run = useMemo(() => runDeTodasSpes(playbookVersion, approvals), [playbookVersion, approvals])
  const propostas = useMemo(() => [
    ...run.records.flatMap((r) => propostasParaFornecedor(r.codigo)),
    ...propostasDeMaterial(), ...propostasDeServico(),
  ], [run])

  return (
    <div>
      <Section titulo={T.exceptions.fila} nota={T.exceptions.semValorPadrao}>
        {run.exceptions.length === 0 ? <Vazio texto={T.exceptions.semExcecao} /> : (
          <Tabela colunas={[T.comum.registro, T.comum.origem, T.comum.defeito, T.exceptions.classe,
            T.exceptions.roteadoPara, T.comum.prazo, T.comum.acoes]}>
            {run.exceptions.map((e) => {
              const decisao = approvals.excecoes[e.id] ?? null
              const naoSeResolveAprovando = e.defectTypeId === DEFEITO_QUE_SE_CORRIGE_NA_REGRA
              return (
                <tr key={e.id} className="k-row align-top">
                  <td className="k-td"><Link para={`/record/${e.recordCode}`} ir={ir}><Mono>{e.recordCode}</Mono></Link></td>
                  <td className="k-td">
                    <DefectOrigin token={tokenDaOrigem(e.origin)} rotulo={defectOriginById[e.origin].nome} />
                  </td>
                  <td className="k-td">
                    <div className="flex items-center gap-1.5">
                      <Mono className="k-text-accent">{e.defectTypeId}</Mono>
                      <StateBadge estado={e.severidade === 'critical' ? 'exception' : 'held'}
                        rotulo={e.severidade === 'critical' ? T.comum.critico : T.comum.naoCritico} />
                    </div>
                    <div className="k-text text-[11px] mt-0.5">{e.nome}</div>
                    <div className="k-text-muted text-[10.5px] mt-0.5 max-w-md">{e.mensagem}</div>
                    {naoSeResolveAprovando ? (
                      <div className="mt-1.5 border k-bd-strong k-s-exception px-2 py-1.5 max-w-md">
                        <div className="text-[10px] font-semibold k-caps">{T.exceptions.corrigirRegra}</div>
                        <div className="text-[10.5px] mt-0.5 leading-relaxed">{T.exceptions.corrigirRegraNota}</div>
                        <div className="mt-1">
                          <Botao icone={GitBranch} onClick={() => ir(`/playbook?regra=${REGRA_DA_CORRECAO}`)}>
                            {T.exceptions.irParaRegra}
                          </Botao>
                        </div>
                      </div>
                    ) : null}
                  </td>
                  <td className="k-td k-text-muted">
                    {e.classe === 'tecnica' ? T.exceptions.tecnica : T.exceptions.negocio}
                  </td>
                  <td className="k-td k-text">
                    {e.roteadoPara}
                    <div className="k-text-subtle text-[10px]">{ownerDaArea(e.roteadoPara)?.nome ?? ''}</div>
                  </td>
                  <td className="k-td tnum k-text-muted">{numeroBr(e.prazoDias)} {T.comum.dias}</td>
                  <td className="k-td">
                    {decisao
                      ? <StateBadge estado={decisao.decision === 'approved' ? 'signed' : 'held'}
                          rotulo={`${T.exceptions.decidida} · ${decisao.by}`} />
                      : (
                        <div className="flex flex-col gap-1">
                          <Botao variante="fill" icone={Check}
                            onClick={() => dispatch({ tipo: 'decidir-excecao', excecaoId: e.id, decisao: 'approved' })}>
                            {T.exceptions.liberar}
                          </Botao>
                          <Botao icone={Lock}
                            onClick={() => dispatch({ tipo: 'decidir-excecao', excecaoId: e.id, decisao: 'rejected' })}>
                            {T.exceptions.manterRetido}
                          </Botao>
                        </div>
                      )}
                  </td>
                </tr>
              )
            })}
          </Tabela>
        )}
      </Section>

      <Section titulo={T.exceptions.enriquecimento} nota={T.exceptions.enriquecimentoNota} cena="enriquecimento">
        <Tabela colunas={[T.comum.registro, T.comum.campo, T.exceptions.proposta, T.exceptions.fonte, T.comum.regra]}>
          {propostas.map((p) => (
            <tr key={p.id} className="k-row align-top">
              <td className="k-td"><Mono className="k-text">{p.recordCode}</Mono></td>
              <td className="k-td k-text">{p.rotuloCampo}</td>
              <td className="k-td">
                {p.valorProposto === null
                  ? <StateBadge estado="held" rotulo={T.exceptions.semProposta} />
                  : <Mono className="k-text">{p.valorProposto}</Mono>}
              </td>
              <td className="k-td">
                {p.evidencia
                  ? <div className="text-[11px]">
                      <div className="k-text">{p.evidencia.fonte}</div>
                      <div className="k-text-muted">{p.evidencia.referencia}</div>
                      <div className="k-text-subtle text-[10.5px] max-w-md">{p.evidencia.detalhe}</div>
                    </div>
                  : <div className="k-text-muted text-[10.5px] max-w-md">{p.motivoSemProposta}</div>}
              </td>
              <td className="k-td"><Link para={`/playbook?regra=${p.ruleId}`} ir={ir}><Mono>{p.ruleId}</Mono></Link></td>
            </tr>
          ))}
        </Tabela>
      </Section>
    </div>
  )
}

/* ---------- Momento 1: a propagação ----------------------------------------- */
/**
 * A ÚNICA animação do protótipo: cinco nós, ~200 ms de escalonamento. Todos os
 * números saem do diff entre os dois runs; nenhum é escrito à mão. Depois da
 * animação o painel PERMANECE — o apresentador precisa poder apontar para ele.
 */
function PropagationTrail({ diff, ir }) {
  const regra = diff.regrasAlteradas.find((r) => r.id === REGRA_DA_CORRECAO) ?? diff.regrasAlteradas[0] ?? null
  const nos = [
    { chave: 'regra', icone: GitBranch, para: `/playbook?regra=${regra?.id ?? REGRA_DA_CORRECAO}`,
      detalhe: fmt(T.momento1.detalhe.regra, { regra: regra?.id ?? REGRA_DA_CORRECAO,
        de: String(regra?.parametrosDe?.corte ?? '—'), para: String(regra?.parametrosPara?.corte ?? '—') }) },
    { chave: 'selo', icone: Shield, para: '/playbook',
      detalhe: fmt(T.momento1.detalhe.selo, { versao: diff.para, checksum: diff.checksumPara }) },
    { chave: 'onda', icone: RefreshCw, para: '/review/exceptions',
      detalhe: fmt(T.momento1.detalhe.onda, { fechadas: numeroBr(diff.excecoesFechadas.length),
        retocados: numeroBr(diff.registrosRetocados.length) }) },
    { chave: 'pacote', icone: Package, para: '/packages',
      detalhe: fmt(T.momento1.detalhe.pacote, { id: diff.pacotePara?.id ?? '—',
        total: numeroBr(diff.pacotePara?.total ?? 0) }) },
    { chave: 'manifest', icone: Fingerprint, para: '/gates', detalhe: T.momento1.detalhe.manifest },
  ]
  return (
    <div className="border k-bd k-bg-raised p-3">
      <div className="k-text-subtle text-[10px] k-caps mb-2">{T.momento1.titulo} — {T.momento1.subtitulo}</div>
      <div className="k-scroll">
        <div className="flex items-stretch gap-2 min-w-[760px]">
          {nos.map((no, i) => (
            <React.Fragment key={no.chave}>
              <button type="button" onClick={() => ir(no.para)}
                className="k-prop k-t flex-1 text-left border k-bd-strong px-2.5 py-2 hover:k-bg-sunken"
                style={{ animationDelay: `${i * 200}ms` }}>
                <div className="flex items-center gap-1.5 k-text-accent">
                  <no.icone size={IC} strokeWidth={1.75} />
                  <span className="text-[11px] font-semibold">{T.momento1.nos[no.chave]}</span>
                </div>
                <div className="k-text-muted text-[10.5px] mt-1 leading-snug break-words">{no.detalhe}</div>
              </button>
              {i < nos.length - 1
                ? <div className="k-prop flex items-center k-text-subtle" style={{ animationDelay: `${i * 200 + 100}ms` }}>
                    <ArrowRight size={IC} />
                  </div>
                : null}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="k-text-subtle text-[10.5px] mt-2">{T.momento1.reassinar}</div>
    </div>
  )
}

/* ---------- /review/candidate — Momento 2 ------------------------------------ */
/**
 * O agente evidencia e PARA. A frase do limite fica em destaque próprio, não em
 * nota de rodapé. Confirmar NÃO executa a regra: KANON recusa candidata, e
 * promover é ato de governança numa nova versão selada.
 */
function CandidateRuleScreen({ estado, dispatch, ir }) {
  const caso = useMemo(() => casoDaRegraCandidata(estado.playbookVersion), [estado.playbookVersion])
  const [hipotese, setHipotese] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const decisao = estado.candidatas[REGRA_CANDIDATA] ?? null

  useEffect(() => {
    let vivo = true
    setCarregando(true)
    pedirHipotese(entradaParaOModelo()).then((h) => {
      if (!vivo) return
      setHipotese(h)
      setCarregando(false)
    })
    return () => { vivo = false }
  }, [])

  const f = caso.frequencia
  return (
    <div>
      <Section titulo={T.candidate.caso} cena="evidencia-candidata">
        <div className="border k-bd-strong k-s-gate px-3 py-3 mb-4">
          <div className="text-[13px] leading-relaxed font-medium">{T.candidate.limite}</div>
        </div>

        <div className="k-text-subtle text-[10px] k-caps mb-1">{T.candidate.evidencia}</div>
        <p className="k-text-subtle text-[11px] mb-2">{T.candidate.evidenciaNota}</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-4">
          {caso.duplas.map(({ a, b, camposDivergentes, iguais }) => (
            <Card key={`${a.codigo}-${b.codigo}`} className="p-2.5">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Mono className="k-text">{formatDoc(a.cnpjCpf)}</Mono>
                <span className="k-text-subtle text-[10.5px]">{a.spe} × {b.spe}</span>
              </div>
              <Tabela colunas={[T.comum.campo, a.codigo, b.codigo]}>
                {['iss', 'aliquotaIss', 'irrf', 'inss', 'pisCofinsCsll'].map((campo) => {
                  const diverge = camposDivergentes.includes(campo)
                  const valor = (s) => {
                    const v = s.retencoes[campo]
                    return v === null ? '—' : typeof v === 'boolean' ? (v ? T.comum.sim : T.comum.nao) : percentualBr(v, 0)
                  }
                  return (
                    <tr key={campo} className={`k-row ${diverge ? 'k-s-exception' : ''}`}>
                      <td className="k-td"><Mono>{campo}</Mono></td>
                      <td className="k-td">{valor(a)}</td>
                      <td className="k-td">{valor(b)}</td>
                    </tr>
                  )
                })}
              </Tabela>
              <div className="mt-1.5 text-[10.5px] k-text-subtle">
                {T.candidate.identico}: {iguais.map((x) => `${x.rotulo} ${x.valor}`).join(' · ')}
              </div>
              <div className="mt-1.5 flex gap-2">
                <Link para={`/record/${a.codigo}`} ir={ir}><Mono>{a.codigo}</Mono></Link>
                <Link para={`/record/${b.codigo}`} ir={ir}><Mono>{b.codigo}</Mono></Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="k-text-subtle text-[10px] k-caps mb-1">{T.candidate.frequencia}</div>
        <p className="k-text-subtle text-[11px] mb-2">{T.candidate.frequenciaNota}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          <Kpi rotulo={T.candidate.duplas} valor={numeroBr(f.duplas)} />
          <Kpi rotulo={T.candidate.registrosEnvolvidos} valor={numeroBr(f.registros)} />
          <Kpi rotulo={T.candidate.spesEnvolvidas} valor={numeroBr(f.spes)} />
          <Kpi rotulo={T.candidate.duplasSobrePossiveis} valor={`${numeroBr(f.duplas)}/${numeroBr(f.duplasPossiveis)}`}
            nota={fmt(T.candidate.dePf, { total: numeroBr(f.pfTotais) })} />
        </div>

        <div className="k-text-subtle text-[10px] k-caps mb-1">{T.candidate.inferencia}</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-4">
          <Card className="p-3">
            <div className="k-text-subtle text-[10px] k-caps mb-1">{T.candidate.regraCandidata}</div>
            {caso.regra ? (
              <>
                <div className="flex items-center gap-2">
                  <Mono className="k-text-accent">{caso.regra.id}</Mono>
                  <StateBadge estado="held" rotulo={T.playbook.status[caso.regra.status]} />
                </div>
                <div className="k-text k-mono text-[11px] mt-1.5">{caso.regra.expression}</div>
                <p className="k-text-muted text-[11px] mt-1.5 leading-relaxed">{caso.regra.rationale}</p>
                <div className="k-text-subtle text-[10.5px] mt-1.5">{T.playbook.dono}: {caso.regra.owner}</div>
                <div className="mt-2">
                  <Link para={`/playbook?regra=${caso.regra.id}`} ir={ir}>{T.gates.verEvidencia}</Link>
                </div>
              </>
            ) : null}
          </Card>
          <Card className="p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="k-text-subtle text-[10px] k-caps">{T.candidate.hipotese}</div>
              <div className="k-text-subtle text-[10px]">
                {T.candidate.modelo}: <Mono>{MODELO}</Mono>
                {carregando ? <span className="k-pulse ml-2">{T.candidate.consultando}</span>
                  : <span className="ml-2">
                      · {hipotese?.origem === 'ao-vivo' ? T.candidate.procedenciaViva : T.candidate.procedenciaReferencia}
                    </span>}
              </div>
            </div>
            {hipotese === null ? <div className="k-text-subtle text-[11px] k-pulse">{T.candidate.consultando}</div> : (
              <>
                <p className="k-text text-[11.5px] leading-relaxed">{hipotese.enunciado}</p>
                <ul className="mt-2 space-y-1">
                  {hipotese.evidencia.map((e, i) => (
                    <li key={i} className="k-text-muted text-[11px] leading-relaxed flex gap-1.5">
                      <span className="k-text-subtle">·</span><span>{e}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2.5 border k-bd-strong k-s-held px-2.5 py-2">
                  <div className="text-[10px] font-semibold k-caps">{T.candidate.naoConfirmavel}</div>
                  <p className="text-[11px] mt-1 leading-relaxed">{hipotese.naoConfirmavel}</p>
                </div>
              </>
            )}
          </Card>
        </div>

        <div className="k-text-subtle text-[10px] k-caps mb-1">{T.candidate.contencao}</div>
        <Card className="p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="k-text text-[12px] font-medium">{T.candidate.titulo}</div>
              <div className="k-text-muted text-[11px] mt-0.5">
                {T.candidate.roteadaPara}: {caso.dono?.nome ?? ''} · {caso.tipoDeDefeito?.roteadoPara ?? ''}
                {' · '}{T.comum.prazo}: {numeroBr(caso.tipoDeDefeito?.prazoDias ?? 0)} {T.comum.dias}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {decisao
                ? <StateBadge estado={decisao.decisao === 'rejeitada' ? 'exception' : 'signed'}
                    rotulo={`${T.candidate.decisao[decisao.decisao]} · ${decisao.assinatura.by} · ${dataHoraBr(decisao.assinatura.at)}`} />
                : (
                  <>
                    <Botao variante="fill" icone={Check}
                      onClick={() => dispatch({ tipo: 'decidir-candidata', ruleId: REGRA_CANDIDATA, decisao: 'confirmada' })}>
                      {T.candidate.confirmar}
                    </Botao>
                    <Botao icone={X}
                      onClick={() => dispatch({ tipo: 'decidir-candidata', ruleId: REGRA_CANDIDATA, decisao: 'rejeitada' })}>
                      {T.candidate.rejeitarC}
                    </Botao>
                    <Botao icone={PenLine}
                      onClick={() => dispatch({ tipo: 'decidir-candidata', ruleId: REGRA_CANDIDATA, decisao: 'reformular' })}>
                      {T.candidate.reformular}
                    </Botao>
                  </>
                )}
            </div>
          </div>
          <p className="k-text-subtle text-[11px] mt-2 leading-relaxed">{T.candidate.confirmarNaoExecuta}</p>
        </Card>
      </Section>
    </div>
  )
}

/* ---------- /packages (documento) -------------------------------------------- */
function PackagesScreen({ estado, dispatch, ir }) {
  const { run, approvals, ciclo } = estado
  const xml = useMemo(() => gerarXml(run, 3), [run])
  const conformidade = useMemo(() => conferirConformidade(run), [run])
  const escopoFornecedores = scopeObjects.find((o) => o.id === 'fornecedores')?.volume ?? 0
  const divisao = useMemo(() => dividirPacote('fornecedores', escopoFornecedores, xml.bytesPorRegistro),
    [xml.bytesPorRegistro, escopoFornecedores])
  const manifest = run.loadPackage?.manifest ?? null
  const janela = calendarioAcordado.find((j) => j.ciclo === ciclo) ?? calendarioAcordado[0]
  const simulacao = simulacaoPorObjeto.get('business-partner') ?? null

  if (manifest === null) {
    return <Surface tipo="paper" className="p-4 border k-bd"><Vazio texto={T.packages.semPacote} /></Surface>
  }

  return (
    <Surface tipo="paper" className="p-4 border k-bd">
      <header className="mb-4">
        <h1 className="text-[17px] k-text font-semibold">{T.packages.titulo}</h1>
        <p className="k-text-muted text-[12px] mt-1 max-w-3xl">{T.packages.subtitulo}</p>
      </header>

      <Section titulo={T.packages.manifestTitulo} cena="manifest">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Kpi rotulo={T.packages.playbookVersion} valor={manifest.playbookVersion} />
          <Kpi rotulo={T.packages.playbookChecksum} valor={manifest.playbookChecksum} />
          <Kpi rotulo={T.packages.datasetChecksum} valor={manifest.datasetChecksum} />
          <Kpi rotulo={T.packages.totalRegistros} valor={numeroBr(manifest.total)} />
          <Kpi rotulo={T.packages.geradoEm} valor={dataBr(manifest.geradoEm)} nota={run.loadPackage.id} />
        </div>
      </Section>

      <Section titulo={T.packages.xml}
        nota={`${T.packages.tamanhoPorRegistro}: ${numeroBr(xml.bytesPorRegistro)} bytes`}>
        <pre className="k-mono text-[10.5px] k-bg-sunken border k-bd p-2 overflow-auto max-h-64 k-text-muted whitespace-pre">
{xml.texto}
        </pre>
      </Section>

      <Section titulo={T.packages.divisao} nota={T.packages.divisaoNota}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
          <Kpi rotulo={T.demo.escopoReal} valor={numeroBr(divisao.registrosTotais)} sufixo={T.comum.registros} />
          <Kpi rotulo={T.packages.tamanho} valor={numeroBr(divisao.megabytesTotais, 2)} sufixo="MB" />
          <Kpi rotulo={T.packages.parte} valor={numeroBr(divisao.partes.length)} />
          <Kpi rotulo={T.comum.limite} valor={divisao.limitante}
            nota={`${numeroBr(divisao.limiteMb)} MB · ${numeroBr(divisao.limiteRegistros)} ${T.comum.registros}`} />
        </div>
        <Tabela colunas={[T.packages.parte, T.missionControl.arquivo, T.comum.registros, T.packages.tamanho, T.packages.playbookChecksum]}>
          {divisao.partes.map((p) => (
            <tr key={p.indice} className="k-row">
              <td className="k-td tnum">{numeroBr(p.indice)}</td>
              <td className="k-td"><Mono className="k-text">{p.nomeArquivo}</Mono></td>
              <td className="k-td tnum">{numeroBr(p.registros)}</td>
              <td className="k-td tnum">{numeroBr(p.megabytes, 2)} MB</td>
              <td className="k-td"><Mono className="k-text-muted">{p.checksum}</Mono></td>
            </tr>
          ))}
        </Tabela>
      </Section>

      <Section titulo={T.packages.conformidade} nota={T.packages.conformidadeNota}>
        <Tabela colunas={[T.packages.verificacao, T.comum.porQue, T.packages.resultado, T.comum.registro]}>
          {conformidade.map((c) => (
            <tr key={c.id} className="k-row align-top">
              <td className="k-td"><Mono className="k-text-accent">{c.id}</Mono><div className="k-text">{c.nome}</div></td>
              <td className="k-td k-text-muted text-[11px] max-w-md">{c.descricao}</td>
              <td className="k-td">
                <StateBadge estado={c.resultado === 'ok' ? 'signed' : c.resultado === 'falha' ? 'exception' : 'gate'}
                  rotulo={c.resultado === 'ok' ? T.packages.aprovadaC : c.resultado === 'falha' ? T.packages.reprovadaC : T.comum.naoMensuravel} />
                <div className="k-text-subtle text-[10.5px] mt-0.5">{c.detalhe}</div>
              </td>
              <td className="k-td">
                <div className="flex flex-wrap gap-1">
                  {c.registrosAfetados.slice(0, 8).map((r) => <Mono key={r} className="k-text-muted">{r}</Mono>)}
                </div>
              </td>
            </tr>
          ))}
        </Tabela>
      </Section>

      <Section titulo={T.packages.entrega}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <Card className="p-3 text-[11.5px]">
            <div><span className="k-text-subtle">{T.packages.destinatario}: </span>
              <span className="k-text">{destinatarioDaCarga.responsavel} · {destinatarioDaCarga.parte}</span></div>
            <div className="k-text-subtle text-[10.5px]">{destinatarioDaCarga.papel}</div>
            <div className="mt-2"><span className="k-text-subtle">{T.packages.escopoEntrega}: </span>
              <span className="k-text tnum">{numeroBr(manifest.total)} {T.comum.registros}</span></div>
            <div className="mt-1"><span className="k-text-subtle">{T.packages.excecoesConhecidas}: </span>
              <span className="k-text tnum">{numeroBr(run.exceptions.length)}</span></div>
            <div className="mt-1"><span className="k-text-subtle">{T.packages.calendario}: </span>
              <span className="k-text">{janela.nome} · {dataBr(janela.inicio)} — {dataBr(janela.fim)}</span></div>
            <div className="k-text-subtle text-[10.5px] mt-0.5">{janela.observacao}</div>
          </Card>
          <Card className="p-3 text-[11.5px]">
            <div className="k-text-subtle text-[10px] k-caps mb-1">{T.packages.simulacao}</div>
            {simulacao ? (
              <>
                <StateBadge estado={simulacao.estado === 'aprovada' ? 'signed' : simulacao.estado === 'reprovada' ? 'exception' : 'gate'}
                  rotulo={simulacao.estado} />
                <div className="k-text-muted mt-1.5 leading-relaxed">{simulacao.observacao}</div>
                <div className="k-text-subtle text-[10.5px] mt-1">
                  {dataBr(simulacao.executadaEm)} · {simulacao.executadaPor}
                </div>
              </>
            ) : null}
            <div className="mt-3">
              {approvals.pacote
                ? <StateBadge estado="signed"
                    rotulo={`${T.packages.liberado} ${approvals.pacote.by} · ${dataHoraBr(approvals.pacote.at)}`} />
                : <Botao variante="fill" icone={Package}
                    onClick={() => dispatch({ tipo: 'assinar-pacote', decisao: 'approved' })}>
                    {T.packages.liberar}
                  </Botao>}
            </div>
            <div className="mt-2"><Link para="/gates" ir={ir}>{T.nav.gates}</Link></div>
          </Card>
        </div>
      </Section>
    </Surface>
  )
}

/* ---------- /reconciliation --------------------------------------------------- */
/**
 * A tela mais importante comercialmente. Toda diferença vem explicada, e o
 * registro de defeitos separa visualmente responsabilidade Monoda (origem
 * `transformation`) de responsabilidade de terceiros.
 */
function ReconciliationScreen({ estado, dispatch, ir }) {
  const { run, approvals, verificacoesFiori: registradas } = estado
  const contagem = useMemo(() => contagemPorSpe(run), [run])
  const total = useMemo(() => contagemTotal(run), [run])
  const valores = useMemo(() => valorPorSpe(), [])
  const defeitos = useMemo(() => registroDeDefeitos(run), [run])
  const placar = useMemo(() => placarDeAceite(run), [run])
  const [origemAberta, setOrigemAberta] = useState(null)

  const LinhaContagem = ({ l }) => (
    <tr className="k-row align-top">
      <td className="k-td k-text">{l.rotulo}</td>
      <td className="k-td tnum">{numeroBr(l.origem)}</td>
      <td className="k-td tnum">{l.mensuravel ? numeroBr(l.destino) : <span className="k-text-subtle">{T.comum.naoMensuravel}</span>}</td>
      <td className="k-td tnum">{l.mensuravel ? numeroBr(l.diferenca) : '—'}</td>
      <td className="k-td">
        {l.mensuravel
          ? (l.explicacao.length === 0
            ? <span className="k-text-subtle text-[11px]">—</span>
            : <ul className="space-y-0.5">
                {l.explicacao.map((e) => (
                  <li key={e.causa} className="k-text-muted text-[11px]">
                    <span className="tnum k-text">{numeroBr(e.quantidade)}</span> {e.causa}
                  </li>
                ))}
              </ul>)
          : <span className="k-text-subtle text-[11px]">{T.comum.naoMensuravel}</span>}
      </td>
      <td className="k-td">
        {l.mensuravel
          ? <StateBadge estado={l.fecha ? 'signed' : 'exception'} rotulo={l.fecha ? T.comum.fecha : T.comum.naoFecha} />
          : <StateBadge estado="gate" rotulo={T.comum.naoMensuravel} />}
      </td>
    </tr>
  )

  return (
    <div>
      <Section titulo={T.reconciliation.porContagem} cena="contagem">
        <Tabela colunas={[T.shell.spe, T.comum.origem, T.comum.destino, T.comum.diferenca, T.comum.explicacao, T.comum.estado]}>
          {contagem.map((l) => <LinhaContagem key={l.chave} l={l} />)}
          <LinhaContagem l={total} />
        </Tabela>
      </Section>

      <Section titulo={T.reconciliation.porValor} nota={T.reconciliation.valorNota}>
        <Tabela colunas={[T.shell.spe, T.comum.origem, T.comum.destino, T.comum.diferenca, T.comum.explicacao, T.comum.estado]}>
          {valores.map((l) => (
            <tr key={l.chave} className="k-row align-top">
              <td className="k-td k-text">{l.rotulo}</td>
              <td className="k-td tnum">{moedaBr(l.origem)}</td>
              <td className="k-td tnum">{moedaBr(l.destino)}</td>
              <td className="k-td tnum">{moedaBr(l.diferenca)}</td>
              <td className="k-td">
                {l.explicacao.length === 0 ? <span className="k-text-subtle text-[11px]">—</span> : (
                  <ul className="space-y-0.5">
                    {l.explicacao.map((e) => (
                      <li key={e.causa} className="k-text-muted text-[11px]">
                        <span className="tnum k-text">{moedaBr(e.valor)}</span> — {e.causa}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="k-td">
                <StateBadge estado={l.fecha ? 'signed' : 'exception'} rotulo={l.fecha ? T.comum.fecha : T.comum.naoFecha} />
              </td>
            </tr>
          ))}
        </Tabela>
      </Section>

      <Section titulo={T.reconciliation.registroDefeitos} cena="defeitos-por-origem">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {[true, false].map((monoda) => (
            <div key={String(monoda)}>
              <div className="k-text-subtle text-[10px] k-caps mb-1">
                {monoda ? T.reconciliation.responsabilidadeMonoda : T.reconciliation.responsabilidadeTerceiros}
              </div>
              <div className="space-y-1.5">
                {defeitos.filter((d) => d.monodaResponsavel === monoda).map((d) => {
                  const origem = defectOriginById[d.origin]
                  const aberto = origemAberta === d.origin
                  return (
                    <Card key={d.origin} className={`p-2.5 ${monoda ? 'k-bd-strong border-2' : ''}`}>
                      <button type="button" onClick={() => setOrigemAberta(aberto ? null : d.origin)}
                        className="k-t w-full text-left">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <DefectOrigin token={d.token} rotulo={d.nome} />
                          <span className="tnum k-text text-[12px]">
                            {numeroBr(d.total)} · {numeroBr(d.criticos)} {T.comum.critico} · {percentualBr(d.percentual)}
                          </span>
                        </div>
                        <div className="k-text-subtle text-[10.5px] mt-1">
                          {T.reconciliation.donoContratual}: {d.donoContratual}
                        </div>
                      </button>
                      {aberto ? (
                        <div className="mt-2">
                          <p className="k-text-muted text-[11px] leading-relaxed">{origem.criterioDeAtribuicao}</p>
                          <p className="k-text-subtle text-[10.5px] mt-1 leading-relaxed">
                            {T.reconciliation.entregaMonoda}: {origem.entregaDaMonoda}
                          </p>
                          {detalhePorOrigem(run, d.origin).length > 0 ? (
                            <div className="mt-2">
                              <Tabela colunas={[T.comum.defeito, T.comum.severidade, T.exceptions.roteadoPara, T.comum.quantidade]}>
                                {detalhePorOrigem(run, d.origin).map((t) => (
                                  <tr key={t.defectTypeId} className="k-row">
                                    <td className="k-td"><Mono className="k-text-accent">{t.defectTypeId}</Mono>
                                      <div className="k-text text-[11px]">{t.nome}</div></td>
                                    <td className="k-td k-text-muted">{t.severidade === 'critical' ? T.comum.critico : T.comum.naoCritico}</td>
                                    <td className="k-td k-text-muted">{t.roteadoPara}</td>
                                    <td className="k-td tnum">{numeroBr(t.quantidade)}</td>
                                  </tr>
                                ))}
                              </Tabela>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section titulo={T.reconciliation.placar} nota={T.reconciliation.placarNota} cena="placar">
        <Tabela colunas={['#', T.comum.criterio, T.nav.gates, T.reconciliation.medido, T.reconciliation.alvo,
          T.comum.estado, T.reconciliation.comoMedido]}>
          {placar.map((p) => (
            <tr key={p.criterio.id} className="k-row align-top">
              <td className="k-td"><Mono className="k-text-accent">{p.criterio.id}</Mono></td>
              <td className="k-td">
                <div className="k-text">{p.criterio.nome}</div>
                <div className="k-text-subtle text-[10.5px] max-w-lg mt-0.5">{p.criterio.descricao}</div>
              </td>
              <td className="k-td"><Mono className="k-text">{p.gate}</Mono></td>
              <td className="k-td tnum k-text">
                {p.mensuravel ? `${numeroBr(p.medido, p.criterio.unidade === '%' ? 1 : 0)}${p.criterio.unidade === '%' ? '%' : ''}` : '—'}
              </td>
              <td className="k-td tnum k-text-muted">
                {numeroBr(p.alvo)}{p.criterio.unidade === '%' ? '%' : ''}
              </td>
              <td className="k-td">
                <StateBadge estado={!p.mensuravel ? 'gate' : p.atende ? 'signed' : 'exception'}
                  rotulo={!p.mensuravel ? T.comum.naoMensuravel : p.atende ? T.reconciliation.atende : T.reconciliation.naoAtende} />
              </td>
              <td className="k-td k-text-subtle text-[10.5px] max-w-xs">{p.comoMedido}</td>
            </tr>
          ))}
        </Tabela>
      </Section>

      <Section titulo={T.reconciliation.fiori} nota={T.reconciliation.fioriNota}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {verificacoesFiori.map((v) => {
            const registrada = registradas[v.id] ?? null
            return (
              <Card key={v.id} className="p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="k-text text-[12px]">{v.app}</div>
                    <div className="k-text-subtle text-[10.5px]">
                      <Mono>{v.appId}</Mono> · {v.objeto} · Gate <Mono>{v.gate}</Mono>
                    </div>
                  </div>
                  {registrada
                    ? <StateBadge estado="signed" rotulo={`${T.reconciliation.registrada} ${registrada.by}`} />
                    : <Botao icone={Search} onClick={() => dispatch({ tipo: 'verificacao-fiori', id: v.id })}>
                        {T.reconciliation.registrar}
                      </Botao>}
                </div>
                <ol className="mt-1.5 space-y-0.5">
                  {v.passos.map((p) => (
                    <li key={p.ordem} className="k-text-muted text-[11px] flex gap-1.5">
                      <span className="k-text-subtle tnum">{p.ordem}.</span>
                      <span>{p.instrucao} <Mono className="k-text-subtle">{p.campo}</Mono></span>
                    </li>
                  ))}
                </ol>
                {v.registroExemplo
                  ? <div className="mt-1.5"><Link para={`/record/${v.registroExemplo}`} ir={ir}>
                      <Mono>{v.registroExemplo}</Mono></Link></div>
                  : null}
              </Card>
            )
          })}
        </div>
        <div className="mt-3">
          {approvals.reconciliacao
            ? <StateBadge estado="signed"
                rotulo={`${T.gates.quem}: ${approvals.reconciliacao.by} · ${dataHoraBr(approvals.reconciliacao.at)} · ${T.gates.sobreVersao} ${approvals.reconciliacao.playbookVersion}`} />
            : <Botao variante="fill" icone={PenLine}
                onClick={() => dispatch({ tipo: 'assinar-reconciliacao', decisao: 'approved' })}>
                {T.reconciliation.assinarRecon}
              </Botao>}
        </div>
      </Section>
    </div>
  )
}

/* ---------- /gates ------------------------------------------------------------ */
function GatesScreen({ estado, dispatch, ir }) {
  const { approvals, playbookVersion, assinaturasDeGate, flags } = estado
  const run = useMemo(() => runDeTodasSpes(playbookVersion, approvals), [playbookVersion, approvals])
  const estados = useMemo(() => estadoDosGates({ run, approvals, playbookVersion, assinaturasDeGate }),
    [run, approvals, playbookVersion, assinaturasDeGate])
  const [aberto, setAberto] = useState('G6')
  const aprovados = estados.filter((e) => e.artefatoAssinado).length

  return (
    <div>
      <Section cena="gates-rail" titulo={T.gates.oitoGates}
        acao={flags.comercial
          ? <Botao icone={Scale} onClick={() => ir('/gates/payment')}>{T.nav.payment}</Botao>
          : null}>
        <div className="mb-3">
          <Kpi rotulo={T.gates.titulo} destaque
            valor={fmt(T.gates.placarGates, { aprovados: numeroBr(aprovados), total: numeroBr(estados.length) })} />
        </div>
        <div className="space-y-1.5">
          {estados.map((e) => {
            const expandido = aberto === e.gate.id
            return (
              <Card key={e.gate.id} className="p-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <button type="button" onClick={() => setAberto(expandido ? null : e.gate.id)}
                    className="k-t text-left min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {expandido ? <ChevronDown size={IC} className="k-text-subtle" /> : <ChevronRight size={IC} className="k-text-subtle" />}
                      <Mono className="k-text-accent text-[12px]">{e.gate.id}</Mono>
                      <span className="k-text text-[12.5px] font-medium">{e.gate.nome}</span>
                      <StateBadge
                        estado={e.status === 'aprovado' ? 'signed' : e.status === 'entrada-recusada' ? 'exception' : 'gate'}
                        rotulo={T.gates.status[e.status]} />
                      <span className="k-text-subtle text-[10.5px]">
                        {T.gates.artefato} <Mono>{e.gate.artefato.id}</Mono> — {e.gate.artefato.nome}
                      </span>
                    </div>
                  </button>
                  {e.gate.assinaturaNoGate && e.entradaAdmitida && !e.artefatoAssinado ? (
                    <Botao variante="fill" icone={PenLine}
                      onClick={() => dispatch({ tipo: 'assinar-gate', gate: e.gate.id, decisao: 'approved' })}>
                      {fmt(T.gates.assinaturaNaTela, { gate: e.gate.id })}
                    </Botao>
                  ) : null}
                </div>

                {e.recusa ? (
                  <div className="mt-2 border k-bd-strong k-s-exception px-2.5 py-2">
                    <div className="text-[10px] font-semibold k-caps">{T.gates.recusaTitulo}</div>
                    <div className="text-[11.5px] mt-1">
                      {fmt(T.gates.recusa, { artefato: `${e.recusa.artefato} (${e.recusa.artefatoNome})`, gate: e.recusa.gate })}
                    </div>
                    <div className="mt-1.5">
                      <Botao icone={ArrowRight} onClick={() => setAberto(e.recusa.gate)}>
                        {fmt(T.gates.irParaGate, { gate: e.recusa.gate })}
                      </Botao>
                    </div>
                  </div>
                ) : null}

                {expandido ? (
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div>
                      <dl className="text-[11.5px] space-y-1.5">
                        <div>
                          <dt className="k-text-subtle text-[10px] k-caps">{T.gates.quandoOcorre}</dt>
                          <dd className="k-text-muted">{e.gate.quandoOcorre}</dd>
                        </div>
                        <div>
                          <dt className="k-text-subtle text-[10px] k-caps">{T.gates.oQueEAprovado}</dt>
                          <dd className="k-text-muted leading-relaxed">{e.gate.oQueEAprovado}</dd>
                        </div>
                        <div>
                          <dt className="k-text-subtle text-[10px] k-caps">{T.gates.evidencias}</dt>
                          <dd>
                            {e.evidencias.map((ev) => (
                              <div key={ev.id} className="mt-1 flex items-start gap-2">
                                <StateBadge estado={ev.disponivel ? 'signed' : 'held'}
                                  rotulo={ev.disponivel ? T.gates.disponivel : T.gates.indisponivel} />
                                <div className="min-w-0">
                                  <Link para={ev.path} ir={ir}>{ev.titulo}</Link>
                                  <div className="k-text-subtle text-[10.5px]">{ev.descricao}</div>
                                </div>
                              </div>
                            ))}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <div className="k-text-subtle text-[10px] k-caps mb-1">{T.gates.trilha}</div>
                      <Tabela colunas={[T.gates.aprovador, T.gates.quem, T.gates.quando, T.gates.sobreVersao]}>
                        {e.trilha.map((item, i) => (
                          <tr key={i} className="k-row align-top">
                            <td className="k-td">
                              <div className="k-text">{item.oQueAssina}</div>
                              <div className="k-text-subtle text-[10.5px]">
                                {item.area}{item.responsavel ? ` · ${item.responsavel.nome}` : ''}
                              </div>
                              {item.requeridas > 1
                                ? <div className="k-text-subtle text-[10.5px] tnum">
                                    {numeroBr(item.assinadas)}/{numeroBr(item.requeridas)}
                                  </div>
                                : null}
                            </td>
                            <td className="k-td k-text">{item.assinatura?.by ?? '—'}</td>
                            <td className="k-td k-text-muted whitespace-nowrap">
                              {item.assinatura ? dataHoraBr(item.assinatura.at) : '—'}
                            </td>
                            <td className="k-td">
                              {item.assinatura ? (
                                <>
                                  <Mono className="k-text">{item.assinatura.playbookVersion}</Mono>
                                  {item.assinatura.revalidadaEm
                                    ? <div className="k-text-subtle text-[10px]">
                                        {T.gates.revalidada} <Mono>{item.assinatura.revalidadaEm}</Mono>
                                      </div>
                                    : null}
                                </>
                              ) : '—'}
                            </td>
                          </tr>
                        ))}
                      </Tabela>
                      {e.pendencias.length > 0 ? (
                        <ul className="mt-1.5 space-y-0.5">
                          {e.pendencias.map((p, i) => (
                            <li key={i} className="k-text-muted text-[11px]">
                              · {fmt(T.gates.pendencia[p.tipo], { detalhe: p.detalhe, quantidade: numeroBr(p.quantidade) })}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {e.gate.assinaturaNoGate ? null : (
                        <div className="k-text-subtle text-[10.5px] mt-1.5">{T.gates.assinaturaNoutraTela}</div>
                      )}
                    </div>
                  </div>
                ) : null}
              </Card>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

/* ---------- /gates/payment (atrás da flag) ------------------------------------ */
function GatePaymentScreen({ estado, ir }) {
  const { approvals, playbookVersion, assinaturasDeGate } = estado
  const run = useMemo(() => runDeTodasSpes(playbookVersion, approvals), [playbookVersion, approvals])
  const estados = useMemo(() => estadoDosGates({ run, approvals, playbookVersion, assinaturasDeGate }),
    [run, approvals, playbookVersion, assinaturasDeGate])
  const liberacao = liberacaoDePagamento(estados)

  return (
    <div>
      <Section titulo={T.payment.porGate} nota={T.payment.flagNota}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          <Kpi rotulo={T.payment.totalLiberado} valor={percentualBr(liberacao.liberado, 0)} destaque />
          <Kpi rotulo={T.payment.retido} valor={percentualBr(liberacao.retido, 0)} />
          <Kpi rotulo={T.comum.total} valor={percentualBr(liberacao.total, 0)} nota={T.payment.somaNota} />
        </div>
        <Tabela colunas={[T.nav.gates, T.comum.marco, T.payment.parcela, T.comum.estado]}>
          {liberacao.linhas.map((l) => (
            <tr key={l.gate.id} className="k-row">
              <td className="k-td"><Mono className="k-text-accent">{l.gate.id}</Mono>
                <div className="k-text text-[11px]">{l.gate.nome}</div></td>
              <td className="k-td k-text-muted">{l.parcela?.marco ?? l.gate.artefato.nome}</td>
              <td className="k-td tnum k-text">
                {l.parcela ? percentualBr(l.parcela.percentual, 0)
                  : <span className="k-text-subtle">{T.payment.semParcela}</span>}
              </td>
              <td className="k-td">
                {l.parcela === null
                  ? <span className="k-text-subtle text-[10.5px]">{T.payment.semParcelaNota}</span>
                  : <StateBadge estado={l.liberado ? 'signed' : 'held'}
                      rotulo={l.liberado ? T.payment.liberado : T.payment.retido} />}
              </td>
            </tr>
          ))}
        </Tabela>
        <div className="mt-2"><Link para="/gates" ir={ir}>{T.nav.gates}</Link></div>
      </Section>
    </div>
  )
}


/* ========================================================================== */
/* 26b. A CAMADA NARRADA — foco, cartão do agente e painel                    */
/* ========================================================================== */

/**
 * O foco sobre o elemento da cena.
 *
 * O escurecimento é a SOMBRA DO PRÓPRIO BURACO — uma sombra gigantesca para
 * fora —, então não há duas camadas para manter em sincronia e não existe o
 * instante em que a máscara e o brilho discordam.
 *
 * Se o seletor não encontrar nada, escurece a tela sem buraco e a cena segue:
 * destaque quebrado nunca pode derrubar a narração na frente do cliente.
 */
const SOMBRA_DA_CENA = 'rgba(5, 5, 5, 0.66)'
const MARGEM_DO_FOCO = 8

function Spotlight({ seletor, chave }) {
  const [recorte, setRecorte] = useState(null)

  useEffect(() => {
    // Sem seletor não há o que medir: a renderização devolve o escurecimento
    // sem buraco e o efeito não mexe em estado nenhum.
    if (!seletor) return undefined
    let vivo = true
    let quadro = 0

    const medir = () => {
      if (!vivo) return
      const alvo = document.querySelector(seletor)
      if (!alvo) { setRecorte(null); return }
      const r = alvo.getBoundingClientRect()
      setRecorte({
        top: r.top - MARGEM_DO_FOCO, left: r.left - MARGEM_DO_FOCO,
        width: r.width + MARGEM_DO_FOCO * 2, height: r.height + MARGEM_DO_FOCO * 2,
      })
    }

    // A tela de fundo pode ter acabado de trocar: espera o elemento existir
    // antes de desistir dele.
    let tentativas = 0
    const procurar = () => {
      if (!vivo) return
      const alvo = document.querySelector(seletor)
      if (alvo) {
        alvo.scrollIntoView({ block: 'center', behavior: 'smooth' })
        quadro = window.requestAnimationFrame(medir)
        window.setTimeout(medir, 320)
        return
      }
      if (tentativas > 24) { setRecorte(null); return }
      tentativas += 1
      quadro = window.requestAnimationFrame(procurar)
    }
    procurar()

    window.addEventListener('resize', medir)
    window.addEventListener('scroll', medir, true)
    return () => {
      vivo = false
      window.cancelAnimationFrame(quadro)
      window.removeEventListener('resize', medir)
      window.removeEventListener('scroll', medir, true)
    }
  }, [seletor, chave])

  if (!seletor || recorte === null) {
    return <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30"
      style={{ backgroundColor: SOMBRA_DA_CENA }} />
  }
  return (
    <div aria-hidden="true"
      className="pointer-events-none fixed z-30 border k-t"
      style={{
        top: recorte.top, left: recorte.left, width: recorte.width, height: recorte.height,
        borderColor: 'var(--k-accent)',
        boxShadow: `0 0 0 100vmax ${SOMBRA_DA_CENA}, 0 0 0 1px var(--k-accent)`,
        transition: 'top 150ms ease-out, left 150ms ease-out, width 150ms ease-out, height 150ms ease-out',
      }} />
  )
}

/**
 * O cartão do agente — o ponto que o protótipo não tinha.
 *
 * Nas telas o agente aparece como rótulo em tabela e nunca é apresentado. Aqui
 * ele responde as quatro perguntas de quem está vendo pela primeira vez. O
 * revisor sai de `agents`, não do roteiro, para não haver duas verdades sobre
 * quem assina — e fica na última linha de propósito: nenhum agente é
 * accountable, quem responde é a pessoa.
 */
function AgentCard({ agente, cartao }) {
  const t = T.narrativa.agente
  const spec = agents.find((a) => a.name === agente)
  const linhas = [
    { rotulo: t.oQueFaz, valor: cartao.oQueFaz },
    { rotulo: t.recebe, valor: cartao.recebe },
    { rotulo: t.entrega, valor: cartao.entrega },
  ]
  return (
    <article className="border k-bd-strong k-bg-sunken">
      <header className="border-b k-bd px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold tracking-wide k-text-accent">{spec.name}</span>
          <span className="text-[10px] k-caps k-text-subtle">{t.especialidade}</span>
        </div>
        <p className="mt-0.5 text-[12px] k-text">{cartao.especialidade}</p>
      </header>
      <dl className="px-3 py-2">
        {linhas.map(({ rotulo, valor }) => (
          <div key={rotulo} className="border-b k-bd py-1.5 first:pt-0 last:border-b-0 last:pb-0">
            <dt className="text-[10px] k-caps k-text-subtle">{rotulo}</dt>
            <dd className="mt-0.5 text-[12px] leading-snug k-text-muted">{valor}</dd>
          </div>
        ))}
      </dl>
      <footer className="border-t k-bd k-bg-raised px-3 py-2">
        <p className="text-[10px] k-caps k-text-subtle">{t.assina}</p>
        <p className="mt-0.5 text-[12px] k-text">{spec.revisor.nome}</p>
        <p className="text-[10px] k-text-subtle">{spec.revisor.papel}</p>
      </footer>
    </article>
  )
}

/** Barra de progresso das quinze cenas, agrupada pelos cinco atos. */
function ProgressoDaNarrativa({ cena, dispatch }) {
  return (
    <nav aria-label={T.narrativa.tituloDoModo} className="flex items-end gap-2">
      {atos.map((ato) => (
        <div key={ato} className="min-w-0 flex-1">
          <p className="truncate text-[9.5px] k-caps k-text-subtle">{rotuloDoAto[ato]}</p>
          <div className="mt-1 flex gap-0.5">
            {cenas.filter((c) => c.ato === ato).map((c) => (
              <button key={c.n} type="button" aria-label={`${T.narrativa.cena} ${c.n}`}
                aria-current={c.n === cena ? 'step' : undefined}
                onClick={() => dispatch({ tipo: 'cena', n: c.n })}
                className={`k-t h-1 min-w-0 flex-1 ${c.n === cena ? 'bg-current k-text-accent' : ''}`}
                style={c.n === cena ? undefined
                  : { backgroundColor: c.n < cena ? 'var(--k-border-strong)' : 'var(--k-border)' }} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}

/**
 * O corpo da cena: bullets em cascata, cartão do agente e a nota do apresentador.
 *
 * Vive num componente próprio e é remontado a cada cena pela `key`. É o que faz
 * a cascata recomeçar e a nota fechar sozinhas na virada.
 */
const CASCATA_MS = 260

function CorpoDaCena({ cena }) {
  // Quem pediu menos movimento ao sistema recebe os bullets de uma vez.
  const [visiveis, setVisiveis] = useState(() =>
    (typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      ? cena.bullets.length
      : 0)
  const [verNota, setVerNota] = useState(false)

  useEffect(() => {
    if (visiveis >= cena.bullets.length) return undefined
    const relogios = cena.bullets.map((_, i) =>
      window.setTimeout(() => setVisiveis((v) => Math.max(v, i + 1)), (i + 1) * CASCATA_MS))
    return () => relogios.forEach(window.clearTimeout)
    // Roda uma vez por cena: a `key` no ponto de uso garante a remontagem.
  }, [])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      <h2 className="text-[19px] font-semibold leading-tight k-text">{cena.titulo}</h2>
      <ul className="mt-3 flex flex-col gap-2.5">
        {cena.bullets.map((b, i) => (
          <li key={b}
            className="k-t border-l-2 pl-3 text-[13px] leading-relaxed k-text"
            style={{
              opacity: i < visiveis ? 1 : 0,
              borderColor: i < visiveis ? 'var(--k-accent)' : 'var(--k-border)',
            }}>
            {b}
          </li>
        ))}
      </ul>

      {cena.agente && cena.cartao ? (
        <div className="k-t mt-4" style={{ opacity: visiveis >= cena.bullets.length ? 1 : 0 }}>
          <AgentCard agente={cena.agente} cartao={cena.cartao} />
        </div>
      ) : null}

      <div className="mt-4 border-t k-bd pt-3">
        <Botao icone={FileText} onClick={() => setVerNota((v) => !v)}>{T.narrativa.notas}</Botao>
        {verNota ? (
          <p className="mt-1.5 border-l-2 pl-3 text-[11.5px] leading-relaxed k-text-muted"
            style={{ borderColor: 'var(--k-held)' }}>
            {cena.notaDoApresentador}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/**
 * A camada narrada por cima do protótipo.
 *
 * A tela real fica ao fundo, funcionando, escurecida, com o elemento da cena em
 * foco. O painel lateral traz os bullets um a um — para o olho ter tempo de
 * pousar em cada frase antes da seguinte.
 */
function NarrativeOverlay({ estado, dispatch }) {
  const t = T.narrativa
  const { ativa, cena: numero, automatico, pausado, encerrada } = estado.narrativa
  const { liberado } = estado.entrada
  const cena = useMemo(() => cenaPorNumero(numero), [numero])

  // Modo automático: anda sozinho pelo tempo de leitura declarado na cena.
  useEffect(() => {
    if (!ativa || encerrada || !automatico || pausado) return undefined
    const relogio = window.setTimeout(() => dispatch({ tipo: 'cena-proxima' }), cena.duracao * 1000)
    return () => window.clearTimeout(relogio)
  }, [ativa, encerrada, automatico, pausado, cena, dispatch])

  // Seta e barra de espaço avançam. Fora da narrativa nada responde: as teclas
  // do modo de apresentação continuam sendo dele.
  useEffect(() => {
    if (!ativa) return undefined
    const aoTeclar = (evento) => {
      const alvo = evento.target
      if (alvo && ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName)) return
      // Antes de entrar, a cena 1 está montada mas coberta: tecla não a avança.
      if (!liberado) return
      if (evento.key === 'ArrowRight' || evento.key === ' ' || evento.key === 'Spacebar') {
        evento.preventDefault()
        dispatch({ tipo: 'cena-proxima' })
        return
      }
      if (evento.key === 'ArrowLeft') {
        evento.preventDefault()
        dispatch({ tipo: 'cena-anterior' })
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [ativa, liberado, dispatch])

  // Fora da narrativa não há pino flutuante: quem entra e sai é o botão único da
  // barra superior, sempre no mesmo lugar.
  if (!ativa) return null

  if (encerrada) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center p-6" role="dialog" aria-modal="true">
        <div className="absolute inset-0" aria-hidden="true" style={{ backgroundColor: 'rgba(5,5,5,.82)' }} />
        <div className="relative w-full max-w-lg border k-bd-strong k-bg-raised p-5">
          <h2 className="text-[17px] font-semibold k-text">{t.fim}</h2>
          <p className="mt-2 text-[12.5px] leading-relaxed k-text-muted">{t.fimNota}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Botao variante="fill" icone={Compass} onClick={() => dispatch({ tipo: 'narrativa-explorar' })}>
              {t.encerrar}
            </Botao>
            <Botao icone={RefreshCw} onClick={() => dispatch({ tipo: 'cena', n: 1 })}>{t.reiniciar}</Botao>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* A área escurecida avança a cena ao clique; o painel e a barra superior
          ficam acima dela e continuam clicáveis. */}
      <button type="button" aria-label={t.proxima} onClick={() => dispatch({ tipo: 'cena-proxima' })}
        className="fixed inset-0 z-30 cursor-pointer" />
      <Spotlight seletor={cena.destaque} chave={cena.n} />
    </>
  )
}

/**
 * O painel da cena. Fica no FLUXO da linha de conteúdo, não sobreposto: assim a
 * barra superior continua inteira e clicável, e a versão do playbook e o ciclo
 * seguem visíveis o tempo todo, como em qualquer outra tela.
 */
function NarrativePanel({ estado, dispatch }) {
  const t = T.narrativa
  const { ativa, cena: numero, automatico, pausado, encerrada } = estado.narrativa
  const cena = useMemo(() => cenaPorNumero(numero), [numero])
  if (!ativa || encerrada) return null
  return (
    <>
      <aside aria-label={t.tituloDoModo}
        className="k-ink relative z-40 flex w-[26rem] max-w-[92vw] shrink-0 flex-col border-l k-bd-strong k-bg">
        <header className="border-b k-bd px-4 py-3">
          <p className="text-[10px] k-caps k-text-subtle">
            {t.cena} <span className="tnum k-text">{numeroBr(cena.n)}</span> {t.de}{' '}
            <span className="tnum">{numeroBr(TOTAL_DE_CENAS)}</span>
          </p>
          <div className="mt-2"><ProgressoDaNarrativa cena={cena.n} dispatch={dispatch} /></div>
        </header>

        <CorpoDaCena key={cena.n} cena={cena} />

        <footer className="border-t k-bd px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Botao icone={ArrowLeft} disabled={cena.n === 1} onClick={() => dispatch({ tipo: 'cena-anterior' })}>
              {t.anterior}
            </Botao>
            <Botao variante="fill" icone={ArrowRight} onClick={() => dispatch({ tipo: 'cena-proxima' })}>
              {t.proxima}
            </Botao>
            {automatico ? (
              <Botao icone={pausado ? Play : Pause} onClick={() => dispatch({ tipo: 'narrativa-pausa' })}>
                {pausado ? t.tocar : t.pausar}
              </Botao>
            ) : (
              <Botao icone={Play} onClick={() => dispatch({ tipo: 'narrativa-automatico' })}>{t.automatico}</Botao>
            )}
          </div>
          <p className="mt-2 text-[10px] k-text-subtle">{t.avancarDica}</p>
          <p className="text-[10px] k-text-subtle">{t.telaAoFundo}</p>
        </footer>
      </aside>
    </>
  )
}


/* ========================================================================== */
/* 27. MODO DE APRESENTAÇÃO                                                   */
/* ========================================================================== */

/**
 * Na primeira sala o protótipo precisa ser CONDUZIDO. Quem apresenta não pode
 * estar caçando item de menu enquanto fala — então o roteiro anda por seta, as
 * notas abrem por tecla e a demonstração reinicia por tecla, sem recarregar.
 *
 * Fora do modo, só `P` responde: nada de tecla solta mudando estado enquanto
 * alguém explora as telas por conta.
 */
const TECLAS = { apresentacao: 'p', notas: 'n', reset: 'r', comercial: 'c',
  anterior: 'ArrowLeft', proximo: 'ArrowRight', sair: 'Escape' }

const mmss = (segundos) =>
  `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(Math.round(segundos % 60)).padStart(2, '0')}`

function digitandoEm(alvo) {
  if (!alvo || typeof alvo.tagName !== 'string') return false
  const tag = alvo.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || alvo.isContentEditable === true
}

function useAtalhos(estado, dispatch) {
  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return
      if (digitandoEm(evento.target)) return
      // Antes de entrar, o app está montado mas coberto: tecla não mexe nele.
      if (!estado.entrada.liberado) return
      const { ativa, notas, passo } = estado.apresentacao
      const tecla = evento.key

      if (tecla.toLowerCase() === TECLAS.apresentacao) {
        evento.preventDefault()
        dispatch({ tipo: 'alternar-apresentacao' })
        return
      }
      // O painel comercial existe, mas não abre sem ser pedido.
      if (tecla.toLowerCase() === TECLAS.comercial) {
        evento.preventDefault()
        dispatch({ tipo: 'ligar-flag', flag: 'comercial' })
        return
      }
      if (!ativa) return
      if (tecla === TECLAS.proximo) { evento.preventDefault(); dispatch({ tipo: 'ir-para-passo', n: passo + 1 }); return }
      if (tecla === TECLAS.anterior) { evento.preventDefault(); dispatch({ tipo: 'ir-para-passo', n: passo - 1 }); return }
      if (tecla.toLowerCase() === TECLAS.notas) { evento.preventDefault(); dispatch({ tipo: 'alternar-notas' }); return }
      if (tecla.toLowerCase() === TECLAS.reset) {
        evento.preventDefault()
        dispatch({ tipo: 'reset' })
        dispatch({ tipo: 'ir-para-passo', n: 1 })
        return
      }
      if (tecla === TECLAS.sair) {
        evento.preventDefault()
        // Esc fecha as notas primeiro; só sai do modo se elas já estiverem fechadas.
        dispatch({ tipo: notas ? 'alternar-notas' : 'sair-apresentacao' })
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [estado.apresentacao, estado.entrada.liberado, dispatch])
}

function PresenterBar({ estado, dispatch }) {
  const passo = passoPorNumero(estado.apresentacao.passo)
  const decorrido = decorridoAte(passo.n)
  const progresso = Math.round((decorrido / DURACAO_DO_ROTEIRO) * 100)
  return (
    <div className="border-t k-bd k-bg-raised px-3 py-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="k-text-subtle text-[10px] k-caps">
          {T.apresentacao.passo} <span className="tnum k-text">{numeroBr(passo.n)}</span> {T.apresentacao.de}{' '}
          <span className="tnum">{numeroBr(TOTAL_DE_PASSOS)}</span>
        </span>
        <span className="k-text text-[12px] font-medium min-w-0 flex-1 truncate">{passo.nome}</span>
        <span className="k-text-subtle text-[10.5px] tnum whitespace-nowrap">
          {mmss(decorrido)} / {mmss(DURACAO_DO_ROTEIRO)}
        </span>
        <div className="flex items-center gap-1.5">
          <Botao icone={ArrowLeft} onClick={() => dispatch({ tipo: 'ir-para-passo', n: passo.n - 1 })}>
            {T.apresentacao.anterior}
          </Botao>
          <Botao icone={ArrowRight} variante="fill" onClick={() => dispatch({ tipo: 'ir-para-passo', n: passo.n + 1 })}>
            {T.apresentacao.proximo}
          </Botao>
          <Botao icone={FileText} onClick={() => dispatch({ tipo: 'alternar-notas' })}>{T.apresentacao.notas}</Botao>
          <Botao icone={RefreshCw} onClick={() => { dispatch({ tipo: 'reset' }); dispatch({ tipo: 'ir-para-passo', n: 1 }) }}>
            {T.shell.reiniciar}
          </Botao>
          <Botao icone={X} onClick={() => dispatch({ tipo: 'sair-apresentacao' })}>{T.apresentacao.sair}</Botao>
        </div>
      </div>
      <div className="mt-1.5 h-0.5 k-bg-sunken">
        <div className="h-full k-t" style={{ width: `${progresso}%`, backgroundColor: 'var(--k-accent)' }} />
      </div>
      <div className="k-text-subtle text-[10px] mt-1">{T.apresentacao.atalhos}: {T.apresentacao.atalhoLista}</div>
    </div>
  )
}

/** Overlay do apresentador. Invisível ao cliente enquanto estiver fechado. */
function PresenterNotes({ estado, dispatch }) {
  const passo = passoPorNumero(estado.apresentacao.passo)
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,.55)' }} onClick={() => dispatch({ tipo: 'alternar-notas' })}>
      <div className="k-ink border k-bd-strong w-full max-w-4xl max-h-[80vh] overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="k-text-subtle text-[10px] k-caps">
              {T.apresentacao.notas} · {T.apresentacao.passo} {numeroBr(passo.n)}/{numeroBr(TOTAL_DE_PASSOS)}
              {' · '}{T.apresentacao.duracao} {mmss(passo.duracao)}
            </div>
            <h2 className="k-text text-[15px] font-semibold mt-0.5">{passo.nome}</h2>
          </div>
          <Botao icone={X} onClick={() => dispatch({ tipo: 'alternar-notas' })}>{T.comum.fechar}</Botao>
        </div>
        <div className="k-s-held border k-bd px-3 py-2 mb-3">
          <div className="text-[10px] font-semibold k-caps">{T.apresentacao.notasAviso}</div>
        </div>
        <div className="mb-3">
          <div className="k-text-subtle text-[10px] k-caps mb-1">{T.apresentacao.fraseChave}</div>
          <p className="k-text text-[13.5px] leading-relaxed">{passo.fraseChave}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="k-text-subtle text-[10px] k-caps mb-1">{T.apresentacao.acoes}</div>
            <ul className="space-y-1">
              {passo.acoes.map((a, i) => (
                <li key={i} className="k-text-muted text-[11.5px] flex gap-1.5 leading-relaxed">
                  <span className="k-text-subtle tnum">{i + 1}.</span><span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="k-text-subtle text-[10px] k-caps mb-1">{T.apresentacao.notas}</div>
            <ul className="space-y-1">
              {passo.notas.map((n, i) => (
                <li key={i} className="k-text-muted text-[11.5px] flex gap-1.5 leading-relaxed">
                  <span className="k-text-subtle">·</span><span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Indicador permanente. Nunca pode restar dúvida de que não é ambiente produtivo. */
function DemoBadge() {
  return (
    <div className="flex items-center gap-1.5 border k-bd-strong px-2 h-[22px] k-s-held" title={T.demo.seloDetalhe}>
      <Database size={11} strokeWidth={2} />
      <span className="text-[10px] font-medium">{T.demo.selo}</span>
    </div>
  )
}

/* ========================================================================== */
/* 28. SHELL E ROTEAMENTO EM MEMÓRIA                                          */
/* ========================================================================== */

const NAV = [
  { grupo: 'grupoOperacao', itens: [
    { rota: '/mission-control', rotulo: 'missionControl', icone: Target },
    { rota: `/record/${CASO_FORNECEDOR}`, rotulo: 'record', icone: Network, casa: '/record' },
  ] },
  { grupo: 'grupoEvidencia', itens: [
    { rota: '/playbook', rotulo: 'playbook', icone: Shield },
    { rota: '/mapping', rotulo: 'mapping', icone: Table2 },
    { rota: '/packages', rotulo: 'packages', icone: Package },
  ] },
  { grupo: 'grupoDecisao', itens: [
    { rota: '/review/duplicates', rotulo: 'duplicates', icone: Copy },
    { rota: '/review/exceptions', rotulo: 'exceptions', icone: AlertTriangle },
    { rota: '/review/candidate', rotulo: 'candidate', icone: Boxes },
    { rota: '/reconciliation', rotulo: 'reconciliation', icone: Layers },
    { rota: '/gates', rotulo: 'gates', icone: Flag },
  ] },
]

/**
 * Título e resumo de cada tela escura. As telas de documento trazem o próprio
 * cabeçalho, porque são evidência e precisam se identificar fora do shell.
 */
const CABECALHOS = {
  '/mission-control': { titulo: T.missionControl.titulo, resumo: T.missionControl.resumo },
  '/record': { titulo: T.record.titulo, resumo: T.record.subtitulo },
  '/review/duplicates': { titulo: T.duplicates.titulo, resumo: T.duplicates.subtitulo },
  '/review/exceptions': { titulo: T.exceptions.titulo, resumo: T.exceptions.subtitulo },
  '/review/candidate': { titulo: T.candidate.titulo, resumo: T.candidate.subtitulo },
  '/reconciliation': { titulo: T.reconciliation.titulo, resumo: T.reconciliation.subtitulo },
  '/gates': { titulo: T.gates.titulo, resumo: T.gates.subtitulo },
  '/gates/payment': { titulo: T.payment.titulo, resumo: T.payment.subtitulo },
}
const cabecalhoDaRota = (caminho) =>
  CABECALHOS[caminho] ?? (caminho.startsWith('/record/') ? CABECALHOS['/record'] : null)

/** O roteamento é em memória: `rota` é uma string de path com query opcional. */
function partesDaRota(rota) {
  const [caminho, busca = ''] = rota.split('?')
  const params = new URLSearchParams(busca)
  return { caminho, params }
}

function TopBar({ estado, dispatch }) {
  const { playbookVersion, ciclo, spe } = estado
  const selado = sealPlaybook(playbookVersion)
  return (
    <header className="border-b k-bd k-bg-raised px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="k-text text-[15px] font-semibold tracking-wide">{T.produto.nome}</span>
        <span className="k-text-subtle text-[10.5px] truncate">
          {T.produto.subtitulo} · {T.produto.fornecedor} → {T.produto.cliente}
        </span>
      </div>
      {/* Sem estes dois sempre visíveis, nenhum número de nenhuma tela tem contexto. */}
      <div className="flex flex-wrap items-center gap-3 text-[10.5px]">
        <span className="k-text-subtle">
          {T.shell.versaoPlaybook}: <Mono className="k-text">{playbookVersion}</Mono>
          <Mono className="k-text-subtle ml-1">{selado.checksum}</Mono>
        </span>
        <label className="inline-flex items-center gap-1 k-text-subtle">
          {T.shell.ciclo}
          <select value={ciclo} onChange={(e) => dispatch({ tipo: 'ciclo', ciclo: e.target.value })}
            className="k-t h-6 px-1 text-[10.5px] border k-bd-strong k-bg k-text">
            {cycleSpecs.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <label className="inline-flex items-center gap-1 k-text-subtle">
          {T.shell.spe}
          <select value={spe} onChange={(e) => dispatch({ tipo: 'spe', spe: e.target.value })}
            className="k-t h-6 px-1 text-[10.5px] border k-bd-strong k-bg k-text">
            <option value="todas">{T.shell.todasSpes}</option>
            {speIds.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <span className="k-text-subtle">{T.shell.onda}</span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <DemoBadge />
        {/* Um botão só. Ou você assiste à apresentação, ou clica você mesmo — e o
            rótulo diz qual das duas coisas o clique faz. O roteiro do
            apresentador, que é outra coisa, continua na tecla P. */}
        {estado.narrativa.ativa ? (
          <Botao icone={Compass} titulo={T.narrativa.dicaSair}
            onClick={() => dispatch({ tipo: 'narrativa-explorar' })}>
            {T.narrativa.explorar}
          </Botao>
        ) : (
          <Botao variante="fill" icone={Play} titulo={T.narrativa.dicaEntrar}
            onClick={() => dispatch({ tipo: 'narrativa-retomar' })}>
            {T.narrativa.verApresentacao}
          </Botao>
        )}
      </div>
    </header>
  )
}

function SideNav({ estado, ir }) {
  const { caminho } = partesDaRota(estado.rota)
  return (
    <nav className="w-52 shrink-0 border-r k-bd k-bg-raised py-2 overflow-y-auto">
      {NAV.map((secao) => (
        <div key={secao.grupo} className="mb-3">
          <div className="k-text-subtle text-[9.5px] k-caps px-3 mb-1">{T.nav[secao.grupo]}</div>
          {secao.itens.map((item) => {
            const ativo = caminho === item.rota.split('?')[0] || (item.casa && caminho.startsWith(item.casa))
            return (
              <button key={item.rota} type="button" onClick={() => ir(item.rota)} title={T.nav[item.rotulo]}
                className={`k-t w-full text-left px-3 h-7 flex items-center gap-2 text-[11.5px]
                  ${ativo ? 'k-text-accent k-bg-sunken' : 'k-text-muted hover:k-text'}`}>
                <item.icone size={IC} strokeWidth={1.75} />
                <span className="truncate">{T.nav[item.rotulo]}</span>
              </button>
            )
          })}
        </div>
      ))}
      {estado.flags.comercial ? (
        <div className="mb-3">
          <div className="k-text-subtle text-[9.5px] k-caps px-3 mb-1">{T.payment.titulo}</div>
          <button type="button" onClick={() => ir('/gates/payment')}
            className={`k-t w-full text-left px-3 h-7 flex items-center gap-2 text-[11.5px]
              ${caminho === '/gates/payment' ? 'k-text-accent k-bg-sunken' : 'k-text-muted hover:k-text'}`}>
            <Scale size={IC} strokeWidth={1.75} />
            <span className="truncate">{T.nav.payment}</span>
          </button>
        </div>
      ) : null}
    </nav>
  )
}

/* ========================================================================== */
/* 29. A TELA DE ENTRADA                                                      */
/* ========================================================================== */

/**
 * A credencial da demonstração. **Muda aqui e em nenhum outro lugar** — a tela
 * lê o usuário daqui para pré-preencher o campo.
 *
 * Está em texto claro, e é para estar: ver o comentário do portão em
 * `ESTADO_INICIAL`. Quem abrir o inspetor lê. O que o portão faz é dar uma porta
 * ao link, não proteger dado — não há dado real aqui para proteger.
 */
const CREDENCIAL = { usuario: 'admin', senha: 'verene2026' }

/** Duração da transição para a cena 1 da narrativa. */
const TRANSICAO_MS = 300

const credencialConfere = (usuario, senha) =>
  usuario.trim() === CREDENCIAL.usuario && senha === CREDENCIAL.senha

function CampoDeEntrada({ rotulo, tipo, valor, aoMudar, aoConfirmar, foco }) {
  return (
    <label className="block">
      <span className="k-text-subtle text-[9.5px] k-caps">{rotulo}</span>
      <input
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        // Não há elemento de formulário: o Enter é tratado aqui.
        onKeyDown={(e) => { if (e.key === 'Enter') aoConfirmar() }}
        autoFocus={foco}
        autoComplete="off"
        className="k-t mt-1 h-7 w-full border k-bd-strong k-bg-sunken px-2 text-[12.5px] k-text"
      />
    </label>
  )
}

/**
 * O primeiro momento do produto.
 *
 * O app inteiro já está montado atrás desta tela, na cena 1 da narrativa.
 * Quando a credencial confere, ela desaparece em ~300ms e revela o que já
 * estava lá: nada monta durante a animação, então não há salto nem tela branca.
 *
 * O usuário vem preenchido — a pessoa só digita a senha. Sem contador de
 * tentativa, sem captcha, sem expiração.
 */
function EntryScreen({ estado, dispatch }) {
  const t = T.entrada
  const { liberado, saindo } = estado.entrada
  const [usuario, setUsuario] = useState(CREDENCIAL.usuario)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)

  // A transição termina sozinha; `prefers-reduced-motion` zera a duração no CSS
  // e o relógio continua o mesmo: some na hora.
  useEffect(() => {
    if (!saindo) return undefined
    const relogio = window.setTimeout(() => dispatch({ tipo: 'entrada-concluir' }), TRANSICAO_MS)
    return () => window.clearTimeout(relogio)
  }, [saindo, dispatch])

  if (liberado) return null

  const tentar = () => {
    if (credencialConfere(usuario, senha)) {
      dispatch({ tipo: 'entrada-liberar' })
      return
    }
    setErro(true)
  }
  // Digitar de novo limpa o erro: a mensagem fala da tentativa, não da pessoa.
  const digitar = (aplicar) => (v) => { setErro(false); aplicar(v) }

  // Durante a transição a tela continua capturando clique, mesmo invisível:
  // liberar o ponteiro antes da hora deixaria o clique cair na área que avança
  // a narrativa, e o cliente veria a cena 2 sem ter pedido.
  return (
    <div
      className={`k-ink k-t fixed inset-0 z-[60] flex items-center justify-center k-bg p-6
        ${saindo ? 'opacity-0' : 'opacity-100'}`}
      style={{ transitionProperty: 'opacity', transitionDuration: `${TRANSICAO_MS}ms` }}
    >
      {/* A identidade primeiro, a credencial depois — nesta ordem quem abre o
          link sabe onde chegou antes de ser perguntado quem é. */}
      <div className="w-full max-w-md">
        <div className="k-text text-[19px] font-semibold tracking-wide">{T.produto.nome}</div>
        <p className="k-text-muted text-[12.5px] mt-1">{T.produto.subtitulo}</p>
        <p className="k-text-subtle text-[11px] mt-0.5">
          {T.produto.fornecedor} → {T.produto.cliente}
        </p>

        <div className="mt-4"><DemoBadge /></div>

        <div className="mt-5 border k-bd k-bg-raised p-4">
          <p className="k-text-subtle text-[9.5px] k-caps">{t.titulo}</p>
          <div className="mt-3 space-y-2">
            <CampoDeEntrada rotulo={t.usuario} tipo="text" valor={usuario}
              aoMudar={digitar(setUsuario)} aoConfirmar={tentar} />
            <CampoDeEntrada rotulo={t.senha} tipo="password" valor={senha}
              aoMudar={digitar(setSenha)} aoConfirmar={tentar} foco />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Botao variante="fill" icone={LogIn} onClick={tentar}>{t.entrar}</Botao>
            {/* `role="alert"` para leitor de tela anunciar sem mover o foco. */}
            {erro ? <p role="alert" className="k-fg-exception text-[12px]">{t.erro}</p> : null}
          </div>
        </div>

        <p className="k-text-subtle text-[10px] leading-relaxed mt-4">{t.nota}</p>
      </div>
    </div>
  )
}

/* ========================================================================== */
/* 30. O COMPONENTE                                                           */
/* ========================================================================== */

export default function KeplerGalaxy() {
  const [estado, dispatch] = useReducer(reducer, undefined, estadoInicial)
  const ir = useCallback((rota) => dispatch({ tipo: 'navegar', rota }), [])
  useAtalhos(estado, dispatch)

  // A flag também liga por parâmetro na URL do artifact, como no projeto. Vive em
  // memória a partir daí; `reset` desliga.
  // A narrativa é o estado inicial: a cena 1 encontra a onda pronta na abertura.
  useEffect(() => {
    dispatch({ tipo: 'cena', n: 1 })
  }, [])

  useEffect(() => {
    try {
      const busca = typeof window !== 'undefined' ? window.location.search : ''
      if (new URLSearchParams(busca).getAll('flag').includes('comercial')) {
        dispatch({ tipo: 'ligar-flag', flag: 'comercial' })
      }
    } catch {
      // Ambiente sem location: a flag continua desligada, que é o padrão certo.
    }
  }, [])

  const { caminho, params } = partesDaRota(estado.rota)
  const cabecalho = cabecalhoDaRota(
    caminho === '/gates/payment' && !estado.flags.comercial ? '/gates' : caminho,
  )
  const diff = useMemo(() => {
    if (estado.regeneracao === null) return null
    const antes = runDeTodasSpes(estado.regeneracao.de, estado.regeneracao.approvalsDe)
    const depois = runDeTodasSpes(estado.regeneracao.para, estado.approvals)
    return diffDeRegeneracao(antes, depois)
  }, [estado.regeneracao, estado.approvals])

  const conteudo = (() => {
    if (caminho === '/playbook') {
      return <PlaybookScreen estado={estado} dispatch={dispatch} ir={ir} regraSelecionada={params.get('regra')} />
    }
    if (caminho === '/mapping') return <MappingScreen estado={estado} dispatch={dispatch} ir={ir} />
    if (caminho.startsWith('/record/')) {
      return <RecordScreen estado={estado} ir={ir} id={decodeURIComponent(caminho.slice('/record/'.length))} />
    }
    if (caminho === '/review/duplicates') return <DuplicatesScreen estado={estado} dispatch={dispatch} ir={ir} />
    if (caminho === '/review/exceptions') return <ExceptionsScreen estado={estado} dispatch={dispatch} ir={ir} />
    if (caminho === '/review/candidate') return <CandidateRuleScreen estado={estado} dispatch={dispatch} ir={ir} />
    if (caminho === '/packages') return <PackagesScreen estado={estado} dispatch={dispatch} ir={ir} />
    if (caminho === '/reconciliation') return <ReconciliationScreen estado={estado} dispatch={dispatch} ir={ir} />
    if (caminho === '/gates') return <GatesScreen estado={estado} dispatch={dispatch} ir={ir} />
    // Sem a flag, a rota comercial volta para os Gates e nem o link aparece.
    if (caminho === '/gates/payment') {
      return estado.flags.comercial
        ? <GatePaymentScreen estado={estado} ir={ir} />
        : <GatesScreen estado={estado} dispatch={dispatch} ir={ir} />
    }
    return <MissionControlScreen estado={estado} ir={ir} />
  })()

  return (
    <div className="k-root k-ink h-full min-h-screen flex flex-col">
      <style>{CSS}</style>
      {/* Acima do escurecimento da narrativa: a versão do playbook e o ciclo ficam
          sempre visíveis, e o botão de entrar e sair continua clicável. */}
      <div className="relative z-50">
        <TopBar estado={estado} dispatch={dispatch} />
      </div>
      <div className="flex flex-1 min-h-0">
        <SideNav estado={estado} ir={ir} />
        <main className="flex-1 min-w-0 overflow-y-auto p-4">
          {cabecalho ? (
            <header className="mb-4">
              <h1 className="text-[17px] k-text font-semibold">{cabecalho.titulo}</h1>
              <p className="k-text-muted text-[12px] mt-1 max-w-3xl">{cabecalho.resumo}</p>
            </header>
          ) : null}
          {diff ? <div className="mb-4"><PropagationTrail diff={diff} ir={ir} /></div> : null}
          {conteudo}
        </main>
        <NarrativePanel estado={estado} dispatch={dispatch} />
      </div>
      {estado.apresentacao.ativa ? <PresenterBar estado={estado} dispatch={dispatch} /> : null}
      {estado.apresentacao.ativa && estado.apresentacao.notas
        ? <PresenterNotes estado={estado} dispatch={dispatch} /> : null}
      {/* A camada narrada fica por cima de tudo — inclusive do modo de
          apresentação, que conduz quem apresenta, não quem assiste. */}
      <NarrativeOverlay estado={estado} dispatch={dispatch} />
      {/* Por cima de tudo, inclusive da narrativa: é a primeira coisa da sala. */}
      <EntryScreen estado={estado} dispatch={dispatch} />
    </div>
  )
}
