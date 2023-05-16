const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartSchema = new Schema({
    userID:{
        type: String,
        require: true
    },
    total: {
        type: Number,
        default: 0
    },
    items: [{
        type: mongoose.Types.ObjectId,
        default: null
    }],
    containsBuild: [{
        type: mongoose.Types.ObjectId,
        default: null
    }],
    couponsApplied: Number
});

module.exports = mongoose.model('Cart', cartSchema);