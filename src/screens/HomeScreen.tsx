import { strings } from '@/copy/strings'

/**
 * Tela inicial — ainda em branco. Existe para confirmar que o scaffold monta e
 * que o texto vem de `src/copy/strings.ts`. As telas do protótipo entram aqui.
 */
export function HomeScreen() {
  return (
    <main className="flex h-full items-center justify-center">
      <h1 className="text-sm font-medium tracking-[0.4em] text-neutral-400">
        {strings.screens.home.wordmark}
      </h1>
    </main>
  )
}
