const db = require("../models");
const User = db.user;
const Profile = db.profile;

/**
 * Register Profile
 * @param req keys: {userId, username, introMe, avatar, serviceAlarm, adAlarm}
 * @param res
 * @returns {token}
 */
exports.registerProfile = (req, res) => {
    const newProfile = {
        ...req.body
    };
    Profile.create(newProfile)
        .then(data => {
            return res.status(200).send({result: 'USER.PROFILE_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        });
};


exports.updateProfile = async (req, res) => {
    try {
        const profileId = req.body.profileId;
        const userId = req.body.userId;
        const filter = profileId ? {id: profileId} : userId ? {userId: userId} : null;

        if (filter === null) {
            return res.status(404).send({msg: 'USER.PROFILE_NOT_FOUND'});
        }

        const profile = await Profile.findOne({
            where: filter
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

        return res.status(200).send({result: 'USER.PROFILE_UPDATE_SUCCESS'});
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
        where: {userId: userId}
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getAllUsers = async (req, res) => {
    try {
        const userCount = await User.count({
            where: {type: 1}
        });

        const users = await User.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            where: {type: 1},
            attributes: {exclude: ['password']},
        });

        return res.status(200).send({result: users, totalCount: userCount});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getUserById = (req, res) => {
    const userId = req.body.userId;

    User.findOne({
        where: {id: userId}
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
}

exports.getFullUserInfo = (req, res) => {
    const userId = req.body.userId;

    User.findOne({
        where: {id: userId},
        attributes: {exclude: ['password']},
        include: [{
            model: Profile,
        }]
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
}

exports.deleteUserById = (req, res) => {
    const userId = req.body.userId;

    User.destroy({
        where: {id: userId}
    }).then(cnt => {
        return res.status(200).send({result: cnt});
    }).catch(err => {
        return res.status(200).send({msg: err.toString()});
    })
}
