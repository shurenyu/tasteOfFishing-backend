const db = require("../models");
const FishType = db.fishType;

exports.registerFishType = (req, res) => {
    const data = {
        name: req.body.name,
        createdDate: new Date(),
    };

    FishType.create(data)
        .then(data => {
            return res.status(200).send({result: data, message: 'FISH_TYPE_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.getAllFishTypes = (req, res) => {
    FishType.findAll()
        .then(data => {
            return res.status(200).send({result: data});
        }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getFishTypeById = (req, res) => {
    const fishTypeId = req.body.fishTypeId;
    FishType.findOne({
        where: {id: fishTypeId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.updateFishType = async (req, res) => {
    const fishTypeId = req.body.fishTypeId;

    try {
        const fishType = await FishType.findOne({
            where: {id: fishTypeId}
        });

        if (!fishType) {
            return res.status(404).send({msg: 'FISH_TYPE_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'fishTypeId') {
                fishType[key] = req.body[key];
            }
        }
        await fishType.save();

        return res.status(200).send({result: 'FISH_TYPE_UPDATE_SUCCESS'});

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.deleteFishType = (req, res) => {
    const fishTypeId = req.body.fishTypeId;

    FishType.destroy({
        where: {id: fishTypeId}
    }).then(data => {
        return res.status(200).send({result: 'FISH_TYPE_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};
