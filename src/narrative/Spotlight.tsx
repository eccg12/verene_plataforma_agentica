import { useEffect, useState } from 'react'

/**
 * O foco sobre o elemento da cena.
 *
 * Escurece a tela inteira e abre um buraco exatamente sobre o elemento
 * destacado. O escurecimento é a sombra do próprio buraco — uma sombra
 * gigantesca para fora —, então não há duas camadas para manter em sincronia e
 * não existe o instante em que o brilho e a máscara discordam.
 *
 * Nada aqui toca no elemento destacado: só o mede. Se o seletor não encontrar
 * nada, escurece a tela sem buraco e a cena continua — destaque quebrado nunca
 * pode derrubar a narração na frente do cliente.
 */
interface SpotlightProps {
  readonly seletor: string | null
  /** Muda a cada cena: força a remedição depois da troca de tela. */
  readonly chave: number
}

interface Recorte {
  readonly top: number
  readonly left: number
  readonly width: number
  readonly height: number
}

const MARGEM = 8

/**
 * O escurecimento não é cor de paleta: é oclusão. Não entra em
 * `tailwind.config.ts` nem no `@theme` por isso — não há par texto/fundo a
 * medir, e um token novo aqui só faria a auditoria de contraste conferir algo
 * que não é texto.
 */
const SOMBRA = 'rgba(5, 5, 5, 0.66)'

export function Spotlight({ seletor, chave }: SpotlightProps) {
  const [recorte, setRecorte] = useState<Recorte | null>(null)

  useEffect(() => {
    // Sem seletor não há o que medir: a renderização já devolve o escurecimento
    // sem buraco, e o efeito não precisa mexer em estado nenhum.
    if (seletor === null) return

    let vivo = true
    let quadro = 0

    const medir = () => {
      const alvo = document.querySelector(seletor)
      if (!vivo) return
      if (!(alvo instanceof HTMLElement)) {
        setRecorte(null)
        return
      }
      const r = alvo.getBoundingClientRect()
      setRecorte({
        top: r.top - MARGEM,
        left: r.left - MARGEM,
        width: r.width + MARGEM * 2,
        height: r.height + MARGEM * 2,
      })
    }

    // A tela de fundo pode ter acabado de trocar de rota: espera o elemento
    // existir antes de desistir dele.
    let tentativas = 0
    const procurar = () => {
      const alvo = document.querySelector(seletor)
      if (alvo instanceof HTMLElement) {
        alvo.scrollIntoView({ block: 'center', behavior: 'smooth' })
        // A rolagem suave move o elemento; mede no quadro seguinte e de novo
        // quando ela terminar.
        quadro = window.requestAnimationFrame(medir)
        window.setTimeout(medir, 320)
        return
      }
      if (tentativas > 20) {
        setRecorte(null)
        return
      }
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

  if (seletor === null || recorte === null) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-30"
        style={{ backgroundColor: SOMBRA }}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-30 rounded-sm border border-accent transition-all duration-150 ease-out"
      style={{
        top: recorte.top,
        left: recorte.left,
        width: recorte.width,
        height: recorte.height,
        boxShadow: `0 0 0 100vmax ${SOMBRA}, 0 0 0 1px var(--color-accent)`,
      }}
    />
  )
}
