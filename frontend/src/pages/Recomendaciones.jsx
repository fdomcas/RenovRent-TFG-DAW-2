import { useState, useEffect, useRef } from 'react'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore.jsx'
import { T, G } from '../theme.js'

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80'

const ESTADOS = {
  Aceptada: { label: 'Aceptada', tone: 'ok' },
  Revision: { label: 'En revisión', tone: 'warn' },
  Denegada: { label: '❌ Denegada', tone: 'err' },
}

function alpha(hex, value = 0.12) {
  if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${value})`
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return `rgba(0,0,0,${value})`
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${value})`
}

export default function Recomendaciones() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.is_staff || user?.is_superuser


  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate]);

  const [tab, setTab] = useState('mis')
  const [propuestas, setPropuestas] = useState([])
  const [todasPropuestas, setTodasPropuestas] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAdmin, setLoadingAdmin] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState({ tipo: '', texto: '' })
  const [form, setForm] = useState({
    motivo: '',
    url: '',
    ubicacion: '',
    fotos: null,
  })
  const [cambiandoEstado, setCambiandoEstado] = useState(null)

  const fileRef = useRef(null)

  const successColor = T.success || T.exito || '#166534'
  const errorColor = T.error || T.rojo || '#b91c1c'
  const warningColor = T.naranja || '#E8621A'

  useEffect(() => {
    if (!toast.texto) return
    const t = setTimeout(() => setToast({ tipo: '', texto: '' }), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const mostrarToast = (texto, tipo = 'ok') => {
    setToast({ texto, tipo })
  }

  const cargar = () => {
    return api
      .get('/propuestas/')
      .then(r => setPropuestas(Array.isArray(r.data) ? r.data : []))
      .catch(() => {
        mostrarToast('No se pudieron cargar tus recomendaciones.', 'err')
      })
      .finally(() => setLoading(false))
  }

  const cargarAdmin = () => {
    if (!isAdmin) return Promise.resolve()

    setLoadingAdmin(true)
    return api
      .get('/admin/propuestas/todas/')
      .then(r => setTodasPropuestas(Array.isArray(r.data) ? r.data : []))
      .catch(() => {
        mostrarToast('No se pudo cargar el panel admin.', 'err')
      })
      .finally(() => setLoadingAdmin(false))
  }

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 3000)
    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    if (tab === 'admin') cargarAdmin()
  }, [tab])

  const obtenerTextoError = (err) => {
    const data = err?.response?.data
    return (
      data?.url?.[0] ||
      data?.motivo?.[0] ||
      data?.ubicacion?.[0] ||
      data?.detail ||
      'Error al enviar la recomendación.'
    )
  }

  const resetForm = () => {
    setForm({
      motivo: '',
      url: '',
      ubicacion: '',
      fotos: null,
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)

    try {
      const fd = new FormData()
      fd.append('motivo', form.motivo)
      fd.append('url', form.url)
      fd.append('ubicacion', form.ubicacion)
      if (form.fotos) fd.append('fotos', form.fotos)

      await api.post('/propuestas/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      mostrarToast('✅ Recomendación enviada correctamente.', 'ok')
      resetForm()
      await cargar()
      setTimeout(() => setMostrarForm(false), 600)
    } catch (err) {
      mostrarToast(obtenerTextoError(err), 'err')
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
      mostrarToast('Estado actualizado correctamente.', 'ok')
    } catch {
      mostrarToast('Error al cambiar el estado.', 'err')
    } finally {
      setCambiandoEstado(null)
    }
  }

  const getEstadoMeta = (estado) => ESTADOS[estado] || ESTADOS.Revision

  const getEstadoStyle = (estado) => {
    const meta = getEstadoMeta(estado)

    if (meta.tone === 'ok') {
      return {
        ...s.badgeBase,
        color: successColor,
        background: alpha(successColor, 0.10),
        border: `1px solid ${alpha(successColor, 0.22)}`,
      }
    }

    if (meta.tone === 'err') {
      return {
        ...s.badgeBase,
        color: errorColor,
        background: alpha(errorColor, 0.10),
        border: `1px solid ${alpha(errorColor, 0.22)}`,
      }
    }

    return {
      ...s.badgeBase,
      color: warningColor,
      background: alpha(warningColor, 0.10),
      border: `1px solid ${alpha(warningColor, 0.22)}`,
    }
  }

  return (
    <div style={G.page}>
      <Navbar />

      {toast.texto && (
        <div style={toast.tipo === 'ok' ? s.toastOk : s.toastErr}>
          {toast.texto}
        </div>
      )}

      <div style={G.container}>
        <div style={s.headerRow}>
          <div>
            <span style={G.seccionLabel}>Comunidad</span>
            <h1 style={G.h1}>Recomendaciones</h1>
            <p style={s.subtitulo}>
              Propiedades enviadas por usuarios para revisión y validación.
            </p>
          </div>

          <button
            style={G.btnPrimario}
            onClick={() => setMostrarForm(true)}
          >
            Nueva recomendación
          </button>
        </div>

        <div style={s.tabs}>
          <button
            type="button"
            onClick={() => setTab('mis')}
            style={tab === 'mis' ? s.tabActiva : s.tab}
          >
            Mis recomendaciones
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setTab('admin')}
              style={tab === 'admin' ? s.tabActiva : s.tab}
            >
              Panel admin
            </button>
          )}
        </div>

        <hr style={{ ...G.hr, marginBottom: '1.5rem' }} />

        {tab === 'mis' && (
          <>
            {loading ? (
              <p style={s.info}>Cargando...</p>
            ) : propuestas.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>🏠</div>
                <h2 style={G.h2}>Aún no has enviado ninguna recomendación</h2>
                <p style={s.emptyText}>
                  Cuando envíes una propiedad para revisión, aparecerá aquí con su estado actualizado.
                </p>
                <button
                  style={G.btnSecundario}
                  onClick={() => setMostrarForm(true)}
                >
                  Enviar primera recomendación
                </button>
              </div>
            ) : (
              <div style={s.grid}>
                {propuestas.map((p) => {
                  const estado = getEstadoMeta(p.estado)

                  return (
                    <article key={p.id} style={s.card}>
                      <div style={s.imgWrap}>
                        <img
                          src={p.fotos || FALLBACK}
                          alt={p.ubicacion || 'Propiedad recomendada'}
                          style={s.img}
                          onError={(e) => {
                            e.target.src = FALLBACK
                          }}
                          loading="lazy"
                        />
                        <span style={getEstadoStyle(p.estado)}>
                          {estado.label}
                        </span>
                      </div>

                      <div style={s.cardBody}>
                        <h3 style={G.h3}>{p.ubicacion || 'Ubicación no indicada'}</h3>

                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={s.cardUrl}
                        >
                          {p.url?.length > 42 ? `${p.url.slice(0, 42)}...` : p.url}
                        </a>

                        <p style={s.cardTexto}>{p.motivo}</p>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'admin' && isAdmin && (
          <>
            {loadingAdmin ? (
              <p style={s.info}>Cargando...</p>
            ) : todasPropuestas.length === 0 ? (
              <div style={s.empty}>
                <div style={s.emptyIcon}>🧾</div>
                <h2 style={G.h2}>No hay recomendaciones pendientes</h2>
                <p style={s.emptyText}>
                  Cuando los usuarios envíen nuevas propiedades, aparecerán aquí para revisión.
                </p>
              </div>
            ) : (
              <div style={s.adminLista}>
                {todasPropuestas.map((p) => {
                  const estado = getEstadoMeta(p.estado)

                  return (
                    <article key={p.id} style={s.adminCard}>
                      <div style={s.adminImgWrap}>
                        <img
                          src={p.fotos || FALLBACK}
                          alt={p.ubicacion || 'Propiedad recomendada'}
                          style={s.img}
                          onError={(e) => {
                            e.target.src = FALLBACK
                          }}
                          loading="lazy"
                        />
                      </div>

                      <div style={s.adminBody}>
                        <span style={s.adminUser}>
                          👤 {p.usuario_nombre || p.usuario || 'Usuario'}
                        </span>
                        <h3 style={{ ...G.h3, marginBottom: '0.15rem' }}>
                          {p.ubicacion || 'Ubicación no indicada'}
                        </h3>

                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={s.cardUrl}
                        >
                          {p.url?.length > 54 ? `${p.url.slice(0, 54)}...` : p.url}
                        </a>

                        <p style={s.cardTexto}>{p.motivo}</p>
                      </div>

                      <div style={s.adminActions}>
                        <span style={getEstadoStyle(p.estado)}>
                          {estado.label}
                        </span>

                        <button
                          type="button"
                          style={
                            p.estado === 'Aceptada' || cambiandoEstado === p.id
                              ? s.btnAccionDisabled
                              : s.btnAceptar
                          }
                          disabled={p.estado === 'Aceptada' || cambiandoEstado === p.id}
                          onClick={() => cambiarEstado(p.id, 'Aceptada')}
                        >
                          Aceptar
                        </button>

                        <button
                          type="button"
                          style={
                            p.estado === 'Revision' || cambiandoEstado === p.id
                              ? s.btnAccionDisabled
                              : s.btnRevision
                          }
                          disabled={p.estado === 'Revision' || cambiandoEstado === p.id}
                          onClick={() => cambiarEstado(p.id, 'Revision')}
                        >
                          Revisión
                        </button>

                        <button
                          type="button"
                          style={
                            p.estado === 'Denegada' || cambiandoEstado === p.id
                              ? s.btnAccionDisabled
                              : G.btnPeligro
                          }
                          disabled={p.estado === 'Denegada' || cambiandoEstado === p.id}
                          onClick={() => cambiarEstado(p.id, 'Denegada')}
                        >
                          Denegar
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {mostrarForm && (
        <div style={G.overlay} onClick={() => setMostrarForm(false)}>
          <div style={G.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={G.h2}>Recomendar un inmueble</h2>
            <p style={s.modalSub}>
              Envía una propiedad para que el equipo la revise.
            </p>

            <hr style={{ ...G.hr, margin: '1rem 0 1.25rem' }} />

            <form onSubmit={handleSubmit} style={s.form}>
              <div>
                <label style={G.label}>Ubicación</label>
                <input
                  style={G.input}
                  value={form.ubicacion}
                  onChange={(e) =>
                    setForm({ ...form, ubicacion: e.target.value })
                  }
                  placeholder="Ej: Calle Mayor 5, Madrid"
                  required
                />
              </div>

              <div>
                <label style={G.label}>URL del inmueble</label>
                <input
                  type="url"
                  style={G.input}
                  value={form.url}
                  onChange={(e) =>
                    setForm({ ...form, url: e.target.value })
                  }
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <label style={G.label}>Motivo / descripción</label>
                <textarea
                  style={s.textarea}
                  value={form.motivo}
                  onChange={(e) =>
                    setForm({ ...form, motivo: e.target.value })
                  }
                  placeholder="¿Por qué recomiendas este inmueble?"
                  required
                />
              </div>

              <div>
                <label style={G.label}>Foto del inmueble</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={s.inputFile}
                  onChange={(e) =>
                    setForm({ ...form, fotos: e.target.files?.[0] || null })
                  }
                />
              </div>

              <div style={s.modalActions}>
                <button
                  type="button"
                  style={G.btnGhost}
                  onClick={() => setMostrarForm(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={enviando ? s.btnPrimarioDisabled : G.btnPrimario}
                  disabled={enviando}
                >
                  {enviando ? 'Enviando...' : 'Enviar recomendación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  toastOk: {
    ...G.toastOk,
    position: 'fixed',
    top: '1.25rem',
    right: '1.25rem',
    zIndex: 9999,
  },
  toastErr: {
    ...G.toastErr,
    position: 'fixed',
    top: '1.25rem',
    right: '1.25rem',
    zIndex: 9999,
  },

  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1.25rem',
  },

  subtitulo: {
    color: T.textoMuted,
    fontSize: '0.95rem',
    marginTop: '0.3rem',
    maxWidth: '640px',
  },

  tabs: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
    marginBottom: '0.5rem',
  },

  tab: {
    ...G.btnGhost,
    padding: '0.65rem 1rem',
  },

  tabActiva: {
    ...G.btnPrimario,
    padding: '0.65rem 1rem',
  },

  info: {
    textAlign: 'center',
    color: T.textoMuted,
    padding: '3rem 0',
  },

  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.85rem',
    padding: '4rem 1rem',
    color: T.textoMuted,
  },

  emptyIcon: {
    fontSize: '2.5rem',
  },

  emptyText: {
    fontSize: '0.95rem',
    color: T.textoMuted,
    maxWidth: '480px',
    lineHeight: 1.7,
    marginBottom: '0.35rem',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.2rem',
  },

  card: {
    background: T.blanco,
    borderRadius: T.radioLg,
    border: `1px solid ${T.borde}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)',
  },

  imgWrap: {
    position: 'relative',
    height: '200px',
    overflow: 'hidden',
    background: T.bg,
  },

  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  badgeBase: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.35rem 0.7rem',
    borderRadius: T.radioPill,
    fontSize: '0.78rem',
    fontWeight: 700,
    backdropFilter: 'blur(4px)',
  },

  cardBody: {
    padding: '1rem 1.05rem 1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
  },

  cardUrl: {
    color: T.naranja,
    fontSize: '0.82rem',
    fontWeight: 600,
    textDecoration: 'none',
    wordBreak: 'break-all',
  },

  cardTexto: {
    color: T.textoMuted,
    fontSize: '0.9rem',
    lineHeight: 1.65,
    margin: 0,
  },

  adminLista: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  adminCard: {
    display: 'grid',
    gridTemplateColumns: '160px 1fr 150px',
    gap: '1rem',
    background: T.blanco,
    borderRadius: T.radioLg,
    border: `1px solid ${T.borde}`,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)',
  },

  adminImgWrap: {
    minHeight: '160px',
    background: T.bg,
  },

  adminBody: {
    padding: '1rem 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.45rem',
  },

  adminUser: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: T.textoMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },

  adminActions: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
    justifyContent: 'center',
  },

  btnAceptar: {
    ...G.btnSecundario,
    width: '100%',
  },

  btnRevision: {
    ...G.btnGhost,
    width: '100%',
    border: `1px solid ${T.naranja}`,
    color: T.naranja,
  },

  btnAccionDisabled: {
    ...G.btnGhost,
    width: '100%',
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  modalSub: {
    color: T.textoMuted,
    fontSize: '0.92rem',
    marginTop: '0.35rem',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.95rem',
  },

  textarea: {
    ...G.input,
    minHeight: '110px',
    resize: 'vertical',
  },

  inputFile: {
    ...G.input,
    padding: '0.65rem 0.8rem',
    background: T.blanco,
  },

  modalActions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    marginTop: '0.35rem',
  },

  btnPrimarioDisabled: {
    ...G.btnPrimario,
    opacity: 0.65,
    cursor: 'not-allowed',
  },
}