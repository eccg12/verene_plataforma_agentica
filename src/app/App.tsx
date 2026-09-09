import { RouterProvider } from 'react-router-dom'

import { EntryScreen } from '@/entry/EntryScreen'

import { router } from './routes'

/**
 * O app fica montado desde o primeiro instante, atrás da tela de entrada. É o
 * que permite a transição de ~300ms revelar a cena 1 já pronta, em vez de
 * montar o app durante a animação e entregar um salto no lugar de uma
 * transição.
 *
 * Enquanto a entrada não é liberada nada responde ao teclado: ver
 * `useAtalhosDeApresentacao` e o painel narrado.
 */
export function App() {
  return (
    <>
      <RouterProvider router={router} />
      <EntryScreen />
    </>
  )
}
