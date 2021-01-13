const {admin, db} = require('../util/admin')

const config = require('../config/firebase')

const {uuid} = require('uuidv4')

const firebase = require('firebase')

firebase.initializeApp(config)

const userController = {}

userController.login = (req, res) => {
    
    let errors = []

    const user = {
        email: req.body.email, 
        password: req.body.password
    }

    if(isEmpty(user.email)){
        errors.push('The email Field is empty')
    }

    
    if(isEmpty(user.password)){
        errors.push('The password Field is empty')
    }

    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    if(!user.email.match(emailRegEx)){
        errors.push('email not valid')
    }

    if(errors.length !== 0){
        return res.status(500).json({
            success: false,
            messages: errors
        })
    }else{
        firebase
            .auth()
            .signInWithEmailAndPassword(user.email, user.password)
            .then((data) => {
                return data.user.getIdToken()
            })
            .then((token) => {
                return res.status(200).json({
                    success: true,
                    token: token
                })
            })
            .catch((err) => {
                console.log(err)
                return res.status(403).json({
                    success: false, 
                    message: "Invalid credential, please try again"
                })
            })
    }
}

const isEmpty = (string) => {
    if(string.trim() === ""){
        return true
    }else{
        return false
    }
}

userController.signUp = (req, res) => {
    
    let errors = []

    const newUser = {
        email: req.body.email, 
        username: req.body.username, 
        password: req.body.password
    }

    if(isEmpty(newUser.email)){
        errors.push('The email Field is empty')
    }

    if(isEmpty(newUser.password)){
        errors.push('The password Field is empty')
    }

    if(isEmpty(newUser.username)){
        errors.push('The username Field is empty')
    }

    const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

    if(!newUser.email.match(emailRegEx)){
        errors.push('email not valid')
    }

    if(errors.length !== 0){
        return res.status(500).json({
            success: false,
            messages: errors
        })
    }

    let token
    let userId 
    db.doc(`/users/${newUser.username}`)
        .get()
        .then((doc) => {
            if(doc.exists){
                return res.status(400).json({
                    success: false,
                    message: 'Username already is taken'
                })
            }else{
                return firebase.auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
    .then((data) => {
        userId = data.user.uid
        return data.user.getIdToken()
    })
    .then((idtoken) => {
        token = idtoken
        const userCredentials = {
            email: newUser.email, 
            username: newUser.username, 
            createdAt: new Date().toISOString()
        }
        return db.doc(`/user/${newUser.username}`).set(userCredentials)
    })
    .then(() => {
        return res.status(201).json({token})
    })
    .catch((err) => {
        console.log(err)
        if(err.code  === 'auth/email-already-in-use'){
            res.status(400).json({
                success: false, 
                message: 'Email already in use'
            })
        }else{
            res.status(500).json({
                success: false, 
                message: 'Something went wrong, please try again'
            })
        }
    })
}


const deleteImage = (ImageName) => {
    const bucket = admin.storage().bucket()

    const path = `${ImageName}`

    return bucket.file(path)
        .delete()
        .then(() => {
            return 
        })
        .catch((err) => {
            return
        })
}

userController.uploadProfilePhoto = (req, res) => {
    const BusBoy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')
    const busboy = new BusBoy({headers: req.headers})

    let imageFileName
    let imageToBeUploaded = {}

    busboy.on("file", (fieldName, file, fileName, encoding, mimetype) => {
        if(mimetype !== "image/png" && mimetype !== "image/jpeg"){
            res.status(400).json({
                success: false, 
                err: "Wrong file type submited"
            })
        }

        const imageExtension = fileName.split(".")[fileName.split(".").length - 1]
        imageFileName = `${req.user.username}.${imageExtension}`
        const filePath = path.join(os.tmpdir(), imageFileName)
        imageToBeUploaded = {filePath, mimetype}
        file.pipe(fs.createWriteStream(filePath))
    })

    deleteImage(imageFileName)

    busboy.on("finish", () => {
        admin.storage()
            .bucket()
            .upload(imageToBeUploaded.filePath, {
                resumable: false, 
                metadata: {
                    metadata: {
                        contentType: imageToBeUploaded.mimetype,
                    }
                }
            })
            .then(() => {
                const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.bucketStorage}/o/${imageFileName}?alt=media`
                return db.doc(`/users/${req.user.username}`).update({imageUrl})
            })
            .then(() => {
                return res.status(200).json({
                    success: true, 
                    message: 'Image upload successfuly'
                })
            })
            .catch((err) => {
                return res.status(500).json({
                    success: false, 
                    message: err.code
                })
            })
    })
    busboy.end(req.rawBody)
}

userController.getUserDetail = (req, res) => {
    let userData = {}
    db.doc(`/users/${req.user.username}`)
        .get()
        .then((doc) => {
            if(doc.exists){
                userData.userCredentials = doc.data()
                res.status(200).json({
                    success: true, 
                    data: userData
                })
            }
            else{
                return res.status(500).json({
                    success: false, 
                    message: 'User not found'
                })
            }
        })
        .catch((err) => {
            return res.status(500).json({
                success: false, 
                message: 'Something wrong with database'
            })
        })
}

userController.updateUserDetails = (req, res) => {
    let document = db.collection("users").doc(`${req.user.username}`)

    document.update(req.body)
    .then(() => {
        res.status(200).json({
            success: true, 
            message: 'Update successfully'
        })
    })
    .catch((err) => {
        return res.status(500).json({
            success: false, 
            message: "Cant update the value"
        })
    })
}


module.exports = userController