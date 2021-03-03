module.exports = (sequelize, Sequelize) => {
    return sequelize.define("pushToken", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        token: {
            type: Sequelize.STRING(1024),
        },
        createdDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
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
