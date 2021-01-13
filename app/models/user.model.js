module.exports = (sequelize, Sequelize) => {
    return sequelize.define("user", {
        type: {
            type: Sequelize.INTEGER(1)
        },
        name: {
            type: Sequelize.STRING(100)
        },
        email: {
            type: Sequelize.STRING(50)
        },
        password: {
            type: Sequelize.STRING(256)
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
