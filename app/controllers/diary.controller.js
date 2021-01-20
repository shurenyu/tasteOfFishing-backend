const db = require("../models");
const Fish = db.fish;
const Diary = db.diary;
const DiaryComment = db.diaryComment;
const Competition = db.competition;
const FishImage = db.fishImage;
const User = db.user;
const Profile = db.profile;
const Op = db.Sequelize.Op;

exports.registerDiary = (req, res) => {
    const newDiary = {
        userId: req.body.userId,
        competitionId: req.body.competitionId,
        createdDate: new Date(),
    }

    Diary.create(newDiary)
        .then(data => {
            return res.status(200).send({result: 'DIARY_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.getDiariesByUser = (req, res) => {
    Competition.hasMany(Fish);

    const userId = req.body.userId;

    Diary.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        where: {userId: userId},
        attributes: ['id'],
        include: [{
            model: Competition,
            where: {
                endDate: {
                    [Op.lt]: (new Date()).getTime()
                }
            },
            attributes: ['id', 'name', 'description'],
            include: [{
                limit: req.body.fishLimit || 1000000,
                model: Fish,
                order: [['fishWidth', 'DESC']],
                where: {
                    userId: userId
                }
            }]
        }]
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

/**
 * Get Ranking of the competition
 * @param req keys: {competitionId, limit}
 * @param res
 * @returns {Promise<void>}
 */
exports.getDiaryByCompetition = async (req, res) => {
    User.hasMany(Fish);

    try {
        const competitionId = req.body.competitionId;
        const limit = req.body.limit;

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        let order = [];
        let attributes = [];
        if (competition.mode === 0) {
            order = [['record0', 'DESC']];
            attributes = ['id', 'record0',
                [db.Sequelize.literal('(RANK() OVER (ORDER BY record0 DESC))'), 'rank']
            ]
        }
        if (competition.mode === 1) {
            order = [['record1', 'DESC']];
            attributes = ['id', 'record1',
                [db.Sequelize.literal('(RANK() OVER (ORDER BY record1 DESC))'), 'rank']
            ]
        }
        if (competition.mode === 2) {
            order = [['record2', 'DESC']];
            attributes = ['id', 'record2',
                [db.Sequelize.literal('(RANK() OVER (ORDER BY record2 DESC))'), 'rank']
            ]
        }
        if (competition.mode === 3) {
            order = [['record3', 'DESC']];
            attributes = ['id', 'record3',
                [db.Sequelize.literal('(RANK() OVER (ORDER BY record3 DESC))'), 'rank']
            ]
        }
        if (competition.mode === 4) {
            order = [['record4', 'ASC']];
            attributes = ['id', 'record4',
                [db.Sequelize.literal('(RANK() OVER (ORDER BY record4 DESC))'), 'rank']
            ]
        }

        const data = await Diary.findAll({
            limit: limit || 1000000,
            order: order,
            where: {
                competitionId: competitionId,
            },
            attributes: attributes,
            include: [{
                model: User,
                attributes: ['id'],
                include: [{
                    model: Profile,
                    attributes: ['id', 'username', 'style']
                }, {
                    model: Fish,
                    limit: 1,
                    order: [['fishWidth', 'DESC']],
                    where: {
                        competitionId: competitionId,
                    },
                    attributes: ['id', 'fishTypeId', 'fishWidth']
                }]
            }]
        });

        return res.status(200).send({result: data});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

/**
 *
 * @param req keys: {competitionId}
 * @param res
 * @returns {Promise<void>}
 */
exports.getWinners = async (req, res) => {
    Diary.hasOne(User);
    User.belongsTo(Diary);

    try {
        const competitionId = req.body.competitionId;

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        let data = [];

        if (competition.mode === 0) {
            data = await Diary.findAll({
                limit: 3,
                order: [['record0', 'DESC']],
                where: {competitionId: competitionId},
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }],
            });
        } else if (competition.mode === 1) {
            data = await Diary.findAll({
                order: [['record1', 'DESC']],
                where: {
                    competitionId: competitionId,
                    record1: {[Op.gte]: competition.questFishWidth}
                },
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }],
            })
        } else if (competition.mode === 2) {
            data = await Diary.findAll({
                order: [['record2', 'DESC']],
                where: {
                    competitionId: competitionId,
                    record2: {[Op.gte]: competition.questFishNumber}
                },
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }]
            })
        } else if (competition.mode === 3) {
            data = await Diary.findAll({
                order: [['record3', 'DESC']],
                where: {
                    competitionId: competitionId,
                    record3: {[Op.gte]: competition.questFishNumber}
                },
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }]
            })
        } else if (competition.mode === 4) {
            data = await Diary.findAll({
                limit: 3,
                order: [['record4', 'ASC']],
                where: {competitionId: competitionId},
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }]
            })
        }

        return res.status(200).send({result: data});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.updateDiary = (req, res) => {
    const diaryId = req.body.diaryId;
    const data = {
        text: req.body.text,
    }

    Diary.update(data, {
        where: {id: diaryId}
    }).then(data => {
        return res.status(200).send({result: 'DIARY_UPDATE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.deleteDiaryById = (req, res) => {
    const diaryId = req.body.diaryId;

    Diary.destroy({
        where: {id: diaryId}
    }).then(cnt => {
        return res.status(200).send({result: cnt});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.addDiaryComment = (req, res) => {
    const newComment = {
        diaryId: req.body.diaryId,
        userId: req.body.userId,
        comment: req.body.comment,
        createdDate: new Date(),
    }

    DiaryComment.create(newComment)
        .then(data => {
            return res.status(200).send({result: 'DIARY_COMMENT_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};
