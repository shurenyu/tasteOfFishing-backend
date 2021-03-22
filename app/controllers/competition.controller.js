const db = require("../models");
const schedule = require('node-schedule');
const Competition = db.competition;
const UserCompetition = db.userCompetition;
const Fish = db.fish;
const FishType = db.fishType;
const User = db.user;
const Profile = db.profile;
const UserStyle = db.userStyle;
const Op = db.Sequelize.Op;
const {getSubTokens, sendNotification} = require("../utils/push-notification");
const {updatePoint} = require("./withdrawal.controller");

const validCompetition = (start, end) => {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const now = new Date().getTime();
    console.log(start)
    console.log(end)

    if (startDate > endDate) return false;
    return startDate >= now;

}

const giveReward = async (userId, amount) => {
    try {
        await updatePoint(userId, parseInt(amount), 1, '대회상금');
        return 1;
    } catch (err) {
        return 0;
    }
}

/**
 * Register Competition
 * @param req keys: {...}
 * @param res
 * @returns {token}
 */
exports.registerCompetition = async (req, res) => {
    // if (!validCompetition(req.body.startDate, req.body.endDate)) {
    //     return res.status(400).send({result: 'INVALID_DATE'});
    // }

    try {
        const newCompetition = {
            ...req.body
        };

        const contest = await Competition.create(newCompetition);

        let tmr = setInterval(async function () {
            const now = new Date().getTime();

            const competition = await Competition.findOne({
                where: {id: contest.id}
            });

            const endDate = new Date(competition.endDate).getTime();
            const startDate = new Date(competition.startDate).getTime();

            if (now > endDate) {

                clearInterval(tmr);

            } else if (endDate - now < 3600000) {

                const job = schedule.scheduleJob(endDate, async function () {
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
                        WHERE competitionId = ${competition.id} AND ${competition.mode === 1 ? 'uc1.record1 > uc.record1' : 'uc1.record5 < uc.record5'}
                    ) as rank
                    FROM userCompetitions uc
                    HAVING competitionId = ${competition.id} AND rank < 4
                    ORDER BY uc.record${competition.mode} DESC
                `);

                        winners1 = winners.filter(x => x.rank === 1);
                        winners2 = winners.filter(x => x.rank === 2);
                        winners3 = winners.filter(x => x.rank === 3);
                        console.log('winners: ', winners)
                        console.log('first: ', winners1)
                        console.log('second: ', winners2)
                        console.log('third: ', winners3)

                        if (winners1.length === 1 && winners2.length === 1) {
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
                        let filter = {};
                        if (competition.mode === 2) {
                            filter = {
                                record2: {
                                    [Op.gte]: competition.questFishWidth
                                }
                            }
                        } else if (competition.mode === 3) {
                            filter = {
                                record3: {
                                    [Op.gte]: competition.questFishNumber
                                }
                            }
                        } else if (competition.mode === 4) {
                            filter = {
                                record4: {
                                    [Op.gte]: competition.questFishNumber
                                }
                            }
                        }
                        winners1 = await UserCompetition.findAll({
                            where: filter
                        });

                        for (const winner1 of winners1) {
                            await giveReward(winner1.userId, Math.floor(competition.totalReward / winners1.length));
                        }
                    }

                    // update style of winners

                    for (const winner of winners1) {
                        const record = await getRecordByUser(winner.userId);
                        const championShipCount = record.rankChampionshipCount + record.questChampionshipCount;
                        const profile = await Profile.findOne({
                            where: {userId: winner.userId}
                        });
                        if (championShipCount >= 10) {
                            profile.userStyleId = 8;
                        } else if (championShipCount >= 5) {
                            profile.userStyleId = 7;
                        } else if (championShipCount >= 1) {
                            profile.userStyleId = 6;
                        }
                        await profile.save();
                    }
                })

            } else if (endDate - now < 24 * 3600000) {

                const userCompetition = await UserCompetition.findAll({
                    where: {competitionId: competition.id}
                });

                const userIds = [];
                for (const item of userCompetition) {
                    userIds.push(item.userId);
                }

                const registeredTokens = await getSubTokens(userIds);
                await sendNotification([registeredTokens], {message: '곧 대회가 종료되요!', competitionId: competition.id});

            } else if (startDate - now < 24 * 3600000) {

                const userCompetition = await UserCompetition.findAll({
                    where: {competitionId: competition.id}
                });

                const userIds = [];
                for (const item of userCompetition) {
                    userIds.push(item.userId);
                }

                const registeredTokens = await getSubTokens(userIds);
                await sendNotification([registeredTokens], {message: '곧 대회가 시작되요!', competitionId: competition.id});
            }

        }, 3600000)

        return res.status(200).send({result: 'COMPETITION.REGISTER', data: contest.id});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }

};

exports.updateCompetition = async (req, res) => {
    try {
        const competitionId = req.body.competitionId;

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        if (!competition) {
            return res.status(404).send({msg: 'COMPETITION.NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'competitionId') {
                competition[key] = req.body[key];
            }
        }
        await competition.save();

        return res.status(200).send({result: 'COMPETITION.UPDATE_SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

// exports.getCompetitionById = async (req, res) => {
//     const competitionId = req.body.competitionId;
//
//     const cntUser = await Diary.count({
//         where: {id: competitionId}
//     });
//
//     Competition.findOne({
//         where: {id: competitionId}
//     }).then(async data => {
//         return res.status(200).send({result: {...data.dataValues, userCount: cntUser}});
//     }).catch(err => {
//         return res.status(500).send({msg: err.toString()});
//     })
// };

exports.getCompetitionById = async (req, res) => {
    try {
        const competitionId = req.body.competitionId;
        const userId = req.body.userId; //login user id

        const competition = await Competition.findOne({
            where: {id: competitionId},
            include: [{
                model: FishType,
                attributes: ['id', 'name']
            }]
        });

        const cntUser = await UserCompetition.count({
            where: {competitionId: competitionId}
        });

        const sortingKey = ['DESC', 'DESC', 'DESC', 'DESC', 'ASC'];

        let winners = [];
        if (competition.mode > 0) {
            winners = await UserCompetition.findAll({
                limit: 3,
                order: [[`record${competition.mode}`, sortingKey[competition.mode - 1]]],
                attributes: ['id', `record${competition.mode}`, 'image'],
                where: {
                    competitionId: competitionId,
                },
                include: [{
                    model: User,
                    attributes: ['id', 'name'],
                    include: [{
                        model: Profile,
                        attributes: ['id', 'username', 'level', 'avatar'],
                        include: [{
                            model: UserStyle
                        }]
                    }]
                }]
            });
        }

        const myStatus = await UserCompetition.findOne({
            where: {
                competitionId: competitionId,
                userId: userId || 0,
            }
        })

        return res.status(200).send({result: {...competition.dataValues, userCount: cntUser}, ranking: winners, myStatus: !!myStatus});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getAllCompetitions = async (req, res) => {
    try {
        const totalCount = await Competition.count();

        const competitions = await Competition.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            include: [{
                model: FishType
            }]
        });

        return res.status(200).send({result: competitions, totalCount: totalCount});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getNewCompetition = (req, res) => {
    Competition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['startDate', 'ASC']],
        where: {
            endDate: {
                [Op.gt]: (new Date()).getTime()
            }
        },
        include: [{
            model: FishType
        }]
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.deleteCompetitionById = (req, res) => {
    const competitionId = req.body.competitionId;

    Competition.destroy({
        where: {id: competitionId}
    }).then(cnt => {
        if (cnt === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }

        UserCompetition.destroy({
            where: {competitionId: competitionId}
        }).then(data => {
            return res.status(200).send({result: cnt});
        }).catch(err => {
            return res.status(200).send({msg: err.toString()});
        })

    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
};

exports.getProgressingCompetitions = (req, res) => {
    const now = new Date();

    Competition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: {
            startDate: {
                [Op.lte]: now.getTime()
            },
            endDate: {
                [Op.gte]: now.getTime()
            }
        },
        include: [{
            model: FishType,
            attributes: ['id', 'name']
        }]
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.searchCompetitions = (req, res) => {
    const searchKey = req.body.keyword;
    const type = req.body.type;
    const now = new Date();
    let filter = {};

    if (type === 1) {
        filter = { // Progressing Contest
            startDate: {
                [Op.lte]: now.getTime()
            },
            endDate: {
                [Op.gte]: now.getTime()
            },
            [Op.or]: [{
                name: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }, {
                description: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }]
        };
    } else if (type === 2) { // Rank Contest
        filter = {
            mode: 1,
            [Op.or]: [{
                name: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }, {
                description: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }]
        }
    } else if (type === 3) {
        filter = {
            mode: {[Op.gt]: 1},
            [Op.or]: [{
                name: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }, {
                description: {
                    [Op.like]: '%' + searchKey + '%'
                }
            }]
        }
    }

    Competition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: filter,
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getProgressingCompetitionsByUser = (req, res) => {
    const now = new Date();

    UserCompetition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: {userId: req.body.userId},
        include: [{
            model: Competition,
            where: {
                startDate: {
                    [Op.lte]: now.getTime()
                },
                endDate: {
                    [Op.gte]: now.getTime()
                }
            },
            include: [{
                model: FishType
            }]
        }]
    }).then(data => {
        return res.status(200).send({result: data, totalCount: data.length});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getAttendedCompetitionsByUser = (req, res) => {
    const now = new Date();

    UserCompetition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: {userId: req.body.userId},
        include: [{
            model: Competition,
            where: {
                endDate: {
                    [Op.lt]: now.getTime()
                }
            },
            include: [{
                model: FishType
            }]
        }]
    }).then(data => {
        return res.status(200).send({result: data, totalCount: data.length});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getRankCompetitions = (req, res) => {
    Competition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: {
            mode: 1
        }
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getQuestCompetitions = (req, res) => {
    Competition.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        where: {
            mode: {
                [Op.gt]: 1
            }
        }
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getCompetitionByMultiFilter = async (req, res) => {
    const type = req.body.type;
    const mode = req.body.mode;
    const status = req.body.status;
    const filter = {};
    const now = new Date();

    if (type) filter.type = type;
    if (mode === 1) filter.mode = 1;
    if (mode === 2) filter.mode = {
        [Op.gt]: 1
    }
    if (status === 1) {
        filter.endDate = {
            [Op.lt]: now.getTime()
        };
    } else if (status === 2) {
        filter.startDate = {
            [Op.lt]: now.getTime()
        };
        filter.endDate = {
            [Op.gt]: now.getTime()
        };
    } else if (status === 3) {
        filter.startDate = {
            [Op.gt]: now.getTime()
        };
    }

    try {
        const count = await Competition.count({
            where: filter
        });

        const data = await Competition.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            where: filter
        });

        return res.status(200).send({result: data, totalCount: count});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}


/**
 * Get Ranking of the competition
 * @param req keys: {competitionId, limit}
 * @param res
 * @returns {Promise<void>}
 */
exports.getCompetitionRanking = async (req, res) => {

    try {
        const competitionId = req.body.competitionId;
        const limit = req.body.limit;

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        const sortingKey = ['DESC', 'DESC', 'DESC', 'DESC', 'ASC'];

        let data = [];

        if (competition.mode > 0) {
            data = await UserCompetition.findAll({
                limit: limit || 1000000,
                order: [[`record${competition.mode}`, sortingKey[competition.mode - 1]]],
                attributes: ['id', `record${competition.mode}`, 'image'],
                where: {
                    competitionId: competitionId,
                },
                include: [{
                    model: User,
                    attributes: ['id', 'name'],
                    include: [{
                        model: Profile,
                        attributes: ['id', 'username', 'level', 'avatar'],
                        include: [{
                            model: UserStyle
                        }]
                    }]
                }]
            });
        }
        const myRanking = data.findIndex(x => x.user.id === req.body.userId);

        return res.status(200).send({result: data, myRanking: myRanking + 1});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

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
        if (item.competition && item.competition.mode === 1) {
            rankDiaryCount += 1;

            const maxScore = await UserCompetition.max('record1', {
                where: {competitionId: item.competition.id}
            });

            if (item.record1 === maxScore) rankChampionshipCount += 1;
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
                const minBias = await UserCompetition.min('record5', {
                    where: {competitionId: item.competition.id}
                });

                if (item.record5 === minBias) questChampionshipCount += 1;
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
