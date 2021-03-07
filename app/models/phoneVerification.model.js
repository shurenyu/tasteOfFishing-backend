module.exports = (sequelize, Sequelize) => {
    return sequelize.define("phoneVerification", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        phoneNumber: {
            type: Sequelize.STRING(20)
        },
        sessionId: {
            type: Sequelize.STRING(30)
        },
        updatedDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false,
        underscored: false,
    });
};
