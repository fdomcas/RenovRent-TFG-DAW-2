import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import useAuthStore from '../store/authStore.jsx'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export default function Chat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const isAdmin = user?.is_staff || user?.is_superuser
  const isMobile = useIsMobile()

  const [inmueble, setInmueble] = useState(null)
  const [mensajes, setMensajes] = useState([])
  const [participantes, setParticipantes] = useState([])
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [conectado, setConectado] = useState(false)
  const [accesoDenegado, setAccesoDenegado] = useState(false)
  const [panelAbierto, setPanelAbierto] = useState(false) // panel participantes en móvil

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
      if (data.type === 'historial') setMensajes(data.mensajes)
      else if (data.type === 'mensaje') setMensajes(prev => [...prev, data.mensaje])
      else if (data.type === 'participantes') setParticipantes(data.participantes)
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


      <div style={s.statusBanner}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <span style={{ ...s.dot, background: conectado ? '#16a34a' : '#dc2626' }} />
          <span style={s.estado}>{conectado ? 'Chat en vivo conectado' : 'Desconectado'}</span>
        </div>

        {isMobile && (
          <button
            style={s.btnParticipantes}
            onClick={() => setPanelAbierto(v => !v)}
          >
            👥 {participantes.length}
          </button>
        )}
      </div>

      <div style={{ ...s.body, position: 'relative' }}>


        <div style={{
          ...s.colMensajes,
          borderRight: isMobile ? 'none' : '1px solid #eee',
        }}>
          <div style={s.mensajesScroll}>
            {mensajes.length === 0 && (
              <div style={s.empty}>💬 Sé el primero en escribir</div>
            )}
            {mensajes.map((m, i) => {
              const esPropio = m.usuario === user?.Nikname
              return (
                <div key={i} style={{ ...s.msgRow, justifyContent: esPropio ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    ...s.bubble,
                    background: esPropio ? '#F97316' : '#f0f0f0',
                    color: esPropio ? '#fff' : '#1a1a1a',
                    maxWidth: isMobile ? '85%' : '75%',
                  }}>
                    {!esPropio && <span style={s.bubbleNick}>@{m.usuario}</span>}
                    <p style={s.bubbleTexto}>{m.texto}</p>
                    <span style={{ ...s.bubbleHora, color: esPropio ? 'rgba(255,255,255,0.7)' : '#888' }}>
                      {m.fecha}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={enviarMensaje} style={{
            ...s.inputRow,
            padding: isMobile ? '0.6rem' : '0.8rem',
            gap: isMobile ? '0.4rem' : '0.6rem',
          }}>
            <input
              style={{
                ...s.inputMsg,
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                padding: isMobile ? '0.6rem 0.8rem' : '0.7rem 1rem',
              }}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Escribe un mensaje..."
              disabled={!conectado}
            />
            <button
              type="submit"
              style={{
                ...s.btnEnviar,
                padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.4rem',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
              }}
              disabled={!conectado || !texto.trim()}
            >
              {isMobile ? '➤' : 'Enviar'}
            </button>
          </form>
        </div>


        {(!isMobile || panelAbierto) && (
          <>

            {isMobile && (
              <div
                style={s.overlay}
                onClick={() => setPanelAbierto(false)}
              />
            )}

            <div style={{
              ...s.colParticipantes,

              ...(isMobile ? {
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '80%',
                maxWidth: '280px',
                zIndex: 10,
                boxShadow: '-4px 0 16px rgba(0,0,0,0.12)',
                borderLeft: '1px solid #eee',
              } : {}),
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                  <h3 style={s.partTitulo}>
                    Participantes ({participantes.length})
                  </h3>
                  {isMobile && (
                    <button
                      style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#666', padding: '0.2rem' }}
                      onClick={() => setPanelAbierto(false)}
                    >
                      ✕
                    </button>
                  )}
                </div>
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
                    <div style={{ ...s.partAvatar, opacity: p.baneado ? 0.4 : 1 }}>
                      {p.nick.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ ...s.partInfo, opacity: p.baneado ? 0.4 : 1 }}>
                      <span style={s.partNick}>@{p.nick}</span>
                      {p.baneado && <span style={s.banBadge}>Baneado</span>}
                    </div>
                    {isAdmin && p.id !== user?.id && (
                      p.baneado ? (
                        <button style={s.btnUnban} onClick={() => toggleBan(p.id, 'unban')}>Desbanear</button>
                      ) : (
                        <button style={s.btnBan} onClick={() => toggleBan(p.id, 'ban')}>Banear</button>
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  containerModal:   { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#fff', overflow: 'hidden' },
  statusBanner:     { padding: '0.5rem 1rem', background: '#fafafa', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', flexShrink: 0 },
  dot:              { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px', flexShrink: 0 },
  estado:           { fontSize: '0.75rem', color: '#666', fontWeight: '500' },
  btnParticipantes: { background: '#f0f0f0', border: '1px solid #ddd', borderRadius: '8px', padding: '0.3rem 0.7rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600', color: '#333' },
  body:             { display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' },
  overlay:          { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 9 },
  colMensajes:      { flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minWidth: 0 },
  mensajesScroll:   { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  empty:            { textAlign: 'center', color: '#bbb', marginTop: '3rem', fontSize: '0.95rem' },
  msgRow:           { display: 'flex' },
  bubble:           { borderRadius: '12px', padding: '0.6rem 0.9rem' },
  bubbleNick:       { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#F97316', marginBottom: '2px' },
  bubbleTexto:      { margin: 0, fontSize: '0.9rem', lineHeight: '1.4', wordBreak: 'break-word' },
  bubbleHora:       { display: 'block', fontSize: '0.7rem', marginTop: '4px', textAlign: 'right' },
  inputRow:         { display: 'flex', borderTop: '1px solid #eee', flexShrink: 0 },
  inputMsg:         { flex: 1, borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontFamily: 'inherit' },
  btnEnviar:        { background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', flexShrink: 0 },
  colParticipantes: { width: '240px', background: '#fafafa', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flexShrink: 0 },
  partTitulo:       { fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  buscador:         { width: '100%', padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
  partLista:        { display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, overflowY: 'auto', paddingRight: '2px' },
  partVacio:        { fontSize: '0.82rem', color: '#bbb', textAlign: 'center' },
  partItem:         { display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.3rem' },
  partAvatar:       { width: '32px', height: '32px', borderRadius: '50%', background: '#F97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 },
  partInfo:         { flex: 1, minWidth: 0 },
  partNick:         { fontSize: '0.82rem', fontWeight: '600', color: '#333', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  banBadge:         { fontSize: '0.7rem', color: '#dc2626', fontWeight: '600', display: 'block' },
  btnBan:           { fontSize: '0.72rem', padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 },
  btnUnban:         { fontSize: '0.72rem', padding: '4px 8px', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 },
  denegado:         { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', height: '100%', color: '#1a1a1a', textAlign: 'center', padding: '2rem' },
}