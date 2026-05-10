import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80'

export default function Propiedades() {
  const [inmuebles, setInmuebles] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipos, setTipos] = useState([])
  const navigate = useNavigate()

  const [filtros, setFiltros] = useState({
    ubicacion: '',
    tipo: '',
    precioMin: '',
    precioMax: '',
  })

  useEffect(() => {
    api.get('/inmuebles/').then(r => setInmuebles(r.data)).catch(() => {}).finally(() => setLoading(false))
    api.get('/inmuebles/tipos/').then(r => setTipos(r.data)).catch(() => {})
  }, [])

  const inmueblesFiltrados = inmuebles.filter(i => {
    if (filtros.ubicacion && !i.ubicacion.toLowerCase().includes(filtros.ubicacion.toLowerCase())) return false
    if (filtros.tipo && i.tipo !== filtros.tipo) return false
    if (filtros.precioMin && Number(i.precio) < Number(filtros.precioMin)) return false
    if (filtros.precioMax && Number(i.precio) > Number(filtros.precioMax)) return false
    return true
  })

  const limpiarFiltros = () => setFiltros({ ubicacion: '', tipo: '', precioMin: '', precioMax: '' })
  const hayFiltros = Object.values(filtros).some(v => v !== '')

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>
        <h1 style={s.titulo}>Propiedades disponibles</h1>

        <div style={s.filtrosBar}>
          <div style={s.filtroGrupo}>
            <label style={s.filtroLabel}>📍 Ubicación</label>
            <input
              style={s.filtroInput}
              placeholder="Madrid, Barcelona..."
              value={filtros.ubicacion}
              onChange={e => setFiltros({ ...filtros, ubicacion: e.target.value })}
            />
          </div>

          <div style={s.filtroGrupo}>
            <label style={s.filtroLabel}>🏠 Tipo</label>
            <select
              style={s.filtroInput}
              value={filtros.tipo}
              onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}
            >
              <option value="">Todos</option>
              {tipos.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div style={s.filtroGrupo}>
            <label style={s.filtroLabel}>💶 Precio mín. (€)</label>
            <input
              type="number"
              style={s.filtroInput}
              placeholder="0"
              value={filtros.precioMin}
              onChange={e => setFiltros({ ...filtros, precioMin: e.target.value })}
            />
          </div>

          <div style={s.filtroGrupo}>
            <label style={s.filtroLabel}>💶 Precio máx. (€)</label>
            <input
              type="number"
              style={s.filtroInput}
              placeholder="Sin límite"
              value={filtros.precioMax}
              onChange={e => setFiltros({ ...filtros, precioMax: e.target.value })}
            />
          </div>

          {hayFiltros && (
            <button style={s.btnLimpiar} onClick={limpiarFiltros}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {!loading && hayFiltros && (
          <p style={s.resultadoTexto}>
            {inmueblesFiltrados.length} propiedad{inmueblesFiltrados.length !== 1 ? 'es' : ''} encontrada{inmueblesFiltrados.length !== 1 ? 's' : ''}
          </p>
        )}

        {loading && <p style={s.info}>Cargando...</p>}

        <div style={s.grid}>
          {inmueblesFiltrados.map(i => (
            <div key={i.id} style={s.card}>
              <div style={s.imgWrap}>
                <img
                  src={i.fotos || FALLBACK}
                  alt={i.nombre}
                  style={s.img}
                  onError={e => { e.target.src = FALLBACK }}
                />
                <span style={s.badge}>{i.tipo}</span>
              </div>
              <div style={s.body}>
                <h3 style={s.nombre}>{i.nombre}</h3>
                <p style={s.ubicacion}>📍 {i.ubicacion}</p>
                <div style={s.stats}>
                  <div style={s.stat}>
                    <span style={s.statLabel}>Precio</span>
                    <span style={s.statVal}>{Number(i.precio).toLocaleString('es-ES')} €</span>
                  </div>
                  <div style={s.stat}>
                    <span style={s.statLabel}>Retorno anual</span>
                    <span style={{ ...s.statVal, color: '#16a34a' }}>{i.retorno_anual_porcentaje}%</span>
                  </div>
                </div>
                <button style={s.btn} onClick={() => navigate(`/propiedades/${i.id}`)}>
                  Ver detalle →
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && inmueblesFiltrados.length === 0 && (
          <div style={s.empty}>
            <span style={{ fontSize: '2.5rem' }}>🔍</span>
            <p>{hayFiltros ? 'No hay propiedades con esos filtros.' : 'No hay propiedades disponibles.'}</p>
            {hayFiltros && <button style={s.btnLimpiar} onClick={limpiarFiltros}>Limpiar filtros</button>}
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  page:           { minHeight: '100vh', background: '#f5f5f0' },
  container:      { maxWidth: '1100px', margin: '0 auto', padding: '2rem 1rem' },
  titulo:         { fontSize: '1.8rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '1.5rem' },
  filtrosBar:     { display: 'flex', flexWrap: 'wrap', gap: '0.8rem', background: '#fff', borderRadius: '14px', padding: '1.2rem', marginBottom: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', alignItems: 'flex-end' },
  filtroGrupo:    { display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: '1 1 160px' },
  filtroLabel:    { fontSize: '0.75rem', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' },
  filtroInput:    { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.9rem', outline: 'none', background: '#fafafa' },
  btnLimpiar:     { padding: '0.6rem 1rem', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', alignSelf: 'flex-end' },
  resultadoTexto: { fontSize: '0.85rem', color: '#888', marginBottom: '1rem' },
  grid:           { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' },
  card:           { background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', transition: 'transform 0.2s', cursor: 'pointer' },
  imgWrap:        { position: 'relative', height: '180px' },
  img:            { width: '100%', height: '100%', objectFit: 'cover' },
  badge:          { position: 'absolute', top: '10px', left: '10px', background: '#F97316', color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  body:           { padding: '1rem' },
  nombre:         { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.3rem' },
  ubicacion:      { fontSize: '0.85rem', color: '#888', marginBottom: '0.8rem' },
  stats:          { display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', background: '#f9f9f7', borderRadius: '8px', padding: '0.6rem 0.8rem' },
  stat:           { display: 'flex', flexDirection: 'column', gap: '2px' },
  statLabel:      { fontSize: '0.72rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statVal:        { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a' },
  btn:            { width: '100%', padding: '0.65rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },
  info:           { textAlign: 'center', color: '#888', marginTop: '3rem' },
  empty:          { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', marginTop: '4rem', color: '#aaa', fontSize: '0.95rem' },
}