module.exports = (sequelize, Sequelize) => {
    return sequelize.define("userStyle", {
        name: {
            type: Sequelize.STRING(32),
        },
        attendLimit: {
            type: Sequelize.INTEGER(11),
            defaultValue: 0,
        },
        championLimit: {
            type: Sequelize.INTEGER(11),
            defaultValue: 0,
        },
    }, {
        timestamps: false,
        underscored: false,
    });
};
