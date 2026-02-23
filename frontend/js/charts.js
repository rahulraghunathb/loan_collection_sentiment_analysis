/**
 * Canvas-based chart helpers — no external dependencies
 */
const Charts = {
    colors: {
        indigo:  '#FA8112',
        emerald: '#059669',
        rose:    '#dc2626',
        amber:   '#d97706',
        blue:    '#2563eb',
        violet:  '#7c3aed',
        cyan:    '#0891b2',
        orange:  '#ea580c',
    },

    /**
     * Draw a donut chart
     */
    donut(canvasId, data, opts = {}) {
        const canvas = document.getElementById(canvasId)
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const size = Math.min(canvas.parentElement.clientWidth, opts.size || 240)

        canvas.width = size * dpr
        canvas.height = size * dpr
        canvas.style.width = size + 'px'
        canvas.style.height = size + 'px'
        ctx.scale(dpr, dpr)

        const cx = size / 2, cy = size / 2
        const radius = size / 2 - 10
        const inner = radius * 0.62
        const total = data.reduce((s, d) => s + d.value, 0)

        let startAngle = -Math.PI / 2

        data.forEach((d, i) => {
            const sliceAngle = (d.value / total) * 2 * Math.PI
            ctx.beginPath()
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle)
            ctx.arc(cx, cy, inner, startAngle + sliceAngle, startAngle, true)
            ctx.closePath()
            ctx.fillStyle = d.color || Object.values(this.colors)[i % 8]
            ctx.fill()
            startAngle += sliceAngle
        })

        // Center text
        if (opts.centerText) {
            ctx.fillStyle = '#222222'
            ctx.font = `800 ${size / 6}px Inter, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(opts.centerText, cx, cy - 6)

            if (opts.centerSub) {
                ctx.fillStyle = '#8a7a65'
                ctx.font = `500 ${size / 14}px Inter, sans-serif`
                ctx.fillText(opts.centerSub, cx, cy + size / 8)
            }
        }
    },

    /**
     * Draw a line chart
     */
    line(canvasId, datasets, labels, opts = {}) {
        const canvas = document.getElementById(canvasId)
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const w = canvas.parentElement.clientWidth
        const h = opts.height || 200

        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = w + 'px'
        canvas.style.height = h + 'px'
        ctx.scale(dpr, dpr)

        const pad = { top: 20, right: 20, bottom: 30, left: 45 }
        const chartW = w - pad.left - pad.right
        const chartH = h - pad.top - pad.bottom

        // Find y range
        let yMin = opts.yMin ?? Infinity, yMax = opts.yMax ?? -Infinity
        datasets.forEach(ds => {
            ds.data.forEach(v => {
                if (v < yMin) yMin = v
                if (v > yMax) yMax = v
            })
        })
        const yRange = yMax - yMin || 1
        yMin = Math.max(0, yMin - yRange * 0.1)
        yMax = yMax + yRange * 0.1

        // Grid lines
        ctx.strokeStyle = 'rgba(34,34,34,0.07)'
        ctx.lineWidth = 1
        for (let i = 0; i <= 4; i++) {
            const y = pad.top + (chartH * i) / 4
            ctx.beginPath()
            ctx.moveTo(pad.left, y)
            ctx.lineTo(w - pad.right, y)
            ctx.stroke()

            const val = Math.round(yMax - ((yMax - yMin) * i) / 4)
            ctx.fillStyle = '#8a7a65'
            ctx.font = '500 10px Inter, sans-serif'
            ctx.textAlign = 'right'
            ctx.fillText(val, pad.left - 8, y + 4)
        }

        // X labels
        if (labels) {
            ctx.fillStyle = '#8a7a65'
            ctx.font = '500 10px Inter, sans-serif'
            ctx.textAlign = 'center'
            const step = Math.max(1, Math.floor(labels.length / 6))
            labels.forEach((l, i) => {
                if (i % step !== 0 && i !== labels.length - 1) return
                const x = pad.left + (i / Math.max(1, labels.length - 1)) * chartW
                ctx.fillText(l, x, h - 8)
            })
        }

        // Draw lines
        datasets.forEach(ds => {
            const points = ds.data.map((v, i) => ({
                x: pad.left + (i / Math.max(1, ds.data.length - 1)) * chartW,
                y: pad.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH,
            }))

            // Area fill
            if (ds.fill) {
                ctx.beginPath()
                ctx.moveTo(points[0].x, pad.top + chartH)
                points.forEach(p => ctx.lineTo(p.x, p.y))
                ctx.lineTo(points[points.length - 1].x, pad.top + chartH)
                ctx.closePath()
                const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH)
                grad.addColorStop(0, ds.color + '30')
                grad.addColorStop(1, ds.color + '00')
                ctx.fillStyle = grad
                ctx.fill()
            }

            // Line
            ctx.beginPath()
            ctx.strokeStyle = ds.color
            ctx.lineWidth = 2.5
            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
            ctx.stroke()

            // Dots
            points.forEach(p => {
                ctx.beginPath()
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
                ctx.fillStyle = ds.color
                ctx.fill()
                ctx.beginPath()
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
                ctx.fillStyle = '#FAF3E1'
                ctx.fill()
            })
        })
    },

    /**
     * Draw a horizontal bar chart
     */
    horizontalBar(canvasId, data, opts = {}) {
        const canvas = document.getElementById(canvasId)
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const dpr = window.devicePixelRatio || 1
        const w = canvas.parentElement.clientWidth
        const h = Math.max(data.length * 40 + 20, 100)

        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = w + 'px'
        canvas.style.height = h + 'px'
        ctx.scale(dpr, dpr)

        const pad = { left: 120, right: 60 }
        const maxVal = Math.max(...data.map(d => d.value)) || 1

        data.forEach((d, i) => {
            const y = 10 + i * 40
            const barW = ((w - pad.left - pad.right) * d.value) / maxVal

            // Label
            ctx.fillStyle = '#8a7a65'
            ctx.font = '500 12px Inter, sans-serif'
            ctx.textAlign = 'right'
            ctx.textBaseline = 'middle'
            ctx.fillText(d.label, pad.left - 12, y + 14)

            // Bar
            const barRadius = 4
            ctx.beginPath()
            ctx.roundRect(pad.left, y, Math.max(barW, 2), 28, barRadius)
            ctx.fillStyle = d.color || this.colors.indigo
            ctx.fill()

            // Value
            ctx.fillStyle = '#222222'
            ctx.font = '600 11px Inter, sans-serif'
            ctx.textAlign = 'left'
            ctx.fillText(d.value, pad.left + barW + 8, y + 14)
        })
    },
}
