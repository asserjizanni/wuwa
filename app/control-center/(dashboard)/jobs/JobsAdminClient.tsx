'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, RotateCcw, Clock, CheckCircle2, AlertTriangle,
  FileText, RefreshCw, ChevronLeft, ChevronRight, Play, Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import ElementBadge from '@/components/ui/ElementBadge'

interface Job {
  id: string
  characterId: string
  guideId: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  progress: number
  processedPages: number
  totalPages: number
  errorMessage?: string | null
  startedAt?: string | null
  completedAt?: string | null
  createdAt: string
  character?: { id: string; name: string; slug: string; element: string }
  guide?: { id: string; title: string; version: number; status: string; pageCount: number }
}

export default function JobsAdminClient() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null)

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '15')
      if (statusFilter !== 'ALL') params.set('status', statusFilter)

      const res = await fetch(`/api/admin/jobs?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch jobs')
      const data = await res.json()
      setJobs(data.jobs || [])
      setTotalPages(data.pagination?.pages || 1)
    } catch {
      // non-blocking
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [page, statusFilter])

  // Polling auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchJobs()
    }, 15000)
    return () => clearInterval(interval)
  }, [autoRefresh, page, statusFilter])

  const handleRetry = async (jobId: string) => {
    setRetryingJobId(jobId)
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Retry failed')
      toast.success('Conversion job restarted')
      fetchJobs()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRetryingJobId(null)
    }
  }

  const counts = {
    total: jobs.length,
    running: jobs.filter(j => j.status === 'RUNNING').length,
    completed: jobs.filter(j => j.status === 'COMPLETED').length,
    failed: jobs.filter(j => j.status === 'FAILED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-primary" />
            PDF Conversion Jobs
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time pipeline monitoring for PDF rendering, high-dpi image extraction, and thumbnail synthesis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-300 bg-black/40 px-3 py-2 rounded-xl border border-white/10 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="w-3.5 h-3.5 accent-primary rounded cursor-pointer"
            />
            <span>Live Polling (4s)</span>
          </label>

          <button
            onClick={fetchJobs}
            className="p-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Active Pipeline', value: counts.running, color: 'text-amber-400', border: 'border-amber-500/20' },
          { label: 'Completed Renders', value: counts.completed, color: 'text-emerald-400', border: 'border-emerald-500/20' },
          { label: 'Failed Jobs', value: counts.failed, color: 'text-rose-400', border: 'border-rose-500/20' },
          { label: 'Total Jobs Listed', value: counts.total, color: 'text-primary', border: 'border-primary/20' },
        ].map(s => (
          <div key={s.label} className={`glass-card p-4 rounded-xl border ${s.border}`}>
            <div className="text-xs text-gray-400 font-semibold">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs w-fit">
        {['ALL', 'RUNNING', 'COMPLETED', 'FAILED', 'PENDING'].map(st => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st)
              setPage(1)
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              statusFilter === st
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-white/[0.03] text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Resonator & Guide</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Pages Rendered</th>
                <th className="py-3 px-4">Initiated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Fetching job queue...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No conversion jobs in this view.
                  </td>
                </tr>
              ) : (
                jobs.map(job => (
                  <tr key={job.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{job.character?.name || 'Unknown'}</span>
                          {job.character?.element && (
                            <ElementBadge element={job.character.element} size="sm" />
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {job.guide?.title || 'Build Guide'} (v{job.guide?.version || 1})
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${
                          job.status === 'RUNNING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : job.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : job.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                        }`}
                      >
                        {job.status === 'RUNNING' && <Clock className="w-3 h-3 animate-spin" />}
                        {job.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                        {job.status === 'FAILED' && <AlertTriangle className="w-3 h-3" />}
                        {job.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono text-gray-400">
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              job.status === 'FAILED'
                                ? 'bg-rose-500'
                                : job.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : 'bg-primary'
                            }`}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-gray-400">
                      {job.processedPages} / {job.totalPages || '?'}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-gray-400">
                      {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {job.status === 'FAILED' && (
                        <button
                          disabled={retryingJobId === job.id}
                          onClick={() => handleRetry(job.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-semibold transition"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${retryingJobId === job.id ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 text-sm text-gray-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
