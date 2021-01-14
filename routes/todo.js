const auth = require('../util/auth')
const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const todoController = require('../controller/todoController')

router.use(bodyParser.urlencoded({extended: true}))
router.use(bodyParser.json())

router.get('/', auth, todoController.getAllTodos)
router.post('/', auth, todoController.postOneTodo)
router.put('/:todoId', auth, todoController.editTodo)
router.delete('/:todoId', auth, todoController.deleteTodo)

module.exports = router