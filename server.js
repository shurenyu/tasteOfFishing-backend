const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require('path');
const cors = require("cors");
const filesRouter = require("./app/file_upload.routes");
const eventRouter = require("./app/controllers/event.controller");
const {rewarding} = require("./app/controllers/fish.controller");
const schedule = require('node-schedule');
const {getSubTokens, sendNotification} = require("./app/utils/push-notification");

// cors policy
const corsOptions = {
    "origin": "*",
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json({limit: '10mb'}));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({limit: '10mb', extended: false}));

// configuration for file upload
app.use(express.static(path.join(__dirname, 'public')));
app.use("/public", express.static("public"));
app.use('/file', filesRouter);

// Event Handler using SSE
app.use('/events', eventRouter);

// database model
const db = require("./app/models");
const Op = db.Sequelize.Op;

db.sequelize.sync().then(res => {
    db.sequelize.sync();
});


app.get("/", (req, res) => {
    res.json({msg: ["Welcome to fishing app"]});
});

const CHECK_INTERVAL = 24 * 3600000;
const DELTA = 7 * 24 * 3600000;


let tmr = setInterval(async function () {
    db.user.findAll({
        attributes: ['id'],
        where: {
            updatedDate: {
                [Op.lt]: new Date().getTime() - DELTA,
            },
            '$profile.serviceAlarm$': 1
        },
        include: [{
            model: db.profile,
        }]
    }).then(async users => {
        const userIds = users.map(x => (x.id));
        console.log('userIds: ', userIds.includes(69));

        const registeredTokens = await getSubTokens(userIds);
        await sendNotification(registeredTokens, {
            message: 'You used Taste of fising app for a week',
            data: {home: 1, message: 'You used Taste of fising app for a week'}
        });
    }).catch(err => {
        console.log(err);
    })
}, CHECK_INTERVAL);

// routes
require('./app/routes/auth.routes')(app);
require('./app/routes/user.routes')(app);
require('./app/routes/competition.routes')(app);
require('./app/routes/post.routes')(app);
require('./app/routes/configuration.routes')(app);
// require('./app/routes/diary.routes')(app);
require('./app/routes/fish.routes')(app);
require('./app/routes/notice.routes')(app);
require('./app/routes/question.routes')(app);
require('./app/routes/report.routes')(app);
require('./app/routes/terms.routes')(app);
require('./app/routes/withdrawal.routes')(app);
require('./app/routes/dashboard.routes')(app);
require('./app/routes/posCode.routes')(app);


// set port, listen for requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

