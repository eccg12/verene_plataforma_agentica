import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/AppShell'
import { MissionControlScreen } from '@/screens/MissionControlScreen'
import { StyleguideScreen } from '@/screens/StyleguideScreen'

import { paths } from './paths'

export const router = createBrowserRouter([
  {
    path: paths.home,
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to={paths.missionControl} replace /> },
      { path: paths.missionControl, element: <MissionControlScreen /> },
      { path: paths.styleguide, element: <StyleguideScreen /> },
    ],
  },
])
