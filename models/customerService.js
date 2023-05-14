const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
    email: {type: String, required: true},
    order: String,
    title: {type: String, required: true},
    message: {type: String, required: true},
});

module.exports = mongoose.model('customerService', serviceSchema);