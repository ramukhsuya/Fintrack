const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stocks: [{
    symbol: { type: String, required: true, uppercase: true, trim: true },
    exchange: { type: String, enum: ['NSE', 'BSE'], required: true },
    shares: { type: Number, required: true, min: 0.0001 },
    purchasePrice: { type: Number, required: true, min: 0 },
    purchaseDate: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', PortfolioSchema);
