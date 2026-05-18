import { useState, useEffect } from 'react'
import api from '../api/axios.jsx'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function ModalInversion({ inmueble, onClose }) {
  const isMobile = useIsMobile()
  const [step, setStep] = useState(1)
  const [cantidad, setCantidad] = useState(1000)
  const [metodo, setMetodo] = useState('tarjeta')
  const [tarjetas, setTarjetas] = useState([])
  const [tarjetaSeleccionada, setTarjetaSeleccionada] = useState(null)
  const [nuevaTarjeta, setNuevaTarjeta] = useState(false)
  const [formTarjeta, setFormTarjeta] = useState({ numero_tarjeta: '', fecha_caducidad: '', nombre_titular: '' })
  const [perfil, setPerfil] = useState(null)
  const [transaccion, setTransaccion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const comision = +(cantidad * 0.01).toFixed(2)
  const total = +(cantidad + comision).toFixed(2)
  const retornoMensual = +((cantidad * (inmueble.retorno_anual_porcentaje / 100)) / 12).toFixed(2)
  const participacion = +((cantidad / inmueble.precio) * 100).toFixed(2)

  useEffect(() => {
    api.get('/tarjetas/').then(r => {
      setTarjetas(r.data)
      if (r.data.length > 0) setTarjetaSeleccionada(r.data[0].id)
    })
    api.get('/perfil/').then(r => setPerfil(r.data))
  }, [])

  const handleInvertir = async () => {
    setError(''); setLoading(true)
    try {
      if (metodo === 'tarjeta' && nuevaTarjeta) {
        const res = await api.post('/tarjetas/', {
          ...formTarjeta,
          numero_tarjeta: formTarjeta.numero_tarjeta.replace(/\s/g, '')
        })
        setTarjetaSeleccionada(res.data.id)
      }
      const res = await api.post('/inversiones/', {
        id_inmueble: inmueble.id,
        cantidad,
        metodo_pago: metodo,
        ...(metodo === 'tarjeta' && { tarjeta_id: nuevaTarjeta ? null : tarjetaSeleccionada }),
      })
      setTransaccion(res.data.numero_transaccion)
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la inversión')
    } finally { setLoading(false) }
  }

  const ResumenBox = ({ children }) => (
    <div style={{
      ...s.resumen,
      marginTop: isMobile ? '1.5rem' : 0,
    }}>
      <h3 style={s.resumenTitulo}>Resumen de tu inversión</h3>
      {children}
    </div>
  )

  return (
    <div style={s.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        ...s.modal,
        maxWidth: isMobile ? '100%' : '900px',
        maxHeight: isMobile ? '95vh' : '90vh',
        borderRadius: isMobile ? '16px 16px 0 0' : '16px',
        marginTop: isMobile ? 'auto' : 0,
        width: '100%',
      }}>

        <div style={{
          ...s.header,
          padding: isMobile ? '1.2rem 1rem 0.8rem' : '1.5rem 2rem 1rem',
        }}>
          <div>
            <h2 style={s.titulo}>Invertir en {inmueble.nombre}</h2>
            <p style={s.subtitulo}>{inmueble.ubicacion}</p>
          </div>
          <button style={s.cerrar} onClick={onClose}>✕</button>
        </div>

        {step < 3 && (
          <div style={{
            ...s.steps,
            gap: isMobile ? '1.5rem' : '3rem',
            padding: isMobile ? '0.8rem 1rem' : '1rem 2rem',
          }}>
            {['Cantidad', 'Pago', 'Confirmación'].map((label, i) => (
              <div key={i} style={s.stepItem}>
                <div style={{
                  ...s.stepCircle,
                  ...(step > i ? s.stepDone : step === i + 1 ? s.stepActive : {}),
                }}>
                  {step > i ? '✓' : i + 1}
                </div>
                <span style={{ ...s.stepLabel, color: step === i + 1 ? '#F97316' : '#aaa' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div style={{
            ...s.body,
            padding: isMobile ? '1rem' : '1.5rem 2rem',
          }}>
            <div style={{
              ...s.grid2,
              gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
              gap: isMobile ? '0' : '2rem',
            }}>
              <div style={s.seccion}>
                <label style={s.label}>Cantidad a invertir</label>
                <div style={s.cantidadDisplay}>{cantidad.toLocaleString('es-ES')}€</div>
                <input type="range" min={100}
                  max={Math.floor(inmueble.disponible_para_invertir)}
                  step={100} value={cantidad}
                  onChange={e => setCantidad(+e.target.value)}
                  style={s.slider} />
                <div style={s.sliderLabels}>
                  <span>100€</span>
                  <span>{Math.floor(inmueble.disponible_para_invertir).toLocaleString('es-ES')}€</span>
                </div>
                <input type="number" style={s.input} value={cantidad} min={100}
                  max={Math.floor(inmueble.disponible_para_invertir)}
                  onChange={e => setCantidad(Math.min(+e.target.value, inmueble.disponible_para_invertir))} />

                <div style={{ ...s.infoGrid, marginTop: '1rem' }}>
                  <div style={s.infoItem}><span style={s.infoLabel}>Ubicación</span><span style={s.infoVal}>{inmueble.ubicacion}</span></div>
                  <div style={s.infoItem}><span style={s.infoLabel}>Valor inmueble</span><span style={s.infoVal}>{inmueble.precio?.toLocaleString('es-ES')}€</span></div>
                  <div style={s.infoItem}><span style={s.infoLabel}>Rentabilidad</span><span style={s.infoVal}>{inmueble.retorno_anual_porcentaje}% anual</span></div>
                  <div style={s.infoItem}><span style={s.infoLabel}>Pisos alquilados</span><span style={s.infoVal}>{inmueble.num_habitaciones || '—'}</span></div>
                </div>
              </div>

              <ResumenBox>
                <div style={s.resumenFila}><span>Capital a invertir</span><strong>{cantidad.toLocaleString('es-ES')}€</strong></div>
                <div style={s.resumenFila}><span>% de participación</span><strong>{participacion}%</strong></div>
                <div style={s.resumenFila}><span>Beneficio mensual est.</span><strong style={{ color: '#16a34a' }}>{retornoMensual.toLocaleString('es-ES')}€</strong></div>
                <div style={s.sliderWrap}>
                  <label style={s.label}>% de inversión</label>
                  <input type="range" min={0} max={100} value={participacion} readOnly style={s.slider} />
                  <div style={s.sliderLabels}><span>0%</span><span>100%</span></div>
                </div>
                <button style={s.btnNaranja} onClick={() => setStep(2)}>Invertir →</button>
              </ResumenBox>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{
            ...s.body,
            padding: isMobile ? '1rem' : '1.5rem 2rem',
          }}>
            <div style={{
              ...s.grid2,
              gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
              gap: isMobile ? '0' : '2rem',
            }}>
              <div style={s.seccion}>
                <h3 style={s.seccionTitulo}>Datos del inversor</h3>
                <div style={{
                  ...s.datosGrid,
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                }}>
                  <div style={s.datoItem}><span style={s.infoLabel}>Nombre</span><span>{perfil?.nombre} {perfil?.apellidos}</span></div>
                  <div style={s.datoItem}><span style={s.infoLabel}>Correo</span><span>{perfil?.email}</span></div>
                  <div style={s.datoItem}><span style={s.infoLabel}>Teléfono</span><span>{perfil?.telefono || '—'}</span></div>
                  <div style={s.datoItem}><span style={s.infoLabel}>Fecha nacimiento</span><span>{perfil?.fecha_nacimiento || '—'}</span></div>
                  <div style={s.datoItem}><span style={s.infoLabel}>DNI</span><span>{perfil?.dni}</span></div>
                  <div style={s.datoItem}><span style={s.infoLabel}>Dirección</span><span>{perfil?.direccion || '—'}</span></div>
                </div>

                <h3 style={{ ...s.seccionTitulo, marginTop: '1.5rem' }}>Método de pago</h3>
                <div style={{
                  ...s.metodosWrap,
                  flexDirection: isMobile ? 'column' : 'row',
                }}>
                  <button style={{ ...s.metodoBtn, ...(metodo === 'tarjeta' ? s.metodoBtnActivo : {}) }} onClick={() => setMetodo('tarjeta')}>
                    💳 Tarjeta crédito/débito
                  </button>
                  <button style={{ ...s.metodoBtn, ...(metodo === 'transferencia' ? s.metodoBtnActivo : {}) }} onClick={() => setMetodo('transferencia')}>
                    🏦 Transferencia bancaria
                  </button>
                </div>

                {metodo === 'tarjeta' && (
                  <div style={{ marginTop: '1rem' }}>
                    {tarjetas.length > 0 && !nuevaTarjeta && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.8rem' }}>
                        {tarjetas.map(t => (
                          <label key={t.id} style={{ ...s.tarjetaOpcion, ...(tarjetaSeleccionada === t.id ? s.tarjetaActiva : {}) }}>
                            <input type="radio" name="tarjeta" value={t.id}
                              checked={tarjetaSeleccionada === t.id}
                              onChange={() => setTarjetaSeleccionada(t.id)}
                              style={{ marginRight: '0.5rem' }} />
                            <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>
                              **** **** **** {t.numero_tarjeta.slice(-4)}
                            </span>
                            <span style={{ marginLeft: 'auto', color: '#888', fontSize: '0.82rem' }}>
                              {t.nombre_titular} · {t.fecha_caducidad}
                            </span>
                          </label>
                        ))}
                        <button style={s.btnAddTarjeta} onClick={() => setNuevaTarjeta(true)}>+ Usar otra tarjeta</button>
                      </div>
                    )}
                    {(nuevaTarjeta || tarjetas.length === 0) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {tarjetas.length > 0 && (
                          <button style={s.btnAddTarjeta} onClick={() => setNuevaTarjeta(false)}>← Usar tarjeta guardada</button>
                        )}
                        <div style={s.campo}><label style={s.label}>Nombre titular</label><input style={s.input} value={formTarjeta.nombre_titular} onChange={e => setFormTarjeta({ ...formTarjeta, nombre_titular: e.target.value })} /></div>
                        <div style={s.campo}><label style={s.label}>Número de tarjeta</label><input style={s.input} placeholder="1234 5678 9012 3456" maxLength={19} value={formTarjeta.numero_tarjeta} onChange={e => setFormTarjeta({ ...formTarjeta, numero_tarjeta: e.target.value })} /></div>
                        <div style={s.campo}><label style={s.label}>Fecha caducidad</label><input style={s.input} placeholder="MM/YYYY" value={formTarjeta.fecha_caducidad} onChange={e => setFormTarjeta({ ...formTarjeta, fecha_caducidad: e.target.value })} /></div>
                      </div>
                    )}
                  </div>
                )}

                {metodo === 'transferencia' && (
                  <div style={{ ...s.ibanBox, marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: '0.4rem' }}>Realiza la transferencia a este IBAN:</p>
                    <code style={s.ibanCode}>ES91 2100 0418 4502 0005 1332</code>
                    <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>Concepto: <strong>INV-{perfil?.dni}-{inmueble.id}</strong></p>
                    <p style={{ fontSize: '0.8rem', color: '#F97316', marginTop: '0.3rem' }}>⚠️ La inversión se activará al recibir el pago (1-2 días hábiles)</p>
                  </div>
                )}

                {error && <p style={s.error}>{error}</p>}
              </div>

              <ResumenBox>
                <div style={s.resumenFila}><span>Capital a invertir</span><strong>{cantidad.toLocaleString('es-ES')}€</strong></div>
                <div style={s.resumenFila}><span>Rentabilidad esperada</span><strong style={{ color: '#16a34a' }}>{inmueble.retorno_anual_porcentaje}% anual</strong></div>
                <div style={s.resumenFila}><span>Comisión (1%)</span><strong>{comision}€</strong></div>
                <div style={{ ...s.resumenFila, borderTop: '2px solid #f3f4f6', paddingTop: '0.6rem', marginTop: '0.4rem' }}>
                  <span style={{ fontWeight: '700' }}>Total a pagar</span>
                  <strong style={{ fontSize: '1.1rem', color: '#F97316' }}>{total.toLocaleString('es-ES')}€</strong>
                </div>
                <div style={{
                  ...s.botonesForm,
                  flexDirection: isMobile ? 'column' : 'row',
                }}>
                  <button style={s.btnGris} onClick={() => setStep(1)}>← Volver</button>
                  <button style={s.btnNaranja} onClick={handleInvertir} disabled={loading}>
                    {loading ? 'Procesando...' : 'Confirmar inversión'}
                  </button>
                </div>
              </ResumenBox>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{
            ...s.confirmado,
            padding: isMobile ? '2rem 1rem' : '3rem 2rem',
          }}>
            <div style={s.checkCircle}>✓</div>
            <h2 style={s.confirmTitulo}>¡Inversión Confirmada!</h2>
            <p style={s.confirmDesc}>Tu inversión ha sido procesada exitosamente. Recibirás un correo de confirmación en breve.</p>
            <div style={s.transaccionBox}>
              <span style={{ fontSize: '0.82rem', color: '#888' }}>Número de transacción</span>
              <code style={s.transaccionNum}>{transaccion}</code>
            </div>
            <div style={{ ...s.confirmResumen, width: isMobile ? '100%' : undefined, maxWidth: '400px' }}>
              <div style={s.resumenFila}><span>Inmueble</span><strong>{inmueble.nombre}</strong></div>
              <div style={s.resumenFila}><span>Capital invertido</span><strong>{cantidad.toLocaleString('es-ES')}€</strong></div>
              <div style={s.resumenFila}><span>Método de pago</span><strong>{metodo === 'tarjeta' ? '💳 Tarjeta' : '🏦 Transferencia'}</strong></div>
              <div style={s.resumenFila}><span>Retorno mensual est.</span><strong style={{ color: '#16a34a' }}>{retornoMensual}€/mes</strong></div>
            </div>
            <button style={{ ...s.btnNaranja, maxWidth: isMobile ? '100%' : '300px' }} onClick={onClose}>Cerrar</button>
          </div>
        )}

      </div>
    </div>
  )
}

const s = {
  backdrop:        { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  modal:           { background: '#fff', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6' },
  titulo:          { fontSize: '1.2rem', fontWeight: '800', color: '#1a1a1a', margin: 0 },
  subtitulo:       { color: '#888', fontSize: '0.85rem', marginTop: '0.2rem' },
  cerrar:          { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#aaa', padding: '0.2rem', flexShrink: 0 },
  steps:           { display: 'flex', justifyContent: 'center', borderBottom: '1px solid #f3f4f6' },
  stepItem:        { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' },
  stepCircle:      { width: '28px', height: '28px', borderRadius: '50%', background: '#f3f4f6', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem' },
  stepActive:      { background: '#F97316', color: '#fff' },
  stepDone:        { background: '#16a34a', color: '#fff' },
  stepLabel:       { fontSize: '0.75rem', fontWeight: '600' },
  body:            {},
  grid2:           { display: 'grid' },
  seccion:         { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  seccionTitulo:   { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 0.5rem' },
  label:           { fontSize: '0.78rem', fontWeight: '600', color: '#555' },
  cantidadDisplay: { fontSize: '2rem', fontWeight: '800', color: '#F97316' },
  slider:          { width: '100%', accentColor: '#F97316' },
  sliderLabels:    { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#aaa' },
  sliderWrap:      { display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' },
  input:           { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.9rem', outline: 'none', width: '100%' },
  infoGrid:        { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' },
  infoItem:        { display: 'flex', flexDirection: 'column', gap: '0.1rem', padding: '0.5rem', background: '#f9f9f9', borderRadius: '8px' },
  infoLabel:       { fontSize: '0.75rem', color: '#aaa', fontWeight: '600' },
  infoVal:         { fontSize: '0.88rem', fontWeight: '600', color: '#1a1a1a' },
  resumen:         { background: '#f9f8f5', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', height: 'fit-content' },
  resumenTitulo:   { fontSize: '0.95rem', fontWeight: '700', color: '#1a1a1a', marginBottom: '0.3rem' },
  resumenFila:     { display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderBottom: '1px solid #eee', paddingBottom: '0.4rem' },
  datosGrid:       { display: 'grid', gap: '0.5rem' },
  datoItem:        { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  metodosWrap:     { display: 'flex', gap: '0.6rem', marginTop: '0.3rem' },
  metodoBtn:       { flex: 1, padding: '0.7rem', borderRadius: '8px', border: '2px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', color: '#555' },
  metodoBtnActivo: { border: '2px solid #F97316', background: '#fff7ed', color: '#F97316' },
  tarjetaOpcion:   { display: 'flex', alignItems: 'center', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1.5px solid #e0e0e0', cursor: 'pointer', fontSize: '0.88rem' },
  tarjetaActiva:   { border: '1.5px solid #F97316', background: '#fff7ed' },
  btnAddTarjeta:   { background: 'none', border: 'none', color: '#F97316', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left', padding: '0.2rem 0' },
  ibanBox:         { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1rem' },
  ibanCode:        { display: 'block', fontFamily: 'monospace', fontWeight: '700', fontSize: '1rem', color: '#166534', letterSpacing: '0.05rem', marginTop: '0.3rem' },
  campo:           { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  botonesForm:     { display: 'flex', gap: '0.6rem', marginTop: '0.8rem' },
  btnNaranja:      { flex: 1, padding: '0.7rem 1.2rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' },
  btnGris:         { padding: '0.7rem 1.2rem', background: '#f3f4f6', color: '#444', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },
  error:           { color: '#e53e3e', fontSize: '0.85rem', background: '#fff5f5', padding: '0.5rem', borderRadius: '6px' },
  confirmado:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' },
  checkCircle:     { width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '700' },
  confirmTitulo:   { fontSize: '1.5rem', fontWeight: '800', color: '#1a1a1a' },
  confirmDesc:     { color: '#666', fontSize: '0.9rem', maxWidth: '400px' },
  transaccionBox:  { background: '#f9f8f5', borderRadius: '10px', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center' },
  transaccionNum:  { fontFamily: 'monospace', fontWeight: '700', fontSize: '1.1rem', color: '#F97316', letterSpacing: '0.05rem' },
  confirmResumen:  { background: '#f9f8f5', borderRadius: '10px', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
}