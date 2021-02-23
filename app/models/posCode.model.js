module.exports = (sequelize, Sequelize) => {
    return sequelize.define("posCode", {
        code: {
            type: Sequelize.INTEGER(11)
        },
        name: {
            type: Sequelize.STRING(30),
        },
        latitude: {
            type: Sequelize.DOUBLE
        },
        longitude: {
            type: Sequelize.DOUBLE
        },
        address: {
            type: Sequelize.STRING(255),
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
