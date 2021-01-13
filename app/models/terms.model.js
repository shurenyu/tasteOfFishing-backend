module.exports = (sequelize, Sequelize) => {
    return sequelize.define("term", {
        content: {
            type: Sequelize.STRING(100)
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
