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
        deviation: {
            type: Sequelize.DOUBLE
        },
        registerDate: {
            type: Sequelize.DATE,
        },
    }, {
        timestamps: false,
        underscored: false,
    });
};

