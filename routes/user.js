const auth = require('../util/auth')
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')

router.use(bodyParser.urlencoded({extended: true}))
router.use(bodyParser.json())

const user = require('../controller/usersController')

router.post("/login", user.login)
router.post('/signup', user.signUp)
router.post('/user/image', auth, user.uploadProfilePhoto)
router.get('/user', auth, user.getUserDetail)
router.post('/user', auth, user.updateUserDetails)

module.exports = router
