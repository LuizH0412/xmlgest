export function ModalConfirmacao({ titulo, mensagem, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <p className="text-white font-semibold text-base mb-1">{titulo}</p>
        <p className="text-gray-400 text-sm mb-6">{mensagem}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancelar}
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 hover:text-white transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 hover:border-red-400 transition"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}