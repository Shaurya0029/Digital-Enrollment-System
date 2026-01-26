import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function BulkImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------------- ROLE GUARD ---------------- */

  useEffect(() => {
    const role = (localStorage.getItem("role") || "").toUpperCase();
    // allow any HR-prefixed role (HR, HR_ADMIN, HR_MANAGER, etc.)
    if (!role.startsWith("HR")) {
      navigate("/employee/dashboard", { replace: true });
    }
  }, [navigate]);

  /* ---------------- FILE HANDLING ---------------- */

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!f.name.endsWith(".csv") && !f.name.endsWith(".xlsx")) {
      setError("Only CSV or Excel files allowed");
      return;
    }

    if (f.size > 5 * 1024 * 1024) {
      setError("Max file size is 5MB");
      return;
    }

    setError(null);
    setFile(f);
  }

  /* ---------------- IMPORT ---------------- */

  async function handleImport() {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res: any = await api.request("/hr/employee/bulk", {
        method: "POST",
        body: formData,
      });

      if (!res) throw new Error('No response from server')
      if (res.error) throw new Error(res.error)

      // backend returns { createdCount, created, errors }
      const created = res.createdCount ?? (Array.isArray(res.created) ? res.created.length : 0)
      const errors = res.errors || []
      if (created > 0) {
        const msg = `Employees imported successfully: ${created}` + (errors.length ? `\nSkipped ${errors.length} items.` : '')
        alert(msg)
        navigate("/hr/employees");
      } else {
        // created 0 -> surface server errors
        const reason = res.error || (errors.length ? JSON.stringify(errors.slice(0,5)) : 'No employees created')
        throw new Error(String(reason))
      }
    } catch (err: any) {
      setError(err.message || "Import failed")
      alert(err.message || "Import failed")
    } finally {
      setLoading(false);
    }
  }

  function handleCancel(e?: React.MouseEvent) {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    setFile(null)
    setError(null)
    setLoading(false)
    // navigate back if this component was opened via route
    try { navigate("/hr/employees") } catch {}
    // also notify parent modal containers to close (EmployeesPage listens for this)
    try { window.dispatchEvent(new CustomEvent('bulk-modal-close')) } catch {}
  }

  /* ---------------- UI ---------------- */

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={() => navigate("/hr/employees")}
    >
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">Import Employees</h2>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleCancel(e) }}
            className="text-xl"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-4">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500"
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="font-medium">
              {file ? file.name : "Click to upload or drag & drop"}
            </p>
            <p className="text-sm text-gray-500">
              CSV or Excel • Max 5MB
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              hidden
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={(e) => handleCancel(e)}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!file || loading}
            className={`px-5 py-2 rounded text-white ${
              !file || loading
                ? "bg-gray-400"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
