const db = require("../models");
const Withdrawal = db.withdrawal;
const Profile = db.profile;
const User = db.user;
const AccountType = db.accountType;
const UserPoint = db.userPoint;


/**
 *
 * @param userId
 * @param amount
 * @param action
 *          0-SUBTRACT
 *          1-ADD
 * @param content
 * @returns {Promise<string>}
 */
exports.updatePoint = async (userId, amount, action, content) => {
    try {
        const profile = await Profile.findOne({
            where: {userId: userId}
        });

        if (profile) {
            profile.pointAmount = action === 1 ? profile.pointAmount + amount : profile.pointAmount - amount;
            await profile.save();

            await UserPoint.create({
                userId: userId,
                content: content,
                point: action === 1 ? amount : -amount,
                createdDate: new Date(),
            });
        }
        return 'success';
    } catch (err) {
        return err.toString();
    }
}

const updatePointAmount = async (userId, amount, action, content) => {
    try {
        const profile = await Profile.findOne({
            where: {userId: userId}
        });

        if (profile) {
            if (action === 0 && profile.pointAmount < amount) return 'NOT_ENOUGH_POINT';

            profile.pointAmount = action === 1 ? profile.pointAmount + amount : profile.pointAmount - amount;
            await profile.save();

            await UserPoint.create({
                userId: userId,
                content: content,
                point: action === 1 ? amount : -amount,
                createdDate: new Date(),
            });
        }
        return 'success';
    } catch (err) {
        return err.toString();
    }
}

exports.applyWithdrawal = async (req, res) => {
    try {
        const data = {
            userId: req.body.userId,
            pointAmount: req.body.pointAmount,
            receiverName: req.body.receiverName,
            phoneNumber: req.body.phoneNumber,
            accountTypeId: req.body.accountTypeId,
            accountNumber: req.body.accountNumber,
            citizenNumber: req.body.citizenNumber,
            createdDate: new Date(),
        };

        const response = await Withdrawal.create(data);
        const result = await updatePointAmount(req.body.userId, req.body.pointAmount, 0, 'Withdraw');
        if (result === 'NOT_ENOUGH_POINT') {
            return res.status(200).send({msg: 'NOT_ENOUGH_POINT'});
        }

        return res.status(200).send({result: 'WITHDRAWAL_REGISTER_SUCCESS', data: response});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getAllWithdrawal = (req, res) => {
    Withdrawal.hasOne(User, {sourceKey: 'userId', foreignKey: 'id'});
    Withdrawal.hasOne(AccountType, {sourceKey: 'accountTypeId', foreignKey: 'id'});

    Withdrawal.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        include: [{
            model: User,
            attributes: ['id', 'name']
        }, {
            model: AccountType,
        }]
    })
        .then(async data => {
            const totalCount = await Withdrawal.count();
            return res.status(200).send({result: data, totalCount: totalCount});
        }).catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.getWithdrawalById = (req, res) => {
    const withdrawalId = req.body.withdrawalId;
    Withdrawal.findOne({
        where: {id: withdrawalId}
    }).then((data) => {
        return res.status(200).send({data: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getWithdrawalByUser = (req, res) => {
    Withdrawal.hasOne(User, {sourceKey: 'userId', foreignKey: 'id'});
    Withdrawal.hasOne(AccountType, {sourceKey: 'accountTypeId', foreignKey: 'id'});

    const userId = req.body.userId;
    Withdrawal.findOne({
        where: {
            userId: userId,
            status: 0
        },
        include: [{
            model: User,
            attributes: ['id', 'name']
        }, {
            model: AccountType,
        }]
    }).then((data) => {
        return res.status(200).send({result: 'WITHDRAWAL_GET_SUCCESS', data: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.cancelWithdrawal = async (req, res) => {
    try {
        const withdrawalInfo = await Withdrawal.findOne({
            where: {
                id: req.body.id
            }
        });

        if (withdrawalInfo.status > 0) {
            return res.status(200).send({msg: 'WITHDRAWAL_FINISHED'});
        }

        await updatePointAmount(req.body.userId, req.body.pointAmount, 1, 'Cancel withdraw');

        await Withdrawal.destroy({
            where: {
                id: req.body.id,
                userId: req.body.userId,
                status: 0,
            }
        });

        return res.status(200).send({result: 'WITHDRAWAL_CANCEL_SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

/**
 *
 * @param req keys: {withdrawalId, status}
 *              status: 1-SUCCESS
 *                      2-FAILED
 *                      3-CANCEL
 * @param res
 * @returns {Promise<*>}
 */
exports.finishWithdrawal = async (req, res) => {
    try {
        const withdrawalId = req.body.withdrawalId;
        const status = req.body.status;

        const withdrawal = await Withdrawal.findOne({
            where: {id: withdrawalId}
        });

        if (withdrawal.status === 0) {
            await updateWithdrawalStatus(withdrawalId, status);
            if (status > 1) {
                await updatePointAmount(withdrawal.userId, withdrawal.pointAmount, 1, 'Cancel Withdraw');
            }
        }

        return res.status(200).send({result: 'WITHDRAWAL_FINISH_SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

/**
 *
 * @param withdrawalId
 * @param status
 *              0-PENDING
 *              1-SUCCESS
 *              2-FAILED
 *              3-CANCEL
 * @returns {Promise<string>}
 */
const updateWithdrawalStatus = async (withdrawalId, status) => {
    try {
        const withdrawal = await Withdrawal.findOne({
            where: {id: withdrawalId}
        });

        withdrawal.status = status;
        withdrawal.finishedDate = new Date();
        await withdrawal.save();
        return 'success';
    } catch (err) {
        return err.toString();
    }
}



exports.registerAccountType = (req, res) => {
    AccountType.create({
        type: req.body.accountType,
        createdDate: new Date()
    }).then(data => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getAllAccountType = (req, res) => {
    AccountType.findAll()
        .then(data => {
            return res.status(200).send({result: data});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
}

exports.deleteAccountType = (req, res) => {
    AccountType.destroy({
        where: {
            id: req.body.accountTypeId
        }
    }).then(cnt => {
        if (cnt === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: cnt});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}
