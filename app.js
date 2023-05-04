const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');

mongoose.connect('mongodb://127.0.0.1:27017/computer-store');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
})

const app = express();
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const ComputerItems = require('./models/computerStore');

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/computerItems', async (req, res) => {
    const computerItem = await ComputerItems.find({});
    res.render('computerItems/index', { computerItem })
})

app.get('/computerItems/new', (req, res) => {
    res.render('computerItems/new');
})

app.post('/computerItems', async (req, res) => {
    const computerItem = new ComputerItems(req.body.computerItems);
    await computerItem.save();
    res.redirect(`/computerItems/${computerItem._id}`);
});


app.get('/computerItems/:id', async (req, res) => {
    try {
        const computerItem = await ComputerItems.findById(req.params.id);
        if (!computerItem) {
            // Handle case when the item with the specified ID is not found
            return res.status(404).send('Computer item not found');
        }
        res.render('computerItems/show', { computerItem });
    } catch (error) {
        // Handle any potential errors during the database query
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
})

app.get('/computerItems/:id/edit', async (req, res) => {
    const computerItem = await ComputerItems.findById(req.params.id);
    res.render('computerItems/edit', { computerItem });

})
app.put('/computerItems/:id', async (req, res) => {
    const { id } = req.params;
    const computerItem = await ComputerItems.findByIdAndUpdate(id, { ...req.body.computerItems });
    res.redirect(`/computerItems/${computerItem._id}`);
})
app.delete('/computerItems/:id', async (req, res) => {
    const { id } = req.params;
    const computerItem = await ComputerItems.findByIdAndDelete(id);
    res.redirect(`/computerItems`);
})

app.get('/builder', async (req, res) => {
    res.render('builder')
})

app.get('/register', (req, res) => {
    res.render('register')
})

const User = require("./models/userSchema");

app.post('/register', async(req, res) => { 
    try {
        const {email} = req.body;
        const oldUser = await User.findOne( { email } )
        if(oldUser){
            return res.send( {error: "User already exists with this email address."} );
        }
        newUser = new User(req.body);
        await newUser.save();
        console.log(req.body);
        console.log(newUser);
        res.redirect("/login");
    } 
    catch (error){
        res.send({status: "Something went wrong. Try again."});
    }
});

app.get('/login', async (req, res) => {
    res.render('login')
}) 

app.post('/login', async (req, res) => {
    res.send("Logging in...")
}) 

app.listen(3000, () => {
    console.log('Working 3000')
})

app.get('/forgot-password', (req, res) => {
    res.render('forgotPassword')
})