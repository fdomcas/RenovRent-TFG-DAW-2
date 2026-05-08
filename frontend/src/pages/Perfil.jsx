import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import useAuthStore from '../store/authStore.jsx'
import Seguridad2FA from '../componentes/Seguridad2FA.jsx'

export default function Perfil() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [seccion, setSeccion] = useState(null)
  const [form, setForm] = useState({})
  const [passForm, setPassForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [tarjetas, setTarjetas] = useState([])
  const [tarjetaForm, setTarjetaForm] = useState({ numero_tarjeta: '', fecha_caducidad: '', nombre_titular: '' })
  const [msg, setMsg] = useState({ tipo: '', texto: '' })
  const [guardando, setGuardando] = useState(false)
  const [inversiones, setInversiones] = useState([])
  const [inversionesCargando, setInversionesCargando] = useState(true)
  const fotoRef = useRef()

  const totalInvertido = inversiones.reduce((s, i) => s + Number(i.cantidad), 0)
  const totalMensual   = inversiones.reduce((s, i) => s + Number(i.retorno_mensual), 0)
  const totalAnual     = inversiones.reduce((s, i) => s + Number(i.retorno_anual), 0)

  const cargar = () => {
    api.get('/perfil/').then(r => {
      setPerfil(r.data)
      setForm(r.data)
    }).finally(() => setLoading(false))
  }

  const cargarTarjetas = () => {
    api.get('/tarjetas/').then(r => setTarjetas(r.data))
  }

  useEffect(() => {
    cargar()
    cargarTarjetas()
    api.get('/inversiones/').then(r => setInversiones(r.data)).finally(() => setInversionesCargando(false))
  }, [])

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 3000)
  }

  const guardarPerfil = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const fd = new FormData()
      const campos = ['nombre', 'apellidos', 'email', 'Nikname', 'telefono', 'direccion', 'iban', 'notif_email', 'notif_telefono']
      campos.forEach(c => { if (form[c] !== undefined) fd.append(c, form[c]) })
      if (fotoRef.current?.files[0]) fd.append('foto', fotoRef.current.files[0])
      await api.patch('/perfil/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      cargar()
      setSeccion(null)
      mostrarMsg('ok', 'Perfil actualizado correctamente')
    } catch {
      mostrarMsg('err', 'Error al guardar los cambios')
    } finally {
      setGuardando(false)
    }
  }

  const cambiarPassword = async (e) => {
    e.preventDefault()
    if (passForm.nueva !== passForm.confirmar) return mostrarMsg('err', '❌ Las contraseñas no coinciden')
    setGuardando(true)
    try {
      await api.post('/perfil/cambiar-password/', { actual: passForm.actual, nueva: passForm.nueva })
      setPassForm({ actual: '', nueva: '', confirmar: '' })
      setSeccion(null)
      mostrarMsg('ok', 'Contraseña cambiada correctamente')
    } catch (err) {
      mostrarMsg('err', err.response?.data?.error || '❌ Error al cambiar la contraseña')
    } finally {
      setGuardando(false)
    }
  }

  const añadirTarjeta = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await api.post('/tarjetas/', tarjetaForm)
      setTarjetaForm({ numero_tarjeta: '', fecha_caducidad: '', nombre_titular: '' })
      setSeccion(null)
      cargarTarjetas()
      mostrarMsg('ok', 'Tarjeta añadida correctamente')
    } catch {
      mostrarMsg('err', 'Error al añadir la tarjeta')
    } finally {
      setGuardando(false)
    }
  }

  const eliminarTarjeta = async (id) => {
    if (!confirm('¿Eliminar esta tarjeta?')) return
    try {
      await api.delete(`/tarjetas/${id}/`)
      cargarTarjetas()
      mostrarMsg('ok', 'Tarjeta eliminada')
    } catch {
      mostrarMsg('err', '❌ Error al eliminar la tarjeta')
    }
  }

  const maskTarjeta = (num) => {
    const limpio = num.replace(/\s/g, '')
    return '**** **** **** ' + limpio.slice(-4)
  }

  const formatFecha = (raw) => {
    if (!raw) return '—'
    const d = new Date(raw)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (loading) return <div style={s.page}><Navbar /><p style={s.cargando}>Cargando perfil...</p></div>

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>

        {msg.texto && (
          <div style={{ ...s.toast, background: msg.tipo === 'ok' ? '#dcfce7' : '#fee2e2', color: msg.tipo === 'ok' ? '#166534' : '#991b1b' }}>
            {msg.texto}
          </div>
        )}

        <div style={s.headerCard}>
          <div style={s.fotoWrap}>
            <div style={s.fotoCirculo}>
              {perfil.foto
                ? <img src={perfil.foto} alt="foto" style={s.fotoImg} />
                : <span style={s.fotoIniciales}>{perfil.nombre?.[0]}{perfil.apellidos?.[0]}</span>
              }
            </div>
            <button style={s.fotoBtn} onClick={() => setSeccion('foto')}>📷</button>
          </div>
          <div style={s.headerInfo}>
            <h1 style={s.nombre}>{perfil.nombre} {perfil.apellidos}</h1>
            <p style={s.nick}>@{perfil.Nikname}</p>
            <div style={s.headerDatos}>
              <span>✉️ {perfil.email}</span>
              <span>📞 {perfil.telefono || '—'}</span>
              <span>📍 {perfil.direccion || '—'}</span>
            </div>
          </div>
          {perfil.verificado && (
            <div style={s.verificadoBadge}>✅ Verificado</div>
          )}
        </div>

        <div style={s.grid}>

          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardIcon}>👤</span>
              <h2 style={s.cardTitulo}>Información personal</h2>
            </div>
            {seccion === 'info' ? (
              <form onSubmit={guardarPerfil} style={s.form}>
                <div style={s.fila}>
                  <div style={s.campo}>
                    <label style={s.label}>Nombre</label>
                    <input style={s.input} value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                  </div>
                  <div style={s.campo}>
                    <label style={s.label}>Apellidos</label>
                    <input style={s.input} value={form.apellidos || ''} onChange={e => setForm({ ...form, apellidos: e.target.value })} />
                  </div>
                </div>
                <div style={s.fila}>
                  <div style={s.campo}>
                    <label style={s.label}>Email</label>
                    <input style={s.input} type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div style={s.campo}>
                    <label style={s.label}>Nickname</label>
                    <input style={s.input} value={form.Nikname || ''} onChange={e => setForm({ ...form, Nikname: e.target.value })} />
                  </div>
                </div>
                <div style={s.fila}>
                  <div style={s.campo}>
                    <label style={s.label}>Teléfono</label>
                    <input style={s.input} value={form.telefono || ''} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                  </div>
                  <div style={s.campo}>
                    <label style={s.label}>Dirección</label>
                    <input style={s.input} value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })} />
                  </div>
                </div>
                <div style={s.botonesForm}>
                  <button type="submit" style={s.btnNaranja} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                  <button type="button" style={s.btnGris} onClick={() => setSeccion(null)}>Cancelar</button>
                </div>
              </form>
            ) : (
              <div style={s.infoLista}>
                <div style={s.infoFila}><span style={s.infoLabel}>Nombre</span><span>{perfil.nombre} {perfil.apellidos}</span></div>
                <div style={s.infoFila}><span style={s.infoLabel}>Email</span><span>{perfil.email}</span></div>
                <div style={s.infoFila}><span style={s.infoLabel}>Nickname</span><span>@{perfil.Nikname}</span></div>
                <div style={s.infoFila}><span style={s.infoLabel}>Teléfono</span><span>{perfil.telefono || '—'}</span></div>
                <div style={s.infoFila}><span style={s.infoLabel}>Dirección</span><span>{perfil.direccion || '—'}</span></div>
                <div style={s.infoFila}><span style={s.infoLabel}>DNI</span><span>{perfil.dni}</span></div>
                <button style={s.btnEditar} onClick={() => setSeccion('info')}>✏️ Editar</button>
              </div>
            )}
          </div>

          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardIcon}>🔒</span>
              <h2 style={s.cardTitulo}>Contraseña</h2>
            </div>
            {seccion === 'pass' ? (
              <form onSubmit={cambiarPassword} style={s.form}>
                <label style={s.label}>Contraseña actual</label>
                <input style={s.input} type="password" value={passForm.actual} onChange={e => setPassForm({ ...passForm, actual: e.target.value })} required />
                <label style={s.label}>Nueva contraseña</label>
                <input style={s.input} type="password" value={passForm.nueva} onChange={e => setPassForm({ ...passForm, nueva: e.target.value })} required />
                <label style={s.label}>Confirmar nueva contraseña</label>
                <input style={s.input} type="password" value={passForm.confirmar} onChange={e => setPassForm({ ...passForm, confirmar: e.target.value })} required />
                <div style={s.botonesForm}>
                  <button type="submit" style={s.btnNaranja} disabled={guardando}>{guardando ? 'Guardando...' : 'Cambiar contraseña'}</button>
                  <button type="button" style={s.btnGris} onClick={() => setSeccion(null)}>Cancelar</button>
                </div>
              </form>
            ) : (
              <div style={s.infoLista}>
                <p style={{ color: '#888', fontSize: '0.9rem' }}>••••••••••••</p>
                <button style={s.btnEditar} onClick={() => setSeccion('pass')}>✏️ Cambiar contraseña</button>
              </div>
            )}
            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '1.2rem 0' }} />
            <div style={s.cardHeader}>
              <span style={s.cardIcon}>🔐</span>
              <h2 style={s.cardTitulo}>Verificación en dos pasos</h2>
            </div>
            <Seguridad2FA otp_activo={perfil.otp_activo} />
          </div>

          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardIcon}>🏦</span>
              <h2 style={s.cardTitulo}>Datos bancarios</h2>
            </div>
            {seccion === 'banco' ? (
              <form onSubmit={guardarPerfil} style={s.form}>
                <label style={s.label}>IBAN</label>
                <input style={s.input} value={form.iban || ''} placeholder="ES00 0000 0000 0000 0000 0000" onChange={e => setForm({ ...form, iban: e.target.value })} />
                <div style={s.botonesForm}>
                  <button type="submit" style={s.btnNaranja} disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                  <button type="button" style={s.btnGris} onClick={() => setSeccion(null)}>Cancelar</button>
                </div>
              </form>
            ) : (
              <div style={s.infoLista}>
                <div style={s.infoFila}>
                  <span style={s.infoLabel}>IBAN</span>
                  <span>{perfil.iban ? '•••• •••• ' + perfil.iban.slice(-4) : '—'}</span>
                </div>
                <button style={s.btnEditar} onClick={() => setSeccion('banco')}>✏️ Editar</button>
              </div>
            )}
          </div>

          <div style={s.card}>
            <div style={s.cardHeader}>
              <span style={s.cardIcon}>🔔</span>
              <h2 style={s.cardTitulo}>Notificaciones</h2>
            </div>
            <div style={s.infoLista}>
              <label style={s.toggleFila}>
                <span>Notificaciones por email</span>
                <input type="checkbox" checked={form.notif_email || false}
                  onChange={async e => {
                    const val = e.target.checked
                    setForm({ ...form, notif_email: val })
                    await api.patch('/perfil/', { notif_email: val })
                    mostrarMsg('ok', '✅ Preferencias guardadas')
                  }}
                />
              </label>
              <label style={s.toggleFila}>
                <span>Notificaciones por teléfono</span>
                <input type="checkbox" checked={form.notif_telefono || false}
                  onChange={async e => {
                    const val = e.target.checked
                    setForm({ ...form, notif_telefono: val })
                    await api.patch('/perfil/', { notif_telefono: val })
                    mostrarMsg('ok', '✅ Preferencias guardadas')
                  }}
                />
              </label>
            </div>
          </div>

          <div style={{ ...s.card, gridColumn: 'span 2' }}>
            <div style={s.cardHeader}>
              <span style={s.cardIcon}>💳</span>
              <h2 style={s.cardTitulo}>Tarjetas</h2>
              <button style={{ ...s.btnNaranja, marginLeft: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => setSeccion(seccion === 'tarjeta' ? null : 'tarjeta')}>
                + Añadir tarjeta
              </button>
            </div>
            {seccion === 'tarjeta' && (
              <form onSubmit={añadirTarjeta} style={{ ...s.form, marginBottom: '1rem' }}>
                <div style={s.fila}>
                  <div style={s.campo}>
                    <label style={s.label}>Número de tarjeta</label>
                    <input style={s.input} value={tarjetaForm.numero_tarjeta} placeholder="1234 5678 9012 3456" onChange={e => setTarjetaForm({ ...tarjetaForm, numero_tarjeta: e.target.value })} required />
                  </div>
                  <div style={s.campo}>
                    <label style={s.label}>Fecha caducidad</label>
                    <input style={s.input} value={tarjetaForm.fecha_caducidad} placeholder="MM/AAAA" onChange={e => setTarjetaForm({ ...tarjetaForm, fecha_caducidad: e.target.value })} required />
                  </div>
                  <div style={s.campo}>
                    <label style={s.label}>Titular</label>
                    <input style={s.input} value={tarjetaForm.nombre_titular} placeholder="Nombre Apellido" onChange={e => setTarjetaForm({ ...tarjetaForm, nombre_titular: e.target.value })} required />
                  </div>
                </div>
                <div style={s.botonesForm}>
                  <button type="submit" style={s.btnNaranja} disabled={guardando}>{guardando ? 'Añadiendo...' : 'Añadir'}</button>
                  <button type="button" style={s.btnGris} onClick={() => setSeccion(null)}>Cancelar</button>
                </div>
              </form>
            )}
            <div style={s.tarjetasGrid}>
              {tarjetas.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: '0.9rem' }}>No tienes tarjetas añadidas</p>
              ) : tarjetas.map(t => (
                <div key={t.id} style={s.tarjetaChip}>
                  <div style={s.tarjetaNumero}>{maskTarjeta(t.numero_tarjeta)}</div>
                  <div style={s.tarjetaInfo}>
                    <span>{t.nombre_titular}</span>
                    <span style={{ color: '#aaa' }}>{t.fecha_caducidad}</span>
                  </div>
                  <button style={s.tarjetaEliminar} onClick={() => eliminarTarjeta(t.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...s.card, gridColumn: 'span 2' }}>
            <div style={s.cardHeader}>
              <span style={s.cardIcon}>📈</span>
              <h2 style={s.cardTitulo}>Mis inversiones</h2>
              <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#888' }}>
                {inversiones.length} inversión{inversiones.length !== 1 ? 'es' : ''}
              </span>
            </div>
            {inversionesCargando ? (
              <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Cargando...</p>
            ) : inversiones.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Aún no has realizado ninguna inversión.</p>
            ) : (
              <>
                <div style={s.invResumen}>
                  <div style={s.invResumenItem}>
                    <span style={s.invResumenLabel}>Total invertido</span>
                    <span style={s.invResumenValor}>{totalInvertido.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div style={s.invResumenItem}>
                    <span style={s.invResumenLabel}>Retorno mensual</span>
                    <span style={{ ...s.invResumenValor, color: '#16a34a' }}>{totalMensual.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                  <div style={s.invResumenItem}>
                    <span style={s.invResumenLabel}>Retorno anual</span>
                    <span style={{ ...s.invResumenValor, color: '#16a34a' }}>{totalAnual.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={s.invTabla}>
                    <thead>
                      <tr>
                        {['Inmueble', 'Cantidad', 'Retorno mensual', 'Retorno anual', 'Fecha', 'Nº transacción', 'Acciones'].map(h => (
                          <th key={h} style={s.invTh}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inversiones.map(inv => (
                        <tr key={inv.id} style={s.invTr}>
                          <td style={s.invTd}>{inv.id_inmueble_nombre || `Inmueble #${inv.id_inmueble}`}</td>
                          <td style={s.invTd}>{Number(inv.cantidad).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                          <td style={{ ...s.invTd, color: '#16a34a', fontWeight: '600' }}>{Number(inv.retorno_mensual).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                          <td style={{ ...s.invTd, color: '#16a34a', fontWeight: '600' }}>{Number(inv.retorno_anual).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                          <td style={{ ...s.invTd, color: '#888' }}>{formatFecha(inv.fecha_inversion || inv.created_at)}</td>
                          <td style={{ ...s.invTd, fontFamily: 'monospace', fontSize: '0.8rem', color: '#aaa' }}>{inv.numero_transaccion || `INV-${String(inv.id).padStart(6, '0')}`}</td>
                          <td style={s.invTd}>
                            <div style={s.invAcciones}>
                              <button
                                style={s.btnAccionVer}
                                onClick={() => navigate(`/propiedades/${inv.id_inmueble}`)}
                                title="Ver vivienda"
                              >
                                🏠 Ver
                              </button>
                              <button
                                style={s.btnAccionChat}
                                onClick={() => navigate(`/chat/${inv.id_inmueble}`)}
                                title="Ir al chat"
                              >
                                💬 Chat
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {seccion === 'foto' && (
            <div style={s.card}>
              <div style={s.cardHeader}>
                <span style={s.cardIcon}>📷</span>
                <h2 style={s.cardTitulo}>Cambiar foto de perfil</h2>
              </div>
              <form onSubmit={guardarPerfil} style={s.form}>
                <input ref={fotoRef} type="file" accept="image/*" />
                <div style={s.botonesForm}>
                  <button type="submit" style={s.btnNaranja} disabled={guardando}>{guardando ? 'Subiendo...' : 'Guardar foto'}</button>
                  <button type="button" style={s.btnGris} onClick={() => setSeccion(null)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

const s = {
  page:            { minHeight: '100vh', background: '#f5f5f0' },
  container:       { maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem 3rem' },
  cargando:        { textAlign: 'center', color: '#aaa', marginTop: '4rem' },
  toast:           { position: 'fixed', top: '1.5rem', right: '1.5rem', padding: '0.8rem 1.4rem', borderRadius: '10px', fontWeight: '600', fontSize: '0.9rem', zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  headerCard:      { background: '#fff', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.07)', flexWrap: 'wrap' },
  fotoWrap:        { position: 'relative', flexShrink: 0 },
  fotoCirculo:     { width: '100px', height: '100px', borderRadius: '50%', background: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fotoImg:         { width: '100%', height: '100%', objectFit: 'cover' },
  fotoIniciales:   { fontSize: '2rem', fontWeight: '700', color: '#F97316' },
  fotoBtn:         { position: 'absolute', bottom: 0, right: 0, background: '#F97316', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerInfo:      { flex: 1 },
  nombre:          { fontSize: '1.5rem', fontWeight: '800', color: '#1a1a1a', margin: 0 },
  nick:            { color: '#F97316', fontWeight: '600', fontSize: '0.9rem', margin: '0.2rem 0 0.6rem' },
  headerDatos:     { display: 'flex', gap: '1.2rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#666' },
  verificadoBadge: { background: '#dcfce7', color: '#16a34a', padding: '0.4rem 1rem', borderRadius: '999px', fontWeight: '700', fontSize: '0.82rem' },
  grid:            { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' },
  card:            { background: '#fff', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.07)' },
  cardHeader:      { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.2rem' },
  cardIcon:        { fontSize: '1.2rem' },
  cardTitulo:      { fontSize: '1rem', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  infoLista:       { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  infoFila:        { display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.4rem' },
  infoLabel:       { color: '#888', fontWeight: '600' },
  form:            { display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  fila:            { display: 'flex', gap: '0.8rem' },
  campo:           { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  label:           { fontSize: '0.78rem', fontWeight: '600', color: '#555' },
  input:           { padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.9rem', outline: 'none', width: '100%' },
  botonesForm:     { display: 'flex', gap: '0.6rem', marginTop: '0.4rem' },
  btnNaranja:      { padding: '0.6rem 1.2rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' },
  btnGris:         { padding: '0.6rem 1.2rem', background: '#f3f4f6', color: '#444', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },
  btnEditar:       { alignSelf: 'flex-start', marginTop: '0.6rem', padding: '0.4rem 0.9rem', background: '#f3f4f6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', color: '#555' },
  toggleFila:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' },
  tarjetasGrid:    { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  tarjetaChip:     { background: '#f9f9f9', borderRadius: '10px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid #eee' },
  tarjetaNumero:   { fontFamily: 'monospace', fontWeight: '700', fontSize: '0.95rem', flex: 1 },
  tarjetaInfo:     { display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: '#555' },
  tarjetaEliminar: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', opacity: 0.6 },
  invResumen:      { display: 'flex', gap: '1.5rem', marginBottom: '1.2rem', flexWrap: 'wrap' },
  invResumenItem:  { display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: '140px' },
  invResumenLabel: { fontSize: '0.78rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
  invResumenValor: { fontSize: '1.3rem', fontWeight: '800', color: '#1a1a1a' },
  invTabla:        { width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' },
  invTh:           { textAlign: 'left', padding: '0.6rem 0.8rem', color: '#888', fontWeight: '600', fontSize: '0.78rem', borderBottom: '2px solid #f3f4f6', whiteSpace: 'nowrap' },
  invTd:           { padding: '0.7rem 0.8rem', borderBottom: '1px solid #f3f4f6', color: '#1a1a1a', verticalAlign: 'middle' },
  invTr:           { transition: 'background 0.15s' },
  invAcciones:     { display: 'flex', gap: '0.4rem' },
  btnAccionVer:    { padding: '0.3rem 0.7rem', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#444', whiteSpace: 'nowrap' },
  btnAccionChat:   { padding: '0.3rem 0.7rem', background: '#fff7ed', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#F97316', whiteSpace: 'nowrap' },
}