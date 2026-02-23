/**
 * Dashboard View — KPIs, charts, recent calls
 */
const DashboardView = {
    async render(container) {
        container.innerHTML = `
          <div class="loading-skeleton">
            <div class="skeleton-card"></div><div class="skeleton-card"></div>
            <div class="skeleton-card"></div><div class="skeleton-card"></div>
            <div class="skeleton-card"></div><div class="skeleton-card"></div>
          </div>`

        const res = await API.getDashboardStats()
        if (!res.success) {
            container.innerHTML = `
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <h3>Failed to load dashboard</h3>
                <p>Check that the backend server is running.</p>
              </div>`
            return
        }

        const { kpis, outcomeDistribution, riskDistribution, recentCalls, callsByDate } = res.data

        container.innerHTML = `
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card accent-blue">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
            </svg>
          </div>
          <div class="kpi-label">Total Calls</div>
          <div class="kpi-value">${kpis.totalCalls}</div>
          <div class="kpi-sub">${kpis.analyzedCalls} analyzed</div>
        </div>
        <div class="kpi-card accent-emerald">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="kpi-label">Avg Intent Score</div>
          <div class="kpi-value">${kpis.avgIntentScore}<span style="font-size:0.5em;color:var(--text-muted)">/100</span></div>
          <div class="kpi-sub">${this.intentLabel(kpis.avgIntentScore)}</div>
        </div>
        <div class="kpi-card accent-rose">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="kpi-label">Compliance Flags</div>
          <div class="kpi-value">${kpis.totalComplianceFlags}</div>
          <div class="kpi-sub">${kpis.highSeverityFlags} high severity</div>
        </div>
        <div class="kpi-card accent-amber">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          </div>
          <div class="kpi-label">Active PTPs</div>
          <div class="kpi-value">${kpis.activePTPs}</div>
          <div class="kpi-sub">${kpis.brokenPromises} broken promises</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="kpi-label">Avg Risk Score</div>
          <div class="kpi-value text-${kpis.avgRiskScore > 70 ? 'rose' : kpis.avgRiskScore > 40 ? 'amber' : 'emerald'}">${kpis.avgRiskScore}</div>
          <div class="risk-meter mt-4"><div class="risk-meter-fill" style="width:${kpis.avgRiskScore}%;background:${this.riskColor(kpis.avgRiskScore)}"></div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div class="kpi-label">Inconsistencies</div>
          <div class="kpi-value text-amber">${kpis.totalInconsistencies}</div>
          <div class="kpi-sub">Cross-call contradictions</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:-2px;margin-right:6px;opacity:0.6">
                <path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/>
              </svg>
              Outcome Distribution
            </div>
          </div>
          <div class="chart-container square">
            <canvas id="chart-outcomes"></canvas>
          </div>
          <div id="chart-outcomes-legend" class="chart-legend"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:-2px;margin-right:6px;opacity:0.6">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Risk Distribution
            </div>
          </div>
          <div class="chart-container" style="aspect-ratio:auto;height:220px;">
            <canvas id="chart-risk"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Calls -->
      <div class="card full-width">
        <div class="card-header">
          <div class="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;vertical-align:-2px;margin-right:6px;opacity:0.6">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Recent Calls
          </div>
          <a href="#calls" class="btn btn-ghost">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
            View All
          </a>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Intent</th>
              <th>Outcome</th>
              <th>Risk</th>
              <th>Compliance</th>
            </tr>
          </thead>
          <tbody id="recent-calls-body"></tbody>
        </table>
      </div>
    `

        this.renderCharts(outcomeDistribution, riskDistribution)
        this.renderRecentCalls(recentCalls)
    },

    renderCharts(outcomes, risks) {
        // Outcome donut
        const outcomeData = Object.entries(outcomes).map(([key, value]) => ({
            label: this.formatOutcome(key),
            value,
            color: this.outcomeColor(key),
        }))
        const total = outcomeData.reduce((s, d) => s + d.value, 0)
        Charts.donut('chart-outcomes', outcomeData, { size: 220, centerText: total.toString(), centerSub: 'Total' })

        // Outcome legend
        const legendEl = document.getElementById('chart-outcomes-legend')
        if (legendEl) {
            legendEl.innerHTML = outcomeData.map(d =>
                `<div class="legend-item"><span class="legend-dot" style="background:${d.color}"></span>${d.label}: ${d.value}</div>`
            ).join('')
        }

        // Risk horizontal bar
        const riskData = [
            { label: 'Low', value: risks.low || 0, color: Charts.colors.emerald },
            { label: 'Medium', value: risks.medium || 0, color: Charts.colors.amber },
            { label: 'High', value: risks.high || 0, color: Charts.colors.orange },
            { label: 'Critical', value: risks.critical || 0, color: Charts.colors.rose },
        ]
        Charts.horizontalBar('chart-risk', riskData)
    },

    renderRecentCalls(calls) {
        const tbody = document.getElementById('recent-calls-body')
        if (!tbody) return

        tbody.innerHTML = calls.map(c => {
            const intent = c.analysis?.repaymentIntent
            const score = intent?.score ?? 0
            const flags = c.analysis?.complianceFlags || []
            return `
      <tr onclick="App.openCallDetail('${c.id}')">
        <td>
          <strong>${c.customer?.name || 'Unknown'}</strong>
          <div class="text-muted" style="font-size:0.7rem">${c.customer?.loanId || ''}</div>
        </td>
        <td>${this.formatDate(c.callDate)}</td>
        <td>
          <div class="intent-gauge">
            <div class="gauge-bar"><div class="gauge-fill" style="width:${score}%;background:${this.intentColor(score)}"></div></div>
            <span class="gauge-value" style="color:${this.intentColor(score)}">${score}</span>
          </div>
        </td>
        <td><span class="badge ${this.outcomeBadgeClass(c.analysis?.outcome)}">${this.formatOutcome(c.analysis?.outcome)}</span></td>
        <td><span style="color:${this.riskColor(c.analysis?.riskScore || 50)};font-weight:700">${c.analysis?.riskScore || '-'}</span></td>
        <td>${flags.length ? `<span class="badge badge-danger">${flags.length} flag${flags.length > 1 ? 's' : ''}</span>` : '<span class="badge badge-success">Clean</span>'}</td>
      </tr>`
        }).join('')
    },

    // Helpers
    intentLabel(score) {
        if (score >= 70) return 'Good willingness'
        if (score >= 40) return 'Moderate willingness'
        return 'Low willingness'
    },
    intentColor(score) {
        if (score >= 70) return '#059669'
        if (score >= 40) return '#d97706'
        return '#dc2626'
    },
    riskColor(score) {
        if (score >= 80) return '#dc2626'
        if (score >= 60) return '#ea580c'
        if (score >= 40) return '#d97706'
        return '#059669'
    },
    formatDate(d) {
        if (!d) return '-'
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    formatOutcome(o) {
        if (!o) return '-'
        return o.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    },
    outcomeColor(o) {
        const map = {
            payment_committed: Charts.colors.emerald,
            partial_commitment: Charts.colors.amber,
            no_commitment: Charts.colors.rose,
            dispute_raised: Charts.colors.violet,
            escalation_required: Charts.colors.orange,
            callback_scheduled: Charts.colors.blue,
            not_reachable: '#8a7a65',
        }
        return map[o] || Charts.colors.indigo
    },
    outcomeBadgeClass(o) {
        const map = {
            payment_committed: 'badge-success',
            partial_commitment: 'badge-warning',
            no_commitment: 'badge-danger',
            dispute_raised: 'badge-info',
            escalation_required: 'badge-danger',
        }
        return map[o] || 'badge-muted'
    },
}
