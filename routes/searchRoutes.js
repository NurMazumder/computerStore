const express = require('express');
const router = express.Router();
const ComputerItems = require('../models/computerStore'); 

router.get('/search', async (req, res) => {
    const query = req.query.q;
    try {
      const items = await ComputerItems.find({ name: new RegExp(query, 'i') });
      console.log(items);
      res.render('searchResults', { products: items });

    } catch (err) {
      console.error(err);
      res.status(500).send('An error occurred while searching for items');
    }
});

  

module.exports = router;
