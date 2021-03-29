module.exports = (sequelize, Sequelize) => {
    return sequelize.define("fishImage", {
        fishId: {
            type: Sequelize.INTEGER(21)
        },
        image: {
            type: Sequelize.STRING(200)
        },
        imageType: {
            type: Sequelize.INTEGER(4)
        }
    }, {
        timestamps: false,
        underscored: false,
    });
};
