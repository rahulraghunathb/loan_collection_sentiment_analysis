/**
 * Dashboard View — KPIs, charts, recent calls
 */
const DashboardView = {
    async render(container) {
        container.innerHTML = '<div class="loading-skeleton"><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div>'

        const res = await API.getDashboardStats()
        if (!res.success) {
            container.innerHTML = '<div class="empty-state"><h3>Failed to load dashboard</h3></div>'
            return
        }

        const { kpis, outcomeDistribution, riskDistribution, recentCalls, callsByDate } = res.data

        container.innerHTML = `
      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card accent-blue">
          <div class="kpi-label">Total Calls</div>
          <div class="kpi-value">${kpis.totalCalls}</div>
          <div class="kpi-sub">${kpis.analyzedCalls} analyzed</div>
        </div>
        <div class="kpi-card accent-emerald">
          <div class="kpi-label">Avg Intent Score</div>
          <div class="kpi-value">${kpis.avgIntentScore}<span style="font-size:0.5em;color:var(--text-muted)">/100</span></div>
          <div class="kpi-sub">${this.intentLabel(kpis.avgIntentScore)}</div>
        </div>
        <div class="kpi-card accent-rose">
          <div class="kpi-label">Compliance Flags</div>
          <div class="kpi-value">${kpis.totalComplianceFlags}</div>
          <div class="kpi-sub">${kpis.highSeverityFlags} high severity</div>
        </div>
        <div class="kpi-card accent-amber">
          <div class="kpi-label">Active PTPs</div>
          <div class="kpi-value">${kpis.activePTPs}</div>
          <div class="kpi-sub">${kpis.brokenPromises} broken promises</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Avg Risk Score</div>
          <div class="kpi-value text-${kpis.avgRiskScore > 70 ? 'rose' : kpis.avgRiskScore > 40 ? 'amber' : 'emerald'}">${kpis.avgRiskScore}</div>
          <div class="risk-meter mt-4"><div class="risk-meter-fill" style="width:${kpis.avgRiskScore}%;background:${this.riskColor(kpis.avgRiskScore)}"></div></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Inconsistencies</div>
          <div class="kpi-value text-amber">${kpis.totalInconsistencies}</div>
          <div class="kpi-sub">Cross-call contradictions</div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Outcome Distribution</div>
          </div>
          <div class="chart-container square">
            <canvas id="chart-outcomes"></canvas>
          </div>
          <div id="chart-outcomes-legend" class="chart-legend"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <div class="card-title">Risk Distribution</div>
          </div>
          <div class="chart-container" style="aspect-ratio:auto;height:220px;">
            <canvas id="chart-risk"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Calls -->
      <div class="card full-width">
        <div class="card-header">
          <div class="card-title">Recent Calls</div>
          <a href="#calls" class="btn btn-ghost">View All</a>
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
        <td><span style="color:${this.riskColor(c.analysis?.riskScore || 50)};font-weight:700">${c.analysis?.riskScore || '—'}</span></td>
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
        if (!d) return '—'
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    formatOutcome(o) {
        if (!o) return '—'
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
