const {admin, db} = require('./admin')

module.exports = (req, res, next) => {
    let idToken     

    if(
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer ")
    ){
        idToken = req.headers.authorization.split("Bearer ")[1]
    }else{
        res.status(403).json({
            success: true, 
            message: "You are not authorized"
        })
    }

    admin.auth()
        .verifyIdToken((decodeToken) => {
            req.user = decodeToken
            return db  
                .collection("users")
                .where("userId", "==", req.user.uid)
                .limit(1)
                .get()
        })
        .then((data) => {
            req.user.username = data.docs[0].data().username
            req.user.imageUrl = data.docs[0].data().imageUrl
            return next()
        })
        .catch((err) => {
            return res.status(403).json({
                success: false, 
                message: err
            })
        })
}