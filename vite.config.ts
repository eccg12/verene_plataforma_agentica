import { fileURLToPath, URL } from 'node:url'

import Anthropic from '@anthropic-ai/sdk'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'

/**
 * A ÚNICA chamada de rede do projeto (regra 1 do CLAUDE.md).
 *
 * A tela de regra candidata é a única onde comportamento ao vivo vale mais que
 * simulação: é o momento em que o agente evidencia uma regra e para. Aqui a
 * hipótese é gerada de fato, a partir dos registros divergentes.
 *
 * A chave NUNCA chega ao browser. Ela é lida de `ANTHROPIC_API_KEY` no processo
 * do servidor — sem o prefixo `VITE_`, portanto fora do bundle — e o cliente
 * chama esta rota na mesma origem. Servido como estático, o endpoint não existe,
 * a chamada falha e a tela cai na resposta de referência, sem erro visível.
 */
const MODELO = 'claude-sonnet-4-6'
const TIMEOUT_MS = 15_000
const MAX_TOKENS = 1024

const SISTEMA = [
  'Você analisa cadastros de fornecedores de um ERP legado durante uma migração para SAP S/4HANA.',
  'Sua tarefa é enunciar a HIPÓTESE da regra de negócio que explicaria uma divergência entre empresas do mesmo grupo.',
  '',
  'Regras da resposta:',
  '1. Responda SOMENTE com um objeto JSON, sem cercas de código e sem texto antes ou depois.',
  '2. O objeto tem exatamente três chaves: "enunciado" (string), "evidencia" (array de strings) e "naoConfirmavel" (string).',
  '3. Cada item de "evidencia" cita ao menos um código de registro recebido. Não invente código, valor ou campo que não esteja nos dados.',
  '4. "naoConfirmavel" declara explicitamente o que NÃO dá para determinar a partir do dado, e por quê.',
  '5. Português do Brasil. Não afirme que a regra está correta: você a evidencia, não a confirma.',
].join('\n')

interface CorpoDaRequisicao {
  readonly registros?: unknown
  readonly regra?: unknown
}

async function lerCorpo(req: { on: (evento: string, fn: (c?: unknown) => void) => void }): Promise<string> {
  return new Promise((resolve, reject) => {
    let dados = ''
    req.on('data', (chunk) => {
      dados += String(chunk)
    })
    req.on('end', () => resolve(dados))
    req.on('error', () => reject(new Error('leitura interrompida')))
  })
}

function extrairJson(texto: string): Record<string, unknown> | null {
  const inicio = texto.indexOf('{')
  const fim = texto.lastIndexOf('}')
  if (inicio < 0 || fim <= inicio) return null
  try {
    const objeto: unknown = JSON.parse(texto.slice(inicio, fim + 1))
    return typeof objeto === 'object' && objeto !== null ? (objeto as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function rotaDaHipotese(): Plugin {
  const montar = (server: ViteDevServer | { middlewares: ViteDevServer['middlewares'] }) => {
    server.middlewares.use('/api/regra-candidata', (req, res) => {
      const responder = (status: number, corpo: unknown) => {
        res.statusCode = status
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(corpo))
      }

      if (req.method !== 'POST') return responder(405, { erro: 'metodo' })

      // Toda resposta é 200. A ausência de hipótese não é falha da página: é
      // ausência, e o cliente já sabe o que fazer com ela. Responder 5xx só
      // pintaria de vermelho o console durante a apresentação.
      const indisponivel = (motivo: string) => responder(200, { disponivel: false, motivo })

      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) return indisponivel('sem-chave')

      void (async () => {
        try {
          const corpo = JSON.parse(await lerCorpo(req)) as CorpoDaRequisicao
          const client = new Anthropic({ apiKey, timeout: TIMEOUT_MS, maxRetries: 1 })
          const resposta = await client.messages.create({
            model: MODELO,
            max_tokens: MAX_TOKENS,
            system: SISTEMA,
            messages: [
              {
                role: 'user',
                content: [
                  'Regra candidata em aberto no playbook:',
                  JSON.stringify(corpo.regra, null, 2),
                  '',
                  'Registros divergentes:',
                  JSON.stringify(corpo.registros, null, 2),
                ].join('\n'),
              },
            ],
          })

          const texto = resposta.content
            .filter((bloco): bloco is Anthropic.TextBlock => bloco.type === 'text')
            .map((bloco) => bloco.text)
            .join('')

          const objeto = extrairJson(texto)
          const evidencia = Array.isArray(objeto?.evidencia)
            ? objeto.evidencia.filter((e): e is string => typeof e === 'string')
            : []
          if (
            objeto === null ||
            typeof objeto.enunciado !== 'string' ||
            typeof objeto.naoConfirmavel !== 'string' ||
            evidencia.length === 0
          ) {
            return indisponivel('formato')
          }

          responder(200, {
            disponivel: true,
            enunciado: objeto.enunciado,
            evidencia,
            naoConfirmavel: objeto.naoConfirmavel,
            modelo: resposta.model,
          })
        } catch {
          // Qualquer falha — chave inválida, rede, timeout, 429 — cai igual.
          indisponivel('chamada')
        }
      })()
    })
  }

  return {
    name: 'kepler-regra-candidata',
    configureServer: montar,
    configurePreviewServer: montar,
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), rotaDaHipotese()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
})
