"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { importCsv, type ImportResult } from "@/app/admin/(dashboard)/products/import/actions";

const TEMPLATE =
  "main_product,model,price,sale_price,category,description,in_stock,image_url\n" +
  "Fan Motor,60W,2500,,Motor Spares,Copper winding fan motor,yes,\n" +
  "Fan Motor,80W,2900,,Motor Spares,,yes,\n" +
  "Ceiling Fan Capacitor,2.5uF,450,420,Electrical,Start/run capacitor,yes,\n";

type PreviewRow = Record<string, string>;

export function ImportClient({ aiEnabled }: { aiEnabled: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "colombo-spares-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setResult(null);
    setError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setPreview([]);
      setRowCount(0);
      setFileName("");
      return;
    }
    setFileName(file.name);
    Papa.parse<PreviewRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = (res.data || []).filter((r) => Object.values(r).some((v) => String(v).trim()));
        setRowCount(rows.length);
        setPreview(rows.slice(0, 12));
      },
      error: () => setError("Could not read that CSV file."),
    });
  }

  async function onImport() {
    if (!formRef.current) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const fd = new FormData(formRef.current);
      const res = await importCsv(fd);
      setResult(res);
    } catch {
      setError("Import failed. Please check the file and try again.");
    } finally {
      setBusy(false);
    }
  }

  const headers = preview.length ? Object.keys(preview[0]) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form ref={formRef} className="lg:col-span-1">
        <div className="card p-5">
          <h2 className="mb-3 text-base font-bold text-ink">Upload CSV</h2>
          <button type="button" onClick={downloadTemplate} className="btn-outline mb-4 w-full">
            ↓ Download template
          </button>
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            onChange={onFileChange}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
          />
          {fileName && <p className="mt-2 text-xs text-muted">{fileName} · {rowCount} rows</p>}

          <label className={`mt-4 flex items-start gap-2 text-sm ${aiEnabled ? "text-ink" : "text-gray-400"}`}>
            <input type="checkbox" name="useAi" disabled={!aiEnabled} className="mt-0.5 h-4 w-4" defaultChecked={aiEnabled} />
            <span>
              Use AI to sort categories &amp; write SEO
              {!aiEnabled && <span className="block text-xs">Add an OpenAI key in Settings to enable.</span>}
            </span>
          </label>

          <button
            type="button"
            onClick={onImport}
            disabled={busy || rowCount === 0}
            className="btn-primary mt-5 w-full"
          >
            {busy ? "Importing…" : `Import ${rowCount || ""} rows`}
          </button>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {result && result.ok && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              Imported successfully: {result.created} new product{result.created === 1 ? "" : "s"},{" "}
              {result.updated} updated, {result.variants} models.
              {result.usedAi && <span className="block">AI sorting applied.</span>}
              <Link href="/admin/products" className="mt-2 inline-block font-semibold underline">
                View products →
              </Link>
            </div>
          )}
          {result && !result.ok && (
            <p className="mt-3 text-sm text-red-600">{result.error}</p>
          )}
        </div>
      </form>

      <div className="lg:col-span-2">
        <div className="card p-5">
          <h2 className="mb-3 text-base font-bold text-ink">Preview</h2>
          {preview.length === 0 ? (
            <p className="text-sm text-muted">
              Choose a CSV to preview it here. Rows with the same product name become one product with
              multiple models.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-xs">
                <thead className="bg-gray-50 text-left uppercase tracking-wide text-muted">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-2 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {preview.map((r, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="px-2 py-1.5 text-ink">{r[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {rowCount > preview.length && (
                <p className="mt-2 text-xs text-muted">…and {rowCount - preview.length} more rows.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
