const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    address:[{
        type: String,
        required: true
    }],
    order: [{
        type: mongoose.SchemaTypes.ObjectId,
        required: true
    }],
    total: {
        type: Number,
        required: true
    },
});

module.exports = mongoose.model('Order', orderSchema);