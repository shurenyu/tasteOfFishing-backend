module.exports = (sequelize, Sequelize) => {
    return sequelize.define("diary", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        competitionId: {
            type: Sequelize.INTEGER(21)
        },
        record0: {
            type: Sequelize.DOUBLE,
            defaultValue: 0,
        },
        record1: {
            type: Sequelize.DOUBLE,
            defaultValue: 0,
        },
        record2: {
            type: Sequelize.INTEGER(11),
            defaultValue: 0,
        },
        record3: {
            type: Sequelize.INTEGER(11),
            defaultValue: 0,
        },
        record4: {
            type: Sequelize.DOUBLE,
            defaultValue: 100000,
        },
        text: {
            type: Sequelize.STRING(2000)
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
