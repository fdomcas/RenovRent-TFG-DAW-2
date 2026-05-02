import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios.jsx'
import useAuthStore from '../store/authStore.jsx'
import axios from 'axios'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  try {
    const { data } = await api.post('/auth/login/', form)
    const token = data.access

    const me = await axios.get('http://127.0.0.1:8000/api/usuarios/me/', {
      headers: { Authorization: `Bearer ${token}` }
    })

    setAuth(me.data, token)
    setTimeout(() => navigate('/'), 100)

  } catch (err) {
    console.error(err)
    setError('Usuario o contraseña incorrectos')
  }
}

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.card}>
        <div style={styles.logo}>🏠 RenovRent</div>
        <h2 style={styles.title}>Iniciar sesión</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Usuario o Email</label>
            <input
              style={styles.input}
              placeholder="Tu usuario o email"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Tu contraseña"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button style={styles.btn} type="submit">Iniciar sesión</button>
        </form>
        <p style={styles.link}>
          ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  )
}

const BG = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600&q=80'

const styles = {
  page: {
    minHeight: '100vh',
    backgroundImage: `url(${BG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    zIndex: 0,
  },
  card: {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255,255,255,0.97)',
    padding: '2.5rem 2rem',
    borderRadius: '14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    textAlign: 'center',
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#F97316',
    marginBottom: '0.5rem',
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#1a1a1a',
    fontSize: '1.3rem',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label: { fontSize: '0.85rem', color: '#555', fontWeight: '500' },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1.5px solid #e0e0e0',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: {
    padding: '0.8rem',
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background 0.2s',
  },
  error: {
    color: '#e53e3e',
    textAlign: 'center',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    background: '#fff5f5',
    padding: '0.5rem',
    borderRadius: '6px',
  },
  link: { textAlign: 'center', marginTop: '1.2rem', fontSize: '0.9rem', color: '#666' }
}