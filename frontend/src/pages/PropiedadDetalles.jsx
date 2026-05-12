import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import useAuthStore from '../store/authStore.jsx'
import ModalInversion from '../componentes/Inversion.jsx'
import ChatInmueble from '../componentes/Chat.jsx'
import { T, G } from '../theme.js'

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80'

export default function PropiedadDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()



    useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate]);


  const isAdmin = user?.is_staff || user?.is_superuser
  const [inmueble, setInmueble] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fotoActiva, setFotoActiva] = useState(0)

  const [editando, setEditando] = useState(false)
  const [formInmueble, setFormInmueble] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState({ msg: '', tipo: '' })
  const [tipos, setTipos] = useState([])
  const [mostrarInvertir, setMostrarInvertir] = useState(false)
  const [esInversor, setEsInversor] = useState(false)

  // NUEVO ESTADO: Para controlar si el modal del chat está abierto
  const [mostrarChat, setMostrarChat] = useState(false)

  const mostrarMsg = (msg, tipo = 'ok') => {
    setToast({ msg, tipo })
    setTimeout(() => setToast({ msg: '', tipo: '' }), 3000)
  }

  const cargar = () => {
    api.get(`/inmuebles/${id}/`)
      .then(r => {
        setInmueble(r.data)
        setFormInmueble({
          nombre: r.data.nombre,
          ubicacion: r.data.ubicacion,
          tipo: r.data.tipo,
          precio: r.data.precio,
          retorno_anual_porcentaje: r.data.retorno_anual_porcentaje,
          num_habitaciones: r.data.num_habitaciones ?? '',
          num_banos: r.data.num_banos ?? '',
          metros_cuadrados: r.data.metros_cuadrados ?? '',
          planta: r.data.planta ?? '',
          garaje: r.data.garaje ?? false,
          piscina: r.data.piscina ?? false,
          ascensor: r.data.ascensor ?? false,
          terraza: r.data.terraza ?? false,
        })
      })
      .catch(() => navigate('/propiedades'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    api.get('/inmuebles/tipos/').then(r => setTipos(r.data))

    if (user) {
      api.get('/inversiones/')
        .then(r => {
          const misInversiones = Array.isArray(r.data) ? r.data : (r.data.results || [])
          const tieneInversion = misInversiones.some(inv =>
            String(inv.id_inmueble) === String(id) || String(inv.inmueble?.id) === String(id)
          )
          setEsInversor(tieneInversion)
        })
        .catch(() => setEsInversor(false))
    } else {
      setEsInversor(false)
    }
  }, [id, user])

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)

    try {
      const payload = {
        nombre: formInmueble.nombre,
        ubicacion: formInmueble.ubicacion,
        tipo: formInmueble.tipo,
        precio: formInmueble.precio,
        retorno_anual_porcentaje: formInmueble.retorno_anual_porcentaje,
        num_habitaciones: formInmueble.num_habitaciones !== '' ? formInmueble.num_habitaciones : null,
        num_banos: formInmueble.num_banos !== '' ? formInmueble.num_banos : null,
        metros_cuadrados: formInmueble.metros_cuadrados !== '' ? formInmueble.metros_cuadrados : null,
        planta: formInmueble.planta !== '' ? formInmueble.planta : null,
        garaje: formInmueble.garaje,
        piscina: formInmueble.piscina,
        ascensor: formInmueble.ascensor,
        terraza: formInmueble.terraza,
      }

      await api.patch(`/inmuebles/${id}/`, payload)
      mostrarMsg('Cambios guardados correctamente.', 'ok')
      cargar()
      setTimeout(() => setEditando(false), 600)
    } catch (err) {
      mostrarMsg('Error al guardar los cambios.', 'err')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div style={G.page}>
        <Navbar />
        <div style={G.container}>
          <p style={s.estadoCenter}>Cargando propiedad...</p>
        </div>
      </div>
    )
  }

  if (!inmueble) return null

  const fotos = inmueble.fotos_detalle?.length > 0 ? inmueble.fotos_detalle : [{ imagen: inmueble.fotos || FALLBACK }]

  return (
    <div style={G.page}>
      <Navbar />

      {toast.msg && (
        <div style={toast.tipo === 'ok' ? s.toastOk : s.toastErr}>
          {toast.msg}
        </div>
      )}

      {/* Modal de Inversión */}
      {mostrarInvertir && (
        <ModalInversion
          inmueble={inmueble}
          onClose={() => setMostrarInvertir(false)}
          onSuccess={() => {
            setMostrarInvertir(false)
            setEsInversor(true)
            cargar()
            mostrarMsg('¡Inversión completada! Ya puedes acceder al chat.', 'ok')
          }}
        />
      )}

      {/* Modal del Chat */}
      {mostrarChat && esInversor && (
        <div style={G.overlay} onClick={() => setMostrarChat(false)}>
          {/* Usamos un modal especial más grande para el chat */}
          <div style={s.modalChat} onClick={e => e.stopPropagation()}>
            <div style={s.modalChatHeader}>
              <div>
                <h3 style={{ ...G.h3, margin: 0 }}>Chat de Inversores</h3>
                <p style={s.modalChatSub}>{inmueble.nombre}</p>
              </div>
              <button style={s.btnCloseModal} onClick={() => setMostrarChat(false)}>
                ✕
              </button>
            </div>
            <div style={s.modalChatBody}>
              <ChatInmueble inmuebleId={id} />
            </div>
          </div>
        </div>
      )}

      <div style={s.heroBar}>
        <div style={{ ...G.container, ...s.heroContent }}>
          <button style={G.btnGhost} onClick={() => navigate('/propiedades')}>
            ← Volver a propiedades
          </button>

          {isAdmin && (
            <button
              style={editando ? G.btnGhost : G.btnSecundario}
              onClick={() => setEditando(!editando)}
            >
              {editando ? 'Cancelar edición' : 'Editar inmueble'}
            </button>
          )}
        </div>
      </div>

      <div style={G.container}>
        {editando ? (
          <form onSubmit={handleGuardar} style={s.editForm}>
            <div style={s.editHeader}>
              <h2 style={G.h2}>Modo edición</h2>
              <button type="submit" style={G.btnPrimario} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

            <div style={s.editGrid}>
              <div style={s.inputGroup}>
                <label style={G.label}>Nombre</label>
                <input style={G.input} value={formInmueble.nombre} onChange={e => setFormInmueble({...formInmueble, nombre: e.target.value})} required />
              </div>

              <div style={s.inputGroup}>
                <label style={G.label}>Ubicación</label>
                <input style={G.input} value={formInmueble.ubicacion} onChange={e => setFormInmueble({...formInmueble, ubicacion: e.target.value})} required />
              </div>

              <div style={s.inputGroup}>
                <label style={G.label}>Tipo</label>
                <select style={G.input} value={formInmueble.tipo} onChange={e => setFormInmueble({...formInmueble, tipo: e.target.value})}>
                  {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div style={s.inputGroup}>
                <label style={G.label}>Precio (€)</label>
                <input style={G.input} type="number" step="0.01" value={formInmueble.precio} onChange={e => setFormInmueble({...formInmueble, precio: e.target.value})} required />
              </div>

              <div style={s.inputGroup}>
                <label style={G.label}>Retorno Anual (%)</label>
                <input style={G.input} type="number" step="0.01" value={formInmueble.retorno_anual_porcentaje} onChange={e => setFormInmueble({...formInmueble, retorno_anual_porcentaje: e.target.value})} required />
              </div>

              <div style={s.inputGroup}>
                <label style={G.label}>Metros Cuadrados</label>
                <input style={G.input} type="number" value={formInmueble.metros_cuadrados} onChange={e => setFormInmueble({...formInmueble, metros_cuadrados: e.target.value})} />
              </div>

              <div style={s.inputGroup}>
                <label style={G.label}>Nº Habitaciones</label>
                <input style={G.input} type="number" value={formInmueble.num_habitaciones} onChange={e => setFormInmueble({...formInmueble, num_habitaciones: e.target.value})} />
              </div>

              <div style={s.inputGroup}>
                <label style={G.label}>Nº Baños</label>
                <input style={G.input} type="number" value={formInmueble.num_banos} onChange={e => setFormInmueble({...formInmueble, num_banos: e.target.value})} />
              </div>

              <div style={s.inputGroup}>
                <label style={G.label}>Planta</label>
                <input style={G.input} type="text" value={formInmueble.planta} onChange={e => setFormInmueble({...formInmueble, planta: e.target.value})} />
              </div>
            </div>

            <div style={s.editChecks}>
              <label style={s.checkItem}>
                <input type="checkbox" checked={formInmueble.garaje} onChange={e => setFormInmueble({...formInmueble, garaje: e.target.checked})} /> Garaje
              </label>
              <label style={s.checkItem}>
                <input type="checkbox" checked={formInmueble.piscina} onChange={e => setFormInmueble({...formInmueble, piscina: e.target.checked})} /> Piscina
              </label>
              <label style={s.checkItem}>
                <input type="checkbox" checked={formInmueble.ascensor} onChange={e => setFormInmueble({...formInmueble, ascensor: e.target.checked})} /> Ascensor
              </label>
              <label style={s.checkItem}>
                <input type="checkbox" checked={formInmueble.terraza} onChange={e => setFormInmueble({...formInmueble, terraza: e.target.checked})} /> Terraza
              </label>
            </div>
          </form>
        ) : (
          <div style={s.layoutPrincipal}>
            <div style={s.colIzquierda}>
              <div style={s.galeriaWrap}>
                <div style={s.fotoPrincipal}>
                  <img
                    src={fotos[fotoActiva]?.imagen || FALLBACK}
                    alt={inmueble.nombre}
                    onError={e => { e.target.src = FALLBACK }}
                    style={s.imgFull}
                  />
                  <span style={s.badgeTipo}>{inmueble.tipo}</span>
                </div>

                {fotos.length > 1 && (
                  <div style={s.thumbnailsRow}>
                    {fotos.map((f, i) => (
                      <div
                        key={f.id || i}
                        style={i === fotoActiva ? s.thumbActivo : s.thumb}
                        onClick={() => setFotoActiva(i)}
                      >
                        <img
                          src={f.imagen || FALLBACK}
                          alt={`Vista ${i+1}`}
                          onError={e => { e.target.src = FALLBACK }}
                          style={s.imgFull}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={s.bloqueInfo}>
                <h1 style={{ ...G.h1, marginBottom: '0.5rem' }}>{inmueble.nombre}</h1>
                <p style={s.ubicacion}>📍 {inmueble.ubicacion}</p>

                <hr style={{ ...G.hr, margin: '1.5rem 0' }} />

                <h2 style={{ ...G.h2, marginBottom: '1rem' }}>Características</h2>

                <div style={s.caracteristicasGrid}>
                  {inmueble.metros_cuadrados && (
                    <div style={s.charItem}>
                      <span style={s.charLabel}>Superficie</span>
                      <span style={s.charValue}>{inmueble.metros_cuadrados} m²</span>
                    </div>
                  )}
                  {inmueble.num_habitaciones != null && (
                    <div style={s.charItem}>
                      <span style={s.charLabel}>Habitaciones</span>
                      <span style={s.charValue}>{inmueble.num_habitaciones}</span>
                    </div>
                  )}
                  {inmueble.num_banos != null && (
                    <div style={s.charItem}>
                      <span style={s.charLabel}>Baños</span>
                      <span style={s.charValue}>{inmueble.num_banos}</span>
                    </div>
                  )}
                  {inmueble.planta && (
                    <div style={s.charItem}>
                      <span style={s.charLabel}>Planta</span>
                      <span style={s.charValue}>{inmueble.planta}</span>
                    </div>
                  )}
                </div>

                <div style={s.extrasList}>
                  {inmueble.garaje && <span style={s.extraTag}>🚗 Garaje</span>}
                  {inmueble.piscina && <span style={s.extraTag}>🏊 Piscina</span>}
                  {inmueble.ascensor && <span style={s.extraTag}>🛗 Ascensor</span>}
                  {inmueble.terraza && <span style={s.extraTag}>☀️ Terraza</span>}
                </div>
              </div>
            </div>

            <div style={s.colDerecha}>
              <div style={s.tarjetaInversion}>
                <div style={s.precioBox}>
                  <span style={s.precioLabel}>Precio del inmueble</span>
                  <span style={s.precioValor}>{Number(inmueble.precio).toLocaleString('es-ES')} €</span>
                </div>

                <div style={s.retornoBox}>
                  <div>
                    <span style={s.retornoLabel}>Retorno Anual Estimado</span>
                    <span style={s.retornoValor}>{inmueble.retorno_anual_porcentaje}%</span>
                  </div>
                  <div style={s.retornoChart}>📈</div>
                </div>

                <hr style={{ ...G.hr, margin: '1.25rem 0' }} />

                <button
                  style={{ ...G.btnPrimario, width: '100%', padding: '0.8rem', fontSize: '1rem', marginBottom: '1rem' }}
                  onClick={() => setMostrarInvertir(true)}
                >
                  Invertir ahora
                </button>

                {esInversor ? (
                  <button
                    style={{ ...G.btnSecundario, width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}
                    onClick={() => setMostrarChat(true)}
                  >
                    💬 Abrir Chat de Inversores
                  </button>
                ) : (
                  <button
                    style={{ ...G.btnGhost, width: '100%', padding: '0.8rem', fontSize: '0.95rem', opacity: 0.7 }}
                    disabled
                  >
                    🔒 Chat bloqueado
                  </button>
                )}

                <p style={s.garantiaTexto}>Transacción segura mediante pasarela verificada</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const s = {
  toastOk: {
    ...G.toastOk,
    position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
  },
  toastErr: {
    ...G.toastErr,
    position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
  },
  estadoCenter: {
    textAlign: 'center', color: T.textoMuted, padding: '4rem 0',
  },
  heroBar: {
    background: T.blanco,
    borderBottom: `1px solid ${T.borde}`,
    marginBottom: '2rem',
    padding: '0.8rem 0',
  },
  heroContent: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  layoutPrincipal: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '2rem',
    alignItems: 'start',
    paddingBottom: '4rem',
  },
  colIzquierda: {
    display: 'flex', flexDirection: 'column', gap: '2rem',
  },
  colDerecha: {
    display: 'flex', flexDirection: 'column', gap: '1.5rem',
    position: 'sticky', top: '2rem',
  },
  galeriaWrap: {
    display: 'flex', flexDirection: 'column', gap: '0.8rem',
  },
  fotoPrincipal: {
    position: 'relative', width: '100%', aspectRatio: '16/9',
    borderRadius: T.radioLg, overflow: 'hidden', background: T.bg,
  },
  imgFull: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },
  badgeTipo: {
    position: 'absolute', top: '1rem', left: '1rem',
    background: T.naranja, color: '#fff',
    padding: '0.4rem 0.8rem', borderRadius: T.radioPill,
    fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em',
    textTransform: 'uppercase', backdropFilter: 'blur(4px)',
  },
  thumbnailsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.8rem',
  },
  thumb: {
    aspectRatio: '4/3', borderRadius: T.radioSm, overflow: 'hidden',
    cursor: 'pointer', opacity: 0.6, border: `2px solid transparent`,
    transition: 'opacity 0.2s',
  },
  thumbActivo: {
    aspectRatio: '4/3', borderRadius: T.radioSm, overflow: 'hidden',
    cursor: 'pointer', opacity: 1, border: `2px solid ${T.naranja}`,
  },
  bloqueInfo: {
    background: T.blanco, padding: '2rem', borderRadius: T.radioLg,
    border: `1px solid ${T.borde}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  ubicacion: {
    color: T.textoMuted, fontSize: '1.05rem', margin: 0,
  },
  caracteristicasGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '1rem', marginBottom: '1.5rem',
  },
  charItem: {
    display: 'flex', flexDirection: 'column', gap: '0.2rem',
    padding: '0.8rem', background: T.bg, borderRadius: T.radioSm,
    border: `1px solid ${T.borde}`,
  },
  charLabel: {
    fontSize: '0.75rem', color: T.textoMuted, textTransform: 'uppercase', letterSpacing: '0.04em',
  },
  charValue: {
    fontSize: '1.1rem', fontWeight: 600, color: T.texto,
  },
  extrasList: {
    display: 'flex', flexWrap: 'wrap', gap: '0.8rem',
  },
  extraTag: {
    padding: '0.4rem 0.8rem', background: T.blanco, border: `1px solid ${T.borde}`,
    borderRadius: T.radioPill, fontSize: '0.85rem', color: T.texto, fontWeight: 500,
  },
  tarjetaInversion: {
    background: T.blanco, padding: '1.5rem', borderRadius: T.radioLg,
    border: `1px solid ${T.borde}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  precioBox: {
    display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.25rem',
  },
  precioLabel: {
    fontSize: '0.85rem', color: T.textoMuted,
  },
  precioValor: {
    fontSize: '2rem', fontWeight: 800, color: T.texto, fontVariantNumeric: 'tabular-nums',
  },
  retornoBox: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem', background: '#f8fafc', borderRadius: T.radioSm,
    border: '1px solid #dcfce7',
  },
  retornoLabel: {
    display: 'block', fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase',
    letterSpacing: '0.04em', marginBottom: '0.2rem',
  },
  retornoValor: {
    fontSize: '1.25rem', fontWeight: 700, color: '#166534',
  },
  retornoChart: {
    fontSize: '2rem', opacity: 0.8,
  },
  garantiaTexto: {
    textAlign: 'center', fontSize: '0.75rem', color: T.textoMuted,
    marginTop: '1.5rem',
  },

  // Modal especial para el Chat (más grande y sin padding en el body)
  modalChat: {
    ...G.modal,
    width: '100%',
    maxWidth: '1000px', // Aumentado de 500px a 900px
    height: '85vh',    // Usamos viewport height en lugar de píxeles fijos
    minHeight: '600px',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  modalChatHeader: {
    padding: '1.25rem',
    background: T.bg,
    borderBottom: `1px solid ${T.borde}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalChatSub: {
    fontSize: '0.85rem',
    color: T.textoMuted,
    marginTop: '0.2rem',
    margin: 0,
  },
  btnCloseModal: {
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    color: T.textoMuted,
    cursor: 'pointer',
    padding: '0.2rem',
  },
  modalChatBody: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },

  // Modo Edición
  editForm: {
    background: T.blanco, padding: '2rem', borderRadius: T.radioLg,
    border: `1px solid ${T.naranja}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  editHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '2rem', paddingBottom: '1rem', borderBottom: `1px solid ${T.borde}`,
  },
  editGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex', flexDirection: 'column', gap: '0.4rem',
  },
  editChecks: {
    display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '2rem',
    padding: '1.5rem', background: T.bg, borderRadius: T.radioSm, border: `1px solid ${T.borde}`,
  },
  checkItem: {
    display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem',
    color: T.texto, cursor: 'pointer',
  },
}