import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios.jsx'
import { T, G } from '../theme.js'

export default function Registro() {
  const [form, setForm] = useState({
    username: '', nombre: '', apellidos: '', Nikname: '',
    email: '', fecha_nacimiento: '', dni: '', password: '', password2: '',
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (form.password !== form.password2) { setError('Las contraseñas no coinciden'); return }
    try {
      await api.post('/usuarios/', {
        username: form.username, nombre: form.nombre, apellidos: form.apellidos,
        Nikname: form.Nikname, email: form.email,
        fecha_nacimiento: form.fecha_nacimiento, dni: form.dni, password: form.password,
      })
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      if (data) { const p = Object.values(data)[0]; setError(Array.isArray(p) ? p[0] : p) }
      else setError('Error al registrarse')
    }
  }

  const F = (name, label, type = 'text') => (
    <div key={name}>
      <label style={G.label}>{label}</label>
      <input style={G.input} type={type} name={name}
        placeholder={type === 'password' ? '••••••••' : label}
        value={form[name]} onChange={handleChange} required />
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill={T.naranja}/>
            <path d="M6 20V13L14 7L22 13V20H17V15H11V20H6Z" fill="white"/>
          </svg>
          <span style={s.logoText}>RenovRent</span>
        </div>
        <h1 style={s.titulo}>Crea tu cuenta</h1>
        <p style={s.sub}>Empieza a invertir en propiedades</p>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.fila}>{F('nombre','Nombre')}{F('apellidos','Apellidos')}</div>
          <div style={s.fila}>{F('username','Usuario')}{F('Nikname','Nickname')}</div>
          {F('email','Email','email')}
          <div style={s.fila}>{F('fecha_nacimiento','Fecha de nacimiento','date')}{F('dni','DNI')}</div>
          <div style={s.fila}>{F('password','Contraseña','password')}{F('password2','Repetir contraseña','password')}</div>
          {error && <div style={s.error}>{error}</div>}
          <button type="submit" style={{ ...G.btnPrimario, width: '100%', padding: '0.85rem' }}>
            Crear cuenta
          </button>
        </form>
        <p style={s.footer}>¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: T.naranja, fontWeight: '600' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
  card: { background: T.blanco, borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '560px', boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.10)', border: `1px solid ${T.borde}` },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' },
  logoText: { fontFamily: T.fontDisplay, fontWeight: '700', fontSize: '1.2rem', color: T.texto },
  titulo: { fontFamily: T.fontDisplay, fontSize: '1.5rem', fontWeight: '700', color: T.texto, marginBottom: '0.3rem' },
  sub: { color: T.textoMuted, fontSize: '0.9rem', marginBottom: '1.8rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.2rem' },
  fila: { display: 'flex', gap: '0.8rem' },
  error: { background: T.rojoBg, color: T.rojo, padding: '0.7rem 1rem', borderRadius: T.radioSm, fontSize: '0.85rem', border: '1px solid #fecaca' },
  footer: { textAlign: 'center', color: T.textoMuted, fontSize: '0.88rem' },
}