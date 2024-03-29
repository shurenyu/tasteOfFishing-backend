const db = require("../models");
const User = db.user;
const Profile = db.profile;
const Fish = db.fish;
// const Diary = db.diary;
const UserStyle = db.userStyle;
const FishType = db.fishType;
const UserCompetition = db.userCompetition;
const UserApplication = db.userApplication;
const Competition = db.competition;
const UserPoint = db.userPoint;
const Op = db.Sequelize.Op;
const {updatePoint} = require("./withdrawal.controller");

/**
 * Register Profile
 * @param req keys: {userId, username, introMe, avatar, serviceAlarm, adAlarm}
 * @param res
 * @returns {token}
 */
exports.registerProfile = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {id: req.body.userId}
        });
        if (user) {
            user.name = req.body.name;
            await user.save();
        }

        const profile = await Profile.create({
            userId: req.body.userId,
            username: req.body.name,
            introMe: req.body.introMe,
            avatar: req.body.avatar,
            serviceAlarm: req.body.serviceAlarm,
            adAlarm: req.body.adAlarm,
            pointAmount: 30,
            createdDate: new Date(),
        });

        await UserPoint.create({
            userId: user.id,
            content: 'Reward Login',
            point: 30,
            createdDate: new Date(),
        });

        const userInfo = await User.findOne({
            where: {id: req.body.userId},
            attributes: {
                exclude: ['password'],
            },
            include: [{
                model: Profile,
                include: [{
                    model: FishType
                }, {
                    model: UserStyle
                }]
            }]
        });

        let dailyCheck = true;
        return res.status(200).send({
            result: 'USER.PROFILE_REGISTER_SUCCESS',
            userInfo: userInfo,
            data: profile.id,
            dailyCheck,
        });
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};


exports.updateProfile = async (req, res) => {
    try {
        const profileId = req.body.profileId;
        const userId = req.body.userId;
        // const filter = profileId ? {id: profileId} : userId ? {userId: userId} : null;
        //
        // if (filter === null) {
        //     return res.status(404).send({msg: 'USER.PROFILE_NOT_FOUND'});
        // }

        const profile = await Profile.findOne({
            where: {userId: userId}
        });

        if (!profile) {
            return res.status(404).send({msg: 'USER.PROFILE_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'profileId' && key !== 'userId') {
                profile[key] = req.body[key];
            }
        }
        await profile.save();

        const user = await User.findOne({
            where: {id: userId},
            attributes: {
                exclude: ['password'],
            },
            include: [{
                model: Profile,
                include: [{
                    model: FishType
                }, {
                    model: UserStyle
                }]
            }]
        });

        user.name = req.body.name || user.name;

        await user.save();

        return res.status(200).send({
            result: 'USER.PROFILE_UPDATE_SUCCESS',
            userInfo: user,
            data: profile.id,
        });

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getProfileById = (req, res) => {
    const profileId = req.body.profileId;

    Profile.findOne({
        where: {id: profileId}
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getProfileByUserId = (req, res) => {
    const userId = req.body.userId;

    Profile.findOne({
        where: {userId: userId},
        include: [{
            model: UserStyle
        }]
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getAllUsers = async (req, res) => {
    try {
        const searchKey = req.body.searchKey;

        const userCount = await User.count({
            where: {
                type: {[Op.gt]: 0}
            }
        });

        let filter = searchKey && searchKey !== ''
            ? { // Progressing Contest
                type: {[Op.gt]: 0},
                [Op.or]: [{
                    name: {
                        [Op.like]: '%' + searchKey + '%'
                    }
                }, {
                    email: {
                        [Op.like]: '%' + searchKey + '%'
                    }
                }]
            } : {type: {[Op.gt]: 0}};



        const users = await User.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            order: [['createdDate', 'DESC']],
            where: filter,
            attributes: {exclude: ['password']},
        });

        return res.status(200).send({result: users, totalCount: userCount});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getUserById = async (req, res) => {
    const userId = req.body.userId;

    try {
        const user = await User.findOne({
            where: {id: userId},
            attributes: ['id', 'email', 'name'],
            include: [{
                model: Profile,
                attributes: ['id', 'username', 'level', 'introMe', 'avatar'],
                include: [{
                    model: UserStyle
                }]
            }]
        });

        const userRecord = await getRecordByUser(userId);

        return res.status(200).send({userInfo: user, userRecord: userRecord});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.deleteUserById = (req, res) => {
    const userId = req.body.userId;

    User.destroy({
        where: {id: userId}
    }).then(cnt => {
        if (cnt === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: cnt});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getMyInfo = async (req, res) => {
    const userId = req.body.userId;

    try {
        const myInfo = await User.findOne({
            where: {
                id: userId
            },
            attributes: ['id', 'name', 'email'],
            include: [{
                model: Profile,
                include: [{
                    model: UserStyle,
                }, {
                    model: FishType,
                }]
            }]
        });

        const userRecord = await getRecordByUser(userId);

        return res.status(200).send({userInfo: myInfo, userRecord: userRecord});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.applyCompetition = async (req, res) => {
    try {
        const userId = req.body.userId;
        const competitionId = req.body.competitionId;
        const attendPoint = req.body.attendPoint;

        const userApplication = await UserApplication.findOne({
            where: {
                userId: userId,
                competitionId: competitionId
            }
        });

        if (userApplication) {
            return res.status(400).send({msg: 'ALREADY_APPLIED'});
        }

        const attendingContest = await UserCompetition.findOne({
            where: {
                userId: userId,
            },
            include: [{
                model: Competition,
                attributes: ['id'],
                where: {
                    startDate: {
                        [Op.lte]: new Date().getTime()
                    },
                    endDate: {
                        [Op.gte]: new Date().getTime()
                    }
                },
            }]
        })

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        if (attendingContest && !competition.duplicateAllow) {
            return res.status(400).send({msg: 'NOT_REPEAT_APPLYING'});
        }

        const profile = await Profile.findOne({
            where: {
                userId: userId,
            }
        });

        if (!profile || profile.pointAmount < attendPoint) {
            return res.status(400).send({msg: 'POINT_NOT_ENOUGH'});
        }

        await UserApplication.create({
            userId: userId,
            competitionId: competitionId,
            createdDate: new Date()
        });

        if (attendPoint > 0) {
            // update the pointAmount, level, exp, and style
            await updatePoint(userId, attendPoint, 0, 'Accept Contest');
        }
        // profile.exp += 150;
        // profile.level = Math.floor(profile.exp / 1000);
        // const attendCount = await UserCompetition.count({
        //     where: {userId: userId},
        // });
        //
        // if (profile.userStyleId <= 5) {
        //     if (attendCount <= 1) {
        //         profile.userStyleId = 1;
        //     } else if (attendCount <= 10) {
        //         profile.userStyleId = 2;
        //     } else if (attendCount <= 20) {
        //         profile.userStyleId = 3;
        //     } else if (attendCount <= 50) {
        //         profile.userStyleId = 4;
        //     } else if (attendCount <= 100) {
        //         profile.userStyleId = 5;
        //     }
        // }
        // await profile.save();

        if (attendPoint > 0) {
            profile.pointAmount -= attendPoint;
        }

        return res.status(200).send({result: 'SUCCESS_COMPETITION_APPLY', userInfo: profile});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.attendCompetition = async (req, res) => {
    try {
        const userId = req.body.userId;
        const competitionId = req.body.competitionId;
        const attendPoint = req.body.attendPoint;
        console.log('contest id: ', competitionId)

        const userCompetition = await UserCompetition.findOne({
            where: {
                userId: userId,
                competitionId: competitionId
            }
        });

        if (userCompetition) {
            return res.status(400).send({msg: 'ALREADY_ATTENDED'});
        }

        const attendingContest = await UserCompetition.findOne({
            where: {
                userId: userId,
            },
            include: [{
                model: Competition,
                attributes: ['id'],
                where: {
                    startDate: {
                        [Op.lte]: new Date().getTime()
                    },
                    endDate: {
                        [Op.gte]: new Date().getTime()
                    }
                },
            }]
        })

        const competition = await Competition.findOne({
            where: {id: competitionId}
        });

        if (attendingContest && !competition.duplicateAllow) {
            return res.status(400).send({msg: 'NOT_REPEAT_ATTENDING'});
        }

        const profile = await Profile.findOne({
            where: {
                userId: userId,
            }
        });

        if (!profile || profile.pointAmount < attendPoint) {
            return res.status(400).send({msg: 'POINT_NOT_ENOUGH'});
        }

        await UserCompetition.create({
            userId: userId,
            competitionId: competitionId,
            createdDate: new Date()
        });

        if (attendPoint > 0) {
            // update the pointAmount, level, exp, and style
            await updatePoint(userId, attendPoint, 0, 'Attending');
            profile.pointAmount -= attendPoint;
        }

        profile.exp += 150;
        profile.level = Math.floor(profile.exp / 1000);
        const attendCount = await UserCompetition.count({
            where: {userId: userId},
        });

        // if (profile.userStyleId <= 5) {
        //     if (attendCount < 1) {
        //         profile.userStyleId = 0;
        //     } else if (attendCount <= 10) {
        //         profile.userStyleId = 1;
        //     } else if (attendCount <= 20) {
        //         profile.userStyleId = 2;
        //     } else if (attendCount <= 50) {
        //         profile.userStyleId = 3;
        //     } else if (attendCount <= 100) {
        //         profile.userStyleId = 4;
        //     } else {
        //         profile.userStyleId = 5;
        //     }
        // }

        const record = await getRecordByUser(userId);
        const championShipCount = record.rankChampionshipCount + record.questChampionshipCount;

        if (championShipCount === 0) {
            const userStyles = await UserStyle.findAll({
                order: [['attendLimit', 'DESC']],
                where: {
                    attendLimit: {[Op.gt]: 0}
                }
            })
            let userStyleId;
            for (const item of userStyles) {
                if (attendCount >= item.attendLimit) {
                    userStyleId = item.id;
                    break;
                }
            }

            profile.userStyleId = userStyleId;
        }

        await profile.save();

        return res.status(200).send({result: 'SUCCESS_COMPETITION_ATTEND', userInfo: profile});
    } catch (err) {
        console.log(err)
        return res.status(500).send({msg: err.toString()});
    }
}

exports.cancelCompetition = async (req, res) => {
    const userId = req.body.userId;
    const competitionId = req.body.competitionId;

    try {
        const cnt = await UserCompetition.destroy({
            where: {
                userId: userId,
                competitionId: competitionId
            }
        });

        if (cnt === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }

        const profile = await Profile.findOne({
            where: {
                userId: userId,
            }
        });

        // update the pointAmount, level, exp, and style
        profile.exp -= 150;
        profile.level = Math.floor(profile.exp / 1000);
        const attendCount = await UserCompetition.count({
            where: {userId: userId},
        });

        // if (profile.userStyleId <= 5) {
        //     if (attendCount < 1) {
        //         profile.userStyleId = 0;
        //     } else if (attendCount <= 10) {
        //         profile.userStyleId = 1;
        //     } else if (attendCount <= 20) {
        //         profile.userStyleId = 2;
        //     } else if (attendCount <= 50) {
        //         profile.userStyleId = 3;
        //     } else if (attendCount <= 100) {
        //         profile.userStyleId = 4;
        //     } else {
        //         profile.userStyleId = 5;
        //     }
        // }

        const record = await getRecordByUser(userId);
        const championShipCount = record.rankChampionshipCount + record.questChampionshipCount;

        if (championShipCount === 0) {
            const userStyles = await UserStyle.findAll({
                order: [['attendLimit', 'DESC']],
                where: {
                    attendLimit: {[Op.gt]: 0}
                }
            })
            let userStyleId;
            for (const item of userStyles) {
                if (attendCount >= item.attendLimit) {
                    userStyleId = item.id;
                    break;
                }
            }

            profile.userStyleId = userStyleId;
        }

        await profile.save();

        return res.status(200).send({result: 'SUCCESS_COMPETITION_CANCEL', userInfo: profile});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

const getRecordByUser = async (userId) => {
    let totalDiaryCount = 0;
    let rankDiaryCount = 0;
    let questDiaryCount = 0;
    let rankChampionshipCount = 0;
    let questChampionshipCount = 0;

    totalDiaryCount = await Fish.count({
        where: {
            userId: userId
        }
    });

    const myCompetitions = await UserCompetition.findAll({
        where: {userId: userId},
        include: [{
            model: Competition,
        }]
    });

    for (const item of myCompetitions) {
        if (new Date(item.competition.endDate).getTime() < new Date().getTime()) {
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

exports.getStyleStatistic = async (req, res) => {
    try {
        let result = [];
        for (let i = 1; i < 9; i++) {
            const temp = await Profile.count({
                where: {
                    userStyleId: i,
                }
            });

            result.push(temp);
        }
        return res.status(200).send({result: result});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getUserPointHistory = (req, res) => {
    UserPoint.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        where: {
            userId: req.body.userId
        }
    }).then(async data => {
        const count = await UserPoint.count({
            where: {
                userId: req.body.userId
            }
        })
        return res.status(200).send({result: data, totalCount: count});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    });

}

exports.updateUserPoint = async (req, res) => {
    try {
        const userId = req.body.userId;
        const pointAmount = req.body.pointAmount;
        const originPoint = req.body.originPoint;
        console.log('origin Point: ', originPoint)

        const profile = await Profile.findOne({
            where: {userId: userId}
        });

        profile.pointAmount = pointAmount;
        await profile.save();

        const userPoint = await UserPoint.create({
            userId: userId,
            content: 'Admin Change',
            point: pointAmount,
            originPoint: originPoint,
            createdDate: new Date()
        });

        return res.status(200).send({result: userPoint});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}


const Test = db.test
exports.testing = async (req, res) => {
    try {
        // const rank = db.Sequelize.literal('(RANK() OVER (ORDER BY point DESC))');
        // const data = await Test.findAll({
        //     // order: [['point', 'DESC']],
        //     attributes: [
        //         'id', 'point',
        //         [rank, 'rank']
        //     ]
        // });


        const [winners, metadata] = await db.sequelize.query(`
                    SELECT *,
                    (
                        SELECT 1+ count(*)
                        FROM userCompetitions uc1
                        WHERE uc1.record1 > uc.record1
                    ) as rank
                    FROM userCompetitions uc
                    HAVING competitionId = 15 and rank < 4
                    ORDER BY uc.record1 DESC
                `);


        return res.status(200).send({result: winners});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }

}

