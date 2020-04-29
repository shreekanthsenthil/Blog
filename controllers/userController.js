const User = require('../models/User')

exports.login = function(req, res) {
    let user = new User(req.body)
    user.login().then((result) => {
        res.send(result)
    })
    .catch((e) => {
        res.send(e)
    })
    
}

exports.register = function(req, res) {
    let user = new User(req.body)
    user.register();
    if (user.errors.length) {
        res.send(user.errors)
    }
    else {
        res.send("registered")    
    }
}

exports.home = function(req, res) {
    res.render('home-guest')
}