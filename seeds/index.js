const mongoose = require('mongoose');
const ComputerItems = require('../models/computerStore');
mongoose.connect('mongodb://127.0.0.1:27017/computer-store');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
});

const components = require('./components');

const seedDB = async () => {
    try {
        await ComputerItems.deleteMany({});
        for (let comp of components) {
            const item = new ComputerItems({
                type: comp.type,
                name: comp.name,
                brand: comp.brand,
                price: comp.price,
                imgURL: comp.imgURL
            });
            await item.save();
        }
        console.log('Data seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedDB();
