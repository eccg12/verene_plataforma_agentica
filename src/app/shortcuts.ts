/**
 * Atalhos do modo de apresentação.
 *
 * Na primeira sala o protótipo precisa ser CONDUZIDO. Quem apresenta não pode
 * estar caçando item de menu enquanto fala — então o roteiro anda por seta, as
 * notas abrem por tecla, e a demonstração reinicia por tecla, sem recarregar.
 *
 * Fora do modo, só `P` responde: nada de tecla solta mudando estado enquanto
 * alguém explora as telas por conta.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { passoPorNumero } from '@/data/presentation'
import { useEntry } from '@/entry/store'
import { useSimulation } from '@/engine/store'

export const TECLAS = {
  apresentacao: 'p',
  notas: 'n',
  reset: 'r',
  anterior: 'ArrowLeft',
  proximo: 'ArrowRight',
  sair: 'Escape',
} as const

/** Tecla digitada dentro de um campo é texto, não atalho. */
function digitandoEm(alvo: EventTarget | null): boolean {
  if (!(alvo instanceof HTMLElement)) return false
  const tag = alvo.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || alvo.isContentEditable
}

export function useAtalhosDeApresentacao(): void {
  const navigate = useNavigate()

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return
      if (digitandoEm(evento.target)) return
      // Antes de entrar, o app está montado mas coberto: tecla não mexe nele.
      if (!useEntry.getState().liberado) return

      const estado = useSimulation.getState()
      const { ativa, passo, notas } = estado.apresentacao
      const tecla = evento.key

      if (tecla.toLowerCase() === TECLAS.apresentacao) {
        evento.preventDefault()
        estado.alternarApresentacao()
        if (!ativa) navigate(passoPorNumero(1).path)
        return
      }

      if (!ativa) return

      const ir = (n: number) => {
        evento.preventDefault()
        estado.irParaPasso(n)
        navigate(passoPorNumero(n).path)
      }

      if (tecla === TECLAS.proximo) return ir(passo + 1)
      if (tecla === TECLAS.anterior) return ir(passo - 1)
      if (tecla.toLowerCase() === TECLAS.notas) {
        evento.preventDefault()
        return estado.alternarNotas()
      }
      if (tecla.toLowerCase() === TECLAS.reset) {
        evento.preventDefault()
        estado.reset()
        estado.irParaPasso(1)
        navigate(passoPorNumero(1).path)
        return
      }
      if (tecla === TECLAS.sair) {
        evento.preventDefault()
        // Esc fecha as notas primeiro; só sai do modo se elas já estiverem fechadas.
        if (notas) return estado.alternarNotas()
        return estado.sairDaApresentacao()
      }
    }

    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [navigate])
}
