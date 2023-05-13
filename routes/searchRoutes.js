const express = require('express');
const router = express.Router();
const ComputerItems = require('../models/computerStore'); 

router.get('/search', async (req, res) => {
    try {
        let query = req.query.q;
        let searchResult = await ComputerItems.find({name: {$regex: query, $options: 'i'}});
        res.render('searchResults', {products: searchResult});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
