import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios.jsx'

export default function Registro() {
  const [form, setForm] = useState({
    username: '', nombre: '', apellidos: '', Nikname: '',
    email: '', fecha_nacimiento: '', dni: '', password: '', password2: '',
  })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.password2) {
      setError('Las contraseñas no coinciden')
      return
    }
    try {
      await api.post('/usuarios/', {
        username: form.username, nombre: form.nombre, apellidos: form.apellidos,
        Nikname: form.Nikname, email: form.email, fecha_nacimiento: form.fecha_nacimiento,
        dni: form.dni, password: form.password,
      })
      navigate('/login')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const primer_error = Object.values(data)[0]
        setError(Array.isArray(primer_error) ? primer_error[0] : primer_error)
      } else {
        setError('Error al registrarse')
      }
    }
  }

  const campo = (name, placeholder, type = 'text') => (
    <div style={styles.inputGroup}>
      <label style={styles.label}>{placeholder}</label>
      <input
        style={styles.input}
        name={name} type={type}
        placeholder={placeholder}
        value={form[name]}
        onChange={handleChange}
        required={name !== 'password2' || true}
      />
    </div>
  )

  return (
    <div style={styles.page}>
      <div style={styles.overlay} />
      <div style={styles.card}>
        <div style={styles.logo}>🏠 RenovRent</div>
        <h2 style={styles.title}>Crear cuenta</h2>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            {campo('nombre', 'Nombre')}
            {campo('apellidos', 'Apellidos')}
          </div>
          {campo('username', 'Nombre de usuario')}
          {campo('Nikname', 'Nickname')}
          {campo('email', 'Email', 'email')}
          {campo('dni', 'DNI (ej: 12345678A)')}
          {campo('fecha_nacimiento', 'Fecha de nacimiento', 'date')}
          {campo('password', 'Contraseña', 'password')}
          {campo('password2', 'Verificar contraseña', 'password')}
          <button style={styles.btn} type="submit">Registrarse</button>
        </form>
        <p style={styles.link}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
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
    padding: '2rem 0',
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
    maxWidth: '500px',
  },
  logo: { textAlign: 'center', fontSize: '1.4rem', fontWeight: '700', color: '#F97316', marginBottom: '0.5rem' },
  title: { textAlign: 'center', marginBottom: '1.5rem', color: '#1a1a1a', fontSize: '1.3rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  row: { display: 'flex', gap: '0.75rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 },
  label: { fontSize: '0.8rem', color: '#555', fontWeight: '500' },
  input: { padding: '0.7rem 1rem', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '0.95rem', width: '100%' },
  btn: { padding: '0.8rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
  error: { color: '#e53e3e', textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.9rem', background: '#fff5f5', padding: '0.5rem', borderRadius: '6px' },
  link: { textAlign: 'center', marginTop: '1.2rem', fontSize: '0.9rem', color: '#666' }
}