const {admin, db} = require('../util/admin')

const config = require('../config/firebase')

const todoController = {}

todoController.getAllTodos = (req, res) => {
    db.collection("todo")
        .where("username", "==", req.user.username)
        .orderBy("createdAt", "desc")
        .get()
        .then((data) => {

            res.json({
                data: data
            })

            let todos = []

            data.forEach((doc) => {
                todos.push({
                    todoId: doc.id, 
                    title: doc.data().title,
                    desc: doc.data().desc, 
                    createdAt: doc.data().createdAt
                })
            })

            return res.status(200).json({
                success: true, 
                list: todos
            })
        })
        .catch((err) => {
            console.log(err)
            return res.status(500).json({
                success: false, 
                message: err
            })
        })
}

todoController.postOneTodo = (req, res) => {
   
    let errors = []

    if(req.body.desc.trim() === ""){
        errors.push('Description must not be empty')
    }

    if(req.body.title.trim() === ""){
        errors.push('Title must not be empty')
    }

    if(errors.length !== 0){
        return res.status(400).json({
            success: false, 
            errors: "Something went wrong"
        })
    }

    const newTodo = {
        username: req.user.username, 
        title: req.body.title, 
        desc: req.body.desc, 
        createdAt: new Date().toISOString()
    }

    db.collection("todo")
        .add(newTodo)
        .then((doc) => {
            const responseTodo = newTodo
            responseTodo.id = doc.id
            return res.status(200).json({
                success: true, 
                todo: responseTodo
            })
        })
        .catch((err) => {
            return res.status(500).json({
                success: false, 
                message: 'Something went wrong'
            })
        })
}

todoController.editTodo = (req, res) => {
    if(req.body.todoId || req.body.createdAt){
        res.status(403).json({
            success: false, 
            message: "You are not allowed to edit this"
        })
    }

    let document = db.collection("todo")
        .doc(`${req.params.todoId}`)

    document.update(req.body)
        .then(() => {
            return res.status(200).json({
                success: true, 
                message: "Updated Successfully"
            })
        })
        .catch((err) => {
            return res.status(500).json({
                success: false,
                message: 'Something went wrong'
            })
        })

}

todoController.deleteTodo = (req, res) => {
    const document = db.doc(`/todo/${req.params.todoId}`)

    document.get()
        .then((doc) => {
            if(!doc.exists){
                return res.status(403).json({
                    success: false, 
                    message: 'Todo Doesnt exist'
                })
            }

            if(doc.data().username !== req.user.username){
                return res.status(403).json({
                    success: false, 
                    message: 'UnAuthorized'
                })
            }

            return document.delete()
        })
        .then(() => {
            return res.status(200).json({
                success: true, 
                message: 'Delete successfull'
            })
        })
        .catch((err) => {
            return res.status(500).json({
                success: false, 
                message: 'Something went wrong'
            })
        })
}

module.exports = todoController