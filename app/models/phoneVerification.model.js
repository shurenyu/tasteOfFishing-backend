module.exports = (sequelize, Sequelize) => {
    return sequelize.define("phoneVerification", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        code: {
            type: Sequelize.STRING(8)
        },
        updatedDate: {
            type: Sequelize.DATE
        }
    }, {
        timestamps: false,
        underscored: false,
    });
};
