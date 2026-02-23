/**
 * API Client — fetch wrapper for backend endpoints
 *
 * BASE URL strategy:
 *  - When the page is served by the Express backend (port 3000) a relative
 *    path is used so the app works behind any reverse proxy without config.
 *  - When the page is served by a dev tool on a different port (e.g. VS Code
 *    Live Server on 5500) we point directly at the Express server so API
 *    calls are not swallowed by the dev server.
 */
const API = {
    BASE: (() => {
        const expressPort = 3000
        const { hostname, port } = window.location
        const isExpressOrigin = !port || port === String(expressPort)
        return isExpressOrigin ? '/api' : `http://${hostname}:${expressPort}/api`
    })(),

    async get(endpoint) {
        try {
            const res = await fetch(`${this.BASE}${endpoint}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return await res.json()
        } catch (err) {
            console.error(`API GET ${endpoint}:`, err)
            return { success: false, error: err.message }
        }
    },

    async post(endpoint, data) {
        try {
            const res = await fetch(`${this.BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: data !== undefined ? JSON.stringify(data) : undefined,
            })
            const json = await res.json()
            if (!res.ok) {
                const msg = json?.error?.detail || json?.error?.message || json?.message || `HTTP ${res.status}`
                throw new Error(msg)
            }
            return json
        } catch (err) {
            console.error(`API POST ${endpoint}:`, err)
            return { success: false, error: err.message }
        }
    },

    // Dashboard
    getDashboardStats() { return this.get('/dashboard/stats') },

    // Calls
    getCalls(params = {}) {
        const qs = new URLSearchParams(params).toString()
        return this.get(`/calls${qs ? '?' + qs : ''}`)
    },
    getCall(id) { return this.get(`/calls/${id}`) },
    transcribeCall(id) { return this.post(`/calls/${id}/transcribe`) },
    analyzeCall(id, model) { return this.post(`/calls/${id}/analyze`, model ? { model } : {}) },

    // File upload (multipart/form-data)
    async upload(endpoint, formData) {
        try {
            const res = await fetch(`${this.BASE}${endpoint}`, {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return await res.json()
        } catch (err) {
            console.error(`API UPLOAD ${endpoint}:`, err)
            return { success: false, error: err.message }
        }
    },

    uploadCall(formData) { return this.upload('/calls/upload', formData) },

    // Customers
    getCustomers(params = {}) {
        const qs = new URLSearchParams(params).toString()
        return this.get(`/customers${qs ? '?' + qs : ''}`)
    },
    getCustomerTimeline(id) { return this.get(`/customers/${id}/timeline`) },
    createCustomer(data) { return this.post('/customers', data) },

    // Models
    getModels() { return this.get('/models') },

    // Health / runtime config
    getHealth() {
        const base = this.BASE.replace('/api', '')
        return fetch(`${base}/health/ready`).then(r => r.json()).catch(() => null)
    },
}
