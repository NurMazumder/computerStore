const mongoose = require('mongoose');
const ComputerItems = require('../models/computerStore');
const ComputerBuilds = require('../models/computerBuild');
mongoose.connect('mongodb://127.0.0.1:27017/computer-store');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database Connected");
});

const components = require('./components');
const premades = require('./premades');

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
        await ComputerBuilds.deleteMany({});
        for (let build of premades) {
            const item = new ComputerBuilds({
                mobo: build.mobo,
                cpu: build.cpu,
                gpu: build.gpu,
                memory: build.memory,
                storage: build.storage,
                fan: build.fan,
                psu: build.psu,
                housing: build.housing,
                price: build.price,
                imgURL: build.imgURL,
                name: build.name,
                category: build.category,
                author: build.author
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
