module.exports = (sequelize, Sequelize) => {
    return sequelize.define("fish", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        competitionId: {
            type: Sequelize.INTEGER(21)
        },
        fishTypeId: {
            type: Sequelize.INTEGER(21)
        },
        fishWidth: {
            type: Sequelize.DOUBLE
        },
        status: {
            type: Sequelize.INTEGER(2),
            defaultValue: 0,
        },
        note: {
            type: Sequelize.STRING(100),
        },
        registerDate: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        },
    }, {
        timestamps: false,
        underscored: false,
    });
};

