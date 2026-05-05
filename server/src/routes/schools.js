const express = require('express');
const { DISTRICTS, DIVISION_OFFICES, ALL_SCHOOLS, ALL_DIVISION } = require('../lib/schools');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    districts: DISTRICTS,
    divisionOffices: DIVISION_OFFICES,
    schools: ALL_SCHOOLS,
    division: ALL_DIVISION
  });
});

module.exports = router;
