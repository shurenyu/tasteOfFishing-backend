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
const Report = db.report;
const Op = db.Sequelize.Op;
const {getSubTokens, sendNotification} = require("../utils/push-notification");

const updateRecordAndSendMessage = async (fish, images) => {
    /* update the record of userCompetition */

    try {
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

        let isSendMsg = false;

        if (userCompetition !== null) {
            let newRecord;

            if (competition.mode === 1) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record1', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                userCompetition.record1 = await Fish.sum('fishWidth', {
                    limit: competition.rankFishNumber,
                    order: [['fishWidth', 'DESC']],
                    where: filter
                });
                await userCompetition.save();

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record1', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });

                const newWinners = temp.map(x => x.userId);

                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);
            } else if (competition.mode === 2) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record2', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                // const maxFish = await Fish.findAll({
                //     limit: 1,
                //     order: [['fishWidth', 'DESC']],
                //     where: filter,
                //     include: [{
                //         model: FishImage
                //     }]
                // });
                //
                // userCompetition.record2 = maxFish[0] && maxFish[0].fishWidth;
                // userCompetition.image = maxFish[0] && maxFish[0].fishImages[1];

                if (fish.fishWidth > userCompetition.record2) {
                    userCompetition.record2 = fish.fishWidth;
                    userCompetition.image = images[1];
                    await userCompetition.save();
                }

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record2', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const newWinners = temp.map(x => x.userId);
                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);

            } else if (competition.mode === 3) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record3', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                newRecord = userCompetition.record3 + 1;
                userCompetition.record3 = newRecord;
                await userCompetition.save();

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record3', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });

                const newWinners = temp.map(x => x.userId);
                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);

            } else if (competition.mode === 4) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record4', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                if (fish.fishWidth >= competition.questFishWidth) {
                    userCompetition.record4 = userCompetition.record4 + 1;
                    await userCompetition.save();
                }

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record4', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });

                const newWinners = temp.map(x => x.userId);
                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);

            } else if (competition.mode === 5) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record5', 'ASC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                if (Math.abs(userCompetition.record5) > Math.abs(fish.fishWidth - competition.questSpecialWidth)) {
                    userCompetition.record5 = fish.fishWidth - competition.questSpecialWidth;
                    userCompetition.image = images[1];
                    await userCompetition.save();
                }

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record5', 'ASC']],
                    where: {
                        competitionId: competition.id
                    }
                });

                const newWinners = temp.map(x => x.userId);
                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);

            }
        }

        // push notification
        if (isSendMsg) {
            const temp = await UserCompetition.findAll({
                where: {
                    competitionId: competition.id
                }
            });
            const userIds = temp.map(x => x.userId);

            const registeredTokens = await getSubTokens(userIds);
            await sendNotification(registeredTokens, {
                message: '참여중인 대회의 랭킹에 변동이 생겼어요!',
                rankingId: competition.id
            });
        }

        return 1;
    } catch (err) {
        return 0
    }
}

exports.commitFish = async (req, res) => {
    const newFish = {
        userId: req.body.userId,
        competitionId: req.body.competitionId,
        fishWidth: req.body.fishWidth,
        fishTypeId: req.body.fishTypeId,
        status: 1,
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
        try {
            const fish = await Fish.create(newFish);
            const data = req.body.fishImages.map(x => ({
                fishId: fish.id,
                image: x,
            }));
            await FishImage.bulkCreate(data, {returning: true});

            res.status(200).send({result: 'DIARY_FISH_COMMIT_SUCCESS', data: {id: fish.id, registerDate: fish.registerDate}});
            await updateRecordAndSendMessage(fish, req.body.fishImages);
        } catch (err) {
            return res.status(500).send({msg: err.toString()});
        }
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

        res.status(200).send({result: 'FISH_REGISTER_SUCCESS'});

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

        let isSendMsg = false;

        if (userCompetition !== null) {
            let newRecord;

            if (competition.mode === 1) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record1', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                userCompetition.record1 = await Fish.sum('fishWidth', {
                    limit: competition.rankFishNumber,
                    order: [['fishWidth', 'DESC']],
                    where: filter
                });
                await userCompetition.save();

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record1', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });

                const newWinners = temp.map(x => x.userId);

                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);
            } else if (competition.mode === 2) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record2', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                userCompetition.record2 = await Fish.max('fishWidth', {
                    where: filter
                });
                await userCompetition.save();

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record2', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const newWinners = temp.map(x => x.userId);
                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);

            } else if (competition.mode === 3) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record3', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                newRecord = userCompetition.record3 + 1;
                userCompetition.record3 = newRecord;
                await userCompetition.save();

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record3', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });

                const newWinners = temp.map(x => x.userId);
                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);

            } else if (competition.mode === 4) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record4', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                if (fish.fishWidth >= competition.questFishWidth) {
                    userCompetition.record4 = userCompetition.record4 + 1;
                    await userCompetition.save();
                }

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record4', 'DESC']],
                    where: {
                        competitionId: competition.id
                    }
                });

                const newWinners = temp.map(x => x.userId);
                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);

            } else if (competition.mode === 5) {
                let temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record5', 'ASC']],
                    where: {
                        competitionId: competition.id
                    }
                });
                const oldWinners = temp.map(x => x.userId);

                if (Math.abs(userCompetition.record5) > Math.abs(fish.fishWidth - competition.questSpecialWidth)) {
                    userCompetition.record5 = fish.fishWidth - competition.questSpecialWidth;
                    await userCompetition.save();
                }

                temp = await UserCompetition.findAll({
                    limit: 3,
                    order: [['record5', 'ASC']],
                    where: {
                        competitionId: competition.id
                    }
                });

                const newWinners = temp.map(x => x.userId);
                isSendMsg = JSON.stringify(oldWinners) !== JSON.stringify(newWinners);

            }
        }

        // push notification
        if (isSendMsg) {
            const temp = await UserCompetition.findAll({
                where: {
                    competitionId: competition.id
                }
            });
            const userIds = temp.map(x => x.userId);

            const registeredTokens = await getSubTokens(userIds);
            await sendNotification(registeredTokens, {
                message: '참여중인 대회의 랭킹에 변동이 생겼어요!',
                rankingId: competition.id
            });
        }

        // /* update the record of UserRecord */
        //
        // const record = UserRecord.findOne({
        //     where: {
        //         userId: fish.userId,
        //         fishId: fish.id,
        //     }
        // });
        //
        // const recordImage = await FishImage.findOne({
        //     where: {fishId: fish.id}
        // });
        //
        // if (!record) {
        //     await UserRecord.create({
        //         userId: fish.userId,
        //         fishId: fish.id,
        //         record: fish.fishWidth,
        //         fishImage: recordImage.image,
        //     });
        // } else if (record && record.record < fish.fishWidth) {
        //     record.record = fish.fishWidth;
        //     record.fishImage = recordImage.image;
        //     await record.save();
        // }
        return 1;
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
        order: [['fishWidth', 'DESC']],
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
        }, {
            model: FishType,
            attributes: ['id', 'name']
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
        const order = req.body.order;

        let filter = {};

        if (competitionId) filter.competitionId = competitionId;
        if (status) filter.status = status;

        const totalCount = await Fish.count({
            where: filter
        });

        const fishes = await Fish.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            order: [[order === 0 ? 'registerDate' : 'fishWidth', 'DESC']],
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

        if (req.body.fishImages) {
            const imageList = JSON.parse(JSON.stringify(req.body.fishImages));
            const images = imageList.map(x => ({
                fishId: fish.id,
                image: x,
            }));

            await FishImage.destroy({
                where: {fishId: fish.id}
            });

            await FishImage.bulkCreate(images, {returning: true});
        }


        res.status(200).send({result: 'FISH_UPDATE_SUCCESS'});

        await updateRecordAndSendMessage(fish);

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.deleteFish = (req, res) => {
    const fishId = req.body.fishId;
    Fish.destroy({
        where: {id: fishId}
    }).then(data => {
        if (data === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: 'FISH_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.deleteFishAndUpdateReport = async (req, res) => {
    const reportId = req.body.reportId;
    const fishId = req.body.fishId;

    try {
        await Fish.destroy({
            where: {id: fishId}
        });

        const report = await Report.findOne({
            where: {id: reportId}
        });

        report.status = 2;
        await report.save();

        return res.status(200).send({result: 'SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}


// exports.getRankingRealtime = async (req, res) => {
//     let filter = {};
//     if (req.body.fishTypeId !== 0) filter.fishTypeId = req.body.fishTypeId;
//     const rank = db.Sequelize.literal('(RANK() OVER (ORDER BY record DESC))');
//
//     try {
//         const userRankings = await UserRecord.findAll({
//             limit: req.body.limit || 1000000,
//             offset: req.body.offset || 0,
//             where: filter,
//             // attributes: ['id', 'record', [rank, 'rank']],
//             attributes: ['id', 'userId', 'record'],
//             order: [['record', 'DESC']],
//             include: [{
//                 model: Fish,
//                 attributes: ['id'],
//                 include: [{
//                     model: User,
//                     attributes: ['id', 'name'],
//                 }, {
//                     model: FishType,
//                     attributes: ['id', 'name'],
//                 }, {
//                     model: FishImage,
//                     limit: 1,
//                     attributes: ['id', 'image'],
//                 }]
//             }],
//         });
//
//         const idx = userRankings.findIndex(x=> x.userId === req.body.userId);
//         const myFish = idx > -1 ? userRankings[idx] : null;
//         return res.status(200).send({result: userRankings, myRanking: idx + 1, myFish: myFish});
//     } catch (err) {
//         return res.status(500).send({msg: err.toString()});
//     }
// }

exports.getRankingRealtime = async (req, res) => {
    const limit = req.body.limit || 100000;
    const offset = req.body.offset || 0;

    let filter = {status: 1};
    if (req.body.fishTypeId !== 0) filter.fishTypeId = req.body.fishTypeId;
    const max = db.Sequelize.fn('max', db.Sequelize.col('fishWidth'));
    // const rank = db.Sequelize.literal('(RANK() OVER (ORDER BY max DESC))');

    try {
        const fishes = await Fish.findAll({
            // limit: req.body.limit || 1000000,
            // offset: req.body.offset || 0,
            where: filter,
            order: [[max, 'DESC']],
            attributes: [[max, 'max']],
            group: ['userId'],
            include: [{
                model: User,
                attributes: ['id', 'name']
            }]
        });

        const temp = [];
        let myFish = {};
        let myRanking = 0;

        let count = 0;

        for (const [idx, item] of fishes.entries()) {
            if (item.user) {
                count ++;

                if (count < offset + 1) continue;
                if (count > offset + limit + 1) break;

                const userInfo = await User.findOne({
                    where: {id: item.user.id},
                    attributes: ['id'],
                    include: [{
                        model: Profile,
                        attributes: ['id'],
                        include: [{
                            model: UserStyle,
                        }]
                    }]
                });

                const image = await Fish.findOne({
                    where: {fishWidth: item.dataValues.max},
                    attributes: ['id'],
                    include: [{
                        model: FishImage,
                        attributes: ['image']
                    }, {
                        model: FishType,
                        attributes: ['name']
                    }]
                });
                const newItem = {
                    ...item.dataValues,
                    fishId: image.id,
                    fishImage: image.fishImages[1] && image.fishImages[1].dataValues.image,
                    fishType: image.fishType && image.fishType.dataValues.name,
                    userStyle: userInfo && userInfo.profile && userInfo.profile.userStyle && userInfo.profile.userStyle.name,
                }
                temp.push(newItem);

                if (item.user.id === req.body.userId) {
                    myRanking = idx + 1;
                    myFish = newItem;
                }
            }
        }

        return res.status(200).send({result: temp, myFish: myFish, myRanking: myRanking});
        // return res.status(200).send({result: fishes, myFish: myFish, myRanking: myRanking});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

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

exports.getMyDiaryInfo = async (req, res) => {
    const userId = req.body.userId;
    const year = req.body.year;

    try {
        const totalAttendingCount = await UserCompetition.count({
            where: {userId: userId}
        });

        const maxFish = await Fish.max('fishWidth', {
            where: {userId: userId}
        });

        // attending count per month

        let attendingCounts = [];

        for (let i = 0; i < 12; i++) {
            const start = new Date(year, i, 1);
            const end = new Date(year, i + 1, 1);

            const countPerMonth = await UserCompetition.count({
                where: {
                    userId: userId,
                    createdDate: {
                        [Op.gte]: start.getTime(),
                        [Op.lt]: end.getTime()
                    }
                }
            });

            attendingCounts.push(countPerMonth);
        }

        let diaryCounts = [];

        for (let i = 0; i < 12; i++) {
            const start = new Date(year, i, 1);
            const end = new Date(year, i + 1, 1);
            console.log('start: ', start)
            console.log('end: ', end)

            const diaryPerMonth = await Fish.count({
                where: {
                    userId: userId,
                    registerDate: {
                        [Op.gte]: start.getTime(),
                        [Op.lt]: end.getTime()
                    }
                }
            });

            diaryCounts.push(diaryPerMonth);
        }
        console.log(typeof maxFish)

        return res.status(200).send({totalAttendingCount, maxFish: maxFish.toFixed(2), attendingCounts, diaryCounts});

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }

}
