import { Routes, Route } from 'react-router-dom'
import Login from './pages/login.jsx'
import Registro from "./pages/registro.jsx";
import Home from "./pages/Home.jsx";
import Propiedades from "./pages/Propiedades.jsx";
import PropiedadDetalle from "./pages/PropiedadDetalles.jsx";
import Chat from "./pages/Chat.jsx";


export default function App() {
  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/propiedades" element={<Propiedades />} />
        <Route path="/propiedades/:id" element={<PropiedadDetalle />} />
        <Route path="/chat/:id" element={<Chat />} />
    </Routes>
  )
}