module.exports = (sequelize, Sequelize) => {
    return sequelize.define("post", {
        userId: {
            type: Sequelize.INTEGER(21)
        },
        link: {
            type: Sequelize.STRING(1024),
            defaultValue: '',
        },
        content: {
            type: Sequelize.TEXT
        },
        disabled: {
            type: Sequelize.INTEGER(4),
            defaultValue: 0,
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
