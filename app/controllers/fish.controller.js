const db = require("../models");
const Fish = db.fish;
const Diary = db.diary;
const Competition = db.competition;
const FishImage = db.fishImage;
const User = db.user;
const Profile = db.profile;
const Op = db.Sequelize.Op;

exports.commitFish = (req, res) => {
    const newFish = {
        userId: req.body.userId,
        competitionId: req.body.competitionId,
        registerDate: new Date(),
    };

    Fish.create(newFish)
        .then(data => {
            return res.status(200).send({result: data});
        })
        .catch(err => {
            return res.status(200).send({msg: err.toString()});
        })
};

exports.addFishImage = (req, res) => {
    const data = {
        fishId: req.body.fishId,
        image: req.body.image,
    }

    FishImage.create(data)
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
        fish.registerDate = new Date();

        await fish.save();

        /* update the record of diary */

        const competition = await Competition.findOne({
            where: {
                id: fish.competitionId
            }
        });

        const diary = await Diary.findOne({
            where: {
                userId: fish.userId,
                competitionId: fish.competitionId,
            }
        });

        if (competition.mode === 0) {
            const diaryFishes = await Fish.findAll({
                limit: competition.rankFishNumber,
                order: [['fishWidth', 'DESC']]
            });

            let newRecord0 = 0;
            for (const fish of diaryFishes) {
                newRecord0 += fish.fishWidth;
            }

            diary.record0 = newRecord0;
            await diary.save();
        } else if (competition.mode === 1) {
            const diaryFish = await Fish.findOne({
                order: [['fishWidth', 'DESC']]
            });

            diary.record1 = diaryFish.fishWidth;
            await diary.save();
        } else if (competition.mode === 2) {
            diary.record2 = diary.record2 + 1;
            await diary.save();
        } else if (competition.mode === 3) {
            if (fish.fishWidth >= competition.questFishWidth) {
                diary.record3 = diary.record3 + 1;
                await diary.save();
            }
        } else if (competition.mode === 4) {
            if (Math.abs(diary.record4) > Math.abs(fish.fishWidth - competition.questSpecialWidth)) {
                diary.record4 = fish.fishWidth - competition.questSpecialWidth;
                await diary.save();
            }
        }

        return res.status(200).send({result: 'FISH_REGISTER_SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getFishesByUser = (req, res) => {
    const userId = req.body.userId;
    Fish.findAll({
        where: {userId: userId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
};

exports.getFishesByCompetition = (req, res) => {
    const competitionId = req.body.competitionId;

    Fish.findAll({
        where: {competitionId: competitionId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
};
