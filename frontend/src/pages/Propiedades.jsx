import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import { T, G } from '../theme.js'

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80'

export default function Propiedades() {
  const [inmuebles, setInmuebles] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipos, setTipos] = useState([])
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState({ ubicacion: '', tipo: '', precioMin: '', precioMax: '' })
  const [esAdmin, setEsAdmin] = useState(false)  // ← añade esto

  useEffect(() => {
    api.get('/usuarios/me/').then(r => setEsAdmin(r.data.is_staff)).catch(() => {})
    api.get('/inmuebles/').then(r => setInmuebles(r.data)).catch(() => {}).finally(() => setLoading(false))
    api.get('/inmuebles/tipos/').then(r => setTipos(r.data)).catch(() => {})
  }, [])

  const filtrados = inmuebles.filter(i => {
    if (filtros.ubicacion && !i.ubicacion.toLowerCase().includes(filtros.ubicacion.toLowerCase())) return false
    if (filtros.tipo && i.tipo !== filtros.tipo) return false
    if (filtros.precioMin && Number(i.precio) < Number(filtros.precioMin)) return false
    if (filtros.precioMax && Number(i.precio) > Number(filtros.precioMax)) return false
    return true
  })

  const limpiar = () => setFiltros({ ubicacion: '', tipo: '', precioMin: '', precioMax: '' })
  const hayFiltros = Object.values(filtros).some(v => v !== '')

  return (
    <div style={G.page}>
      <Navbar />
      <div style={G.container}>

      <div style={s.headerRow}>
        <div>
          <h1 style={G.h1}>Propiedades</h1>
          <p style={s.subtitulo}>Descubre oportunidades de inversión inmobiliaria</p>
        </div>
        {esAdmin && (
          <button
            style={{ ...G.btnPrimario, alignSelf: 'center' }}
            onClick={() => navigate('/admin/inmuebles/CrearInmueble')}
          >
            + Añadir propiedad
          </button>
        )}
      </div>


        <div style={s.filtrosBar}>
          <div style={s.filtroGrupo}>
            <label style={G.label}>📍 Ubicación</label>
            <input style={G.input} placeholder="Madrid, Barcelona..."
              value={filtros.ubicacion} onChange={e => setFiltros({ ...filtros, ubicacion: e.target.value })} />
          </div>
          <div style={s.filtroGrupo}>
            <label style={G.label}>🏠 Tipo</label>
            <select style={G.input} value={filtros.tipo}
              onChange={e => setFiltros({ ...filtros, tipo: e.target.value })}>
              <option value="">Todos</option>
              {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={s.filtroGrupo}>
            <label style={G.label}>💶 Precio mín.</label>
            <input type="number" style={G.input} placeholder="0 €"
              value={filtros.precioMin} onChange={e => setFiltros({ ...filtros, precioMin: e.target.value })} />
          </div>
          <div style={s.filtroGrupo}>
            <label style={G.label}>💶 Precio máx.</label>
            <input type="number" style={G.input} placeholder="Sin límite"
              value={filtros.precioMax} onChange={e => setFiltros({ ...filtros, precioMax: e.target.value })} />
          </div>
          {hayFiltros && (
            <button style={{ ...G.btnPeligro, alignSelf: 'flex-end' }} onClick={limpiar}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {!loading && hayFiltros && (
          <p style={s.resultado}>
            {filtrados.length} propiedad{filtrados.length !== 1 ? 'es' : ''} encontrada{filtrados.length !== 1 ? 's' : ''}
          </p>
        )}

        {loading && <p style={s.info}>Cargando propiedades...</p>}


        <div style={s.grid}>
          {filtrados.map(i => (
            <div key={i.id} style={s.card}
              onClick={() => navigate(`/propiedades/${i.id}`)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = T.sombraHover; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={s.imgWrap}>
                <img
                  src={i.fotos || FALLBACK} alt={i.nombre} style={s.img}
                  onError={e => { e.target.src = FALLBACK }} loading="lazy"
                  width="400" height="220"
                />
                <span style={s.badge}>{i.tipo}</span>
              </div>
              <div style={s.body}>
                <h3 style={{ ...G.h3, marginBottom: '0.1rem' }}>{i.nombre}</h3>
                <p style={s.ubicacion}>📍 {i.ubicacion}</p>
                <div style={s.stats}>
                  <div style={s.stat}>
                    <span style={s.statLabel}>Precio</span>
                    <span style={s.statVal}>{Number(i.precio).toLocaleString('es-ES')} €</span>
                  </div>
                  <div style={s.divider} />
                  <div style={s.stat}>
                    <span style={s.statLabel}>Retorno anual</span>
                    <span style={{ ...s.statVal, color: '#16a34a' }}>{i.retorno_anual_porcentaje}%</span>
                  </div>
                </div>
                <button
                  style={{ ...G.btnPrimario, width: '100%', padding: '0.65rem' }}
                  onClick={e => { e.stopPropagation(); navigate(`/propiedades/${i.id}`) }}
                >
                  Ver detalle →
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && filtrados.length === 0 && (
          <div style={s.empty}>
            <span style={{ fontSize: '2.5rem' }}>🔍</span>
            <p style={{ color: T.textoMuted }}>
              {hayFiltros ? 'No hay propiedades con esos filtros.' : 'No hay propiedades disponibles.'}
            </p>
            {hayFiltros && (
              <button style={G.btnSecundario} onClick={limpiar}>Limpiar filtros</button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  headerRow: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.5rem'
},
  subtitulo:  { color: T.textoMuted, fontSize: '0.95rem', marginTop: '0.3rem' },
  filtrosBar: {
    display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'flex-end',
    background: T.blanco, borderRadius: T.radioLg,
    padding: '1.2rem', marginBottom: '1.5rem',
    border: `1px solid ${T.borde}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  filtroGrupo: { display: 'flex', flexDirection: 'column', flex: '1 1 160px' },
  resultado:  { color: T.textoMuted, fontSize: '0.85rem', marginBottom: '1rem' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.2rem' },
  card: {
    background: T.blanco, borderRadius: T.radioLg,
    border: `1px solid ${T.borde}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)',
    overflow: 'hidden', cursor: 'pointer',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  imgWrap:    { position: 'relative', height: '200px', overflow: 'hidden' },
  img:        { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  badge: {
    position: 'absolute', top: '12px', left: '12px',
    background: T.naranja, color: '#fff',
    padding: '3px 10px', borderRadius: T.radioPill,
    fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.04em',
  },
  body:       { padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  ubicacion:  { color: T.textoMuted, fontSize: '0.83rem' },
  stats: {
    display: 'flex', alignItems: 'center', gap: '0.8rem',
    background: T.bg, borderRadius: T.radioSm,
    padding: '0.7rem 0.9rem',
    border: `1px solid ${T.borde}`,
  },
  stat:       { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  statLabel:  { fontSize: '0.7rem', color: T.textoMuted, textTransform: 'uppercase', letterSpacing: '0.06em' },
  statVal:    { fontSize: '0.95rem', fontWeight: '700', color: T.texto, fontVariantNumeric: 'tabular-nums' },
  divider:    { width: '1px', height: '32px', background: T.borde, flexShrink: 0 },
  info:       { textAlign: 'center', color: T.textoMuted, marginTop: '3rem' },
  empty:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', marginTop: '4rem', textAlign: 'center' },
}
