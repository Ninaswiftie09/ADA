import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage   from './pages/LandingPage'
import SignUpPage    from './pages/SignUpPage'
import LoginPage     from './pages/LoginPage'
import OptimizerPage from './pages/OptimizerPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<LandingPage />}   />
        <Route path="/signup" element={<SignUpPage />}     />
        <Route path="/login"  element={<LoginPage />}      />
        <Route path="/app"    element={<OptimizerPage />}  />
      </Routes>
    </BrowserRouter>
  )
}
