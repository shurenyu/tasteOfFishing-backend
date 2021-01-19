const db = require("../models");
const Post = db.post;
const PostComment = db.postComment;
const PostCommentReply = db.postCommentReply;

exports.registerPost = (req, res) => {
    const newPost = {
        userId: req.body.userId,
        image: req.body.image,
        content: req.body.content,
        createdDate: new Date(),
    };

    Post.create(newPost)
        .then(data => {
            return res.status(200).send({result: 'POST_REGISTER_SUCCESS'});
        })
        .catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.getPostByUser = async (req, res) => {
    try {
        const userId = req.body.userId;
        console.log("userId: ", userId)

        const count = await Post.count({
            where: {userId: userId}
        });
        console.log('count: ', count)

        const data = await Post.findAll({
            limit: req.body.limit || 1000000,
            offset: req.body.offset || 0,
            where: {userId: userId}
        })
        console.log(data.data)

        return res.status(200).send({result: data, totalCount: count});
    } catch (err) {
        return res.status(500).send({msg: err.toString()});
    }
};

exports.getPostById = (req, res) => {
    const postId = req.body.postId;
    Post.findOne({
        where: {id: postId}
    }).then((data) => {
        return res.status(200).send({result: data});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};

exports.getAllPosts = (req, res) => {
    Post.findAll()
        .then(data => {
            return res.status(200).send({result: data});
        }).catch(err => {
            return res.status(500).send({msg: err.toString()});
        })
};

exports.updatePost = async (req, res) => {
    const postId = req.body.postId;

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

    PostComment.create(data)
        .then((data) => {
            return res.status(200).send({result: 'POST_COMMENT_REGISTER_SUCCESS'});
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
            return res.status(200).send({result: 'POST_COMMENT_REPLY_REGISTER_SUCCESS'});
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
        return res.status(200).send({result: 'POST_COMMENT_REPLY_DELETE_SUCCESS'});
    }).catch(err => {
        return res.status(500).send({msg: err.toString()});
    })
};
