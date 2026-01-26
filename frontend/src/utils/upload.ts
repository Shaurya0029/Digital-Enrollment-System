import api from '../api'

// Request a presigned POST form from the backend
export async function getPresignedForm(filename: string, contentType = 'application/octet-stream'){
  return api.request('/hr/employee/upload-presigned', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ filename, contentType }) })
}

// Upload a file using a presigned POST response (fields + url)
export async function uploadToPresigned(presigned: any, file: File){
  const form = new FormData()
  const fields = presigned.fields || {}
  Object.keys(fields).forEach(k => form.append(k, fields[k]))
  // S3 expects the file under the key 'file'
  form.append('file', file)

  const res = await fetch(presigned.url, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Upload failed')
  return res
}

export default { getPresignedForm, uploadToPresigned }
