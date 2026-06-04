import { useState, useEffect, useRef } from 'react'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['D','S','T','Q','Q','S','S']

function dateOf(y, m, d) { return new Date(y, m, d) }
function sameDay(a, b) { return a && b && a.getTime() === b.getTime() }
function fmtBR(d) { return d ? d.toLocaleDateString('pt-BR') : '' }
function startOfMonth(y, m) { return new Date(y, m, 1) }
function endOfMonth(y, m) { return new Date(y, m + 1, 0) }

const hoje = new Date()
const todayFlat = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

const ATALHOS = [
  { label: 'Hoje',          fn: () => { const d = new Date(todayFlat); return [d, d] } },
  { label: 'Ontem',        fn: () => { const d = new Date(todayFlat); d.setDate(d.getDate() - 1); return [d, d] } },
  { label: 'Últimos 7 dias', fn: () => { const e = new Date(todayFlat), s = new Date(todayFlat); s.setDate(s.getDate() - 6); return [s, e] } },
  { label: 'Últimos 30 dias', fn: () => { const e = new Date(todayFlat), s = new Date(todayFlat); s.setDate(s.getDate() - 29); return [s, e] } },
  { label: 'Mês atual',    fn: () => [startOfMonth(todayFlat.getFullYear(), todayFlat.getMonth()), endOfMonth(todayFlat.getFullYear(), todayFlat.getMonth())] },
  { label: 'Mês anterior', fn: () => { let m = todayFlat.getMonth() - 1, y = todayFlat.getFullYear(); if (m < 0) { m = 11; y-- } return [startOfMonth(y, m), endOfMonth(y, m)] } },
  { label: 'Este ano',     fn: () => [new Date(todayFlat.getFullYear(), 0, 1), new Date(todayFlat.getFullYear(), 11, 31)] },
]

// ── Calendário individual ─────────────────────────────────────────────────────
function Calendario({ ano, mes, selStart, selEnd, hoverDate, onPickDay, onHoverDay, onPrev, onNext, showPrev, showNext }) {
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes + 1, 0).getDate()

  const getDayCls = (d) => {
    const date = dateOf(ano, mes, d)
    const t = date.getTime()
    const isToday = sameDay(date, todayFlat)
    const isStart = sameDay(date, selStart)
    const isEnd = sameDay(date, selEnd)

    // Range efetivo para highlight (considera hover se não tem fim)
    const rangeEnd = selEnd || hoverDate
    const inRange = selStart && rangeEnd &&
      t > Math.min(selStart.getTime(), rangeEnd.getTime()) &&
      t < Math.max(selStart.getTime(), rangeEnd.getTime())

    const effectiveStart = selStart && rangeEnd && selStart <= rangeEnd ? selStart : rangeEnd
    const effectiveEnd = selStart && rangeEnd && selStart <= rangeEnd ? rangeEnd : selStart
    const isEffStart = effectiveStart && sameDay(date, effectiveStart)
    const isEffEnd = effectiveEnd && sameDay(date, effectiveEnd)

    let cls = 'flex items-center justify-center text-xs cursor-pointer rounded transition-all duration-100 select-none '
    cls += 'w-7 h-7 '

    if (isStart || isEffStart) {
      cls += 'bg-yellow-400 text-gray-900 font-semibold rounded-l-md rounded-r-none '
      if (sameDay(effectiveStart, effectiveEnd)) cls = cls.replace('rounded-l-md rounded-r-none', 'rounded-md')
    } else if (isEnd || isEffEnd) {
      cls += 'bg-yellow-400 text-gray-900 font-semibold rounded-r-md rounded-l-none '
      if (sameDay(effectiveStart, effectiveEnd)) cls = cls.replace('rounded-r-md rounded-l-none', 'rounded-md')
    } else if (inRange) {
      cls += 'bg-gray-700 text-gray-200 rounded-none '
    } else {
      cls += isToday
        ? 'text-yellow-400 font-semibold hover:bg-gray-700 rounded-md '
        : 'text-gray-400 hover:bg-gray-700 hover:text-white rounded-md '
    }

    return cls
  }

  return (
    <div className="w-[168px]">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-3">
        {showPrev
          ? <button onClick={onPrev} className="text-gray-500 hover:text-white p-1 rounded transition text-base leading-none">‹</button>
          : <div className="w-6" />}
        <span className="text-gray-200 text-xs font-medium">{MESES[mes]} {ano}</span>
        {showNext
          ? <button onClick={onNext} className="text-gray-500 hover:text-white p-1 rounded transition text-base leading-none">›</button>
          : <div className="w-6" />}
      </div>

      {/* Grade */}
      <div className="grid grid-cols-7 gap-0">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="flex items-center justify-center text-gray-600 text-[10px] font-medium h-6">{d}</div>
        ))}
        {Array.from({ length: primeiroDia }).map((_, i) => <div key={`e${i}`} className="w-7 h-7" />)}
        {Array.from({ length: diasNoMes }).map((_, i) => {
          const d = i + 1
          return (
            <button
              key={d}
              className={getDayCls(d)}
              onClick={() => onPickDay(dateOf(ano, mes, d))}
              onMouseEnter={() => onHoverDay(dateOf(ano, mes, d))}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DateRangePicker({ value, onChange }) {
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)

  const [aberto, setAberto] = useState(false)
  const [selStart, setSelStart] = useState(value?.start || primeiroDiaMes)
  const [selEnd, setSelEnd] = useState(value?.end || ultimoDiaMes)
  const [hoverDate, setHoverDate] = useState(null)
  const [picking, setPicking] = useState(null) // null | 'end'
  const [atalhoAtivo, setAtalhoAtivo] = useState(null)

  const [leftYM, setLeftYM] = useState({ y: hoje.getFullYear(), m: hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1 })
  const [rightYM, setRightYM] = useState({ y: hoje.getFullYear(), m: hoje.getMonth() })

  const wrapRef = useRef(null)

  // Fecha ao clicar fora
  useEffect(() => {
    const handle = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setAberto(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const triggerLabel = selStart && selEnd
    ? `${fmtBR(selStart)} – ${fmtBR(selEnd)}`
    : selStart
      ? `${fmtBR(selStart)} – ...`
      : 'Selecionar período'

  const handlePickDay = (date) => {
    if (!picking || picking === 'done') {
      setSelStart(date)
      setSelEnd(null)
      setPicking('end')
      setAtalhoAtivo(null)
    } else {
      const [s, e] = date < selStart ? [date, selStart] : [selStart, date]
      setSelStart(s)
      setSelEnd(e)
      setPicking('done')
    }
  }

  const handleAtalho = (i) => {
    const [s, e] = ATALHOS[i].fn()
    setSelStart(s)
    setSelEnd(e)
    setAtalhoAtivo(i)
    setPicking(null)

    // Ajusta calendários para mostrar o mês do início
    const lm = { y: s.getFullYear(), m: s.getMonth() }
    const next = new Date(lm.y, lm.m + 1, 1)
    setLeftYM(lm)
    setRightYM({ y: next.getFullYear(), m: next.getMonth() })
  }

  const handlePrev = () => {
    const d = new Date(leftYM.y, leftYM.m - 1, 1)
    setLeftYM({ y: d.getFullYear(), m: d.getMonth() })
    const d2 = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    setRightYM({ y: d2.getFullYear(), m: d2.getMonth() })
  }

  const handleNext = () => {
    const d = new Date(rightYM.y, rightYM.m + 1, 1)
    setRightYM({ y: d.getFullYear(), m: d.getMonth() })
    const d2 = new Date(d.getFullYear(), d.getMonth() - 1, 1)
    setLeftYM({ y: d2.getFullYear(), m: d2.getMonth() })
  }

  const handleApply = () => {
    if (selStart && selEnd) {
      onChange?.({ start: selStart, end: selEnd })
    }
    setAberto(false)
  }

  const handleClear = () => {
    setSelStart(null)
    setSelEnd(null)
    setPicking(null)
    setAtalhoAtivo(null)
  }

  const footerLabel = selStart && selEnd
    ? `${fmtBR(selStart)} – ${fmtBR(selEnd)}`
    : selStart
      ? `De ${fmtBR(selStart)} — selecione o fim`
      : 'Selecione o período'

  return (
    <div ref={wrapRef} className="relative inline-block">
      {/* Trigger */}
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 hover:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 transition-all focus:outline-none focus:border-yellow-400/70"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span className="whitespace-nowrap">{triggerLabel}</span>
        <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${aberto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Painel */}
      {aberto && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex overflow-hidden"
          style={{ minWidth: 520 }}>

          {/* Atalhos */}
          <div className="flex flex-col gap-0.5 p-2.5 border-r border-gray-800 w-36">
            {ATALHOS.map((a, i) => (
              <button
                key={i}
                onClick={() => handleAtalho(i)}
                className={`text-left px-2.5 py-1.5 rounded-md text-xs transition-all whitespace-nowrap ${
                  atalhoAtivo === i
                    ? 'bg-yellow-400 text-gray-900 font-semibold'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Calendários + footer */}
          <div className="flex flex-col">
            <div className="flex gap-5 p-4">
              <Calendario
                ano={leftYM.y} mes={leftYM.m}
                selStart={selStart} selEnd={selEnd} hoverDate={hoverDate}
                onPickDay={handlePickDay}
                onHoverDay={(d) => picking === 'end' && setHoverDate(d)}
                onPrev={handlePrev} onNext={null}
                showPrev={true} showNext={false}
              />
              <Calendario
                ano={rightYM.y} mes={rightYM.m}
                selStart={selStart} selEnd={selEnd} hoverDate={hoverDate}
                onPickDay={handlePickDay}
                onHoverDay={(d) => picking === 'end' && setHoverDate(d)}
                onPrev={null} onNext={handleNext}
                showPrev={false} showNext={true}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <span className="text-gray-500 text-xs">{footerLabel}</span>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="text-gray-500 hover:text-white text-xs px-2.5 py-1.5 rounded-md hover:bg-gray-800 transition"
                >
                  Limpar
                </button>
                <button
                  onClick={handleApply}
                  disabled={!selStart || !selEnd}
                  className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 text-xs font-semibold px-3.5 py-1.5 rounded-md transition"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}