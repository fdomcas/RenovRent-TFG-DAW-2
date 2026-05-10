// src/pages/Chat.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios.jsx'
import Navbar from '../componentes/Navbar.jsx'
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

  const banearUsuario = (usuarioId) => {
    if (!wsRef.current) return
    wsRef.current.send(JSON.stringify({ type: 'ban', usuario_id: usuarioId }))
  }

  const participantesFiltrados = participantes.filter(p =>
    p.nick.toLowerCase().includes(busqueda.toLowerCase())
  )

  if (accesoDenegado) return (
    <div style={s.page}>
      <Navbar />
      <div style={s.denegado}>
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2>Acceso denegado</h2>
        <p>Solo los inversores de este inmueble pueden acceder al chat.</p>
        <button style={s.btnNaranja} onClick={() => navigate(`/propiedades/${id}`)}>Volver al inmueble</button>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <Navbar />
      <div style={s.container}>


        <div style={s.header}>
          <button style={s.back} onClick={() => navigate(`/propiedades/${id}`)}>← Volver</button>
          <div style={s.headerInfo}>
            <span style={s.headerIcon}>🏠</span>
            <div>
              <h1 style={s.headerTitulo}>{inmueble?.nombre ?? 'Cargando...'}</h1>
              <span style={{ ...s.dot, background: conectado ? '#16a34a' : '#dc2626' }} />
              <span style={s.estado}>{conectado ? 'Conectado' : 'Desconectado'}</span>
            </div>
          </div>
        </div>

        <div style={s.body}>


          <div style={s.colMensajes}>
            <div style={s.mensajesScroll}>
              {mensajes.length === 0 && (
                <div style={s.empty}>💬 Sé el primero en escribir</div>
              )}
              {mensajes.map((m, i) => {
                const esPropio = m.usuario === user?.Nikname
                return (
                  <div key={i} style={{ ...s.msgRow, justifyContent: esPropio ? 'flex-end' : 'flex-start' }}>
                    <div style={{ ...s.bubble, background: esPropio ? '#F97316' : '#fff', color: esPropio ? '#fff' : '#1a1a1a' }}>
                      {!esPropio && <span style={s.bubbleNick}>@{m.usuario}</span>}
                      <p style={s.bubbleTexto}>{m.texto}</p>
                      <span style={{ ...s.bubbleHora, color: esPropio ? 'rgba(255,255,255,0.7)' : '#aaa' }}>{m.fecha}</span>
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
            <h3 style={s.partTitulo}>Participantes</h3>
            <input
              style={s.buscador}
              placeholder="🔍 Buscar..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <div style={s.partLista}>
              {participantesFiltrados.length === 0 && (
                <p style={s.partVacio}>Sin participantes</p>
              )}
              {participantesFiltrados.map(p => (
                <div key={p.id} style={{ ...s.partItem, opacity: p.baneado ? 0.4 : 1 }}>
                  <div style={s.partAvatar}>
                    {p.nick.charAt(0).toUpperCase()}
                  </div>
                  <div style={s.partInfo}>
                    <span style={s.partNick}>@{p.nick}</span>
                    {p.baneado && <span style={s.banBadge}>Baneado</span>}
                  </div>
                  {isAdmin && !p.baneado && p.id !== user?.id && (
                    <button style={s.btnBan} onClick={() => banearUsuario(p.id)}>
                      Banear
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

const s = {
  page:           { minHeight: '100vh', background: '#f5f5f0' },
  container:      { maxWidth: '1100px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' },
  header:         { background: '#fff', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  back:           { background: 'none', border: 'none', color: '#F97316', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', padding: 0 },
  headerInfo:     { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  headerIcon:     { fontSize: '1.5rem' },
  headerTitulo:   { fontSize: '1.1rem', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  dot:            { display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', marginRight: '5px' },
  estado:         { fontSize: '0.8rem', color: '#888' },
  body:           { display: 'flex', gap: '1rem', flex: 1, minHeight: 0 },
  colMensajes:    { flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  mensajesScroll: { flex: 1, overflowY: 'auto', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  empty:          { textAlign: 'center', color: '#bbb', marginTop: '3rem', fontSize: '0.95rem' },
  msgRow:         { display: 'flex' },
  bubble:         { maxWidth: '65%', borderRadius: '12px', padding: '0.6rem 0.9rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  bubbleNick:     { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#F97316', marginBottom: '2px' },
  bubbleTexto:    { margin: 0, fontSize: '0.9rem', lineHeight: '1.4' },
  bubbleHora:     { display: 'block', fontSize: '0.7rem', marginTop: '4px', textAlign: 'right' },
  inputRow:       { display: 'flex', gap: '0.6rem', padding: '0.8rem', borderTop: '1px solid #f0f0f0' },
  inputMsg:       { flex: 1, padding: '0.7rem 1rem', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.9rem', outline: 'none' },
  btnEnviar:      { padding: '0.7rem 1.4rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' },
  colParticipantes: { width: '220px', background: '#fff', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflowY: 'auto' },
  partTitulo:     { fontSize: '0.85rem', fontWeight: '700', color: '#1a1a1a', margin: 0 },
  buscador:       { padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '0.85rem', outline: 'none' },
  partLista:      { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  partVacio:      { fontSize: '0.82rem', color: '#bbb', textAlign: 'center' },
  partItem:       { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  partAvatar:     { width: '32px', height: '32px', borderRadius: '50%', background: '#F97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 },
  partInfo:       { flex: 1, minWidth: 0 },
  partNick:       { fontSize: '0.82rem', fontWeight: '600', color: '#333', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  banBadge:       { fontSize: '0.7rem', color: '#dc2626', fontWeight: '600' },
  btnBan:         { fontSize: '0.72rem', padding: '2px 7px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: '600', flexShrink: 0 },
  denegado:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', height: 'calc(100vh - 64px)', color: '#1a1a1a' },
  btnNaranja:     { padding: '0.8rem 1.5rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
}