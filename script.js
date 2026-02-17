ws.onmessage = function(msg) {
    const data = JSON.parse(msg.data);
    if (data.active_symbols) {
        data.active_symbols.forEach(symbol => {
            // Grouping by the official "market" property
            if (symbol.market === 'synthetic_index') {
                console.log("Adding to Derived section: " + symbol.display_name);
            } else if (symbol.market === 'forex') {
                console.log("Adding to Forex section: " + symbol.display_name);
            } else if (symbol.market === 'indices') {
                console.log("Adding to Stock Indices section: " + symbol.display_name);
            } else if (symbol.market === 'cryptocurrency') {
                console.log("Adding to Crypto section: " + symbol.display_name);
            }
        });
    }
};
