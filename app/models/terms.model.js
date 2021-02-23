module.exports = (sequelize, Sequelize) => {
    return sequelize.define("term", {
        title: {
            type: Sequelize.STRING(30)
        },
        content: {
            type: Sequelize.TEXT
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
