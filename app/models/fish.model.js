module.exports = (sequelize, Sequelize) => {
    return sequelize.define("fish", {
        diaryType: {
            type: Sequelize.INTEGER(4),
            defaultValue: 0,
        },
        title: {
            type: Sequelize.STRING(255),
        },
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
            type: Sequelize.DOUBLE,
            defaultValue: 0.0,
        },
        status: {
            type: Sequelize.INTEGER(2), //0-pending, 1-accept, 2-reject
            defaultValue: 0,
        },
        address: {
            type: Sequelize.STRING(255),
        },
        latitude: {
            type: Sequelize.DOUBLE
        },
        longitude: {
            type: Sequelize.DOUBLE
        },
        areaCode: {
            type: Sequelize.INTEGER(11),
            defaultValue: 0,
        },
        note: {
            type: Sequelize.STRING(1000),
            defaultValue: '',
        },
        rejectText: {
            type: Sequelize.STRING(500),
        },
        disabled: {
            type: Sequelize.INTEGER(4),
            defaultValue: 0,
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

