import React, { useState, useEffect } from 'react'

interface PolicyModalProps {
  isOpen: boolean
  mode: 'add' | 'edit'
  policy?: { id: number; policyNumber: string; name: string; description?: string }
  onClose: () => void
  onSave: (data: { id?: number; policyNumber: string; name: string; description?: string }) => Promise<void>
  isLoading?: boolean
  error?: string
}

export default function PolicyModal({
  isOpen,
  mode,
  policy,
  onClose,
  onSave,
  isLoading = false,
  error = '',
}: PolicyModalProps) {
  const [policyNumber, setPolicyNumber] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && policy) {
        setPolicyNumber(policy.policyNumber)
        setName(policy.name)
        setDescription(policy.description || '')
      } else {
        setPolicyNumber('')
        setName('')
        setDescription('')
      }
      setLocalError('')
    }
  }, [isOpen, mode, policy])

  const handleSave = async () => {
    // Validation
    if (!policyNumber.trim()) {
      setLocalError('Policy Code is required')
      return
    }
    if (!name.trim()) {
      setLocalError('Policy Name is required')
      return
    }

    try {
      setLocalError('')
      const payload = {
        ...(mode === 'edit' && policy ? { id: policy.id } : {}),
        policyNumber: policyNumber.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
      }
      await onSave(payload)
      onClose()
    } catch (err: any) {
      setLocalError(err.message || 'Failed to save policy')
    }
  }

  const handleCancel = () => {
    setPolicyNumber('')
    setName('')
    setDescription('')
    setLocalError('')
    onClose()
  }

  if (!isOpen) return null

  const title = mode === 'add' ? 'Add New Policy' : 'Edit Policy'
  const displayError = error || localError

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCancel()
      }}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {displayError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {displayError}
            </div>
          )}

          {/* Policy Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Code <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              disabled={isLoading}
              placeholder="e.g., POL-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Policy Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              placeholder="e.g., Health Insurance Plan"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Policy description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Policy'}
          </button>
        </div>
      </div>
    </div>
  )
}
