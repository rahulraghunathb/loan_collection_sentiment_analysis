/**
 * Call Detail View — transcript + analysis panels
 */
const CallDetailView = {
    _models: null,

    async getModels() {
        if (this._models) return this._models
        const res = await API.getModels()
        this._models = res.success ? res.data : { models: [], default: '' }
        return this._models
    },

    async triggerAnalysis(callId) {
        const select = document.getElementById('model-select')
        const model = select ? select.value : null
        const btn = document.getElementById('analyze-btn')
        const statusEl = document.getElementById('analyze-status')

        if (btn) { btn.disabled = true; btn.textContent = 'Analyzing…' }
        if (statusEl) statusEl.textContent = ''

        const res = await API.analyzeCall(callId, model)

        if (res.success) {
            if (statusEl) {
                statusEl.style.color = 'var(--accent-emerald)'
                statusEl.textContent = `Analysis complete using ${res.meta?.model || model || 'default model'}`
            }
            // Re-render the full view with fresh data
            const container = document.getElementById('page-content')
            if (container) setTimeout(() => CallDetailView.render(container, callId), 800)
        } else {
            if (btn) { btn.disabled = false; btn.textContent = 'Run Analysis' }
            if (statusEl) {
                statusEl.style.color = 'var(--accent-rose)'
                statusEl.textContent = res.error?.message || 'Analysis failed'
            }
        }
    },

    async render(container, callId) {
        container.innerHTML = '<div class="loading-skeleton"><div class="skeleton-card"></div></div>'

        const [res, modelsData] = await Promise.all([
            API.getCall(callId),
            this.getModels(),
        ])

        if (!res.success) {
            container.innerHTML = '<div class="empty-state"><h3>Call not found</h3></div>'
            return
        }

        const call = res.data
        const a = call.analysis || {}
        const intent = a.repaymentIntent || {}
        const ptp = a.promiseToPay || {}
        const compliance = a.complianceFlags || []
        const crossCall = a.crossCallFlags || []
        const segments = call.segments || []

        const models = modelsData.models || []
        const defaultModel = modelsData.default || ''
        const hasAnalysis = !!call.analysis
        const analyzeLabel = hasAnalysis ? 'Re-analyze' : 'Run Analysis'

        const modelOptions = models.map(m =>
            `<option value="${m.id}" ${m.id === defaultModel ? 'selected' : ''}>${m.label} — ${m.provider}</option>`
        ).join('')

        container.innerHTML = `
      <!-- Call Header -->
      <div class="flex-between mb-6" style="flex-wrap:wrap;gap:1rem">
        <div>
          <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
            <code style="color:var(--accent-indigo);font-size:0.8rem">${call.id}</code>
            <span class="badge ${DashboardView.outcomeBadgeClass(a.outcome)}">${DashboardView.formatOutcome(a.outcome)}</span>
            ${compliance.length ? `<span class="badge badge-danger">⚠ ${compliance.length} Compliance Flag${compliance.length > 1 ? 's' : ''}</span>` : ''}
          </div>
          <div class="text-muted" style="font-size:0.8rem">
            ${call.customer?.name || 'Unknown Customer'} · Agent: ${call.agentName} · ${DashboardView.formatDate(call.callDate)} · ${CallListView.formatDuration(call.duration)}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem">
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;justify-content:flex-end">
            <button class="btn btn-ghost" onclick="App.openCustomerTimeline('${call.customerId}')">Customer Timeline</button>
            ${models.length ? `
              <select id="model-select" style="
                background:var(--surface-2);
                border:1px solid var(--border);
                border-radius:6px;
                color:var(--text-primary);
                font-size:0.75rem;
                padding:0.4rem 0.6rem;
                cursor:pointer;
                max-width:220px;
              ">
                ${modelOptions}
              </select>
            ` : ''}
            <button id="analyze-btn" class="btn btn-primary" onclick="CallDetailView.triggerAnalysis('${call.id}')">
              ${analyzeLabel}
            </button>
          </div>
          <div id="analyze-status" style="font-size:0.72rem;min-height:1rem"></div>
        </div>
      </div>

      <!-- Summary Card -->
      <div class="card mb-6" style="border-left:3px solid var(--accent-indigo)">
        <div class="card-title" style="margin-bottom:0.75rem">AI Summary</div>
        <p style="font-size:0.875rem;line-height:1.7;color:var(--text-secondary)">${a.summary || 'No summary available'}</p>
        ${(a.keyPoints && a.keyPoints.length) ? `
          <div class="tag-list mt-4">
            ${a.keyPoints.map(p => `<span class="tag">${p}</span>`).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Main Grid: Transcript + Analysis -->
      <div class="call-detail-grid">
        <!-- Transcript -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Transcript</div>
            <span class="text-muted" style="font-size:0.75rem">${segments.length} segments</span>
          </div>
          <div class="transcript-panel">
            ${segments.sort((a, b) => a.startTime - b.startTime).map(seg => `
              <div class="transcript-msg ${seg.speaker}">
                <div class="transcript-avatar ${seg.speaker}">${seg.speaker === 'agent' ? 'A' : 'C'}</div>
                <div>
                  <div class="transcript-bubble">${seg.text}</div>
                  <div class="transcript-time">${this.formatTime(seg.startTime)} — ${this.formatTime(seg.endTime)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Analysis Panels -->
        <div class="analysis-panels">
          <!-- Intent -->
          <div class="analysis-card">
            <div class="analysis-card-title"><span class="dot" style="background:${DashboardView.intentColor(intent.score || 0)}"></span> Repayment Intent</div>
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.75rem">
              <div style="font-size:2rem;font-weight:800;color:${DashboardView.intentColor(intent.score || 0)}">${intent.score || 0}</div>
              <div>
                <div class="badge ${intent.level === 'high' ? 'badge-success' : intent.level === 'medium' ? 'badge-warning' : 'badge-danger'}">${(intent.level || 'unknown').toUpperCase()}</div>
              </div>
            </div>
            <div class="risk-meter mb-4"><div class="risk-meter-fill" style="width:${intent.score || 0}%;background:${DashboardView.intentColor(intent.score || 0)}"></div></div>
            ${(intent.signals && intent.signals.length) ? `
              <div class="tag-list">${intent.signals.map(s => `<span class="tag">${s.replace(/_/g, ' ')}</span>`).join('')}</div>
            ` : ''}
          </div>

          <!-- Promise to Pay -->
          <div class="analysis-card">
            <div class="analysis-card-title"><span class="dot" style="background:${ptp.detected ? 'var(--accent-emerald)' : 'var(--text-muted)'}"></span> Promise to Pay</div>
            ${ptp.detected ? `
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;font-size:0.8rem">
                <div><div class="text-muted" style="font-size:0.65rem;text-transform:uppercase">Amount</div><strong style="font-size:1.1rem">₹${(ptp.amount || 0).toLocaleString('en-IN')}</strong></div>
                <div><div class="text-muted" style="font-size:0.65rem;text-transform:uppercase">Date</div><strong>${ptp.date || '—'}</strong></div>
                <div><div class="text-muted" style="font-size:0.65rem;text-transform:uppercase">Confidence</div><strong style="color:${DashboardView.intentColor(ptp.confidence || 0)}">${ptp.confidence || 0}%</strong></div>
                <div><div class="text-muted" style="font-size:0.65rem;text-transform:uppercase">Installment</div><strong>${ptp.installment ? 'Yes' : 'One-time'}</strong></div>
              </div>
              <p class="text-muted mt-4" style="font-size:0.75rem;line-height:1.5">${ptp.details || ''}</p>
            ` : '<p class="text-muted" style="font-size:0.8rem">No payment commitment detected</p>'}
          </div>

          <!-- Compliance -->
          <div class="analysis-card">
            <div class="analysis-card-title"><span class="dot" style="background:${compliance.length ? 'var(--accent-rose)' : 'var(--accent-emerald)'}"></span> Compliance</div>
            ${compliance.length ? compliance.map(f => `
              <div class="compliance-alert" style="margin-bottom:0.5rem">
                <div class="alert-header">
                  <span class="alert-type">${f.type.replace(/_/g, ' ')}</span>
                  <span class="badge badge-${f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'info'}">${f.severity}</span>
                </div>
                <div class="alert-evidence">"${f.evidence}"</div>
              </div>
            `).join('') : '<p class="text-muted" style="font-size:0.8rem">✅ No compliance violations detected</p>'}
          </div>

          <!-- Cross-Call Flags -->
          ${crossCall.length ? `
            <div class="analysis-card">
              <div class="analysis-card-title"><span class="dot" style="background:var(--accent-amber)"></span> Cross-Call Inconsistencies</div>
              ${crossCall.map(f => `
                <div class="cross-call-flag">
                  <div class="flag-field">${f.field.replace(/_/g, ' ')}</div>
                  <div class="flag-comparison">
                    <div class="flag-claim">${f.previousClaim}</div>
                    <div class="flag-arrow">→</div>
                    <div class="flag-claim">${f.currentClaim}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Next Actions -->
          ${(a.nextActions && a.nextActions.length) ? `
            <div class="analysis-card">
              <div class="analysis-card-title"><span class="dot" style="background:var(--accent-blue)"></span> Next Actions</div>
              <ul style="list-style:none;padding:0;margin:0">
                ${a.nextActions.map(n => `<li style="padding:0.35rem 0;font-size:0.8rem;color:var(--text-secondary);border-bottom:1px solid var(--border-subtle)">→ ${n}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <!-- Risk Flags -->
          ${(a.riskFlags && a.riskFlags.length) ? `
            <div class="analysis-card" style="border:1px solid rgba(251,113,133,0.15)">
              <div class="analysis-card-title"><span class="dot" style="background:var(--accent-rose)"></span> Risk Flags</div>
              <div class="tag-list">
                ${a.riskFlags.map(r => `<span class="tag" style="border-color:rgba(251,113,133,0.2);color:var(--accent-rose)">${r}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `
    },

    formatTime(seconds) {
        if (seconds == null) return '—'
        const m = Math.floor(seconds / 60)
        const s = Math.floor(seconds % 60)
        return `${m}:${String(s).padStart(2, '0')}`
    },
}
