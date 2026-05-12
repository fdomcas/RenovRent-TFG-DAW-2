import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
import useAuthStore from '../store/authStore.jsx'
import Seguridad2FA from '../componentes/Seguridad2FA.jsx'
import { T, G } from '../theme.js'

const FALLBACK = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80'

export default function Perfil() {
  const { user, setUser } = useAuthStore()
  const navigate = useNavigate()

  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [seccion, setSeccion] = useState(null)
  const [form, setForm] = useState({})
  const [passForm, setPassForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [tarjetas, setTarjetas] = useState([])
  const [tarjetaForm, setTarjetaForm] = useState({
    numero_tarjeta: '',
    fecha_caducidad: '',
    nombre_titular: '',
  })
  const [msg, setMsg] = useState({ tipo: '', texto: '' })
  const [guardando, setGuardando] = useState(false)
  const [inversiones, setInversiones] = useState([])
  const [inversionesCargando, setInversionesCargando] = useState(true)

  const fotoRef = useRef()

  const totalInvertido = inversiones.reduce((s, i) => s + Number(i.cantidad || 0), 0)
  const totalMensual = inversiones.reduce((s, i) => s + Number(i.retorno_mensual || 0), 0)
  const totalAnual = inversiones.reduce((s, i) => s + Number(i.retorno_anual || 0), 0)

  const cargar = () => {
    api.get('/perfil/')
      .then(r => {
        setPerfil(r.data)
        setForm(r.data)
      })
      .finally(() => setLoading(false))
  }

  const cargarTarjetas = () => {
    api.get('/tarjetas/').then(r => setTarjetas(r.data))
  }

  useEffect(() => {
    cargar()
    cargarTarjetas()
    api.get('/inversiones/')
      .then(r => setInversiones(r.data))
      .finally(() => setInversionesCargando(false))
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
      const campos = [
        'nombre',
        'apellidos',
        'email',
        'Nikname',
        'telefono',
        'direccion',
        'iban',
        'notif_email',
        'notif_telefono',
      ]

      campos.forEach(c => {
        if (form[c] !== undefined) fd.append(c, form[c])
      })

      if (fotoRef.current?.files[0]) fd.append('foto', fotoRef.current.files[0])

      await api.patch('/perfil/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

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

    if (passForm.nueva !== passForm.confirmar) {
      return mostrarMsg('err', 'Las contraseñas no coinciden')
    }

    setGuardando(true)

    try {
      await api.post('/perfil/cambiar-password/', {
        actual: passForm.actual,
        nueva: passForm.nueva,
      })

      setPassForm({ actual: '', nueva: '', confirmar: '' })
      setSeccion(null)
      mostrarMsg('ok', 'Contraseña cambiada correctamente')
    } catch (err) {
      mostrarMsg('err', err.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setGuardando(false)
    }
  }

  const añadirTarjeta = async (e) => {
    e.preventDefault()
    setGuardando(true)

    try {
      await api.post('/tarjetas/', tarjetaForm)
      setTarjetaForm({
        numero_tarjeta: '',
        fecha_caducidad: '',
        nombre_titular: '',
      })
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
      mostrarMsg('err', 'Error al eliminar la tarjeta')
    }
  }

  const maskTarjeta = (num = '') => {
    const limpio = num.replace(/\s/g, '')
    return '**** **** **** ' + limpio.slice(-4)
  }

  const formatFecha = (raw) => {
    if (!raw) return '—'
    const d = new Date(raw)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div style={G.page}>
        <Navbar />
        <div style={G.container}>
          <p style={s.info}>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={G.page}>
      <Navbar />

      {msg.texto && (
        <div style={msg.tipo === 'ok' ? s.toastOk : s.toastErr}>
          {msg.texto}
        </div>
      )}

      <div style={G.container}>
        <div style={s.headerRow}>
          <div>
            <span style={G.seccionLabel}>Mi cuenta</span>
            <h1 style={G.h1}>Perfil</h1>
            <p style={s.subtitulo}>
              Gestiona tus datos personales, seguridad, tarjetas e inversiones.
            </p>
          </div>
        </div>

        <div style={s.layout}>
          {/* Sidebar perfil */}
          <aside style={s.sidebar}>
            <div style={s.perfilCard}>
              <div style={s.avatarWrap}>
                <img
                  src={perfil?.foto || FALLBACK}
                  alt={perfil?.nombre || 'Foto de perfil'}
                  style={s.avatar}
                  onError={(e) => { e.target.src = FALLBACK }}
                />
              </div>

              <h2 style={{ ...G.h2, marginBottom: '0.3rem' }}>
                {perfil?.nombre || user?.nombre || 'Usuario'}
              </h2>

              <p style={s.nick}>@{perfil?.Nikname || 'usuario'}</p>

              <div style={s.sideActions}>
                <button style={G.btnPrimario} onClick={() => setSeccion('perfil')}>
                  Editar perfil
                </button>
                <button style={G.btnSecundario} onClick={() => setSeccion('password')}>
                  Cambiar contraseña
                </button>
                <button style={G.btnGhost} onClick={() => setSeccion('tarjeta')}>
                  Añadir tarjeta
                </button>
              </div>
            </div>

            <div style={s.kpisBox}>
              <div style={s.kpiCard}>
                <span style={s.kpiLabel}>Total invertido</span>
                <span style={s.kpiValor}>
                  {totalInvertido.toLocaleString('es-ES')} €
                </span>
              </div>

              <div style={s.kpiCard}>
                <span style={s.kpiLabel}>Retorno mensual</span>
                <span style={{ ...s.kpiValor, color: T.naranja }}>
                  +{totalMensual.toLocaleString('es-ES')} €
                </span>
              </div>

              <div style={s.kpiCard}>
                <span style={s.kpiLabel}>Retorno anual</span>
                <span style={{ ...s.kpiValor, color: T.naranja }}>
                  +{totalAnual.toLocaleString('es-ES')} €
                </span>
              </div>
            </div>
          </aside>

          {/* Contenido principal */}
          <main style={s.main}>
            {/* Datos */}
            <section style={s.sectionCard}>
              <div style={s.sectionHead}>
                <div>
                  <span style={G.seccionLabel}>Información personal</span>
                  <h2 style={G.h2}>Datos de perfil</h2>
                </div>
                <button style={G.btnGhost} onClick={() => setSeccion('perfil')}>
                  Editar
                </button>
              </div>

              <div style={s.infoGrid}>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Nombre</span>
                  <span style={s.infoValue}>{perfil?.nombre || '—'}</span>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Apellidos</span>
                  <span style={s.infoValue}>{perfil?.apellidos || '—'}</span>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Email</span>
                  <span style={s.infoValue}>{perfil?.email || '—'}</span>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Teléfono</span>
                  <span style={s.infoValue}>{perfil?.telefono || '—'}</span>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>Dirección</span>
                  <span style={s.infoValue}>{perfil?.direccion || '—'}</span>
                </div>
                <div style={s.infoItem}>
                  <span style={s.infoLabel}>IBAN</span>
                  <span style={s.infoValue}>{perfil?.iban || '—'}</span>
                </div>
              </div>
            </section>

            {/* Tarjetas */}
            <section style={s.sectionCard}>
              <div style={s.sectionHead}>
                <div>
                  <span style={G.seccionLabel}>Pagos</span>
                  <h2 style={G.h2}>Tarjetas guardadas</h2>
                </div>
                <button style={G.btnGhost} onClick={() => setSeccion('tarjeta')}>
                  Añadir
                </button>
              </div>

              {tarjetas.length === 0 ? (
                <div style={s.empty}>
                  <div style={s.emptyIcon}>💳</div>
                  <p style={s.emptyText}>No tienes tarjetas añadidas.</p>
                </div>
              ) : (
                <div style={s.tarjetasGrid}>
                  {tarjetas.map(t => (
                    <article key={t.id} style={s.tarjetaCard}>
                      <div>
                        <p style={s.tarjetaNumero}>{maskTarjeta(t.numero_tarjeta)}</p>
                        <p style={s.tarjetaMeta}>{t.nombre_titular || 'Titular no indicado'}</p>
                        <p style={s.tarjetaMeta}>Caduca: {t.fecha_caducidad || '—'}</p>
                      </div>
                      <button
                        style={G.btnPeligro}
                        onClick={() => eliminarTarjeta(t.id)}
                      >
                        Eliminar
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* 2FA */}
            <section style={s.sectionCard}>
              <div style={s.sectionHead}>
                <div>
                  <span style={G.seccionLabel}>Seguridad</span>
                  <h2 style={G.h2}>Verificación en dos pasos</h2>
                </div>
              </div>

              <Seguridad2FA />
            </section>

            {/* Inversiones */}
            <section style={s.sectionCard}>
              <div style={s.sectionHead}>
                <div>
                  <span style={G.seccionLabel}>Actividad</span>
                  <h2 style={G.h2}>Historial de inversiones</h2>
                </div>
                <button style={G.btnGhost} onClick={() => navigate('/inversiones')}>
                  Ver todo
                </button>
              </div>

              {inversionesCargando ? (
                <p style={s.info}>Cargando...</p>
              ) : inversiones.length === 0 ? (
                <div style={s.empty}>
                  <div style={s.emptyIcon}>📈</div>
                  <p style={s.emptyText}>Aún no has realizado ninguna inversión.</p>
                </div>
              ) : (
                <div style={s.tableWrap}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        <th style={s.th}>Inmueble</th>
                        <th style={s.th}>Invertido</th>
                        <th style={s.th}>Mensual</th>
                        <th style={s.th}>Anual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inversiones.map((inv, idx) => (
                        <tr key={inv.id || idx}>
                          <td style={s.td}>
                            {inv.id_inmueble_nombre || `Inmueble #${inv.id_inmueble}`}
                          </td>
                          <td style={s.tdNum}>
                            {Number(inv.cantidad || 0).toLocaleString('es-ES')} €
                          </td>
                          <td style={s.tdNum}>
                            +{Number(inv.retorno_mensual || 0).toLocaleString('es-ES')} €
                          </td>
                          <td style={s.tdNum}>
                            +{Number(inv.retorno_anual || 0).toLocaleString('es-ES')} €
                          </td>
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

      {/* Modal editar perfil */}
      {seccion === 'perfil' && (
        <div style={G.overlay} onClick={() => setSeccion(null)}>
          <div style={G.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={G.h2}>Editar perfil</h2>
            <form onSubmit={guardarPerfil} style={s.form}>
              <div style={s.formGrid}>
                <div>
                  <label style={G.label}>Nombre</label>
                  <input
                    style={G.input}
                    value={form.nombre || ''}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>

                <div>
                  <label style={G.label}>Apellidos</label>
                  <input
                    style={G.input}
                    value={form.apellidos || ''}
                    onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                  />
                </div>

                <div>
                  <label style={G.label}>Email</label>
                  <input
                    style={G.input}
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div>
                  <label style={G.label}>Nikname</label>
                  <input
                    style={G.input}
                    value={form.Nikname || ''}
                    onChange={(e) => setForm({ ...form, Nikname: e.target.value })}
                  />
                </div>

                <div>
                  <label style={G.label}>Teléfono</label>
                  <input
                    style={G.input}
                    value={form.telefono || ''}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  />
                </div>

                <div>
                  <label style={G.label}>Dirección</label>
                  <input
                    style={G.input}
                    value={form.direccion || ''}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  />
                </div>

                <div>
                  <label style={G.label}>IBAN</label>
                  <input
                    style={G.input}
                    value={form.iban || ''}
                    onChange={(e) => setForm({ ...form, iban: e.target.value })}
                  />
                </div>

                <div>
                  <label style={G.label}>Foto</label>
                  <input ref={fotoRef} type="file" accept="image/*" style={s.fileInput} />
                </div>
              </div>

              <div style={s.checkboxRow}>
                <label style={s.checkItem}>
                  <input
                    type="checkbox"
                    checked={!!form.notif_email}
                    onChange={(e) => setForm({ ...form, notif_email: e.target.checked })}
                  />
                  <span>Notificaciones por email</span>
                </label>

                <label style={s.checkItem}>
                  <input
                    type="checkbox"
                    checked={!!form.notif_telefono}
                    onChange={(e) => setForm({ ...form, notif_telefono: e.target.checked })}
                  />
                  <span>Notificaciones por teléfono</span>
                </label>
              </div>

              <div style={s.modalActions}>
                <button type="button" style={G.btnGhost} onClick={() => setSeccion(null)}>
                  Cancelar
                </button>
                <button type="submit" style={G.btnPrimario} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal contraseña */}
      {seccion === 'password' && (
        <div style={G.overlay} onClick={() => setSeccion(null)}>
          <div style={G.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={G.h2}>Cambiar contraseña</h2>

            <form onSubmit={cambiarPassword} style={s.form}>
              <div>
                <label style={G.label}>Contraseña actual</label>
                <input
                  type="password"
                  style={G.input}
                  value={passForm.actual}
                  onChange={(e) => setPassForm({ ...passForm, actual: e.target.value })}
                />
              </div>

              <div>
                <label style={G.label}>Nueva contraseña</label>
                <input
                  type="password"
                  style={G.input}
                  value={passForm.nueva}
                  onChange={(e) => setPassForm({ ...passForm, nueva: e.target.value })}
                />
              </div>

              <div>
                <label style={G.label}>Confirmar contraseña</label>
                <input
                  type="password"
                  style={G.input}
                  value={passForm.confirmar}
                  onChange={(e) => setPassForm({ ...passForm, confirmar: e.target.value })}
                />
              </div>

              <div style={s.modalActions}>
                <button type="button" style={G.btnGhost} onClick={() => setSeccion(null)}>
                  Cancelar
                </button>
                <button type="submit" style={G.btnPrimario} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal tarjeta */}
      {seccion === 'tarjeta' && (
        <div style={G.overlay} onClick={() => setSeccion(null)}>
          <div style={G.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={G.h2}>Añadir tarjeta</h2>

            <form onSubmit={añadirTarjeta} style={s.form}>
              <div>
                <label style={G.label}>Número de tarjeta</label>
                <input
                  style={G.input}
                  value={tarjetaForm.numero_tarjeta}
                  onChange={(e) => setTarjetaForm({ ...tarjetaForm, numero_tarjeta: e.target.value })}
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div>
                <label style={G.label}>Fecha de caducidad</label>
                <input
                  style={G.input}
                  value={tarjetaForm.fecha_caducidad}
                  onChange={(e) => setTarjetaForm({ ...tarjetaForm, fecha_caducidad: e.target.value })}
                  placeholder="MM/AA"
                />
              </div>

              <div>
                <label style={G.label}>Nombre del titular</label>
                <input
                  style={G.input}
                  value={tarjetaForm.nombre_titular}
                  onChange={(e) => setTarjetaForm({ ...tarjetaForm, nombre_titular: e.target.value })}
                />
              </div>

              <div style={s.modalActions}>
                <button type="button" style={G.btnGhost} onClick={() => setSeccion(null)}>
                  Cancelar
                </button>
                <button type="submit" style={G.btnPrimario} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Añadir tarjeta'}
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
    marginBottom: '1.5rem',
  },

  subtitulo: {
    color: T.textoMuted,
    fontSize: '0.95rem',
    marginTop: '0.3rem',
  },

  layout: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '1.25rem',
    alignItems: 'start',
  },

  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  perfilCard: {
    background: T.blanco,
    border: `1px solid ${T.borde}`,
    borderRadius: T.radioLg,
    padding: '1.2rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    textAlign: 'center',
  },

  avatarWrap: {
    width: 96,
    height: 96,
    margin: '0 auto 1rem',
    borderRadius: '999px',
    overflow: 'hidden',
    border: `2px solid ${T.borde}`,
    background: T.bg,
  },

  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },

  nick: {
    color: T.textoMuted,
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },

  sideActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },

  kpisBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },

  kpiCard: {
    background: T.blanco,
    border: `1px solid ${T.borde}`,
    borderRadius: T.radioLg,
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },

  kpiLabel: {
    display: 'block',
    fontSize: '0.72rem',
    color: T.textoMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.2rem',
  },

  kpiValor: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: T.texto,
    fontVariantNumeric: 'tabular-nums',
  },

  main: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  sectionCard: {
    background: T.blanco,
    border: `1px solid ${T.borde}`,
    borderRadius: T.radioLg,
    padding: '1.2rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },

  sectionHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },

  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.9rem',
  },

  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.9rem',
    border: `1px solid ${T.borde}`,
    borderRadius: T.radioSm,
    background: T.bg,
  },

  infoLabel: {
    fontSize: '0.72rem',
    color: T.textoMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },

  infoValue: {
    fontSize: '0.95rem',
    color: T.texto,
    wordBreak: 'break-word',
  },

  tarjetasGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '0.9rem',
  },

  tarjetaCard: {
    border: `1px solid ${T.borde}`,
    borderRadius: T.radioLg,
    background: T.bg,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },

  tarjetaNumero: {
    fontSize: '1rem',
    fontWeight: 700,
    color: T.texto,
    margin: 0,
    fontVariantNumeric: 'tabular-nums',
  },

  tarjetaMeta: {
    margin: '0.2rem 0 0',
    color: T.textoMuted,
    fontSize: '0.85rem',
  },

  tableWrap: {
    overflowX: 'auto',
    border: `1px solid ${T.borde}`,
    borderRadius: T.radioLg,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: T.blanco,
  },

  th: {
    textAlign: 'left',
    padding: '0.85rem 1rem',
    fontSize: '0.72rem',
    color: T.textoMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    borderBottom: `1px solid ${T.borde}`,
    background: T.bg,
  },

  td: {
    padding: '0.9rem 1rem',
    borderBottom: `1px solid ${T.borde}`,
    color: T.texto,
    fontSize: '0.92rem',
  },

  tdNum: {
    padding: '0.9rem 1rem',
    borderBottom: `1px solid ${T.borde}`,
    color: T.texto,
    fontSize: '0.92rem',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },

  info: {
    textAlign: 'center',
    color: T.textoMuted,
    padding: '2rem 0',
  },

  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.7rem',
    textAlign: 'center',
    padding: '2rem 1rem',
  },

  emptyIcon: {
    fontSize: '2.2rem',
  },

  emptyText: {
    color: T.textoMuted,
    fontSize: '0.95rem',
    margin: 0,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginTop: '1rem',
  },

  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '0.9rem',
  },

  fileInput: {
    ...G.input,
    padding: '0.65rem 0.8rem',
  },

  checkboxRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.7rem',
  },

  checkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    color: T.texto,
    fontSize: '0.92rem',
  },

  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    flexWrap: 'wrap',
    marginTop: '0.5rem',
  },
}