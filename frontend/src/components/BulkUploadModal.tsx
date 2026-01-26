import React, { useState, useRef } from 'react'
import * as XLSX from 'xlsx'

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (employees: Array<{ name: string; email: string; password: string; phone?: string; dob?: string; gender?: string; address?: string; maritalStatus?: string; externalId?: string }>) => Promise<{ successCount: number; failureCount: number; errors: Array<{ row: number; reason: string }>; created: any[] }>
  isLoading?: boolean
  error?: string
}

interface UploadResult {
  successCount: number
  failureCount: number
  errors: Array<{ row: number; reason: string }>
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  onUpload,
  isLoading = false,
  error = '',
}: BulkUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState('')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    // Validate file type
    if (
      !f.name.endsWith('.csv') &&
      !f.name.endsWith('.xlsx') &&
      !f.name.endsWith('.xls')
    ) {
      setLocalError('Only CSV or Excel files (.csv, .xlsx, .xls) are allowed')
      setFile(null)
      return
    }

    // Validate file size (max 5MB)
    if (f.size > 5 * 1024 * 1024) {
      setLocalError('File size must not exceed 5MB')
      setFile(null)
      return
    }

    setLocalError('')
    setFile(f)
  }

  const parseFile = async (
    file: File,
  ): Promise<
    Array<{ name: string; email: string; password: string; phone?: string; dob?: string; gender?: string; address?: string; maritalStatus?: string; externalId?: string }>
  > => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          let rows: any[] = []

          if (file.name.endsWith('.csv')) {
            // Parse CSV
            const text = data as string
            const lines = text.split('\n')
            const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())

            for (let i = 1; i < lines.length; i++) {
              if (!lines[i].trim()) continue
              const values = lines[i].split(',').map((v) => v.trim())
              const row: any = {}
              headers.forEach((header, index) => {
                row[header] = values[index] || ''
              })
              rows.push(row)
            }
          } else {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'array' })
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
          }

          // Map rows to expected format
          const employees = rows
            .filter((row) => row.name && row.email)
            .map((row) => ({
              name: row.name || row.fullname || row.full_name || '',
              email: row.email || row.email_address || '',
              password: row.password || 'TempPassword123',
              phone: row.phone || row.phonenumber || row.phone_number || undefined,
              dob: row.dob || row.dateofbirth || row.date_of_birth || undefined,
              gender: row.gender || undefined,
              address: row.address || undefined,
              maritalStatus: row.maritalstatus || row.marital_status || undefined,
              externalId: row.externalid || row.external_id || undefined,
            }))

          resolve(employees)
        } catch (err) {
          reject(
            new Error(
              `Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`,
            ),
          )
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    })
  }

  const handleUpload = async () => {
    if (!file) {
      setLocalError('Please select a file')
      return
    }

    try {
      setIsProcessing(true)
      setLocalError('')
      setUploadResult(null)

      // Parse file
      const employees = await parseFile(file)

      if (employees.length === 0) {
        setLocalError('No valid employees found in file')
        return
      }

      // Call upload function
      const result = await onUpload(employees)
      if (result && result.successCount > 0) {
        setUploadResult(result)
        setFile(null)
        // Auto-close after success
        setTimeout(() => {
          setFile(null)
          setUploadResult(null)
          onClose()
        }, 2000)
      } else if (result && result.errors && result.errors.length > 0) {
        setLocalError(`Upload failed: ${result.errors[0].reason}`)
        setUploadResult(result)
      } else {
        setLocalError('No employees were uploaded')
      }
    } catch (err: any) {
      setLocalError(err.message || 'Failed to upload employees')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'TempPassword123',
        phone: '1234567890',
        dob: '1990-01-15',
        gender: 'Male',
        address: '123 Main St',
        maritalStatus: 'Single',
        externalId: 'EMP-001',
      },
    ]

    const worksheet = XLSX.utils.json_to_sheet(templateData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees')
    XLSX.writeFile(workbook, 'employee_template.xlsx')
  }

  const handleCancel = () => {
    setFile(null)
    setLocalError('')
    setUploadResult(null)
    setIsProcessing(false)
    onClose()
  }

  if (!isOpen) return null

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
          <h2 className="text-lg font-semibold text-gray-900">
            Bulk Upload Employees
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {displayError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {displayError}
            </div>
          )}

          {uploadResult ? (
            <div className="space-y-3">
              {uploadResult.successCount > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  <strong>Success:</strong> {uploadResult.successCount} employee
                  {uploadResult.successCount !== 1 ? 's' : ''} created
                </div>
              )}

              {uploadResult.failureCount > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                  <strong>Failed:</strong> {uploadResult.failureCount} employee
                  {uploadResult.failureCount !== 1 ? 's' : ''}
                  {uploadResult.errors.length > 0 && (
                    <ul className="mt-2 text-xs">
                      {uploadResult.errors.slice(0, 5).map((err, idx) => (
                        <li key={idx}>
                          Row {err.row}: {err.reason}
                        </li>
                      ))}
                      {uploadResult.errors.length > 5 && (
                        <li>... and {uploadResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-600">
                Total: {uploadResult.successCount + uploadResult.failureCount}{' '}
                rows processed
              </p>
            </div>
          ) : (
            <>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="flex flex-col items-center gap-2">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-600 text-center">
                    {file ? (
                      <>
                        <strong>{file.name}</strong>
                        <br />
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Change file
                        </button>
                      </>
                    ) : (
                      <>
                        <span
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:underline cursor-pointer font-medium"
                        >
                          Click to upload
                        </span>
                        {' or drag and drop'}
                        <br />
                        <span className="text-xs">CSV or Excel files up to 5MB</span>
                      </>
                    )}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isLoading || isProcessing}
                  className="hidden"
                />
              </div>

              <button
                type="button"
                onClick={downloadTemplate}
                disabled={isLoading || isProcessing}
                className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 disabled:opacity-50"
              >
                ⬇ Download Template
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading || isProcessing}
            className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadResult ? 'Close' : 'Cancel'}
          </button>
          {!uploadResult && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || isLoading || isProcessing}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
