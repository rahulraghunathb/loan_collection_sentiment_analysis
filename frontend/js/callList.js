/**
 * Call List View — filterable table of all calls
 */
const CallListView = {
    currentFilter: 'all',

    async render(container) {
        container.innerHTML = `
          <div class="loading-skeleton">
            <div class="skeleton-card"></div><div class="skeleton-card"></div>
            <div class="skeleton-card"></div><div class="skeleton-card"></div>
            <div class="skeleton-card"></div><div class="skeleton-card"></div>
          </div>`

        const res = await API.getCalls()
        if (!res.success) {
            container.innerHTML = '<div class="empty-state"><h3>Failed to load calls</h3></div>'
            return
        }

        const calls = res.data

        container.innerHTML = `
      <div class="flex-between mb-4">
        <div class="filters-bar" style="margin-bottom:0">
          <button class="filter-chip active" data-filter="all" onclick="CallListView.filter('all', this)">All Calls</button>
          <button class="filter-chip" data-filter="payment_committed" onclick="CallListView.filter('payment_committed', this)">Committed</button>
          <button class="filter-chip" data-filter="partial_commitment" onclick="CallListView.filter('partial_commitment', this)">Partial</button>
          <button class="filter-chip" data-filter="no_commitment" onclick="CallListView.filter('no_commitment', this)">No Commitment</button>
          <button class="filter-chip" data-filter="dispute_raised" onclick="CallListView.filter('dispute_raised', this)">Dispute</button>
          <button class="filter-chip" data-filter="escalation_required" onclick="CallListView.filter('escalation_required', this)">Escalation</button>
        </div>
        <button class="btn btn-primary" onclick="UploadCallModal.open()" style="white-space:nowrap;flex-shrink:0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;margin-right:6px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          Upload Call
        </button>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Call ID</th>
              <th>Customer</th>
              <th>Agent</th>
              <th>Date</th>
              <th>Duration</th>
              <th>Intent</th>
              <th>Outcome</th>
              <th>Risk</th>
              <th>PTP</th>
            </tr>
          </thead>
          <tbody id="calls-table-body"></tbody>
        </table>
      </div>
    `

        this.allCalls = calls
        this.renderTable(calls)
    },

    renderTable(calls) {
        const tbody = document.getElementById('calls-table-body')
        if (!tbody) return

        if (!calls.length) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state" style="padding:3rem"><h3>No calls found</h3></td></tr>'
            return
        }

        tbody.innerHTML = calls.map(c => {
            const intent = c.analysis?.repaymentIntent
            const score = intent?.score ?? 0
            const ptp = c.analysis?.promiseToPay
            const flags = c.analysis?.complianceFlags || []

            return `
      <tr onclick="App.openCallDetail('${c.id}')">
        <td><code style="color:var(--accent-indigo);font-size:0.75rem">${c.id}</code></td>
        <td>
          <strong>${c.customer?.name || 'Unknown'}</strong>
          ${c.customer?.riskLevel ? `<span class="badge badge-${c.customer.riskLevel === 'critical' ? 'danger' : c.customer.riskLevel === 'high' ? 'danger' : c.customer.riskLevel === 'medium' ? 'warning' : 'success'}" style="margin-left:4px">${c.customer.riskLevel}</span>` : ''}
        </td>
        <td class="text-muted">${c.agentName}</td>
        <td>${DashboardView.formatDate(c.callDate)}</td>
        <td class="text-muted">${this.formatDuration(c.duration)}</td>
        <td>
          <div class="intent-gauge">
            <div class="gauge-bar"><div class="gauge-fill" style="width:${score}%;background:${DashboardView.intentColor(score)}"></div></div>
            <span class="gauge-value" style="color:${DashboardView.intentColor(score)}">${score}</span>
          </div>
        </td>
        <td><span class="badge ${DashboardView.outcomeBadgeClass(c.analysis?.outcome)}">${DashboardView.formatOutcome(c.analysis?.outcome)}</span></td>
        <td><span style="color:${DashboardView.riskColor(c.analysis?.riskScore || 50)};font-weight:700">${c.analysis?.riskScore || '-'}</span></td>
        <td>${ptp?.detected ? `<span class="badge badge-info">Rs. ${this.formatAmount(ptp.amount)}</span>` : '<span class="text-muted">-</span>'}</td>
      </tr>`
        }).join('')
    },

    filter(outcome, btn) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
        btn.classList.add('active')

        if (outcome === 'all') {
            this.renderTable(this.allCalls)
        } else {
            this.renderTable(this.allCalls.filter(c => c.analysis?.outcome === outcome))
        }
    },

    formatDuration(seconds) {
        if (!seconds) return '-'
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${String(s).padStart(2, '0')}`
    },

    formatAmount(amt) {
        if (!amt) return '-'
        if (amt >= 100000) return (amt / 100000).toFixed(1) + 'L'
        if (amt >= 1000) return (amt / 1000).toFixed(0) + 'K'
        return amt.toString()
    },
}
