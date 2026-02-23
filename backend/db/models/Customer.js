const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const Customer = sequelize.define('Customer', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        loanId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        loanAmount: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        outstandingAmount: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        riskLevel: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
            defaultValue: 'medium',
        },
        daysPastDue: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        totalCalls: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    }, {
        tableName: 'customers',
        timestamps: true,
    })

    return Customer
}
