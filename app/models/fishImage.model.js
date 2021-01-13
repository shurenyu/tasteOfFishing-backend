module.exports = (sequelize, Sequelize) => {
    return sequelize.define("fishImage", {
        fishId: {
            type: Sequelize.INTEGER(21)
        },
        image: {
            type: Sequelize.STRING(100)
        }
    }, {
        timestamps: false,
        underscored: false,
    });
};
