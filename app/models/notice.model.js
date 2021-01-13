module.exports = (sequelize, Sequelize) => {
    return sequelize.define("notice", {
        content: {
            type: Sequelize.STRING(2000),
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
