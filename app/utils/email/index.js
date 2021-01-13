const config = require("../../config/auth.config")
const nodemailer = require("nodemailer");
const mailConfig = {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'connectzero.dev@gmail.com',
        pass: 'zjwp123!!'
    }
};

const transporter = nodemailer.createTransport(mailConfig);

const sendMail = (res, to, user_name, userId, subject, content) => {
    transporter.sendMail({
        from: 'Customer Center <connectzero.dev@gmail.com>',
        to: `${user_name} <${to}>`,
        subject: subject,
        text: 'Hello, dear user!',
        html: content
    }, function (err, info) {
        if (err) {
            return res.status(500).send({msg: "AUTH.ERROR", err: err.toString()});
        } else {
            return res.status(200).json({
                period: config.PENDING_EXPIRATION / 60000,
                email: to,
                userId: userId,
            });
        }
    });
};

module.exports = sendMail;
