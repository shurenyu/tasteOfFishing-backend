module.exports = (sequelize, Sequelize) => {
    return sequelize.define("post", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        image: {
            type: Sequelize.STRING(100)
        },
        content: {
            type: Sequelize.STRING(3000)
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
