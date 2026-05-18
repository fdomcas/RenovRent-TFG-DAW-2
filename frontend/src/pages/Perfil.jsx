import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import useAuthStore from '../store/authStore.jsx'
import Seguridad2FA from '../componentes/Seguridad2FA.jsx'
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

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80'

export default function Perfil() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

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

  const totalInvertido = inversiones.reduce((s, i) => s + Number(i.cantidad || 0), 0)
  const totalMensual = inversiones.reduce((s, i) => s + Number(i.retorno_mensual || 0), 0)
  const totalAnual = inversiones.reduce((s, i) => s + Number(i.retorno_anual || 0), 0)

  const cargar = () => {
    api.get('/perfil/').then(r => { setPerfil(r.data); setForm(r.data) }).finally(() => setLoading(false))
  }
  const cargarTarjetas = () => { api.get('/tarjetas/').then(r => setTarjetas(r.data)) }

  useEffect(() => {
    cargar(); cargarTarjetas()
    api.get('/inversiones/').then(r => setInversiones(r.data)).finally(() => setInversionesCargando(false))
  }, [])

  const mostrarMsg = (tipo, texto) => {
    setMsg({ tipo, texto })
    setTimeout(() => setMsg({ tipo: '', texto: '' }), 3000)
  }

  const guardarPerfil = async (e) => {
    e.preventDefault(); setGuardando(true)
    try {
      const fd = new FormData()
      const campos = ['nombre', 'apellidos', 'email', 'Nikname', 'telefono', 'direccion', 'iban', 'notif_email', 'notif_telefono']
      campos.forEach(c => { if (form[c] !== undefined) fd.append(c, form[c]) })
      if (fotoRef.current?.files[0]) fd.append('foto', fotoRef.current.files[0])
      await api.patch('/perfil/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      cargar(); setSeccion(null); mostrarMsg('ok', 'Perfil actualizado correctamente')
    } catch { mostrarMsg('err', 'Error al guardar los cambios') }
    finally { setGuardando(false) }
  }

  const cambiarPassword = async (e) => {
    e.preventDefault()
    if (passForm.nueva !== passForm.confirmar) return mostrarMsg('err', 'Las contraseñas no coinciden')
    setGuardando(true)
    try {
      await api.post('/perfil/cambiar-password/', { actual: passForm.actual, nueva: passForm.nueva })
      setPassForm({ actual: '', nueva: '', confirmar: '' }); setSeccion(null)
      mostrarMsg('ok', 'Contraseña cambiada correctamente')
    } catch (err) { mostrarMsg('err', err.response?.data?.error || 'Error al cambiar la contraseña') }
    finally { setGuardando(false) }
  }

  const añadirTarjeta = async (e) => {
    e.preventDefault(); setGuardando(true)
    try {
      await api.post('/tarjetas/', tarjetaForm)
      setTarjetaForm({ numero_tarjeta: '', fecha_caducidad: '', nombre_titular: '' })
      setSeccion(null); cargarTarjetas(); mostrarMsg('ok', 'Tarjeta añadida correctamente')
    } catch { mostrarMsg('err', 'Error al añadir la tarjeta') }
    finally { setGuardando(false) }
  }

  const eliminarTarjeta = async (id) => {
    if (!confirm('¿Eliminar esta tarjeta?')) return
    try { await api.delete(`/tarjetas/${id}/`); cargarTarjetas(); mostrarMsg('ok', 'Tarjeta eliminada') }
    catch { mostrarMsg('err', 'Error al eliminar la tarjeta') }
  }

  const maskTarjeta = (num = '') => '**** **** **** ' + num.replace(/\s/g, '').slice(-4)

  if (loading) return (
    <div style={G.page}><Navbar />
      <div style={G.container}><p style={s.info}>Cargando perfil...</p></div>
    </div>
  )


  const KpisRow = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : '1fr',
      gap: isMobile ? '0.5rem' : '0.8rem',
    }}>
      {[
        { label: 'Total invertido', valor: `${totalInvertido.toLocaleString('es-ES')} €`, color: T.texto },
        { label: 'Retorno mensual', valor: `+${totalMensual.toLocaleString('es-ES')} €`, color: T.naranja },
        { label: 'Retorno anual',   valor: `+${totalAnual.toLocaleString('es-ES')} €`,   color: T.naranja },
      ].map(({ label, valor, color }) => (
        <div key={label} style={{
          ...s.kpiCard,
          padding: isMobile ? '0.6rem 0.5rem' : '1rem',
          textAlign: isMobile ? 'center' : 'left',
        }}>
          <span style={{ ...s.kpiLabel, fontSize: isMobile ? '0.65rem' : '0.72rem' }}>{label}</span>
          <span style={{ ...s.kpiValor, fontSize: isMobile ? '0.85rem' : '1.1rem', color }}>{valor}</span>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ ...G.page, overflowX: 'hidden' }}>
      <Navbar />

      {msg.texto && (
        <div style={{
          ...(msg.tipo === 'ok' ? s.toastOk : s.toastErr),
          right: isMobile ? '0.75rem' : '1.25rem',
          left: isMobile ? '0.75rem' : 'auto',
          maxWidth: isMobile ? 'calc(100% - 1.5rem)' : '320px',
        }}>
          {msg.texto}
        </div>
      )}

      <div style={{ ...G.container, padding: isMobile ? '1rem' : undefined }}>
        <div style={s.headerRow}>
          <span style={G.seccionLabel}>Mi cuenta</span>
          <h1 style={G.h1}>Perfil</h1>
          <p style={s.subtitulo}>Gestiona tus datos personales, seguridad, tarjetas e inversiones.</p>
        </div>

        <div style={{
          ...s.layout,
          gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
          gap: isMobile ? '1rem' : '1.25rem',
        }}>


          <aside style={s.sidebar}>
            <div style={{
              ...s.perfilCard,
              display: isMobile ? 'grid' : 'flex',
              gridTemplateColumns: isMobile ? 'auto 1fr' : undefined,
              flexDirection: isMobile ? undefined : 'column',
              alignItems: isMobile ? 'center' : 'center',
              textAlign: isMobile ? 'left' : 'center',
              gap: isMobile ? '1rem' : undefined,
            }}>
              <div style={{
                ...s.avatarWrap,
                margin: isMobile ? '0' : '0 auto 1rem',
                flexShrink: 0,
              }}>
                <img src={perfil?.foto || FALLBACK} alt={perfil?.nombre || 'Foto'}
                  style={s.avatar} onError={e => { e.target.src = FALLBACK }} />
              </div>

              <div style={{ flex: 1 }}>
                <h2 style={{ ...G.h2, marginBottom: '0.2rem', fontSize: isMobile ? '1rem' : undefined }}>
                  {perfil?.nombre || user?.nombre || 'Usuario'}
                </h2>
                <p style={{ ...s.nick, marginBottom: isMobile ? '0.75rem' : '1rem' }}>
                  @{perfil?.Nikname || 'usuario'}
                </p>

                <div style={{
                  ...s.sideActions,
                  flexDirection: isMobile ? 'row' : 'column',
                  flexWrap: isMobile ? 'wrap' : undefined,
                  gap: isMobile ? '0.5rem' : '0.65rem',
                }}>
                  <button style={{ ...G.btnPrimario, flex: isMobile ? '1 1 auto' : undefined, fontSize: isMobile ? '0.8rem' : undefined, padding: isMobile ? '0.5rem 0.8rem' : undefined }}
                    onClick={() => setSeccion('perfil')}>Editar perfil</button>
                  <button style={{ ...G.btnSecundario, flex: isMobile ? '1 1 auto' : undefined, fontSize: isMobile ? '0.8rem' : undefined, padding: isMobile ? '0.5rem 0.8rem' : undefined }}
                    onClick={() => setSeccion('password')}>Cambiar contraseña</button>
                  <button style={{ ...G.btnGhost, flex: isMobile ? '1 1 auto' : undefined, fontSize: isMobile ? '0.8rem' : undefined, padding: isMobile ? '0.5rem 0.8rem' : undefined }}
                    onClick={() => setSeccion('tarjeta')}>Añadir tarjeta</button>
                </div>
              </div>
            </div>

            <KpisRow />
          </aside>


          <main style={s.main}>


            <section style={{ ...s.sectionCard, padding: isMobile ? '1rem' : '1.2rem' }}>
              <div style={s.sectionHead}>
                <div><span style={G.seccionLabel}>Información personal</span><h2 style={G.h2}>Datos de perfil</h2></div>
                <button style={G.btnGhost} onClick={() => setSeccion('perfil')}>Editar</button>
              </div>
              <div style={{ ...s.infoGrid, gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {[
                  ['Nombre', perfil?.nombre], ['Apellidos', perfil?.apellidos],
                  ['Email', perfil?.email], ['Teléfono', perfil?.telefono],
                  ['Dirección', perfil?.direccion], ['IBAN', perfil?.iban],
                ].map(([label, val]) => (
                  <div key={label} style={s.infoItem}>
                    <span style={s.infoLabel}>{label}</span>
                    <span style={s.infoValue}>{val || '—'}</span>
                  </div>
                ))}
              </div>
            </section>


            <section style={{ ...s.sectionCard, padding: isMobile ? '1rem' : '1.2rem' }}>
              <div style={s.sectionHead}>
                <div><span style={G.seccionLabel}>Pagos</span><h2 style={G.h2}>Tarjetas guardadas</h2></div>
                <button style={G.btnGhost} onClick={() => setSeccion('tarjeta')}>Añadir</button>
              </div>
              {tarjetas.length === 0 ? (
                <div style={s.empty}><div style={s.emptyIcon}>💳</div><p style={s.emptyText}>No tienes tarjetas añadidas.</p></div>
              ) : (
                <div style={{ ...s.tarjetasGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                  {tarjetas.map(t => (
                    <article key={t.id} style={s.tarjetaCard}>
                      <div>
                        <p style={s.tarjetaNumero}>{maskTarjeta(t.numero_tarjeta)}</p>
                        <p style={s.tarjetaMeta}>{t.nombre_titular || 'Titular no indicado'}</p>
                        <p style={s.tarjetaMeta}>Caduca: {t.fecha_caducidad || '—'}</p>
                      </div>
                      <button style={G.btnPeligro} onClick={() => eliminarTarjeta(t.id)}>Eliminar</button>
                    </article>
                  ))}
                </div>
              )}
            </section>


            <section style={{ ...s.sectionCard, padding: isMobile ? '1rem' : '1.2rem' }}>
              <div style={s.sectionHead}>
                <div><span style={G.seccionLabel}>Seguridad</span><h2 style={G.h2}>Verificación en dos pasos</h2></div>
              </div>
              <Seguridad2FA />
            </section>

            <section style={{ ...s.sectionCard, padding: isMobile ? '1rem' : '1.2rem' }}>
              <div style={s.sectionHead}>
                <div><span style={G.seccionLabel}>Actividad</span><h2 style={G.h2}>Historial de inversiones</h2></div>
                <button style={G.btnGhost} onClick={() => navigate('/inversiones')}>Ver todo</button>
              </div>
              {inversionesCargando ? (
                <p style={s.info}>Cargando...</p>
              ) : inversiones.length === 0 ? (
                <div style={s.empty}><div style={s.emptyIcon}>📈</div><p style={s.emptyText}>Aún no has realizado ninguna inversión.</p></div>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Inmueble</th>
                        <th style={s.th}>Invertido</th>
                        {!isMobile && <th style={s.th}>Mensual</th>}
                        <th style={s.th}>Anual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inversiones.map((inv, idx) => (
                        <tr key={inv.id || idx}>
                          <td style={s.td}>{inv.id_inmueble_nombre || `Inmueble #${inv.id_inmueble}`}</td>
                          <td style={s.tdNum}>{Number(inv.cantidad || 0).toLocaleString('es-ES')} €</td>
                          {!isMobile && <td style={s.tdNum}>+{Number(inv.retorno_mensual || 0).toLocaleString('es-ES')} €</td>}
                          <td style={s.tdNum}>+{Number(inv.retorno_anual || 0).toLocaleString('es-ES')} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {seccion === 'perfil' && (
        <div style={G.overlay} onClick={() => setSeccion(null)}>
          <div style={{
            ...G.modal,
            width: isMobile ? '100%' : undefined,
            maxWidth: isMobile ? '100%' : undefined,
            maxHeight: isMobile ? '92vh' : '90vh',
            borderRadius: isMobile ? '16px 16px 0 0' : undefined,
            marginTop: isMobile ? 'auto' : 0,
            overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={G.h2}>Editar perfil</h2>
            <form onSubmit={guardarPerfil} style={s.form}>
              <div style={{ ...s.formGrid, gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {[
                  ['nombre', 'Nombre', 'text'], ['apellidos', 'Apellidos', 'text'],
                  ['email', 'Email', 'email'], ['Nikname', 'Nikname', 'text'],
                  ['telefono', 'Teléfono', 'text'], ['direccion', 'Dirección', 'text'],
                  ['iban', 'IBAN', 'text'],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label style={G.label}>{label}</label>
                    <input style={G.input} type={type} value={form[key] || ''}
                      onChange={e => setForm({ ...form, [key]: e.target.value })} />
                  </div>
                ))}
                <div>
                  <label style={G.label}>Foto</label>
                  <input ref={fotoRef} type="file" accept="image/*" style={s.fileInput} />
                </div>
              </div>
              <div style={s.checkboxRow}>
                <label style={s.checkItem}>
                  <input type="checkbox" checked={!!form.notif_email}
                    onChange={e => setForm({ ...form, notif_email: e.target.checked })} />
                  <span>Notificaciones por email</span>
                </label>
                <label style={s.checkItem}>
                  <input type="checkbox" checked={!!form.notif_telefono}
                    onChange={e => setForm({ ...form, notif_telefono: e.target.checked })} />
                  <span>Notificaciones por teléfono</span>
                </label>
              </div>
              <div style={{ ...s.modalActions, flexDirection: isMobile ? 'column' : 'row' }}>
                <button type="button" style={{ ...G.btnGhost, width: isMobile ? '100%' : undefined }}
                  onClick={() => setSeccion(null)}>Cancelar</button>
                <button type="submit" style={{ ...G.btnPrimario, width: isMobile ? '100%' : undefined }}
                  disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {seccion === 'password' && (
        <div style={G.overlay} onClick={() => setSeccion(null)}>
          <div style={{
            ...G.modal,
            width: isMobile ? '100%' : undefined,
            maxHeight: isMobile ? '92vh' : '90vh',
            borderRadius: isMobile ? '16px 16px 0 0' : undefined,
            marginTop: isMobile ? 'auto' : 0,
            overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={G.h2}>Cambiar contraseña</h2>
            <form onSubmit={cambiarPassword} style={s.form}>
              {[['actual', 'Contraseña actual'], ['nueva', 'Nueva contraseña'], ['confirmar', 'Confirmar contraseña']].map(([key, label]) => (
                <div key={key}>
                  <label style={G.label}>{label}</label>
                  <input type="password" style={G.input} value={passForm[key]}
                    onChange={e => setPassForm({ ...passForm, [key]: e.target.value })} />
                </div>
              ))}
              <div style={{ ...s.modalActions, flexDirection: isMobile ? 'column' : 'row' }}>
                <button type="button" style={{ ...G.btnGhost, width: isMobile ? '100%' : undefined }}
                  onClick={() => setSeccion(null)}>Cancelar</button>
                <button type="submit" style={{ ...G.btnPrimario, width: isMobile ? '100%' : undefined }}
                  disabled={guardando}>{guardando ? 'Guardando...' : 'Cambiar contraseña'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {seccion === 'tarjeta' && (
        <div style={G.overlay} onClick={() => setSeccion(null)}>
          <div style={{
            ...G.modal,
            width: isMobile ? '100%' : undefined,
            maxHeight: isMobile ? '92vh' : '90vh',
            borderRadius: isMobile ? '16px 16px 0 0' : undefined,
            marginTop: isMobile ? 'auto' : 0,
            overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={G.h2}>Añadir tarjeta</h2>
            <form onSubmit={añadirTarjeta} style={s.form}>
              {[
                ['numero_tarjeta', 'Número de tarjeta', '1234 5678 9012 3456'],
                ['fecha_caducidad', 'Fecha de caducidad', 'MM/AA'],
                ['nombre_titular', 'Nombre del titular', ''],
              ].map(([key, label, placeholder]) => (
                <div key={key}>
                  <label style={G.label}>{label}</label>
                  <input style={G.input} placeholder={placeholder} value={tarjetaForm[key]}
                    onChange={e => setTarjetaForm({ ...tarjetaForm, [key]: e.target.value })} />
                </div>
              ))}
              <div style={{ ...s.modalActions, flexDirection: isMobile ? 'column' : 'row' }}>
                <button type="button" style={{ ...G.btnGhost, width: isMobile ? '100%' : undefined }}
                  onClick={() => setSeccion(null)}>Cancelar</button>
                <button type="submit" style={{ ...G.btnPrimario, width: isMobile ? '100%' : undefined }}
                  disabled={guardando}>{guardando ? 'Guardando...' : 'Añadir tarjeta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  toastOk:  { ...G.toastOk,  position: 'fixed', top: '1.25rem', zIndex: 9999 },
  toastErr: { ...G.toastErr, position: 'fixed', top: '1.25rem', zIndex: 9999 },
  headerRow:    { marginBottom: '1.5rem' },
  subtitulo:    { color: T.textoMuted, fontSize: '0.95rem', marginTop: '0.3rem' },
  layout:       { display: 'grid', alignItems: 'start' },
  sidebar:      { display: 'flex', flexDirection: 'column', gap: '1rem' },
  perfilCard:   { background: T.blanco, border: `1px solid ${T.borde}`, borderRadius: T.radioLg, padding: '1.2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  avatarWrap:   { width: 80, height: 80, borderRadius: '999px', overflow: 'hidden', border: `2px solid ${T.borde}`, background: T.bg, flexShrink: 0 },
  avatar:       { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  nick:         { color: T.textoMuted, fontSize: '0.9rem' },
  sideActions:  { display: 'flex' },
  kpisBox:      { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  kpiCard:      { background: T.blanco, border: `1px solid ${T.borde}`, borderRadius: T.radioLg, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  kpiLabel:     { display: 'block', color: T.textoMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' },
  kpiValor:     { fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  main:         { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sectionCard:  { background: T.blanco, border: `1px solid ${T.borde}`, borderRadius: T.radioLg, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  sectionHead:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' },
  infoGrid:     { display: 'grid', gap: '0.9rem' },
  infoItem:     { display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.9rem', border: `1px solid ${T.borde}`, borderRadius: T.radioSm, background: T.bg },
  infoLabel:    { fontSize: '0.72rem', color: T.textoMuted, textTransform: 'uppercase', letterSpacing: '0.05em' },
  infoValue:    { fontSize: '0.95rem', color: T.texto, wordBreak: 'break-word' },
  tarjetasGrid: { display: 'grid', gap: '0.9rem' },
  tarjetaCard:  { border: `1px solid ${T.borde}`, borderRadius: T.radioLg, background: T.bg, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  tarjetaNumero:{ fontSize: '1rem', fontWeight: 700, color: T.texto, margin: 0, fontVariantNumeric: 'tabular-nums' },
  tarjetaMeta:  { margin: '0.2rem 0 0', color: T.textoMuted, fontSize: '0.85rem' },
  tableWrap:    { overflowX: 'auto', border: `1px solid ${T.borde}`, borderRadius: T.radioLg },
  table:        { width: '100%', borderCollapse: 'collapse', background: T.blanco },
  th:           { textAlign: 'left', padding: '0.85rem 1rem', fontSize: '0.72rem', color: T.textoMuted, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.borde}`, background: T.bg },
  td:           { padding: '0.9rem 1rem', borderBottom: `1px solid ${T.borde}`, color: T.texto, fontSize: '0.92rem' },
  tdNum:        { padding: '0.9rem 1rem', borderBottom: `1px solid ${T.borde}`, color: T.texto, fontSize: '0.92rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  info:         { textAlign: 'center', color: T.textoMuted, padding: '2rem 0' },
  empty:        { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem', textAlign: 'center', padding: '2rem 1rem' },
  emptyIcon:    { fontSize: '2.2rem' },
  emptyText:    { color: T.textoMuted, fontSize: '0.95rem', margin: 0 },
  form:         { display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' },
  formGrid:     { display: 'grid', gap: '0.9rem' },
  fileInput:    { ...G.input, padding: '0.65rem 0.8rem' },
  checkboxRow:  { display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  checkItem:    { display: 'flex', alignItems: 'center', gap: '0.6rem', color: T.texto, fontSize: '0.92rem' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' },
}