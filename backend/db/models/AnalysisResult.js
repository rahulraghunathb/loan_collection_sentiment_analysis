const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const AnalysisResult = sequelize.define('AnalysisResult', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        callId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        repaymentIntent: {
            type: DataTypes.JSON,
            // { score: 0-100, level: 'high'|'medium'|'low'|'none', evidence: [...], signals: [...] }
            defaultValue: {},
        },
        promiseToPay: {
            type: DataTypes.JSON,
            // { detected: bool, amount: number|null, date: string|null, installment: bool, confidence: 0-100, details: string }
            defaultValue: {},
        },
        complianceFlags: {
            type: DataTypes.JSON,
            // [{ type: string, severity: 'low'|'medium'|'high', evidence: string, timestamp: string }]
            defaultValue: [],
        },
        crossCallFlags: {
            type: DataTypes.JSON,
            // [{ field: string, previousClaim: string, currentClaim: string, callDate: string }]
            defaultValue: [],
        },
        outcome: {
            type: DataTypes.ENUM(
                'payment_committed',
                'partial_commitment',
                'no_commitment',
                'dispute_raised',
                'escalation_required',
                'callback_scheduled',
                'not_reachable'
            ),
            defaultValue: 'no_commitment',
        },
        summary: {
            type: DataTypes.TEXT,
            defaultValue: '',
        },
        keyPoints: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
        nextActions: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
        riskFlags: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
        riskScore: {
            type: DataTypes.FLOAT, // 0-100
            defaultValue: 50,
        },
    }, {
        tableName: 'analysis_results',
        timestamps: true,
    })

    return AnalysisResult
}
