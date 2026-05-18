import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import { T, G } from '../theme.js'

const RETORNO_POR_TIPO = {
  Casa: 8,
  Apartamento: 7,
  Piso: 7,
  Chalet: 9,
  Bungalow: 6,
  Mansión: 10,
  Dúplex: 7,
  Ático: 8,
  Local: 10,
  Oficina: 9,
  Nave: 8,
  Garaje: 5,
  Terreno: 4,
}

export default function CrearInmueble() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({
    nombre: '', ubicacion: '', tipo: '', descripcion: '',
    precio: '', retorno_anual_porcentaje: '', fotos: ''
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  useEffect(() => {
    if (form.tipo) {
      setForm(f => ({ ...f, retorno_anual_porcentaje: RETORNO_POR_TIPO[form.tipo] || '' }))
    }
  }, [form.tipo])

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      await api.post('/inmuebles/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      navigate('/propiedades')
    } catch (err) {
      const d = err.response?.data
      if (d) { const p = Object.values(d)[0]; setError(Array.isArray(p) ? p[0] : p) }
      else setError('Error al crear el inmueble')
    } finally { setLoading(false) }
  }

  const F = (name, label, type = 'text', extra = {}) => (
    <div key={name}>
      <label style={G.label}>{label}</label>
      <input style={G.input} type={type} name={name}
        placeholder={label} value={form[name]}
        onChange={handleChange} required {...extra} />
    </div>
  )

  return (
    <div style={G.page}>
      <Navbar />
      <div style={G.container}>

        <div style={s.headerRow}>
          <div>
            <h1 style={G.h1}>Añadir propiedad</h1>
            <p style={s.subtitulo}>Rellena los datos del nuevo inmueble</p>
          </div>
          <button style={{ ...G.btnSecundario, alignSelf: 'center' }}
            onClick={() => navigate('/propiedades')}>
            ← Volver
          </button>
        </div>

        <div style={s.card}>
          <form onSubmit={handleSubmit} style={s.form}>

            <div style={s.fila}>
              {F('nombre', 'Nombre del inmueble')}
              {F('ubicacion', 'Ubicación')}
            </div>

            <div style={s.fila}>
              <div style={{ flex: 1 }}>
                <label style={G.label}>🏠 Tipo</label>
                <select style={G.input} name="tipo"
                  value={form.tipo} onChange={handleChange} required>
                  <option value="">Selecciona un tipo</option>
                  {Object.keys(RETORNO_POR_TIPO).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {F('precio', 'Precio (€)', 'number', { min: 0 })}
            </div>

            <div style={s.fila}>
              <div style={{ flex: 1 }}>
                <label style={G.label}>📈 Retorno anual (%)</label>
                <input
                  style={{ ...G.input, background: T.bg, cursor: 'not-allowed', color: T.textoMuted }}
                  type="number" value={form.retorno_anual_porcentaje} readOnly />
                <small style={{ color: T.textoMuted, fontSize: '0.75rem' }}>
                  Se calcula según el tipo
                </small>
              </div>

              <div style={{ flex: 1 }}>
                <label style={G.label}>🖼️ Imagen del inmueble</label>
                <input type="file" accept="image/*"
                  style={{ ...G.input, padding: '0.4rem', cursor: 'pointer' }}
                  onChange={e => {
                    const file = e.target.files[0]
                    if (!file) return
                    setPreview(URL.createObjectURL(file))
                    setForm({ ...form, fotos: file })
                  }} required />
                {preview && (
                  <img src={preview} alt="Preview"
                    style={{ marginTop: '0.5rem', width: '100%', height: '150px',
                      objectFit: 'cover', borderRadius: T.radioSm, border: `1px solid ${T.borde}` }} />
                )}
              </div>
            </div>

            <div>
              <label style={G.label}>Descripción</label>
              <textarea style={{ ...G.input, height: '100px', resize: 'vertical' }}
                name="descripcion" placeholder="Descripción del inmueble"
                value={form.descripcion} onChange={handleChange} required />
            </div>

            {error && <div style={s.error}>{error}</div>}

            <button type="submit" style={{ ...G.btnPrimario, padding: '0.85rem' }} disabled={loading}>
              {loading ? 'Creando...' : '+ Crear inmueble'}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}

const s = {
  headerRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  subtitulo:  { color: T.textoMuted, fontSize: '0.95rem', marginTop: '0.3rem' },
  card: {
    background: T.blanco, borderRadius: T.radioLg,
    padding: '2rem', border: `1px solid ${T.borde}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  form:  { display: 'flex', flexDirection: 'column', gap: '1rem' },
  fila:  { display: 'flex', gap: '1rem' },
  error: {
    background: T.rojoBg, color: T.rojo,
    padding: '0.7rem 1rem', borderRadius: T.radioSm,
    fontSize: '0.85rem', border: '1px solid #fecaca'
  },
}