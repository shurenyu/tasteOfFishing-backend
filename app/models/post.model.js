module.exports = (sequelize, Sequelize) => {
    return sequelize.define("post", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        link: {
            type: Sequelize.STRING(1024)
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
