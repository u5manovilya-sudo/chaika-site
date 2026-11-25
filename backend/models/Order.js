const { Schema, model } = require('mongoose');

const Order = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    fullName: String,
    address: String,
    email: String,
    phone: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = model('Order', Order);