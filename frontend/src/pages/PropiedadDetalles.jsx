import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import useAuthStore from '../store/authStore.jsx'
import ModalInversion from '../componentes/Inversion.jsx'

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80'

export default function PropiedadDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.is_staff || user?.is_superuser

  const [inmueble, setInmueble] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fotoActiva, setFotoActiva] = useState(0)
  const [editando, setEditando] = useState(false)
  const [formInmueble, setFormInmueble] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [msgEdit, setMsgEdit] = useState('')
  const [tipos, setTipos] = useState([])
  const [mostrarInvertir, setMostrarInvertir] = useState(false)

  const cargar = () => {
    api.get(`/inmuebles/${id}/`)
      .then(r => {
        setInmueble(r.data)
        setFormInmueble({
          nombre:                   r.data.nombre,
          ubicacion:                r.data.ubicacion,
          tipo:                     r.data.tipo,
          precio:                   r.data.precio,
          retorno_anual_porcentaje: r.data.retorno_anual_porcentaje,
          num_habitaciones:         r.data.num_habitaciones ?? '',
          num_banos:                r.data.num_banos ?? '',
          metros_cuadrados:         r.data.metros_cuadrados ?? '',
          planta:                   r.data.planta ?? '',
          garaje:                   r.data.garaje ?? false,
          piscina:                  r.data.piscina ?? false,
          ascensor:                 r.data.ascensor ?? false,
          terraza:                  r.data.terraza ?? false,
        })
      })
      .catch(() => navigate('/propiedades'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
    api.get('/inmuebles/tipos/').then(r => setTipos(r.data))
  }, [id])

  const handleGuardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setMsgEdit('')
    try {
      const payload = {
        nombre:                   formInmueble.nombre,
        ubicacion:                formInmueble.ubicacion,
        tipo:                     formInmueble.tipo,
        precio:                   formInmueble.precio,
        retorno_anual_porcentaje: formInmueble.retorno_anual_porcentaje,
        num_habitaciones:         formInmueble.num_habitaciones !== '' ? formInmueble.num_habitaciones : null,
        num_banos:                formInmueble.num_banos !== '' ? formInmueble.num_banos : null,
        metros_cuadrados:         formInmueble.metros_cuadrados !== '' ? formInmueble.metros_cuadrados : null,
        planta:                   formInmueble.planta !== '' ? formInmueble.planta : null,
        garaje:                   formInmueble.garaje,
        piscina:                  formInmueble.piscina,
        ascensor:                 formInmueble.ascensor,
        terraza:                  formInmueble.terraza,
      }
      await api.patch(`/inmuebles/${id}/`, payload)
      setMsgEdit('✅ Cambios guardados.')
      cargar()
      setTimeout(() => setEditando(false), 1000)
    } catch (err) {
      console.error('Error detalle:', JSON.stringify(err.response?.data, null, 2))
      setMsgEdit('❌ Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <div style={s.center}>Cargando...</div>
  if (!inmueble) return null

  const fotos = Array.isArray(inmueble.fotos)
    ? inmueble.fotos.filter(Boolean)
    : inmueble.fotos ? [inmueble.fotos] : [FALLBACK]

  const porcentaje = parseFloat(inmueble.retorno_anual_porcentaje ?? 0)

  const extras = [
    inmueble.garaje   && 'Garaje',
    inmueble.piscina  && 'Piscina',
    inmueble.ascensor && 'Ascensor',
    inmueble.terraza  && 'Terraza',
  ].filter(Boolean)

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        <button style={s.back} onClick={() => navigate('/propiedades')}>← Volver</button>

        <div style={s.layout}>


          <div style={s.colLeft}>
            <div style={s.heroWrap}>
              <img
                src={fotos[fotoActiva] || FALLBACK}
                alt={inmueble.nombre}
                style={s.heroImg}
                onError={e => { e.target.src = FALLBACK }}
              />
              {isAdmin && (
                <button style={s.btnEditar} onClick={() => setEditando(true)}>
                  ✏️ Editar
                </button>
              )}
            </div>

            {fotos.length > 1 && (
              <div style={s.thumbRow}>
                {fotos.map((f, i) => (
                  <div
                    key={i}
                    style={{ ...s.thumb, outline: i === fotoActiva ? '3px solid #F97316' : '3px solid transparent' }}
                    onClick={() => setFotoActiva(i)}
                  >
                    <img src={f || FALLBACK} alt={`foto ${i + 1}`} style={s.thumbImg}
                      onError={e => { e.target.src = FALLBACK }} />
                  </div>
                ))}
              </div>
            )}

            <button style={s.btnInvertir} onClick={() => setMostrarInvertir(true)}>
              Invertir
            </button>
          </div>


          <div style={s.colRight}>
            <div style={s.panelInfo}>
              <h2 style={s.nombreTitulo}>{inmueble.nombre}</h2>
              <div style={s.infoFila}><span style={s.infoLabel}>Tipo:</span><span style={s.infoVal}>{inmueble.tipo}</span></div>
              <div style={s.infoFila}><span style={s.infoLabel}>Ubicación:</span><span style={s.infoVal}>{inmueble.ubicacion}</span></div>
              {inmueble.metros_cuadrados != null && <div style={s.infoFila}><span style={s.infoLabel}>Tamaño:</span><span style={s.infoVal}>{inmueble.metros_cuadrados} m²</span></div>}
              {inmueble.num_habitaciones != null && <div style={s.infoFila}><span style={s.infoLabel}>Habitaciones:</span><span style={s.infoVal}>{inmueble.num_habitaciones}</span></div>}
              {inmueble.num_banos != null && <div style={s.infoFila}><span style={s.infoLabel}>Baños:</span><span style={s.infoVal}>{inmueble.num_banos}</span></div>}
              {inmueble.planta != null && <div style={s.infoFila}><span style={s.infoLabel}>Planta:</span><span style={s.infoVal}>{inmueble.planta}ª</span></div>}
              <div style={s.separador} />
              <div style={s.infoFila}><span style={s.infoLabel}>Precio:</span><span style={{ ...s.infoVal, fontWeight: 700, color: '#1a1a1a' }}>{Number(inmueble.precio).toLocaleString('es-ES')} €</span></div>
              <div style={s.infoFila}><span style={s.infoLabel}>Retorno anual:</span><span style={{ ...s.infoVal, fontWeight: 700, color: '#16a34a' }}>{porcentaje}%</span></div>
              {extras.length > 0 && (
                <div style={s.infoFila}>
                  <span style={s.infoLabel}>Extras:</span>
                  <span style={s.infoVal}>{extras.join(', ')}</span>
                </div>
              )}
            </div>

            <div style={s.panelChat}>
              <p style={s.chatAviso}>🔒 Solo inversores de este inmueble pueden ver el chat</p>
              <button style={s.btnChat} onClick={() => navigate(`/chat/${id}`)}>
                💬 Acceder al chat
              </button>
            </div>
          </div>
        </div>


        {mostrarInvertir && (
          <ModalInversion
            inmueble={inmueble}
            onClose={() => setMostrarInvertir(false)}
          />
        )}


        {editando && (
          <div style={s.modalOverlay} onClick={() => setEditando(false)}>
            <div style={s.modal} onClick={e => e.stopPropagation()}>
              <h2 style={{ ...s.h2, marginBottom: '1.5rem' }}>✏️ Editar inmueble</h2>
              <form onSubmit={handleGuardar} style={s.form}>

                <p style={s.seccion}>Datos generales</p>
                <label style={s.label}>Nombre</label>
                <input style={s.input} value={formInmueble.nombre || ''}
                  onChange={e => setFormInmueble({ ...formInmueble, nombre: e.target.value })} />

                <label style={s.label}>Ubicación</label>
                <input style={s.input} value={formInmueble.ubicacion || ''}
                  onChange={e => setFormInmueble({ ...formInmueble, ubicacion: e.target.value })} />

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Precio (€)</label>
                    <input type="number" style={s.input} value={formInmueble.precio || ''}
                      onChange={e => setFormInmueble({ ...formInmueble, precio: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Retorno anual (%)</label>
                    <input type="number" step="0.01" style={s.input} value={formInmueble.retorno_anual_porcentaje || ''}
                      onChange={e => setFormInmueble({ ...formInmueble, retorno_anual_porcentaje: e.target.value })} />
                  </div>
                </div>

                <label style={s.label}>Tipo</label>
                <select style={s.input} value={formInmueble.tipo || ''}
                  onChange={e => setFormInmueble({ ...formInmueble, tipo: e.target.value })}>
                  <option value="">-- Selecciona tipo --</option>
                  {tipos.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <p style={s.seccion}>Características</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={s.label}>Habitaciones</label>
                    <input type="number" style={s.input} value={formInmueble.num_habitaciones ?? ''}
                      onChange={e => setFormInmueble({ ...formInmueble, num_habitaciones: e.target.value })} />
                  </div>
                  <div>
                    <label style={s.label}>Baños</label>
                    <input type="number" style={s.input} value={formInmueble.num_banos ?? ''}
                      onChange={e => setFormInmueble({ ...formInmueble, num_banos: e.target.value })} />
                  </div>
                  <div>
                    <label style={s.label}>Metros cuadrados</label>
                    <input type="number" style={s.input} value={formInmueble.metros_cuadrados ?? ''}
                      onChange={e => setFormInmueble({ ...formInmueble, metros_cuadrados: e.target.value })} />
                  </div>
                  <div>
                    <label style={s.label}>Planta</label>
                    <input type="number" style={s.input} value={formInmueble.planta ?? ''}
                      onChange={e => setFormInmueble({ ...formInmueble, planta: e.target.value })} />
                  </div>
                </div>

                <div style={s.checkGrid}>
                  {['garaje', 'piscina', 'ascensor', 'terraza'].map(campo => (
                    <label key={campo} style={s.checkLabel}>
                      <input
                        type="checkbox"
                        checked={formInmueble[campo] || false}
                        onChange={e => setFormInmueble({ ...formInmueble, [campo]: e.target.checked })}
                      />
                      {campo.charAt(0).toUpperCase() + campo.slice(1)}
                    </label>
                  ))}
                </div>

                {msgEdit && (
                  <p style={{ ...s.msgBox, background: msgEdit.includes('✅') ? '#dcfce7' : '#fee2e2', color: msgEdit.includes('✅') ? '#166534' : '#991b1b' }}>
                    {msgEdit}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                  <button type="submit" style={s.btnNaranja} disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button type="button" style={s.btnGris} onClick={() => setEditando(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  page:          { minHeight: '100vh', background: '#f5f5f0' },
  center:        { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#888' },
  container:     { maxWidth: '1100px', margin: '0 auto', padding: '1rem 1rem 3rem' },
  back:          { color: '#F97316', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '1rem', background: 'none', border: 'none', padding: 0 },
  layout:        { display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' },
  colLeft:       { flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  colRight:      { flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  heroWrap:      { position: 'relative', width: '100%', height: '320px', borderRadius: '12px', overflow: 'hidden' },
  heroImg:       { width: '100%', height: '100%', objectFit: 'cover' },
  btnEditar:     { position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  thumbRow:      { display: 'flex', gap: '0.5rem', overflowX: 'auto' },
  thumb:         { flexShrink: 0, width: '100px', height: '70px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' },
  thumbImg:      { width: '100%', height: '100%', objectFit: 'cover' },
  btnInvertir:   { width: '100%', padding: '1rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', marginTop: '0.3rem' },
  panelInfo:     { background: '#fff', borderRadius: '14px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' },
  nombreTitulo:  { fontSize: '1.3rem', fontWeight: '800', color: '#1a1a1a', marginBottom: '0.4rem' },
  infoFila:      { display: 'flex', gap: '0.5rem', fontSize: '0.95rem' },
  infoLabel:     { fontWeight: '600', color: '#1a1a1a', minWidth: '110px' },
  infoVal:       { color: '#555' },
  separador:     { height: '1px', background: '#eee', margin: '0.2rem 0' },
  panelChat:     { background: '#fff', borderRadius: '14px', padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' },
  chatAviso:     { fontSize: '0.88rem', color: '#aaa', textAlign: 'center', padding: '0.5rem 0' },
  btnChat:       { width: '100%', padding: '0.8rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' },
  modalOverlay:  { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:         { background: '#fff', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
  h2:            { fontSize: '1.2rem', fontWeight: '700', color: '#1a1a1a' },
  form:          { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  label:         { fontSize: '0.82rem', fontWeight: '600', color: '#555' },
  input:         { padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.95rem', outline: 'none', width: '100%' },
  msgBox:        { borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.88rem' },
  btnNaranja:    { flex: 1, padding: '0.8rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' },
  btnGris:       { flex: 1, padding: '0.8rem', background: '#f3f4f6', color: '#444', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer' },
  seccion:       { fontSize: '0.78rem', fontWeight: '700', color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.5rem' },
  checkGrid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  checkLabel:    { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#444', cursor: 'pointer' },
}