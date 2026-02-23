const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
    const TranscriptSegment = sequelize.define('TranscriptSegment', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        callId: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        speaker: {
            type: DataTypes.ENUM('agent', 'customer'),
            allowNull: false,
        },
        startTime: {
            type: DataTypes.FLOAT, // seconds
            defaultValue: 0,
        },
        endTime: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
    }, {
        tableName: 'transcript_segments',
        timestamps: true,
    })

    return TranscriptSegment
}
