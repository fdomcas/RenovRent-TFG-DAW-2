import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import useAuthStore from '../store/authStore.jsx'
import ModalInversion from '../componentes/Inversion.jsx'
import ChatInmueble from '../componentes/Chat.jsx'
import { T, G } from '../theme.js'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80'

export default function PropiedadDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

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
          nombre: r.data.nombre, ubicacion: r.data.ubicacion,
          tipo: r.data.tipo, precio: r.data.precio,
          retorno_anual_porcentaje: r.data.retorno_anual_porcentaje,
          num_habitaciones: r.data.num_habitaciones ?? '',
          num_banos: r.data.num_banos ?? '',
          metros_cuadrados: r.data.metros_cuadrados ?? '',
          planta: r.data.planta ?? '',
          garaje: r.data.garaje ?? false, piscina: r.data.piscina ?? false,
          ascensor: r.data.ascensor ?? false, terraza: r.data.terraza ?? false,
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
          const mis = Array.isArray(r.data) ? r.data : (r.data.results || [])
          setEsInversor(mis.some(inv =>
            String(inv.id_inmueble) === String(id) || String(inv.inmueble?.id) === String(id)
          ))
        })
        .catch(() => setEsInversor(false))
    } else {
      setEsInversor(false)
    }
  }, [id, user])

  const handleGuardar = async (e) => {
    e.preventDefault(); setGuardando(true)
    try {
      const payload = {
        nombre: formInmueble.nombre, ubicacion: formInmueble.ubicacion,
        tipo: formInmueble.tipo, precio: formInmueble.precio,
        retorno_anual_porcentaje: formInmueble.retorno_anual_porcentaje,
        num_habitaciones: formInmueble.num_habitaciones !== '' ? formInmueble.num_habitaciones : null,
        num_banos: formInmueble.num_banos !== '' ? formInmueble.num_banos : null,
        metros_cuadrados: formInmueble.metros_cuadrados !== '' ? formInmueble.metros_cuadrados : null,
        planta: formInmueble.planta !== '' ? formInmueble.planta : null,
        garaje: formInmueble.garaje, piscina: formInmueble.piscina,
        ascensor: formInmueble.ascensor, terraza: formInmueble.terraza,
      }
      await api.patch(`/inmuebles/${id}/`, payload)
      mostrarMsg('Cambios guardados correctamente.', 'ok')
      cargar()
      setTimeout(() => setEditando(false), 600)
    } catch {
      mostrarMsg('Error al guardar los cambios.', 'err')
    } finally { setGuardando(false) }
  }

  if (loading) return (
    <div style={G.page}><Navbar />
      <div style={G.container}><p style={s.estadoCenter}>Cargando propiedad...</p></div>
    </div>
  )
  if (!inmueble) return null

  const fotos = inmueble.fotos_detalle?.length > 0
    ? inmueble.fotos_detalle
    : [{ imagen: inmueble.fotos || FALLBACK }]

  return (
    <div style={{ ...G.page, overflowX: 'hidden' }}>
      <Navbar />


      {toast.msg && (
        <div style={{
          ...(toast.tipo === 'ok' ? s.toastOk : s.toastErr),
          right: isMobile ? '0.75rem' : '1.25rem',
          left: isMobile ? '0.75rem' : 'auto',
          maxWidth: isMobile ? 'calc(100% - 1.5rem)' : '320px',
        }}>
          {toast.msg}
        </div>
      )}


      {mostrarInvertir && (
        <ModalInversion
          inmueble={inmueble}
          onClose={() => setMostrarInvertir(false)}
          onSuccess={() => {
            setMostrarInvertir(false); setEsInversor(true); cargar()
            mostrarMsg('¡Inversión completada! Ya puedes acceder al chat.', 'ok')
          }}
        />
      )}


      {mostrarChat && esInversor && (
        <div style={G.overlay} onClick={() => setMostrarChat(false)}>
          <div style={{
            ...s.modalChat,
            maxWidth: isMobile ? '100%' : '1000px',
            width: '100%',
            height: isMobile ? '90vh' : '85vh',
            borderRadius: isMobile ? '16px 16px 0 0' : '16px',
            marginTop: isMobile ? 'auto' : 0,
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              ...s.modalChatHeader,
              padding: isMobile ? '1rem' : '1.25rem',
            }}>
              <div>
                <h3 style={{ ...G.h3, margin: 0 }}>Chat de Inversores</h3>
                <p style={s.modalChatSub}>{inmueble.nombre}</p>
              </div>
              <button style={s.btnCloseModal} onClick={() => setMostrarChat(false)}>✕</button>
            </div>
            <div style={s.modalChatBody}>
              <ChatInmueble inmuebleId={id} />
            </div>
          </div>
        </div>
      )}


      <div style={s.heroBar}>
        <div style={{
          ...G.container,
          ...s.heroContent,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '0.5rem' : 0,
          alignItems: isMobile ? 'flex-start' : 'center',
          padding: isMobile ? '0 1rem' : undefined,
        }}>
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

      <div style={{
        ...G.container,
        padding: isMobile ? '0 1rem' : undefined,
      }}>
        {editando ? (

          <form onSubmit={handleGuardar} style={{
            ...s.editForm,
            padding: isMobile ? '1.2rem' : '2rem',
          }}>
            <div style={{
              ...s.editHeader,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '1rem' : 0,
              alignItems: isMobile ? 'flex-start' : 'center',
            }}>
              <h2 style={G.h2}>Modo edición</h2>
              <button type="submit" style={G.btnPrimario} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

            <div style={{
              ...s.editGrid,
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            }}>
              {[
                ['nombre', 'Nombre', 'text'],
                ['ubicacion', 'Ubicación', 'text'],
                ['precio', 'Precio (€)', 'number'],
                ['retorno_anual_porcentaje', 'Retorno Anual (%)', 'number'],
                ['metros_cuadrados', 'Metros Cuadrados', 'number'],
                ['num_habitaciones', 'Nº Habitaciones', 'number'],
                ['num_banos', 'Nº Baños', 'number'],
                ['planta', 'Planta', 'text'],
              ].map(([key, label, type]) => (
                <div key={key} style={s.inputGroup}>
                  <label style={G.label}>{label}</label>
                  <input style={G.input} type={type}
                    value={formInmueble[key]}
                    onChange={e => setFormInmueble({ ...formInmueble, [key]: e.target.value })}
                  />
                </div>
              ))}

              <div style={s.inputGroup}>
                <label style={G.label}>Tipo</label>
                <select style={G.input} value={formInmueble.tipo}
                  onChange={e => setFormInmueble({ ...formInmueble, tipo: e.target.value })}>
                  {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div style={{
              ...s.editChecks,
              gap: isMobile ? '1rem' : '1.5rem',
            }}>
              {['garaje', 'piscina', 'ascensor', 'terraza'].map(key => (
                <label key={key} style={s.checkItem}>
                  <input type="checkbox"
                    checked={formInmueble[key]}
                    onChange={e => setFormInmueble({ ...formInmueble, [key]: e.target.checked })} />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
              ))}
            </div>
          </form>
        ) : (

          <div style={{
            ...s.layoutPrincipal,
            gridTemplateColumns: isMobile ? '1fr' : '1fr 380px',
            gap: isMobile ? '1.5rem' : '2rem',
            paddingBottom: isMobile ? '6rem' : '4rem',
          }}>

            <div style={s.colIzquierda}>

              <div style={s.galeriaWrap}>
                <div style={{
                  ...s.fotoPrincipal,
                  aspectRatio: isMobile ? '4/3' : '16/9',
                }}>
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
                      <div key={f.id || i}
                        style={i === fotoActiva ? s.thumbActivo : s.thumb}
                        onClick={() => setFotoActiva(i)}>
                        <img src={f.imagen || FALLBACK} alt={`Vista ${i + 1}`}
                          onError={e => { e.target.src = FALLBACK }}
                          style={s.imgFull} />
                      </div>
                    ))}
                  </div>
                )}
              </div>


              <div style={{
                ...s.bloqueInfo,
                padding: isMobile ? '1.2rem' : '2rem',
              }}>
                <h1 style={{ ...G.h1, marginBottom: '0.5rem' }}>{inmueble.nombre}</h1>
                <p style={s.ubicacion}>📍 {inmueble.ubicacion}</p>
                <hr style={{ ...G.hr, margin: '1.5rem 0' }} />
                <h2 style={{ ...G.h2, marginBottom: '1rem' }}>Características</h2>
                <div style={{
                  ...s.caracteristicasGrid,
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(140px, 1fr))',
                }}>
                  {inmueble.metros_cuadrados && (
                    <div style={s.charItem}><span style={s.charLabel}>Superficie</span><span style={s.charValue}>{inmueble.metros_cuadrados} m²</span></div>
                  )}
                  {inmueble.num_habitaciones != null && (
                    <div style={s.charItem}><span style={s.charLabel}>Habitaciones</span><span style={s.charValue}>{inmueble.num_habitaciones}</span></div>
                  )}
                  {inmueble.num_banos != null && (
                    <div style={s.charItem}><span style={s.charLabel}>Baños</span><span style={s.charValue}>{inmueble.num_banos}</span></div>
                  )}
                  {inmueble.planta && (
                    <div style={s.charItem}><span style={s.charLabel}>Planta</span><span style={s.charValue}>{inmueble.planta}</span></div>
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


            <div style={{
              ...s.colDerecha,
              position: isMobile ? 'static' : 'sticky',
            }}>
              <div style={{
                ...s.tarjetaInversion,
                padding: isMobile ? '1.2rem' : '1.5rem',
              }}>
                <div style={s.precioBox}>
                  <span style={s.precioLabel}>Precio del inmueble</span>
                  <span style={{
                    ...s.precioValor,
                    fontSize: isMobile ? '1.5rem' : '2rem',
                  }}>
                    {Number(inmueble.precio).toLocaleString('es-ES')} €
                  </span>
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
  toastOk:  { ...G.toastOk,  position: 'fixed', top: '1.25rem', zIndex: 9999 },
  toastErr: { ...G.toastErr, position: 'fixed', top: '1.25rem', zIndex: 9999 },
  estadoCenter: { textAlign: 'center', color: T.textoMuted, padding: '4rem 0' },
  heroBar: { background: T.blanco, borderBottom: `1px solid ${T.borde}`, marginBottom: '2rem', padding: '0.8rem 0' },
  heroContent: { display: 'flex', justifyContent: 'space-between' },
  layoutPrincipal: { display: 'grid', alignItems: 'start' },
  colIzquierda: { display: 'flex', flexDirection: 'column', gap: '2rem' },
  colDerecha: { display: 'flex', flexDirection: 'column', gap: '1.5rem', top: '2rem' },
  galeriaWrap: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  fotoPrincipal: { position: 'relative', width: '100%', borderRadius: T.radioLg, overflow: 'hidden', background: T.bg },
  imgFull: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  badgeTipo: { position: 'absolute', top: '1rem', left: '1rem', background: T.naranja, color: '#fff', padding: '0.4rem 0.8rem', borderRadius: T.radioPill, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' },
  thumbnailsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.8rem' },
  thumb: { aspectRatio: '4/3', borderRadius: T.radioSm, overflow: 'hidden', cursor: 'pointer', opacity: 0.6, border: '2px solid transparent', transition: 'opacity 0.2s' },
  thumbActivo: { aspectRatio: '4/3', borderRadius: T.radioSm, overflow: 'hidden', cursor: 'pointer', opacity: 1, border: `2px solid ${T.naranja}` },
  bloqueInfo: { background: T.blanco, borderRadius: T.radioLg, border: `1px solid ${T.borde}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  ubicacion: { color: T.textoMuted, fontSize: '1.05rem', margin: 0 },
  caracteristicasGrid: { display: 'grid', gap: '1rem', marginBottom: '1.5rem' },
  charItem: { display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.8rem', background: T.bg, borderRadius: T.radioSm, border: `1px solid ${T.borde}` },
  charLabel: { fontSize: '0.75rem', color: T.textoMuted, textTransform: 'uppercase', letterSpacing: '0.04em' },
  charValue: { fontSize: '1.1rem', fontWeight: 600, color: T.texto },
  extrasList: { display: 'flex', flexWrap: 'wrap', gap: '0.8rem' },
  extraTag: { padding: '0.4rem 0.8rem', background: T.blanco, border: `1px solid ${T.borde}`, borderRadius: T.radioPill, fontSize: '0.85rem', color: T.texto, fontWeight: 500 },
  tarjetaInversion: { background: T.blanco, borderRadius: T.radioLg, border: `1px solid ${T.borde}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  precioBox: { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.25rem' },
  precioLabel: { fontSize: '0.85rem', color: T.textoMuted },
  precioValor: { fontWeight: 800, color: T.texto, fontVariantNumeric: 'tabular-nums' },
  retornoBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: T.radioSm, border: '1px solid #dcfce7' },
  retornoLabel: { display: 'block', fontSize: '0.75rem', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' },
  retornoValor: { fontSize: '1.25rem', fontWeight: 700, color: '#166534' },
  retornoChart: { fontSize: '2rem', opacity: 0.8 },
  garantiaTexto: { textAlign: 'center', fontSize: '0.75rem', color: T.textoMuted, marginTop: '1.5rem' },
  modalChat: { ...G.modal, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '600px' },
  modalChatHeader: { background: T.bg, borderBottom: `1px solid ${T.borde}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalChatSub: { fontSize: '0.85rem', color: T.textoMuted, marginTop: '0.2rem', margin: 0 },
  btnCloseModal: { background: 'none', border: 'none', fontSize: '1.2rem', color: T.textoMuted, cursor: 'pointer', padding: '0.2rem' },
  modalChatBody: { flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' },
  editForm: { background: T.blanco, borderRadius: T.radioLg, border: `1px solid ${T.naranja}`, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
  editHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: `1px solid ${T.borde}` },
  editGrid: { display: 'grid', gap: '1.25rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  editChecks: { display: 'flex', flexWrap: 'wrap', marginTop: '2rem', padding: '1.5rem', background: T.bg, borderRadius: T.radioSm, border: `1px solid ${T.borde}` },
  checkItem: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: T.texto, cursor: 'pointer' },
}