import { Surface } from '@/components'
import { strings } from '@/copy/strings'

/**
 * Tela inicial — ainda em branco. As telas do protótipo entram aqui.
 */
export function HomeScreen() {
  return (
    <Surface surface="ink" className="flex h-full items-center justify-center">
      <h1 className="text-sm font-medium tracking-[0.4em] text-fg-subtle">
        {strings.screens.home.wordmark}
      </h1>
    </Surface>
  )
}
