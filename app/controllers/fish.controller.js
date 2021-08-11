// const Sequelize = require("sequelize");

const db = require("../models");
const Fish = db.fish;
const Competition = db.competition;
const UserCompetition = db.userCompetition;
const FishImage = db.fishImage;
const User = db.user;
const Profile = db.profile;
const UserStyle = db.userStyle;
const FishType = db.fishType;
const DiaryComment = db.diaryComment;
const Report = db.report;
const Op = db.Sequelize.Op;
const {getSubTokens, sendNotification} = require("../utils/push-notification");
const {updatePoint} = require("./withdrawal.controller");

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

                const [record, metadata] = await db.sequelize.query(`
                    SELECT SUM(h.fishWidth) as maxsum
                    FROM (
                        SELECT f.fishWidth
                        FROM fishes f
                        WHERE f.userId = ${fish.userId} AND f.competitionId = ${fish.competitionId} AND f.status = 1
                        ORDER BY f.fishWidth DESC
                        LIMIT ${competition.rankFishNumber}
                    ) as h
                `);
                if (record && record.length > 0) {
                    userCompetition.record1 = record[0]['maxsum'];
                } else {
                    userCompetition.record1 = 0;
                }

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
                    userCompetition.image = images[1].image;
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

                const norm = competition.questSpecialWidth;
                if ((userCompetition.record5 <= 0.0) ||
                    (Math.abs(userCompetition.record5 - norm) > Math.abs(fish.fishWidth - norm))) {
                    userCompetition.record5 = fish.fishWidth;
                    userCompetition.image = images[1].image;
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
                },
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }]
            });
            const userIds = [];
            for (const item of temp) {
                if (item.user && item.user.profile && item.user.profile.serviceAlarm) {
                    userIds.push(item.userId);
                }
            }
            // const userIds = temp.map(x => (x.userId));

            const registeredTokens = await getSubTokens(userIds);
            await sendNotification(registeredTokens, {
                message: '참여중인 대회의 랭킹에 변동이 생겼어요!',
                data: {rankingId: competition.id, message: '참여중인 대회의 랭킹에 변동이 생겼어요!'}
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
        fishWidth: req.body.fishWidth.toFixed(2),
        fishTypeId: req.body.fishTypeId,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
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

            const fishImages = req.body.fishImages;

            let data = [];
            for (const item of fishImages) {
                data.push({
                    fishId: fish.id,
                    image: item.image,
                    imageType: item.imageType,
                    measureInfo: item.measureInfo,
                })
            }
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
        image: x.image,
        imageType: x.imageType,
        measureInfo: item.measureInfo,
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

            const userIds = [];
            for (const item of temp) {
                if (item.user && item.user.profile && item.user.profile.serviceAlarm) {
                    userIds.push(item.userId);
                }
            }

            const registeredTokens = await getSubTokens(userIds);
            await sendNotification(registeredTokens, {
                message: '참여중인 대회의 랭킹에 변동이 생겼어요!',
                data: {rankingId: competition.id, message: '참여중인 대회의 랭킹에 변동이 생겼어요!'}
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
        disabled: 0,
        status: 1,
    };

    if (req.body.accepted === 1) {
        filter = {...filter, status: 1};
    }

    Fish.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['fishWidth', 'DESC'], [FishImage, 'imageType', 'ASC']],
        where: filter,
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image', 'imageType', 'measureInfo']
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
        order: [[sortKey === 1 ? 'fishWidth' : 'registerDate', 'DESC'], [FishImage, 'imageType', 'ASC']],
        where: {
            userId: userId,
        },
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image', 'imageType', 'measureInfo'],
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
        order: [['fishWidth', 'DESC'], [FishImage, 'imageType', 'ASC']],
        where: {
            userId: userId,
            status: 1,
            disabled: 0,
        },
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image', 'imageType', 'measureInfo'],
            order: [['imageType', 'ASC']],
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
            status: 1,
            disabled: 0,
        },
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image', 'imageType', 'measureInfo']
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
        where: {id: fishId, disabled: 0},
        include: [{
            model: User,
            attributes: ['id', 'name']
        }, {
            model: Competition,
            attributes: ['id', 'name']
        }, {
            model: FishImage,
            attributes: ['id', 'image', 'imageType', 'measureInfo']
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
            where: {disabled: 0},
            order: [['fishWidth', 'DESC'], [FishImage, 'imageType', 'ASC']],
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
        const userId = req.body.userId;

        let filter = {};

        if (competitionId) filter.competitionId = competitionId;
        if (status) filter.status = status;
        if (userId) filter.userId = userId;

        const orderList = order === 0 ? [['registerDate', 'DESC']] : [['fishWidth', 'DESC']]

        const totalCount = await Fish.count({
            where: filter
        });

        const fishes = await Fish.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            order: orderList,
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
                id: req.body.fishId,
            }
        });

        if (!fish) {
            return res.status(404).send({msg: 'FISH_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
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
                image: x.image,
                imageType: x.imageType,
                measureInfo: x.measureInfo,
            }));

            await FishImage.destroy({
                where: {fishId: fish.id}
            });

            await FishImage.bulkCreate(images, {returning: true});
        }


        res.status(200).send({result: 'FISH_UPDATE_SUCCESS'});

        // await updateRecordAndSendMessage(fish);
        await updateRecords(fish);

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
        const fish = await Fish.findOne({
            where: {id: fishId}
        });

        if (fish) {
            fish.disabled = 1;
            await fish.save();

            await updateRecords(fish);
        }

        const report = await Report.findOne({
            where: {id: reportId}
        });

        if (report) {
            report.status = 2;
            await report.save();
        }

        return res.status(200).send({result: 'SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getRankingRealtime = async (req, res) => {
    const fishTypeId = req.body.fishTypeId;
    const userId = req.body.userId;
    const limit = req.body.limit || 10000;

    try {
        const [winners, metadata] = await db.sequelize.query(`
            SELECT
                x.id, x.fishWidth as max, x.fishTypeId, x.userId,
                u.name AS userName,
                ust.name AS userStyle,
                ft.name AS fishType,
                fi.image as fishImage, fi.imageType as imageType, fi.measureInfo as measureInfo,
                p.avatar
            FROM fishes x
            JOIN users u ON u.id = x.userId
            JOIN profiles p ON p.userId = u.id
            LEFT JOIN userStyles ust ON ust.id = p.userStyleId
            LEFT JOIN fishImages fi ON fi.fishId = x.id
            LEFT JOIN fishTypes ft ON ft.id = x.fishTypeId
            WHERE fi.imageType = 1 AND disabled = 0 AND status = 1 ${fishTypeId > 0 ? ' AND fishTypeId=' + fishTypeId : ''}
            ORDER BY x.fishWidth DESC
            LIMIT ${limit};
        `);

        let myFish = {};
        let myRanking = 0;

        for (let i = 0; i < winners.length; i++) {

            if (winners[i]['userId'] === userId) {
                myFish = {...winners[i]};
                myRanking = i + 1;
            }
        }

        return res.status(200).send({result: winners, myFish: myFish, myRanking: myRanking});

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
        .then(async data => {
            res.status(200).send({result: 'DIARY_COMMENT_REGISTER_SUCCESS', data: data});

            const fish = await Fish.findOne({
                where: {id: req.body.fishId, disabled: 0},
                include: [{
                    model: User,
                    include: [{
                        model: Profile
                    }]
                }]
            });
            if (!fish) {
                return res.status(404).send({msg: 'POST_NOT_FOUND'});
            }

            if (fish.user && fish.user.profile && fish.user.profile.serviceAlarm) {
                const registeredToken = await getSubTokens(fish.userId);

                console.log('등록하신 물고기에 댓글이 달렸습니다')

                return sendNotification(registeredToken, {
                    message: '등록하신 물고기에 댓글이 달렸습니다',
                    data: {fishId: fish.id, message: '등록하신 물고기에 댓글이 달렸습니다'}
                });
            }
            return false;
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


const giveReward = async (userId, amount) => {
    console.log('===========================')
    console.log(userId, amount)

    try {
        await updatePoint(userId, parseInt(amount), 1, '대회상금');
        return 1;
    } catch (err) {
        return 0;
    }
}

exports.rewarding = async (competition) => {
    let winners1 = [];
    let winners2 = [];
    let winners3 = [];

    // give reward

    if (competition.mode === 1 || competition.mode === 5) {
        console.log('-------------testing--------------', competition.mode)
        const [winners, metadata] = await db.sequelize.query(`
            SELECT *,
            (
                SELECT 1+ count(*)
                FROM userCompetitions uc1
                WHERE competitionId = ${competition.id} AND 
                    ${competition.mode === 1
                        ? 'uc1.record1 > uc.record1' 
                        : `ABS(uc1.record5 - ${competition.questSpecialWidth}) < ABS(uc.record5 - ${competition.questSpecialWidth}) `}
            ) as rank
            FROM userCompetitions uc
            HAVING competitionId = ${competition.id} AND rank < 4 AND record${competition.mode} > 0
            ORDER BY rank ASC
        `);

        winners1 = winners.filter(x => x.rank === 1);
        winners2 = winners.filter(x => x.rank === 2);
        winners3 = winners.filter(x => x.rank === 3);
        console.log('winners: ', winners)
        console.log('first: ', winners1)
        console.log('second: ', winners2)
        console.log('third: ', winners3)

        if (winners1.length === 1 && winners2.length === 0) {
            await giveReward(winners1[0].userId, competition.reward1);
        } else if (winners1.length === 1 && winners2.length === 1) {
            await giveReward(winners1[0].userId, competition.reward1);
            await giveReward(winners2[0].userId, competition.reward2);
            if (winners3.length > 0) {
                for (const winner3 of winners3) {
                    await giveReward(winner3.userId, Math.floor(competition.reward3 / winners3.length));
                }
            }
        } else if (winners1.length === 1 && winners2.length > 1) {
            await giveReward(winners1[0].userId, competition.reward1);
            for (const winner2 of winners2) {
                await giveReward(winner2.userId, Math.floor((competition.reward2 + competition.reward3) / winners2.length));
            }
        } else if (winners1.length === 2) {
            await giveReward(winners1[0].userId, Math.floor((competition.reward1 + competition.reward2) / 2));
            if (winners3.length > 0) {
                for (const winner3 of winners3) {
                    await giveReward(winner3.userId, Math.floor(competition.reward3 / winners3.length));
                }
            }
        } else if (winners1.length > 2) {
            for (const winner1 of winners1) {
                await giveReward(winner1.userId, Math.floor(competition.totalReward / winners1.length));
            }
        }
    } else {
        let filter = {competitionId: competition.id};

        if (competition.mode === 2) {
            filter = {
                competitionId: competition.id,
                record2: {
                    [Op.gte]: competition.questFishWidth
                }
            }
        } else if (competition.mode === 3) {
            filter = {
                competitionId: competition.id,
                record3: {
                    [Op.gte]: competition.questFishNumber
                }
            }
        } else if (competition.mode === 4) {
            filter = {
                competitionId: competition.id,
                record4: {
                    [Op.gte]: competition.questFishNumber
                }
            }
        }

        try {
            winners1 = await UserCompetition.findAll({
                where: filter
            });

            console.log('-------------winner length -----------', winners1.length)
        } catch (err) {
            console.log(err)
        }

        for (const winner1 of winners1) {
            await giveReward(winner1.userId, Math.floor(competition.totalReward / winners1.length));
        }
    }

    // update style of winners

    for (const winner of winners1) {
        const record = await getRecordByUser(winner.userId);
        const championShipCount = record.rankChampionshipCount + record.questChampionshipCount;

        console.log('championShipCount: ', championShipCount);

        const profile = await Profile.findOne({
            where: {userId: winner.userId}
        });
        /*if (championShipCount >= 10) {
            profile.userStyleId = 8;
        } else if (championShipCount >= 5) {
            profile.userStyleId = 7;
        } else if (championShipCount >= 1) {
            profile.userStyleId = 6;
        }*/
        const userStyles = await UserStyle.findAll({
            order: [['championLimit', 'DESC']],
            where: {
                championLimit: {[Op.gt]: 0}
            }
        })
        let userStyleId = 0;
        for (const item of userStyles) {
            if (championShipCount >= item.championLimit) {
                userStyleId = item.id;
                break;
            }
        }

        profile.userStyleId = userStyleId;
        await profile.save();
    }

    console.log('******** The end **********')
}

const getRecordByUser = async (userId) => {
    let totalDiaryCount = 0;
    let rankDiaryCount = 0;
    let questDiaryCount = 0;
    let rankChampionshipCount = 0;
    let questChampionshipCount = 0;

    totalDiaryCount = await Fish.count({
        where: {userId: userId}
    });

    const myCompetitions = await UserCompetition.findAll({
        where: {userId: userId},
        include: [{
            model: Competition,
        }]
    });

    for (const item of myCompetitions) {
        if (new Date(item.competition.endDate).getTime() < new Date().getTime()) { // 종료된 대회들만 검색
            if (item.competition && item.competition.mode === 1) {
                rankDiaryCount += 1;

                const maxScore = await UserCompetition.max('record1', {
                    where: {competitionId: item.competition.id}
                });

                if (item.record1 >= maxScore) rankChampionshipCount += 1;
            } else if (item.competition) {
                questDiaryCount += 1;

                const comp = await Competition.findOne({
                    where: {id: item.competition.id}
                });

                if (item.competition.mode === 2) {
                    if (item.record2 >= comp.questFishWidth) questChampionshipCount += 1;
                } else if (item.competition.mode === 3) {
                    if (item.record3 >= comp.questFishNumber) questChampionshipCount += 1;
                } else if (item.competition.mode === 4) {
                    if (item.record4 >= comp.questFishNumber) questChampionshipCount += 1;
                } else {
                    const norm = comp.questSpecialWidth;
                    const data = await UserCompetition.findAll({
                        where: {competitionId: 22},
                        order: [[db.sequelize.fn('ABS', db.sequelize.literal('record5 - ' + norm)), 'ASC']],
                        raw: true
                    })

                    const minRec = data && data.length > 0 ? Math.abs(data[0].record5 - norm) : null;

                    if (minRec && Math.abs(item.record5 - norm) <= minRec) questChampionshipCount += 1;
                }
            }
        }
    }

    return {
        totalDiaryCount,
        rankDiaryCount,
        questDiaryCount,
        rankChampionshipCount,
        questChampionshipCount,
    };
}

const updateRecords = async (fish) => {
    /* update the record of userCompetition */
    console.log('here1')

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

        if (userCompetition !== null) {

            if (competition.mode === 1) {

                const [record, metadata] = await db.sequelize.query(`
                    SELECT SUM(h.fishWidth) as maxsum
                    FROM (
                        SELECT f.fishWidth
                        FROM fishes f
                        WHERE f.userId = ${fish.userId} AND f.competitionId = ${fish.competitionId} AND disabled = 0 AND status = 1
                        ORDER BY f.fishWidth DESC
                        LIMIT ${competition.rankFishNumber}
                    ) as h
                `);

                if (record && record.length > 0) {
                    userCompetition.record1 = record[0]['maxsum'];
                } else {
                    userCompetition.record1 = 0;
                }

                await userCompetition.save();

            } else if (competition.mode === 2) {
                console.log('here2')
                console.log('***', fish.userId, fish.competitionId, competition.questFishWidth)

                const maxFish = await Fish.findAll({
                    limit: 1,
                    order: [['fishWidth', 'DESC']],
                    where: {
                        userId: fish.userId,
                        competitionId: fish.competitionId,
                        disabled: 0,
                        status: 1,
                        fishWidth: {[Op.gte]: competition.questFishWidth}
                    },
                    include: [{
                        model: FishImage
                    }]
                });
                console.log('maxfish: ', maxFish[0])
                if (maxFish && maxFish.length > 0) {
                    userCompetition.record2 = maxFish[0] && maxFish[0].fishWidth || 0;
                    userCompetition.image = maxFish[0] && maxFish[0].fishImages &&
                        maxFish[0].fishImages.find(x => x.imageType === 1) &&
                        maxFish[0].fishImages.find(x => x.imageType === 1).image;

                    await userCompetition.save();
                } else {
                    userCompetition.record2 = 0;
                    userCompetition.image = null;
                    await userCompetition.save();
                }


            } else if (competition.mode === 3) {

                userCompetition.record3 = await Fish.count({
                    where: {
                        userId: fish.userId,
                        competitionId: fish.competitionId,
                        disabled: 0,
                        status: 1,
                    },
                });

                await userCompetition.save();

            } else if (competition.mode === 4) {

                userCompetition.record4 = await Fish.count({
                    where: {
                        userId: fish.userId,
                        competitionId: fish.competitionId,
                        disabled: 0,
                        status: 1,
                        fishWidth: {[Op.gte]: competition.questFishWidth}
                    },
                });

                await userCompetition.save();

            } else if (competition.mode === 5) {

                const norm = competition.questSpecialWidth || 1000;
                const order = [[db.sequelize.fn('ABS', db.sequelize.literal('fishWidth - ' + norm)), 'ASC']];

                const winFish = await Fish.findAll({
                    limit: 1,
                    order: order,
                    where: {
                        userId: fish.userId,
                        competitionId: fish.competitionId,
                        disabled: 0,
                        status: 1,
                    },
                    include: [{
                        model: FishImage
                    }]
                })

                console.log('win********', winFish.length)
                if (winFish && winFish.length > 0) {
                    console.log('win fish: ', winFish[0].fishWidth)
                    userCompetition.record5 = winFish[0].fishWidth;
                    userCompetition.image = winFish[0].fishImages &&
                        winFish[0].fishImages.find(x => x.imageType === 1) &&
                        winFish[0].fishImages.find(x => x.imageType === 1).image;

                    await userCompetition.save();
                } else {
                    userCompetition.record5 = 0;
                    userCompetition.image = null;
                    await userCompetition.save();
                }
            }
        }

        return 1;
    } catch (err) {
        console.log(err)
        return 0;
    }
}
