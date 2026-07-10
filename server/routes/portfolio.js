const express = require('express');
const YahooFinance = require('yahoo-finance2').default;
const Portfolio = require('../models/Portfolio');

const router = express.Router();
const yahooFinance = new YahooFinance();

const requireUser = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Not authenticated' });
  next();
};

const yahooSymbol = (symbol, exchange) => `${symbol.toUpperCase()}.${exchange === 'NSE' ? 'NS' : 'BO'}`;
const allowedRanges = { '1m': 31, '3m': 92, '6m': 183, '1y': 365, '5y': 1826 };

// Get holdings together with their latest available market prices.
router.get('/', requireUser, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.id });
    const stocks = portfolio?.stocks || [];
    const holdings = await Promise.all(stocks.map(async (stock) => {
      const holding = stock.toObject();
      try {
        const quote = await yahooFinance.quote(yahooSymbol(stock.symbol, stock.exchange));
        const currentPrice = quote.regularMarketPrice;
        const totalInvestment = stock.shares * stock.purchasePrice;
        const currentValue = stock.shares * currentPrice;
        return {
          ...holding,
          name: quote.longName || quote.shortName || stock.symbol,
          currentPrice,
          currency: quote.currency || 'INR',
          regularMarketChange: quote.regularMarketChange || 0,
          regularMarketChangePercent: quote.regularMarketChangePercent || 0,
          totalInvestment,
          currentValue,
          gain: currentValue - totalInvestment,
          gainPercentage: totalInvestment ? ((currentValue - totalInvestment) / totalInvestment) * 100 : 0
        };
      } catch (error) {
        return { ...holding, quoteError: 'Live price is temporarily unavailable.' };
      }
    }));
    res.json({ success: true, data: holdings });
  } catch (error) {
    console.error('Portfolio load error:', error);
    res.status(500).json({ success: false, error: 'Could not load portfolio' });
  }
});

router.post('/stocks', requireUser, async (req, res) => {
  try {
    const { symbol, exchange, shares, purchasePrice, purchaseDate } = req.body;
    if (!symbol || !['NSE', 'BSE'].includes(exchange) || Number(shares) <= 0 || Number(purchasePrice) < 0) {
      return res.status(400).json({ success: false, error: 'Enter a valid symbol, exchange, shares, and purchase price.' });
    }

    // Validate the symbol before saving the holding.
    await yahooFinance.quote(yahooSymbol(symbol.trim(), exchange));
    const portfolio = await Portfolio.findOneAndUpdate(
      { user: req.user.id },
      { $setOnInsert: { user: req.user.id }, $push: { stocks: { symbol, exchange, shares, purchasePrice, purchaseDate } } },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json({ success: true, data: portfolio.stocks[portfolio.stocks.length - 1] });
  } catch (error) {
    console.error('Portfolio add error:', error);
    res.status(400).json({ success: false, error: 'Stock symbol could not be verified. Use the NSE/BSE ticker without its suffix.' });
  }
});

router.delete('/stocks/:stockId', requireUser, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { stocks: { _id: req.params.stockId } } },
      { new: true }
    );
    if (!portfolio) return res.status(404).json({ success: false, error: 'Portfolio not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not remove holding' });
  }
});

// Stock details are restricted to stocks in the current user's own portfolio.
router.get('/details/:symbol', requireUser, async (req, res) => {
  try {
    const exchange = req.query.exchange;
    const range = allowedRanges[req.query.range] ? req.query.range : '6m';
    if (!['NSE', 'BSE'].includes(exchange)) return res.status(400).json({ success: false, error: 'Invalid exchange' });
    const portfolio = await Portfolio.findOne({ user: req.user.id });
    const stock = portfolio?.stocks.find(item => item.symbol === req.params.symbol.toUpperCase() && item.exchange === exchange);
    if (!stock) return res.status(404).json({ success: false, error: 'Holding not found' });

    const symbol = yahooSymbol(stock.symbol, stock.exchange);
    const period1 = new Date(Date.now() - allowedRanges[range] * 24 * 60 * 60 * 1000);
    const [quote, chart] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.chart(symbol, { period1, interval: '1d' })
    ]);
    res.json({ success: true, data: { quote, historical: chart.quotes || [] } });
  } catch (error) {
    console.error('Stock details error:', error);
    res.status(502).json({ success: false, error: 'Live market data is temporarily unavailable.' });
  }
});

module.exports = router;
