const postCollection = require("../db").db().collection("post")
const ObjectID = require('mongodb').ObjectId

let Post = function(data, userid) {
    this.data = data
    this.errors = []
    this.userid = userid
}

Post.prototype.cleanUp = function() {
    if(typeof(this.data.title) != "string") {this.data.title = ""}
    if(typeof(this.data.body) != "string") {this.data.body = ""}

    // get rid of any bogus properties
    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
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
            postCollection.insertOne(this.data).then(() => {
                resolve()
            }).catch(() => {
                this.errors.push("Please try again later")
                reject(this.errors)
            })
        }else{
            reject(this.errors)
        }
    })
}

module.exports = Post