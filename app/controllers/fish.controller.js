// const Sequelize = require("sequelize");

const db = require("../models");
const Fish = db.fish;
const Competition = db.competition;
const UserCompetition = db.userCompetition;
const FishImage = db.fishImage;
const User = db.user;
const UserRecord = db.userRecord;
const Profile = db.profile;
const UserStyle = db.userStyle;
const FishType = db.fishType;
const DiaryComment = db.diaryComment;
const Op = db.Sequelize.Op;

exports.commitFish = async (req, res) => {
    const newFish = {
        ...req.body,
        status: 3, // pending status
        registerDate: new Date(),
    };

    // can submit the fish during only competition
    const competition = await Competition.findOne({
        where: {
            id: req.body.competitionId,
            startDate: {
                [Op.lte]: (new Date()).getTime()
            },
            endDate: {[Op.gt]: (new Date()).getTime()}
        }
    });

    if (competition) {
        Fish.create(newFish)
            .then(data => {
                return res.status(200).send({result: 'DIARY_FISH_COMMIT_SUCCESS', data: {id: data.id, registerDate: data.registerDate}});
            })
            .catch(err => {
                return res.status(500).send({msg: err.toString()});
            })
    } else {
        return res.status(404).send({msg: 'COMPETITION_DURATION_ERROR'});
    }
};

exports.addFishImage = (req, res) => {
    // const data = {
    //     fishId: req.body.fishId,
    //     image: req.body.image,
    // }

    const images = req.body.images;
    const fishId = req.body.fishId;

    const data = images.map(x => ({
        fishId: fishId,
        image: x,
    }));

    FishImage.bulkCreate(data, {returning: true})
        .then(data => {
            return res.status(200).send({result: 'DIARY_FISH_IMAGE_ADD_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.registerCheckedFish = async (req, res) => {

    try {
        const fishId = req.body.fishId;

        /* add the fish Info */
        const fish = await Fish.findOne({
            where: {
                id: fishId,
            }
        });

        if (!fish) {
            return res.status(404).send({msg: 'FISH_NOT_FOUND'});
        }

        fish.fishTypeId = req.body.fishTypeId;
        fish.fishWidth = req.body.fishWidth;
        fish.status = 1;
        fish.registerDate = new Date();

        await fish.save();

        /* update the record of userCompetition */

        const competition = await Competition.findOne({
            where: {
                id: fish.competitionId
            }
        });

        const filter = {
            userId: fish.userId,
            competitionId: fish.competitionId,
        }

        const userCompetition = await UserCompetition.findOne({
            where: filter
        });

        if (userCompetition !== null) {
            if (competition.mode === 1) {

                userCompetition.record1 = await Fish.sum('fishWidth', {
                    limit: competition.rankFishNumber,
                    order: [['fishWidth', 'DESC']],
                    where: filter
                });
                await userCompetition.save();

            } else if (competition.mode === 2) {

                userCompetition.record2 = await Fish.max('fishWidth', {
                    where: filter
                });
                await userCompetition.save();

            } else if (competition.mode === 3) {

                userCompetition.record3 = userCompetition.record3 + 1;
                await userCompetition.save();

            } else if (competition.mode === 4) {

                if (fish.fishWidth >= competition.questFishWidth) {
                    userCompetition.record4 = userCompetition.record4 + 1;
                    await userCompetition.save();
                }

            } else if (competition.mode === 5) {

                if (Math.abs(userCompetition.record5) > Math.abs(fish.fishWidth - competition.questSpecialWidth)) {
                    userCompetition.record5 = fish.fishWidth - competition.questSpecialWidth;
                    await userCompetition.save();
                }
            }
        }

        /* update the record of UserRecord */

        const record = UserRecord.findOne({
            where: {
                userId: fish.userId,
                fishId: fish.id,
            }
        });

        const recordImage = await FishImage.findOne({
            where: {fishId: fish.id}
        });

        if (!record) {
            await UserRecord.create({
                userId: fish.userId,
                fishId: fish.id,
                record: fish.fishWidth,
                fishImage: recordImage.image,
            });
        } else if (record && record.record < fish.fishWidth) {
            record.record = fish.fishWidth;
            record.fishImage = recordImage.image;
            await record.save();
        }

        return res.status(200).send({result: 'FISH_REGISTER_SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getFishesByUser = (req, res) => {
    let filter = {
        userId: req.body.userId,
        competitionId: req.body.competitionId,
    };

    if (req.body.accepted === 1) {
        filter = {...filter, status: 1};
    }

    Fish.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: filter,
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image']
        }, {
            model: User,
            attributes: ['id', 'name']
        }, {
            model: Competition,
            attributes: ['id', 'name']
        }]
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getDiariesByUser = (req, res) => {
    const userId = req.body.userId;
    const sortKey = req.body.sortKey; // 0-by date, 1-by width

    Fish.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [[sortKey === 1 ? 'fishWidth' : 'registerDate', 'DESC']],
        where: {
            userId: userId,
            status: 1
        },
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image']
        }, {
            model: User,
            attributes: ['id', 'name']
        }, {
            model: Competition,
            attributes: ['id', 'name']
        }]
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};


exports.searchDiary = (req, res) => {
    const userId = req.body.userId;
    let filter = {};
    if (req.body.keyword) {
        filter = {
            name: {
                [Op.like]: '%' + req.body.keyword + '%'
            }
        };
    }

    Fish.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: {
            userId: userId,
            status: 1
        },
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image']
        }, {
            model: Competition,
            attributes: ['id', 'name'],
            where: filter,
        }]
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};


exports.getFishesByCompetition = (req, res) => {
    const competitionId = req.body.competitionId;

    Fish.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: {
            competitionId: competitionId,
            status: 1
        },
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image']
        }]
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getFishById = (req, res) => {
    const fishId = req.body.fishId;

    Fish.findOne({
        where: {id: fishId},
        include: [{
            model: User,
            attributes: ['id', 'name']
        }, {
            model: Competition,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image']
        }, {
            model: DiaryComment,
            include: [{
                model: User,
                attributes: ['id', 'name'],
                include: [{
                    model: Profile,
                    attributes: ['id', 'avatar', 'level', 'username'],
                    include: [{
                        model: UserStyle
                    }]
                }]
            }]
        }]
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getAllFishes = async (req, res) => {
    try {
        const totalCount = await Fish.count();

        const fishes = await Fish.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            include: [{
                model: User,
                attributes: ['id', 'name'],
                include: [{
                    model: Profile,
                    attributes: ['id', 'username']
                }]
            }, {
                model: Competition,
                attributes: ['id', 'name']
            }, {
                model: FishType,
                attributes: ['id', 'name']
            }]
        });

        return res.status(200).send({result: fishes, totalCount: totalCount});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getFishesByMultiFilter = async (req, res) => {
    try {
        const competitionId = req.body.competitionId;
        const status = req.body.status;

        let filter = {};

        if (competitionId) filter.competitionId = competitionId;
        if (status) filter.status = status;

        const totalCount = await Fish.count({
            where: filter
        });

        const fishes = await Fish.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            where: filter,
            include: [{
                model: User,
                attributes: ['id', 'name'],
                include: [{
                    model: Profile,
                    attributes: ['id', 'username']
                }]
            }, {
                model: Competition,
                attributes: ['id', 'name']
            }, {
                model: FishType,
                attributes: ['id', 'name']
            }]
        });

        return res.status(200).send({result: fishes, totalCount: totalCount});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.updateFish = async (req, res) => {
    try {
        const fish = await Fish.findOne({
            where: {
                id: req.body.fishId
            }
        });

        if (!fish) {
            return res.status(404).send({msg: 'FISH_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        console.log('keys: ', keys);
        for (const key of keys) {
            if (key !== 'fishId') {
                fish[key] = req.body[key];
            }
        }

        await fish.save();

        return res.status(200).send({result: 'FISH_UPDATE_SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getRankingRealtime = async (req, res) => {
    let filter = {};
    if (req.body.fishTypeId !== 0) filter.fishTypeId = req.body.fishTypeId;
    const rank = db.Sequelize.literal('(RANK() OVER (ORDER BY record DESC))');

    try {
        const userRankings = await UserRecord.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            where: filter,
            // attributes: ['id', 'record', [rank, 'rank']],
            attributes: ['id', 'userId', 'record'],
            order: [['record', 'DESC']],
            include: [{
                model: Fish,
                attributes: ['id'],
                include: [{
                    model: User,
                    attributes: ['id', 'name'],
                }, {
                    model: FishType,
                    attributes: ['id', 'name'],
                }, {
                    model: FishImage,
                    limit: 1,
                    attributes: ['id', 'image'],
                }]
            }],
        });

        const idx = userRankings.findIndex(x=> x.userId === req.body.userId);
        const myFish = idx > -1 ? userRankings[idx] : null;
        return res.status(200).send({result: userRankings, myRanking: idx + 1, myFish: myFish});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

// exports.getRankingRealtime = async (req, res) => {
//     let filter = {};
//     if (req.body.fishTypeId !== 0) filter.fishTypeId = req.body.fishTypeId;
//     const max = db.Sequelize.fn('max', db.Sequelize.col('fishWidth'));
//     // const rank = db.Sequelize.literal('(RANK() OVER (ORDER BY max DESC))');
//
//     try {
//         const fishes = await Fish.findAll({
//             limit: req.body.limit || 1000000,
//             offset: req.body.offset || 0,
//             where: filter,
//             order: [[max, 'DESC']],
//             attributes: [[max, 'max']],
//             group: ['userId'],
//             include: [{
//                 model: User,
//                 attributes: ['id', 'name'],
//             }],
//         });
//         const temp = [];
//         let myFish = {};
//         let myRanking = 0;
//         for (const [idx, item] of fishes.entries()) {
//             const image = await Fish.findOne({
//                 where: {fishWidth: item.dataValues.max},
//                 attributes: ['id'],
//                 include: [{
//                     limit: 1,
//                     model: FishImage,
//                     attributes: ['image']
//                 }, {
//                     model: FishType,
//                     attributes: ['name']
//                 }]
//             });
//             const newItem = {
//                 ...item.dataValues,
//                 image: image.dataValues.fishImages[0].dataValues.image,
//                 type: image.dataValues.fishType.dataValues.name
//             }
//             temp.push(newItem);
//
//             if (item.user.id === req.body.userId) {
//                 myRanking = idx + 1;
//                 myFish = newItem;
//             }
//         }
//
//         return res.status(200).send({result: temp, myFish: myFish, myRanking: myRanking});
//         // return res.status(200).send({result: fishes, myFish: myFish, myRanking: myRanking});
//     } catch (err) {
//         return res.status(500).send({msg: err.toString()});
//     }
// }

exports.addFishComment = (req, res) => {
    const newComment = {
        fishId: req.body.fishId,
        userId: req.body.userId,
        comment: req.body.comment,
        createdDate: new Date(),
    }

    DiaryComment.create(newComment)
        .then(data => {
            return res.status(200).send({result: 'DIARY_COMMENT_REGISTER_SUCCESS', data: data});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.deleteFishComment = (req, res) => {
    const fishCommentId = req.body.fishCommentId;
    DiaryComment.destroy({
        where: {id: fishCommentId}
    }).then(data => {
        if (data === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: 'DIARY_COMMENT_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}
