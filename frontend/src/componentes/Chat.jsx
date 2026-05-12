// src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import useAuthStore from '../store/authStore.jsx'

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const isAdmin = user?.is_staff || user?.is_superuser

  const [inmueble, setInmueble] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [participantes, setParticipantes] = useState([])
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [conectado, setConectado] = useState(false)
  const [accesoDenegado, setAccesoDenegado] = useState(false)

  const wsRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get(`/inmuebles/${id}/`).then(r => setInmueble(r.data)).catch(() => navigate('/propiedades'))
  }, [id])

  useEffect(() => {
    if (!token) return

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${id}/?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => setConectado(true)

    ws.onclose = (e) => {
      setConectado(false)
      if (e.code === 4003 || e.code === 1000) setAccesoDenegado(true)
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)

      if (data.type === 'historial') {
        setMensajes(data.mensajes)
      } else if (data.type === 'mensaje') {
        setMensajes(prev => [...prev, data.mensaje])
      } else if (data.type === 'participantes') {
        setParticipantes(data.participantes)
      }
    }

    return () => ws.close()
  }, [token, id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const enviarMensaje = (e) => {
    e.preventDefault()
    if (!texto.trim() || !wsRef.current) return
    wsRef.current.send(JSON.stringify({ type: 'mensaje', texto: texto.trim() }))
    setTexto('')
  }

  const toggleBan = (usuarioId, accion) => {
    if (!wsRef.current) return
    wsRef.current.send(JSON.stringify({ type: accion, usuario_id: usuarioId }))
  }

  const participantesFiltrados = participantes.filter(p =>
    p.nick.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (accesoDenegado) return (
    <div style={s.containerModal}>
      <div style={s.denegado}>
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2>Acceso denegado</h2>
        <p>Solo los inversores de este inmueble pueden acceder al chat.</p>
      </div>
    </div>
  )

  return (
    <div style={s.containerModal}>
      {/* Eliminado el div superior "header" con el botón Volver, porque el modal ya tiene cabecera y X para cerrar */}

      <div style={s.body}>
        <div style={s.colMensajes}>
          <div style={s.statusBanner}>
            <span style={{ ...s.dot, background: conectado ? '#16a34a' : '#dc2626' }} />
            <span style={s.estado}>{conectado ? 'Chat en vivo conectado' : 'Desconectado'}</span>
          </div>

          <div style={s.mensajesScroll}>
            {mensajes.length === 0 && (
              <div style={s.empty}>💬 Sé el primero en escribir</div>
            )}
            {mensajes.map((m, i) => {
              const esPropio = m.usuario === user?.Nikname
              return (
                <div key={i} style={{ ...s.msgRow, justifyContent: esPropio ? 'flex-end' : 'flex-start' }}>
                  <div style={{ ...s.bubble, background: esPropio ? '#F97316' : '#f0f0f0', color: esPropio ? '#fff' : '#1a1a1a' }}>
                    {!esPropio && <span style={s.bubbleNick}>@{m.usuario}</span>}
                    <p style={s.bubbleTexto}>{m.texto}</p>
                    <span style={{ ...s.bubbleHora, color: esPropio ? 'rgba(255,255,255,0.7)' : '#888' }}>{m.fecha}</span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={enviarMensaje} style={s.inputRow}>
            <input
              style={s.inputMsg}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={!conectado}
            />
            <button type="submit" style={s.btnEnviar} disabled={!conectado || !texto.trim()}>
              Enviar
            </button>
          </form>
        </div>

        <div style={s.colParticipantes}>
          <div>
            <h3 style={s.partTitulo}>Participantes</h3>
            <input
              style={s.buscador}
              placeholder="🔍 Buscar..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          <div style={s.partLista}>
            {participantesFiltrados.length === 0 && (
              <p style={s.partVacio}>Sin participantes</p>
            )}
            {participantesFiltrados.map(p => (
              <div key={p.id} style={s.partItem}>
                <div style={{...s.partAvatar, opacity: p.baneado ? 0.4 : 1}}>
                  {p.nick.charAt(0).toUpperCase()}
                </div>
                <div style={{...s.partInfo, opacity: p.baneado ? 0.4 : 1}}>
                  <span style={s.partNick}>@{p.nick}</span>
                  {p.baneado && <span style={s.banBadge}>Baneado</span>}
                </div>

                {isAdmin && p.id !== user?.id && (
                  p.baneado ? (
                    <button style={s.btnUnban} onClick={() => toggleBan(p.id, 'unban')}>
                      Desbanear
                    </button>
                  ) : (
                    <button style={s.btnBan} onClick={() => toggleBan(p.id, 'ban')}>
                      Banear
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

const s = {
  // Ajustado para ocupar el 100% de la altura del modal sin márgenes externos
  containerModal: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    background: '#fff'
  },
  statusBanner:   { padding: '0.5rem 1rem', background: '#fafafa', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' },
  dot:            { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px' },
  estado:         { fontSize: '0.75rem', color: '#666', fontWeight: '500' },

  // Eliminamos gap lateral y bordes redondeados porque el modal ya tiene bordes
  body:           { display: 'flex', flex: 1, minHeight: 0 },
  colMensajes:    { flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #eee' },
  mensajesScroll: { flex: 1, overflowY: 'auto', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  empty:          { textAlign: 'center', color: '#bbb', marginTop: '3rem', fontSize: '0.95rem' },
  msgRow:         { display: 'flex' },
  bubble:         { maxWidth: '75%', borderRadius: '12px', padding: '0.6rem 0.9rem' },
  bubbleNick:     { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#F97316', marginBottom: '2px' },
  bubbleTexto:    { margin: 0, fontSize: '0.9rem', lineHeight: '1.4' },
  bubbleHora:     { display: 'block', fontSize: '0.7rem', marginTop: '4px', textAlign: 'right' },

  inputRow:       { display: 'flex', gap: '0.6rem', padding: '0.8rem', borderTop: '1px solid #eee' },
  inputMsg:       { flex: 1, padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none' },
  btnEnviar:      { padding: '0.7rem 1.4rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' },

  colParticipantes: { width: '240px', background: '#fafafa', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' },
  partTitulo:     { fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a', margin: '0 0 0.7rem 0' },
  buscador:       { width: '100%', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },

  partLista:      { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', paddingRight: '5px' },
  partVacio:      { fontSize: '0.82rem', color: '#bbb', textAlign: 'center' },
  partItem:       { display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.3rem' },
  partAvatar:     { width: '32px', height: '32px', borderRadius: '50%', background: '#F97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 },
  partInfo:       { flex: 1, minWidth: 0 },
  partNick:       { fontSize: '0.82rem', fontWeight: '600', color: '#333', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  banBadge:       { fontSize: '0.7rem', color: '#dc2626', fontWeight: '600', display: 'block' },
  btnBan:         { fontSize: '0.72rem', padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 },
  btnUnban:       { fontSize: '0.72rem', padding: '4px 8px', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 },

  denegado:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', height: '100%', color: '#1a1a1a' },
  btnNaranja:     { padding: '0.8rem 1.5rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
}