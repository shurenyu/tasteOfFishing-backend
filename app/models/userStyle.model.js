module.exports = (sequelize, Sequelize) => {
    return sequelize.define("userStyle", {
        name: {
            type: Sequelize.STRING(32),
        },
    }, {
        timestamps: false,
        underscored: false,
    });
};
