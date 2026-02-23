/**
 * Customer Timeline View — cross-call history with trends
 */
const CustomerTimelineView = {
    async render(container, customerId) {
        container.innerHTML = '<div class="loading-skeleton"><div class="skeleton-card"></div></div>'

        const res = await API.getCustomerTimeline(customerId)
        if (!res.success) {
            container.innerHTML = '<div class="empty-state"><h3>Customer not found</h3></div>'
            return
        }

        const { customer, calls, trends, crossCallFlags, complianceFlags } = res.data

        container.innerHTML = `
      <!-- Customer Header -->
      <div class="customer-header">
        <div class="customer-avatar">${(customer.name || '?')[0]}</div>
        <div class="customer-info">
          <h2>${customer.name}</h2>
          <div class="customer-meta">
            <div class="customer-meta-item"><strong>Loan:</strong> ${customer.loanId}</div>
            <div class="customer-meta-item"><strong>Outstanding:</strong> ₹${(customer.outstandingAmount || 0).toLocaleString('en-IN')}</div>
            <div class="customer-meta-item"><strong>DPD:</strong> ${customer.daysPastDue} days</div>
            <div class="customer-meta-item"><strong>Calls:</strong> ${calls.length}</div>
          </div>
        </div>
        <div>
          <span class="badge badge-${customer.riskLevel === 'critical' ? 'danger' : customer.riskLevel === 'high' ? 'danger' : customer.riskLevel === 'medium' ? 'warning' : 'success'}" style="font-size:0.85rem;padding:6px 16px">
            ${customer.riskLevel.toUpperCase()} RISK
          </span>
        </div>
      </div>

      <!-- Trends -->
      <div class="dashboard-grid mb-6">
        <div class="card">
          <div class="card-header"><div class="card-title">Intent Trend</div></div>
          <div class="chart-container" style="aspect-ratio:auto;height:200px">
            <canvas id="chart-intent-trend"></canvas>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">Risk Trajectory</div></div>
          <div class="chart-container" style="aspect-ratio:auto;height:200px">
            <canvas id="chart-risk-trend"></canvas>
          </div>
        </div>
      </div>

      <!-- Cross-Call & Compliance Summary -->
      ${(crossCallFlags.length || complianceFlags.length) ? `
        <div class="dashboard-grid mb-6">
          ${crossCallFlags.length ? `
            <div class="card">
              <div class="card-header">
                <div class="card-title">⚠ Cross-Call Inconsistencies (${crossCallFlags.length})</div>
              </div>
              ${crossCallFlags.map(f => `
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
          ${complianceFlags.length ? `
            <div class="card">
              <div class="card-header">
                <div class="card-title">🛡 Compliance Issues (${complianceFlags.length})</div>
              </div>
              ${complianceFlags.map(f => `
                <div class="compliance-alert">
                  <div class="alert-header">
                    <span class="alert-type">${f.type.replace(/_/g, ' ')}</span>
                    <span class="badge badge-${f.severity === 'high' ? 'danger' : 'warning'}">${f.severity}</span>
                  </div>
                  <div class="alert-evidence">"${f.evidence}"</div>
                  <div class="text-muted" style="font-size:0.7rem;margin-top:0.5rem">Call: ${f.callId} · ${DashboardView.formatDate(f.date)}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Call Timeline -->
      <div class="section-header">
        <h3 class="section-title">Call History</h3>
        <span class="text-muted">${calls.length} call${calls.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="timeline">
        ${calls.map(c => {
            const a = c.analysis || {}
            const intent = a.repaymentIntent || {}
            return `
          <div class="timeline-item">
            <div class="timeline-dot" style="background:${DashboardView.outcomeColor(a.outcome)}"></div>
            <div class="timeline-content" onclick="App.openCallDetail('${c.id}')">
              <div class="timeline-date">${DashboardView.formatDate(c.callDate)} · Agent: ${c.agentName}</div>
              <div class="timeline-call-title">
                <span class="badge ${DashboardView.outcomeBadgeClass(a.outcome)}">${DashboardView.formatOutcome(a.outcome)}</span>
                <span class="intent-gauge" style="margin-left:auto">
                  <span class="gauge-bar"><span class="gauge-fill" style="width:${intent.score || 0}%;background:${DashboardView.intentColor(intent.score || 0)}"></span></span>
                  <span class="gauge-value" style="color:${DashboardView.intentColor(intent.score || 0)}">${intent.score || 0}</span>
                </span>
              </div>
              <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6;margin-top:0.5rem">${a.summary || 'No summary'}</p>
              ${(a.riskFlags && a.riskFlags.length) ? `
                <div class="tag-list mt-4">
                  ${a.riskFlags.map(r => `<span class="tag" style="border-color:rgba(251,113,133,0.2);color:var(--accent-rose)">${r}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>`
        }).join('')}
      </div>
    `

        // Render trend charts
        this.renderTrends(trends)
    },

    renderTrends(trends) {
        if (!trends) return

        // Intent trend
        if (trends.intent && trends.intent.length > 1) {
            Charts.line('chart-intent-trend',
                [{ data: trends.intent.map(t => t.score), color: Charts.colors.emerald, fill: true }],
                trends.intent.map(t => DashboardView.formatDate(t.date)),
                { yMin: 0, yMax: 100, height: 200 }
            )
        }

        // Risk trend
        if (trends.risk && trends.risk.length > 1) {
            Charts.line('chart-risk-trend',
                [{ data: trends.risk.map(t => t.riskScore), color: Charts.colors.rose, fill: true }],
                trends.risk.map(t => DashboardView.formatDate(t.date)),
                { yMin: 0, yMax: 100, height: 200 }
            )
        }
    },
}
