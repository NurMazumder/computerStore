const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const computerBuildSchema = new Schema({
    mobo: {
        type: String,
        //required: true
    },
    cpu: {
        type: String,
        //required: true
    },
    gpu: {
        type: String,
        //required: true
    },
    memory: {
        type: String,
        //required: true
    },
    storage: {
        type: String,
        //required: true
    },
    fan: {
        type: String,
        //required: true
    },
    psu: {
        type: String,
        //required: true
    },
    housing: {
        type: String,
        //required: true
    },
    price: {
        type: Number,
        default: 0
    },
    buildImg: {
        type: String,
        default: ''
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

computerBuildSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('computerBuilds', computerBuildSchema);