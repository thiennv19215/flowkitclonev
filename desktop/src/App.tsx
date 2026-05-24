import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/layout/AppLayout'
import Dashboard from '@/pages/Dashboard'
import ImagePage from '@/pages/ImagePage'
import VideoPage from '@/pages/VideoPage'
import Storyboard from '@/pages/Storyboard'
import Pipeline from '@/pages/Pipeline'
import ReviewBoard from '@/pages/ReviewBoard'
import Export from '@/pages/Export'
import Audio from '@/pages/Audio'
import Settings from '@/pages/Settings'

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="image" element={<ImagePage />} />
          <Route path="video" element={<VideoPage />} />
          <Route path="project/:id" element={<Storyboard />} />
          <Route path="pipeline/:id" element={<Pipeline />} />
          <Route path="review/:id" element={<ReviewBoard />} />
          <Route path="export/:id" element={<Export />} />
          <Route path="audio/:id" element={<Audio />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
