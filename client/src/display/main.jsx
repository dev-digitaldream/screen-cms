import React from 'react'
import { createRoot } from 'react-dom/client'
import DisplayApp from './DisplayApp'
import '../styles/index.css'

createRoot(document.getElementById('display-root')).render(<DisplayApp />)
