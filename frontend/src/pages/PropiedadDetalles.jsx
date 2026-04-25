import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80'

export default function PropiedadDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [inmueble, setInmueble] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fotoActiva, setFotoActiva] = useState(0)
  const [cantidad, setCantidad] = useState('')
  const [tarjeta, setTarjeta] = useState('')
  const [msg, setMsg] = useState({ tipo: '', texto: '' })
  const [invirtiendo, setInvirtiendo] = useState(false)

  useEffect(() => {
    api.get(`/inmuebles/${id}/`)
      .then(r => setInmueble(r.data))
      .catch(() => navigate('/propiedades'))
      .finally(() => setLoading(false))
  }, [id])

  const handleInvertir = async (e) => {
    e.preventDefault()
    setMsg({ tipo: '', texto: '' })
    setInvirtiendo(true)
    try {
      await api.post('/inversiones/', {
        id_inmueble: id,
        cantidad: parseFloat(cantidad),
        numerotarjeta: tarjeta
      })
      setMsg({ tipo: 'ok', texto: '✅ Inversión realizada con éxito.' })
      setCantidad('')
      setTarjeta('')
    } catch (err) {
      const data = err.response?.data
      const texto = data?.detail || data?.cantidad?.[0] || data?.numerotarjeta?.[0] || 'Error al procesar la inversión.'
      setMsg({ tipo: 'err', texto: `❌ ${texto}` })
    } finally {
      setInvirtiendo(false)
    }
  }

  if (loading) return <div style={s.center}>Cargando...</div>
  if (!inmueble) return null

  // Normaliza fotos: acepta string, array o campo vacío
  const fotos = Array.isArray(inmueble.fotos)
    ? inmueble.fotos.filter(Boolean)
    : inmueble.fotos
      ? [inmueble.fotos]
      : [FALLBACK]

  // Compatible con retornoanualporcentaje y retorno_anual_porcentaje
  const porcentaje = parseFloat(
    inmueble.retornoanualporcentaje ?? inmueble.retorno_anual_porcentaje ?? 0
  )
  const cantNum = parseFloat(cantidad)
  const retornoAnual  = cantidad && !isNaN(cantNum) ? ((cantNum * porcentaje) / 100).toFixed(2) : null
  const retornoMensual = retornoAnual ? (retornoAnual / 12).toFixed(2) : null

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {/* ── GALERÍA ── */}
        <div style={s.galeria}>
          {/* Foto principal */}
          <div style={s.heroWrap}>
            <img
              src={fotos[fotoActiva] || FALLBACK}
              alt={inmueble.nombre}
              style={s.heroImg}
              onError={e => { e.target.src = FALLBACK }}
            />
            <span style={s.badge}>{inmueble.tipo}</span>
          </div>

          {/* Miniaturas (solo si hay más de 1 foto) */}
          {fotos.length > 1 && (
            <div style={s.thumbRow}>
              {fotos.map((f, i) => (
                <div
                  key={i}
                  style={{
                    ...s.thumb,
                    outline: i === fotoActiva ? '3px solid #F97316' : '3px solid transparent'
                  }}
                  onClick={() => setFotoActiva(i)}
                >
                  <img
                    src={f || FALLBACK}
                    alt={`foto ${i + 1}`}
                    style={s.thumbImg}
                    onError={e => { e.target.src = FALLBACK }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── CUERPO ── */}
        <div style={s.body}>

          {/* INFO */}
          <div style={s.left}>
            <button style={s.back} onClick={() => navigate('/propiedades')}>← Volver</button>
            <h1 style={s.titulo}>{inmueble.nombre}</h1>
            <p style={s.ubicacion}>📍 {inmueble.ubicacion}</p>

            <div style={s.statsGrid}>
              <div style={s.statBox}>
                <span style={s.statLabel}>Precio</span>
                <span style={s.statVal}>{Number(inmueble.precio).toLocaleString('es-ES')} €</span>
              </div>
              <div style={s.statBox}>
                <span style={s.statLabel}>Retorno anual</span>
                <span style={{ ...s.statVal, color: '#16a34a' }}>{porcentaje}%</span>
              </div>
              <div style={s.statBox}>
                <span style={s.statLabel}>Disponible</span>
                <span style={s.statVal}>
                  {Number(inmueble.disponible_para_invertir ?? inmueble.precio).toLocaleString('es-ES')} €
                </span>
              </div>
            </div>

            {/* CARACTERÍSTICAS */}
            {inmueble.caracteristicas?.length > 0 && (
              <div style={s.caract}>
                <h2 style={s.h2}>Características</h2>
                <div style={s.caractGrid}>
                  {inmueble.caracteristicas.map((c, i) => (
                    <div key={i} style={s.caractItem}>
                      {c.habitaciones     && <span>🛏 {c.habitaciones} hab.</span>}
                      {c.banos            && <span>🚿 {c.banos} baños</span>}
                      {c.metros_cuadrados && <span>📐 {c.metros_cuadrados} m²</span>}
                      {c.garaje           && <span>🚗 Garaje</span>}
                      {c.piscina          && <span>🏊 Piscina</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FORMULARIO INVERSIÓN */}
          <div style={s.right}>
            <div style={s.card}>
              <h2 style={s.h2}>Invertir en esta propiedad</h2>
              <form onSubmit={handleInvertir} style={s.form}>

                <label style={s.label}>Cantidad a invertir (€)</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={e => setCantidad(e.target.value)}
                  placeholder="Ej: 5000"
                  style={s.input}
                  required
                />

                {/* SIMULADOR — aparece en cuanto escribes */}
                {retornoAnual && (
                  <div style={s.simulacion}>
                    <p style={s.simTitulo}>💰 Retorno estimado</p>
                    <div style={s.simFila}>
                      <span>Anual</span>
                      <strong style={{ color: '#16a34a' }}>
                        +{Number(retornoAnual).toLocaleString('es-ES')} €
                      </strong>
                    </div>
                    <div style={s.simFila}>
                      <span>Mensual</span>
                      <strong style={{ color: '#16a34a' }}>
                        +{Number(retornoMensual).toLocaleString('es-ES')} €
                      </strong>
                    </div>
                  </div>
                )}

                <label style={s.label}>Número de tarjeta</label>
                <input
                  type="text"
                  maxLength={16}
                  value={tarjeta}
                  onChange={e => setTarjeta(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234567890123456"
                  style={s.input}
                  required
                />

                {msg.texto && (
                  <p style={{
                    ...s.msg,
                    background: msg.tipo === 'ok' ? '#dcfce7' : '#fee2e2',
                    color: msg.tipo === 'ok' ? '#166534' : '#991b1b'
                  }}>
                    {msg.texto}
                  </p>
                )}

                <button type="submit" style={s.btn} disabled={invirtiendo}>
                  {invirtiendo ? 'Procesando...' : 'Confirmar inversión'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const s = {
  page:        { minHeight: '100vh', background: '#f5f5f0' },
  center:      { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },
  container:   { maxWidth: '1100px', margin: '0 auto', padding: '0 1rem 3rem' },
  galeria:     { marginBottom: '0.5rem' },
  heroWrap:    { position: 'relative', height: '340px', borderRadius: '0 0 16px 16px', overflow: 'hidden' },
  heroImg:     { width: '100%', height: '100%', objectFit: 'cover' },
  badge:       { position: 'absolute', top: '16px', left: '16px', background: '#F97316', color: '#fff', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' },
  thumbRow:    { display: 'flex', gap: '0.5rem', padding: '0.7rem 0', overflowX: 'auto' },
  thumb:       { flexShrink: 0, width: '90px', height: '65px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'outline 0.15s' },
  thumbImg:    { width: '100%', height: '100%', objectFit: 'cover' },
  body:        { display: 'flex', gap: '2rem', marginTop: '1.5rem', flexWrap: 'wrap' },
  left:        { flex: '1 1 400px' },
  right:       { flex: '0 1 340px' },
  back:        { color: '#F97316', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '1rem', background: 'none', border: 'none', padding: 0 },
  titulo:      { fontSize: '1.8rem', fontWeight: '800', color: '#1a1a1a', marginBottom: '0.4rem' },
  ubicacion:   { color: '#888', fontSize: '0.95rem', marginBottom: '1.5rem' },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '1rem', marginBottom: '2rem' },
  statBox:     { background: '#fff', borderRadius: '10px', padding: '0.8rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '4px' },
  statLabel:   { fontSize: '0.72rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statVal:     { fontSize: '1rem', fontWeight: '700', color: '#1a1a1a' },
  h2:          { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '1rem' },
  caract:      { marginBottom: '2rem' },
  caractGrid:  { display: 'flex', flexWrap: 'wrap', gap: '0.6rem' },
  caractItem:  { background: '#fff', borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.88rem', color: '#444', display: 'flex', gap: '0.6rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  card:        { background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'sticky', top: '80px' },
  form:        { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  label:       { fontSize: '0.82rem', fontWeight: '600', color: '#555' },
  input:       { padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.95rem', outline: 'none' },
  simulacion:  { background: '#f0fdf4', borderRadius: '10px', padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', border: '1px solid #bbf7d0' },
  simTitulo:   { fontSize: '0.82rem', fontWeight: '700', color: '#166534', marginBottom: '0.3rem' },
  simFila:     { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#444' },
  msg:         { borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.88rem' },
  btn:         { padding: '0.8rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', marginTop: '0.4rem' },
}