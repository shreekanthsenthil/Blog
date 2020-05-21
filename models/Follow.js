const userCollection = require('../db').db().collection("users")
const followsCollection = require('../db').db().collection("follows")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')

let Follow = function(followedUsername, authorId) {
    this.followedUsername = followedUsername
    this.authorId = authorId
    this.errors = []
}

Follow.prototype.cleanUp = function() {
    if(typeof(this.followedUsername) != "string") {this.followedUsername = ""}
}

Follow.prototype.validate = async function(action) {
    // followedUsername must exist in database
    let followedAccount = await userCollection.findOne({username: this.followedUsername})
    if(followedAccount) {
        this.followedId = followedAccount._id
    } else {
        this.errors.push("You cannot follow an user that doesnot exist")
    }

    let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
    console.log(doesFollowAlreadyExist)
    if (action == "create") {
        if(doesFollowAlreadyExist) {this.errors.push("You are already following the user.")}
    }
    if (action == "delete") {
        if(!doesFollowAlreadyExist) {this.errors.push("You cannot unfollow user you are not following.")}
    }

    //should not be allowed to follow yourself
    if(this.followedId.equals(this.authorId)) {this.errors.push("You cannot follow yourself")}
}

Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("create")
        if(!this.errors.length) {
            followsCollection.insertOne({followedId : this.followedId, authorId: new ObjectID(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate("delete")
        if(!this.errors.length) {
            followsCollection.deleteOne({followedId : this.followedId, authorId: new ObjectID(this.authorId)})
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {
    let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectID(visitorId)})
    if(followDoc) {
        return true
    }
    else {
        return false
    }
}

Follow.getFollowersById = function(id) {
    return new Promise(async (resolve, reject) => {
        try{
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}},
                {$lookup: {from: "users", localField: "authorId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            followers = followers.map(function(follower) {
                let user = new User(follower, true)
                return {username: follower.username, avatar: user.avatar}
              })
              resolve(followers)
        } catch(e) {
            console.log(e)
            reject()
        }
    })
}

Follow.getFollowingById = function(id) {
    return new Promise(async (resolve, reject) => {
        try{
            let following = await followsCollection.aggregate([
                {$match: {authorId: id}},
                {$lookup: {from: "users", localField: "followedId", foreignField: "_id", as: "userDoc"}},
                {$project: {
                    username: {$arrayElemAt: ["$userDoc.username", 0]},
                    email: {$arrayElemAt: ["$userDoc.email", 0]}
                }}
            ]).toArray()
            following = following.map(function(follow) {
                let user = new User(follow, true)
                return {username: follow.username, avatar: user.avatar}
              })
              resolve(following)
        } catch(e) {
            console.log(e)
            reject()
        }
    })
}

Follow.countFollowersById = function(id) {
    return new Promise(async (resolve, reject) => {
        let followerCount = await followsCollection.countDocuments({followedId: id})
        resolve(followerCount)
    })
}

Follow.countFollowingById = function(id) {
    return new Promise(async (resolve, reject) => {
        let followingCount = await followsCollection.countDocuments({authorId: id})
        resolve(followingCount)
    })
}

module.exports = Follow