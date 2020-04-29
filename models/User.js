const bcrypt = require('bcryptjs')
const userCollection = require('../db').collection("users")
const validator = require('validator')

let User = function(data) {
    this.data = data
    this.errors = []
}

//Validate the fields
User.prototype.validate = function() {
    if(this.data.username == "") {this.errors.push('You must provide an username');}
    if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){this.errors.push('Username can contain only Alphabets and numbers')}
    if(!validator.isEmail(this.data.email)) {this.errors.push('You must provide an email address');}
    if(this.data.password == "") {this.errors.push('You must provide a password');}
    if(this.data.password.length > 0 && this.data.password.length < 12) {this.errors.push('Passoword must be atleast 12 characters')}
    if(this.data.password.length > 50) {this.errors.push('Password cannot exceed 50 characters')}
    if(this.data.username.length > 0 && this.data.username.length <3){this.errors.push('Username must be atleast 3 characters')}
    if(this.data.username.length > 30) {this.errors.push('Username cannot exceed 30 characters')}
}

User.prototype.cleanUp = function() {
    //To check if it is a string
    if (typeof(this.data.username) != "string" ) {this.data.username = ""}
    if (typeof(this.data.email) != "string" ) {this.data.email = ""}
    if (typeof(this.data.password) != "string" ) {this.data.password = ""}

    // get rid of bogus properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.register = function() {
    //Validate Data
    this.cleanUp()
    this.validate()

    //Save data to db
    if(!this.errors.length) {
        // hash password
        let salt = bcrypt.genSaltSync(10);
        this.data.password = bcrypt.hashSync(this.data.password, salt)
        userCollection.insertOne(this.data)
    }
}

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp();
        userCollection.findOne({username: this.data.username}).then((attemptedUser) => {
        if (attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
            resolve("Congrats");
        }
        else {
            reject('Invalid username / password ')
        }
    }).catch(function() {
        reject("Please try again later")
    })
    })
}


module.exports = User