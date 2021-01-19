// const config = require("../config/db.local.config.js");
const config = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(
    config.DB,
    config.USER,
    config.PASSWORD,
    {
        host: config.HOST,
        dialect: config.dialect,
        operatorsAliases: false,
        pool: {
            max: config.pool.max,
            min: config.pool.min,
            acquire: config.pool.acquire,
            idle: config.pool.idle
        },
        logging: false,
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.answerComment = require("./answerComment.model")(sequelize, Sequelize);
db.competition = require("./competition.model")(sequelize, Sequelize);
db.diary = require("./diary.model")(sequelize, Sequelize);
db.diaryComment = require("./diaryComment.model")(sequelize, Sequelize);
db.emailVerification = require("./emailVerification.model")(sequelize, Sequelize);
db.fish = require("./fish.model")(sequelize, Sequelize);
db.fishImage = require("./fishImage.model")(sequelize, Sequelize);
db.fishType = require("./fishType.model")(sequelize, Sequelize);
db.notice = require("./notice.model")(sequelize, Sequelize);
db.phoneVerification = require("./phoneVerification.model")(sequelize, Sequelize);
db.post = require("./post.model")(sequelize, Sequelize);
db.postComment = require("./postComment.model")(sequelize, Sequelize);
db.postCommentReply = require("./postCommentReply.model")(sequelize, Sequelize);
db.profile = require("./profile.model")(sequelize, Sequelize);
db.question = require("./question.model")(sequelize, Sequelize);
db.quickMemo = require("./quickMemo.model")(sequelize, Sequelize);
db.report = require("./report.model")(sequelize, Sequelize);
db.style = require("./style.model")(sequelize, Sequelize);
db.term = require("./terms.model")(sequelize, Sequelize);
db.user = require("./user.model")(sequelize, Sequelize);
db.withdrawal = require("./withdrawal.model")(sequelize, Sequelize);


db.test = require("./test.model")(sequelize, Sequelize);

// db.profile.belongsTo(db.user, {foreignKey: 'id'});
db.user.hasOne(db.profile);
db.competition.hasOne(db.fishType, {sourceKey: 'fishTypeId', foreignKey: 'id'});
db.fish.hasOne(db.user, {sourceKey: 'userId', foreignKey: 'id'});
db.fish.hasOne(db.competition, {sourceKey: 'competitionId', foreignKey: 'id'});
db.fish.hasOne(db.fishType, {sourceKey: 'fishTypeId', foreignKey: 'id'});
db.fish.hasMany(db.fishImage);
db.diary.hasOne(db.competition, {sourceKey: 'competitionId', foreignKey: 'id'});
db.diary.hasOne(db.user, {sourceKey: 'userId', foreignKey: 'id'});

module.exports = db;
