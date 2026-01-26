import React from 'react'

type Props = {
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
}

export default function ConfirmDialog({ title = 'Confirm', message, onConfirm, onCancel, confirmLabel = 'Yes', cancelLabel = 'Cancel' }: Props){
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40" onMouseDown={(e)=>{ if (e.target === e.currentTarget) onCancel() }}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md" onMouseDown={e=>e.stopPropagation()}>
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold">{title}</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-700">{message}</p>
        </div>
        <div className="px-4 py-3 border-t flex justify-end gap-2 bg-gray-50">
          <button type="button" className="px-4 py-2 rounded border" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="px-4 py-2 rounded bg-red-600 text-white" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
