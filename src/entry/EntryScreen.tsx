import { useEffect, useState } from 'react'
import { LogIn } from 'lucide-react'

import { BrandLogo } from '@/components/BrandLogo'
import { Button } from '@/components/Button'
import { DemoBadge } from '@/components/DemoBadge'
import { strings } from '@/copy/strings'
import { CREDENCIAL, credencialConfere, TRANSICAO_MS, useEntry } from '@/entry/store'

const CAMPO =
  'h-7 w-full rounded-sm border border-line-strong bg-surface-sunken px-2 text-sm text-fg ' +
  'placeholder:text-fg-subtle'

function Campo({
  rotulo,
  tipo,
  valor,
  aoMudar,
  aoConfirmar,
  foco,
}: {
  readonly rotulo: string
  readonly tipo: 'text' | 'password'
  readonly valor: string
  readonly aoMudar: (v: string) => void
  readonly aoConfirmar: () => void
  readonly foco?: boolean
}) {
  return (
    <label className="block">
      <span className="text-2xs uppercase tracking-wider text-fg-subtle">{rotulo}</span>
      <input
        type={tipo}
        value={valor}
        // Não há elemento de formulário: o Enter é tratado aqui, para a tela
        // ser a mesma no projeto e no artifact de arquivo único.
        onChange={(e) => aoMudar(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') aoConfirmar()
        }}
        autoFocus={foco}
        autoComplete="off"
        className={`mt-1 ${CAMPO}`}
      />
    </label>
  )
}

/**
 * A tela de entrada — o primeiro momento do produto.
 *
 * O app inteiro já está montado atrás dela, na cena 1 da narrativa. Quando a
 * credencial confere, esta tela desaparece em ~300ms e revela o que já estava
 * lá: nada monta durante a animação, então não há salto nem tela em branco.
 *
 * O usuário vem preenchido: a pessoa só digita a senha. Não há bloqueio por
 * tentativa, contador nem captcha — ver `store.ts` para o porquê.
 */
export function EntryScreen() {
  const t = strings.entrada
  const liberado = useEntry((s) => s.liberado)
  const saindo = useEntry((s) => s.saindo)
  const liberar = useEntry((s) => s.liberar)
  const concluir = useEntry((s) => s.concluir)

  const [usuario, setUsuario] = useState<string>(CREDENCIAL.usuario)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(false)

  // A transição termina sozinha. `prefers-reduced-motion` zera a duração da
  // transição em `globals.css`, e o relógio continua o mesmo: some na hora.
  useEffect(() => {
    if (!saindo) return
    const relogio = window.setTimeout(concluir, TRANSICAO_MS)
    return () => window.clearTimeout(relogio)
  }, [saindo, concluir])

  if (liberado) return null

  const tentar = () => {
    if (credencialConfere(usuario, senha)) {
      liberar()
      return
    }
    setErro(true)
  }

  // Digitar de novo limpa o erro: a mensagem fala da tentativa, não da pessoa.
  const digitar = (aplicar: (v: string) => void) => (v: string) => {
    setErro(false)
    aplicar(v)
  }

  // Durante a transição a tela continua capturando clique, mesmo invisível:
  // liberar o ponteiro antes da hora deixaria o clique cair na área que avança
  // a narrativa, e o cliente veria a cena 2 sem ter pedido.
  return (
    <div
      className={`surface-ink fixed inset-0 z-[60] flex items-center justify-center bg-surface p-6 transition-opacity duration-300 ease-out ${
        saindo ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* A identidade primeiro, a credencial depois — nesta ordem quem abre o
          link sabe onde chegou antes de ser perguntado quem é. */}
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-4">
          <BrandLogo brand="monoda" className="h-6" />
          <span aria-hidden="true" className="text-sm text-fg-subtle">
            {strings.simbolos.paraQuem}
          </span>
          <BrandLogo brand="verene" className="h-6" />
        </div>

        <h1 className="mt-6 text-xl font-medium tracking-tight text-fg">{strings.app.name}</h1>
        <p className="mt-0.5 text-sm text-fg-muted">{strings.app.descriptor}</p>
        <p className="mt-0.5 text-xs text-fg-subtle">
          {strings.app.provider}
          {strings.simbolos.paraQuem}
          {strings.app.client}
        </p>

        <div className="mt-4">
          <DemoBadge />
        </div>

        <div className="mt-6 border border-line bg-surface-raised p-4">
          <p className="text-2xs uppercase tracking-wider text-fg-subtle">{t.titulo}</p>

          <div className="mt-3 flex flex-col gap-3">
            <Campo
              rotulo={t.usuario}
              tipo="text"
              valor={usuario}
              aoMudar={digitar(setUsuario)}
              aoConfirmar={tentar}
            />
            <Campo
              rotulo={t.senha}
              tipo="password"
              valor={senha}
              aoMudar={digitar(setSenha)}
              aoConfirmar={tentar}
              foco
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button variant="primary" onClick={tentar}>
              <LogIn size={14} aria-hidden="true" />
              {t.entrar}
            </Button>
            {/* `role="alert"` para leitor de tela anunciar sem mover o foco. */}
            {erro ? (
              <p role="alert" className="text-sm text-exception">
                {t.erro}
              </p>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-2xs leading-relaxed text-fg-subtle">{t.nota}</p>
      </div>
    </div>
  )
}
