/**
 * UploadCall — Multi-step modal for uploading an audio file and running the
 * live transcription + AI analysis pipeline.
 *
 * Steps:
 *  1. Call Details  — audio file, agent name, customer (select existing or create new)
 *  2. Processing    — live progress: upload → transcribe → analyze
 *  3. Done          — summary card with link to full call detail
 */
const UploadCallModal = {
    _customers: [],
    _selectedModel: null,

    async open() {
        // Pre-fetch customers and models in parallel
        const [custRes, modelsRes] = await Promise.all([
            API.getCustomers(),
            API.getModels(),
        ])
        this._customers = custRes.success ? custRes.data : []
        const models = modelsRes.success ? modelsRes.data.models : []
        this._selectedModel = modelsRes.success ? modelsRes.data.default : null

        App.openModal(this._renderStep1(models))
        this._bindStep1()
    },

    // ── Step 1: Form ─────────────────────────────────────────────────────────

    _renderStep1(models) {
        const customerOptions = this._customers.map(c =>
            `<option value="${c.id}">${c.name} - ${c.loanId} (${c.riskLevel})</option>`
        ).join('')

        const modelOptions = models.map(m =>
            `<option value="${m.id}" ${m.id === this._selectedModel ? 'selected' : ''}>${m.label}</option>`
        ).join('')

        return `
<div class="upload-modal">
  <div class="upload-modal-header">
    <div class="upload-step-indicator">
      <span class="upload-step active" data-step="1">1</span>
      <span class="upload-step-line"></span>
      <span class="upload-step" data-step="2">2</span>
      <span class="upload-step-line"></span>
      <span class="upload-step" data-step="3">3</span>
    </div>
    <h2 class="upload-modal-title">Upload Call Recording</h2>
    <p class="upload-modal-sub">Provide the audio file and call details to run the live AI pipeline.</p>
  </div>

  <form id="upload-call-form" novalidate>

    <!-- Audio File Drop Zone -->
    <div class="upload-dropzone" id="upload-dropzone">
      <input type="file" id="audio-file-input" accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm" hidden>
      <div class="dropzone-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
        </svg>
      </div>
      <div class="dropzone-text">
        <strong>Drop audio file here</strong>
        <span>or <button type="button" class="link-btn" id="browse-btn">browse</button></span>
      </div>
      <div class="dropzone-hint">MP3, WAV, M4A, OGG, WEBM | max 100 MB</div>
      <div class="dropzone-file-info hidden" id="file-info">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;color:var(--brand)"><path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"/></svg>
        <span id="file-name-display"></span>
        <button type="button" class="remove-file-btn" id="remove-file-btn" title="Remove">&times;</button>
      </div>
    </div>
    <div class="field-error hidden" id="file-error">Please select an audio file.</div>

    <!-- Two-column fields -->
    <div class="upload-fields-grid">

      <!-- Agent Name -->
      <div class="field-group">
        <label class="field-label" for="agent-name">Agent Name <span class="required">*</span></label>
        <input type="text" id="agent-name" class="field-input" placeholder="e.g. Priya Sharma" autocomplete="off">
        <div class="field-error hidden" id="agent-name-error">Agent name is required.</div>
      </div>

      <!-- AI Model -->
      <div class="field-group">
        <label class="field-label" for="model-select-upload">AI Model</label>
        <select id="model-select-upload" class="field-input">
          ${modelOptions}
        </select>
      </div>

    </div>

    <!-- Customer section -->
    <div class="field-group" style="margin-top:1rem">
      <label class="field-label">Customer</label>
      <div class="customer-toggle-tabs">
        <button type="button" class="cust-tab active" id="tab-existing" onclick="UploadCallModal._switchCustomerTab('existing')">Select Existing</button>
        <button type="button" class="cust-tab" id="tab-new" onclick="UploadCallModal._switchCustomerTab('new')">+ New Customer</button>
      </div>
    </div>

    <!-- Existing customer select -->
    <div id="existing-customer-panel">
      <div class="field-group">
        <label class="field-label" for="customer-select">Customer <span class="required">*</span></label>
        <select id="customer-select" class="field-input">
          <option value="">Select a customer</option>
          ${customerOptions}
        </select>
        <div class="field-error hidden" id="customer-select-error">Please select a customer.</div>
      </div>
    </div>

    <!-- New customer form -->
    <div id="new-customer-panel" class="hidden">
      <div class="new-customer-grid">
        <div class="field-group">
          <label class="field-label" for="nc-name">Full Name <span class="required">*</span></label>
          <input type="text" id="nc-name" class="field-input" placeholder="Ramesh Kumar">
        </div>
        <div class="field-group">
          <label class="field-label" for="nc-phone">Phone <span class="required">*</span></label>
          <input type="tel" id="nc-phone" class="field-input" placeholder="+91 9876543210">
        </div>
        <div class="field-group">
          <label class="field-label" for="nc-loan-id">Loan ID <span class="required">*</span></label>
          <input type="text" id="nc-loan-id" class="field-input" placeholder="LN-2024-001">
        </div>
        <div class="field-group">
          <label class="field-label" for="nc-outstanding">Outstanding (₹)</label>
          <input type="number" id="nc-outstanding" class="field-input" placeholder="150000" min="0">
        </div>
        <div class="field-group">
          <label class="field-label" for="nc-dpd">Days Past Due</label>
          <input type="number" id="nc-dpd" class="field-input" placeholder="45" min="0">
        </div>
        <div class="field-group">
          <label class="field-label" for="nc-risk">Risk Level</label>
          <select id="nc-risk" class="field-input">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      <div class="field-error hidden" id="new-customer-error"></div>
    </div>

    <div class="upload-modal-footer">
      <button type="button" class="btn btn-ghost" onclick="App.closeModal()">Cancel</button>
      <button type="submit" class="btn btn-primary" id="upload-submit-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        Start Pipeline
      </button>
    </div>

  </form>
</div>`
    },

    _switchCustomerTab(tab) {
        const existingPanel = document.getElementById('existing-customer-panel')
        const newPanel = document.getElementById('new-customer-panel')
        const tabExisting = document.getElementById('tab-existing')
        const tabNew = document.getElementById('tab-new')

        if (tab === 'existing') {
            existingPanel.classList.remove('hidden')
            newPanel.classList.add('hidden')
            tabExisting.classList.add('active')
            tabNew.classList.remove('active')
        } else {
            existingPanel.classList.add('hidden')
            newPanel.classList.remove('hidden')
            tabExisting.classList.remove('active')
            tabNew.classList.add('active')
        }
    },

    _bindStep1() {
        const dropzone = document.getElementById('upload-dropzone')
        const fileInput = document.getElementById('audio-file-input')
        const browseBtn = document.getElementById('browse-btn')
        const removeBtn = document.getElementById('remove-file-btn')
        const form = document.getElementById('upload-call-form')

        browseBtn?.addEventListener('click', () => fileInput.click())
        removeBtn?.addEventListener('click', () => this._clearFile())

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files[0]) this._setFile(e.target.files[0])
        })

        dropzone?.addEventListener('dragover', (e) => {
            e.preventDefault()
            dropzone.classList.add('drag-over')
        })
        dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'))
        dropzone?.addEventListener('drop', (e) => {
            e.preventDefault()
            dropzone.classList.remove('drag-over')
            const file = e.dataTransfer.files[0]
            if (file) this._setFile(file)
        })

        form?.addEventListener('submit', (e) => {
            e.preventDefault()
            this._submitStep1()
        })
    },

    _selectedFile: null,

    _setFile(file) {
        this._selectedFile = file
        const info = document.getElementById('file-info')
        const nameDisplay = document.getElementById('file-name-display')
        const dropzone = document.getElementById('upload-dropzone')
        const fileError = document.getElementById('file-error')

        if (nameDisplay) nameDisplay.textContent = `${file.name} (${this._formatBytes(file.size)})`
        info?.classList.remove('hidden')
        dropzone?.classList.add('has-file')
        fileError?.classList.add('hidden')
    },

    _clearFile() {
        this._selectedFile = null
        const info = document.getElementById('file-info')
        const fileInput = document.getElementById('audio-file-input')
        const dropzone = document.getElementById('upload-dropzone')
        info?.classList.add('hidden')
        dropzone?.classList.remove('has-file')
        if (fileInput) fileInput.value = ''
    },

    _formatBytes(bytes) {
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },

    async _submitStep1() {
        // Validate
        let valid = true

        const agentName = document.getElementById('agent-name')?.value.trim()
        const agentError = document.getElementById('agent-name-error')
        if (!agentName) {
            agentError?.classList.remove('hidden')
            valid = false
        } else {
            agentError?.classList.add('hidden')
        }

        if (!this._selectedFile) {
            document.getElementById('file-error')?.classList.remove('hidden')
            valid = false
        }

        const isNewCustomer = document.getElementById('new-customer-panel')?.classList.contains('hidden') === false
        let customerId = null

        if (!isNewCustomer) {
            customerId = document.getElementById('customer-select')?.value
            if (!customerId) {
                document.getElementById('customer-select-error')?.classList.remove('hidden')
                valid = false
            } else {
                document.getElementById('customer-select-error')?.classList.add('hidden')
            }
        } else {
            const ncName = document.getElementById('nc-name')?.value.trim()
            const ncPhone = document.getElementById('nc-phone')?.value.trim()
            const ncLoanId = document.getElementById('nc-loan-id')?.value.trim()
            const ncError = document.getElementById('new-customer-error')

            if (!ncName || !ncPhone || !ncLoanId) {
                if (ncError) {
                    ncError.textContent = 'Name, phone, and loan ID are required for a new customer.'
                    ncError.classList.remove('hidden')
                }
                valid = false
            } else {
                ncError?.classList.add('hidden')
            }
        }

        if (!valid) return

        const model = document.getElementById('model-select-upload')?.value || this._selectedModel

        // If new customer, create it first
        if (isNewCustomer) {
            const ncRes = await API.createCustomer({
                name: document.getElementById('nc-name').value.trim(),
                phone: document.getElementById('nc-phone').value.trim(),
                loanId: document.getElementById('nc-loan-id').value.trim(),
                outstandingAmount: parseFloat(document.getElementById('nc-outstanding').value) || 0,
                daysPastDue: parseInt(document.getElementById('nc-dpd').value) || 0,
                riskLevel: document.getElementById('nc-risk').value,
            })

            if (!ncRes.success) {
                const ncError = document.getElementById('new-customer-error')
                if (ncError) {
                    ncError.textContent = ncRes.error || 'Failed to create customer.'
                    ncError.classList.remove('hidden')
                }
                return
            }
            customerId = ncRes.data.id
        }

        // Move to step 2 and run pipeline
        this._runPipeline({ agentName, customerId, model })
    },

    // ── Step 2: Processing ────────────────────────────────────────────────────

    async _runPipeline({ agentName, customerId, model }) {
        const modalBody = document.getElementById('modal-body')
        if (!modalBody) return

        modalBody.innerHTML = this._renderStep2()

        const steps = [
            { id: 'step-upload', label: 'Uploading audio file...' },
            { id: 'step-transcribe', label: 'Transcribing with Whisper...' },
            { id: 'step-analyze', label: 'Running AI analysis pipeline...' },
        ]

        const setStepState = (stepId, state, detail = '') => {
            const el = document.getElementById(stepId)
            if (!el) return
            el.className = `pipeline-step ${state}`
            const detailEl = el.querySelector('.step-detail')
            if (detailEl && detail) detailEl.textContent = detail
        }

        let callId = null

        try {
            // Step 1: Upload
            setStepState('step-upload', 'active')
            const formData = new FormData()
            formData.append('audio', this._selectedFile)
            formData.append('customerId', customerId)
            formData.append('agentName', agentName)

            const uploadRes = await API.uploadCall(formData)
            if (!uploadRes.success) throw new Error(uploadRes.error || 'Upload failed')
            callId = uploadRes.data.id
            setStepState('step-upload', 'done', `Call ID: ${callId}`)

            // Step 2: Transcribe
            setStepState('step-transcribe', 'active')
            const transcribeRes = await API.transcribeCall(callId)
            if (!transcribeRes.success) throw new Error(transcribeRes.error || 'Transcription failed')
            const segCount = transcribeRes.data?.segmentCount ?? '?'
            setStepState('step-transcribe', 'done', `${segCount} segments extracted`)

            // Step 3: Analyze
            setStepState('step-analyze', 'active')
            const analyzeRes = await API.analyzeCall(callId, model)
            if (!analyzeRes.success) throw new Error(analyzeRes.error || 'Analysis failed')
            const outcome = analyzeRes.data?.outcome || analyzeRes.data?.analysis?.outcome || 'complete'
            setStepState('step-analyze', 'done', `Outcome: ${this._formatOutcome(outcome)}`)

            // Step 3: Show success
            this._showStep3(callId, analyzeRes.data)

        } catch (err) {
            this._showError(err.message, callId)
        }
    },

    _renderStep2() {
        return `
<div class="upload-modal">
  <div class="upload-modal-header">
    <div class="upload-step-indicator">
      <span class="upload-step done" data-step="1">1</span>
      <span class="upload-step-line active"></span>
      <span class="upload-step active" data-step="2">2</span>
      <span class="upload-step-line"></span>
      <span class="upload-step" data-step="3">3</span>
    </div>
    <h2 class="upload-modal-title">Processing Pipeline</h2>
    <p class="upload-modal-sub">Running live transcription and AI analysis.</p>
  </div>

  <div class="pipeline-steps">
    <div class="pipeline-step pending" id="step-upload">
      <div class="step-icon">
        <span class="step-spinner"></span>
        <svg class="step-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="step-content">
        <div class="step-label">Upload Audio</div>
        <div class="step-detail">Waiting...</div>
      </div>
    </div>

    <div class="pipeline-step pending" id="step-transcribe">
      <div class="step-icon">
        <span class="step-spinner"></span>
        <svg class="step-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="step-content">
        <div class="step-label">Transcribe with Whisper</div>
        <div class="step-detail">Waiting...</div>
      </div>
    </div>

    <div class="pipeline-step pending" id="step-analyze">
      <div class="step-icon">
        <span class="step-spinner"></span>
        <svg class="step-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div class="step-content">
        <div class="step-label">AI Analysis Pipeline</div>
        <div class="step-detail">Waiting...</div>
      </div>
    </div>
  </div>
</div>`
    },

    // ── Step 3: Done ──────────────────────────────────────────────────────────

    _showStep3(callId, analysisData) {
        const modalBody = document.getElementById('modal-body')
        if (!modalBody) return

        const outcome = analysisData?.outcome || analysisData?.analysis?.outcome || '-'
        const riskScore = analysisData?.riskScore ?? analysisData?.analysis?.riskScore ?? '-'
        const intentScore = analysisData?.repaymentIntent?.score ?? analysisData?.analysis?.repaymentIntent?.score ?? '-'

        modalBody.innerHTML = `
<div class="upload-modal">
  <div class="upload-modal-header">
    <div class="upload-step-indicator">
      <span class="upload-step done" data-step="1">1</span>
      <span class="upload-step-line active"></span>
      <span class="upload-step done" data-step="2">2</span>
      <span class="upload-step-line active"></span>
      <span class="upload-step done" data-step="3">3</span>
    </div>
    <div class="success-icon-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    </div>
    <h2 class="upload-modal-title">Analysis Complete</h2>
    <p class="upload-modal-sub">The call has been transcribed and fully analyzed.</p>
  </div>

  <div class="result-summary-grid">
    <div class="result-stat">
      <div class="result-stat-label">Call ID</div>
      <div class="result-stat-value" style="font-size:0.85rem;font-family:monospace">${callId}</div>
    </div>
    <div class="result-stat">
      <div class="result-stat-label">Outcome</div>
      <div class="result-stat-value">${this._formatOutcome(outcome)}</div>
    </div>
    <div class="result-stat">
      <div class="result-stat-label">Intent Score</div>
      <div class="result-stat-value">${intentScore !== '-' ? intentScore + '/100' : '-'}</div>
    </div>
    <div class="result-stat">
      <div class="result-stat-label">Risk Score</div>
      <div class="result-stat-value">${riskScore !== '-' ? riskScore + '/100' : '-'}</div>
    </div>
  </div>

  <div class="upload-modal-footer" style="justify-content:center;gap:1rem">
    <button class="btn btn-ghost" onclick="App.closeModal()">Close</button>
    <button class="btn btn-primary" onclick="App.closeModal(); App.openCallDetail('${callId}')">
      View Full Analysis
    </button>
  </div>
</div>`
    },

    _showError(message, callId) {
        const modalBody = document.getElementById('modal-body')
        if (!modalBody) return

        modalBody.innerHTML = `
<div class="upload-modal">
  <div class="upload-modal-header">
    <div class="error-icon-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </div>
    <h2 class="upload-modal-title">Pipeline Failed</h2>
    <p class="upload-modal-sub" style="color:var(--accent-rose)">${message}</p>
  </div>
  ${callId ? `<p style="text-align:center;font-size:0.8rem;color:var(--text-muted);margin-bottom:1.5rem">Call record created: <code>${callId}</code>.</p>` : ''}
  <div class="upload-modal-footer" style="justify-content:center;gap:1rem">
    <button class="btn btn-ghost" onclick="App.closeModal()">Close</button>
    <button class="btn btn-primary" onclick="UploadCallModal.open()">Try Again</button>
  </div>
</div>`
    },

    _formatOutcome(outcome) {
        const map = {
            payment_committed: 'Payment Committed',
            partial_commitment: 'Partial Commitment',
            no_commitment: 'No Commitment',
            dispute_raised: 'Dispute Raised',
            escalation_required: 'Escalation Required',
        }
        return map[outcome] || outcome?.replace(/_/g, ' ') || '-'
    },
}
