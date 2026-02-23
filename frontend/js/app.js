/**
 * App Router & State Management
 */
const App = {
    currentPage: 'dashboard',

    _pipelineLocked: false,

    init() {
        this.bindNavigation()
        this.bindSidebar()
        this.bindModal()
        this.handleRoute()
        window.addEventListener('hashchange', () => {
            if (this._pipelineLocked) return
            this.handleRoute()
        })
    },

    lockForPipeline()   { this._pipelineLocked = true  },
    unlockForPipeline() { this._pipelineLocked = false },

    bindNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Let hash change handle it
            })
        })
    },

    bindSidebar() {
        const toggle = document.getElementById('sidebar-toggle')
        const sidebar = document.getElementById('sidebar')
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => sidebar.classList.toggle('open'))
            // Close on content click (mobile)
            document.getElementById('main-content')?.addEventListener('click', () => {
                if (window.innerWidth <= 768) sidebar.classList.remove('open')
            })
        }
    },

    bindModal() {
        const overlay = document.getElementById('modal-overlay')
        const closeBtn = document.getElementById('modal-close')
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal())
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.closeModal()
        })
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal()
        })
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard'
        const parts = hash.split('/')
        const page = parts[0]
        const id = parts[1]

        this.setActivePage(page)

        const container = document.getElementById('page-content')
        const title = document.getElementById('page-title')
        const subtitle = document.getElementById('page-subtitle')

        switch (page) {
            case 'dashboard':
                title.textContent = 'Dashboard'
                subtitle.textContent = 'Real-time collection intelligence overview'
                DashboardView.render(container)
                break

            case 'calls':
                title.textContent = 'Call Analysis'
                subtitle.textContent = 'All collection calls with AI analysis'
                CallListView.render(container)
                break

            case 'call':
                title.textContent = 'Call Detail'
                subtitle.textContent = `Analysis for ${id || ''}`
                CallDetailView.render(container, id)
                break

            case 'customers':
                title.textContent = 'Customers'
                subtitle.textContent = 'Borrower profiles and risk overview'
                this.renderCustomersPage(container)
                break

            case 'customer':
                title.textContent = 'Customer Timeline'
                subtitle.textContent = `Cross-call analysis for ${id || ''}`
                CustomerTimelineView.render(container, id)
                break

            case 'compliance':
                title.textContent = 'Compliance Monitor'
                subtitle.textContent = 'Agent compliance violations and alerts'
                this.renderCompliancePage(container)
                break

            default:
                title.textContent = 'Dashboard'
                subtitle.textContent = 'Real-time collection intelligence overview'
                DashboardView.render(container)
        }
    },

    setActivePage(page) {
        const pageMap = { call: 'calls', customer: 'customers' }
        const navPage = pageMap[page] || page
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === navPage)
        })
    },

    // ── Customers Page ──────────────────────────
    async renderCustomersPage(container) {
        container.innerHTML = `
          <div class="loading-skeleton">
            <div class="skeleton-card"></div><div class="skeleton-card"></div>
            <div class="skeleton-card"></div><div class="skeleton-card"></div>
          </div>`
        const res = await API.getCustomers()
        if (!res.success) {
            container.innerHTML = '<div class="empty-state"><h3>Failed to load customers</h3></div>'
            return
        }

        const customers = res.data
        container.innerHTML = `
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Loan ID</th>
              <th>Outstanding</th>
              <th>DPD</th>
              <th>Risk</th>
              <th>Total Calls</th>
              <th>Last Intent</th>
              <th>Last Outcome</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map(c => {
            const intentScore = c.latestCall?.intentScore ?? 0
            return `
              <tr onclick="App.openCustomerTimeline('${c.id}')">
                <td><strong>${c.name}</strong><div class="text-muted" style="font-size:0.7rem">${c.phone}</div></td>
                <td><code style="font-size:0.75rem;color:var(--accent-indigo)">${c.loanId}</code></td>
                <td><strong>Rs. ${(c.outstandingAmount || 0).toLocaleString('en-IN')}</strong></td>
                <td><span style="color:${c.daysPastDue > 90 ? 'var(--accent-rose)' : c.daysPastDue > 30 ? 'var(--accent-amber)' : 'var(--accent-emerald)'};font-weight:700">${c.daysPastDue}</span></td>
                <td><span class="badge badge-${c.riskLevel === 'critical' ? 'danger' : c.riskLevel === 'high' ? 'danger' : c.riskLevel === 'medium' ? 'warning' : 'success'}">${c.riskLevel}</span></td>
                <td>${c.totalCalls}</td>
                <td>
                  <div class="intent-gauge">
                    <div class="gauge-bar"><div class="gauge-fill" style="width:${intentScore}%;background:${DashboardView.intentColor(intentScore)}"></div></div>
                    <span class="gauge-value" style="color:${DashboardView.intentColor(intentScore)}">${intentScore}</span>
                  </div>
                </td>
                <td>${c.latestCall?.outcome ? `<span class="badge ${DashboardView.outcomeBadgeClass(c.latestCall.outcome)}">${DashboardView.formatOutcome(c.latestCall.outcome)}</span>` : '-'}</td>
              </tr>`
        }).join('')}
          </tbody>
        </table>
      </div>
    `
    },

    // ── Compliance Page ─────────────────────────
    async renderCompliancePage(container) {
        container.innerHTML = `
          <div class="loading-skeleton">
            <div class="skeleton-card"></div><div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>`
        const res = await API.getCalls()
        if (!res.success) {
            container.innerHTML = '<div class="empty-state"><h3>Failed to load data</h3></div>'
            return
        }

        const callsWithFlags = res.data.filter(c => c.analysis?.complianceFlags?.length > 0)
        const allFlags = callsWithFlags.flatMap(c =>
            c.analysis.complianceFlags.map(f => ({ ...f, callId: c.id, agentName: c.agentName, customerName: c.customer?.name, callDate: c.callDate }))
        )

        container.innerHTML = `
      <div class="kpi-grid mb-6">
        <div class="kpi-card accent-rose">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="kpi-label">Total Violations</div>
          <div class="kpi-value text-rose">${allFlags.length}</div>
          <div class="kpi-sub">${callsWithFlags.length} call${callsWithFlags.length !== 1 ? 's' : ''} flagged</div>
        </div>
        <div class="kpi-card accent-amber">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="kpi-label">High Severity</div>
          <div class="kpi-value text-amber">${allFlags.filter(f => f.severity === 'high').length}</div>
          <div class="kpi-sub">Require immediate review</div>
        </div>
        <div class="kpi-card accent-emerald">
          <div class="kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <div class="kpi-label">Clean Calls</div>
          <div class="kpi-value text-emerald">${res.data.length - callsWithFlags.length}</div>
          <div class="kpi-sub">No violations detected</div>
        </div>
      </div>

      ${allFlags.length ? `
        <div class="section-header"><h3 class="section-title">Compliance Violations</h3></div>
        ${allFlags.map(f => `
          <div class="compliance-alert" onclick="App.openCallDetail('${f.callId}')" style="cursor:pointer">
            <div class="alert-header">
              <span class="alert-type">${f.type.replace(/_/g, ' ')}</span>
              <div style="display:flex;gap:0.5rem;align-items:center">
                <span class="badge badge-${f.severity === 'high' ? 'danger' : f.severity === 'medium' ? 'warning' : 'info'}">${f.severity}</span>
              </div>
            </div>
            <div class="alert-evidence">"${f.evidence}"</div>
            <div class="text-muted" style="font-size:0.75rem;margin-top:0.75rem">
              Agent: <strong>${f.agentName}</strong> | Customer: <strong>${f.customerName || '-'}</strong> | ${DashboardView.formatDate(f.callDate)} | <code>${f.callId}</code>
            </div>
          </div>
        `).join('')}
      ` : '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg><h3>All Clear</h3><p>No compliance violations detected across all analyzed calls.</p></div>'}
    `
    },

    // ── Mode Badge ──────────────────────────────
    async initModeBadge() {
        const badge = document.getElementById('mode-badge')
        const label = document.getElementById('mode-label')
        const dot   = badge?.querySelector('.pulse-dot')
        if (!badge || !label) return

        const health = await API.getHealth()
        const isDemo = health?.app?.demoMode ?? true

        if (isDemo) {
            label.textContent = 'Demo Mode'
            badge.style.color = 'var(--accent-emerald)'
            if (dot) dot.style.background = 'var(--accent-emerald)'
        } else {
            label.textContent = 'Live'
            badge.style.color = 'var(--brand)'
            if (dot) dot.style.background = 'var(--brand)'
        }
    },

    // ── Navigation Helpers ──────────────────────
    openCallDetail(callId) {
        this.closeModal()
        window.location.hash = `call/${callId}`
    },

    openCustomerTimeline(customerId) {
        this.closeModal()
        window.location.hash = `customer/${customerId}`
    },

    openModal(contentHtml) {
        const overlay = document.getElementById('modal-overlay')
        const body = document.getElementById('modal-body')
        if (overlay && body) {
            body.innerHTML = contentHtml
            overlay.classList.remove('hidden')
        }
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay')
        if (overlay) overlay.classList.add('hidden')
    },
}

// Boot
document.addEventListener('DOMContentLoaded', () => {
    App.init()
    App.initModeBadge()
})
