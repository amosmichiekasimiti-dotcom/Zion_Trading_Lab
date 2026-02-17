// script.js - The Brain of Zion Trading Lab
const app_id = 1089; // Default Test ID
const ws = new WebSocket('wss://ws.binaryws.com/websockets/v3?app_id=' + app_id);

ws.onopen = function(evt) {
    console.log("Connection Established with Deriv Server");
    // Request all symbols with the 'brief' command
    ws.send(JSON.stringify({
        "active_symbols": "brief",
        "product_type": "basic"
    }));
};

ws.onmessage = function(msg) {
    const data = JSON.parse(msg.data);
    
    if (data.active_symbols) {
        // Clear your current display before updating
        document.getElementById('market-list').innerHTML = '';

        data.active_symbols.forEach(symbol => {
            let category = "Other";

            // LOGIC: Classification based on Deriv Market types
            if (symbol.market === 'synthetic_index') {
                category = "Derived Indices";
            } else if (symbol.market === 'forex') {
                category = "4X (Forex)";
            } else if (symbol.market === 'cryptocurrency') {
                category = "Cryptocurrency";
            } else if (symbol.market === 'indices' || symbol.market === 'stocks') {
                category = "Stock Indices";
            }

            // Create a professional row for your website
            const row = `
                <tr>
                    <td><strong>${category}</strong></td>
                    <td>${symbol.display_name}</td>
                    <td>${symbol.symbol}</td>
                    <td style="color: ${symbol.exchange_is_open ? 'green' : 'red'}">
                        ${symbol.exchange_is_open ? '● Open' : '○ Closed'}
                    </td>
                </tr>`;
            
            document.getElementById('market-list').innerHTML += row;
        });
    }
};
