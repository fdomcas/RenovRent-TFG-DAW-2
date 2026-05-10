import { useState, useEffect, useRef } from 'react'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import useAuthStore from "../store/authStore.jsx";

const ESTADOS = {
  Aceptada: { color: '#16a34a', bg: '#dcfce7', label: '✅ Aceptada' },
  Revision: { color: '#d97706', bg: '#fef3c7', label: '🔄 En revisión' },
  Denegada: { color: '#dc2626', bg: '#fee2e2', label: '❌ Denegada' },
}

export default function Recomendaciones() {
  const { user } = useAuthStore()
  const isAdmin = user?.is_staff || user?.is_superuser

  const [tab, setTab] = useState('mis')
  const [propuestas, setPropuestas] = useState([])
  const [todasPropuestas, setTodasPropuestas] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState({ tipo: '', texto: '' })
  const [form, setForm] = useState({ motivo: '', url: '', ubicacion: '', fotos: null })
  const [cambiandoEstado, setCambiandoEstado] = useState(null)
  const fileRef = useRef()

  const cargar = () => {
    return api.get('/propuestas/')
      .then(r => setPropuestas(r.data))
      .finally(() => setLoading(false))
  }

  const cargarAdmin = () => {
    if (!isAdmin) return Promise.resolve()
    setLoadingAdmin(true)
    return api.get('/admin/propuestas/todas/')
      .then(r => setTodasPropuestas(r.data))
      .finally(() => setLoadingAdmin(false))
  }

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 3000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => { if (tab === 'admin') cargarAdmin() }, [tab])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setMsg({ tipo: '', texto: '' })
    try {
      const fd = new FormData()
      fd.append('motivo', form.motivo)
      fd.append('url', form.url)
      fd.append('ubicacion', form.ubicacion)
      if (form.fotos) fd.append('fotos', form.fotos)
      await api.post('/propuestas/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg({ tipo: 'ok', texto: '✅ Recomendación enviada correctamente.' })
      setForm({ motivo: '', url: '', ubicacion: '', fotos: null })
      if (fileRef.current) fileRef.current.value = ''
      cargar()
      setTimeout(() => setMostrarForm(false), 1500)
    } catch (err) {
      const data = err.response?.data
      const texto = data?.url?.[0] || data?.motivo?.[0] || data?.detail || '❌ Error al enviar.'
      setMsg({ tipo: 'err', texto })
    } finally {
      setEnviando(false)
    }
  }

  const cambiarEstado = async (id, nuevoEstado) => {
    setCambiandoEstado(id)
    try {
      await api.patch(`/admin/propuestas/${id}/estado/`, { estado: nuevoEstado })
      await cargarAdmin()
      await cargar()
    } catch (err) {
      alert('Error al cambiar el estado')
    } finally {
      setCambiandoEstado(null)
    }
  }

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        <div style={s.header}>
          <div>
            <h1 style={s.titulo}>Recomendaciones</h1>
            <p style={s.subtitulo}>Propiedades enviadas para revisión</p>
          </div>
          {tab === 'mis' && (
            <button style={s.btnNaranja} onClick={() => { setMostrarForm(true); setMsg({ tipo: '', texto: '' }) }}>
              + Nueva recomendación
            </button>
          )}
        </div>

        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === 'mis' ? s.tabActive : {}) }} onClick={() => setTab('mis')}>
            Mis recomendaciones
          </button>
          {isAdmin && (
            <button style={{ ...s.tab, ...(tab === 'admin' ? s.tabActive : {}) }} onClick={() => setTab('admin')}>
              Panel admin
            </button>
          )}
        </div>

        {tab === 'mis' && (
          loading ? (
            <p style={s.empty}>Cargando...</p>
          ) : propuestas.length === 0 ? (
            <div style={s.emptyBox}>
              <span style={{ fontSize: '2.5rem' }}>📋</span>
              <p>Aún no has enviado ninguna recomendación</p>
              <button style={s.btnNaranja} onClick={() => setMostrarForm(true)}>
                Enviar primera recomendación
              </button>
            </div>
          ) : (
            <div style={s.grid}>
              {propuestas.map(p => {
                const estado = ESTADOS[p.estado] || ESTADOS['Revision']
                return (
                  <div key={p.id} style={s.card}>
                    <div style={s.cardFoto}>
                      {p.fotos
                        ? <img src={p.fotos} alt="foto" style={s.fotoImg} />
                        : <div style={s.fotoPlaceholder}>🏠</div>
                      }
                    </div>
                    <div style={s.cardBody}>
                      <p style={s.cardUbicacion}>📍 {p.ubicacion}</p>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" style={s.cardUrl}>
                        {p.url.length > 40 ? p.url.slice(0, 40) + '...' : p.url}
                      </a>
                      <p style={s.cardMotivo}>{p.motivo}</p>
                      <span style={{ ...s.badge, color: estado.color, background: estado.bg }}>
                        {estado.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {tab === 'admin' && isAdmin && (
          loadingAdmin ? (
            <p style={s.empty}>Cargando todas las propuestas...</p>
          ) : todasPropuestas.length === 0 ? (
            <div style={s.emptyBox}>
              <span style={{ fontSize: '2rem' }}>📭</span>
              <p>No hay recomendaciones pendientes</p>
            </div>
          ) : (
            <div style={s.adminLista}>
              {todasPropuestas.map(p => {
                const estado = ESTADOS[p.estado] || ESTADOS['Revision']
                return (
                  <div key={p.id} style={s.adminRow}>
                    <div style={s.adminFoto}>
                      {p.fotos
                        ? <img src={p.fotos} alt="foto" style={s.fotoImg} />
                        : <div style={s.fotoPlaceholder}>🏠</div>
                      }
                    </div>
                    <div style={s.adminInfo}>
                      <p style={s.adminUsuario}>👤 {p.usuario_nombre || p.usuario || 'Usuario'}</p>
                      <p style={s.cardUbicacion}>📍 {p.ubicacion}</p>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" style={s.cardUrl}>
                        {p.url.length > 50 ? p.url.slice(0, 50) + '...' : p.url}
                      </a>
                      <p style={s.cardMotivo}>{p.motivo}</p>
                    </div>
                    <div style={s.adminAcciones}>
                      <span style={{ ...s.badge, color: estado.color, background: estado.bg, marginBottom: '0.5rem' }}>
                        {estado.label}
                      </span>
                      <button
                        style={{ ...s.btnEstado, background: '#dcfce7', color: '#16a34a', opacity: p.estado === 'Aceptada' ? 0.4 : 1 }}
                        disabled={p.estado === 'Aceptada' || cambiandoEstado === p.id}
                        onClick={() => cambiarEstado(p.id, 'Aceptada')}
                      >✅ Aceptar</button>
                      <button
                        style={{ ...s.btnEstado, background: '#fee2e2', color: '#dc2626', opacity: p.estado === 'Denegada' ? 0.4 : 1 }}
                        disabled={p.estado === 'Denegada' || cambiandoEstado === p.id}
                        onClick={() => cambiarEstado(p.id, 'Denegada')}
                      >❌ Denegar</button>
                      <button
                        style={{ ...s.btnEstado, background: '#fef3c7', color: '#d97706', opacity: p.estado === 'Revision' ? 0.4 : 1 }}
                        disabled={p.estado === 'Revision' || cambiandoEstado === p.id}
                        onClick={() => cambiarEstado(p.id, 'Revision')}
                      >🔄 Revisión</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {mostrarForm && (
        <div style={s.overlay} onClick={() => setMostrarForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h2 style={s.modalTitulo}>📋 Recomendar un inmueble</h2>
            <form onSubmit={handleSubmit} style={s.form}>
              <label style={s.label}>Ubicación</label>
              <input style={s.input} value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} placeholder="Ej: Calle Mayor 5, Madrid" required />
              <label style={s.label}>URL del inmueble</label>
              <input style={s.input} type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." required />
              <label style={s.label}>Motivo / descripción</label>
              <textarea style={{ ...s.input, minHeight: '80px', resize: 'vertical' }} value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} placeholder="¿Por qué recomiendas este inmueble?" required />
              <label style={s.label}>Foto del inmueble</label>
              <input ref={fileRef} type="file" accept="image/*" style={s.inputFile} onChange={e => setForm({ ...form, fotos: e.target.files[0] })} />
              {msg.texto && (
                <p style={{ ...s.msgBox, background: msg.tipo === 'ok' ? '#dcfce7' : '#fee2e2', color: msg.tipo === 'ok' ? '#166534' : '#991b1b' }}>
                  {msg.texto}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button type="submit" style={s.btnNaranja} disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar recomendación'}
                </button>
                <button type="button" style={s.btnGris} onClick={() => setMostrarForm(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  page:            { minHeight: '100vh', background: '#f5f5f0' },
  container:       { maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem 3rem' },
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  titulo:          { fontSize: '1.6rem', fontWeight: '800', color: '#1a1a1a', margin: 0 },
  subtitulo:       { fontSize: '0.9rem', color: '#888', marginTop: '0.3rem' },
  tabs:            { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e5e5', paddingBottom: '0' },
  tab:             { padding: '0.6rem 1.2rem', background: 'none', border: 'none', borderBottom: '3px solid transparent', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', color: '#888', marginBottom: '-2px', borderRadius: '0' },
  tabActive:       { color: '#F97316', borderBottomColor: '#F97316' },
  btnNaranja:      { padding: '0.75rem 1.4rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' },
  btnGris:         { flex: 1, padding: '0.75rem', background: '#f3f4f6', color: '#444', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' },
  btnEstado:       { padding: '0.4rem 0.8rem', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.82rem', width: '100%' },
  empty:           { textAlign: 'center', color: '#aaa', marginTop: '3rem' },
  emptyBox:        { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '4rem', color: '#888' },
  grid:            { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.2rem' },
  card:            { background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' },
  cardFoto:        { height: '160px', overflow: 'hidden', background: '#f3f4f6' },
  fotoImg:         { width: '100%', height: '100%', objectFit: 'cover' },
  fotoPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#ccc' },
  cardBody:        { padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  cardUbicacion:   { fontSize: '0.85rem', color: '#555', fontWeight: '600', margin: 0 },
  cardUrl:         { fontSize: '0.8rem', color: '#F97316', textDecoration: 'none', wordBreak: 'break-all' },
  cardMotivo:      { fontSize: '0.88rem', color: '#666', margin: 0 },
  badge:           { display: 'inline-block', padding: '3px 10px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: '700', alignSelf: 'flex-start' },
  adminLista:      { display: 'flex', flexDirection: 'column', gap: '1rem' },
  adminRow:        { background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '1rem', alignItems: 'start' },
  adminFoto:       { height: '140px', overflow: 'hidden', background: '#f3f4f6' },
  adminInfo:       { padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  adminUsuario:    { fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  adminAcciones:   { padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '120px' },
  overlay:         { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:           { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalTitulo:     { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '1.2rem' },
  form:            { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  label:           { fontSize: '0.82rem', fontWeight: '600', color: '#555' },
  input:           { padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.95rem', outline: 'none', width: '100%' },
  inputFile:       { fontSize: '0.88rem', color: '#555' },
  msgBox:          { borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.88rem' },
}