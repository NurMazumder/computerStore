const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const computerItemsSchema = new Schema({
    type: {
        type: String,
        // required: true
    },
    name: {
        type: String,
        // required: true
    },
    brand: {
        type: String,
        //required: true
    },
    price: {
        type: Number,
        //required: true
    },
    imgURL: {
        type: String,
    }
});

module.exports = mongoose.model('ComputerItems', computerItemsSchema);