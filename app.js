const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const ejsMate = require('ejs-mate');
const methodOverride = require('method-override');
const Review = require('./models/review');
const filterBadWords = require('./utils/filterBadWords');
const session = require('express-session');
const flash = require('connect-flash');
const ComputerItems = require('./models/computerStore');
const passport = require('passport');
const LocalStrategy = require('passport-local'); // <-- here
const User = require('./models/user');
const { isLoggedIn } = require('./middleware');


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
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))
app.use(flash());
// user authenitication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); // <-- here


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//flash 
app.use((req, res, next) => {
    console.log(req.session)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});


app.get('/', (req, res) => {
    res.render('home')
})

// computer Items

app.get('/computerItems', catchAsync(async (req, res) => {
    const computerItems = await ComputerItems.find({});
    res.render('computerItems/index', { computerItems })
}))

app.get('/computerItems/new', isLoggedIn, (req, res) => {
    res.render('computerItems/new');
})

app.post('/computerItems', catchAsync(async (req, res) => {
    const computerItem = new ComputerItems(req.body.computerItems);
    await computerItem.save();
    req.flash('success', 'Successfully Created');
    res.redirect(`/computerItems/${computerItem._id}`);
}));


app.get('/computerItems/:id', async (req, res) => {
    const computerItem = await ComputerItems.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    });
    res.render('computerItems/show', { computerItem });

});

app.get('/computerItems/:id/edit', isLoggedIn, catchAsync(async (req, res) => {
    const computerItem = await ComputerItems.findById(req.params.id);
    res.render('computerItems/edit', { computerItem });

}));

app.put('/computerItems/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    const computerItem = await ComputerItems.findByIdAndUpdate(id, { ...req.body.computerItems });
    req.flash('success', 'Successfully updated');
    res.redirect(`/computerItems/${computerItem._id}`);
}));

app.delete('/computerItems/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const computerItem = await ComputerItems.findByIdAndDelete(id);
    res.redirect(`/computerItems`);
}));



// review for compter Items

app.post('/computerItems/:id/reviews', catchAsync(async (req, res) => {
    const computerItem = await ComputerItems.findById(req.params.id);
    const review = new Review(req.body.review);
    if (req.isAuthenticated()) {
        review.author = req.user._id;
    } else {
        review.author = null;
    }
    review.body = filterBadWords(review.body); // Filter bad words in the comment
    computerItem.reviews.push(review);
    await review.save();
    await computerItem.save();
    res.redirect(`/computerItems/${computerItem._id}`);
}));


app.delete('/computerItems/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await ComputerItems.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/computerItems/${id}`);
}))


//User register/Login
app.get('/register', (req, res) => {
    res.render('users/register');
})
app.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome!');
            res.redirect('/computerItems');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }

}));

app.get('/login', (req, res) => {
    res.render('users/login');
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req, res) => {
    req.flash('success', 'welcome back!');
    // const redirectUrl = req.session.returnTo || '/computerItems';
    // delete req.session.returnTo;
    // res.redirect(redirectUrl);
    res.redirect('/computerItems');
});

app.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/computerItems');
    });
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
    req.flash('success', 'Successfully Created');

    res.redirect(`/builds/${newBuild._id}`);
});

app.get('/builds/:id', async (req, res) => {
    try {
        const computerBuild = await computerBuilds.findById(req.params.id).populate({
            path: 'reviews',
            populate: {
                path: 'author'
            }
        });;
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

app.post('/builds/:id/reviews', catchAsync(async (req, res) => {
    const computerBuild = await computerBuilds.findById(req.params.id);
    const review = new Review(req.body.review);
    if (req.isAuthenticated()) {
        review.author = req.user._id;
    } else {
        review.author = null;
    }
    review.body = filterBadWords(review.body); // Filter bad words in the comment
    computerBuild.reviews.push(review);
    await review.save();
    await computerBuild.save();
    res.redirect(`/builds/${computerBuild._id}`);
}));


app.delete('/builds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await ComputerBuilds.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/builds/${id}`);
}))


app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log('Working 3000')
})
