import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/AppShell'
import { MappingScreen } from '@/screens/MappingScreen'
import { MissionControlScreen } from '@/screens/MissionControlScreen'
import { PlaybookScreen } from '@/screens/PlaybookScreen'
import { StyleguideScreen } from '@/screens/StyleguideScreen'

import { paths } from './paths'

export const router = createBrowserRouter([
  {
    path: paths.home,
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to={paths.missionControl} replace /> },
      { path: paths.missionControl, element: <MissionControlScreen /> },
      { path: paths.playbook, element: <PlaybookScreen /> },
      { path: paths.mapping, element: <MappingScreen /> },
      { path: paths.styleguide, element: <StyleguideScreen /> },
    ],
  },
])
