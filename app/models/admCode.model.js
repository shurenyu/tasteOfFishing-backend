module.exports = (sequelize, Sequelize) => {
    return sequelize.define("admCode", {
        admCode: {
            type: Sequelize.BIGINT(20),
        },
        addr1: {
            type: Sequelize.STRING(30),
        },
        addr2: {
            type: Sequelize.STRING(30),
        },
        addr3: {
            type: Sequelize.STRING(30),
        },
        nx: {
            type: Sequelize.INTEGER(11),
        },
        ny: {
            type: Sequelize.INTEGER(11),
        },
        latitude: {
            type: Sequelize.DOUBLE
        },
        longitude: {
            type: Sequelize.DOUBLE
        },
        updatedDate: {
            type: Sequelize.STRING(25),
        }
    }, {
        timestamps: false,
        underscored: false,
    });
};
