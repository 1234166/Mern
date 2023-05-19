const express = require('express')
const app = express()
const session = require('express-session');
const MongoDBsession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const UserModel = require('./Models/User')

mongoose.connect('mongodb://127.0.0.1:27017/session', {
    useNewUrlParser: true,
     useUnifiedTopology: true
}).then(()=> console.log('connected')).catch((err)=> console.log(err));


const store = new MongoDBsession({
    uri: 'mongodb://127.0.0.1:27017/session',
    collection: 'session'
})

app.set('view engine', 'ejs' )
app.use(express.urlencoded({extended: true}))

app.use(session({
    secret: '1234-567-89',
    resave: false,
    saveUninitialized: false,
    store: store
}))

const isAuth = (req,res,next)=>{
   if(req.session.isAuth){
    next()
   }else {
    res.redirect('/login')
   }
}


app.get('/session', (req,res)=>{
    req.session.isAuth = true;
    console.log(req.session)
    console.log(req.session.id)
    res.send('Hello')
})

app.get('/', (req,res)=>{
    res.render('landing')
})

app.get('/login', (req,res)=>{
    res.render('login')
})

app.post('/login', async (req,res)=>{
     const {email, password} = req.body
     let user = await UserModel.findOne({email})
     if(!user){
        return res.redirect('/login')
     }
     const isMatch = await bcrypt.compare(password, user.password) 
     if(!isMatch){
        return res.redirect('/login')
     }
     req.session.isAuth = true
     res.redirect('/dashboard')
})

app.get('/register', (req,res)=>{
    res.render('register')
})
app.post('/register', async (req,res)=>{
    const {username, email, password} = req.body;
    let user = await UserModel.findOne({email})
    if(user){
        return res.redirect('/register')
    }
    const hashedPSW = await bcrypt.hash(password, 12)
    user = new UserModel({
        username,
        email,
        password: hashedPSW
    })

    await user.save();
    res.redirect('/login')

})

app.get('/dashboard', isAuth,(req,res)=>{
    res.render('dashboard')
})

app.post('/logout', (req,res)=>{
    req.session.destroy((err)=>{
        if(err) throw err;
        res.redirect('/')
    })
})
const PORT = 3000 || PROCESS.ENV.PORT
app.listen(PORT, ()=>{
    console.log('Server is running on port 3000')
})