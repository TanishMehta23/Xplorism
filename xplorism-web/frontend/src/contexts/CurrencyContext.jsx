import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CurrencyContext = createContext();

const currencySymbols = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  CHF: 'CHF',
  CNY: '¥',
};

const currencyLocales = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  JPY: 'ja-JP',
  AUD: 'en-AU',
  CAD: 'en-CA',
  SGD: 'en-SG',
  CHF: 'de-CH',
  CNY: 'zh-CN',
};

export const CurrencyProvider = ({ children }) => {
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [preferredCurrency, setPreferredCurrency] = useState('DEFAULT');

  // Load preferred currency from user settings on mount
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user?.preferences?.currency) {
          setPreferredCurrency(user.preferences.currency);
        }
      } catch (err) {
        console.error('Error parsing user data for currency preference', err);
      }
    }
  }, []);

  // Fetch Exchange Rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Check cache first
        const cachedRates = localStorage.getItem('exchangeRates');
        const cacheTime = localStorage.getItem('exchangeRatesTime');
        const ONE_HOUR = 60 * 60 * 1000;

        if (cachedRates && cacheTime && Date.now() - parseInt(cacheTime) < ONE_HOUR) {
          setRates(JSON.parse(cachedRates));
          setLoading(false);
          return;
        }

        // Fetch fresh rates (base USD)
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();

        if (data && data.rates) {
          setRates(data.rates);
          localStorage.setItem('exchangeRates', JSON.stringify(data.rates));
          localStorage.setItem('exchangeRatesTime', Date.now().toString());
        }
      } catch (err) {
        console.error('Failed to fetch exchange rates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  /**
   * Formats an amount from its source currency to the user's preferred currency
   * If preference is DEFAULT, it returns it in the source currency.
   */
  const formatCurrency = useCallback((amount, sourceCurrency) => {
    let targetCurrency = preferredCurrency === 'DEFAULT' ? sourceCurrency : preferredCurrency;
    
    let convertedAmount = Number(amount) || 0;

    // Perform conversion if target is different from source and rates are loaded
    if (targetCurrency !== sourceCurrency && Object.keys(rates).length > 0) {
      const rateFromUSDToSource = rates[sourceCurrency];
      const rateFromUSDToTarget = rates[targetCurrency];

      if (rateFromUSDToSource && rateFromUSDToTarget) {
        // Convert source to USD first, then to target
        const amountInUSD = convertedAmount / rateFromUSDToSource;
        convertedAmount = amountInUSD * rateFromUSDToTarget;
      }
    }

    const symbol = currencySymbols[targetCurrency] || targetCurrency;
    const locale = currencyLocales[targetCurrency] || 'en-US';

    return {
      amount: convertedAmount,
      symbol,
      locale,
      formatted: `${symbol}${convertedAmount.toLocaleString(locale, { maximumFractionDigits: 0 })}`,
      currencyCode: targetCurrency
    };
  }, [preferredCurrency, rates]);

  return (
    <CurrencyContext.Provider value={{ formatCurrency, preferredCurrency, setPreferredCurrency, loadingRates: loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
