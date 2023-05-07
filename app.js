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

const computerBuilds = require('./models/computerBuild');

app.get('/builds', async (req, res) => {
    const computerBuild = await computerBuilds.find({});
    res.render('computerBuilds/index', { computerBuild });
});

app.get('/builds/new', async (req, res) => {
    computerItem = await ComputerItems.find({});
    res.render('computerBuilds/new', computerItem)
});

app.post('/builds', async(req, res) => { 
    const newBuild = new computerBuilds(req.body);
    console.log(req.body);
    
    var total = 0;
    const mobo = await ComputerItems.find({name: req.body.mobo});
    const cpu = await ComputerItems.find({name: req.body.cpu});
    const gpu = await ComputerItems.find({name: req.body.gpu});
    const memory = await ComputerItems.find({name: req.body.memory});
    const storage = await ComputerItems.find({name: req.body.storage});
    const fan = await ComputerItems.find({name: req.body.fan});
    const psu = await ComputerItems.find({name: req.body.psu});
    const housing = await ComputerItems.find({name: req.body.housing});

    total += mobo[0].price;
    total += cpu[0].price;
    total += gpu[0].price;
    total += memory[0].price;
    total += storage[0].price;
    total += fan[0].price;
    total += psu[0].price;
    total += housing[0].price;

    newBuild.price = total;
    newBuild.buildImg = housing[0].imgURL;
    await newBuild.save();

    res.redirect(`/builds/${newBuild._id}`);
});

app.get('/builds/:id', async (req, res) => {
    try {
        const computerBuild = await computerBuilds.findById(req.params.id);
        if (!computerBuild) {
            return res.status(404).send('Build not found. Please try again');
        }
        res.render('computerBuilds/show', { computerBuild });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred. Please try again.');
    }
})

app.delete('/computerBuilds/:id', async (req, res) => {
    const { id } = req.params;
    const computerBuild = await computerBuilds.findByIdAndDelete(id);
    res.redirect(`/builds`);
})

app.get('/register', (req, res) => {
    res.render('userInfo/register')
})

require("./models/userSchema");
const User = mongoose.model("UserInfo")

app.post('/register', async(req, res) => { 
    const {name, email, phone, password} = req.body;
    try {
        const oldUser = await User.findOne( { email } );
        if(oldUser){
            return res.send( {error: "User already exists with this email address."} );
        }
        newUser = new User({
            name,
            email,
            phone,
            password,
        });
        await newUser.save();
        console.log({ name, email, phone, password });
        res.redirect("/login");
    }
    catch (error){
        res.send({status: "Something went wrong. Try again."});
    }
});

app.get('/login', async (req, res) => {
    res.render('userInfo/login')
}) 

app.post('/login', async (req, res) => {
    const existingUser = await User.findById({_id: '64557547bfe0ef11be57812d'});
    const userPass = await User.findById({_id: '64557547bfe0ef11be57812d'}).password;
    console.log(req.body);
    console.log(existingUser);
    if(!existingUser){
        return res.send( {error: "User not found with this email address."} );
    }
    const result = req.body.password === userPass;
    console.log(result);
    if(result){
        if(res.status(201)){
            if(existingUser.name === 'admin'){
                res.redirect('/users/admin');
            }
            else{
                res.redirect(`/users/${_id}`);
            }

        }
        else{
            return res.send({error: "An error occurred. Please try again."});
        }
    }
    else{
        res.send({error: "Invalid password. Please input the correct password and try again."});
    }
}); 

app.get('/users/admin', (req, res) => {
    res.render('userInfo/admin');
});

app.get('/users/admin', (req, res) => {
    res.render('admin');
});

app.listen(3000, () => {
    console.log('Working 3000')
})

app.get('/cart', (req, res) => {
    res.render('shopping/cart')
})