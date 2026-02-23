const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Call = sequelize.define('Call', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        customerId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        audioUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        duration: {
            type: DataTypes.INTEGER, // seconds
            defaultValue: 0,
        },
        agentName: {
            type: DataTypes.STRING,
            defaultValue: 'Unknown Agent',
        },
        callDate: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        status: {
            type: DataTypes.ENUM('pending', 'transcribed', 'analyzed', 'failed'),
            defaultValue: 'pending',
        },
    }, {
        tableName: 'calls',
        timestamps: true,
    })

    return Call
}
