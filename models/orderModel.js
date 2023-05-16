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
    containsBuild: [{
        type: mongoose.SchemaTypes.ObjectId,
    }],
    total: {
        type: Number,
        required: true
    },
    placed:{
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Order', orderSchema);