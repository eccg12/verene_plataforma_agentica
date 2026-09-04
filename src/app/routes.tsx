import { createBrowserRouter } from 'react-router-dom'

import { HomeScreen } from '@/screens/HomeScreen'

import { paths } from './paths'

export const router = createBrowserRouter([
  {
    path: paths.home,
    element: <HomeScreen />,
  },
])
