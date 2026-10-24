'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertTriangle, Play, RefreshCw, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

type Category = 'characters' | 'weapons' | 'echoes' | 'sonataSets' | 'enemies'

export default function ImportClient() {
  const [category, setCategory] = useState<Category>('weapons')
  const [jsonInput, setJsonInput] = useState('')
  const [parsedData, setParsedData] = useState<any[] | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<any | null>(null)

  const handleParse = (text: string) => {
    setJsonInput(text)
    setImportResult(null)
    setValidationError(null)

    if (!text.trim()) {
      setParsedData(null)
      return
    }

    try {
      const parsed = JSON.parse(text)
      const list = Array.isArray(parsed) ? parsed : Object.values(parsed)
      if (!Array.isArray(list)) {
        throw new Error('الملف يجب أن يحتوي على مصفوفة عناصر (Array) أو كائن JSON سليم.')
      }
      setParsedData(list)
    } catch (err: any) {
      setValidationError(`خطأ في صياغة JSON: ${err.message}`)
      setParsedData(null)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      handleParse(content)
    }
    reader.readAsText(file)
  }

  const handleExecuteImport = async () => {
    if (!parsedData || parsedData.length === 0) return
    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          records: parsedData,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل الاستيراد')

      setImportResult(data)
      toast.success(`تم استيراد ${data.imported} سجل بنجاح!`)
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء تنفيذ الاستيراد')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="bg-[#050913] border border-white/10 p-4 rounded-2xl">
        <label className="block text-xs font-bold text-slate-400 mb-3">حدد نوع البيانات المراد استيرادها:</label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'weapons', label: 'الأسلحة (Weapons)' },
            { key: 'characters', label: 'الشخصيات (Characters)' },
            { key: 'echoes', label: 'الإيكو (Echoes)' },
            { key: 'sonataSets', label: 'مجموعات السوناتا (Sonata Sets)' },
            { key: 'enemies', label: 'الأعداء والزعماء (Enemies)' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setCategory(cat.key as Category)
                setImportResult(null)
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                category === cat.key
                  ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload & Paste */}
        <div className="bg-[#050913] border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                تحميل ملف JSON أو لصق النص:
              </span>
              <label className="cursor-pointer text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-colors flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                اختيار ملف JSON
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <textarea
              rows={12}
              value={jsonInput}
              onChange={(e) => handleParse(e.target.value)}
              placeholder="الصق مصفوفة JSON هنا... مثال: [{ &quot;name&quot;: &quot;Weapon Name&quot;, &quot;slug&quot;: &quot;weapon-name&quot; }]"
              className="w-full bg-[#03060f] border border-white/10 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          {validationError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </div>

        {/* Validation & Preview Summary */}
        <div className="bg-[#050913] border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              تقرير التحقق والمعاينة (Pre-Import Validation)
            </h3>

            {parsedData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#040812] border border-white/5 rounded-xl p-3 text-center">
                    <span className="text-[11px] text-slate-400 block mb-1">إجمالي السجلات المقروءة</span>
                    <strong className="text-xl font-black text-cyan-400">{parsedData.length}</strong>
                  </div>
                  <div className="bg-[#040812] border border-white/5 rounded-xl p-3 text-center">
                    <span className="text-[11px] text-slate-400 block mb-1">النوع المستهدف</span>
                    <strong className="text-xs font-black text-white uppercase">{category}</strong>
                  </div>
                </div>

                <div className="bg-[#040812] border border-white/5 rounded-xl p-3">
                  <span className="text-xs font-bold text-slate-400 block mb-2">معاينة أول عنصر:</span>
                  <pre className="text-[10px] text-slate-300 font-mono overflow-x-auto max-h-40 p-2 bg-black/40 rounded-lg">
                    {JSON.stringify(parsedData[0], null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500 border border-dashed border-white/10 rounded-xl p-6">
                <Layers className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">قم بلصق أو اختيار ملف JSON لمعاينة البيانات والتحقق منها قبل الاستيراد.</p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={handleExecuteImport}
              disabled={!parsedData || parsedData.length === 0 || importing}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جارٍ تطبيق الاستيراد الآمن...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  تأكيد وتطبيق الاستيراد الآمن ({parsedData?.length || 0} سجل)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Import Result Notification */}
      {importResult && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-6 animate-in fade-in">
          <h4 className="text-sm font-black text-emerald-400 flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            اكتملت عملية الاستيراد بنجاح!
          </h4>
          <p className="text-xs text-slate-300">
            تم إدخال أو تحديث <strong className="text-white font-bold">{importResult.imported}</strong> سجل في قاعدة
            بيانات <strong className="text-cyan-300">{category}</strong> بنجاح دون أي فقد للبيانات القائمة.
          </p>
        </div>
      )}
    </div>
  )
}
