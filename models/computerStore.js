const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

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
        // required: true
    },
    price: {
        type: Number,
        // required: true
    },
    imgURL: {
        type: String,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

computerItemsSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})


module.exports = mongoose.model('ComputerItems', computerItemsSchema);
