import { useState } from 'react'
import api from '../api/axios.jsx'

export default function Seguridad2FA({ otp_activo }) {
  const [qr, setQr]         = useState(null)
  const [secret, setSecret] = useState('')
  const [codigo, setCodigo] = useState('')
  const [step, setStep]     = useState('idle') // idle | qr
  const [activo, setActivo] = useState(otp_activo)
  const [error, setError]   = useState('')

  const handleActivar = async () => {
    const res = await api.post('/2fa/activar/')
    setQr(res.data.qr)
    setSecret(res.data.secret)
    setStep('qr')
  }

  const handleConfirmar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/2fa/confirmar/', { codigo })
      setActivo(true)
      setStep('idle')
      setQr(null)
    } catch {
      setError('Código incorrecto, inténtalo de nuevo')
    }
  }

  const handleDesactivar = async () => {
    if (!confirm('¿Seguro que quieres desactivar el 2FA?')) return
    await api.post('/2fa/desactivar/')
    setActivo(false)
    setStep('idle')
  }


  if (activo) return (
    <div style={s.wrap}>
      <div style={s.estadoBadge}>✅ Activado</div>
      <p style={s.desc}>Tu cuenta está protegida con Google Authenticator.</p>
      <button style={s.btnRojo} onClick={handleDesactivar}>
        Desactivar 2FA
      </button>
    </div>
  )


  if (step === 'qr') return (
    <div style={s.wrap}>
      <p style={s.paso}><strong>Paso 1.</strong> Escanea este QR con Google Authenticator:</p>
      <div style={s.qrWrap}>
        <img src={qr} alt="QR 2FA" width={180} height={180} />
      </div>
      <p style={s.secretLabel}>¿No puedes escanear? Usa este código:</p>
      <code style={s.secret}>{secret}</code>

      <p style={{ ...s.paso, marginTop: '1rem' }}><strong>Paso 2.</strong> Introduce el código de 6 dígitos:</p>
      <form onSubmit={handleConfirmar} style={s.form}>
        <input
          style={s.inputOtp}
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          autoFocus
        />
        {error && <p style={s.error}>{error}</p>}
        <div style={s.botones}>
          <button type="submit" style={s.btnNaranja}>Verificar y activar</button>
          <button type="button" style={s.btnGris} onClick={() => { setStep('idle'); setCodigo(''); setError('') }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )


  return (
    <div style={s.wrap}>
      <div style={s.estadoBadge2}>⚠️ No activado</div>
      <p style={s.desc}>Añade una capa extra de seguridad con Google Authenticator.</p>
      <button style={s.btnNaranja} onClick={handleActivar}>
        Activar 2FA
      </button>
    </div>
  )
}

const s = {
  wrap:         { display: 'flex', flexDirection: 'column', gap: '0.7rem' },
  estadoBadge:  { display: 'inline-block', background: '#dcfce7', color: '#16a34a', padding: '0.3rem 0.8rem', borderRadius: '999px', fontWeight: '700', fontSize: '0.82rem', width: 'fit-content' },
  estadoBadge2: { display: 'inline-block', background: '#fef9c3', color: '#854d0e', padding: '0.3rem 0.8rem', borderRadius: '999px', fontWeight: '700', fontSize: '0.82rem', width: 'fit-content' },
  desc:         { color: '#666', fontSize: '0.88rem' },
  paso:         { fontSize: '0.88rem', color: '#444' },
  qrWrap:       { background: '#f9f9f9', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'center', border: '1px solid #eee' },
  secretLabel:  { fontSize: '0.8rem', color: '#888', marginTop: '0.3rem' },
  secret:       { background: '#f3f4f6', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', letterSpacing: '0.05rem', wordBreak: 'break-all' },
  form:         { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  inputOtp:     { padding: '0.7rem', borderRadius: '8px', border: '1.5px solid #e0e0e0', fontSize: '1.4rem', textAlign: 'center', letterSpacing: '0.4rem', outline: 'none', width: '100%' },
  error:        { color: '#e53e3e', fontSize: '0.85rem', background: '#fff5f5', padding: '0.4rem 0.8rem', borderRadius: '6px' },
  botones:      { display: 'flex', gap: '0.6rem' },
  btnNaranja:   { padding: '0.6rem 1.2rem', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' },
  btnGris:      { padding: '0.6rem 1.2rem', background: '#f3f4f6', color: '#444', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },
  btnRojo:      { padding: '0.6rem 1.2rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', width: 'fit-content' },
}