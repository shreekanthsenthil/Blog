const postCollection = require("../db").db().collection("post")
const ObjectID = require('mongodb').ObjectId
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

let Post = function(data, userid, requestedPostId) {
    this.data = data
    this.errors = []
    this.userid = userid
    this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function() {
    if(typeof(this.data.title) != "string") {this.data.title = ""}
    if(typeof(this.data.body) != "string") {this.data.body = ""}

    // get rid of any bogus properties
    this.data = {
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes:[]}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes:[]}),
        createdDate: new Date(),
        author: ObjectID(this.userid)
    }
}

Post.prototype.validate = function() {
    if(this.data.title =="") {this.errors.push("You must provide title")}
    if(this.data.body == "") {this.errors.push("You must provide a post content")}
    
}

Post.prototype.create = function() {
    console.log(this.data)
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length){
            postCollection.insertOne(this.data).then((info) => {
                resolve(info.ops[0]._id)
            }).catch(() => {
                this.errors.push("Please try again later")
                reject(this.errors)
            })
        }else{
            reject(this.errors)
        }
    })
}

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid)
            if (post.isVisitorOwner) {
                //update db
                let status = await this.actuallyUpdate()
                resolve(status)
            }
        } catch {
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length) {
            await postCollection.findOneAndUpdate({_id: ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
            resolve("success")
        } else {
            resolve("failure")
        }
    })
}

Post.reusablePostQuery = function(ops, visitorId) {
    return new Promise(async function(resolve, reject) {
        let aggOperations = ops.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])
        let posts = await postCollection.aggregate(aggOperations).toArray()

        // clean up author property
        posts = posts.map((post) => {
            post.isVisitorOwner = post.authorId.equals(visitorId)
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar 
            }
            return post
        })        
        resolve(posts)
    })
}

Post.findSingleById = function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        if(typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }
        
        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

        if(posts.length) {
            console.log(posts[0])
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId) {
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}}
    ])
}

module.exports = Post