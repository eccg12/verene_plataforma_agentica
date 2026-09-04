import { createBrowserRouter, Navigate } from 'react-router-dom'

import { AppShell } from '@/components/AppShell'
import { DuplicatesScreen } from '@/screens/DuplicatesScreen'
import { ExceptionsScreen } from '@/screens/ExceptionsScreen'
import { MappingScreen } from '@/screens/MappingScreen'
import { RecordScreen } from '@/screens/RecordScreen'
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
      { path: paths.record, element: <RecordScreen /> },
      { path: paths.duplicates, element: <DuplicatesScreen /> },
      { path: paths.exceptions, element: <ExceptionsScreen /> },
      { path: paths.styleguide, element: <StyleguideScreen /> },
    ],
  },
])
