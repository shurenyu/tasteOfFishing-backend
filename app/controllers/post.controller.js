const {getSubTokens, sendNotification} = require("../utils/push-notification");

const db = require("../models");
const Post = db.post;
const PostComment = db.postComment;
const PostCommentReply = db.postCommentReply;
const PostImage = db.postImage;
const User = db.user;
const Profile = db.profile;
const Report = db.report;

exports.registerPost = async (req, res) => {
    try {
        const data = await Post.create({
            userId: req.body.userId,
            link: req.body.link || '',
            content: req.body.content,
            disabled: 0,
            createdDate: new Date(),
        });

        if (req.body.images && req.body.images.length > 0) {
            const images = req.body.images.map(x => ({
                postId: data.id,
                image: x,
            }));

            await PostImage.bulkCreate(images, {returning: true});
        }

        const profile = await Profile.findOne({
            where: {userId: req.body.userId}
        });

        if (profile) {
            profile.exp += 100;
            profile.level = Math.floor(profile.exp / 1000);
            await profile.save();
        }

        return res.status(200).send({result: 'POST_REGISTER_SUCCESS', data: data.id});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.registerPostImages = (req, res) => {
    PostImage.created({
        postId: req.body.postId,
        image: req.body.image,
    }).then(data => {
        return res.status(200).send({result: 'POST_IMAGE_REGISTER_SUCCESS', data: data.id});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
}

exports.getPostByUser = async (req, res) => {
    try {
        const userId = req.body.userId;

        const count = await Post.count({
            where: {
                userId: userId,
                disabled: 0,
            }
        });

        const data = await Post.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            order: [['createdDate', 'DESC']],
            where: {userId: userId, disabled: 0},
            include: [{
                model: User,
                attributes: ['id', 'name', 'type'],
                include: [{
                    model: Profile,
                    attributes: ['id', 'avatar']
                }]
            }, {
                model: PostImage,
            }, {
                model: PostComment,
                include: [{
                    model: User,
                    attributes: ['id', 'name', 'type'],
                    include: [{
                        model: Profile,
                        attributes: ['id', 'avatar']
                    }]
                }]
            }]
        })

        return res.status(200).send({result: data, totalCount: count});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getPostById = (req, res) => {
    const postId = parseInt(req.body.postId);
    Post.findOne({
        where: {id: postId},
        include: [{
            model: User,
            attributes: ['id', 'name', 'type'],
            include: [{
                model: Profile,
                attributes: ['id', 'avatar']
            }]
        }, {
            model: PostImage,
        }, {
            model: PostComment,
            order: [['createdDate', 'ASC']],
            include: [{
                model: PostCommentReply,
            }, {
                model: User,
                attributes: ['id', 'name', 'type'],
                include: [{
                    model: Profile,
                    attributes: ['id', 'avatar']
                }]
            }]
        }]
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getAllPostsForAdmin = (req, res) => {
    Post.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        include: [{
            model: User,
            attributes: ['id', 'name', 'type'],
            include: [{
                model: Profile,
                attributes: ['id', 'avatar']
            }]
        }, {
            model: PostImage
        }, {
            model: PostComment,
            attributes: ['id'],
        }],
    })
        .then(async data => {
            const count = await Post.count();
            return res.status(200).send({result: data, totalCount: count});
        }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getAllPosts = (req, res) => {
    Post.findAll({
        limit: req.body.limit || 1000000,
        offset: req.body.offset || 0,
        order: [['createdDate', 'DESC']],
        where: {disabled: 0},
        include: [{
            model: User,
            attributes: ['id', 'name', 'type'],
            include: [{
                model: Profile,
                attributes: ['id', 'avatar']
            }]
        }, {
            model: PostImage
        }, {
            model: PostComment,
            attributes: ['id'],
        }],
    })
        .then(async data => {
            const count = await Post.count();
            return res.status(200).send({result: data, totalCount: count});
        }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.searchPosts = async (req, res) => {
    const keyword = req.body.keyword;

    try {
        const [posts, metadata] = await db.sequelize.query(`
            SELECT posts.*, users.name as userName, users.type as userType, postImages.postId, postImages.image, profiles.username, profiles.avatar
            FROM posts
            LEFT JOIN users ON users.id = posts.userId
            LEFT JOIN profiles ON users.id = profiles.userId
            LEFT JOIN postImages ON postImages.postId = posts.id
            WHERE (users.name LIKE '%${keyword}%' OR content LIKE '%${keyword}%' OR profiles.username LIKE '%${keyword}%') AND posts.disabled = 0
            ORDER BY createdDate DESC
            LIMIT ${req.body.limit || 1000000}
            OFFSET ${req.body.offset || 0}
        `);

        const [count, metadata2] = await db.sequelize.query(`
            SELECT COUNT(*) AS count
            FROM posts 
            INNER JOIN users ON users.id = posts.userId
            INNER JOIN profiles ON users.id = profiles.userId
            LEFT JOIN postImages ON postImages.postId = posts.id
            WHERE (users.name LIKE '%${keyword}%' OR content LIKE '%${keyword}%' OR profiles.username like '%${keyword}%') AND posts.disabled = 0
        `)

        let result = [];

        console.log('postLength: ', posts.length)
        for (const x of posts) {
            const idx = result.findIndex(y => y.id === x.id);
            if (idx === -1) {
                const duplicates = posts.filter(y => y.id === x.id);
                const postImages = duplicates.map(y => ({image: y.image}));
                result.push({
                    id: x.id,
                    userId: x.userId,
                    link: x.link,
                    content: x.content,
                    createdDate: x.createdDate,
                    updatedDate: x.updatedDate,
                    user: {
                        id: x.userId,
                        name: x.userName,
                        type: x.userType,
                        profile: {
                            avatar: x.avatar,
                            username: x.username,
                        }
                    },
                    postImages: postImages,
                })
            }
        }

        return res.status(200).send({result: result, totalCount: count[0].count});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.updatePost = async (req, res) => {
    const postId = parseInt(req.body.postId);

    try {
        const post = await Post.findOne({
            where: {id: postId}
        });

        if (!post) {
            return res.status(404).send({msg: 'POST_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'postId') {
                post[key] = req.body[key];
            }
        }
        await post.save();

        if (req.body.images) {
            const imageList = JSON.parse(JSON.stringify(req.body.images));
            const images = imageList.map(x => ({
                postId: postId,
                image: x,
            }));

            await PostImage.destroy({
                where: {postId: postId}
            });

            await PostImage.bulkCreate(images, {returning: true});
        }

        return res.status(200).send({result: 'POST_UPDATE_SUCCESS'});

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.deletePost = (req, res) => {
    const postId = req.body.postId;

    Post.destroy({
        where: {id: postId}
    }).then(data => {
        if (data === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: 'POST_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.registerPostComment = (req, res) => {
    const data = {
        postId: req.body.postId,
        userId: req.body.userId,
        comment: req.body.comment,
        createdDate: new Date(),
    }

    console.log(data)

    PostComment.create(data)
        .then(async (data) => {
            const profile = await Profile.findOne({
                where: {userId: req.body.userId}
            });

            profile.exp += 50;
            profile.level = Math.floor(profile.exp / 1000);
            await profile.save();
            res.status(200).send({result: 'POST_COMMENT_REGISTER_SUCCESS', data: data.id});

            // push notification
            const post = await Post.findOne({
                where: {id: req.body.postId}
            });
            if (!post) {
                return res.status(404).send({msg: 'POST_NOT_FOUND'});
            }
            const registeredToken = await getSubTokens(post.userId);

            console.log('작성하신 게시물에 댓글이 달렸습니다')

            return sendNotification(registeredToken, {
                message: '작성하신 게시물에 댓글이 달렸습니다',
                data: {postId: post.id, message: '작성하신 게시물에 댓글이 달렸습니다'}
            });
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.updatePostComment = async (req, res) => {
    const postCommentId = req.body.postCommentId;

    try {
        const postComment = await PostComment.findOne({
            where: {id: postCommentId}
        });

        if (!postComment) {
            return res.status(404).send({msg: 'POST_COMMENT_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'postCommentId') {
                postComment[key] = req.body[key];
            }
        }
        await postComment.save();

        return res.status(200).send({result: 'POST_COMMENT_UPDATE_SUCCESS'});

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getPostCommentByPost = (req, res) => {
    const postId = req.body.postId;
    PostComment.findAll({
        where: {postId: postId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.deletePostComment = (req, res) => {
    const postCommentId = req.body.postCommentId;

    PostComment.destroy({
        where: {id: postCommentId}
    }).then(data => {
        if (data === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: 'POST_COMMENT_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.registerPostCommentReply = (req, res) => {
    const data = {
        postCommentId: req.body.postCommentId,
        userId: req.body.userId,
        content: req.body.content,
        createdDate: new Date(),
    }

    PostCommentReply.create(data)
        .then((data) => {
            return res.status(200).send({result: 'POST_COMMENT_REPLY_REGISTER_SUCCESS', data: data.id});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.updatePostCommentReply = async (req, res) => {
    const postCommentReplyId = req.body.postCommentReplyId;

    try {
        const postCommentReply = await PostCommentReply.findOne({
            where: {id: postCommentReplyId}
        });

        if (!postCommentReply) {
            return res.status(404).send({msg: 'POST_COMMENT_REPLY_NOT_FOUND'});
        }

        const keys = Object.keys(req.body);
        for (const key of keys) {
            if (key !== 'postCommentReplyId') {
                postCommentReply[key] = req.body[key];
            }
        }
        await postCommentReply.save();

        return res.status(200).send({result: 'POST_COMMENT_REPLY_UPDATE_SUCCESS'});

    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
}

exports.getPostCommentReplyByPostComment = (req, res) => {
    const postCommentId = req.body.postCommentId;
    PostCommentReply.findAll({
        where: {postCommentId: postCommentId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.deletePostCommentReply = (req, res) => {
    const postCommentReplyId = req.body.postCommentReplyId;

    PostCommentReply.destroy({
        where: {id: postCommentReplyId}
    }).then(data => {
        if (data === 0) {
            return res.status(404).send({msg: 'INVALID_ID'});
        }
        return res.status(200).send({result: 'POST_COMMENT_REPLY_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.deletePostAndUpdateReport = async (req, res) => {
    const reportId = req.body.reportId;
    const postId = req.body.postId;

    try {
        const post = await Post.findOne({
            where: {id: postId}
        });

        post.disabled = 1;
        await post.save();

        const report = await Report.findOne({
            where: {id: reportId}
        });

        report.status = 2;
        await report.save();

        return res.status(200).send({result: 'SUCCESS'});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};
