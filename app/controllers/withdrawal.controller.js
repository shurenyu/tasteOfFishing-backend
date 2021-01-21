const db = require("../models");
const Withdrawal = db.withdrawal;
const Profile = db.profile;
const User = db.user;
const AccountType = db.accountType;

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

        await Withdrawal.create(data);
        await updatePoint(req.body.userId, req.body.pointAmount, 0);

        return res.status(200).send({result: 'WITHDRAWAL_REGISTER_SUCCESS'});
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
        order: [['createdDate', 'ASC']],
        include: [{
            model: User,
            attributes: ['id', 'name']
        }, {
            model: AccountType,
        }]
    })
        .then(data => {
            return res.status(200).send({result: data});
        }).catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.getWithdrawalById = (req, res) => {
    const withdrawalId = req.body.withdrawalId;
    Withdrawal.findOne({
        where: {id: withdrawalId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getWithdrawalByUser = (req, res) => {
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
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

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

        await updateWithdrawalStatus(withdrawalId, status);

        if (status > 1) {
            await updatePoint(withdrawal.userId, withdrawal.pointAmount, 1);
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

/**
 *
 * @param userId
 * @param amount
 * @param action
 *          0-SUBTRACT
 *          1-ADD
 * @returns {Promise<string>}
 */
const updatePoint = async (userId, amount, action) => {
    try {
        const profile = await Profile.findOne({
            where: {userId: userId}
        });

        profile.pointAmount = action === 1 ? profile.pointAmount + amount : profile.pointAmount - amount;
        await profile.save();
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
        return res.status(200).send({result: 'WITHDRAWAL_ACCOUNTTYPE_REGISTER_SUCCESS'});
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
        return res.status(200).send({result: cnt});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}
