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
const ComputerBuilds = require('./models/ComputerBuild');
const Cart = require('./models/cartModel');
const passport = require('passport');
const LocalStrategy = require('passport-local'); // <-- here
const User = require('./models/user');
const { isLoggedIn } = require('./middleware');
const user = require('./models/user');
const Order = require('./models/orderModel');


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


app.get('/', async (req, res) => {
    try {
        // Get the latest computer builds from the database
        const computerBuild = await ComputerBuilds.find().populate('reviews');

        // Sort the computer builds by average rating in descending order
        const topBuilds = computerBuild.sort((a, b) => {
            const aAvgRating = a.reviews.reduce((acc, cur) => acc + cur.rating, 0) / a.reviews.length;
            const bAvgRating = b.reviews.reduce((acc, cur) => acc + cur.rating, 0) / b.reviews.length;
            return bAvgRating - aAvgRating;
        });

        // Render the home page with the latest computer builds
        res.render('home', { computerBuild: topBuilds });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});


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
    const filteredBody = filterBadWords(review.body, req.user); // Filter bad words in the comment
    if (!req.isAuthenticated() && filteredBody !== review.body) {
        // User is not logged in and review has bad words, do not save
        req.flash('error', 'You must be logged in to post a review with bad words.');
        return res.redirect(`/computerItems/${computerItem._id}`);
    }
    else if (filteredBody !== review.body) {
        req.flash('error', 'Bad language detected. You have been issued warning(s).');
    }
    review.body = filteredBody;
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


app.post('/computerItems/:id/computerBuild', catchAsync(async (req, res) => {
    const computerItem = await ComputerItems.findById(req.params.id);
    const review = new computerBuilds(req.body.review);
    if (req.isAuthenticated()) {
        review.author = req.user._id;
    } else {
        review.author = null;
    }

    await computerItem.save();
    res.redirect(`/computerItems`);
}));

//User register/Login
app.get('/register', (req, res) => {
    res.render('users/register');
})
app.post('/register', catchAsync(async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);

        const userCart = new Cart({ userID: user._id }); // create user cart
        await userCart.save();

        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome! We have received your application. Please wait for the results.');
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
    req.flash('success', 'Welcome back!');
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

//Account Management
app.get('/manage', isLoggedIn, catchAsync(async (req, res) => {
    const users = await User.find({});
    res.render('Users/manage', { users })
}))


app.get('/manage/:id', isLoggedIn, catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    res.render('Users/edit', { user });
}));

app.put('/manage/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { ...req.body });
    await user.save();
    req.flash('success', 'Successfully updated');
    res.redirect('/manage');
}));

app.get('/memo', isLoggedIn, catchAsync(async (req, res) => {
    const users = await User.find({});
    res.render('Users/memo', { users })
}))

app.get('/customer', isLoggedIn, catchAsync(async (req, res) => {
    const users = await User.find({});
    res.render('Users/customer', { users })
}))

app.delete('/customer/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.redirect('/customer');
}));



app.get('/account/:id', isLoggedIn, catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    res.render('Users/account', { user });
}));

app.put('/account/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    const newAmount = parseInt(req.body.user.wallet);
    const updatedWallet = user.wallet + newAmount;
    user.wallet = updatedWallet;
    await user.save();
    req.flash('success', 'Successfully updated');
    res.redirect(`/account/${id}`);
}));


app.get('/employee', isLoggedIn, catchAsync(async (req, res) => {
    const users = await User.find({});
    res.render('Users/employee', { users })
}))


app.delete('/employee/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.redirect('/employee');
}));

// PC builder 

app.get('/builds', async (req, res) => {
    const computerBuild = await ComputerBuilds.find({});
    res.render('computerBuilds/index', { computerBuild });
});

app.get('/builds/new', isLoggedIn, async (req, res) => {
    const computerItem = await ComputerItems.find({});
    res.render('computerBuilds/new', { computerItem });
});

app.post('/builds', isLoggedIn, async (req, res) => {
    const newBuild = new ComputerBuilds(req.body);
    console.log(req.body);

    var total = 0; // Find all items and their prices to calculate build price
    const mobo = await ComputerItems.find({ name: req.body.mobo });
    const cpu = await ComputerItems.find({ name: req.body.cpu });
    const gpu = await ComputerItems.find({ name: req.body.gpu });
    const memory = await ComputerItems.find({ name: req.body.memory });
    const storage = await ComputerItems.find({ name: req.body.storage });
    const fan = await ComputerItems.find({ name: req.body.fan });
    const psu = await ComputerItems.find({ name: req.body.psu });
    const housing = await ComputerItems.find({ name: req.body.housing });

    total += mobo[0].price + cpu[0].price;
    total += gpu[0].price;
    total += memory[0].price;
    total += storage[0].price;
    total += fan[0].price;
    total += psu[0].price;
    total += housing[0].price;

    newBuild.price = total;
    newBuild.imgURL = housing[0].imgURL; // Use case as build image
    if (req.isAuthenticated()) {
        newBuild.author = req.user.username;
    } else {
        newBuild.author = null;
    }
    await newBuild.save();
    req.flash('success', 'Successfully Created');

    res.redirect(`/builds/${newBuild._id}`);
});

// Reviews for PC builds

app.get('/builds/:id', async (req, res) => {
    try {
        const computerBuild = await ComputerBuilds.findById(req.params.id).populate({
            path: 'reviews',
            populate: {
                path: 'author'
            }
        });
        if (!computerBuild) {
            return res.status(404).send('Build not found. Please try again');
        }
        res.render('computerBuilds/show', { computerBuild });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred. Please try again.');
    }
})

app.delete('/builds/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    await ComputerBuilds.findByIdAndDelete(id);
    res.redirect(`/builds`);
})

app.post('/builds/:id/reviews', catchAsync(async (req, res) => {
    const computerBuild = await ComputerBuilds.findById(req.params.id);
    const review = new Review(req.body.review);
    if (req.isAuthenticated()) {
        review.author = req.user._id;
    } else {
        review.author = null;
    }
    const filteredBody = filterBadWords(review.body, req.user); // Filter bad words in the comment
    if (!req.isAuthenticated() && filteredBody !== review.body) {
        // User is not logged in and review has bad words, do not save
        req.flash('error', 'You must be logged in to post a review with bad words.');
        return res.redirect(`/builds/${computerBuild._id}`);
    }
    else if (filteredBody !== review.body) {
        req.flash('error', 'Bad language detected. You have been issued warning(s).');
    }
    review.body = filteredBody;
    computerBuild.reviews.push(review);
    await review.save();
    await computerBuild.save();
    res.redirect(`/builds/${computerBuild._id}`);
}));


app.delete('/builds/:id/reviews/:reviewId', isLoggedIn, catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await ComputerBuilds.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    res.redirect(`/builds/${id}`);
}))


// Cart

app.get('/cart', isLoggedIn, catchAsync(async (req, res) => {
    // get actual store objects from IDs in cart object
    const userCart = await Cart.findOne({ userID: req.user._id }); // find cart of user
    const itemList = [];
    for (let i = 0; i < userCart.items.length; i++) {
        var item;
        if (await ComputerItems.findById(userCart.items[i]) !== null) { // item is a store product
            item = await ComputerItems.findById(userCart.items[i]);
        }
        else if (await ComputerBuilds.findById(userCart.items[i]) !== null) { // item is a build
            item = await ComputerBuilds.findById(userCart.items[i]);
        }
        itemList.push(item);
    }

    res.render('Order/cart', { itemList });
}));

app.post('/cart/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    console.log(id);

    const userCart = await Cart.findOne({ userID: req.user._id }); // find cart of user
    var item;
    if (await ComputerItems.findById(id) !== null) { // item is a store product
        item = await ComputerItems.findById(id);
    }
    else if (await ComputerBuilds.findById(id) !== null) { // item is a build
        item = await ComputerBuilds.findById(id);
    }
    console.log(item.price);
    console.log("Before:", userCart.items);
    for (let i = 0; i < quantity; i++) { // add desired quantity of item
        userCart.items.push(id); // convert to string
        userCart.total += item.price;
    }
    await userCart.save();

    req.flash('success', 'Successfully added item(s) to cart.');
    console.log("After:", userCart.items);
    console.log(userCart.total);
    await userCart.save();
    res.redirect('/cart');
}));

app.put('/cart/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;

    const userCart = await Cart.findOne({ userID: req.user._id });
    const itemIndex = userCart.items.indexOf(id);
    console.log("Item found at index", itemIndex);

    var item;
    if (await ComputerItems.findById(id) !== null) { // item is a store product
        item = await ComputerItems.findById(id);
    }
    else if (await ComputerBuilds.findById(id) !== null) { // item is a build
        item = await ComputerBuilds.findById(id);
    }
    console.log(item);

    console.log("Cart before:", userCart.items)
    userCart.items.splice(itemIndex, 1);
    console.log("Cart after:", userCart.items);
    console.log("Total before:", userCart.total);
    userCart.total -= item.price;
    console.log("Total after:", userCart.total);
    await userCart.save();

    req.flash('success', 'Successfully updated cart.');
    res.redirect(`/cart`);
}));

app.get('/checkout', isLoggedIn, catchAsync(async (req, res) => {
    const userCart = await Cart.findOne({ userID: req.user._id });
    if (userCart.items.length < 1) {
        req.flash('error', 'Your cart is empty!');
        return res.redirect('/cart');
    }
    const itemList = [];
    for (let i = 0; i < userCart.items.length; i++) {
        var item;
        if (await ComputerItems.findById(userCart.items[i]) !== null) { // item is a store product
            item = await ComputerItems.findById(userCart.items[i]);
        }
        else if (await ComputerBuilds.findById(userCart.items[i]) !== null) { // item is a build
            item = await ComputerBuilds.findById(userCart.items[i]);
        }
        itemList.push(item);
    }
    res.render('Order/checkout', { itemList });
}));


app.post('/checkout', isLoggedIn, catchAsync(async (req, res) => {
    const userCart = await Cart.findOne({ userID: req.user._id });
    if (req.user.wallet < userCart.total) {
        req.user.warn++;
        await req.user.save()
        req.flash('error', 'Insufficient balance. Please add more money before placing the order. You have been issued a warning.');
        return res.redirect(`/account/${req.user._id}`);
    }
    req.user.wallet -= userCart.total;
    await req.user.save();
    const orderAddress = []; // order delivery address
    orderAddress.push(req.body.name, req.body.address, req.body.city, req.body.state, String(req.body.zip));

    const itemList = [];
    for (let itemID of userCart.items) {
        var item;
        if (await ComputerItems.findById(itemID) !== null) { // item is a store product
            item = await ComputerItems.findById(itemID);
        }
        else if (await ComputerBuilds.findById(itemID) !== null) { // item is a build
            item = await ComputerBuilds.findById(itemID);
        }
        console.log(item);
        itemList.push(item);
    }
    console.log(itemList);

    const newOrder = new Order({
        address: orderAddress,
        order: itemList,
        total: userCart.total
    })
    console.log(newOrder);
    await newOrder.save();

    userCart.total = 0; // reset user's cart
    userCart.items = [];
    await userCart.save();

    res.redirect(`/order/${newOrder._id}`);
}));


app.get('/order/:id', isLoggedIn, catchAsync(async (req, res) => {
    const { id } = req.params;
    console.log({ id });
    const thisOrder = await Order.findById(id);
    console.log(thisOrder);

    const orderBuilds = [];
    for(let itemID of thisOrder.order){
        var item;
        if(await ComputerBuilds.findById(itemID) !== null){ // item is a build
            item = await ComputerBuilds.findById(itemID);
        }
        console.log(item);
        orderBuilds.push(item);
    }
    
    res.render('Order/order', { thisOrder, orderBuilds });
}));

app.get('/contact', (req, res) => {
    res.render('contact');
});

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
