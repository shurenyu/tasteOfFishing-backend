module.exports = (sequelize, Sequelize) => {
    return sequelize.define("userPoint", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        content: {
            type: Sequelize.STRING(50)
        },
        point: {
            type: Sequelize.INTEGER(21)
        },
        originPoint: {
            type: Sequelize.INTEGER(21)
        },
        createdDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: false,
        underscored: false,
    });
};
