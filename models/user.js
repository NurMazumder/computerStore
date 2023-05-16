const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String
    },
    role: {
        type: String,
        default: 'applicant'
    },
    warn: {
        type: Number
    },
    compliment: {
        type: Number
    },
    status: {
        type: String
    },
    wallet: {
        type: Number,
        default: '0'
    },
    paygrade: {
        type: Number
    },
    coupons: {
        type: Number
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
