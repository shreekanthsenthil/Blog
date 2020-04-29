const express = require('express')
const app = express()

app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

const router = require('./router');

app.use('/', router)

module.exports = app;