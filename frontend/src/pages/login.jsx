import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios.jsx'
import useAuthStore from '../store/authStore.jsx'
import axios from 'axios'
import { T, G } from '../theme.js'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [step, setStep] = useState('login')
  const [tempToken, setTempToken] = useState('')
  const [codigo, setCodigo] = useState('')
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    try {
      const { data } = await api.post('/auth/login/', form)
      if (data.two_factor_required) { setTempToken(data.temp_token); setStep('2fa'); return }
      const me = await axios.get('http://127.0.0.1:8000/api/usuarios/me/', {
        headers: { Authorization: `Bearer ${data.access}` }
      })
      setAuth(me.data, data.access)
      setTimeout(() => navigate('/'), 100)
    } catch { setError('Usuario o contraseña incorrectos') }
  }

  const handle2FA = async (e) => {
    e.preventDefault(); setError('')
    try {
      const { data } = await api.post('/auth/login/2fa/', { temp_token: tempToken, codigo })
      const me = await axios.get('http://127.0.0.1:8000/api/usuarios/me/', {
        headers: { Authorization: `Bearer ${data.access}` }
      })
      setAuth(me.data, data.access)
      setTimeout(() => navigate('/'), 100)
    } catch (err) { setError(err.response?.data?.error || 'Código incorrecto') }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill={T.naranja}/>
            <path d="M6 20V13L14 7L22 13V20H17V15H11V20H6Z" fill="white"/>
          </svg>
          <span style={s.logoText}>RenovRent</span>
        </div>

        {step === 'login' ? (
          <>
            <h1 style={s.titulo}>Bienvenido de nuevo</h1>
            <p style={s.sub}>Accede a tu cartera de inversiones</p>
            <form onSubmit={handleSubmit} style={s.form}>
              <div><label style={G.label}>Usuario</label>
                <input style={G.input} placeholder="Tu usuario" value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })} required /></div>
              <div><label style={G.label}>Contraseña</label>
                <input type="password" style={G.input} placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required /></div>
              {error && <div style={s.error}>{error}</div>}
              <button type="submit" style={{ ...G.btnPrimario, width: '100%', padding: '0.85rem' }}>
                Iniciar sesión
              </button>
            </form>
            <p style={s.footer}>¿No tienes cuenta?{' '}
              <Link to="/registro" style={{ color: T.naranja, fontWeight: '600' }}>Regístrate</Link>
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔐</div>
            <h1 style={s.titulo}>Verificación en dos pasos</h1>
            <p style={s.sub}>Introduce el código de Google Authenticator</p>
            <form onSubmit={handle2FA} style={s.form}>
              <div><label style={G.label}>Código de 6 dígitos</label>
                <input style={{ ...G.input, textAlign: 'center', fontSize: '1.4rem', letterSpacing: '0.3em', fontWeight: '700' }}
                  placeholder="000000" value={codigo}
                  onChange={e => setCodigo(e.target.value)} maxLength={6} required /></div>
              {error && <div style={s.error}>{error}</div>}
              <button type="submit" style={{ ...G.btnPrimario, width: '100%', padding: '0.85rem' }}>Verificar</button>
            </form>
            <button style={{ ...G.btnGhost, width: '100%', textAlign: 'center', color: T.textoMuted, fontSize: '0.85rem' }}
              onClick={() => { setStep('login'); setError(''); setCodigo('') }}>
              ← Volver al login
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  card: { background: T.blanco, borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.10)', border: `1px solid ${T.borde}` },
  logoWrap: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.8rem' },
  logoText: { fontFamily: T.fontDisplay, fontWeight: '700', fontSize: '1.3rem', color: T.texto },
  titulo: { fontFamily: T.fontDisplay, fontSize: '1.5rem', fontWeight: '700', color: T.texto, marginBottom: '0.3rem' },
  sub: { color: T.textoMuted, fontSize: '0.9rem', marginBottom: '1.8rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.2rem' },
  error: { background: T.rojoBg, color: T.rojo, padding: '0.7rem 1rem', borderRadius: T.radioSm, fontSize: '0.85rem', border: '1px solid #fecaca' },
  footer: { textAlign: 'center', color: T.textoMuted, fontSize: '0.88rem' },
}